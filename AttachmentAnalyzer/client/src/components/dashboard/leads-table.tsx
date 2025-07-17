import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Mail, MoreHorizontal, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LeadWithDetails } from "@shared/schema";
import type { FilterState } from "@/lib/types";

interface LeadsTableProps {
  filters: FilterState;
  onGenerateEmail: (leadId: number) => void;
}

export default function LeadsTable({ filters, onGenerateEmail }: LeadsTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<LeadWithDetails[]>({
    queryKey: ["/api/leads", filters],
  });

  const enrichLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const response = await apiRequest("POST", `/api/leads/${leadId}/enrich`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Enriched",
        description: "Lead has been successfully enriched with additional data",
      });
    },
    onError: () => {
      toast({
        title: "Enrichment Failed",
        description: "Failed to enrich lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads.filter(lead => {
    if (statusFilter === "all") return true;
    if (statusFilter === "enriched") return lead.status === "enriched";
    if (statusFilter === "pending") return lead.status === "pending";
    return true;
  });

  const handleSelectLead = (leadId: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      enriched: "default",
      pending: "secondary",
      contacted: "outline",
      converted: "default",
    };

    const colors: { [key: string]: string } = {
      enriched: "bg-emerald-100 text-emerald-800",
      pending: "bg-amber-100 text-amber-800",
      contacted: "bg-blue-100 text-blue-800",
      converted: "bg-green-100 text-green-800",
    };

    return (
      <Badge variant={variants[status] || "outline"} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getIndustryBadge = (industry: string) => {
    const colors: { [key: string]: string } = {
      Technology: "bg-blue-100 text-blue-800",
      Healthcare: "bg-green-100 text-green-800",
      Finance: "bg-purple-100 text-purple-800",
      Manufacturing: "bg-yellow-100 text-yellow-800",
      Retail: "bg-pink-100 text-pink-800",
    };

    return (
      <Badge variant="outline" className={colors[industry] || "bg-gray-100 text-gray-800"}>
        {industry}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>Latest prospects from your lead generation campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Latest prospects from your lead generation campaigns</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "bg-slate-100" : ""}
            >
              All ({leads.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter("enriched")}
              className={statusFilter === "enriched" ? "bg-emerald-100 text-emerald-700" : ""}
            >
              Enriched ({leads.filter(l => l.status === "enriched").length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter("pending")}
              className={statusFilter === "pending" ? "bg-amber-100 text-amber-700" : ""}
            >
              Pending ({leads.filter(l => l.status === "pending").length})
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold text-sm">
                          {lead.company.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{lead.company.name}</div>
                        <div className="text-xs text-slate-500">{lead.company.website}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{lead.contact.name}</div>
                    <div className="text-xs text-slate-500">{lead.contact.title}</div>
                    {lead.contact.email ? (
                      <div className="text-xs text-blue-600">{lead.contact.email}</div>
                    ) : (
                      <div className="text-xs text-slate-400">Email pending</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {lead.company.industry && getIndustryBadge(lead.company.industry)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">{lead.company.size}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{lead.company.revenue}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 bg-slate-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreColor(lead.score || 0)}`}
                          style={{ width: `${lead.score || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4 text-brand-500" />
                      </Button>
                      {lead.status === "enriched" ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onGenerateEmail(lead.id)}
                        >
                          <Mail className="w-4 h-4 text-emerald-500" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => enrichLeadMutation.mutate(lead.id)}
                          disabled={enrichLeadMutation.isPending}
                        >
                          <Plus className="w-4 h-4 text-brand-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">
              Showing <span className="font-medium">1-{filteredLeads.length}</span> of{" "}
              <span className="font-medium">{leads.length}</span> leads
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button size="sm" className="bg-brand-500 hover:bg-brand-600">
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
