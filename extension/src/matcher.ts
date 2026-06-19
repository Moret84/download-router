import type { DestinationContext, MatchInput, Rule } from "./types";

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

export function basename(path: string): string {
  const segments = path.replace(/\\/g, "/").split("/");
  return segments[segments.length - 1];
}

// Light cleanup only: leading "/" and "~" are preserved because destinations
// are now absolute or home-relative paths. Path safety (traversal, allowlist)
// is enforced by the native host, the real trust boundary.
function cleanFolder(destination: string): string {
  return destination
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "");
}

function fileExtension(filename: string): string {
  const name = basename(filename);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function fileStem(filename: string): string {
  const name = basename(filename);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

function resolveVariables(template: string, context: DestinationContext): string {
  const values: Record<string, string> = {
    domain: hostnameOf(context.url),
    filename: fileStem(context.filename),
    extension: fileExtension(context.filename),
    year: String(context.now.getFullYear()),
    month: String(context.now.getMonth() + 1).padStart(2, "0"),
  };
  return template.replace(
    /\{(domain|filename|extension|year|month)\}/g,
    (_, key: string) => values[key] ?? "",
  );
}

/**
 * Build the absolute destination path by placing the original file name inside
 * the rule destination folder. The destination may be an absolute or
 * home-relative ("~") path and may contain variables ({domain}, {filename},
 * {extension}, {year}, {month}).
 */
export function buildDestination(
  destination: string,
  context: DestinationContext,
): string {
  const folder = cleanFolder(resolveVariables(destination, context).trim());
  const name = basename(context.filename);
  return folder ? `${folder}/${name}` : name;
}
