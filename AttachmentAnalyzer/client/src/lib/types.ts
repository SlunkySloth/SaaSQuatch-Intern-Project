export interface FilterState {
  search: string;
  industry: string;
  companySizes: string[];
  minRevenue?: number;
  maxRevenue?: number;
  location: string;
  minScore: number;
  status: string;
  sources: string[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }[];
}

export interface LeadStats {
  totalLeads: number;
  enrichedLeads: number;
  avgScore: number;
  conversionRate: number;
}

export interface DataSource {
  name: string;
  url: string;
  active: boolean;
}
