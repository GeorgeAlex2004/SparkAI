import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Briefcase, Mail, MessageSquare, Search, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Template = {
  id: string;
  category: "cover-letter" | "resume" | "email" | "interview";
  title: string;
  description: string;
  content: string;
  industry?: string;
};

const TEMPLATES: Template[] = [
  // Cover Letters
  {
    id: "cl-tech",
    category: "cover-letter",
    title: "Technology/Software Engineer",
    industry: "Technology",
    description: "Cover letter template for software engineering positions",
    content: `[Your Name]
[Your Address]
[Your Phone Number]
[Your Email Address]
[Date]

[Hiring Manager Name]
[Company Name]
[Company Address]

Dear [Hiring Manager Name],

I am writing to express my strong interest in the Software Engineer position at [Company Name]. With [X years] of experience in software development and a passion for creating innovative solutions, I am excited about the opportunity to contribute to your team.

In my previous role at [Previous Company], I [Key Achievement]. I have extensive experience with [Relevant Technologies], and I am particularly drawn to [Company Name]'s commitment to [Company Value/Mission].

I am confident that my technical skills and collaborative approach would make me a valuable addition to your engineering team. Thank you for considering my application.

Sincerely,
[Your Name]`,
  },
  {
    id: "cl-finance",
    category: "cover-letter",
    title: "Finance/Analyst",
    industry: "Finance",
    description: "Cover letter template for finance and analyst positions",
    content: `[Your Name]
[Your Address]
[Your Phone Number]
[Your Email Address]
[Date]

[Hiring Manager Name]
[Company Name]
[Company Address]

Dear [Hiring Manager Name],

I am writing to apply for the [Position Title] role at [Company Name]. With a strong background in financial analysis and [X years] of experience, I am eager to bring my analytical skills and attention to detail to your team.

At [Previous Company], I [Key Achievement involving numbers/data]. My expertise in [Relevant Skills/Tools] aligns well with the requirements of this position.

I am particularly interested in [Company Name] because of [Specific Reason]. I would welcome the opportunity to discuss how my experience can contribute to your team's success.

Best regards,
[Your Name]`,
  },
  {
    id: "cl-marketing",
    category: "cover-letter",
    title: "Marketing/Communications",
    industry: "Marketing",
    description: "Cover letter template for marketing positions",
    content: `[Your Name]
[Your Address]
[Your Phone Number]
[Your Email Address]
[Date]

[Hiring Manager Name]
[Company Name]
[Company Address]

Dear [Hiring Manager Name],

I am thrilled to apply for the [Position Title] position at [Company Name]. With [X years] of experience in digital marketing and a proven track record of [Key Achievement], I am excited about the opportunity to contribute to your marketing team.

My experience includes [Relevant Skills/Experience], and I have successfully [Key Achievement with metrics]. I am particularly drawn to [Company Name]'s innovative approach to [Specific Area].

I would love to discuss how my creative and strategic marketing skills can help [Company Name] achieve its goals.

Warm regards,
[Your Name]`,
  },
  // Resume Sections
  {
    id: "resume-summary",
    category: "resume",
    title: "Professional Summary",
    description: "Template for a strong professional summary section",
    content: `Results-driven [Your Title] with [X] years of experience in [Industry/Field]. Proven track record of [Key Achievement 1] and [Key Achievement 2]. Skilled in [Key Skill 1], [Key Skill 2], and [Key Skill 3]. Passionate about [Your Passion/Interest].`,
  },
  {
    id: "resume-bullet",
    category: "resume",
    title: "Impactful Bullet Point",
    description: "Template for creating strong resume bullet points",
    content: `[Action Verb] [What You Did] resulting in [Quantifiable Result]

Examples:
• Developed and deployed a new feature that increased user engagement by 35%
• Streamlined the sales process, reducing customer acquisition time by 40%
• Managed a team of 5 engineers, delivering 3 major product releases on time
• Analyzed financial data and identified cost-saving opportunities worth $250K`,
  },
  {
    id: "resume-skills",
    category: "resume",
    title: "Skills Section",
    description: "Template for organizing your skills section",
    content: `Technical Skills: [Skill 1], [Skill 2], [Skill 3], [Skill 4]
Programming Languages: [Language 1], [Language 2], [Language 3]
Tools & Technologies: [Tool 1], [Tool 2], [Tool 3]
Soft Skills: [Skill 1], [Skill 2], [Skill 3]`,
  },
  // Email Templates
  {
    id: "email-followup",
    category: "email",
    title: "Interview Follow-up",
    description: "Professional follow-up email after an interview",
    content: `Subject: Thank You - [Position Title] Interview

Dear [Interviewer Name],

Thank you for taking the time to speak with me today about the [Position Title] role at [Company Name]. I enjoyed our conversation and learning more about [Specific Topic Discussed].

I am particularly excited about [Specific Aspect of Role/Company] and how my experience with [Relevant Experience] aligns with your team's needs.

I would be delighted to contribute to [Company Name]'s mission of [Mission/Goal]. Please let me know if you need any additional information.

Best regards,
[Your Name]
[Your Phone Number]
[Your Email]`,
  },
  {
    id: "email-networking",
    category: "email",
    title: "Networking/Informational Interview",
    description: "Email template for requesting informational interviews",
    content: `Subject: Informational Interview Request - [Your Name]

Dear [Contact Name],

I hope this email finds you well. I came across your profile on [Where You Found Them] and was impressed by your experience in [Their Field/Industry].

I am currently [Your Situation] and would greatly appreciate the opportunity to learn more about [Specific Topic]. I would be grateful if you could spare 15-20 minutes for a brief informational interview.

I am flexible with timing and happy to work around your schedule. Thank you for considering my request.

Best regards,
[Your Name]
[Your Email]
[Your Phone Number]`,
  },
  {
    id: "email-application",
    category: "email",
    title: "Job Application Submission",
    description: "Email template for submitting a job application",
    content: `Subject: Application for [Position Title] - [Your Name]

Dear [Hiring Manager Name],

I am writing to express my interest in the [Position Title] position at [Company Name], as advertised on [Where You Found It]. Please find my resume and cover letter attached.

With [X years] of experience in [Relevant Field], I am confident that I would be a valuable addition to your team. I am particularly drawn to [Company Name] because of [Specific Reason].

I would welcome the opportunity to discuss how my skills and experience align with your needs. Thank you for your consideration.

Best regards,
[Your Name]
[Your Phone Number]
[Your Email]`,
  },
  // Interview Answers
  {
    id: "interview-strengths",
    category: "interview",
    title: "Tell Me About Your Strengths",
    description: "Template for answering the strengths question",
    content: `One of my greatest strengths is [Specific Strength]. For example, in my previous role, I [Specific Example]. This resulted in [Quantifiable Outcome].

I also pride myself on [Second Strength]. I demonstrated this when [Specific Example]. This strength has helped me [Benefit/Result].

Additionally, I am [Third Strength], which I showed by [Specific Example].`,
  },
  {
    id: "interview-weakness",
    category: "interview",
    title: "Tell Me About Your Weaknesses",
    description: "Template for answering the weaknesses question",
    content: `One area I've been working to improve is [Specific Area]. I recognized this when [Specific Situation]. To address this, I [Action Taken], which has resulted in [Positive Outcome].

I've also learned to [Skill/Behavior] by [Specific Action]. This has helped me become more [Positive Trait].

I continue to actively develop this skill through [Ongoing Action].`,
  },
  {
    id: "interview-why-company",
    category: "interview",
    title: "Why Do You Want to Work Here?",
    description: "Template for answering why you want to work at the company",
    content: `I am excited about [Company Name] for several reasons:

1. [Company Value/Mission] - I am particularly drawn to [Specific Aspect] because [Your Reason].

2. [Company Innovation/Growth] - I am impressed by [Specific Achievement/Project] and would love to contribute to similar initiatives.

3. [Company Culture/Team] - Based on my research, [Company Name] values [Value], which aligns with my own professional values.

4. [Role Specific] - The opportunity to [Specific Aspect of Role] is exactly what I'm looking for in my next position.`,
  },
];

interface TemplatesLibraryProps {
  onSelectTemplate: (content: string) => void;
}

export default function TemplatesLibrary({ onSelectTemplate }: TemplatesLibraryProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  const categories = [
    { id: "all", label: "All Templates", icon: FileText },
    { id: "cover-letter", label: "Cover Letters", icon: Briefcase },
    { id: "resume", label: "Resume Sections", icon: FileText },
    { id: "email", label: "Email Templates", icon: Mail },
    { id: "interview", label: "Interview Answers", icon: MessageSquare },
  ];

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.industry && template.industry.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template.content);
    setOpen(false);
    toast({
      title: "Template inserted",
      description: `${template.title} has been added to your input.`,
    });
  };

  const handleCopyTemplate = (e: React.MouseEvent, content: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Template copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Templates Library</DialogTitle>
          <DialogDescription>
            Browse and insert pre-built templates for cover letters, resumes, emails, and interview answers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Templates Grid */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No templates found. Try a different search term.
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{template.title}</h3>
                        {template.industry && (
                          <span className="text-xs text-muted-foreground">{template.industry}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleCopyTemplate(e, template.content)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                    <div className="text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">{template.content.substring(0, 150)}...</pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

