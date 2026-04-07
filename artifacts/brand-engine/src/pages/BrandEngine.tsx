import { useState } from "react";
import { Sidebar } from "@/components/brand/Sidebar";
import { Toolbar } from "@/components/brand/Toolbar";
import { TemplatesWorkspace } from "@/components/brand/TemplatesWorkspace";
import { ShaunWorkspace } from "@/components/brand/ShaunWorkspace";
import { ZoomWorkspace } from "@/components/brand/ZoomWorkspace";

export default function BrandEngine() {
  const [currentMode, setCurrentMode] = useState("templates");

  return (
    <div className="flex h-screen w-screen relative bg-[#060B16] brand-app-bg">
      <div className="absolute inset-0 brand-app-noise pointer-events-none z-0"></div>
      
      <Sidebar currentMode={currentMode} setMode={setCurrentMode} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        <Toolbar currentMode={currentMode} />
        
        {currentMode === "templates" && <TemplatesWorkspace />}
        {currentMode === "shaun-thumbnails" && <ShaunWorkspace />}
        {currentMode === "zoom-backgrounds" && <ZoomWorkspace />}
        
        {/* Placeholder for AI Image */}
        {currentMode === "ai-image" && (
          <div className="flex-1 flex items-center justify-center text-[#64748B] flex-col gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 opacity-50">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <p className="text-sm font-medium">AI Image Generation coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
