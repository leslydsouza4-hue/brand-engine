import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, FileImage, MoreVertical, Copy, 
  Archive, Edit2, FolderOpen, Play, SearchX
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamSelector } from "./TeamSelector";
import { useSessions } from "../SessionProvider";
import type { SessionSummary } from "../sessionClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "@clerk/react";
import { useLocation } from "wouter";

interface SharedSessionsLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeWorkspaceType?: string;
}

export function SharedSessionsLibrary({ open, onOpenChange, activeWorkspaceType }: SharedSessionsLibraryProps) {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { sessions, currentSession, activeTeamId, open: openSession, archive, rename, list, prepareSignIn, duplicate } = useSessions();
  const { toast } = useToast();
  const [openingSessionId, setOpeningSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (open && isSignedIn && activeTeamId) {
      list(activeTab === "archived").catch(() => {});
    }
  }, [open, activeTab, isSignedIn, activeTeamId]);

  useEffect(() => {
    if (openingSessionId && currentSession?.id === openingSessionId) {
      setOpeningSessionId(null);
      onOpenChange(false);
    }
  }, [currentSession, openingSessionId, onOpenChange]);

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

  const filteredSessions = sessions.filter(s => {
    if (activeTab === "active" && s.archived) return false;
    if (activeTab === "archived" && !s.archived) return false;
    if (typeFilter !== "all" && s.workspaceType !== typeFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleOpen = async (id: string) => {
    setOpeningSessionId(id);
    try {
      await openSession(id);
    } catch (e: any) {
      setOpeningSessionId(null);
      toast({ title: "Failed to open", description: e.message, variant: "destructive" });
    }
  };

  const handleDuplicate = async (session: SessionSummary) => {
    try {
      const copy = await duplicate(session.id);
      setActiveTab("active");
      toast({ title: "Session duplicated", description: `${copy.name} is available in Active sessions. Your current edits are unchanged.` });
    } catch (e: any) {
      toast({ title: "Failed to duplicate", description: e.message, variant: "destructive" });
    }
  };

  const handleArchiveToggle = async (session: any) => {
    try {
      await archive(session.id, session.revision, !session.archived);
      list(activeTab === "archived");
    } catch (e: any) {
      toast({ title: "Failed to update", description: e.message, variant: "destructive" });
    }
  };

  const handleRename = async (session: any) => {
    const newName = prompt("New name:", session.name);
    if (newName && newName !== session.name) {
      try {
        await rename(session.id, session.revision, newName);
        list(activeTab === "archived");
      } catch (e: any) {
        toast({ title: "Failed to rename", description: e.message, variant: "destructive" });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 bg-[#09090b] border-white/10 flex flex-col overflow-hidden text-white">
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div>
            <DialogTitle className="text-2xl font-bold font-heading text-white">Shared Sessions</DialogTitle>
            <DialogDescription className="text-zinc-400 mt-1">
              Collaborate on saved projects across your team.
            </DialogDescription>
          </div>
          <TeamSelector />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {!isSignedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Sign in to view your library</h3>
              <p className="text-zinc-400 max-w-sm mb-6">
                You need an account to save sessions and collaborate with your team.
              </p>
              <Button onClick={handleSignIn} className="bg-[#00B2A9] hover:bg-[#00B2A9]/90 text-white">
                Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="p-6 pb-2 shrink-0 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                      placeholder="Search sessions..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-10"
                    />
                  </div>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <Badge 
                    variant={typeFilter === "all" ? "default" : "outline"}
                    className={`cursor-pointer shrink-0 ${typeFilter === "all" ? "bg-[#00B2A9] text-white hover:bg-[#00B2A9]/90" : "text-zinc-400 border-white/10 hover:bg-white/5"}`}
                    onClick={() => setTypeFilter("all")}
                  >
                    All Types
                  </Badge>
                  {activeWorkspaceType && (
                    <Badge 
                      variant={typeFilter === activeWorkspaceType ? "default" : "outline"}
                      className={`cursor-pointer shrink-0 ${typeFilter === activeWorkspaceType ? "bg-[#00B2A9] text-white hover:bg-[#00B2A9]/90" : "text-zinc-400 border-white/10 hover:bg-white/5"}`}
                      onClick={() => setTypeFilter(activeWorkspaceType)}
                    >
                      Current Builder
                    </Badge>
                  )}
                  {/* Other filters could be mapped here */}
                </div>
              </div>

              <ScrollArea className="flex-1 p-6 pt-2">
                {filteredSessions.length === 0 ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <SearchX className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No sessions found</h3>
                    <p className="text-zinc-500 max-w-sm">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSessions.map(session => (
                      <div key={session.id} className="group relative bg-[#18181b] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all shadow-lg hover:shadow-xl">
                        <div className="aspect-[16/9] bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                          {session.thumbnailAssetId ? (
                            <img src={`/api/session-teams/${activeTeamId}/assets/${session.thumbnailAssetId}`} alt={session.name} className="w-full h-full object-cover" />
                          ) : (
                            <FileImage className="w-12 h-12 text-zinc-800" />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <Button onClick={() => handleOpen(session.id)} className="bg-[#00B2A9] hover:bg-[#00B2A9]/90 text-white rounded-full">
                              <Play className="w-4 h-4 mr-2" />
                              Open
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h4 className="font-semibold text-white truncate text-lg font-heading">{session.name}</h4>
                              <span className="text-xs text-[#00B2A9] uppercase tracking-wider font-medium">{session.workspaceType}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white -mr-2">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#18181b] border-white/10 text-zinc-300">
                                <DropdownMenuItem onClick={() => handleOpen(session.id)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                  <FolderOpen className="w-4 h-4 mr-2" /> Open Session
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRename(session)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                  <Edit2 className="w-4 h-4 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(session)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                  <Copy className="w-4 h-4 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                {session.archived ? (
                                  <DropdownMenuItem onClick={() => handleArchiveToggle(session)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                    <Archive className="w-4 h-4 mr-2" /> Unarchive
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleArchiveToggle(session)} className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer">
                                    <Archive className="w-4 h-4 mr-2" /> Archive
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 text-xs text-zinc-500">
                            <div className="flex items-center justify-between">
                              <span>Authored by <span className="text-zinc-300">{session.createdByName || "Unknown"}</span></span>
                              <span>{formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</span>
                            </div>
                            {session.createdByName !== session.updatedByName && (
                              <div>Last edited by <span className="text-zinc-300">{session.updatedByName || "Unknown"}</span></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
