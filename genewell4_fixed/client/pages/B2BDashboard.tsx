import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Building2, Plus, Copy, CheckCircle, ExternalLink, Users,
  FileText, Clock, Crown, LogOut, RefreshCw, Link as LinkIcon,
  BarChart3, AlertCircle, Mail, ChevronRight, Sparkles, Gift,
} from "lucide-react";

interface B2BClient {
  id: string; businessName: string; contactName: string;
  email: string; phone: string; plan: "trial" | "paid";
  trialExpiresAt: string; reportsGenerated: number; createdAt: string;
}
interface B2BLink {
  token: string; label: string; recipientEmail: string;
  isUsed: boolean; analysisId: string | null;
  quizUrl: string; createdAt: string; usedAt: string | null;
}
interface Stats {
  totalLinks: number; usedLinks: number; pendingLinks: number;
  reportsGenerated: number; daysRemaining: number; planStatus: string;
}

export default function B2BDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState<B2BClient | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [links, setLinks] = useState<B2BLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "links" | "upgrade">("overview");

  // Create-link form
  const [newLabel, setNewLabel] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copiedToken, setCopiedToken] = useState("");

  const token = () => localStorage.getItem("b2bToken") || "";

  const authFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
    const res = await fetch(url, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
    });
    return res.json();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, linksRes] = await Promise.all([
        authFetch("/api/b2b/stats"),
        authFetch("/api/b2b/links"),
      ]);
      if (!statsRes.success) { navigate("/b2b/login"); return; }
      setClient(statsRes.client);
      setStats(statsRes.stats);
      setLinks(linksRes.links || []);
    } catch { navigate("/b2b/login"); }
    finally { setLoading(false); }
  }, [authFetch, navigate]);

  useEffect(() => { if (!token()) { navigate("/b2b/login"); return; } load(); }, [load, navigate]);

  const createLink = async () => {
    setCreateError("");
    if (!newLabel.trim()) return setCreateError("Please enter a name for this user.");
    setCreating(true);
    try {
      const data = await authFetch("/api/b2b/links", {
        method: "POST",
        body: JSON.stringify({ label: newLabel.trim(), recipientEmail: newEmail.trim() }),
      });
      if (!data.success) return setCreateError(data.message || "Failed to create link.");
      setLinks(l => [{ ...data.link, quizUrl: data.link.quizUrl }, ...l]);
      setStats(s => s ? { ...s, totalLinks: s.totalLinks + 1, pendingLinks: s.pendingLinks + 1 } : s);
      setNewLabel(""); setNewEmail("");
    } catch { setCreateError("Network error. Please try again."); }
    finally { setCreating(false); }
  };

  const copyLink = (url: string, token: string) => {
    const full = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(full);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(""), 2000);
  };

  const handleUpgradeClick = () => {
    window.open("https://www.instamojo.com/@famechase/?data_amount=1999&data_purpose=GeneWell+B2B+All+Access", "_blank");
  };

  const handleLogout = () => {
    localStorage.removeItem("b2bToken");
    localStorage.removeItem("b2bClient");
    navigate("/b2b/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-purple-700 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  const isTrialExpired = client?.plan === "trial" && stats && stats.daysRemaining === 0;
  const isTrialSoon = client?.plan === "trial" && stats && stats.daysRemaining > 0 && stats.daysRemaining <= 7;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-none">{client?.businessName}</p>
              <p className="text-xs text-slate-500">B2B Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={client?.plan === "paid" ? "bg-green-600" : isTrialExpired ? "bg-red-600" : "bg-purple-600"}>
              {client?.plan === "paid" ? <><Crown className="h-3 w-3 mr-1" />Paid</> : isTrialExpired ? "Trial Expired" : <><Gift className="h-3 w-3 mr-1" />Free Trial</>}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Trial Warning Banner */}
      {isTrialExpired && (
        <div className="bg-red-600 text-white text-center py-2.5 text-sm font-medium">
          ⚠️ Your free trial has expired. <button onClick={() => setTab("upgrade")} className="underline font-bold ml-1">Upgrade now →</button>
        </div>
      )}
      {isTrialSoon && (
        <div className="bg-amber-500 text-white text-center py-2.5 text-sm font-medium">
          ⏰ Trial expires in {stats?.daysRemaining} days. <button onClick={() => setTab("upgrade")} className="underline font-bold ml-1">Upgrade to keep access →</button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border rounded-xl p-1 mb-8 w-fit shadow-sm">
          {([
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "links", label: "Quiz Links", icon: LinkIcon },
            { id: "upgrade", label: client?.plan === "paid" ? "Subscription" : "Upgrade", icon: Crown },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? "bg-purple-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome back, {client?.contactName}! 👋
            </h1>
            <p className="text-slate-500 mb-8">Here's a summary of your GeneWell B2B account.</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Links Created", value: stats?.totalLinks ?? 0, icon: LinkIcon, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Reports Generated", value: stats?.reportsGenerated ?? 0, icon: FileText, color: "text-green-600", bg: "bg-green-50" },
                { label: "Pending (Unused)", value: stats?.pendingLinks ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Days Remaining", value: client?.plan === "paid" ? "∞" : (stats?.daysRemaining ?? 0), icon: Crown, color: "text-purple-600", bg: "bg-purple-50" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <Card key={label} className="border-0 shadow-sm">
                  <CardContent className="pt-5 pb-4">
                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Create */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-600" />
                  Generate Quiz Link for a User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-slate-600 mb-1 block">User Name / Label *</Label>
                    <Input
                      placeholder="e.g. Priya Sharma or Employee #42"
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && createLink()}
                      disabled={!!isTrialExpired}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-slate-600 mb-1 block">User Email (optional)</Label>
                    <Input
                      type="email"
                      placeholder="user@email.com"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      disabled={!!isTrialExpired}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={createLink}
                      disabled={creating || !!isTrialExpired}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 w-full sm:w-auto"
                    >
                      {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Generate Link</>}
                    </Button>
                  </div>
                </div>
                {createError && <p className="text-red-600 text-sm mt-2">{createError}</p>}
                <p className="text-xs text-slate-500 mt-3">
                  Each link opens the GeneWell quiz for your user. After completing it, they get a <strong>free premium report</strong> — no payment needed from them.
                </p>
              </CardContent>
            </Card>

            {/* Recent Links */}
            {links.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Recent Quiz Links</CardTitle>
                  <button onClick={() => setTab("links")} className="text-sm text-purple-600 font-medium flex items-center gap-1">
                    View all <ChevronRight className="h-4 w-4" />
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {links.slice(0, 5).map(link => (
                      <LinkRow key={link.token} link={link} copied={copiedToken === link.token} onCopy={copyLink} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── LINKS TAB ── */}
        {tab === "links" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Quiz Links</h2>
                <p className="text-slate-500 text-sm mt-1">Share these links with your users. Each link unlocks a free premium report.</p>
              </div>
              <Button
                onClick={() => { setTab("overview"); setTimeout(() => document.getElementById("createLinkInput")?.focus(), 100); }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!!isTrialExpired}
              >
                <Plus className="h-4 w-4 mr-2" />New Link
              </Button>
            </div>

            {/* Create form */}
            <Card className="border-purple-200 bg-purple-50/50 mb-6">
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input id="createLinkInput" placeholder="User name / label *" value={newLabel} onChange={e => setNewLabel(e.target.value)} disabled={!!isTrialExpired} />
                  <Input type="email" placeholder="User email (optional)" value={newEmail} onChange={e => setNewEmail(e.target.value)} disabled={!!isTrialExpired} />
                  <Button onClick={createLink} disabled={creating || !!isTrialExpired} className="bg-purple-600 text-white shrink-0">
                    {creating ? "Creating..." : "Generate Link"}
                  </Button>
                </div>
                {createError && <p className="text-red-600 text-sm mt-2">{createError}</p>}
              </CardContent>
            </Card>

            {links.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No links yet</p>
                <p className="text-sm mt-1">Generate your first quiz link above.</p>
              </div>
            ) : (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        {["User", "Email", "Status", "Report", "Created", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {links.map(link => (
                        <tr key={link.token} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800">{link.label}</td>
                          <td className="px-4 py-3 text-slate-500">{link.recipientEmail || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${link.isUsed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                              {link.isUsed ? <><CheckCircle className="h-3 w-3" />Completed</> : <><Clock className="h-3 w-3" />Pending</>}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {link.isUsed ? <span className="text-green-600 font-medium text-xs">✓ Generated</span> : <span className="text-slate-400 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{new Date(link.createdAt).toLocaleDateString("en-IN")}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyLink(link.quizUrl, link.token)}
                                className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-xs font-medium"
                              >
                                {copiedToken === link.token ? <><CheckCircle className="h-3.5 w-3.5 text-green-500" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy Link</>}
                              </button>
                              <a
                                href={`${window.location.origin}${link.quizUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── UPGRADE TAB ── */}
        {tab === "upgrade" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
              {client?.plan === "paid" ? "Your Subscription" : "Upgrade to Full Access"}
            </h2>
            <p className="text-slate-500 text-center mb-8">
              {client?.plan === "paid" ? "You have full unlimited access." : "Keep your B2B access after the free trial."}
            </p>

            {client?.plan === "paid" ? (
              <Card className="border-green-200 bg-green-50 text-center p-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-2">All Access Active</h3>
                <p className="text-green-700">Your subscription is active and will renew on {new Date(client.trialExpiresAt).toLocaleDateString("en-IN")}.</p>
              </Card>
            ) : (
              <Card className="border-2 border-purple-400 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 text-center">
                  <Crown className="h-10 w-10 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">All Access — B2B</h3>
                  <p className="text-purple-200 mt-1">Everything included · No per-report cost</p>
                </div>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-slate-400 line-through text-lg">₹6,499</div>
                    <div className="text-5xl font-bold text-purple-700">₹1,999</div>
                    <div className="text-slate-500 text-sm">one-time · 1-year access</div>
                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 inline-block mt-2">
                      <span className="text-green-700 text-sm font-semibold">You save ₹4,500 (69% off)</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {[
                      "Unlimited quiz link generation",
                      "Every user gets a premium 35+ page report",
                      "All add-ons included (Women's Health, DNA, Supplements...)",
                      "Admin dashboard to track all reports",
                      "No payment required from your users",
                      "Priority email support",
                    ].map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleUpgradeClick}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 text-base"
                    size="lg"
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    Upgrade — Pay ₹1,999
                  </Button>
                  <p className="text-xs text-center text-slate-400 mt-2">
                    Secure payment via Instamojo · UPI · Cards · Net Banking
                  </p>

                  {isTrialExpired ? (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mx-auto mb-1" />
                      <p className="text-sm text-red-700 font-medium">Trial Expired — Link generation paused</p>
                      <p className="text-xs text-red-600 mt-0.5">Upgrade to restore full access immediately.</p>
                    </div>
                  ) : (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                      <Sparkles className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                      <p className="text-sm text-amber-800 font-medium">Trial ends in {stats?.daysRemaining} days</p>
                      <p className="text-xs text-amber-700 mt-0.5">All your generated links continue to work after upgrading.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">Questions? <a href="mailto:support@genewell.in" className="text-purple-600 font-medium">Contact us →</a></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: Link Row ──
function LinkRow({ link, copied, onCopy }: { link: B2BLink; copied: boolean; onCopy: (url: string, token: string) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${link.isUsed ? "bg-green-100" : "bg-amber-100"}`}>
          {link.isUsed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-amber-600" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-800 text-sm truncate">{link.label}</p>
          <p className="text-xs text-slate-400">{link.recipientEmail || "No email"} · {new Date(link.createdAt).toLocaleDateString("en-IN")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {link.isUsed && <span className="text-xs text-green-600 font-medium hidden sm:block">Report ready</span>}
        <button
          onClick={() => onCopy(link.quizUrl, link.token)}
          className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
