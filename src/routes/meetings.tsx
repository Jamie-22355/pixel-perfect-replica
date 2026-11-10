import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, ResultView, useAITool } from "@/components/ToolKit";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — AI Workplace Assistant" },
      { name: "description", content: "Turn raw meeting notes into summaries, decisions and action items." },
      { property: "og:title", content: "Meeting Summarizer — AI Workplace Assistant" },
      { property: "og:description", content: "Turn raw meeting notes into summaries, decisions and action items." },
    ],
  }),
  component: Meetings,
});

function Meetings() {
  const [notes, setNotes] = useState("");
  const ai = useAITool("meeting");
  return (
    <>
      <PageHeader title="Meeting Summarizer" description="Paste your notes or transcript. Get a summary, decisions, owners and deadlines." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="h-fit space-y-4">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste meeting notes or a transcript…" className="min-h-96" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{notes.length.toLocaleString()} characters</span>
            <Button disabled={notes.trim().length < 20 || ai.loading} onClick={() => ai.generate(notes, notes.trim().split("\n")[0]?.slice(0, 60) ?? "Meeting notes")}>
              <Sparkles className="h-4 w-4" /> Summarize
            </Button>
          </div>
        </Panel>
        <ResultView title="Meeting Summary" {...ai} />
      </div>
    </>
  );
}
