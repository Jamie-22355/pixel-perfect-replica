import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Download, Loader2, AlertCircle, Info, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { runAI, type Section } from "@/lib/ai.functions";
import { addActivity, type Activity } from "@/lib/activity";

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card p-5 ${className}`}>{children}</div>;
}

export function Disclaimer() {
  return (
    <div className="flex gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>AI-generated content may contain errors or omissions. Review, verify and edit all outputs before sharing or acting on them.</p>
    </div>
  );
}

export function useAITool(tool: Activity["tool"]) {
  const run = useServerFn(runAI);
  const [sections, setSections] = useState<Section[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(input: string, title: string, url?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await run({ data: { tool, input, url } });
      if (res.ok) {
        setSections(res.sections);
        addActivity({ tool, title });
      } else setError(res.error);
    } catch {
      setError("Couldn't reach the AI service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }
  return { sections, setSections, loading, error, generate };
}

function toMarkdown(title: string, sections: Section[]) {
  return `# ${title}\n\n` + sections.map((s) => `## ${s.title}\n\n${s.content}`).join("\n\n") + "\n";
}

export function ResultView({
  title, sections, setSections, loading, error,
}: {
  title: string;
  sections: Section[] | null;
  setSections: (s: Section[]) => void;
  loading: boolean;
  error: string | null;
}) {
  const [copied, setCopied] = useState(false);

  if (loading)
    return (
      <Panel className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Analysing your input…</p>
      </Panel>
    );
  if (error)
    return (
      <Panel className="flex gap-3 border-foreground">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Unable to generate results</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </Panel>
    );
  if (!sections)
    return (
      <Panel className="flex min-h-64 items-center justify-center border-dashed text-center text-sm text-muted-foreground">
        Results will appear here. Every section is editable.
      </Panel>
    );

  const md = toMarkdown(title, sections);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Results</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            await navigator.clipboard.writeText(md);
            setCopied(true); toast.success("Copied to clipboard");
            setTimeout(() => setCopied(false), 1500);
          }}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
            a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.md`;
            a.click();
          }}>
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>
      </div>
      {sections.map((s, i) => (
        <Panel key={i}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.title}</h3>
          <Textarea
            value={s.content}
            onChange={(e) => setSections(sections.map((x, j) => (j === i ? { ...x, content: e.target.value } : x)))}
            className="min-h-28 resize-y border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:ring-0"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
        </Panel>
      ))}
      <Disclaimer />
    </div>
  );
}
