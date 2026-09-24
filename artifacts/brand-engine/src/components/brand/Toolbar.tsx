import { Menu, LogOut, Loader2 } from "lucide-react";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useSessions } from "@/components/brand/sessions/SessionProvider";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ToolbarProps {
  onMenuToggle?: () => void;
}

export function Toolbar({ onMenuToggle }: ToolbarProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const { prepareSignIn, confirmNavigation } = useSessions();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      if (!isSignedIn) {
        await prepareSignIn();
      }
      setLocation("/sign-in");
    } catch (e: any) {
      toast({
        title: "Cannot preserve draft",
        description: e.message || "Failed to save draft locally. Ensure you have enough storage.",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async () => {
    try {
      if (!isSignedIn) {
        await prepareSignIn();
      }
      setLocation("/sign-up");
    } catch (e: any) {
      toast({
        title: "Cannot preserve draft",
        description: e.message || "Failed to save draft locally. Ensure you have enough storage.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = () => {
    if (confirmNavigation()) {
      signOut({ redirectUrl: "/" });
    }
  };

  return (
    <div className="flex items-center justify-between py-[12px] px-[20px] relative z-50 border-b border-white/5 bg-[#030b17]/80 backdrop-blur-md shrink-0 h-[64px]">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          aria-label="Open navigation"
          className="md:hidden flex items-center justify-center w-[38px] h-[38px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
        >
          <Menu className="w-[20px] h-[20px]" />
        </button>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {!isLoaded ? (
          <div className="w-8 h-8 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
          </div>
        ) : isSignedIn && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Account menu" className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full hover:bg-white/5 transition-all border border-transparent hover:border-white/10 outline-none cursor-pointer">
                <img 
                  src={user.imageUrl} 
                  alt={user.fullName || "User avatar"} 
                  className="w-7 h-7 rounded-full object-cover border border-white/10" 
                />
                <span className="text-sm font-medium text-white max-w-[120px] truncate hidden sm:block">
                  {user.fullName || user.primaryEmailAddress?.emailAddress}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px] bg-[#18181b] border-white/10 text-zinc-300">
              <div className="px-3 py-2 mb-1 border-b border-white/5">
                <div className="text-sm font-medium text-white truncate">
                  {user.fullName || user.primaryEmailAddress?.emailAddress}
                </div>
                <div className="text-xs text-zinc-500 truncate mt-0.5">
                  {user.primaryEmailAddress?.emailAddress}
                </div>
              </div>
              <DropdownMenuItem onClick={handleSignOut} className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer py-2 mt-1">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button 
              variant="ghost" 
              onClick={handleSignIn} 
              className="text-zinc-300 hover:text-white hover:bg-white/10 font-medium h-9 px-4 rounded-full"
            >
              Sign In
            </Button>
            <Button 
              onClick={handleSignUp} 
              className="bg-gradient-to-r from-[#00B2A9] to-[#2896FB] hover:opacity-90 text-white border-none font-medium h-9 px-5 rounded-full shadow-[0_2px_10px_rgba(0,178,169,0.3)] transition-all"
            >
              Sign Up
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
