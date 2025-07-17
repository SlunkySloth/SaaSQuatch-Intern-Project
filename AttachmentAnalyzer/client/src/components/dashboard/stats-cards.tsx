import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Star, TrendingUp, ArrowUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { LeadStats } from "@/lib/types";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<LeadStats>({
    queryKey: ["/api/analytics/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-50">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-8 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Leads",
      value: stats?.totalLeads || 0,
      icon: Users,
      color: "bg-brand-100 text-brand-500",
      change: "+12.5%",
      changeColor: "text-emerald-500",
    },
    {
      title: "Enriched",
      value: stats?.enrichedLeads || 0,
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-500",
      change: "+8.2%",
      changeColor: "text-emerald-500",
    },
    {
      title: "Avg Score",
      value: stats?.avgScore || 0,
      icon: Star,
      color: "bg-amber-100 text-amber-500",
      change: "+3.1%",
      changeColor: "text-emerald-500",
    },
    {
      title: "Conversion",
      value: `${stats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-500",
      change: "+5.8%",
      changeColor: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.title} className="bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs font-medium uppercase">{stat.title}</p>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className={`w-3 h-3 mr-1 ${stat.changeColor}`} />
              <span className={`text-xs font-medium ${stat.changeColor}`}>{stat.change}</span>
              <span className="text-slate-500 text-xs ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
