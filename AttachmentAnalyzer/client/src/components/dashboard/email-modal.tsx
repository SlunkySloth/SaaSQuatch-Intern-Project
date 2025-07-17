import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Send, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  industry?: string;
  tone: string;
}

interface GeneratedEmail {
  subject: string;
  content: string;
  template: string;
}

export default function EmailModal({ isOpen, onClose, leadId }: EmailModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email/templates"],
    enabled: isOpen,
  });

  const { data: lead } = useQuery({
    queryKey: ["/api/leads", leadId],
    enabled: isOpen && leadId !== null,
  });

  const generateEmailMutation = useMutation({
    mutationFn: async ({ templateId, prompt }: { templateId: string; prompt?: string }) => {
      if (!leadId) throw new Error("No lead selected");
      
      const response = await apiRequest("POST", `/api/leads/${leadId}/email/generate`, {
        templateId,
        customPrompt: prompt,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedEmail(data);
      toast({
        title: "Email Generated",
        description: "AI-powered email has been generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveEmailMutation = useMutation({
    mutationFn: async (emailData: GeneratedEmail) => {
      if (!leadId) throw new Error("No lead selected");
      
      const response = await apiRequest("POST", "/api/email/campaigns", {
        leadId,
        subject: emailData.subject,
        content: emailData.content,
        template: emailData.template,
        status: "draft",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Saved",
        description: "Email has been saved as a draft",
      });
      onClose();
    },
  });

  const handleGenerateEmail = () => {
    if (!selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select an email template",
        variant: "destructive",
      });
      return;
    }

    generateEmailMutation.mutate({
      templateId: selectedTemplate,
      prompt: customPrompt || undefined,
    });
  };

  const handleCopyEmail = () => {
    if (generatedEmail) {
      const emailText = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.content}`;
      navigator.clipboard.writeText(emailText);
      toast({
        title: "Copied to Clipboard",
        description: "Email has been copied to your clipboard",
      });
    }
  };

  const handleSendEmail = () => {
    if (generatedEmail) {
      saveEmailMutation.mutate(generatedEmail);
    }
  };

  const handleClose = () => {
    setSelectedTemplate("");
    setCustomPrompt("");
    setGeneratedEmail(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI-Generated Email</DialogTitle>
          <DialogDescription>
            {lead ? `Personalized outreach email for ${lead.contact?.name} at ${lead.company?.name}` : "Generate personalized outreach email"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="template" className="text-sm font-medium">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="prompt" className="text-sm font-medium">Custom Instructions (Optional)</Label>
            <Textarea
              id="prompt"
              placeholder="Add any specific requirements or talking points..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {!generatedEmail ? (
            <Button
              onClick={handleGenerateEmail}
              disabled={generateEmailMutation.isPending || !selectedTemplate}
              className="w-full"
            >
              {generateEmailMutation.isPending ? "Generating..." : "Generate Email"}
            </Button>
          ) : (
            <>
              <div>
                <Label className="text-sm font-medium">Generated Email</Label>
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-sm mt-2">
                  <div className="space-y-3">
                    <p><strong>Subject:</strong> {generatedEmail.subject}</p>
                    <div className="whitespace-pre-line">{generatedEmail.content}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleClose}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleCopyEmail}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Email
                </Button>
                <Button 
                  onClick={handleSendEmail}
                  disabled={saveEmailMutation.isPending}
                  className="bg-brand-500 hover:bg-brand-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {saveEmailMutation.isPending ? "Saving..." : "Save Draft"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
