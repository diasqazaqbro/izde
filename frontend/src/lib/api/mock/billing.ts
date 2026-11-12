import type { Plan } from "../types";
import { currentEmail, readJSON, writeJSON } from "./browser";
import { count } from "./valid";

// Prices and question limits are examples (docs/01-product.md: the price is conditional).
export const PLANS: Plan[] = [
  { id: "free", name: "Free", docLimit: 100, questionLimit: 20, price: 0 },
  { id: "standard", name: "Standard", docLimit: 1000, questionLimit: 100, price: 49900 },
  { id: "campus", name: "Campus", docLimit: 10000, questionLimit: 500, price: 199900 },
];

const PLAN_KEY = "izde.plan";

export function currentPlan(): Plan {
  const id = readJSON(PLAN_KEY);
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function setPlan(id: Plan["id"]) {
  writeJSON(PLAN_KEY, id);
}

function usageKey() {
  return `izde.usage.${currentEmail()}.${new Date().toISOString().slice(0, 10)}`;
}

export function questionsToday() {
  return count(readJSON(usageKey()));
}

export function countQuestion() {
  writeJSON(usageKey(), questionsToday() + 1);
}
