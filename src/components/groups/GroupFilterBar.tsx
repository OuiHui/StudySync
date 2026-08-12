import React, { useMemo } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface GroupFilterState {
  searchTerm: string;
  selectedSubject: string;
  selectedVisibility: string;
  sortBy: string;
}

interface GroupFilterBarProps {
  filters: GroupFilterState;
  onFilterChange: (updates: Partial<GroupFilterState>) => void;
  availableSubjects: string[];
  onReset: () => void;
  disabled?: boolean;
}

export const GroupFilterBar: React.FC<GroupFilterBarProps> = ({
  filters,
  onFilterChange,
  availableSubjects,
  onReset,
  disabled = false,
}) => {
  const isFiltered = useMemo(() => {
    return (
      Boolean(filters.searchTerm.trim()) ||
      filters.selectedSubject !== 'all' ||
      filters.selectedVisibility !== 'all' ||
      filters.sortBy !== 'name_asc'
    );
  }, [filters]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Search groups by name, course, or description..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
            className="pl-10 rounded-xl border-border bg-card text-foreground focus:border-brand focus:ring-brand/20 transition-all duration-200 ease-in-out h-10 text-sm"
            disabled={disabled}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subject / Course Selector */}
          <Select
            value={filters.selectedSubject}
            onValueChange={(val) => onFilterChange({ selectedSubject: val })}
            disabled={disabled}
          >
            <SelectTrigger
              aria-label="Filter by course or subject"
              className="w-[190px] font-medium border-border bg-card text-card-foreground"
            >
              <SelectValue placeholder="All Courses / Subjects" />
            </SelectTrigger>
            <SelectContent align="start" className="bg-popover text-popover-foreground border-border">
              <SelectItem value="all">All Courses / Subjects</SelectItem>
              {availableSubjects.map((subj) => (
                <SelectItem key={subj} value={subj}>
                  {subj}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Visibility Filter */}
          <Select
            value={filters.selectedVisibility}
            onValueChange={(val) => onFilterChange({ selectedVisibility: val })}
            disabled={disabled}
          >
            <SelectTrigger
              aria-label="Filter by visibility"
              className="w-[150px] font-medium border-border bg-card text-card-foreground"
            >
              <SelectValue placeholder="All Visibility" />
            </SelectTrigger>
            <SelectContent align="start" className="bg-popover text-popover-foreground border-border">
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private / Invite</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By Selector */}
          <Select
            value={filters.sortBy}
            onValueChange={(val) => onFilterChange({ sortBy: val })}
            disabled={disabled}
          >
            <SelectTrigger
              aria-label="Sort groups by"
              className="w-[180px] font-medium border-border bg-card text-card-foreground"
            >
              <SelectValue placeholder="Sort by: Name (A-Z)" />
            </SelectTrigger>
            <SelectContent align="start" className="bg-popover text-popover-foreground border-border">
              <SelectItem value="name_asc">Sort by: Name (A-Z)</SelectItem>
              <SelectItem value="members_desc">Sort by: Most Members</SelectItem>
              <SelectItem value="newest">Sort by: Newest</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="h-10 px-3.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-all duration-200 ease-in-out border border-border"
              title="Reset Filters"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
