import { ReactNode } from "react";
import { Link } from "wouter";

interface AuthPageProps {
  children: ReactNode;
}

export default function AuthPage({ children }: AuthPageProps) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const logoUrl = `${basePath}/assets/logos/Lockup=Full Horizontal, Color=Light.png`;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#09090b] text-white font-sans selection:bg-[#00B2A9] selection:text-[#09090b]">
      {/* Left side: Branding & Context */}
      <div className="relative md:flex-1 flex flex-col justify-between p-6 md:p-12 lg:p-16 overflow-hidden bg-[#0a0a0c] border-r border-white/5">
        {/* Background graphic pattern */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(0, 178, 169, 0.15) 0%, transparent 40%), 
            radial-gradient(circle at 90% 80%, rgba(0, 178, 169, 0.1) 0%, transparent 40%)
          `,
          filter: 'blur(60px)'
        }} />
        
        {/* subtle grid overlay for technical vibe */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10 flex flex-col gap-6 max-w-lg">
          <Link href="/">
            <img 
              src={logoUrl} 
              alt="HighLevel Brand Engine" 
              className="h-8 md:h-9 object-contain md:mb-12 cursor-pointer hover:opacity-80 transition-opacity self-start" 
            />
          </Link>
          
          <h1 className="hidden md:block text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.1] tracking-tight text-white mb-2">
            Your team's brand, <br className="hidden md:block" />
            <span className="text-zinc-400">ready to deploy.</span>
          </h1>
          
          <p className="hidden md:block text-zinc-400 text-base md:text-lg max-w-md leading-relaxed mb-8 md:mb-0">
            Create on-brand graphics, save your editable projects, and pick up where your teammates left off.
          </p>
        </div>

        <div className="relative z-10 hidden md:block p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00B2A9]">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
             One shared library
          </h3>
          <ul className="text-sm text-zinc-400 space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-[#00B2A9] mt-0.5 opacity-70">01</span>
                Sign in or create an account — no invitation needed
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00B2A9] mt-0.5 opacity-70">02</span>
              Verify your email when prompted
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00B2A9] mt-0.5 opacity-70">03</span>
               All signed-in accounts can access saved sessions. No Replit account required.
            </li>
          </ul>
        </div>
      </div>

      {/* Right side: Auth Widget */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-[#09090b]">
        {/* Top-right Return link */}
        <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20">
          <Link 
            href="/" 
            className="text-sm font-medium text-zinc-500 hover:text-white transition-colors flex items-center gap-2 py-2 px-3 rounded-full hover:bg-white/5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to editor
          </Link>
        </div>

        <div className="w-full max-w-[440px] flex flex-col gap-6 md:gap-8 z-10 mt-12 md:mt-0">
          
          <div className="w-full flex justify-center [&_.cl-rootBox]:w-full [&_.cl-card]:w-full [&_.cl-card]:shadow-2xl [&_.cl-card]:shadow-black/50">
            {children}
          </div>
          
          <div className="md:hidden mt-4 p-5 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <h3 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
              One shared library
            </h3>
            <p className="text-xs text-zinc-400 mb-2">
                Every signed-in account can access saved sessions. No invitation or Replit account required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
