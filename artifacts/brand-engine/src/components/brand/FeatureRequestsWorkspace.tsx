import { useState, useEffect } from "react";
import { Loader2, Trash2, MessageSquarePlus, RefreshCw, Link, ExternalLink, Lock } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
const ACCESS_PASSWORD = "brandengine_2026";

interface FeatureRequest {
  id: string;
  name: string;
  email: string;
  category: string;
  description: string;
  links?: string[];
  attachments?: { name: string }[];
  timestamp: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "New Feature": "bg-[rgba(40,150,251,0.15)] text-[#2896FB] border-[rgba(40,150,251,0.2)]",
  "Improvement": "bg-[rgba(0,178,169,0.15)] text-[#00B2A9] border-[rgba(0,178,169,0.2)]",
  "New Template": "bg-[rgba(168,85,247,0.15)] text-[#A855F7] border-[rgba(168,85,247,0.2)]",
  "Bug Report": "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.2)]",
  "Other": "bg-[rgba(148,163,184,0.15)] text-[#94A3B8] border-[rgba(148,163,184,0.2)]",
};

export function FeatureRequestsWorkspace() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("fr_auth") === "1");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/feature-requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.reverse());
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`${BASE}api/feature-request/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(null);
    }
  };

  const handleUnlock = () => {
    if (password === ACCESS_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem("fr_auth", "1");
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  useEffect(() => { if (authed) fetchRequests(); }, [authed]);

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  if (!authed) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-[320px] flex flex-col items-center">
          <div className="w-[56px] h-[56px] rounded-full bg-[rgba(40,150,251,0.1)] flex items-center justify-center mb-[20px]">
            <Lock className="w-[24px] h-[24px] text-[#2896FB]" />
          </div>
          <h3 className="text-white text-[16px] font-bold mb-[4px]">Password Required</h3>
          <p className="text-[#64748B] text-[12px] mb-[20px] text-center">Enter the password to view feature requests</p>
          <div className="w-full flex gap-[8px]">
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError(false); }}
              onKeyDown={e => e.key === "Enter" && handleUnlock()}
              placeholder="Enter password"
              className={`flex-1 py-[10px] px-[14px] bg-[rgba(255,255,255,0.04)] border rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] placeholder:text-[#334155] font-['Poppins'] transition-colors ${authError ? "border-[rgba(239,68,68,0.4)]" : "border-[rgba(255,255,255,0.08)]"}`}
            />
            <button
              onClick={handleUnlock}
              className="py-[10px] px-[18px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-all hover:shadow-[0_4px_20px_rgba(40,150,251,0.3)]"
              style={{ background: "linear-gradient(135deg, #2896FB, #095DC3)" }}
            >
              Unlock
            </button>
          </div>
          {authError && <p className="text-[#EF4444] text-[11px] mt-[8px]">Incorrect password</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 px-[32px] py-[20px] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <div>
          <h2 className="text-white text-[18px] font-bold m-0">Feature Requests</h2>
          <p className="text-[#64748B] text-[12px] mt-[2px] m-0">{requests.length} request{requests.length !== 1 ? "s" : ""} submitted</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-[6px] py-[8px] px-[14px] rounded-[10px] text-[12px] font-semibold bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white hover:border-[rgba(255,255,255,0.15)] cursor-pointer transition-all"
        >
          <RefreshCw className="w-[13px] h-[13px]" /> Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-[32px] sidebar-scroll">
        {loading ? (
          <div className="flex items-center justify-center py-[80px]">
            <Loader2 className="w-[24px] h-[24px] text-[#2896FB] animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[80px]">
            <div className="w-[64px] h-[64px] rounded-full bg-[rgba(40,150,251,0.08)] flex items-center justify-center mb-[16px]">
              <MessageSquarePlus className="w-[28px] h-[28px] text-[#2896FB] opacity-50" />
            </div>
            <p className="text-[#64748B] text-[14px] font-medium">No feature requests yet</p>
            <p className="text-[#475569] text-[12px] mt-[4px]">Requests from the bubble will appear here</p>
          </div>
        ) : (
          <div className="grid gap-[12px] max-w-[800px]">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-[20px] hover:border-[rgba(40,150,251,0.15)] transition-all group"
              >
                <div className="flex items-start justify-between mb-[10px]">
                  <div className="flex items-center gap-[10px]">
                    <div className="w-[34px] h-[34px] rounded-full bg-[rgba(40,150,251,0.1)] flex items-center justify-center text-[#2896FB] text-[13px] font-bold uppercase">
                      {req.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[#E2E8F0] text-[14px] font-semibold">{req.name}</div>
                      <div className="text-[#64748B] text-[11px]">{req.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <span className={`text-[10px] font-bold px-[10px] py-[3px] rounded-full border ${CATEGORY_COLORS[req.category] || CATEGORY_COLORS["Other"]}`}>
                      {req.category}
                    </span>
                    <button
                      onClick={() => deleteRequest(req.id)}
                      disabled={deleting === req.id}
                      className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] opacity-0 group-hover:opacity-100 bg-transparent border border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#EF4444] hover:border-[rgba(239,68,68,0.3)] cursor-pointer transition-all disabled:opacity-50"
                      title="Delete request"
                    >
                      {deleting === req.id ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <Trash2 className="w-[12px] h-[12px]" />}
                    </button>
                  </div>
                </div>

                <p className="text-[#CBD5E1] text-[13px] leading-[1.6] m-0 whitespace-pre-wrap">{req.description}</p>

                {req.links && req.links.length > 0 && (
                  <div className="flex flex-wrap gap-[6px] mt-[10px]">
                    {req.links.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-[4px] py-[3px] px-[8px] rounded-[6px] bg-[rgba(40,150,251,0.08)] text-[#7CC8FF] text-[11px] hover:bg-[rgba(40,150,251,0.15)] transition-colors no-underline"
                      >
                        <ExternalLink className="w-[10px] h-[10px]" />
                        {link.length > 40 ? link.slice(0, 40) + "..." : link}
                      </a>
                    ))}
                  </div>
                )}

                {req.attachments && req.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-[6px] mt-[6px]">
                    {req.attachments.map((att, i) => (
                      <span key={i} className="flex items-center gap-[4px] py-[3px] px-[8px] rounded-[6px] bg-[rgba(255,255,255,0.04)] text-[#94A3B8] text-[11px]">
                        {att.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-[12px] text-[#475569] text-[10px]">{formatDate(req.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
