import { basename, buildDestination, findMatchingRule } from "./matcher";
import { appendHistory, getRules, seedDefaultRulesIfEmpty } from "./storage";
import type { MatchInput } from "./types";

const HOST_NAME = "download_router";

interface MoveResponse {
  ok: boolean;
  finalPath?: string;
  error?: string;
}

// Firefox cannot redirect a download before it is written (no
// onDeterminingFilename) nor move files itself, so routing happens after the
// download completes: the native host relocates the finished file.
async function moveViaHost(source: string, destination: string): Promise<MoveResponse> {
  return (await browser.runtime.sendNativeMessage(HOST_NAME, {
    type: "move",
    source,
    destination,
  })) as MoveResponse;
}

async function routeCompletedDownload(downloadId: number): Promise<void> {
  const [item] = await browser.downloads.search({ id: downloadId });
  if (!item || !item.filename || item.state !== "complete") {
    return;
  }

  const name = basename(item.filename);
  const input: MatchInput = { url: item.url, filename: name, mimeType: item.mime };
  const rule = findMatchingRule(await getRules(), input);
  if (!rule) {
    return;
  }

  const destination = buildDestination(rule.destination, {
    url: item.url,
    filename: name,
    now: new Date(),
  });

  const result = await moveViaHost(item.filename, destination);
  if (!result.ok) {
    console.error("Download Router host failed to move file:", result.error);
    return;
  }

  await appendHistory({
    timestamp: Date.now(),
    filename: name,
    sourceUrl: item.url,
    matchedRule: rule.name,
    destination: result.finalPath ?? destination,
  });
}

browser.runtime.onInstalled.addListener(() => {
  void seedDefaultRulesIfEmpty();
});

browser.downloads.onChanged.addListener((delta) => {
  if (delta.state?.current !== "complete") {
    return;
  }
  routeCompletedDownload(delta.id).catch((error) => {
    console.error("Download Router routing failed:", error);
  });
});
