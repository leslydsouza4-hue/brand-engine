import { Users, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SAMPLE_TEAM } from "./_shared";

// The original TeamSelector's dropdown visual; membership, invitations and
// team creation are intentionally outside the sample-only extraction boundary.
export function TeamSelector() {
  const activeTeam = SAMPLE_TEAM;
  return (
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
        <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2">
          <div className="flex items-center justify-between w-full">
            <span className="truncate pr-4">{activeTeam.name}</span>
            <Check className="w-4 h-4 text-[#00B2A9] shrink-0" />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}