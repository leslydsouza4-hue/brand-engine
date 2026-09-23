import { useState, useEffect } from "react";
import { 
  Cloud, CloudOff, CloudUpload, HardDrive, 
  History, Settings, FolderOpen, Save, Copy, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SessionHistory } from "./SessionHistory";
import { useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { useSessions } from "../SessionProvider";
import { captureSessionThumbnail } from "../sessionAssets";
import { useToast } from "@/hooks/use-toast";

type SessionState = "unsaved" | "saving" | "saved" | "conflict";

interface SaveSessionToolbarProps {
  workspaceType: string;
  onOpenLibrary?: () => void;
}

export function SaveSessionToolbar({ workspaceType, onOpenLibrary }: SaveSessionToolbarProps) {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [historyOpen, setHistoryOpen] = useState(false);
  const { toast } = useToast();

  const {
    currentSession,
    dirty,
    saving,
    conflict,
    error,
    clearError,
    save,
    saveCopy,
    prepareSignIn,
    activeTeamId,
    thumbnailWarning,
    open
  } = useSessions();

  useEffect(() => {
    if (error) {
      toast({
        title: "Session Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast, clearError]);

  const state: SessionState = conflict ? "conflict" : saving ? "saving" : dirty || !currentSession ? "unsaved" : "saved";

  const handleSignIn = async () => {
    try {
      await prepareSignIn();
      setLocation("/sign-in");
    } catch (e: any) {
      toast({
        title: "Cannot preserve draft",
        description: e.message || "Failed to save draft locally. Ensure you have enough storage.",
        variant: "destructive",
      });
    }
  };

  const captureThumbnail = async () => {
    const el = document.querySelector("[data-session-preview]")
      ?? document.querySelector("[data-export-preview]");
    if (!el) throw new Error("No visible session preview element was found");
    return captureSessionThumbnail(el as HTMLElement);
  };

  const handleSave = async () => {
    try {
      if (!activeTeamId) { onOpenLibrary?.(); return; }
      const name = currentSession?.name ?? window.prompt("Name this session:");
      if (!name?.trim()) return;
      await save({ name: name.trim(), thumbnail: captureThumbnail });
    } catch (e) {
      // Error handled by useSessions
    }
  };

  const handleSaveCopy = async () => {
    try {
      const newName = prompt("Name for copy:", (currentSession?.name || "Untitled") + " (Copy)");
      if (newName) {
        await saveCopy(newName, captureThumbnail);
      }
    } catch (e) {}
  };

  const handleReload = async () => {
    if (currentSession) {
      try { await open(currentSession.id); } catch { /* Provider displays the error. */ }
    }
  };

  return (
    <>
      {thumbnailWarning && <div role="status" className="text-xs text-amber-300 px-4 py-1">{thumbnailWarning}</div>}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#18181b]/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl">
        <div className="flex items-center gap-3 pr-4 border-r border-white/10">
          {isSignedIn ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded-md transition-colors" onClick={() => onOpenLibrary?.()}>
                  <FolderOpen className="w-4 h-4 text-[#00B2A9]" />
                  <span className="text-sm font-medium text-white truncate max-w-[150px]">
                    {currentSession?.name || "Untitled Session"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open Library</TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-sm font-medium text-zinc-400 px-2">Anonymous Draft</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {state === "saved" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 text-emerald-400">
                  <Cloud className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Saved</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">All changes saved to cloud</TooltipContent>
            </Tooltip>
          )}

          {state === "saving" && (
            <div className="flex items-center gap-2 px-3 text-[#00B2A9]">
              <CloudUpload className="w-4 h-4 animate-bounce" />
              <span className="text-xs font-medium uppercase tracking-wider">Saving...</span>
            </div>
          )}

          {state === "unsaved" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-3 text-amber-400/80">
                    <CloudOff className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Unsaved</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">You have unsaved changes</TooltipContent>
              </Tooltip>
              
              {isSignedIn ? (
                <Button onClick={handleSave} size="sm" variant="secondary" className="h-7 text-xs gap-1.5 ml-1 bg-white/10 hover:bg-white/20 border-0 text-white">
                  <Save className="w-3 h-3" />
                  Save
                </Button>
              ) : (
                <Button size="sm" variant="default" className="h-7 text-xs gap-1.5 ml-1 bg-[#00B2A9] hover:bg-[#00B2A9]/90 text-white" onClick={handleSignIn}>
                  <HardDrive className="w-3 h-3" />
                  Sign in to Save
                </Button>
              )}
            </>
          )}

          {state === "conflict" && (
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Conflict</span>
              <Button onClick={handleReload} size="sm" variant="outline" className="h-7 text-xs gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20">
                <RotateCcw className="w-3 h-3" />
                Reload
              </Button>
              <Button onClick={handleSaveCopy} size="sm" variant="outline" className="h-7 text-xs gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20">
                <Copy className="w-3 h-3" />
                Save Copy
              </Button>
            </div>
          )}

          {isSignedIn && currentSession && (
            <>
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-zinc-400 hover:text-white" onClick={() => setHistoryOpen(true)}>
                    <History className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Version History</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-zinc-400 hover:text-white" onClick={() => onOpenLibrary?.()}>
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Manage Session</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {currentSession && (
        <SessionHistory 
          open={historyOpen} 
          onOpenChange={setHistoryOpen} 
          sessionId={currentSession.id}
        />
      )}
    </>
  );
}
