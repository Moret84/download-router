import type { MatchInput, Rule } from "./types";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function matchesDomain(domain: string, url: string): boolean {
  const host = hostnameOf(url);
  if (!host) {
    return false;
  }
  const target = domain.trim().toLowerCase();
  return host === target || host.endsWith(`.${target}`);
}

function matchesRegex(pattern: string, value: string): boolean {
  try {
    return new RegExp(pattern).test(value);
  } catch {
    return false;
  }
}

function matchesExtension(spec: string, filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return spec
    .split("|")
    .map((extension) => extension.trim().toLowerCase())
    .filter(Boolean)
    .some((extension) => lowerName.endsWith(`.${extension}`));
}

function matchesMimeType(mimeType: string, input: MatchInput): boolean {
  if (!input.mimeType) {
    return false;
  }
  return input.mimeType.toLowerCase() === mimeType.trim().toLowerCase();
}

export function ruleMatches(rule: Rule, input: MatchInput): boolean {
  if (rule.domain && !matchesDomain(rule.domain, input.url)) {
    return false;
  }
  if (rule.urlRegex && !matchesRegex(rule.urlRegex, input.url)) {
    return false;
  }
  if (rule.filenameRegex && !matchesRegex(rule.filenameRegex, input.filename)) {
    return false;
  }
  if (rule.extension && !matchesExtension(rule.extension, input.filename)) {
    return false;
  }
  if (rule.mimeType && !matchesMimeType(rule.mimeType, input)) {
    return false;
  }
  return true;
}

export function findMatchingRule(rules: Rule[], input: MatchInput): Rule | undefined {
  return [...rules]
    .filter((rule) => rule.enabled)
    .sort((a, b) => a.priority - b.priority)
    .find((rule) => ruleMatches(rule, input));
}

function basename(path: string): string {
  const segments = path.replace(/\\/g, "/").split("/");
  return segments[segments.length - 1];
}

function normalizeFolder(destination: string): string {
  return destination
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");
}

/**
 * Build a download path relative to the browser download directory by placing
 * the original file name inside the rule destination folder.
 */
export function buildDestination(destination: string, filename: string): string {
  const folder = normalizeFolder(destination);
  const name = basename(filename);
  return folder ? `${folder}/${name}` : name;
}
