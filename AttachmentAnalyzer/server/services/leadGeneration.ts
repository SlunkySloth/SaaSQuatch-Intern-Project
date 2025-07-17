import { storage } from "../storage";
import type { InsertCompany, InsertContact, InsertLead, LeadFilters } from "@shared/schema";

interface ScrapingSource {
  name: string;
  url: string;
  active: boolean;
}

const DATA_SOURCES: ScrapingSource[] = [
  { name: "Apollo.io", url: "https://apollo.io", active: true },
  { name: "LinkedIn Sales Navigator", url: "https://linkedin.com", active: true },
  { name: "Crunchbase", url: "https://crunchbase.com", active: true },
  { name: "ZoomInfo", url: "https://zoominfo.com", active: false },
];

export class LeadGenerationService {
  
  /**
   * Scrape leads from external sources
   * In a real implementation, this would call actual APIs
   */
  async scrapeLeads(searchTerm: string, industry?: string, location?: string): Promise<{
    companies: InsertCompany[];
    contacts: InsertContact[];
    source: string;
  }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock companies based on search criteria
    const mockCompanies = this.generateMockCompanies(searchTerm, industry, location);
    const mockContacts = this.generateMockContacts();

    return {
      companies: mockCompanies,
      contacts: mockContacts,
      source: "apollo",
    };
  }

  /**
   * Enrich existing lead with additional data
   */
  async enrichLead(leadId: number): Promise<{
    email?: string;
    phone?: string;
    socialProfiles?: { [key: string]: string };
    companyData?: any;
    confidence: number;
  }> {
    // Simulate enrichment API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const lead = await storage.getLeadWithDetails(leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }

    // Mock enrichment data
    const enrichmentResult = {
      email: `${lead.contact.name.toLowerCase().replace(/\s+/g, '.')}@${lead.company.website}`,
      phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      socialProfiles: {
        linkedin: lead.contact.linkedinUrl || `https://linkedin.com/in/${lead.contact.name.toLowerCase().replace(/\s+/g, '-')}`,
        twitter: `https://twitter.com/${lead.contact.name.toLowerCase().replace(/\s+/g, '')}`,
      },
      companyData: {
        employees: this.parseEmployeeRange(lead.company.size),
        funding: this.generateFundingData(),
        technologies: this.generateTechnologies(lead.company.industry),
      },
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
    };

    // Update lead status
    await storage.updateLead(leadId, { status: "enriched" });

    // Store enrichment data
    await storage.createEnrichmentData({
      leadId,
      dataSource: "apollo",
      enrichedFields: enrichmentResult,
      confidence: enrichmentResult.confidence.toString(),
    });

    return enrichmentResult;
  }

  /**
   * Calculate lead score based on various factors
   */
  async calculateLeadScore(leadId: number): Promise<number> {
    const lead = await storage.getLeadWithDetails(leadId);
    if (!lead) return 0;

    let score = 0;

    // Company size scoring (0-25 points)
    const employeeCount = this.parseEmployeeRange(lead.company.size);
    if (employeeCount >= 200) score += 25;
    else if (employeeCount >= 50) score += 20;
    else if (employeeCount >= 10) score += 15;
    else score += 10;

    // Industry scoring (0-20 points)
    const highValueIndustries = ["Technology", "Healthcare", "Finance"];
    if (highValueIndustries.includes(lead.company.industry || "")) {
      score += 20;
    } else {
      score += 10;
    }

    // Revenue scoring (0-25 points)
    const revenue = this.parseRevenue(lead.company.revenue);
    if (revenue >= 50000000) score += 25;
    else if (revenue >= 10000000) score += 20;
    else if (revenue >= 1000000) score += 15;
    else score += 10;

    // Contact title scoring (0-20 points)
    const decisionMakerTitles = ["CEO", "CTO", "VP", "Director", "President", "Founder"];
    const hasDecisionMakerTitle = decisionMakerTitles.some(title => 
      (lead.contact.title || "").toLowerCase().includes(title.toLowerCase())
    );
    if (hasDecisionMakerTitle) score += 20;
    else score += 10;

    // Data completeness scoring (0-10 points)
    const completenessScore = this.calculateDataCompleteness(lead);
    score += completenessScore;

    // Ensure score is between 0-100
    score = Math.min(100, Math.max(0, score));

    // Update lead with calculated score
    await storage.updateLead(leadId, { score });

    return score;
  }

  /**
   * Get data source status
   */
  getDataSources(): ScrapingSource[] {
    return DATA_SOURCES;
  }

  /**
   * Export leads to CSV format
   */
  async exportLeads(filters?: LeadFilters): Promise<string> {
    const leads = await storage.getLeads(filters);
    
    const headers = [
      "Company Name",
      "Website", 
      "Contact Name",
      "Title",
      "Email",
      "Phone",
      "Industry",
      "Company Size",
      "Revenue",
      "Location",
      "Lead Score",
      "Status",
      "Source",
      "Created Date"
    ];

    const csvRows = [headers.join(",")];

    for (const lead of leads) {
      const row = [
        this.escapeCsvField(lead.company.name),
        this.escapeCsvField(lead.company.website || ""),
        this.escapeCsvField(lead.contact.name),
        this.escapeCsvField(lead.contact.title || ""),
        this.escapeCsvField(lead.contact.email || ""),
        this.escapeCsvField(lead.contact.phone || ""),
        this.escapeCsvField(lead.company.industry || ""),
        this.escapeCsvField(lead.company.size || ""),
        this.escapeCsvField(lead.company.revenue || ""),
        this.escapeCsvField(lead.company.location || ""),
        lead.score?.toString() || "0",
        this.escapeCsvField(lead.status),
        this.escapeCsvField(lead.source || ""),
        lead.createdAt?.toISOString() || "",
      ];
      csvRows.push(row.join(","));
    }

    return csvRows.join("\n");
  }

  private generateMockCompanies(searchTerm: string, industry?: string, location?: string): InsertCompany[] {
    const mockCompanies: InsertCompany[] = [];
    const companyCount = Math.floor(Math.random() * 10) + 5; // 5-15 companies

    for (let i = 0; i < companyCount; i++) {
      const companyNames = [
        "TechFlow Inc", "DataSync Corp", "CloudBridge Solutions", "InnovateLab",
        "DigitalCore Systems", "SmartOps Technologies", "FutureScale Inc",
        "NextGen Platforms", "BrightPath Solutions", "CodeCraft Industries"
      ];

      const industries = industry ? [industry] : ["Technology", "Healthcare", "Finance", "Manufacturing", "Retail"];
      const sizes = ["1-10", "11-50", "51-200", "200+"];
      const revenues = ["$1M-$5M", "$5M-$10M", "$10M-$50M", "$50M+"];
      const locations = location ? [location] : ["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Boston, MA"];

      const name = `${searchTerm} ${companyNames[i % companyNames.length]}`;
      
      mockCompanies.push({
        name,
        website: `${name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}.com`,
        industry: industries[Math.floor(Math.random() * industries.length)],
        size: sizes[Math.floor(Math.random() * sizes.length)],
        revenue: revenues[Math.floor(Math.random() * revenues.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        description: `${name} provides innovative solutions in ${industry || "various industries"}`,
        founded: 2010 + Math.floor(Math.random() * 13),
      });
    }

    return mockCompanies;
  }

  private generateMockContacts(): InsertContact[] {
    const firstNames = ["John", "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Lisa"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"];
    const titles = ["CEO", "CTO", "VP of Marketing", "Head of Sales", "Director of Operations", "Product Manager"];

    return Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      return {
        name: `${firstName} ${lastName}`,
        title: titles[Math.floor(Math.random() * titles.length)],
        isDecisionMaker: Math.random() > 0.3,
        companyId: 0, // Will be set when creating the contact
      };
    });
  }

  private parseEmployeeRange(size?: string): number {
    if (!size) return 0;
    
    if (size.includes("1-10")) return 5;
    if (size.includes("11-50")) return 30;
    if (size.includes("51-200")) return 125;
    if (size.includes("200+")) return 500;
    
    return 0;
  }

  private parseRevenue(revenue?: string): number {
    if (!revenue) return 0;
    
    const match = revenue.match(/\$(\d+)M/);
    if (match) {
      return parseInt(match[1]) * 1000000;
    }
    
    return 0;
  }

  private generateFundingData() {
    const rounds = ["Seed", "Series A", "Series B", "Series C"];
    return {
      totalFunding: `$${Math.floor(Math.random() * 100) + 1}M`,
      lastRound: rounds[Math.floor(Math.random() * rounds.length)],
      investors: Math.floor(Math.random() * 10) + 1,
    };
  }

  private generateTechnologies(industry?: string) {
    const techByIndustry: { [key: string]: string[] } = {
      "Technology": ["React", "Node.js", "AWS", "Docker", "Kubernetes"],
      "Healthcare": ["HIPAA", "HL7", "EMR", "Telemedicine", "Medical Devices"],
      "Finance": ["Blockchain", "Fintech", "Payment Processing", "Risk Management", "Compliance"],
    };

    return techByIndustry[industry || "Technology"] || ["CRM", "ERP", "Analytics", "Cloud Computing"];
  }

  private calculateDataCompleteness(lead: any): number {
    let completeness = 0;
    const maxPoints = 10;
    
    if (lead.contact.email) completeness += 3;
    if (lead.contact.phone) completeness += 2;
    if (lead.contact.linkedinUrl) completeness += 2;
    if (lead.company.website) completeness += 1;
    if (lead.company.industry) completeness += 1;
    if (lead.company.size) completeness += 1;
    
    return Math.min(maxPoints, completeness);
  }

  private escapeCsvField(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}

export const leadGenerationService = new LeadGenerationService();
