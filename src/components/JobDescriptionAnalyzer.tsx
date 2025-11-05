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
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GEMINI_API_KEY } from "@/config/api";

interface JobDescriptionAnalyzerProps {
  onAnalyzeComplete?: (analysis: string) => void;
}

export default function JobDescriptionAnalyzer({ onAnalyzeComplete }: JobDescriptionAnalyzerProps) {
  const [open, setOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Error",
        description: "Please paste a job description to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      if (!GEMINI_API_KEY || !GEMINI_API_KEY.trim()) {
        toast({
          title: "API Key Missing",
          description: "Please set the VITE_GEMINI_API_KEY environment variable.",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      const prompt = `Analyze this job description and provide a comprehensive breakdown:

1. **Key Skills Required**: List the most important technical and soft skills
2. **Keywords**: Extract important keywords and phrases
3. **Experience Level**: Determine the required experience level (entry, mid, senior)
4. **Education Requirements**: Note any education requirements
5. **Responsibilities**: Summarize the main responsibilities
6. **Nice-to-Have vs Must-Have**: Categorize requirements
7. **Salary Range Estimate**: Based on the role and requirements, provide an estimated salary range (if applicable)
8. **Tips for Application**: Provide 3-5 actionable tips for tailoring a resume/cover letter for this position

Job Description:
${jobDescription}

Provide a well-structured, detailed analysis.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            systemInstruction: {
              parts: [
                {
                  text: "You are a career advisor expert at analyzing job descriptions. Provide clear, structured, and actionable insights. Use markdown formatting for better readability.",
                },
              ],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't analyze the job description. Please try again.";

      setAnalysis(result);
      
      if (onAnalyzeComplete) {
        onAnalyzeComplete(result);
      }

      toast({
        title: "Analysis Complete!",
        description: "Job description has been analyzed successfully.",
      });
    } catch (error) {
      console.error("Error analyzing job description:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setJobDescription("");
    setAnalysis(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Analyze JD
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Job Description Analyzer</DialogTitle>
          <DialogDescription>
            Paste a job description to get insights on required skills, keywords, experience level, and application tips.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!analysis ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Description</label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleReset} disabled={isAnalyzing}>
                  Clear
                </Button>
                <Button onClick={handleAnalyze} disabled={isAnalyzing || !jobDescription.trim()}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Analysis Results</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      Analyze Another
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(analysis);
                        toast({
                          title: "Copied!",
                          description: "Analysis copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg p-4 max-h-[500px] overflow-y-auto">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap font-sans">{analysis}</pre>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

