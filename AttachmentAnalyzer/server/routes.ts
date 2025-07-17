import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { leadGenerationService } from "./services/leadGeneration";
import { emailGenerationService } from "./services/emailGeneration";
import { leadFiltersSchema, insertLeadSchema, insertEmailCampaignSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Lead routes
  app.get("/api/leads", async (req, res) => {
    try {
      const filters = leadFiltersSchema.parse(req.query);
      const leads = await storage.getLeads(filters);
      res.json(leads);
    } catch (error) {
      res.status(400).json({ error: "Invalid filters", details: error });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLeadWithDetails(id);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      res.status(400).json({ error: "Invalid lead data", details: error });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const lead = await storage.updateLead(id, updates);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLead(id);
      
      if (!success) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // Lead generation routes
  app.post("/api/leads/scrape", async (req, res) => {
    try {
      const { searchTerm, industry, location } = req.body;
      
      if (!searchTerm) {
        return res.status(400).json({ error: "Search term is required" });
      }

      const result = await leadGenerationService.scrapeLeads(searchTerm, industry, location);
      
      // Create companies and contacts, then leads
      const createdLeads = [];
      
      for (let i = 0; i < result.companies.length && i < result.contacts.length; i++) {
        const companyData = result.companies[i];
        const contactData = result.contacts[i];
        
        // Check if company already exists
        let company = await storage.getCompanyByWebsite(companyData.website || "");
        if (!company) {
          company = await storage.createCompany(companyData);
        }
        
        // Create contact
        const contact = await storage.createContact({
          ...contactData,
          companyId: company.id,
        });
        
        // Create lead
        const lead = await storage.createLead({
          companyId: company.id,
          contactId: contact.id,
          source: result.source,
          status: "pending",
        });
        
        // Calculate initial score
        const score = await leadGenerationService.calculateLeadScore(lead.id);
        
        createdLeads.push({ lead, company, contact, score });
      }
      
      res.json({
        message: `Successfully scraped ${createdLeads.length} leads`,
        leads: createdLeads,
        source: result.source,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to scrape leads", details: error });
    }
  });

  app.post("/api/leads/:id/enrich", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const enrichmentData = await leadGenerationService.enrichLead(id);
      res.json(enrichmentData);
    } catch (error) {
      res.status(500).json({ error: "Failed to enrich lead", details: error });
    }
  });

  app.post("/api/leads/:id/score", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const score = await leadGenerationService.calculateLeadScore(id);
      res.json({ leadId: id, score });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate lead score", details: error });
    }
  });

  // Export routes
  app.get("/api/leads/export/csv", async (req, res) => {
    try {
      const filters = leadFiltersSchema.parse(req.query);
      const csvData = await leadGenerationService.exportLeads(filters);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export leads", details: error });
    }
  });

  // Email generation routes
  app.get("/api/email/templates", async (req, res) => {
    try {
      const { industry } = req.query;
      const templates = emailGenerationService.getTemplates(industry as string);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/leads/:id/email/generate", async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const { templateId, customPrompt } = req.body;
      
      if (!templateId) {
        return res.status(400).json({ error: "Template ID is required" });
      }

      const emailData = await emailGenerationService.generateEmail(leadId, templateId, customPrompt);
      res.json(emailData);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate email", details: error });
    }
  });

  app.post("/api/email/campaigns", async (req, res) => {
    try {
      const campaignData = insertEmailCampaignSchema.parse(req.body);
      const campaign = await storage.createEmailCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      res.status(400).json({ error: "Invalid campaign data", details: error });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const stats = await storage.getLeadStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/analytics/chart", async (req, res) => {
    try {
      const analytics = await storage.getLeadAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Data sources status
  app.get("/api/data-sources", async (req, res) => {
    try {
      const sources = leadGenerationService.getDataSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data sources" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
