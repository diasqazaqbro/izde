import { UPLOAD_DISABLED, type Api, type Chat, type Role, type User } from "../types";
import { setPlan, currentPlan, PLANS } from "./billing";
import { readJSON, sleep, writeJSON } from "./browser";
import { DOCS } from "./data";

// Query statistics and the user list do not exist yet (docs/05-data.md): these are demo numbers,
// marked as such in the UI. Users are anonymous on purpose.
const DEMO_TOP = [
  { query: "можно ли пересдать экзамен", count: 48 },
  { query: "сколько можно пропускать пары", count: 36 },
  { query: "выход из академического отпуска", count: 21 },
  { query: "сколько кредитов стажировка докторанта", count: 17 },
  { query: "оплата обучения", count: 9 },
];
export const DEMO_NO_RESULTS = [
  { query: "стипендия", count: 14 },
  { query: "общежитие", count: 11 },
  { query: "военная кафедра", count: 6 },
];
const DEMO_USERS: User[] = [
  { email: "admin1@iitu.edu.kz", role: "admin" },
  { email: "staff1@iitu.edu.kz", role: "staff" },
  { email: "staff2@iitu.edu.kz", role: "staff" },
  { email: "student1@iitu.edu.kz", role: "student" },
  { email: "student2@iitu.edu.kz", role: "student" },
  { email: "student3@iitu.edu.kz", role: "student" },
  { email: "student4@iitu.edu.kz", role: "student" },
];
const ROLES_KEY = "izde.roles";

// "Полезно / Не то" from every chat stored in this browser.
function feedback() {
  const out = { up: 0, down: 0, comments: [] as string[] };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("izde.chats.")) continue;
    for (const chat of readJSON<Chat[]>(key, []))
      for (const m of chat.messages) {
        if (m.feedback === "up") out.up++;
        if (m.feedback === "down") out.down++;
        if (m.feedbackComment) out.comments.push(m.feedbackComment);
      }
  }
  return out;
}

export const adminApi: Pick<
  Api,
  "uploadDoc" | "getUsage" | "listPlans" | "checkout" | "getAnalytics" | "listUsers" | "setUserRole"
> = {
  async uploadDoc() {
    await sleep(600);
    throw new Error(UPLOAD_DISABLED);
  },

  async getUsage() {
    return { plan: currentPlan(), docCount: DOCS.length };
  },

  async listPlans() {
    return PLANS;
  },

  async checkout(planId) {
    await sleep(1200);
    if (!PLANS.some((p) => p.id === planId)) return { ok: false };
    setPlan(planId);
    return { ok: true };
  },

  async getAnalytics() {
    return { demo: true, queriesWeek: 312, topQueries: DEMO_TOP, noResults: DEMO_NO_RESULTS, feedback: feedback() };
  },

  async listUsers() {
    const roles = readJSON<Record<string, Role>>(ROLES_KEY, {});
    return { users: DEMO_USERS.map((u) => ({ ...u, role: roles[u.email] ?? u.role })), demo: true };
  },

  async setUserRole(email, role) {
    writeJSON(ROLES_KEY, { ...readJSON<Record<string, Role>>(ROLES_KEY, {}), [email]: role });
  },
};
