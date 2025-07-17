import { 
  companies, contacts, leads, enrichmentData, emailCampaigns,
  type Company, type Contact, type Lead, type EnrichmentData, type EmailCampaign,
  type InsertCompany, type InsertContact, type InsertLead, type InsertEnrichmentData, type InsertEmailCampaign,
  type LeadWithDetails, type LeadFilters
} from "@shared/schema";

export interface IStorage {
  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByWebsite(website: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;

  // Contacts
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByCompany(companyId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;

  // Leads
  getLead(id: number): Promise<Lead | undefined>;
  getLeadWithDetails(id: number): Promise<LeadWithDetails | undefined>;
  getLeads(filters?: LeadFilters): Promise<LeadWithDetails[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;

  // Enrichment Data
  getEnrichmentData(leadId: number): Promise<EnrichmentData[]>;
  createEnrichmentData(data: InsertEnrichmentData): Promise<EnrichmentData>;

  // Email Campaigns
  getEmailCampaign(id: number): Promise<EmailCampaign | undefined>;
  getEmailCampaignsByLead(leadId: number): Promise<EmailCampaign[]>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: number, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined>;

  // Analytics
  getLeadStats(): Promise<{
    totalLeads: number;
    enrichedLeads: number;
    avgScore: number;
    conversionRate: number;
  }>;

  getLeadAnalytics(): Promise<{
    labels: string[];
    totalLeads: number[];
    enrichedLeads: number[];
  }>;
}

export class MemStorage implements IStorage {
  private companies: Map<number, Company>;
  private contacts: Map<number, Contact>;
  private leads: Map<number, Lead>;
  private enrichmentData: Map<number, EnrichmentData>;
  private emailCampaigns: Map<number, EmailCampaign>;
  private currentId: { [key: string]: number };

  constructor() {
    this.companies = new Map();
    this.contacts = new Map();
    this.leads = new Map();
    this.enrichmentData = new Map();
    this.emailCampaigns = new Map();
    this.currentId = {
      companies: 1,
      contacts: 1,
      leads: 1,
      enrichmentData: 1,
      emailCampaigns: 1,
    };

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample companies
    const sampleCompanies = [
      {
        name: "TechCorp Solutions",
        website: "techcorp.com",
        industry: "Technology",
        size: "150-200",
        revenue: "$12M",
        location: "San Francisco, CA",
        description: "Leading software development company",
        founded: 2015,
        linkedinUrl: "https://linkedin.com/company/techcorp",
      },
      {
        name: "GlobalInc Ltd",
        website: "globalinc.com", 
        industry: "Healthcare",
        size: "500+",
        revenue: "$45M",
        location: "New York, NY",
        description: "Healthcare technology solutions",
        founded: 2010,
        linkedinUrl: "https://linkedin.com/company/globalinc",
      },
      {
        name: "Acme Industries",
        website: "acmeindustries.com",
        industry: "Manufacturing",
        size: "75-100",
        revenue: "$8M",
        location: "Chicago, IL",
        description: "Industrial manufacturing solutions",
        founded: 2008,
      },
    ];

    sampleCompanies.forEach((company, index) => {
      const id = this.currentId.companies++;
      this.companies.set(id, { 
        ...company, 
        id,
        logoUrl: null,
        crunchbaseUrl: null,
        apolloId: null
      });

      // Create contacts for each company
      const contacts = [
        {
          companyId: id,
          name: index === 0 ? "Sarah Johnson" : index === 1 ? "Michael Chen" : "Jennifer Park",
          title: index === 0 ? "VP of Marketing" : index === 1 ? "CEO" : "Head of Sales",
          email: index === 0 ? "sarah.j@techcorp.com" : index === 1 ? "m.chen@globalinc.com" : undefined,
          linkedinUrl: `https://linkedin.com/in/${index === 0 ? "sarah-johnson" : index === 1 ? "michael-chen" : "jennifer-park"}`,
          isDecisionMaker: true,
        },
      ];

      contacts.forEach((contact) => {
        const contactId = this.currentId.contacts++;
        this.contacts.set(contactId, { ...contact, id: contactId });

        // Create leads
        const leadId = this.currentId.leads++;
        const lead = {
          id: leadId,
          companyId: id,
          contactId: contactId,
          score: index === 0 ? 85 : index === 1 ? 92 : 67,
          status: index < 2 ? "enriched" : "pending",
          source: "apollo",
          tags: ["high-priority"],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.leads.set(leadId, lead as Lead);

        // Create enrichment data for enriched leads
        if (index < 2) {
          const enrichmentId = this.currentId.enrichmentData++;
          this.enrichmentData.set(enrichmentId, {
            id: enrichmentId,
            leadId,
            dataSource: "apollo",
            enrichedFields: {
              email: contact.email,
              phone: index === 0 ? "+1-555-0123" : "+1-555-0456",
              social: { linkedin: contact.linkedinUrl },
            },
            confidence: "0.95",
            enrichedAt: new Date(),
          } as EnrichmentData);
        }
      });
    });
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanyByWebsite(website: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(c => c.website === website);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const id = this.currentId.companies++;
    const newCompany: Company = { ...company, id };
    this.companies.set(id, newCompany);
    return newCompany;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const existing = this.companies.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...company };
    this.companies.set(id, updated);
    return updated;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactsByCompany(companyId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(c => c.companyId === companyId);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.currentId.contacts++;
    const newContact: Contact = { ...contact, id };
    this.contacts.set(id, newContact);
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const existing = this.contacts.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...contact };
    this.contacts.set(id, updated);
    return updated;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeadWithDetails(id: number): Promise<LeadWithDetails | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const company = await this.getCompany(lead.companyId!);
    const contact = await this.getContact(lead.contactId!);
    const enrichmentData = await this.getEnrichmentData(id);

    if (!company || !contact) return undefined;

    return {
      ...lead,
      company,
      contact,
      enrichmentData,
    };
  }

  async getLeads(filters?: LeadFilters): Promise<LeadWithDetails[]> {
    let filteredLeads = Array.from(this.leads.values());

    if (filters) {
      if (filters.status) {
        filteredLeads = filteredLeads.filter(lead => lead.status === filters.status);
      }
      if (filters.minScore) {
        filteredLeads = filteredLeads.filter(lead => (lead.score || 0) >= filters.minScore!);
      }
      if (filters.sources && filters.sources.length > 0) {
        filteredLeads = filteredLeads.filter(lead => filters.sources!.includes(lead.source || ""));
      }
    }

    const leadsWithDetails: LeadWithDetails[] = [];
    
    for (const lead of filteredLeads) {
      const company = await this.getCompany(lead.companyId!);
      const contact = await this.getContact(lead.contactId!);
      const enrichmentData = await this.getEnrichmentData(lead.id);

      if (company && contact) {
        let includeInResults = true;

        if (filters) {
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            includeInResults = company.name.toLowerCase().includes(searchTerm) ||
                             contact.name.toLowerCase().includes(searchTerm) ||
                             (company.website || "").toLowerCase().includes(searchTerm);
          }
          if (filters.industry && company.industry !== filters.industry) {
            includeInResults = false;
          }
          if (filters.companySizes && filters.companySizes.length > 0) {
            includeInResults = includeInResults && filters.companySizes.includes(company.size || "");
          }
          if (filters.location) {
            includeInResults = includeInResults && 
              (company.location || "").toLowerCase().includes(filters.location.toLowerCase());
          }
        }

        if (includeInResults) {
          leadsWithDetails.push({
            ...lead,
            company,
            contact,
            enrichmentData,
          });
        }
      }
    }

    return leadsWithDetails.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.currentId.leads++;
    const now = new Date();
    const newLead: Lead = { 
      ...lead, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.leads.set(id, newLead);
    return newLead;
  }

  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const existing = this.leads.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...lead, updatedAt: new Date() };
    this.leads.set(id, updated);
    return updated;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leads.delete(id);
  }

  async getEnrichmentData(leadId: number): Promise<EnrichmentData[]> {
    return Array.from(this.enrichmentData.values()).filter(e => e.leadId === leadId);
  }

  async createEnrichmentData(data: InsertEnrichmentData): Promise<EnrichmentData> {
    const id = this.currentId.enrichmentData++;
    const newData: EnrichmentData = { 
      ...data, 
      id, 
      enrichedAt: new Date() 
    };
    this.enrichmentData.set(id, newData);
    return newData;
  }

  async getEmailCampaign(id: number): Promise<EmailCampaign | undefined> {
    return this.emailCampaigns.get(id);
  }

  async getEmailCampaignsByLead(leadId: number): Promise<EmailCampaign[]> {
    return Array.from(this.emailCampaigns.values()).filter(e => e.leadId === leadId);
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const id = this.currentId.emailCampaigns++;
    const newCampaign: EmailCampaign = { ...campaign, id };
    this.emailCampaigns.set(id, newCampaign);
    return newCampaign;
  }

  async updateEmailCampaign(id: number, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined> {
    const existing = this.emailCampaigns.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...campaign };
    this.emailCampaigns.set(id, updated);
    return updated;
  }

  async getLeadStats(): Promise<{
    totalLeads: number;
    enrichedLeads: number;
    avgScore: number;
    conversionRate: number;
  }> {
    const allLeads = Array.from(this.leads.values());
    const enrichedLeads = allLeads.filter(lead => lead.status === "enriched");
    const convertedLeads = allLeads.filter(lead => lead.status === "converted");
    
    const totalScore = allLeads.reduce((sum, lead) => sum + (lead.score || 0), 0);
    const avgScore = allLeads.length > 0 ? totalScore / allLeads.length : 0;
    
    const conversionRate = allLeads.length > 0 ? (convertedLeads.length / allLeads.length) * 100 : 0;

    return {
      totalLeads: allLeads.length,
      enrichedLeads: enrichedLeads.length,
      avgScore: Math.round(avgScore * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }

  async getLeadAnalytics(): Promise<{
    labels: string[];
    totalLeads: number[];
    enrichedLeads: number[];
  }> {
    // Generate mock analytics data for the past 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totalLeads = [120, 190, 300, 500, 200, 300, 450, 320, 380, 420, 520, 600];
    const enrichedLeads = [80, 140, 220, 380, 150, 220, 340, 240, 290, 320, 400, 480];

    return {
      labels: months,
      totalLeads,
      enrichedLeads,
    };
  }
}

export const storage = new MemStorage();
