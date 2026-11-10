import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarCheck, FileText, Search } from "lucide-react";
import { Disclaimer, PageHeader, Panel } from "@/components/ToolKit";
import { getActivity, type Activity } from "@/lib/activity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Workplace Productivity Assistant" },
      { name: "description", content: "Summarise meetings, plan your work and research faster with AI." },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      { property: "og:description", content: "Summarise meetings, plan your work and research faster with AI." },
    ],
  }),
  component: Dashboard,
});

const tools = [
  { to: "/meetings", tool: "meeting", title: "Meeting Summarizer", desc: "Notes → summary, decisions, action items.", icon: FileText },
  { to: "/planner", tool: "planner", title: "AI Task Planner", desc: "Tasks → a prioritised schedule.", icon: CalendarCheck },
  { to: "/research", tool: "research", title: "Research Assistant", desc: "Topics, articles, URLs → insights.", icon: Search },
] as const;

function Dashboard() {
  const [activity, setActivity] = useState<Activity[]>([]);
  useEffect(() => setActivity(getActivity()), []);
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })();
  const count = (t: Activity["tool"]) => activity.filter((a) => a.tool === t).length;

  return (
    <>
      <PageHeader title={greeting} description="What would you like to get done today?" />
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Panel><p className="text-xs uppercase tracking-widest text-muted-foreground">Total runs</p><p className="mt-2 font-mono text-3xl">{activity.length}</p></Panel>
        {tools.map((t) => (
          <Panel key={t.tool}><p className="text-xs uppercase tracking-widest text-muted-foreground">{t.title}</p><p className="mt-2 font-mono text-3xl">{count(t.tool)}</p></Panel>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</h2>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.to} to={t.to} className="group rounded-xl border bg-card p-5 transition-colors hover:bg-primary hover:text-primary-foreground">
            <div className="flex items-start justify-between"><t.icon className="h-5 w-5" /><ArrowUpRight className="h-4 w-4 opacity-40 group-hover:opacity-100" /></div>
            <p className="mt-6 font-medium">{t.title}</p>
            <p className="mt-1 text-sm opacity-60">{t.desc}</p>
          </Link>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recent activity</h2>
      <Panel className="mb-6 p-0">
        {activity.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No activity yet. Run one of the tools above to get started.</p>
        ) : (
          <ul className="divide-y">
            {activity.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <span className="truncate">{a.title}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{tools.find((t) => t.tool === a.tool)?.title} · {new Date(a.at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Disclaimer />
    </>
  );
}
