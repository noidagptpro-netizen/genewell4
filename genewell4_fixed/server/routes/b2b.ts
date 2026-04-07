import { RequestHandler } from "express";
import crypto from "crypto";

// ──────────────────────────────────────────────────────────────
// IN-MEMORY STORE (upgrade to DB via pool when DATABASE_URL set)
// ──────────────────────────────────────────────────────────────

export interface B2BClient {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  passwordHash: string;
  plan: "trial" | "paid";
  trialExpiresAt: string;       // ISO date
  reportsGenerated: number;
  createdAt: string;
}

export interface B2BQuizLink {
  token: string;
  clientId: string;
  label: string;                // friendly label e.g. "Priya Sharma"
  recipientEmail: string;
  isUsed: boolean;
  analysisId: string | null;
  reportTier: "premium";
  createdAt: string;
  usedAt: string | null;
}

const b2bClients = new Map<string, B2BClient>();
const b2bTokens  = new Map<string, string>();      // auth-token → clientId
const b2bLinks   = new Map<string, B2BQuizLink>(); // quiz-token → link

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────
function hash(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}
function uid(prefix = "") {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function trialExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 45);
  return d.toISOString();
}

// ──────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ──────────────────────────────────────────────────────────────
export const requireB2BAuth: RequestHandler = (req: any, res, next) => {
  const auth = req.headers["authorization"] || "";
  const token = auth.replace("Bearer ", "").trim();
  const clientId = b2bTokens.get(token);
  if (!clientId) return res.status(401).json({ success: false, message: "Unauthorized" });
  req.b2bClientId = clientId;
  next();
};

// ──────────────────────────────────────────────────────────────
// REGISTER
// ──────────────────────────────────────────────────────────────
export const b2bRegister: RequestHandler = (req, res) => {
  const { businessName, contactName, email, phone, password } = req.body;
  if (!email || !password || !businessName || !contactName)
    return res.status(400).json({ success: false, message: "All fields required" });

  const existing = [...b2bClients.values()].find(c => c.email === email);
  if (existing)
    return res.status(409).json({ success: false, message: "Email already registered" });

  const client: B2BClient = {
    id: uid("b2b_"),
    businessName,
    contactName,
    email,
    phone: phone || "",
    passwordHash: hash(password),
    plan: "trial",
    trialExpiresAt: trialExpiry(),
    reportsGenerated: 0,
    createdAt: new Date().toISOString(),
  };
  b2bClients.set(client.id, client);

  const token = uid("tok_");
  b2bTokens.set(token, client.id);

  const { passwordHash: _, ...safe } = client;
  res.status(201).json({ success: true, client: safe, token });
};

// ──────────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────────
export const b2bLogin: RequestHandler = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password required" });

  const client = [...b2bClients.values()].find(c => c.email === email);
  if (!client || client.passwordHash !== hash(password))
    return res.status(401).json({ success: false, message: "Invalid credentials" });

  const token = uid("tok_");
  b2bTokens.set(token, client.id);

  const { passwordHash: _, ...safe } = client;
  res.json({ success: true, client: safe, token });
};

// ──────────────────────────────────────────────────────────────
// ME  (get current client)
// ──────────────────────────────────────────────────────────────
export const b2bMe: RequestHandler = (req: any, res) => {
  const client = b2bClients.get(req.b2bClientId);
  if (!client) return res.status(404).json({ success: false });
  const { passwordHash: _, ...safe } = client;
  res.json({ success: true, client: safe });
};

// ──────────────────────────────────────────────────────────────
// GENERATE QUIZ LINK
// ──────────────────────────────────────────────────────────────
export const b2bCreateLink: RequestHandler = (req: any, res) => {
  const client = b2bClients.get(req.b2bClientId);
  if (!client) return res.status(404).json({ success: false });

  // Trial expiry check
  if (client.plan === "trial" && new Date(client.trialExpiresAt) < new Date())
    return res.status(403).json({ success: false, message: "Trial expired. Please upgrade to continue." });

  const { label = "Guest User", recipientEmail = "" } = req.body;
  const token = uid("qlnk_");
  const link: B2BQuizLink = {
    token,
    clientId: client.id,
    label,
    recipientEmail,
    isUsed: false,
    analysisId: null,
    reportTier: "premium",
    createdAt: new Date().toISOString(),
    usedAt: null,
  };
  b2bLinks.set(token, link);

  const quizUrl = `${process.env.APP_URL || ""}/quiz?b2b=${token}`;
  res.json({ success: true, link: { ...link, quizUrl } });
};

// ──────────────────────────────────────────────────────────────
// GET ALL LINKS FOR CLIENT
// ──────────────────────────────────────────────────────────────
export const b2bGetLinks: RequestHandler = (req: any, res) => {
  const links = [...b2bLinks.values()]
    .filter(l => l.clientId === req.b2bClientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(l => ({ ...l, quizUrl: `/quiz?b2b=${l.token}` }));
  res.json({ success: true, links });
};

// ──────────────────────────────────────────────────────────────
// VALIDATE B2B QUIZ TOKEN (called from quiz page)
// ──────────────────────────────────────────────────────────────
export const b2bValidateToken: RequestHandler = (req, res) => {
  const { token } = req.params;
  const link = b2bLinks.get(token);
  if (!link) return res.status(404).json({ success: false, message: "Invalid link" });

  const client = b2bClients.get(link.clientId);
  if (!client) return res.status(404).json({ success: false });

  if (client.plan === "trial" && new Date(client.trialExpiresAt) < new Date())
    return res.status(403).json({ success: false, message: "This link has expired." });

  res.json({
    success: true,
    tier: "premium",
    label: link.label,
    recipientEmail: link.recipientEmail,
    businessName: client.businessName,
  });
};

// ──────────────────────────────────────────────────────────────
// MARK LINK AS USED (called after quiz submit)
// ──────────────────────────────────────────────────────────────
export const b2bMarkUsed: RequestHandler = (req, res) => {
  const { token } = req.params;
  const { analysisId } = req.body;
  const link = b2bLinks.get(token);
  if (!link) return res.status(404).json({ success: false });

  link.isUsed = true;
  link.analysisId = analysisId;
  link.usedAt = new Date().toISOString();

  const client = b2bClients.get(link.clientId);
  if (client) client.reportsGenerated++;

  res.json({ success: true });
};

// ──────────────────────────────────────────────────────────────
// UPGRADE TO PAID (called after Instamojo webhook / manual)
// ──────────────────────────────────────────────────────────────
export const b2bUpgrade: RequestHandler = (req: any, res) => {
  const client = b2bClients.get(req.b2bClientId);
  if (!client) return res.status(404).json({ success: false });
  client.plan = "paid";
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  client.trialExpiresAt = expiry.toISOString();
  const { passwordHash: _, ...safe } = client;
  res.json({ success: true, client: safe });
};

// ──────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ──────────────────────────────────────────────────────────────
export const b2bStats: RequestHandler = (req: any, res) => {
  const client = b2bClients.get(req.b2bClientId);
  if (!client) return res.status(404).json({ success: false });

  const links = [...b2bLinks.values()].filter(l => l.clientId === client.id);
  const used  = links.filter(l => l.isUsed).length;

  const daysLeft = Math.max(0, Math.round(
    (new Date(client.trialExpiresAt).getTime() - Date.now()) / 86400000
  ));

  const { passwordHash: _, ...safe } = client;
  res.json({
    success: true,
    client: safe,
    stats: {
      totalLinks: links.length,
      usedLinks: used,
      pendingLinks: links.length - used,
      reportsGenerated: client.reportsGenerated,
      daysRemaining: daysLeft,
      planStatus: client.plan === "paid" ? "Active (Paid)" : daysLeft > 0 ? `Trial — ${daysLeft} days left` : "Trial Expired",
    },
  });
};
