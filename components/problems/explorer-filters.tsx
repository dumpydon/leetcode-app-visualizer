"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPLORER_RATING_BAND_OPTIONS } from "@/lib/constants";

type ExplorerFiltersProps = {
  band: string;
  difficulty: string;
  solved: string;
  search: string;
  onBandChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onSolvedChange: (value: string) => void;
  onSearchChange: (value: string) => void;
};

export function ExplorerFilters({
  band,
  difficulty,
  solved,
  search,
  onBandChange,
  onDifficultyChange,
  onSolvedChange,
  onSearchChange,
}: ExplorerFiltersProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_0.85fr_0.9fr_1.5fr]">
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Rating band
        </label>
        <Select value={band} onValueChange={onBandChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPLORER_RATING_BAND_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Difficulty
        </label>
        <Select value={difficulty} onValueChange={onDifficultyChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["All", "Easy", "Medium", "Hard"].map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Progress
        </label>
        <Select value={solved} onValueChange={onSolvedChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["All", "Solved", "Remaining"].map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground" htmlFor="problem-search">
          Search all problems
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="problem-search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search problem titles"
            className="pl-11"
          />
        </div>
      </div>
    </div>
  );
}
