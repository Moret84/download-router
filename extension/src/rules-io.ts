import type { Rule } from "./types";

export function serializeRules(rules: Rule[]): string {
  return JSON.stringify({ rules }, null, 2);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toRule(raw: unknown, index: number): Rule {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Rule ${index + 1} is not an object.`);
  }
  const record = raw as Record<string, unknown>;
  if (!isNonEmptyString(record.name)) {
    throw new Error(`Rule ${index + 1} is missing a name.`);
  }
  if (!isNonEmptyString(record.destination)) {
    throw new Error(`Rule ${index + 1} is missing a destination.`);
  }

  return {
    id: isNonEmptyString(record.id) ? record.id : crypto.randomUUID(),
    name: record.name.trim(),
    enabled: typeof record.enabled === "boolean" ? record.enabled : true,
    priority: typeof record.priority === "number" ? record.priority : (index + 1) * 10,
    domain: optionalString(record.domain),
    urlRegex: optionalString(record.urlRegex),
    filenameRegex: optionalString(record.filenameRegex),
    extension: optionalString(record.extension),
    mimeType: optionalString(record.mimeType),
    destination: record.destination.trim(),
  };
}

export function parseRulesFile(text: string): Rule[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The file is not valid JSON.");
  }

  const rules = (data as { rules?: unknown } | null)?.rules;
  if (!Array.isArray(rules)) {
    throw new Error('Expected an object with a "rules" array.');
  }

  return rules.map(toRule);
}
