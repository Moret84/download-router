import { buildDestination, findMatchingRule } from "./matcher";
import { appendHistory, getRules, seedDefaultRulesIfEmpty } from "./storage";
import type { MatchInput } from "./types";

interface FilenameSuggestion {
  filename: string;
  conflictAction: "uniquify" | "overwrite" | "prompt";
}

function toMatchInput(item: browser.downloads.DownloadItem): MatchInput {
  return {
    url: item.finalUrl || item.url,
    filename: item.filename,
    mimeType: item.mime,
  };
}

async function routeDownload(
  item: browser.downloads.DownloadItem,
): Promise<FilenameSuggestion | undefined> {
  const rules = await getRules();
  const input = toMatchInput(item);
  const rule = findMatchingRule(rules, input);
  if (!rule) {
    return undefined;
  }

  const destination = buildDestination(rule.destination, item.filename);
  await appendHistory({
    timestamp: Date.now(),
    filename: item.filename,
    sourceUrl: input.url,
    matchedRule: rule.name,
    destination,
  });

  return { filename: destination, conflictAction: "uniquify" };
}

browser.runtime.onInstalled.addListener(() => {
  void seedDefaultRulesIfEmpty();
});

browser.downloads.onDeterminingFilename.addListener((item, suggest) => {
  routeDownload(item)
    .then((suggestion) => {
      if (suggestion) {
        suggest(suggestion);
      } else {
        suggest();
      }
    })
    .catch((error) => {
      console.error("Download routing failed", error);
      suggest();
    });
  return true;
});
