// Gmail integration: Google Identity Services (OAuth token flow) + Gmail REST API.
// No backend and no client secret. The access token lives only in memory / sessionStorage.
import { CONFIG } from "./config.js";
import { store } from "./store.js";

const API = "https://gmail.googleapis.com/gmail/v1/users/me/";
let token = null, expiresAt = 0, renewTimer = null;
export const hooks = { onAuthLost: () => {} };
const cache = new Map(); // id → normalized message (metadata)

export const clientId = () => store.get("clientId", "") || (CONFIG.CLIENT_ID.startsWith("PASTE_") ? "" : CONFIG.CLIENT_ID);
export const hasClientId = () => !!clientId();
export const isConnected = () => !!token && Date.now() < expiresAt;

/* ───────── auth ───────── */
function waitForGIS(ms = 8000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function check() {
      if (window.google?.accounts?.oauth2) return resolve();
      if (Date.now() - t0 > ms) return reject(new Error("Google sign-in script could not load. Check your internet connection or ad-blocker."));
      setTimeout(check, 150);
    })();
  });
}

function setToken(r) {
  token = r.access_token;
  expiresAt = Date.now() + (Number(r.expires_in) || 3600) * 1000;
  try { sessionStorage.setItem("mp.token", JSON.stringify({ token, expiresAt })); } catch {}
  clearTimeout(renewTimer);
  // Renew 5 minutes before expiry so the dashboard keeps syncing without a click.
  renewTimer = setTimeout(() => connect({ silent: true }).catch(() => hooks.onAuthLost()), Math.max(30_000, expiresAt - Date.now() - 300_000));
}

/** Reuse a still-valid token after a page reload (same browser tab). */
export function restoreSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem("mp.token") || "null");
    if (s && s.expiresAt > Date.now() + 60_000) { setToken({ access_token: s.token, expires_in: (s.expiresAt - Date.now()) / 1000 }); return true; }
  } catch {}
  return false;
}

export async function connect({ silent = false } = {}) {
  await waitForGIS();
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId(),
      scope: CONFIG.SCOPES,
      hint: store.get("email", "") || CONFIG.ALLOWED_EMAIL || undefined,
      callback: r => r.error ? reject(new Error(r.error_description || r.error)) : (setToken(r), resolve()),
      error_callback: e => reject(new Error(e.type === "popup_closed" ? "Sign-in window was closed." : e.message || e.type || "Sign-in failed."))
    });
    client.requestAccessToken({ prompt: silent ? "none" : store.get("granted", false) ? "" : "consent" });
  });
}

export async function disconnect() {
  const t = token;
  token = null; expiresAt = 0; clearTimeout(renewTimer);
  try { sessionStorage.removeItem("mp.token"); } catch {}
  cache.clear();
  if (t && window.google?.accounts?.oauth2) try { google.accounts.oauth2.revoke(t, () => {}); } catch {}
}

/* ───────── REST helper ───────── */
async function api(path, { method = "GET", body, params = {} } = {}, retried = false) {
  if (!isConnected()) throw new Error("Gmail is not connected.");
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) [].concat(v).forEach(x => url.searchParams.append(k, x));
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401 && !retried) {
    try { await connect({ silent: true }); return api(path, { method, body, params }, true); }
    catch { hooks.onAuthLost(); throw new Error("Your Google session expired. Click “Connect” to sign in again."); }
  }
  if (res.status === 429) throw new Error("Gmail is rate-limiting requests. Wait a moment and refresh.");
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error?.message || `Gmail API error (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

/* ───────── parsing ───────── */
export function decodeMime(s = "") {
  return s.replace(/(\?=)\s+(=\?)/g, "$1$2").replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (m, cs, enc, txt) => {
    try {
      const bin = enc.toUpperCase() === "B" ? atob(txt)
        : txt.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
      return new TextDecoder(cs).decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
    } catch { return m; }
  });
}
function decodeEntities(s = "") { const t = document.createElement("textarea"); t.innerHTML = s; return t.value; }
function parseFrom(raw = "") {
  const v = decodeMime(raw);
  const m = v.match(/^\s*"?(.*?)"?\s*<([^>]+)>\s*$/);
  const email = (m ? m[2] : v).trim().toLowerCase();
  return { fromName: (m ? m[1] : "").replace(/\\"/g, '"').trim() || email.split("@")[0], fromEmail: email };
}
const header = (headers, name) => headers?.find(h => h.name.toLowerCase() === name)?.value || "";

function normalize(m) {
  const h = m.payload?.headers || [];
  return {
    id: m.id, threadId: m.threadId, labels: m.labelIds || [],
    ...parseFrom(header(h, "from")),
    to: decodeMime(header(h, "to")),
    subject: decodeMime(header(h, "subject")) || "(No subject)",
    snippet: decodeEntities(m.snippet || ""),
    date: Number(m.internalDate) || Date.parse(header(h, "date")) || Date.now()
  };
}
function bytes(b64url) {
  const bin = atob(b64url.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
function decodePart(part) {
  const cs = (header(part.headers, "content-type").match(/charset="?([^";\s]+)/i) || [])[1] || "utf-8";
  try { return new TextDecoder(cs).decode(bytes(part.body.data)); } catch { return new TextDecoder().decode(bytes(part.body.data)); }
}
function walk(part, out) {
  const mime = part.mimeType || "";
  if (part.filename && part.body?.attachmentId) out.attachments.push({ id: part.body.attachmentId, name: part.filename, size: part.body.size, mime });
  else if (part.body?.data && mime === "text/html") out.html ||= decodePart(part);
  else if (part.body?.data && mime === "text/plain") out.text ||= decodePart(part);
  (part.parts || []).forEach(p => walk(p, out));
}

async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]).catch(() => null); }
  }));
  return out.filter(Boolean);
}
const getMeta = id => api(`messages/${id}`, { params: { format: "metadata", metadataHeaders: ["From", "To", "Subject", "Date"] } }).then(normalize);

/* ───────── backend interface used by app.js ───────── */
export const backend = {
  name: "gmail",
  profile: () => api("profile").then(p => ({ email: p.emailAddress, total: p.messagesTotal })),

  /** kind: inbox | spam | archive | search */
  async load(kind, { q = "", max = 50 } = {}) {
    const params = { maxResults: max };
    if (kind === "inbox") params.labelIds = ["INBOX"];
    else if (kind === "spam") params.labelIds = ["SPAM"];
    else if (kind === "archive") params.q = "-in:inbox -in:spam -in:trash -in:sent -in:drafts";
    else params.q = q;
    const res = await api("messages", { params });
    const ids = (res.messages || []).map(x => x.id);
    const fresh = await pool(ids.filter(id => !cache.has(id)), 8, getMeta);
    fresh.forEach(m => cache.set(m.id, m));
    const list = ids.map(id => cache.get(id)).filter(Boolean);

    if (kind === "inbox") {
      // Two cheap list calls keep read/starred state in sync with changes made in Gmail itself.
      const [unread, starred] = await Promise.all(["UNREAD", "STARRED"].map(l =>
        api("messages", { params: { labelIds: ["INBOX", l], maxResults: max } }).then(r => new Set((r.messages || []).map(x => x.id)))));
      for (const m of list) {
        const set = (label, on) => { m.labels = m.labels.filter(x => x !== label); if (on) m.labels.push(label); };
        set("UNREAD", unread.has(m.id)); set("STARRED", starred.has(m.id));
      }
    }
    return list;
  },

  async full(id) {
    const m = await api(`messages/${id}`, { params: { format: "full" } });
    const out = { html: "", text: "", attachments: [] };
    walk(m.payload || {}, out);
    return out;
  },
  async attachment(id, attId) {
    const r = await api(`messages/${id}/attachments/${attId}`);
    return new Blob([bytes(r.data)]);
  },
  modify: (id, add = [], remove = []) => api(`messages/${id}/modify`, { method: "POST", body: { addLabelIds: add, removeLabelIds: remove } }),
  trash: id => api(`messages/${id}/trash`, { method: "POST" })
};
