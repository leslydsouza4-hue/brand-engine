import { useState } from "react";
import { CalendarDays, Map, FileText, Mic2, Award, Clock } from "lucide-react";
import { CustomerJourneyWorkspace } from "./CustomerJourneyWorkspace";

const TABS = [
  { id: "customer-journey", label: "Customer Journey", icon: Map },
  { id: "event-agenda", label: "Event Agenda", icon: CalendarDays, soon: true },
  { id: "speaker-cards", label: "Speaker Cards", icon: Mic2, soon: true },
  { id: "certificates", label: "Certificates", icon: Award, soon: true },
  { id: "event-schedule", label: "Event Schedule", icon: Clock, soon: true },
  { id: "event-flyer", label: "Event Flyer", icon: FileText, soon: true },
];

export function EventsWorkspace() {
  const [activeTab, setActiveTab] = useState("customer-journey");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/5 bg-[rgba(3,11,23,0.6)] backdrop-blur-[12px]">
        <div className="flex items-center gap-[2px] px-[16px] py-[6px] overflow-x-auto sidebar-scroll">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isSoon = tab.soon;
            return (
              <button
                key={tab.id}
                onClick={() => !isSoon && setActiveTab(tab.id)}
                className={`flex items-center gap-[7px] px-[14px] py-[8px] rounded-[10px] text-[12px] font-semibold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? "bg-[rgba(40,150,251,0.12)] border-[rgba(40,150,251,0.25)] text-[#2896FB] shadow-[0_2px_12px_rgba(40,150,251,0.15)]"
                    : isSoon
                    ? "border-transparent text-[#475569] cursor-not-allowed"
                    : "border-transparent text-[#94A3B8] hover:text-white hover:bg-white/5 cursor-pointer"
                }`}
              >
                <Icon className={`w-[14px] h-[14px] ${isActive ? "opacity-100" : "opacity-50"}`} />
                {tab.label}
                {isSoon && (
                  <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] text-[#475569] uppercase tracking-[0.5px]">Soon</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "customer-journey" && <CustomerJourneyWorkspace />}
      </div>
    </div>
  );
}
