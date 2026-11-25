# MailPilot – AI Inbox Manager

A Gmail dashboard that reads your inbox, **categorizes every email automatically** (Career, Education, Finance, Shopping, Personal, Promotions), and lets you read, star, archive, delete, snooze and search mail from a clean 3‑pane interface.

* **No backend, no database, no build step.** Plain HTML / CSS / JavaScript (ES modules).
* **No client secret and no password** – sign‑in uses Google Identity Services directly in the browser.
* Works immediately in **Demo mode** with sample mail, so you can explore the UI before connecting Gmail.

---

## 1. Requirements

* **Node.js 16+** (only used to serve the files – `node server.js`). Alternatively use Python (`python -m http.server 5500`) or VS Code Live Server.
* A Google account and a (free) Google Cloud project for the OAuth Client ID.
* A modern browser (Chrome, Edge, Firefox, Safari).

## 2. Quick start (Demo mode – 30 seconds)

```bash
unzip mailpilot-ai.zip && cd mailpilot-ai
npm start            # or: node server.js
```

Open **http://localhost:5500**. You will see the dashboard with demo data (status badge shows *Demo mode*). A new demo email arrives after ~1 minute to show live sync.

> Do **not** double‑click `index.html`. Google sign‑in and ES modules need a real `http://` origin.

## 3. Connect your real Gmail

### 3.1 Create the Google OAuth Client ID (one time, ~5 minutes)

1. Go to <https://console.cloud.google.com/> and **create a project** (e.g. “MailPilot”).
2. **APIs & Services → Library →** search **Gmail API → Enable**.
3. **APIs & Services → OAuth consent screen** (or *Google Auth Platform*):
   * User type: **External**. Fill in app name and your email.
   * Under **Data access / Scopes**, add `https://www.googleapis.com/auth/gmail.modify`.
   * Under **Audience / Test users**, **add your Gmail address** (`vaddenaveen77@gmail.com`). While the app is in *Testing*, only listed test users can sign in.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   * Application type: **Web application**.
   * **Authorized JavaScript origins:** `http://localhost:5500` (add your real domain later, e.g. `https://mail.example.com`).
   * Leave *redirect URIs* empty (not needed for this flow).
5. Copy the **Client ID** (looks like `1234567890-abc123.apps.googleusercontent.com`).

### 3.2 Give MailPilot the Client ID

Pick **one**:

* **In the app (easiest):** *Settings → Gmail connection →* paste the Client ID → **Save Client ID** → **Connect Gmail**.
* **In code:** open `js/config.js` and replace `PASTE_YOUR_GOOGLE_OAUTH_CLIENT_ID_HERE`.

### 3.3 Sign in

Click the **Demo mode** badge (or *Connect Gmail*). Google shows a consent screen (“Google hasn’t verified this app” is normal in Testing → *Advanced → Go to MailPilot*). After approval the dashboard loads your latest inbox mail and the badge turns green: **Gmail Connected**.

> By default only `vaddenaveen77@gmail.com` is allowed (`ALLOWED_EMAIL` in `js/config.js`). Set it to `""` to allow any Google account.

## 4. What it does

| Area | Details |
|---|---|
| **Dashboard** | Total / Unread / Career / Education cards with 7‑day sparklines computed from your real mail, “+N today” deltas. |
| **Categories** | Career · Education · Finance · Shopping · Personal · Promotions · Other. Sidebar badges show *unread* counts; tab counts show totals. |
| **Mail list** | Sender logo, subject, preview, time, category pill, star, checkboxes for bulk actions, sort (Newest / Oldest / Unread first / Sender). |
| **Reading pane** | Full email body (HTML rendered in a locked‑down sandbox: no scripts), attachments download, From/To/date. |
| **Actions** | Star, archive, delete (to Gmail Trash), mark unread, snooze (1 h / tomorrow / Monday), report spam / not spam, open in Gmail. All sync to Gmail. |
| **Search** | Type to filter instantly; press **Enter** to search all of Gmail (supports Gmail operators, e.g. `from:tcs newer_than:7d`). |
| **Live sync** | Polls every 30 s (configurable), keeps read/starred state in sync with Gmail, toasts new mail with its category, shows unread count in the tab title. |
| **Spam / Archive** | Real Gmail Spam folder and “not in Inbox” mail. |
| **Settings** | Client ID, display name, theme, sync interval, mail count, sender logos, custom keyword rules, sender rules, cache. |
| **Responsive** | Desktop 3‑pane → tablet slide‑over reading pane → mobile drawer navigation. Dark mode included. |
| **Shortcuts** | `j`/`k` next/previous · `e` archive · `#` or `Delete` trash · `s` star · `/` search · `Esc` close. |

## 5. How automatic categorization works (`js/categorizer.js`)

Each email gets a **score per category** from:

1. Sender domain (e.g. `coursera.org` → Education, `hdfcbank.net` → Finance) – +4
2. Keyword rules matched in the **subject** (×2), **preview text** (×1) and **sender** (×1.5)
3. Gmail’s own tabs (`CATEGORY_PROMOTIONS`, `CATEGORY_SOCIAL`) – +3/+4
4. **Your custom keywords** (Settings → Categorization) – +6 each

The highest score wins; if nothing scores ≥ 3 the email is **Other**.
You can override any sender: open an email → click its category pill → choose a category. Future mail from that sender follows your rule (managed under *Settings → Sender rules*).

To change defaults permanently, edit `DOMAINS` and `RULES` in `js/categorizer.js`.

> Categories are computed in the browser and are **not** written to Gmail as labels.

## 6. Project structure

```
mailpilot-ai/
├── index.html          App shell
├── server.js           Zero‑dependency static server (npm start)
├── package.json
├── css/styles.css      All styling (rem‑based; scales from the reference design)
├── assets/favicon.svg
└── js/
    ├── config.js       Client ID, scope, allowed email
    ├── app.js          State, rendering, actions, sync loop, settings
    ├── gmail.js        Google OAuth + Gmail REST API + MIME/body parsing
    ├── categorizer.js  Scoring engine
    ├── demo-data.js    Demo backend (same interface as Gmail backend)
    ├── icons.js        Inline SVG icons, logo, mascot
    └── store.js        localStorage helper
```

`app.js` talks to a *backend* object (`load`, `full`, `modify`, `trash`). `gmail.js` and `demo-data.js` both implement it, so every UI feature works identically in demo and live mode.

## 7. Configuration reference

| Setting | Where | Default |
|---|---|---|
| OAuth Client ID | `js/config.js` or Settings | – |
| Gmail scope | `js/config.js` → `SCOPES` | `gmail.modify` |
| Allowed account | `js/config.js` → `ALLOWED_EMAIL` | `vaddenaveen77@gmail.com` |
| Port | env `PORT` | `5500` |
| Sync interval, mail count, theme, name | Settings → Preferences | 30 s, 50, system, “Naveen” |

**Read‑only mode:** change `SCOPES` to `https://www.googleapis.com/auth/gmail.readonly` (archive/star/trash will then fail with a clear message). Also update the scope under *Data access* in Google Cloud.

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| `Error 400: origin_mismatch` | The URL in your browser must exactly match an **Authorized JavaScript origin** (`http://localhost:5500`, not `127.0.0.1`). |
| `Error 403: access_denied` | Add your Gmail as a **Test user** on the OAuth consent screen. |
| “Google hasn’t verified this app” | Expected while in Testing → *Advanced → Go to MailPilot (unsafe)* – it is your own project. |
| Popup blocked / nothing happens | Allow popups for localhost, then click **Connect Gmail** again. |
| `Gmail API has not been used in project…` | Enable **Gmail API** in the same Google Cloud project as the Client ID. |
| Please connect vaddenaveen77@gmail.com | You signed in with another account. Use that account or change `ALLOWED_EMAIL`. |
| Session expired | Tokens last 1 hour; MailPilot renews silently. If the browser blocks that, click the red status badge to reconnect. |
| Sender logos missing | Logos come from Google’s favicon service; offline/ad‑blocked → letter avatars are used. Turn off in Settings. |
| Port in use | `PORT=8080 npm start` and add `http://localhost:8080` to Authorized origins. |

## 9. Security & privacy

* Mail is fetched **directly from Google to your browser**; there is no MailPilot server.
* Access token is kept in memory and `sessionStorage` (cleared when the tab closes). **No refresh token or client secret is stored.**
* A cache of message *headers* (sender, subject, preview) is kept in `localStorage` for fast start‑up. Message bodies are never stored. *Settings → Clear local cache* or *Disconnect* removes it.
* Email HTML is shown in a sandboxed `<iframe>` with scripts disabled and a restrictive Content‑Security‑Policy. Remote images load from `https:` (like Gmail with images on).
* The `gmail.modify` scope can read, archive, star, label and trash mail. It **cannot** send mail or permanently delete.

## 10. Deploying to a website

Upload the folder to any static host (Netlify, Vercel, GitHub Pages, Nginx…), then:

1. Add the live origin (e.g. `https://mail.example.com`) to **Authorized JavaScript origins**.
2. Serve over **HTTPS**.
3. To let people other than test users sign in, publish the OAuth consent screen. Because `gmail.modify` is a *restricted* scope, Google requires verification (and for public apps a security assessment). For personal use, staying in *Testing* is fine.

## 11. Known limitations

* **Polling, not push.** Updates appear within the sync interval. True push needs a backend + Google Pub/Sub.
* **Snooze is local** to this browser (Gmail’s API has no snooze).
* **Categories are not Gmail labels**, so they don’t appear in the Gmail app.
* Inline `cid:` images embedded inside an email are not displayed; remote images are.
* Loads the newest 25/50/100 inbox messages (no “load older” paging yet).
* Not included: composing/replying (use *More → Open in Gmail*).

## 12. License

MIT – use and modify freely.
