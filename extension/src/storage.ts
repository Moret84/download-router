import { createDefaultRules } from "./defaults";
import type { DownloadLog, Rule } from "./types";

const RULES_KEY = "rules";
const HISTORY_KEY = "history";
const HISTORY_LIMIT = 100;

// Rules live in storage.sync so they follow the Firefox account across
// devices. History stays in storage.local: it grows quickly, is
// device-specific and would not fit the smaller sync quota.

export async function getRules(): Promise<Rule[]> {
  const stored = await browser.storage.sync.get(RULES_KEY);
  const rules = stored[RULES_KEY];
  return Array.isArray(rules) ? (rules as Rule[]) : [];
}

export async function saveRules(rules: Rule[]): Promise<void> {
  await browser.storage.sync.set({ [RULES_KEY]: rules });
}

export async function seedDefaultRulesIfEmpty(): Promise<void> {
  const stored = await browser.storage.sync.get(RULES_KEY);
  if (stored[RULES_KEY] === undefined) {
    await saveRules(createDefaultRules());
  }
}

export async function getHistory(): Promise<DownloadLog[]> {
  const stored = await browser.storage.local.get(HISTORY_KEY);
  const history = stored[HISTORY_KEY];
  return Array.isArray(history) ? (history as DownloadLog[]) : [];
}

export async function appendHistory(entry: DownloadLog): Promise<void> {
  const history = await getHistory();
  history.unshift(entry);
  await browser.storage.local.set({
    [HISTORY_KEY]: history.slice(0, HISTORY_LIMIT),
  });
}

export async function clearHistory(): Promise<void> {
  await browser.storage.local.set({ [HISTORY_KEY]: [] });
}
