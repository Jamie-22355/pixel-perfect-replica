export type Activity = { id: string; tool: "meeting" | "planner" | "research"; title: string; at: number };
const KEY = "awpa-activity";

export function getActivity(): Activity[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
export function addActivity(a: Omit<Activity, "id" | "at">) {
  const list = [{ ...a, id: crypto.randomUUID(), at: Date.now() }, ...getActivity()].slice(0, 20);
  localStorage.setItem(KEY, JSON.stringify(list));
}
export function clearActivity() {
  localStorage.removeItem(KEY);
}
