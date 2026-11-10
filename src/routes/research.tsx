import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, ResultView, useAITool } from "@/components/ToolKit";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — AI Workplace Assistant" },
      { name: "description", content: "Summarise topics, articles and web pages into insights and recommendations." },
      { property: "og:title", content: "Research Assistant — AI Workplace Assistant" },
      { property: "og:description", content: "Summarise topics, articles and web pages into insights and recommendations." },
    ],
  }),
  component: Research,
});

function Research() {
  const [topic, setTopic] = useState("");
  const [article, setArticle] = useState("");
  const [url, setUrl] = useState("");
  const ai = useAITool("research");
  const urlValid = !url || /^https?:\/\/.+\..+/.test(url);
  const canRun = (topic.trim() || article.trim() || url.trim()) && urlValid && !ai.loading;

  const submit = () => {
    const input = [topic && `Research topic: ${topic}`, article && `Source material:\n${article}`, url && `Analyse this web page.`].filter(Boolean).join("\n\n");
    ai.generate(input, topic || url || article.slice(0, 60), url || undefined);
  };

  return (
    <>
      <PageHeader title="Research Assistant" description="Provide a topic, paste an article, or add a URL — or combine all three." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="h-fit space-y-4">
          <label className="block space-y-1.5"><span className="text-sm font-medium">Topic or question</span>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Impact of four-day work weeks on productivity" /></label>
          <label className="block space-y-1.5"><span className="text-sm font-medium">Website URL</span>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            {!urlValid && <span className="text-xs text-destructive">Enter a full URL starting with http:// or https://</span>}</label>
          <label className="block space-y-1.5"><span className="text-sm font-medium">Pasted article</span>
            <Textarea value={article} onChange={(e) => setArticle(e.target.value)} placeholder="Paste article text…" className="min-h-60" /></label>
          <div className="flex justify-end"><Button disabled={!canRun} onClick={submit}><Sparkles className="h-4 w-4" /> Analyse</Button></div>
        </Panel>
        <ResultView title="Research Brief" {...ai} />
      </div>
    </>
  );
}
