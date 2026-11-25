import { CONFIG } from "./config.js";
import { store } from "./store.js";
import { icons, navIcons, statIcons, logo, robot } from "./icons.js";
import { categorize, CATEGORIES, regDomain } from "./categorizer.js";
import * as gmail from "./gmail.js";
import { createDemo } from "./demo-data.js";

/* ───────── helpers ───────── */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const D = 864e5;
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return +d; };
const time12 = t => new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
function fmtList(ts) {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / D), d = new Date(ts);
  if (diff <= 0) return time12(ts);
  if (diff === 1) return "Yesterday";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", sameYear ? { weekday: "short", month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
}
const fmtFull = ts => `${time12(ts)}, ${new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
const has = (m, l) => m.labels.includes(l);
const isUnread = m => has(m, "UNREAD");
const isStarred = m => has(m, "STARRED");
const isSmall = () => matchMedia("(max-width:1100px)").matches;

/* ───────── state ───────── */
const prefs = { name: "Naveen", poll: 30000, max: 50, theme: "", logos: true, ...store.get("prefs", {}) };
const S = {
  mode: "demo",            // demo | gmail
  connected: false,        // gmail token valid
  nav: "dashboard", view: "inbox", cat: "All", sort: "newest",
  query: "", searchIds: null,
  msgs: new Map(), checked: new Set(), selected: null,
  user: { email: "" }, lastSync: null, syncing: false, loaded: { spam: false, archive: false },
  snoozed: store.get("snoozed", {}), expanded: false
};
let backend = createDemo();
let pollTimer = null;
let demoBackend = backend;

const navView = () => S.nav === "spam" ? "spam" : S.nav === "archive" ? "archive" : "inbox";
const VIEW = {
  inbox: m => has(m, "INBOX") && !has(m, "SPAM") && !has(m, "TRASH"),
  spam: m => has(m, "SPAM") && !has(m, "TRASH"),
  archive: m => !["INBOX", "SPAM", "TRASH", "SENT", "DRAFT"].some(l => has(m, l))
};
const snoozed = m => (S.snoozed[m.id] || 0) > Date.now();
const inboxMsgs = () => [...S.msgs.values()].filter(m => VIEW.inbox(m) && !snoozed(m));

/* ───────── theme ───────── */
function applyTheme() {
  const dark = prefs.theme ? prefs.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("#theme").innerHTML = dark ? icons.sun : icons.moon;
}
const savePrefs = () => store.set("prefs", prefs);

/* ───────── toast / menu ───────── */
let toastTimer;
function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3800);
}
let openMenu = null;
function closeMenu() { openMenu?.remove(); openMenu = null; }
function showMenu(anchor, items, { align = "left" } = {}) {
  closeMenu();
  const el = document.createElement("div"); el.className = "menu"; el.setAttribute("role", "menu");
  el.innerHTML = items.map((it, i) => it.sep ? "<hr>" : it.cap ? `<div class="cap">${esc(it.cap)}</div>` : `<button role="menuitem" data-i="${i}" class="${it.on ? "on" : ""}">${it.label}</button>`).join("");
  document.body.append(el); openMenu = el;
  const r = anchor.getBoundingClientRect();
  el.style.top = Math.min(r.bottom + 6, innerHeight - el.offsetHeight - 8) + "px";
  el.style.left = Math.max(8, Math.min(align === "right" ? r.right - el.offsetWidth : r.left, innerWidth - el.offsetWidth - 8)) + "px";
  el.onclick = e => { const b = e.target.closest("button"); if (b) { closeMenu(); items[b.dataset.i].run(); } };
  setTimeout(() => document.addEventListener("click", closeMenu, { once: true }), 0);
}

/* ───────── data ingest ───────── */
function ingest(list) {
  const rules = store.get("rules", {}), ov = store.get("overrides", {});
  for (const m of list) {
    m.cat = categorize(m, rules, ov);
    const old = S.msgs.get(m.id);
    S.msgs.set(m.id, old && old !== m ? Object.assign(old, m) : m);
  }
}
const recategorizeAll = () => { const r = store.get("rules", {}), o = store.get("overrides", {}); S.msgs.forEach(m => m.cat = categorize(m, r, o)); };

/* ───────── sync ───────── */
async function sync({ manual = false } = {}) {
  if (S.syncing || (S.mode === "gmail" && !S.connected)) return;
  S.syncing = true; $("#refresh").classList.add("spin");
  try {
    const hadMail = S.msgs.size > 0, before = new Set(S.msgs.keys());
    const inbox = await backend.load("inbox", { max: prefs.max });
    const ids = new Set(inbox.map(m => m.id));
    for (const [id, m] of S.msgs) if (has(m, "INBOX") && !ids.has(id)) S.msgs.delete(id);
    ingest(inbox);
    if (S.view === "spam" || S.view === "archive") await loadKind(S.view);
    S.lastSync = Date.now();

    const fresh = inbox.filter(m => !before.has(m.id) && isUnread(m));
    if (hadMail && fresh.length)
      toast(`${fresh.length} new email${fresh.length > 1 ? "s" : ""} · ${[...new Set(fresh.map(m => m.cat))].join(", ")}`);
    else if (manual) toast("Inbox is up to date.");
    if (S.mode === "gmail") cacheInbox(inbox);
  } catch (e) { toast(e.message || "Sync failed."); }
  finally { S.syncing = false; $("#refresh").classList.remove("spin"); renderAll(); }
}
async function loadKind(kind) {
  try { ingest(await backend.load(kind, { max: 40 })); S.loaded[kind] = true; }
  catch (e) { toast(e.message); }
}
function restartTimer() {
  clearInterval(pollTimer);
  pollTimer = setInterval(() => { if (!document.hidden) sync(); }, prefs.poll);
}
const strip = m => ({ id: m.id, threadId: m.threadId, labels: m.labels, fromName: m.fromName, fromEmail: m.fromEmail, to: m.to, subject: m.subject, snippet: m.snippet, date: m.date });
function cacheInbox(list) { store.set("cache", { email: S.user.email, msgs: list.slice(0, 100).map(strip) }); }

/* ───────── connect / disconnect ───────── */
async function startGmail() {
  const p = await gmail.backend.profile();
  if (CONFIG.ALLOWED_EMAIL && p.email.toLowerCase() !== CONFIG.ALLOWED_EMAIL.toLowerCase()) {
    await gmail.disconnect();
    throw new Error(`Please connect ${CONFIG.ALLOWED_EMAIL}. The selected account was ${p.email}.`);
  }
  store.set("granted", true); store.set("email", p.email);
  backend = gmail.backend; S.mode = "gmail"; S.connected = true; S.user.email = p.email;
  S.msgs.clear(); S.loaded = { spam: false, archive: false };
  const c = store.get("cache", null);
  if (c?.email === p.email) ingest(c.msgs);          // paint instantly from cache while syncing
  renderAll(); restartTimer();
  await sync();
}
async function connectGmail() {
  if (!gmail.hasClientId()) { toast("Add your Google OAuth Client ID first (Settings → Gmail connection)."); return go("settings"); }
  try { await gmail.connect(); await startGmail(); toast("Gmail connected."); }
  catch (e) { toast(e.message || "Could not connect Gmail."); }
}
async function disconnectGmail() {
  await gmail.disconnect(); store.del("granted"); store.del("cache");
  S.connected = false; startDemo(); toast("Gmail disconnected.");
}
function startDemo() {
  backend = demoBackend = createDemo(); S.mode = "demo"; S.connected = false; S.user.email = "";
  S.msgs.clear(); S.selected = null; S.loaded = { spam: false, archive: false };
  restartTimer(); renderAll(); sync();
}
gmail.hooks.onAuthLost = () => { S.connected = false; renderTop(); toast("Google session expired. Click the status badge to reconnect."); };

/* ───────── navigation ───────── */
function go(nav) {
  closeMenu(); S.nav = nav; S.checked.clear(); S.query = ""; S.searchIds = null; $("#search").value = ""; S.expanded = false;
  S.view = navView();
  S.cat = CATEGORIES.includes(nav) ? nav : "All";
  if (S.view !== "inbox") S.selected = null;
  $("#app").classList.remove("nav-open", "detail-open");
  renderAll();
  if ((S.view === "spam" || S.view === "archive") && !S.loaded[S.view]) loadKind(S.view).then(renderAll);
  $("#main").scrollTo({ top: 0 });
}

/* ───────── message actions ───────── */
async function mutate(ids, { add = [], remove = [] }, okMsg) {
  const targets = [].concat(ids).map(id => S.msgs.get(id)).filter(Boolean);
  const prev = targets.map(m => m.labels.slice());
  targets.forEach(m => { m.labels = [...new Set(m.labels.filter(l => !remove.includes(l)).concat(add))]; });
  renderMail();
  try {
    await Promise.all(targets.map(m => add.includes("TRASH") ? backend.trash(m.id) : backend.modify(m.id, add, remove)));
    if (okMsg) toast(okMsg);
  } catch (e) { targets.forEach((m, i) => m.labels = prev[i]); renderMail(); toast(e.message || "Action failed."); }
}
const act = {
  archive: ids => mutate(ids, { remove: ["INBOX"] }, "Archived."),
  trash: ids => mutate(ids, { add: ["TRASH"], remove: ["INBOX", "SPAM"] }, "Moved to trash."),
  spam: ids => mutate(ids, { add: ["SPAM"], remove: ["INBOX"] }, "Reported as spam."),
  notSpam: ids => mutate(ids, { add: ["INBOX"], remove: ["SPAM"] }, "Moved to inbox."),
  read: ids => mutate(ids, { remove: ["UNREAD"] }),
  unread: ids => mutate(ids, { add: ["UNREAD"] }, "Marked as unread."),
  star(id) { const m = S.msgs.get(id); if (m) return mutate(id, isStarred(m) ? { remove: ["STARRED"] } : { add: ["STARRED"] }); }
};
function snooze(id, until, label) {
  S.snoozed[id] = until; store.set("snoozed", S.snoozed); toast(`Snoozed until ${label}.`); renderMail();
}
function snoozeMenu(anchor, id) {
  const at9 = days => { const d = new Date(Date.now() + days * D); d.setHours(9, 0, 0, 0); return +d; };
  const nextMon = (() => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); d.setHours(9, 0, 0, 0); return +d; })();
  showMenu(anchor, [
    { cap: "Snooze until…" },
    { label: "In 1 hour", run: () => snooze(id, Date.now() + 36e5, time12(Date.now() + 36e5)) },
    { label: "Tomorrow, 9:00 AM", run: () => snooze(id, at9(1), "tomorrow 9:00 AM") },
    { label: "Next Monday, 9:00 AM", run: () => snooze(id, nextMon, "Monday 9:00 AM") }
  ], { align: "right" });
}

/* ───────── opening a message ───────── */
async function openMessage(id, { auto = false } = {}) {
  const m = S.msgs.get(id); if (!m) return;
  S.selected = id;
  if (!auto && isSmall()) $("#app").classList.add("detail-open");
  if (!auto && isUnread(m)) act.read(id); else renderMail();
  renderDetail();
  if (m.html === undefined && m.text === undefined) {
    try { Object.assign(m, await backend.full(id)); } catch (e) { m.html = ""; m.text = "Could not load this message: " + e.message; m.attachments = []; }
    if (S.selected === id) renderDetail();
  }
}

/* ───────── rendering: sidebar & top bar ───────── */
function renderNav() {
  const inbox = inboxMsgs(), un = list => list.filter(isUnread).length;
  const spamUnread = [...S.msgs.values()].filter(m => VIEW.spam(m) && isUnread(m)).length;
  const items = [["dashboard", "Dashboard"], ["all", "All Mail"], ...CATEGORIES.filter(c => c !== "Other").map(c => [c, c]), ["spam", "Spam"], ["archive", "Archive"], ["settings", "Settings"]];
  const badge = id => id === "all" ? un(inbox) : CATEGORIES.includes(id) ? un(inbox.filter(m => m.cat === id)) : id === "spam" ? spamUnread : 0;
  const isActive = n => n === S.nav;
  $("#nav").innerHTML = items.map(([id, label]) => {
    const b = badge(id);
    return `<button class="nav-item ${isActive(id) ? "active" : ""}" data-nav="${id}"><span class="ico">${navIcons[id === "dashboard" ? "home" : id]}</span>${label}${b ? `<span class="badge">${b}</span>` : ""}</button>`;
  }).join("");
}
function renderTop() {
  const st = $("#status");
  if (S.mode === "gmail" && S.connected) { st.className = "status"; st.innerHTML = `<b>Gmail Connected</b><small>Last synced: ${S.lastSync ? time12(S.lastSync) : "…"}</small>`; }
  else if (S.mode === "gmail") { st.className = "status off"; st.innerHTML = "<b>Not connected</b><small>Click to reconnect</small>"; }
  else { st.className = "status demo"; st.innerHTML = "<b>Demo mode</b><small>Click to connect Gmail</small>"; }
  $("#avatar").textContent = (prefs.name || S.user.email || "N").trim()[0].toUpperCase();
  const unread = inboxMsgs().filter(isUnread).length;
  document.title = (unread ? `(${unread}) ` : "") + "MailPilot – AI Inbox Manager";
}

/* ───────── rendering: stats ───────── */
function spark(vals, color, id) {
  const w = 200, h = 60, max = Math.max(1, ...vals);
  const pts = vals.map((v, i) => [i * w / (vals.length - 1), h - 8 - (v / max) * (h - 24)]);
  let d = `M${pts[0].join(",")}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="sg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w},${h} L0,${h}Z" fill="url(#sg${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function renderStats() {
  const inbox = inboxMsgs(), today0 = startOfDay(Date.now());
  const daily = list => { const a = Array(7).fill(0); list.forEach(m => { const k = 6 - Math.round((today0 - startOfDay(m.date)) / D); if (k >= 0 && k < 7) a[k]++; }); return a; };
  const todayN = list => list.filter(m => m.date >= today0).length;
  const day = list => list.filter(m => m.date >= Date.now() - D).length;
  const unread = inbox.filter(isUnread), career = inbox.filter(m => m.cat === "Career"), edu = inbox.filter(m => m.cat === "Education");
  const cards = [
    ["total", "Total Emails", inbox.length, `+${todayN(inbox)} today`, "#8b6cf6", inbox, ""],
    ["unread", "Unread", unread.length, `+${day(unread)} new`, "#f05a78", unread, "red"],
    ["career", "Career Updates", career.length, `+${todayN(career)}`, "#3b7bf5", career, ""],
    ["education", "Education", edu.length, `+${todayN(edu)}`, "#25b56c", edu, ""]
  ];
  $("#stats").innerHTML = cards.map(([k, t, n, delta, color, list, cls], i) => `
    <article class="stat"><div class="stat-top"><span class="stat-ico ${k}">${statIcons[k]}</span><div><h3>${t}</h3><strong>${n}</strong></div></div>
      <div class="delta ${cls}"><i>${icons.arrowUp}</i>${delta}</div>${spark(daily(list), color, i)}</article>`).join("") +
    `<article class="promo"><h3><span>${icons.sparkle}</span>Stay Productive!</h3><p>Let MailPilot organize your inbox intelligently.</p><button class="btn-white" data-act="learn">Learn More <i>${icons.arrowRight}</i></button>${robot}</article>`;
}

/* ───────── rendering: list ───────── */
function visibleList() {
  let list = [...S.msgs.values()];
  if (S.view === "search") list = list.filter(m => S.searchIds?.has(m.id));
  else list = list.filter(VIEW[S.view]);
  if (S.view === "inbox") {
    list = list.filter(m => !snoozed(m));
    if (S.cat === "Unread") list = list.filter(isUnread);
    else if (S.cat === "Starred") list = list.filter(isStarred);
    else if (S.cat !== "All") list = list.filter(m => m.cat === S.cat);
  }
  const q = S.query.trim().toLowerCase();
  if (q && S.view !== "search") list = list.filter(m => `${m.fromName} ${m.fromEmail} ${m.subject} ${m.snippet}`.toLowerCase().includes(q));
  const sorts = {
    newest: (a, b) => b.date - a.date, oldest: (a, b) => a.date - b.date,
    unread: (a, b) => (isUnread(b) - isUnread(a)) || (b.date - a.date),
    sender: (a, b) => a.fromName.localeCompare(b.fromName)
  };
  return list.sort(sorts[S.sort]);
}
const SORT_LABEL = { newest: "Newest", oldest: "Oldest", unread: "Unread first", sender: "Sender A–Z" };

function renderTabs() {
  if (S.view !== "inbox") {
    const n = visibleList().length, label = S.view === "search" ? "Search results" : S.view === "spam" ? "Spam" : "Archive";
    $("#tabs").innerHTML = `<button class="tab active"><span class="ico">${icons.grid}</span><span>${label}<small>${n}</small></span></button>`;
    return;
  }
  const base = inboxMsgs(), count = c => c === "All" ? base.length : base.filter(m => m.cat === c).length;
  const main = ["All", "Career", "Education", "Finance", "Shopping"], extra = ["Personal", "Promotions", "Other", "Unread", "Starred"];
  const shown = extra.includes(S.cat) ? [...main, S.cat] : main;
  const cnt = c => c === "Unread" ? base.filter(isUnread).length : c === "Starred" ? base.filter(isStarred).length : count(c);
  $("#tabs").innerHTML = shown.map(c => `<button class="tab ${S.cat === c ? "active" : ""}" data-cat="${c}" role="tab"><span class="ico">${c === "All" ? icons.grid : navIcons[c]}</span><span>${c === "All" ? "All Mail" : c}<small>${cnt(c)}</small></span></button>`).join("") +
    `<button class="tab tab-more" data-act="more" aria-label="More categories"><span class="ico">${icons.more}</span></button>`;
}
function renderListHead() {
  const list = visibleList();
  let left = "";
  if (S.checked.size) left = `<span class="bulk">${S.checked.size} selected</span><button data-bulk="archive">Archive</button><button data-bulk="trash">Delete</button><button data-bulk="read">Mark read</button><button data-bulk="unread">Mark unread</button>`;
  else if (S.view === "search") left = `<span class="search-chip">Results for “${esc(S.query)}” <button data-act="clearSearch" aria-label="Clear search">✕</button></span>`;
  else if (S.view === "spam" && list.length) left = `<button data-bulk-all="notSpam">Not spam</button>`;
  $("#listHead").innerHTML = `${left}<span class="grow"></span><button data-act="sort">Sort by: ${SORT_LABEL[S.sort]} <i>${icons.caret}</i></button>`;
}
const colors = ["#7a5cf5", "#2f6df0", "#1f9d60", "#e0762a", "#d6336c", "#0ca5b0", "#6c5ce7"];
function avatar(m) {
  const letter = `<span class="ava letter" style="background:${colors[(m.fromEmail.charCodeAt(0) || 0) % colors.length]}">${esc((m.fromName || "?")[0].toUpperCase())}</span>`;
  const domain = regDomain(m.fromEmail);
  if (!prefs.logos || !domain || /^(gmail|yahoo|outlook|hotmail|icloud|proton)\./.test(domain)) return letter;
  return `<span class="ava" data-fallback="${esc(letter)}"><img class="fav" alt="" loading="lazy" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64"></span>`;
}
function row(m) {
  return `<div class="row ${m.id === S.selected ? "sel" : ""} ${isUnread(m) ? "unread" : ""}" data-id="${esc(m.id)}" tabindex="0">
    <label class="chk"><input type="checkbox" data-chk ${S.checked.has(m.id) ? "checked" : ""} aria-label="Select email"><span></span></label>
    ${avatar(m)}
    <div class="txt"><div class="from">${esc(m.fromName)}</div><div class="subj">${esc(m.subject)}</div><div class="snip">${esc(m.snippet)}</div></div>
    <time>${fmtList(m.date)}</time><span class="pill c-${m.cat}">${m.cat}</span>
    <button class="star ${isStarred(m) ? "on" : ""}" data-star aria-label="Star">${icons.star}</button></div>`;
}
function renderList() {
  const list = visibleList(), el = $("#list");
  if (!list.length) {
    const loading = S.syncing && !S.msgs.size;
    el.innerHTML = loading ? '<div class="skel"></div>'.repeat(7) :
      `<div class="empty"><div><div class="big">${icons.mail}</div><h3>${S.query ? "No matches" : "Nothing here"}</h3><p>${S.query ? "Try a different search. Press Enter to search all of Gmail." : "You're all caught up in this view."}</p></div></div>`;
    return;
  }
  el.innerHTML = list.map(row).join("");
}
function ensureSelection() {
  const list = visibleList();
  if (S.selected && !list.some(m => m.id === S.selected)) { S.selected = null; renderDetail(); }
  if (!S.selected && list.length && !isSmall() && S.view === "inbox") { openMessage(list[0].id, { auto: true }); }
}
function renderMail() { renderNav(); renderTop(); renderStats(); renderTabs(); renderListHead(); renderList(); ensureSelection(); }

/* ───────── rendering: reading pane ───────── */
function bodyDoc(m) {
  const linkify = t => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
  const inner = m.html || `<pre style="white-space:pre-wrap;font:inherit">${linkify(m.text || m.snippet || "")}</pre>`;
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https:; font-src https: data:"><base target="_blank"><style>body{margin:0;padding:.9rem 1rem;font:14.5px/1.6 Inter,system-ui,sans-serif;color:#1d1840;overflow-wrap:anywhere}img{max-width:100%;height:auto}a{color:#4c35d1}table{max-width:100%}</style>${inner}`;
}
function renderDetail() {
  const el = $("#detail"), m = S.msgs.get(S.selected);
  if (!m) { el.innerHTML = `<div class="empty"><div><div class="big">${icons.mail}</div><h3>Select an email</h3><p>Pick a message from the list to read it here.</p></div></div>`; return; }
  const loaded = m.html !== undefined || m.text !== undefined;
  el.innerHTML = `
    <div class="d-tools">
      <button data-act="back" aria-label="Back" title="Back">${icons.back}</button>
      <button data-act="archive" aria-label="Archive" title="Archive">${icons.archive}</button>
      <button data-act="trash" aria-label="Delete" title="Delete">${icons.trash}</button>
      <button data-act="unread" aria-label="Mark unread" title="Mark as unread">${icons.mail}</button>
      <button data-act="snooze" aria-label="Snooze" title="Snooze">${icons.clock}</button>
      <button data-act="more" aria-label="More" title="More">${icons.more}</button>
      <span class="grow"></span>
      <button data-act="expand" aria-label="Expand" title="${S.expanded ? "Collapse" : "Expand"}">${icons.expand}</button>
    </div>
    <div class="d-scroll">
      <div class="d-head">
        <div class="d-ico">${navIcons[m.cat]}</div>
        <div class="d-main">
          <div class="d-title"><h2>${esc(m.subject)}</h2><button class="pill c-${m.cat}" data-act="cat" title="Change category">${m.cat}</button>
            <button class="star ${isStarred(m) ? "on" : ""}" id="dStar" data-act="star" aria-label="Star">${icons.star}</button></div>
          <div class="d-meta"><div>From: <b>${esc(m.fromName)}</b> &lt;${esc(m.fromEmail)}&gt;</div>
            <div class="d-row"><span>To: ${esc(m.to || "me")}</span><time>${fmtFull(m.date)}</time></div></div>
        </div>
      </div>
      ${m.attachments?.length ? `<div class="attach">${m.attachments.map((a, i) => `<button data-att="${i}"><i>${icons.clip}</i>${esc(a.name)}</button>`).join("")}</div>` : ""}
      ${loaded ? '<iframe class="d-body" title="Email content" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>' : '<div class="d-loading">Loading message…</div>'}
    </div>`;
  const f = $(".d-body", el);
  if (f) {
    f.srcdoc = bodyDoc(m);
    f.onload = () => {
      const d = f.contentDocument, fit = () => { f.style.height = "0"; f.style.height = d.documentElement.scrollHeight + "px"; };
      fit(); try { new ResizeObserver(fit).observe(d.body); } catch {}
    };
  }
}

/* ───────── rendering: settings ───────── */
function renderSettings() {
  const rules = store.get("rules", {}), ov = Object.entries(store.get("overrides", {}));
  const connectedTxt = S.mode === "gmail" && S.connected ? `Connected as ${esc(S.user.email)}` : S.mode === "gmail" ? "Session expired" : "Not connected (demo data)";
  $("#settings").innerHTML = `
    <div class="card"><h3>Gmail connection</h3><p>MailPilot signs in with Google directly in your browser. No password or client secret is ever stored.</p>
      <div class="kv"><span>Status</span><b>${connectedTxt}</b></div>
      <div class="kv"><span>Allowed account</span><b>${esc(CONFIG.ALLOWED_EMAIL || "Any Google account")}</b></div>
      <div class="kv"><span>Permission</span><b>Read, archive, star, trash</b></div>
      <label class="field" style="margin-top:1rem">Google OAuth Client ID<input id="set-client" value="${esc(store.get("clientId", ""))}" placeholder="1234567890-abc….apps.googleusercontent.com" autocomplete="off"></label>
      <div class="btn-row"><button class="btn" data-set="saveClient">Save Client ID</button>
        ${S.mode === "gmail" && S.connected ? '<button class="btn danger" data-set="disconnect">Disconnect Gmail</button>' : '<button class="btn primary" data-set="connect">Connect Gmail</button>'}</div>
      <p class="note" style="margin-top:.9rem">Client ID saved here overrides <code>js/config.js</code>. See README for the 2-minute Google Cloud setup.</p></div>
    <div class="card"><h3>Preferences</h3><p>Personalise how the dashboard looks and syncs.</p>
      <div class="grid2"><label class="field">Display name<input id="set-name" value="${esc(prefs.name)}"></label>
        <label class="field">Theme<select id="set-theme"><option value="">Match system</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
        <label class="field">Auto-sync every<select id="set-poll">${[[15000, "15 seconds"], [30000, "30 seconds"], [60000, "1 minute"], [300000, "5 minutes"]].map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>
        <label class="field">Emails to load<select id="set-max">${[25, 50, 100].map(v => `<option>${v}</option>`).join("")}</select></label></div>
      <label class="field">Sender logos<select id="set-logos"><option value="1">Show (fetched from Google favicons)</option><option value="0">Hide – use letters only</option></select></label>
      <button class="btn primary" data-set="savePrefs">Save preferences</button></div>
    <div class="card wide"><h3>Categorization</h3><p>Emails are scored on sender, subject and preview text. Add your own comma-separated keywords to teach MailPilot (e.g. company names, course codes).</p>
      <div class="grid2">${CATEGORIES.filter(c => c !== "Other").map(c => `<label class="field">${c} keywords<textarea data-rule="${c}" rows="2" placeholder="e.g. offer letter, hr, recruiter">${esc(rules[c] || "")}</textarea></label>`).join("")}</div>
      <button class="btn primary" data-set="saveRules">Save &amp; re-categorize</button>
      <h3 style="margin-top:1.4rem">Sender rules</h3><p>Created when you change an email's category in the reading pane.</p>
      ${ov.length ? ov.map(([e, c]) => `<div class="kv"><span>${esc(e)} → <b class="pill c-${c}" style="min-width:0">${c}</b></span><button class="btn" data-set="rmOverride" data-email="${esc(e)}">Remove</button></div>`).join("") : '<p class="note">No sender rules yet.</p>'}</div>
    <div class="card wide"><h3>Data &amp; privacy</h3><p>Mail is fetched directly from Google into this browser. A small cache of message headers is stored locally for fast start-up; message bodies are never stored.</p>
      <div class="btn-row"><button class="btn" data-set="clearCache">Clear local cache</button><button class="btn" data-set="demo">Reload demo data</button></div></div>`;
  const set = (id, v) => { const e = $("#" + id); if (e) e.value = String(v); };
  set("set-theme", prefs.theme); set("set-poll", prefs.poll); set("set-max", prefs.max); set("set-logos", prefs.logos ? "1" : "0");
}

function renderAll() {
  const settings = S.nav === "settings";
  $("#stats").hidden = settings; $("#workspace").hidden = settings; $("#settings").hidden = !settings;
  $("#workspace").classList.toggle("expanded", S.expanded);
  renderNav(); renderTop();
  if (settings) return renderSettings();
  renderStats(); renderTabs(); renderListHead(); renderList(); ensureSelection();
  if (S.selected) renderDetail();
}

/* ───────── events ───────── */
function bind() {
  $("#logo").innerHTML = logo; $("#spark1").innerHTML = icons.sparkle;
  $("#searchIcon").innerHTML = icons.search; $("#refresh").innerHTML = icons.refresh; $("#menuBtn").innerHTML = icons.menu;

  $("#nav").onclick = e => { const b = e.target.closest("[data-nav]"); if (b) go(b.dataset.nav); };
  $("#scrim").onclick = () => $("#app").classList.remove("nav-open", "detail-open");
  $("#menuBtn").onclick = () => $("#app").classList.add("nav-open");
  $("#refresh").onclick = () => S.mode === "gmail" && !S.connected ? connectGmail() : sync({ manual: true });
  $("#theme").onclick = () => { prefs.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; savePrefs(); applyTheme(); };
  $("#status").onclick = () => S.mode === "gmail" && S.connected ? sync({ manual: true }) : connectGmail();
  $("#avatar").onclick = e => showMenu(e.currentTarget, [
    { cap: S.user.email || "Demo mode – sample data" },
    { label: "Settings", run: () => go("settings") },
    S.mode === "gmail" && S.connected ? { label: "Disconnect Gmail", run: disconnectGmail } : { label: "Connect Gmail", run: connectGmail }
  ], { align: "right" });

  $("#stats").onclick = e => { if (e.target.closest("[data-act=learn]")) go("settings"); };

  $("#tabs").onclick = e => {
    const t = e.target.closest("[data-cat]");
    if (t) { S.cat = t.dataset.cat; S.checked.clear(); return renderMail(); }
    const more = e.target.closest("[data-act=more]");
    if (more) showMenu(more, ["Personal", "Promotions", "Other", "Unread", "Starred"].map(c => ({ label: c, on: S.cat === c, run: () => { S.cat = c; S.checked.clear(); renderMail(); } })));
  };

  $("#listHead").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.act === "sort") return showMenu(b, Object.entries(SORT_LABEL).map(([k, l]) => ({ label: l, on: S.sort === k, run: () => { S.sort = k; renderMail(); } })), { align: "right" });
    if (b.dataset.act === "clearSearch") return exitSearch();
    if (b.dataset.bulk) { const ids = [...S.checked]; S.checked.clear(); return act[b.dataset.bulk](ids); }
    if (b.dataset.bulkAll) return act[b.dataset.bulkAll](visibleList().map(m => m.id));
  };

  $("#list").onclick = e => {
    const r = e.target.closest(".row"); if (!r) return;
    const id = r.dataset.id;
    if (e.target.closest("[data-star]")) return act.star(id);
    if (e.target.closest(".chk")) { if (e.target.tagName === "INPUT") { e.target.checked ? S.checked.add(id) : S.checked.delete(id); renderListHead(); } return; }
    openMessage(id);
  };
  $("#list").onkeydown = e => { if (e.key === "Enter" && e.target.classList.contains("row")) openMessage(e.target.dataset.id); };
  document.addEventListener("error", e => {          // sender logo failed → letter avatar
    const img = e.target; if (img.tagName === "IMG" && img.classList.contains("fav")) { const p = img.parentElement; p.outerHTML = p.dataset.fallback; }
  }, true);

  $("#detail").onclick = async e => {
    const att = e.target.closest("[data-att]");
    const b = e.target.closest("[data-act]"), m = S.msgs.get(S.selected);
    if (att && m) {
      const a = m.attachments[att.dataset.att];
      try { const url = URL.createObjectURL(await backend.attachment(m.id, a.id)); Object.assign(document.createElement("a"), { href: url, download: a.name }).click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }
      catch (err) { toast(err.message); }
      return;
    }
    if (!b || !m) return;
    const id = m.id;
    switch (b.dataset.act) {
      case "back": $("#app").classList.remove("detail-open"); S.expanded = false; $("#workspace").classList.remove("expanded"); break;
      case "archive": act.archive(id); break;
      case "trash": act.trash(id); break;
      case "unread": act.unread(id); break;
      case "snooze": snoozeMenu(b, id); break;
      case "star": act.star(id); $("#dStar")?.classList.toggle("on", !isStarred(m)); break;
      case "expand": S.expanded = !S.expanded; $("#workspace").classList.toggle("expanded", S.expanded); break;
      case "cat": showMenu(b, [{ cap: "Move this sender to…" }, ...CATEGORIES.map(c => ({ label: c, on: m.cat === c, run: () => setSenderCategory(m, c) }))]); break;
      case "more": showMenu(b, [
        { label: "Open in Gmail", run: () => window.open(`https://mail.google.com/mail/u/0/#all/${encodeURIComponent(S.mode === "gmail" ? m.threadId || m.id : "")}`, "_blank", "noopener") },
        { label: has(m, "SPAM") ? "Not spam" : "Report spam", run: () => has(m, "SPAM") ? act.notSpam(id) : act.spam(id) },
        { label: isStarred(m) ? "Remove star" : "Add star", run: () => act.star(id) }
      ], { align: "right" }); break;
    }
  };

  $("#search").oninput = e => { S.query = e.target.value; if (S.view === "search") S.view = navView(); renderMail(); };
  $("#search").onkeydown = e => { if (e.key === "Enter" && S.query.trim()) serverSearch(); if (e.key === "Escape") exitSearch(); };

  $("#settings").onclick = settingsClick;
  addEventListener("keydown", shortcuts);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) sync(); });
  matchMedia("(prefers-color-scheme:dark)").onchange = () => { if (!prefs.theme) applyTheme(); };
}

function setSenderCategory(m, cat) {
  const ov = store.get("overrides", {}); ov[m.fromEmail.toLowerCase()] = cat; store.set("overrides", ov);
  recategorizeAll(); renderAll(); toast(`${m.fromName} → ${cat}. Future emails from this sender go there too.`);
}
async function serverSearch() {
  const q = S.query.trim(); S.view = "search"; S.checked.clear();
  try { const res = await backend.load("search", { q, max: 40 }); ingest(res); S.searchIds = new Set(res.map(m => m.id)); }
  catch (e) { toast(e.message); S.view = navView(); }
  renderAll();
}
function exitSearch() { S.query = ""; S.view = navView(); S.searchIds = null; $("#search").value = ""; renderMail(); }

function shortcuts(e) {
  const t = e.target.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(t) || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "/") { e.preventDefault(); $("#search").focus(); return; }
  if (e.key === "Escape") { closeMenu(); $("#app").classList.remove("detail-open", "nav-open"); return; }
  const list = visibleList(), i = list.findIndex(m => m.id === S.selected);
  if (e.key === "j" && list[i + 1]) openMessage(list[i + 1].id);
  else if (e.key === "k" && list[i - 1]) openMessage(list[i - 1].id);
  else if (S.selected && e.key === "e") act.archive(S.selected);
  else if (S.selected && (e.key === "#" || e.key === "Delete")) act.trash(S.selected);
  else if (S.selected && e.key === "s") act.star(S.selected);
}

async function settingsClick(e) {
  const b = e.target.closest("[data-set]"); if (!b) return;
  switch (b.dataset.set) {
    case "saveClient": store.set("clientId", $("#set-client").value.trim()); toast("Client ID saved."); break;
    case "connect": store.set("clientId", $("#set-client").value.trim() || store.get("clientId", "")); await connectGmail(); renderSettings(); break;
    case "disconnect": await disconnectGmail(); renderSettings(); break;
    case "savePrefs":
      prefs.name = $("#set-name").value.trim() || "Naveen"; prefs.theme = $("#set-theme").value; prefs.poll = +$("#set-poll").value;
      prefs.max = +$("#set-max").value; prefs.logos = $("#set-logos").value === "1";
      savePrefs(); applyTheme(); restartTimer(); renderTop(); toast("Preferences saved."); break;
    case "saveRules": {
      const rules = {}; document.querySelectorAll("[data-rule]").forEach(t => { if (t.value.trim()) rules[t.dataset.rule] = t.value.trim(); });
      store.set("rules", rules); recategorizeAll(); renderNav(); toast("Rules saved. Inbox re-categorized."); break;
    }
    case "rmOverride": { const ov = store.get("overrides", {}); delete ov[b.dataset.email]; store.set("overrides", ov); recategorizeAll(); renderSettings(); break; }
    case "clearCache": store.del("cache"); store.del("snoozed"); S.snoozed = {}; toast("Local cache cleared."); break;
    case "demo": if (S.mode === "gmail") await disconnectGmail(); else startDemo(); go("dashboard"); break;
  }
}

/* ───────── boot ───────── */
async function boot() {
  applyTheme(); bind();
  S.msgs.clear(); renderAll();
  if (gmail.hasClientId()) {
    try {
      if (gmail.restoreSession()) return await startGmail();
      if (store.get("granted", false)) { await gmail.connect({ silent: true }); return await startGmail(); }
    } catch (e) { if (store.get("granted", false)) { S.mode = "gmail"; S.connected = false; backend = gmail.backend; ingest(store.get("cache", { msgs: [] }).msgs); S.user.email = store.get("email", ""); renderAll(); toast("Click the status badge to reconnect Gmail."); return; } }
  }
  startDemo();
}
boot();
