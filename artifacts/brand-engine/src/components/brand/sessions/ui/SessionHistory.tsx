import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Copy, Play } from "lucide-react";
import { useSessions } from "../SessionProvider";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface SessionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export function SessionHistory({ open, onOpenChange, sessionId }: SessionHistoryProps) {
  const { history, restoreVersion } = useSessions();
  const { toast } = useToast();
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    if (open && sessionId) {
      history(sessionId).then(setVersions).catch(err => {
        toast({ title: "Failed to load history", description: err.message, variant: "destructive" });
      });
    }
  }, [open, sessionId, toast]);

  const handleRestore = async (revision: number) => {
    try {
      await restoreVersion(revision);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed to restore", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#09090b] border-white/10 text-white h-[600px] flex flex-col p-0 overflow-hidden">
        <div className="p-6 border-b border-white/10 shrink-0">
          <DialogTitle className="text-xl font-heading flex items-center gap-2">
            <History className="w-5 h-5 text-[#00B2A9]" />
            Version History
          </DialogTitle>
          <DialogDescription className="text-zinc-400 mt-1">
            Load an older version to view it. Saving will create a new copy or a new version.
          </DialogDescription>
        </div>

        <ScrollArea className="flex-1 p-0">
          <div className="divide-y divide-white/5">
            {versions.map((version, index) => (
              <div key={version.revision} className="p-4 flex items-center justify-between hover:bg-white/5 group transition-colors">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center justify-start pt-1 relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00B2A9] z-10" />
                    {index < versions.length - 1 && (
                      <div className="w-px h-full bg-white/10 absolute top-3.5 left-1/2 -translate-x-1/2" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-0.5">{version.name}</h4>
                    <p className="text-xs text-zinc-500">
                      Revision {version.revision} • {formatDistanceToNow(new Date(version.updatedAt), { addSuffix: true })} by {version.updatedByName || "Unknown"}
                    </p>
                  </div>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button onClick={() => handleRestore(version.revision)} variant="default" size="sm" className="h-8 text-xs bg-[#00B2A9] hover:bg-[#00B2A9]/90 text-white">
                    <Play className="w-3 h-3 mr-1.5" />
                    Load
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
