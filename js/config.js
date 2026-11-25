// ─────────────────────────────────────────────────────────────
//  MailPilot configuration
//  Paste your Google OAuth *Web application* Client ID below
//  (or enter it later in the app: Settings → Gmail connection).
//  NEVER put a client secret in this project – it is not needed.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  CLIENT_ID: "849169284283-ll2aot6fc130s2oetg56q7qacjlaau5t.apps.googleusercontent.com",
  // gmail.modify = read mail + archive / trash / star / mark read. It cannot send mail or permanently delete.
  SCOPES: "https://www.googleapis.com/auth/gmail.modify",
  // Only this Google account may connect. Set to "" to allow any account.
  ALLOWED_EMAIL: "vaddenaveen77@gmail.com"
};
