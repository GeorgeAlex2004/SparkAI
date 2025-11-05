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
import { FileText, Loader2, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GEMINI_API_KEY } from "@/config/api";

interface ATSCheckerProps {
  onCheckComplete?: (analysis: string) => void;
}

export default function ATSChecker({ onCheckComplete }: ATSCheckerProps) {
  const [open, setOpen] = useState(false);
  const [resumeContent, setResumeContent] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [analysis, setAnalysis] = useState<{
    score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  } | null>(null);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (!resumeContent.trim()) {
      toast({
        title: "Error",
        description: "Please paste your resume content to check ATS compatibility.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    setAnalysis(null);

    try {
      if (!GEMINI_API_KEY || !GEMINI_API_KEY.trim()) {
        toast({
          title: "API Key Missing",
          description: "Please set the VITE_GEMINI_API_KEY environment variable.",
          variant: "destructive",
        });
        setIsChecking(false);
        return;
      }

      const prompt = `Analyze this resume content for ATS (Applicant Tracking System) compatibility. Provide:

1. **ATS Score (0-100)**: Rate the resume's ATS compatibility
2. **Key Strengths**: List what's working well for ATS
3. **Key Weaknesses**: List what might cause issues with ATS
4. **Specific Suggestions**: Provide actionable improvements
5. **Keyword Optimization**: Identify missing important keywords (if applicable)
6. **Formatting Issues**: Note any formatting problems that could affect ATS parsing

Resume Content:
${resumeContent}

Provide a detailed analysis with specific, actionable recommendations. Format as:
ATS Score: [0-100]/100
Strengths: [list]
Weaknesses: [list]
Suggestions: [list]
Keyword Recommendations: [list]
Formatting Issues: [list]`;

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
                  text: "You are an expert ATS (Applicant Tracking System) compatibility analyst. Provide clear, structured feedback with specific recommendations. Use markdown formatting for better readability. Always provide a score from 0-100.",
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
        data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't analyze the resume. Please try again.";

      // Parse score from response (look for "Score: XX" or "XX/100")
      const scoreMatch = result.match(/(\d+)\s*\/\s*100|Score:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : null;

      // Parse sections (simple parsing, can be improved)
      const strengths = result.match(/Strengths?:?\s*\n([\s\S]*?)(?=\n\s*(?:Weaknesses|Suggestions|$))/i)?.[1]?.split('\n').filter(l => l.trim()) || [];
      const weaknesses = result.match(/Weaknesses?:?\s*\n([\s\S]*?)(?=\n\s*(?:Suggestions|$))/i)?.[1]?.split('\n').filter(l => l.trim()) || [];
      const suggestions = result.match(/Suggestions?:?\s*\n([\s\S]*?)(?=\n\s*(?:Keyword|Formatting|$))/i)?.[1]?.split('\n').filter(l => l.trim()) || [];

      setAnalysis({
        score: score || 0,
        feedback: result,
        strengths: strengths.slice(0, 5),
        weaknesses: weaknesses.slice(0, 5),
        suggestions: suggestions.slice(0, 5),
      });

      if (onCheckComplete) {
        onCheckComplete(result);
      }

      toast({
        title: "Analysis Complete!",
        description: `ATS compatibility check completed. Score: ${score || "N/A"}/100`,
      });
    } catch (error) {
      console.error("Error checking ATS compatibility:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    setResumeContent("");
    setAnalysis(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          ATS Check
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>ATS Compatibility Checker</DialogTitle>
          <DialogDescription>
            Paste your resume content to check ATS compatibility, get a score, and receive optimization suggestions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!analysis ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Resume Content</label>
                <Textarea
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  placeholder="Paste your resume content here (text format works best for ATS analysis)..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Paste plain text from your resume for best results. ATS systems parse text, not formatted documents.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleReset} disabled={isChecking}>
                  Clear
                </Button>
                <Button onClick={handleCheck} disabled={isChecking || !resumeContent.trim()}>
                  {isChecking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Check ATS Compatibility
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                {/* Score Display */}
                <div className={`rounded-lg p-6 ${getScoreBg(analysis.score)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">ATS Compatibility Score</h3>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>
                          {analysis.score}
                        </span>
                        <span className="text-2xl text-muted-foreground">/100</span>
                      </div>
                    </div>
                    {analysis.score >= 80 ? (
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    ) : analysis.score >= 60 ? (
                      <TrendingUp className="h-12 w-12 text-yellow-600" />
                    ) : (
                      <XCircle className="h-12 w-12 text-red-600" />
                    )}
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.strengths.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Strengths
                      </h4>
                      <ul className="text-sm space-y-1">
                        {analysis.strengths.map((item, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.weaknesses.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Areas to Improve
                      </h4>
                      <ul className="text-sm space-y-1">
                        {analysis.weaknesses.map((item, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Full Analysis */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Detailed Analysis</label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        Check Another
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(analysis.feedback);
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
                  <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-sans">{analysis.feedback}</pre>
                    </div>
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

