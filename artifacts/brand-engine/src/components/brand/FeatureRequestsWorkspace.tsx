import { useState, useEffect } from "react";
import { Loader2, Trash2, MessageSquarePlus, RefreshCw } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface FeatureRequest {
  id: string;
  name: string;
  email: string;
  category: string;
  description: string;
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
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchRequests(); }, []);

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

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
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-[20px] hover:border-[rgba(40,150,251,0.15)] transition-all"
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
                  <span className={`text-[10px] font-bold px-[10px] py-[3px] rounded-full border ${CATEGORY_COLORS[req.category] || CATEGORY_COLORS["Other"]}`}>
                    {req.category}
                  </span>
                </div>
                <p className="text-[#CBD5E1] text-[13px] leading-[1.6] m-0 whitespace-pre-wrap">{req.description}</p>
                <div className="mt-[12px] text-[#475569] text-[10px]">{formatDate(req.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
