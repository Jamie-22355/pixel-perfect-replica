import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Disclaimer, PageHeader, Panel } from "@/components/ToolKit";
import { getAIStatus } from "@/lib/ai.functions";
import { clearActivity } from "@/lib/activity";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AI Workplace Assistant" },
      { name: "description", content: "AI connection status and local data settings." },
      { property: "og:title", content: "Settings — AI Workplace Assistant" },
      { property: "og:description", content: "AI connection status and local data settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const status = useServerFn(getAIStatus);
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => { status().then((r) => setConfigured(r.configured)).catch(() => setConfigured(false)); }, [status]);
  return (
    <>
      <PageHeader title="Settings" description="Connection status and local preferences." />
      <div className="max-w-2xl space-y-4">
        <Panel className="flex items-center justify-between">
          <div>
            <p className="font-medium">AI connection</p>
            <p className="text-sm text-muted-foreground">
              {configured === null ? "Checking…" : configured ? "Connected and ready to generate results." : "Not configured — an AI API connection is required."}
            </p>
          </div>
          <span className={`h-2.5 w-2.5 rounded-full ${configured ? "bg-foreground" : "border border-foreground"}`} />
        </Panel>
        <Panel className="flex items-center justify-between">
          <div>
            <p className="font-medium">Recent activity</p>
            <p className="text-sm text-muted-foreground">Stored only in this browser.</p>
          </div>
          <Button variant="outline" onClick={() => { clearActivity(); toast.success("Activity cleared"); }}>Clear</Button>
        </Panel>
        <Disclaimer />
      </div>
    </>
  );
}
