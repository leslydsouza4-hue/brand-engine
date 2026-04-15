import { useState, useRef } from "react";
import { MessageSquarePlus, X, Send, Loader2, CheckCircle, Link, Plus, Image as ImageIcon, Trash2 } from "lucide-react";

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
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; dataUrl: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addLink = () => {
    const trimmed = linkInput.trim();
    if (trimmed && !links.includes(trimmed)) {
      setLinks([...links, trimmed]);
      setLinkInput("");
    }
  };

  const removeLink = (idx: number) => setLinks(links.filter((_, i) => i !== idx));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachments(prev => [...prev, { name: file.name, dataUrl: ev.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeAttachment = (idx: number) => setAttachments(attachments.filter((_, i) => i !== idx));

  const canSubmit = name.trim() && email.trim() && description.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await fetch(`${BASE}api/feature-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          description: description.trim(),
          links,
          attachments: attachments.map(a => ({ name: a.name })),
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
        setName("");
        setEmail("");
        setCategory("New Feature");
        setDescription("");
        setLinks([]);
        setLinkInput("");
        setAttachments([]);
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
        <div className="fixed bottom-[88px] right-[24px] z-[9998] w-[360px] max-h-[80vh] rounded-[16px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(40,150,251,0.15)] flex flex-col" style={{ background: "#0C1425" }}>
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
              <div className="px-[20px] py-[16px] shrink-0" style={{ background: "linear-gradient(135deg, rgba(40,150,251,0.15), rgba(9,93,195,0.1))" }}>
                <h3 className="text-white text-[15px] font-bold m-0">Request a Feature</h3>
                <p className="text-[#64748B] text-[11px] mt-[2px] m-0">Tell us what you'd like to see in Brand Engine</p>
              </div>

              <div className="p-[20px] flex flex-col gap-[12px] overflow-y-auto sidebar-scroll">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px] block">Your Name <span className="text-[#EF4444]">*</span></label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full py-[9px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] placeholder:text-[#334155] font-['Poppins'] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px] block">Email <span className="text-[#EF4444]">*</span></label>
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
                  <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px] block">What do you need? <span className="text-[#EF4444]">*</span></label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the feature or improvement you'd like..."
                    rows={3}
                    className="w-full py-[9px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] placeholder:text-[#334155] font-['Poppins'] resize-none transition-colors leading-[1.5]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px] block">Links <span className="normal-case tracking-normal font-normal text-[#475569]">(Figma, Docs, etc.)</span></label>
                  <div className="flex gap-[6px]">
                    <input
                      value={linkInput}
                      onChange={e => setLinkInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addLink()}
                      placeholder="https://figma.com/..."
                      className="flex-1 py-[7px] px-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] text-[12px] text-[#E2E8F0] outline-none focus:border-[rgba(40,150,251,0.4)] placeholder:text-[#334155] font-['Poppins'] transition-colors"
                    />
                    <button
                      onClick={addLink}
                      disabled={!linkInput.trim()}
                      className="w-[32px] h-[32px] flex items-center justify-center rounded-[8px] bg-[rgba(40,150,251,0.1)] border border-[rgba(40,150,251,0.2)] text-[#2896FB] cursor-pointer transition-all hover:bg-[rgba(40,150,251,0.2)] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                  {links.length > 0 && (
                    <div className="flex flex-col gap-[4px] mt-[6px]">
                      {links.map((link, i) => (
                        <div key={i} className="flex items-center gap-[6px] py-[4px] px-[8px] bg-[rgba(40,150,251,0.06)] rounded-[6px]">
                          <Link className="w-[10px] h-[10px] text-[#2896FB] shrink-0" />
                          <span className="text-[11px] text-[#7CC8FF] truncate flex-1">{link}</span>
                          <button onClick={() => removeLink(i)} className="text-[#64748B] hover:text-[#EF4444] cursor-pointer bg-transparent border-none p-0 transition-colors">
                            <X className="w-[10px] h-[10px]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[6px] block">Attachments <span className="normal-case tracking-normal font-normal text-[#475569]">(images, files)</span></label>
                  <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-[6px] py-[8px] rounded-[8px] text-[11px] font-semibold bg-[rgba(255,255,255,0.03)] border border-dashed border-[rgba(255,255,255,0.1)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(255,255,255,0.2)] cursor-pointer transition-all"
                  >
                    <ImageIcon className="w-[12px] h-[12px]" /> Add files (max 5MB each)
                  </button>
                  {attachments.length > 0 && (
                    <div className="flex flex-col gap-[4px] mt-[6px]">
                      {attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-[6px] py-[4px] px-[8px] bg-[rgba(255,255,255,0.03)] rounded-[6px]">
                          <ImageIcon className="w-[10px] h-[10px] text-[#94A3B8] shrink-0" />
                          <span className="text-[11px] text-[#CBD5E1] truncate flex-1">{att.name}</span>
                          <button onClick={() => removeAttachment(i)} className="text-[#64748B] hover:text-[#EF4444] cursor-pointer bg-transparent border-none p-0 transition-colors">
                            <X className="w-[10px] h-[10px]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canSubmit}
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
