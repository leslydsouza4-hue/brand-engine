import { useState, useEffect } from "react";
import { 
  Users, Plus, Settings, ChevronDown, Check, Shield, UserX, Mail
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSessions } from "../SessionProvider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/react";

export function TeamSelector() {
  const { isSignedIn } = useAuth();
  const { 
    teams, activeTeamId, selectTeam, createTeam,
    members, invite, revokeInvite, removeMember 
  } = useSessions();
  const { toast } = useToast();

  const [manageOpen, setManageOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamInvites, setTeamInvites] = useState<any[]>([]);

  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];

  useEffect(() => {
    let mounted = true;
    if (manageOpen && activeTeamId) {
      members().then(res => {
        if (mounted) {
          setTeamMembers(res.members);
          setTeamInvites(res.invites);
        }
      }).catch(err => {
        if (mounted) {
          toast({ title: "Failed to load members", description: err.message, variant: "destructive" });
        }
      });
    }
    return () => { mounted = false; };
  }, [manageOpen, activeTeamId, toast]);

  if (!isSignedIn) return null;

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await createTeam(newTeamName);
      setCreateOpen(false);
      setNewTeamName("");
    } catch (err: any) {
      toast({ title: "Failed to create team", description: err.message, variant: "destructive" });
    }
  };

  const loadMembers = async () => {
    const res = await members();
    setTeamMembers(res.members);
    setTeamInvites(res.invites);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await invite(inviteEmail);
      setInviteEmail("");
      await loadMembers();
      toast({ title: "Invite created", description: "The user can now join when they sign in." });
    } catch (err: any) {
      toast({ title: "Failed to invite", description: err.message, variant: "destructive" });
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeInvite(id);
      await loadMembers();
    } catch (err: any) {
      toast({ title: "Failed to revoke invite", description: err.message, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      await removeMember(id);
      await loadMembers();
    } catch (err: any) {
      toast({ title: "Failed to remove member", description: err.message, variant: "destructive" });
    }
  };

  if (!activeTeam) {
    return (
      <>
        <Button onClick={() => setCreateOpen(true)} className="bg-[#00B2A9] hover:bg-[#00B2A9]/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Create First Team
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[400px] bg-[#09090b] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Create New Team</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Create a new isolated workspace for saved sessions.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Team Name</Label>
                <Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Marketing Q4" className="bg-[#18181b] border-white/10 text-white" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-zinc-400 hover:text-white hover:bg-white/5">Cancel</Button>
              <Button onClick={handleCreateTeam} className="bg-[#00B2A9] hover:bg-[#00B2A9]/90 text-white">Create Team</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-[#18181b] border-white/10 hover:bg-white/5 hover:text-white text-zinc-300">
            <Users className="w-4 h-4 mr-2 text-[#00B2A9]" />
            {activeTeam.name}
            <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[240px] bg-[#18181b] border-white/10 text-zinc-300">
          <DropdownMenuLabel className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Your Teams</DropdownMenuLabel>
          {teams.map(team => (
            <DropdownMenuItem 
              key={team.id} 
              className="focus:bg-white/10 focus:text-white cursor-pointer py-2"
              onClick={() => selectTeam(team.id)}
            >
              <div className="flex items-center justify-between w-full">
                <span className="truncate pr-4">{team.name}</span>
                {team.id === activeTeamId && <Check className="w-4 h-4 text-[#00B2A9] shrink-0" />}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Team
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2" onClick={() => setManageOpen(true)}>
            <Settings className="w-4 h-4 mr-2" /> Manage Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Manage Team Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#09090b] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Manage "{activeTeam.name}"</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Invite teammates to collaborate on saved sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <Label className="text-zinc-300">Invite Teammate</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input 
                    placeholder="Email address" 
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="pl-9 bg-[#18181b] border-white/10 text-white"
                  />
                </div>
                <Button onClick={handleInvite} className="bg-[#00B2A9] hover:bg-[#00B2A9]/90 text-white">Invite</Button>
              </div>
              <p className="text-xs text-zinc-500 flex items-start gap-1.5">
                <Settings className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Note: We do not send automated emails. Give the user this email address and when they sign in, they will automatically join.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-zinc-300">Members & Invites</Label>
              <div className="rounded-md border border-white/10 overflow-hidden divide-y divide-white/10">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-[#18181b]">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {member.name}
                        {member.role === "admin" && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-blue-500/10 text-blue-400 border-blue-500/20 py-0"><Shield className="w-3 h-3 mr-1"/> Admin</Badge>}
                      </div>
                      <div className="text-xs text-zinc-500">{member.email}</div>
                    </div>
                    {member.role !== "admin" && (
                      <Button onClick={() => handleRemoveMember(member.userId)} variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                        <UserX className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {teamInvites.map(invite => (
                  <div key={invite.id} className="flex items-center justify-between p-3 bg-[#18181b]/50">
                    <div>
                      <div className="font-medium text-sm text-zinc-400 flex items-center gap-2">
                        Pending Invite
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-zinc-500/10 text-zinc-400 border-zinc-500/20 py-0">Waiting</Badge>
                      </div>
                      <div className="text-xs text-zinc-500">{invite.email}</div>
                    </div>
                    <Button onClick={() => handleRevoke(invite.id)} variant="ghost" size="sm" className="h-8 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#09090b] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Create New Team</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Create a new isolated workspace for saved sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Team Name</Label>
              <Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Marketing Q4" className="bg-[#18181b] border-white/10 text-white" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-zinc-400 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={handleCreateTeam} className="bg-[#00B2A9] hover:bg-[#00B2A9]/90 text-white">Create Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
