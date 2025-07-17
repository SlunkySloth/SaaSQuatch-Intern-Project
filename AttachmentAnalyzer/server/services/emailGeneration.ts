import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  industry?: string;
  tone: "professional" | "casual" | "urgent" | "friendly";
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "cold_outreach_tech",
    name: "Cold Outreach - Technology",
    description: "Professional cold outreach for technology companies",
    industry: "Technology",
    tone: "professional",
  },
  {
    id: "follow_up_demo",
    name: "Follow-up - Post Demo",
    description: "Follow-up email after product demonstration",
    tone: "friendly",
  },
  {
    id: "introduction_mutual",
    name: "Introduction - Mutual Connection",
    description: "Introduction email through mutual connections",
    tone: "casual",
  },
  {
    id: "partnership_proposal",
    name: "Partnership Proposal",
    description: "Business partnership proposal email",
    tone: "professional",
  },
];

export class EmailGenerationService {
  
  /**
   * Generate personalized email using templates (no AI API required)
   */
  async generateEmail(
    leadId: number, 
    templateId: string, 
    customPrompt?: string
  ): Promise<{
    subject: string;
    content: string;
    template: string;
  }> {
    const lead = await storage.getLeadWithDetails(leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }

    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Generate email using templates instead of AI
    const { subject, content } = this.generateFromTemplate(lead, template, customPrompt);
    
    return {
      subject,
      content,
      template: templateId,
    };
  }

  /**
   * Get available email templates
   */
  getTemplates(industry?: string): EmailTemplate[] {
    if (industry) {
      return EMAIL_TEMPLATES.filter(t => !t.industry || t.industry === industry);
    }
    return EMAIL_TEMPLATES;
  }

  /**
   * Analyze email performance (mock implementation)
   */
  async analyzeEmailPerformance(campaignId: number): Promise<{
    openRate: number;
    clickRate: number;
    replyRate: number;
    sentiment: "positive" | "neutral" | "negative";
  }> {
    // In a real implementation, this would analyze actual email metrics
    return {
      openRate: Math.random() * 0.4 + 0.2, // 20-60%
      clickRate: Math.random() * 0.15 + 0.05, // 5-20%
      replyRate: Math.random() * 0.1 + 0.02, // 2-12%
      sentiment: ["positive", "neutral", "negative"][Math.floor(Math.random() * 3)] as any,
    };
  }

  /**
   * Generate email subject line variations
   */
  async generateSubjectVariations(originalSubject: string, count: number = 3): Promise<string[]> {
    const prompt = `Generate ${count} alternative subject lines for this email subject: "${originalSubject}". 
    Make them compelling, personalized, and optimized for open rates. 
    Return as JSON array with "subjects" key.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0.8,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.subjects || [originalSubject];
    } catch (error) {
      return [originalSubject];
    }
  }

  private buildSystemPrompt(template: EmailTemplate): string {
    return `You are an expert B2B sales email writer. Generate personalized outreach emails that are:
    
    1. Professional and ${template.tone}
    2. Personalized to the recipient and company
    3. Focused on value proposition
    4. Include a clear call-to-action
    5. Keep it concise (under 150 words)
    6. Reference specific company details when available
    
    Template context: ${template.description}
    ${template.industry ? `Industry focus: ${template.industry}` : ""}
    
    Return JSON with "subject" and "content" fields.
    Subject should be compelling and personalized.
    Content should be the full email body including greeting and signature.`;
  }

  /**
   * Generate email from template without AI
   */
  private generateFromTemplate(lead: any, template: EmailTemplate, customPrompt?: string): { subject: string; content: string } {
    const contact = lead.contact;
    const company = lead.company;
    
    let subject = "";
    let content = "";
    
    switch (template.id) {
      case "cold_outreach_tech":
        subject = `Helping ${company.name} scale with modern technology solutions`;
        content = `Hi ${contact.name},

I noticed ${company.name} is in the ${company.industry || "technology"} space and thought you might be interested in how we've helped similar companies ${company.size ? `of ${company.size} employees` : ""} streamline their operations.

${company.revenue ? `Given your company's scale (${company.revenue}), ` : ""}we typically see organizations like yours benefit from our solutions in three key areas:

• Operational efficiency improvements
• Technology stack optimization  
• Process automation

Would you be open to a brief 15-minute conversation to discuss how this might apply to ${company.name}?

Best regards,
[Your Name]

P.S. I'm based ${company.location ? `near ${company.location}` : "locally"} and would be happy to meet in person if that works better.`;
        break;
        
      case "follow_up_demo":
        subject = `Following up on our ${company.name} discussion`;
        content = `Hi ${contact.name},

Thank you for taking the time to speak with me about ${company.name}'s goals and challenges.

Based on our conversation, I believe our solution could help you with:
${customPrompt || "• Streamlining your current processes\n• Reducing operational overhead\n• Improving team efficiency"}

I'd love to schedule a brief demo to show you exactly how this would work for ${company.name}.

Are you available for a 20-minute call this week?

Best,
[Your Name]`;
        break;
        
      case "introduction_mutual":
        subject = `Introduction: Helping ${company.name} with ${company.industry || "business"} solutions`;
        content = `Hi ${contact.name},

[Mutual Connection] suggested I reach out to you regarding ${company.name}'s ${company.industry || "business"} initiatives.

I work with ${company.industry || "technology"} companies ${company.size ? `of ${company.size} employees` : ""} to help them optimize their operations and scale more efficiently.

Would you be interested in a brief conversation about how we might be able to help ${company.name}?

Looking forward to connecting,
[Your Name]`;
        break;
        
      case "partnership_proposal":
        subject = `Partnership opportunity for ${company.name}`;
        content = `Hi ${contact.name},

I've been following ${company.name}'s work in ${company.industry || "your industry"} and I'm impressed by your approach.

We work with leading ${company.industry || "technology"} companies to help them expand their capabilities and reach new markets. Given ${company.name}'s expertise${company.location ? ` and presence in ${company.location}` : ""}, I believe there could be a strong partnership opportunity.

Would you be open to exploring how we might work together?

Best regards,
[Your Name]`;
        break;
        
      default:
        subject = `Following up with ${company.name}`;
        content = `Hi ${contact.name},

I wanted to reach out regarding ${company.name} and how we might be able to help with your ${company.industry || "business"} objectives.

${customPrompt || "We specialize in helping companies like yours achieve their goals through innovative solutions."}

Would you be interested in a brief conversation?

Best,
[Your Name]`;
    }
    
    return { subject, content };
  }

  private buildUserPrompt(lead: any, customPrompt?: string): string {
    const enrichmentData = lead.enrichmentData?.[0];
    
    let prompt = `Generate an email for:
    
    Recipient: ${lead.contact.name}
    Title: ${lead.contact.title || "Unknown"}
    Company: ${lead.company.name}
    Industry: ${lead.company.industry || "Unknown"}
    Company Size: ${lead.company.size || "Unknown"}
    Revenue: ${lead.company.revenue || "Unknown"}
    Location: ${lead.company.location || "Unknown"}
    Website: ${lead.company.website || "Unknown"}
    
    ${enrichmentData ? `Additional context: ${JSON.stringify(enrichmentData.enrichedFields)}` : ""}
    
    ${customPrompt ? `Custom requirements: ${customPrompt}` : ""}`;

    return prompt;
  }
}

export const emailGenerationService = new EmailGenerationService();
