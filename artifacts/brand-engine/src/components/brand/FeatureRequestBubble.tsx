import { useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";

const CLICKUP_FORM_URL = "https://forms.clickup.com/8631005/f/87cpx-524296/1HRPU6K9BX6Z6X184D";

export function FeatureRequestBubble() {
  const [isOpen, setIsOpen] = useState(false);

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
        <div className="fixed bottom-[88px] right-[24px] z-[9998] w-[420px] rounded-[16px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(40,150,251,0.15)] flex flex-col" style={{ background: "#0C1425", height: "min(80vh, 640px)" }}>
          <div className="px-[20px] py-[14px] shrink-0 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(40,150,251,0.15), rgba(9,93,195,0.1))" }}>
            <div>
              <h3 className="text-white text-[15px] font-bold m-0">Request a Feature</h3>
              <p className="text-[#64748B] text-[11px] mt-[2px] m-0">Submit your idea directly to our team</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.06)] border-none text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.1)] cursor-pointer transition-all"
            >
              <X className="w-[14px] h-[14px]" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={CLICKUP_FORM_URL}
              title="Feature Request Form"
              className="w-full h-full border-none"
              allow="clipboard-write"
            />
          </div>
        </div>
      )}
    </>
  );
}
