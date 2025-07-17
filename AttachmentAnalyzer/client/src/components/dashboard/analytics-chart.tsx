import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

interface AnalyticsData {
  labels: string[];
  totalLeads: number[];
  enrichedLeads: number[];
}

export default function AnalyticsChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/chart"],
  });

  useEffect(() => {
    if (!analytics || !canvasRef.current) return;

    // Dynamically import Chart.js to avoid SSR issues
    import('chart.js/auto').then((Chart) => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current!.getContext('2d');
      if (!ctx) return;

      chartRef.current = new Chart.default(ctx, {
        type: 'line',
        data: {
          labels: analytics.labels,
          datasets: [
            {
              label: 'Leads Generated',
              data: analytics.totalLeads,
              borderColor: 'hsl(207, 90%, 54%)',
              backgroundColor: 'hsla(207, 90%, 54%, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Enriched Leads',
              data: analytics.enrichedLeads,
              borderColor: 'hsl(142, 71%, 45%)',
              backgroundColor: 'hsla(142, 71%, 45%, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom' as const,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'hsl(210, 40%, 95%)',
              },
            },
            x: {
              grid: {
                color: 'hsl(210, 40%, 95%)',
              },
            },
          },
        },
      });
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [analytics]);

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <CardHeader>
          <CardTitle>Lead Generation Analytics</CardTitle>
          <CardDescription>Track your lead generation performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
      <CardHeader>
        <CardTitle>Lead Generation Analytics</CardTitle>
        <CardDescription>Track your lead generation performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} width="400" height="100"></canvas>
      </CardContent>
    </Card>
  );
}
