import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download, Search } from "lucide-react";
import SidebarFilters from "@/components/dashboard/sidebar-filters";
import StatsCards from "@/components/dashboard/stats-cards";
import AnalyticsChart from "@/components/dashboard/analytics-chart";
import LeadsTable from "@/components/dashboard/leads-table";
import EmailModal from "@/components/dashboard/email-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { FilterState } from "@/lib/types";

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    industry: "",
    companySizes: ["11-50"],
    location: "",
    minScore: 70,
    status: "",
    sources: [],
  });
  
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [userCredits] = useState(247);
  const { toast } = useToast();

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/leads/export/csv?${queryParams}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Your leads have been exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export leads. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartScraping = async () => {
    try {
      const response = await apiRequest("POST", "/api/leads/scrape", {
        searchTerm: filters.search || "technology",
        industry: filters.industry || undefined,
        location: filters.location || undefined,
      });

      const result = await response.json();
      
      toast({
        title: "Scraping Complete",
        description: `${result.message}`,
      });
    } catch (error) {
      toast({
        title: "Scraping Failed",
        description: "Failed to scrape leads. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateEmail = (leadId: number) => {
    setSelectedLead(leadId);
    setIsEmailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-sm"></i>
                </div>
                <span className="text-xl font-semibold text-slate-900">SaaSquatch Leads Pro</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-100 rounded-lg px-3 py-2">
                <i className="fas fa-coins text-brand-500"></i>
                <span className="text-sm font-medium text-slate-700">{userCredits} Credits</span>
              </div>
              
              <Button className="bg-brand-500 hover:bg-brand-600">
                <Plus className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
              
              <div className="relative">
                <Button variant="ghost" size="icon" className="w-8 h-8 bg-slate-200 rounded-full">
                  <i className="fas fa-user text-slate-600 text-sm"></i>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-screen bg-slate-50">
        {/* Sidebar Filters */}
        <SidebarFilters filters={filters} onFiltersChange={setFilters} />

        {/* Main Dashboard Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Dashboard Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Lead Generation Dashboard</h1>
                <p className="text-slate-600 text-sm">Manage and track your leads across multiple sources</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleExportCSV}
                  variant="outline"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  onClick={handleStartScraping}
                  className="bg-brand-500 hover:bg-brand-600"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Start Scraping
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <StatsCards />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto bg-slate-50">
            <div className="p-6">
              {/* Analytics Chart */}
              <AnalyticsChart />

              {/* Leads Table */}
              <LeadsTable 
                filters={filters} 
                onGenerateEmail={handleGenerateEmail}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        leadId={selectedLead}
      />
    </div>
  );
}
