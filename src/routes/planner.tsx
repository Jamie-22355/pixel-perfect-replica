import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, ResultView, useAITool } from "@/components/ToolKit";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — AI Workplace Assistant" },
      { name: "description", content: "Turn your task list into a prioritised daily or weekly schedule." },
      { property: "og:title", content: "AI Task Planner — AI Workplace Assistant" },
      { property: "og:description", content: "Turn your task list into a prioritised daily or weekly schedule." },
    ],
  }),
  component: Planner,
});

type Task = { name: string; priority: "High" | "Medium" | "Low"; deadline: string };
const empty: Task = { name: "", priority: "Medium", deadline: "" };

function Planner() {
  const [tasks, setTasks] = useState<Task[]>([{ ...empty }]);
  const [horizon, setHorizon] = useState<"daily" | "weekly">("daily");
  const ai = useAITool("planner");
  const valid = tasks.filter((t) => t.name.trim());
  const update = (i: number, p: Partial<Task>) => setTasks(tasks.map((t, j) => (j === i ? { ...t, ...p } : t)));

  const submit = () => {
    const today = new Date().toDateString();
    const input = `Today is ${today}. Create a ${horizon} plan.\nTasks:\n` +
      valid.map((t) => `- ${t.name} | priority: ${t.priority} | deadline: ${t.deadline || "none"}`).join("\n");
    ai.generate(input, `${horizon === "daily" ? "Daily" : "Weekly"} plan · ${valid.length} tasks`);
  };

  return (
    <>
      <PageHeader title="AI Task Planner" description="Add your tasks. The planner prioritises urgent and important work first." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="h-fit space-y-4">
          <div className="inline-flex rounded-lg border p-1">
            {(["daily", "weekly"] as const).map((h) => (
              <button key={h} onClick={() => setHorizon(h)} className={`rounded-md px-3 py-1 text-sm capitalize ${horizon === h ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{h}</button>
            ))}
          </div>
          <div className="space-y-2">
            {tasks.map((t, i) => (
              <div key={i} className="flex flex-wrap gap-2 sm:flex-nowrap">
                <Input placeholder="Task description" value={t.name} onChange={(e) => update(i, { name: e.target.value })} className="flex-1" />
                <select value={t.priority} onChange={(e) => update(i, { priority: e.target.value as Task["priority"] })} className="h-9 rounded-md border bg-background px-2 text-sm">
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
                <Input type="date" value={t.deadline} onChange={(e) => update(i, { deadline: e.target.value })} className="w-40" />
                <Button variant="ghost" size="icon" aria-label="Remove task" onClick={() => setTasks(tasks.length > 1 ? tasks.filter((_, j) => j !== i) : [{ ...empty }])}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setTasks([...tasks, { ...empty }])}><Plus className="h-4 w-4" /> Add task</Button>
            <Button disabled={!valid.length || ai.loading} onClick={submit}><Sparkles className="h-4 w-4" /> Generate plan</Button>
          </div>
        </Panel>
        <ResultView title="Task Plan" {...ai} />
      </div>
    </>
  );
}
