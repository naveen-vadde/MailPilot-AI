// Demo backend: same interface as the Gmail backend, with sample mail that mirrors the design.
// Used automatically until Gmail is connected so the whole UI can be explored offline.
const D = 864e5;
const at = (daysAgo, h, m) => { const d = new Date(Date.now() - daysAgo * D); d.setHours(h, m, 0, 0); return +d; };
const wrap = (inner) => `<div style="font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1d1840">${inner}</div>`;
const btn = (t) => `<a href="#" style="display:inline-block;background:#4c35d1;color:#fff;text-decoration:none;font-weight:600;padding:13px 26px;border-radius:30px;margin:10px 0 16px">${t}</a>`;

const hcl = wrap(`
  <div style="background:linear-gradient(100deg,#0a2a8f,#1553c9 55%,#2a7bd8);border-radius:6px;padding:34px 28px;color:#fff;margin-bottom:22px">
    <span style="font:italic 800 34px Georgia,serif;letter-spacing:-1px">HCL</span>
    <span style="border-left:2px solid #fff;margin-left:14px;padding-left:14px;font-weight:700;font-size:24px">HCLTech</span>
    <div style="font-size:12px;opacity:.85;margin:4px 0 0 76px">Supercharging Progress™</div>
  </div>
  <p><b>Hello Naveen,</b></p>
  <p>We are excited to share an opportunity for you at HCL Technologies!</p>
  <p>Join our team and be a part of innovation, growth and meaningful change.</p>
  ${btn("View Job Details →")}
  <p>Best Regards,<br>HCL Careers Team</p>
  <div style="background:#f3f0ff;border-radius:10px;padding:14px 18px;font-size:13px;color:#4b4670;margin-top:18px"><b style="color:#5b3df0">Tip:</b> Keep your profile updated for more opportunities!</div>`);

const simple = (title, body, cta) => wrap(`<h2 style="margin:0 0 12px;font-size:20px">${title}</h2>${body}${cta ? btn(cta) : ""}`);

export function createDemo() {
  const mk = (id, fromName, fromEmail, subject, snippet, date, labels, html) =>
    ({ id, fromName, fromEmail, to: "vaddenaveen77@gmail.com", subject, snippet, date, labels, html, text: "", attachments: [] });

  const items = [
    mk("d1", "Google Careers", "careers@google.com", "HCL Technologies – Job Opportunity", "Hi Naveen, We are excited to share an opportunity...", at(0, 9, 38), ["INBOX", "UNREAD", "STARRED"], hcl),
    mk("d2", "TCS NQT", "nqt@tcs.com", "TCS NQT 2027 – Registration Open", "Dear Candidate, TCS NQT is now open for 2027 batch...", at(0, 8, 52), ["INBOX", "UNREAD"], simple("TCS NQT 2027 registrations are open", "<p>Dear Candidate,</p><p>The National Qualifier Test for the 2027 batch is now open. Register before the last date to be considered for TCS hiring drives.</p>", "Register now")),
    mk("d3", "Coursera", "no-reply@mail.coursera.org", "New Course Recommendation", "Boost your skills with our latest Data Science courses...", at(1, 18, 20), ["INBOX", "UNREAD"], simple("Picked for you", "<p>Boost your skills with our latest Data Science courses: Python for Everybody, Machine Learning Specialization and SQL for Data Analysis.</p>", "Explore courses")),
    mk("d4", "HDFC Bank", "alerts@hdfcbank.net", "Transaction Alert: ₹5,000", "Your account has been debited by ₹5,000...", at(1, 14, 5), ["INBOX", "UNREAD"], simple("Transaction alert", "<p>Your account XX4821 has been debited by <b>₹5,000.00</b> on a UPI payment. If this wasn't you, call your bank immediately.</p>")),
    mk("d5", "Amazon.in", "shipment-tracking@amazon.in", "Your Order is on the Way", "Track your order #171-2345678...", at(1, 11, 12), ["INBOX"], simple("Your package is out for delivery", "<p>Order <b>#171-2345678</b> will arrive today by 8 PM.</p>", "Track your order")),
    mk("d6", "YouTube", "noreply@youtube.com", "New comment on your video", "A viewer commented: 'Great video!'", at(3, 17, 45), ["INBOX"], simple("New comment", "<p>A viewer commented: <i>“Great video!”</i></p>", "Reply")),
    mk("d7", "Flipkart", "offers@flipkart.com", "Big Billion Days – Top Deals", "Get up to 80% OFF on your favorite products...", at(3, 10, 30), ["INBOX", "CATEGORY_PROMOTIONS"], simple("Big Billion Days is live", "<p>Get up to <b>80% OFF</b> on electronics, fashion and home. Limited time only.</p>", "Shop deals")),
    mk("d8", "LinkedIn Job Alerts", "jobalerts-noreply@linkedin.com", "Junior Python Developer – 14 new jobs for you", "Based on your profile: Python Developer at Infosys...", at(4, 9, 10), ["INBOX", "UNREAD"], simple("14 new jobs for you", "<p>Python Developer · Infosys · Hyderabad<br>Software Engineer Trainee · Wipro · Bengaluru</p>", "See all jobs")),
    mk("d9", "NPTEL", "noreply@nptel.iitm.ac.in", "Assignment 4 deadline extended", "The submission deadline for Assignment 4 has been extended...", at(4, 16, 0), ["INBOX"], simple("Assignment deadline extended", "<p>The submission deadline for Assignment 4 has been extended to Friday 11:59 PM.</p>")),
    mk("d10", "Ravi Kumar", "ravi.kumar@gmail.com", "Weekend trip plan?", "Hey Naveen, are we still on for the weekend trip?", at(5, 20, 15), ["INBOX", "UNREAD"], simple("Weekend trip plan?", "<p>Hey Naveen, are we still on for the weekend trip? Let me know so I can book the tickets.</p>")),
    mk("d11", "Airtel", "billing@airtel.in", "Your bill of ₹499 is due", "Your postpaid bill for this month is ready...", at(6, 8, 40), ["INBOX"], simple("Bill ready", "<p>Your postpaid bill of <b>₹499</b> is due in 3 days.</p>", "Pay now")),
    mk("d12", "Myntra", "hello@myntra.com", "Flash sale: 60% off sneakers", "Limited time offer ends tonight...", at(6, 12, 0), ["INBOX", "CATEGORY_PROMOTIONS"], simple("Flash sale", "<p>60% off sneakers. Limited time offer ends tonight.</p>", "Shop now")),
    mk("d13", "Lucky Draw", "winner@prize-claim.example", "You have won ₹10,00,000!!!", "Click here to claim your prize now...", at(2, 3, 12), ["SPAM", "UNREAD"], simple("Congratulations!", "<p>Click here to claim your prize now.</p>")),
    mk("d14", "Internshala", "no-reply@internshala.com", "Application received – Web Developer Intern", "We have received your application...", at(12, 15, 30), ["UNREAD"].slice(1), simple("Application received", "<p>We have received your application for Web Developer Intern.</p>")),
    mk("d15", "Swiggy", "noreply@swiggy.in", "Your order was delivered", "Hope you enjoyed your meal...", at(15, 21, 5), [], simple("Delivered", "<p>Hope you enjoyed your meal!</p>"))
  ];
  let polls = 0;

  return {
    name: "demo",
    async load(kind, { q = "" } = {}) {
      if (kind === "inbox" && ++polls === 3)   // simulate a brand-new email arriving during a sync
        items.unshift(mk("d_new", "Wipro Talent", "talent@wipro.com", "Interview Invitation – Associate Engineer", "Dear Candidate, you are shortlisted for the interview round...", Date.now(), ["INBOX", "UNREAD"],
          simple("You are shortlisted", "<p>Dear Candidate, you are shortlisted for the interview round on Monday at 10:30 AM.</p>", "Confirm slot")));
      const f = {
        inbox: m => m.labels.includes("INBOX"),
        spam: m => m.labels.includes("SPAM"),
        archive: m => !["INBOX", "SPAM", "TRASH"].some(l => m.labels.includes(l)),
        search: m => !m.labels.includes("TRASH") && `${m.fromName} ${m.fromEmail} ${m.subject} ${m.snippet}`.toLowerCase().includes(q.toLowerCase())
      }[kind];
      return items.filter(f).sort((a, b) => b.date - a.date);
    },
    async full(id) { const m = items.find(x => x.id === id); return { html: m.html, text: "", attachments: [] }; },
    async attachment() { return new Blob(["demo"]); },
    async modify(id, add = [], remove = []) {
      const m = items.find(x => x.id === id); if (!m) return;
      m.labels = [...new Set(m.labels.filter(l => !remove.includes(l)).concat(add))];
    },
    async trash(id) { return this.modify(id, ["TRASH"], ["INBOX"]); }
  };
}
