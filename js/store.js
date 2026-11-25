// Tiny localStorage wrapper (never throws – private mode / quota errors are ignored).
export const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("mp." + key); return v == null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem("mp." + key, JSON.stringify(value)); } catch {} },
  del(key) { try { localStorage.removeItem("mp." + key); } catch {} }
};
