import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { FilterState, DataSource } from "@/lib/types";

interface SidebarFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export default function SidebarFilters({ filters, onFiltersChange }: SidebarFiltersProps) {
  const { data: dataSources = [] } = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"],
  });

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleCompanySizeChange = (size: string, checked: boolean) => {
    const newSizes = checked 
      ? [...filters.companySizes, size]
      : filters.companySizes.filter(s => s !== size);
    handleFilterChange("companySizes", newSizes);
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Lead Filters</h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search companies..."
            className="pl-10"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        {/* Industry Filter */}
        <div className="mb-4">
          <Label className="block text-sm font-medium text-slate-700 mb-2">Industry</Label>
          <Select value={filters.industry} onValueChange={(value) => handleFilterChange("industry", value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Company Size Filter */}
        <div className="mb-4">
          <Label className="block text-sm font-medium text-slate-700 mb-2">Company Size</Label>
          <div className="space-y-2">
            {["1-10", "11-50", "51-200", "200+"].map((size) => (
              <div key={size} className="flex items-center space-x-2">
                <Checkbox
                  id={size}
                  checked={filters.companySizes.includes(size)}
                  onCheckedChange={(checked) => handleCompanySizeChange(size, checked as boolean)}
                />
                <Label htmlFor={size} className="text-sm text-slate-600">
                  {size} employees
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Range */}
        <div className="mb-4">
          <Label className="block text-sm font-medium text-slate-700 mb-2">Annual Revenue</Label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minRevenue || ""}
              onChange={(e) => handleFilterChange("minRevenue", e.target.value ? parseInt(e.target.value) : undefined)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxRevenue || ""}
              onChange={(e) => handleFilterChange("maxRevenue", e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </div>

        {/* Location Filter */}
        <div className="mb-4">
          <Label className="block text-sm font-medium text-slate-700 mb-2">Location</Label>
          <Input
            type="text"
            placeholder="City, State, Country"
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
          />
        </div>

        {/* Lead Score Filter */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-slate-700 mb-2">Minimum Lead Score</Label>
          <Slider
            value={[filters.minScore]}
            onValueChange={([value]) => handleFilterChange("minScore", value)}
            max={100}
            step={1}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>0</span>
            <span className="font-medium">{filters.minScore}</span>
            <span>100</span>
          </div>
        </div>

        <Button 
          className="w-full bg-brand-500 hover:bg-brand-600"
          onClick={() => {/* Trigger filter application */}}
        >
          Apply Filters
        </Button>
      </div>

      {/* Data Sources */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Data Sources</h3>
        <div className="space-y-2">
          {dataSources.map((source) => (
            <div key={source.name} className="flex items-center justify-between">
              <span className="text-xs text-slate-600">{source.name}</span>
              <div className={`w-2 h-2 rounded-full ${source.active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
