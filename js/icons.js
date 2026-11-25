// Inline SVG icons. `line` icons inherit currentColor; `nav` icons are full-colour like the design.
const line = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const icons = {
  search: line('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  refresh: line('<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.5 5.8L21 8"/><path d="M21 3v5h-5"/>'),
  moon: line('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  sun: line('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  star: line('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
  back: line('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  archive: line('<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>'),
  trash: line('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/>'),
  mail: line('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  clock: line('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  more: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>`,
  expand: line('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
  caret: line('<path d="m6 9 6 6 6-6"/>'),
  arrowUp: line('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  arrowRight: line('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  menu: line('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  close: line('<path d="M6 6l12 12M18 6 6 18"/>'),
  clip: line('<path d="m21 11-8.6 8.6a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L15 7"/>'),
  download: line('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
  external: line('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  bulb: `<svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.1.9 1.8V17h5.4v-1.4c0-.7.3-1.3.9-1.8A6 6 0 0 0 12 3z" fill="#8b6cf6"/><rect x="9.5" y="18" width="5" height="2.2" rx="1.1" fill="#b9a6fb"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.6 4.6 2.4 7.4 7 8-4.600.6-6.400 3.400-7 8-.6-4.600-2.400-7.400-7-8 4.600-.6 6.400-3.400 7-8z"/><path d="M19 15c.3 2 1 3 3 3.300-2 .3-2.700 1.300-3 3.300-.3-2-1-3-3-3.300 2-.3 2.700-1.300 3-3.300z" opacity=".8"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.500" y="3" width="7.500" height="7.500" rx="1.800"/><rect x="3" y="13.500" width="7.500" height="7.500" rx="1.800"/><rect x="13.500" y="13.500" width="7.500" height="7.500" rx="1.800"/></svg>`,
  plug: line('<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>')
};

const fill = s => `<svg viewBox="0 0 24 24">${s}</svg>`;
// Full-colour icons used in the sidebar, tabs, reading-pane header
export const navIcons = {
  home: fill('<path fill="#fff" d="M12 3 2.800 11.300a.8.8 0 0 0 .5 1.400H5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-7.300h1.700a.8.8 0 0 0 .5-1.400z"/>'),
  all: fill('<rect x="2.500" y="5" width="19" height="14" rx="3" fill="none" stroke="#d8cffc" stroke-width="1.800"/><path d="m3.500 7.500 8.500 6 8.500-6" fill="none" stroke="#d8cffc" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/>'),
  Career: fill('<path d="M9 8V6.500A1.500 1.500 0 0 1 10.500 5h3A1.500 1.500 0 0 1 15 6.500V8" fill="none" stroke="#c9690d" stroke-width="1.900"/><rect x="2.500" y="8" width="19" height="12.500" rx="2.600" fill="#f7a02c"/><rect x="2.500" y="12.200" width="19" height="1.800" fill="#e08414"/><rect x="10.300" y="11.200" width="3.400" height="3.400" rx=".7" fill="#ffd885"/>'),
  Education: fill('<path fill="#a98aff" d="M12 3.500 1.500 9 12 14.500 22.500 9z"/><path fill="#6d4be3" d="M6 12.800V17c0 1.600 2.700 3 6 3s6-1.400 6-3v-4.200l-6 3.100z"/><rect x="20" y="9.500" width="1.700" height="6.500" rx=".8" fill="#6d4be3"/>'),
  Finance: fill('<path d="M5 6.500 16.500 3v3.500z" fill="#1f9d5a"/><rect x="2.500" y="6" width="19" height="14.500" rx="3.200" fill="#2fbf71"/><rect x="13.500" y="10.800" width="8" height="5.400" rx="1.700" fill="#c4f2d7"/><circle cx="16.500" cy="13.500" r="1.100" fill="#1f9d5a"/>'),
  Shopping: fill('<path d="M2 3.500h3.200l2.300 11.200h11" fill="none" stroke="#f7a02c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.800 6.500h14.400l-2.100 7.600H8.300z" fill="#f7a02c"/><circle cx="9.500" cy="19" r="1.800" fill="#d97a12"/><circle cx="17" cy="19" r="1.800" fill="#d97a12"/>'),
  Personal: fill('<circle cx="12" cy="7.800" r="4.300" fill="#3da5f5"/><path d="M3.500 21c0-4.800 3.800-7.600 8.500-7.600s8.500 2.800 8.500 7.600z" fill="#2b86e0"/>'),
  Promotions: fill('<path d="M3 10v4a1 1 0 0 0 1 1h2.500l8 4V5l-8 4H4a1 1 0 0 0-1 1z" fill="#f2552c"/><rect x="6" y="15" width="3.200" height="5.500" rx="1.100" fill="#c33a16"/><path d="M17.500 9.200a3.700 3.700 0 0 1 0 5.600" fill="none" stroke="#ff9d72" stroke-width="2" stroke-linecap="round"/>'),
  Other: fill('<circle cx="12" cy="12" r="9" fill="#9aa5c4"/><circle cx="8" cy="12" r="1.300" fill="#fff"/><circle cx="12" cy="12" r="1.300" fill="#fff"/><circle cx="16" cy="12" r="1.300" fill="#fff"/>'),
  Unread: fill('<rect x="2.500" y="5" width="19" height="14" rx="3" fill="#ef4a5f"/><path d="m3.500 7.500 8.500 6 8.500-6" fill="none" stroke="#fff" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/>'),
  Starred: fill('<path d="m12 2.800 2.800 5.800 6.300.9-4.600 4.400 1.100 6.300L12 17.300l-5.600 2.900 1.100-6.300L2.900 9.500l6.300-.9z" fill="#f7b32c"/>'),
  spam: fill('<path d="M12 2.500 4 5.500v6c0 5 3.300 8.600 8 10 4.700-1.400 8-5 8-10v-6z" fill="#ef4444"/><path d="M12 7.200v6M12 16.200v1.300" stroke="#fff" stroke-width="2.100" stroke-linecap="round"/>'),
  archive: fill('<rect x="3" y="3.800" width="18" height="5.400" rx="1.700" fill="#cfc4f8"/><path d="M5 10h14v8a2.200 2.200 0 0 1-2.200 2.200H7.200A2.200 2.200 0 0 1 5 18z" fill="#a994f0"/><rect x="9.500" y="12.500" width="5" height="2.100" rx="1" fill="#5b3df0"/>'),
  settings: fill('<circle cx="12" cy="12" r="7.500" fill="none" stroke="#9fb0d6" stroke-width="3.600" stroke-dasharray="3.100 2.800"/><circle cx="12" cy="12" r="6.300" fill="#9fb0d6"/><circle cx="12" cy="12" r="2.700" fill="#2a1a6e"/>')
};

// Big stat-card glyphs (coloured envelope / briefcase / cap)
export const statIcons = {
  total: fill('<rect x="2.500" y="5" width="19" height="14" rx="3.200" fill="#7a5cf5"/><path d="m3.500 7.500 8.500 6 8.500-6" fill="none" stroke="#fff" stroke-width="1.900" stroke-linecap="round" stroke-linejoin="round"/>'),
  unread: navIcons.Unread,
  career: fill('<path d="M9 8V6.500A1.500 1.500 0 0 1 10.500 5h3A1.500 1.500 0 0 1 15 6.500V8" fill="none" stroke="#1f56d6" stroke-width="1.900"/><rect x="2.500" y="8" width="19" height="12.500" rx="2.600" fill="#2f6df0"/><rect x="2.500" y="12.200" width="19" height="1.800" fill="#1f56d6"/><rect x="10.300" y="11.200" width="3.400" height="3.400" rx=".7" fill="#9cc0ff"/>'),
  education: fill('<path fill="#25b56c" d="M12 3.500 1.500 9 12 14.500 22.500 9z"/><path fill="#16914f" d="M6 12.800V17c0 1.600 2.700 3 6 3s6-1.400 6-3v-4.200l-6 3.100z"/><rect x="20" y="9.500" width="1.700" height="6.500" rx=".8" fill="#16914f"/>')
};

export const logo = `<svg viewBox="0 0 48 48"><defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d2b0ff"/><stop offset="1" stop-color="#6a4cf0"/></linearGradient></defs><path d="M3 21 45 3 35 45 22 29z" fill="url(#lg1)"/><path d="M22 29 45 3 17 25z" fill="#4a2fd2" opacity=".55"/><path d="m22 29-2 13 7-9z" fill="#ff7ab8"/></svg>`;

export const robot = `<svg viewBox="0 0 150 130" class="robot"><defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfd3ff"/></linearGradient></defs>
<ellipse cx="75" cy="122" rx="48" ry="6" fill="#2a0f8a" opacity=".35"/>
<line x1="75" y1="8" x2="75" y2="20" stroke="#e2dcff" stroke-width="3"/><circle cx="75" cy="7" r="5" fill="#ffd45a"/>
<rect x="30" y="20" width="90" height="62" rx="28" fill="url(#rb)"/>
<rect x="19" y="40" width="14" height="22" rx="7" fill="#7b5cf6"/><rect x="117" y="40" width="14" height="22" rx="7" fill="#7b5cf6"/>
<rect x="40" y="30" width="70" height="42" rx="21" fill="#1b1458"/>
<path d="M56 49q6-8 12 0M82 49q6-8 12 0" stroke="#5be3ff" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M65 59q10 9 20 0" stroke="#5be3ff" stroke-width="4" fill="none" stroke-linecap="round"/>
<rect x="45" y="82" width="60" height="34" rx="16" fill="url(#rb)"/>
<g transform="rotate(-8 100 92)"><rect x="82" y="82" width="52" height="34" rx="5" fill="#ffb347"/><path d="m82 85 26 17 26-17" stroke="#e8892a" stroke-width="3" fill="none"/></g>
<circle cx="46" cy="96" r="8" fill="#7b5cf6"/></svg>`;
