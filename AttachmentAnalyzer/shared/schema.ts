import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
  industry: text("industry"),
  size: text("size"), // e.g., "11-50", "51-200", "200+"
  revenue: text("revenue"), // e.g., "$1M-$5M"
  location: text("location"),
  description: text("description"),
  founded: integer("founded"),
  logoUrl: text("logo_url"),
  linkedinUrl: text("linkedin_url"),
  crunchbaseUrl: text("crunchbase_url"),
  apolloId: text("apollo_id"),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  isDecisionMaker: boolean("is_decision_maker").default(false),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  contactId: integer("contact_id").references(() => contacts.id),
  score: integer("score").default(0), // 0-100 lead score
  status: text("status").notNull().default("pending"), // pending, enriched, contacted, converted
  source: text("source"), // apollo, linkedin, crunchbase, manual
  tags: text("tags").array(),
  notes: text("notes"),
  lastContactDate: timestamp("last_contact_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const enrichmentData = pgTable("enrichment_data", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  dataSource: text("data_source").notNull(), // apollo, linkedin, crunchbase, etc.
  enrichedFields: jsonb("enriched_fields"), // JSON object with enriched data
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  enrichedAt: timestamp("enriched_at").defaultNow(),
});

export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  template: text("template"),
  sentAt: timestamp("sent_at"),
  status: text("status").default("draft"), // draft, sent, delivered, opened, replied
});

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEnrichmentDataSchema = createInsertSchema(enrichmentData).omit({
  id: true,
  enrichedAt: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
});

// Types
export type Company = typeof companies.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type EnrichmentData = typeof enrichmentData.$inferSelect;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertEnrichmentData = z.infer<typeof insertEnrichmentDataSchema>;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;

// Lead with related data
export type LeadWithDetails = Lead & {
  company: Company;
  contact: Contact;
  enrichmentData?: EnrichmentData[];
};

// Filter types
export const leadFiltersSchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  companySizes: z.array(z.string()).optional(),
  minRevenue: z.number().optional(),
  maxRevenue: z.number().optional(),
  location: z.string().optional(),
  minScore: z.number().min(0).max(100).optional(),
  status: z.enum(["pending", "enriched", "contacted", "converted"]).optional(),
  sources: z.array(z.string()).optional(),
});

export type LeadFilters = z.infer<typeof leadFiltersSchema>;
