// Automatic categorization engine.
// Every email gets a score per category from: sender domain, sender text, subject (x2), snippet,
// Gmail's own tab labels, and the user's custom keywords. Highest score wins; weak scores become "Other".
// A per-sender override (set from the reading pane) always wins.
export const CATEGORIES = ["Career", "Education", "Finance", "Shopping", "Personal", "Promotions", "Other"];

const RULES = {
  Career: [[/\b(jobs?|careers?|recruit\w*|interview|hiring|vacanc\w*|applications?|opportunit\w*|placements?|internships?|resume|cv|offer letter|nqt|campus|walk-?in|openings?|candidate|shortlisted)\b/i, 3]],
  Education: [[/\b(courses?|class(es)?|exam\w*|assignments?|students?|scholarships?|lectures?|admissions?|semester|universit\w*|college|tutorials?|certificat\w*|learning|nptel|syllabus|webinar|workshop)\b/i, 3]],
  Finance: [[/\b(bank|transactions?|debited|credited|payments?|invoice|statement|refund|salary|tax|bills?|credit card|debit|upi|a\/c|balance|emi|loan|mutual fund|insurance|inr)\b/i, 3], [/(₹|\brs\.?\s?\d)/i, 3]],
  Shopping: [[/\b(orders?|ordered|shipped|shipment|deliver\w*|out for delivery|tracking|track your|purchase\w*|cart|receipt|dispatch\w*|return)\b/i, 3]],
  Promotions: [[/\b(sale|discounts?|deals?|coupons?|newsletter|promo\w*|limited time|unsubscribe|big billion|mega|save up|flash|exclusive)\b/i, 3], [/\d+\s?%\s?off/i, 3]],
  Personal: [[/\b(family|friends?|birthday|invit\w+|comment\w*|mention\w*|replied|dinner|party|wedding|photos?|hey|hi\s+\w+|weekend)\b/i, 2]]
};

// [substring of sender domain, category]
const DOMAINS = [
  ["linkedin", "Career"], ["naukri", "Career"], ["indeed", "Career"], ["glassdoor", "Career"], ["internshala", "Career"],
  ["foundit", "Career"], ["wellfound", "Career"], ["tcs.com", "Career"], ["hcltech", "Career"], ["infosys", "Career"],
  ["wipro", "Career"], ["accenture", "Career"], ["cognizant", "Career"],
  ["coursera", "Education"], ["udemy", "Education"], ["edx.", "Education"], ["nptel", "Education"], ["swayam", "Education"],
  ["khanacademy", "Education"], ["unacademy", "Education"], ["upgrad", "Education"], ["simplilearn", "Education"], [".edu", "Education"], [".ac.in", "Education"],
  ["hdfcbank", "Finance"], ["sbi.co", "Finance"], ["icicibank", "Finance"], ["axisbank", "Finance"], ["kotak", "Finance"],
  ["paytm", "Finance"], ["phonepe", "Finance"], ["razorpay", "Finance"], ["paypal", "Finance"], ["zerodha", "Finance"], ["groww", "Finance"],
  ["amazon", "Shopping"], ["flipkart", "Shopping"], ["myntra", "Shopping"], ["ajio", "Shopping"], ["meesho", "Shopping"],
  ["ebay", "Shopping"], ["swiggy", "Shopping"], ["zomato", "Shopping"], ["bigbasket", "Shopping"], ["nykaa", "Shopping"],
  ["youtube", "Personal"], ["facebook", "Personal"], ["instagram", "Personal"], ["whatsapp", "Personal"], ["snapchat", "Personal"],
  ["pinterest", "Personal"], ["reddit", "Personal"], ["telegram", "Personal"], ["twitter", "Personal"]
];

/** "mail.coursera.org" → "coursera.org", "x.co.in" → "x.co.in" */
export function regDomain(email = "") {
  const host = (email.split("@")[1] || "").toLowerCase();
  const p = host.split(".");
  if (p.length <= 2) return host;
  return p.at(-1).length === 2 && p.at(-2).length <= 3 ? p.slice(-3).join(".") : p.slice(-2).join(".");
}

export function categorize(m, customRules = {}, overrides = {}) {
  const email = (m.fromEmail || "").toLowerCase();
  if (overrides[email]) return overrides[email];

  const subj = m.subject || "", snip = m.snippet || "", from = `${m.fromName || ""} ${email}`;
  const score = Object.fromEntries(CATEGORIES.map(c => [c, 0]));

  for (const [cat, list] of Object.entries(RULES))
    for (const [re, w] of list) {
      if (re.test(subj)) score[cat] += w * 2;
      if (re.test(snip)) score[cat] += w;
      if (re.test(from)) score[cat] += w * 1.5;
    }

  const text = `${subj} ${snip} ${from}`.toLowerCase();
  for (const [cat, str] of Object.entries(customRules))
    for (const kw of String(str).split(",").map(s => s.trim().toLowerCase()).filter(Boolean))
      if (text.includes(kw)) score[cat] += 6;

  const domain = regDomain(email);
  const hit = DOMAINS.find(([key]) => domain.includes(key));
  if (hit) score[hit[1]] += 4;

  const labels = m.labels || [];
  if (labels.includes("CATEGORY_PROMOTIONS")) score.Promotions += 4;
  if (labels.includes("CATEGORY_SOCIAL") || labels.includes("CATEGORY_PERSONAL")) score.Personal += 3;

  const [best, top] = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return top >= 3 ? best : "Other";
}
