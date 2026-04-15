import { useState } from "react";
import { MessageSquarePlus, X, Send, Loader2, CheckCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const CATEGORIES = [
  "New Feature",
  "Improvement",
  "New Template",
  "Bug Report",
  "Other",
];

export function FeatureRequestBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("New Feature");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch(`${BASE}api/feature-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), category, description: description.trim() }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
        setName("");
        setEmail("");
        setCategory("New Feature");
        setDescription("");
      }, 2500);
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[24px] right-[24px] z-[9999] w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer border-none shadow-[0_4px_24px_rgba(40,150,251,0.4),0_0_0_1px_rgba(40,150,251,0.2)] transition-all duration-300 hover:shadow-[0_6px_32px_rgba(40,150,251,0.5)] hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #2896FB, #095DC3)" }}
      >
        {isOpen ? (
          <X className="w-[22px] h-[22px] text-white" />
        ) : (
          <MessageSquarePlus className="w-[22px] h-[22px] text-white" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-[88px] right-[24px] z-[9998] w-[340px] rounded-[16px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(40,150,251,0.15)]" style={{ background: "#0C1425" }}>
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-[48px] px-[24px]">
              <div className="w-[56px] h-[56px] rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center mb-[16px]">
                <CheckCircle className="w-[28px] h-[28px] text-[#22C55E]" />
              </div>
              <p className="text-white text-[15px] font-semibold mb-[4px]">Request Sent!</p>
              <p className="text-[#64748B] text-[12px] text-center">Thanks for your feedback. We'll review it soon.</p>
            </div>
          ) : (
            <>
              <div className="px-[20px] py-[16px]" style={{ background: "linear-gradient(135deg, rgba(40,150,251,0.15), rgba(9,93,195,0.1))" }}>
                <h3 className="text-white text-[15px] font-bold m-0">Request a Feature</h3>
                <p className="text-[#64748B] text-[11px] mt-[2px] m-0">Tell us what you'd like to see in Brand Engine</p>
              </div>

              <div className="p-[20px] flex flex-col gap-[14px]">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px] block">Your Name *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full py-[9px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] placeholder:text-[#334155] font-['Poppins'] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px] block">Email <span className="normal-case tracking-normal font-normal">(optional)</span></label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@company.com"
                    type="email"
                    className="w-full py-[9px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] placeholder:text-[#334155] font-['Poppins'] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px] block">Category</label>
                  <div className="flex flex-wrap gap-[6px]">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`py-[5px] px-[10px] rounded-[8px] text-[11px] font-semibold border cursor-pointer transition-all ${
                          category === cat
                            ? "bg-[rgba(40,150,251,0.15)] border-[rgba(40,150,251,0.3)] text-[#2896FB]"
                            : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(255,255,255,0.1)]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px] block">What do you need? *</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the feature or improvement you'd like..."
                    rows={4}
                    className="w-full py-[9px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] placeholder:text-[#334155] font-['Poppins'] resize-none transition-colors leading-[1.5]"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !name.trim() || !description.trim()}
                  className="w-full flex items-center justify-center gap-[8px] py-[11px] rounded-[12px] text-[13px] font-bold cursor-pointer transition-all text-white border-none disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_4px_20px_rgba(40,150,251,0.3)]"
                  style={{ background: "linear-gradient(135deg, #2896FB, #095DC3)" }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-[16px] h-[16px] animate-spin" />
                  ) : (
                    <Send className="w-[14px] h-[14px]" />
                  )}
                  {isSubmitting ? "Sending..." : "Submit Request"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
