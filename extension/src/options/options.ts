import { buildDestination, findMatchingRule } from "../matcher";
import { parseRulesFile, serializeRules } from "../rules-io";
import {
  clearHistory,
  getHistory,
  getRules,
  saveRules,
  seedDefaultRulesIfEmpty,
} from "../storage";
import type { DownloadLog, Rule } from "../types";

const HOST_NAME = "download_router";
// Where users get the native helper. Replace USER with the project's GitHub owner.
const RELEASES_URL = "https://github.com/USER/download-router-firefox/releases";

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

const elements = {
  hostStatus: byId<HTMLParagraphElement>("host-status"),
  hostInstall: byId<HTMLParagraphElement>("host-install"),
  hostInstallLink: byId<HTMLAnchorElement>("host-install-link"),
  rulesBody: byId<HTMLTableSectionElement>("rules-body"),
  rulesEmpty: byId<HTMLParagraphElement>("rules-empty"),
  addRule: byId<HTMLButtonElement>("add-rule"),
  exportRules: byId<HTMLButtonElement>("export-rules"),
  importRules: byId<HTMLButtonElement>("import-rules"),
  importFile: byId<HTMLInputElement>("import-file"),
  importError: byId<HTMLParagraphElement>("import-error"),
  formSection: byId<HTMLElement>("form-section"),
  formTitle: byId<HTMLHeadingElement>("form-title"),
  form: byId<HTMLFormElement>("rule-form"),
  formError: byId<HTMLParagraphElement>("form-error"),
  cancelForm: byId<HTMLButtonElement>("cancel-form"),
  ruleId: byId<HTMLInputElement>("rule-id"),
  ruleName: byId<HTMLInputElement>("rule-name"),
  ruleEnabled: byId<HTMLInputElement>("rule-enabled"),
  ruleDomain: byId<HTMLInputElement>("rule-domain"),
  ruleUrlRegex: byId<HTMLInputElement>("rule-url-regex"),
  ruleFilenameRegex: byId<HTMLInputElement>("rule-filename-regex"),
  ruleExtension: byId<HTMLInputElement>("rule-extension"),
  ruleMime: byId<HTMLInputElement>("rule-mime"),
  ruleDestination: byId<HTMLInputElement>("rule-destination"),
  testUrl: byId<HTMLInputElement>("test-url"),
  testFilename: byId<HTMLInputElement>("test-filename"),
  testMime: byId<HTMLInputElement>("test-mime"),
  runTest: byId<HTMLButtonElement>("run-test"),
  testResult: byId<HTMLDivElement>("test-result"),
  historyList: byId<HTMLUListElement>("history-list"),
  historyEmpty: byId<HTMLParagraphElement>("history-empty"),
  clearHistory: byId<HTMLButtonElement>("clear-history"),
};

function t(key: string, substitutions?: string | string[]): string {
  return browser.i18n.getMessage(key, substitutions);
}

function localizeDom(): void {
  document.title = t("optionsTitle");
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (key) {
      element.textContent = t(key);
    }
  });
}

let rules: Rule[] = [];

function sortedByPriority(source: Rule[]): Rule[] {
  return [...source].sort((a, b) => a.priority - b.priority);
}

function criteriaSummary(rule: Rule): string {
  const parts: string[] = [];
  if (rule.domain) parts.push(`domain: ${rule.domain}`);
  if (rule.urlRegex) parts.push(`url: ${rule.urlRegex}`);
  if (rule.filenameRegex) parts.push(`filename: ${rule.filenameRegex}`);
  if (rule.extension) parts.push(`ext: ${rule.extension}`);
  if (rule.mimeType) parts.push(`mime: ${rule.mimeType}`);
  return parts.length ? parts.join(" · ") : t("criteriaAny");
}

function renderRules(): void {
  const ordered = sortedByPriority(rules);
  elements.rulesBody.replaceChildren();
  elements.rulesEmpty.hidden = ordered.length > 0;

  ordered.forEach((rule, index) => {
    const row = document.createElement("tr");

    const enabledCell = document.createElement("td");
    const enabledToggle = document.createElement("input");
    enabledToggle.type = "checkbox";
    enabledToggle.checked = rule.enabled;
    enabledToggle.addEventListener("change", () => {
      void toggleEnabled(rule.id, enabledToggle.checked);
    });
    enabledCell.append(enabledToggle);

    const nameCell = document.createElement("td");
    nameCell.textContent = rule.name;

    const criteriaCell = document.createElement("td");
    criteriaCell.className = "criteria";
    criteriaCell.textContent = criteriaSummary(rule);

    const destinationCell = document.createElement("td");
    const destinationCode = document.createElement("code");
    destinationCode.textContent = rule.destination;
    destinationCell.append(destinationCode);

    const orderCell = document.createElement("td");
    orderCell.append(
      createOrderButton("↑", index === 0, () => void moveRule(rule.id, -1)),
      createOrderButton("↓", index === ordered.length - 1, () =>
        void moveRule(rule.id, 1),
      ),
    );

    const actionsCell = document.createElement("td");
    actionsCell.className = "actions";
    actionsCell.append(
      createActionButton(t("edit"), "secondary", () => openForm(rule)),
      createActionButton(t("delete"), "danger", () => void deleteRule(rule.id)),
    );

    row.append(
      enabledCell,
      nameCell,
      criteriaCell,
      destinationCell,
      orderCell,
      actionsCell,
    );
    elements.rulesBody.append(row);
  });
}

function createOrderButton(
  label: string,
  disabled: boolean,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon";
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function createActionButton(
  label: string,
  variant: "secondary" | "danger",
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `action ${variant}`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function openForm(rule?: Rule): void {
  elements.formError.hidden = true;
  elements.formSection.hidden = false;
  elements.formTitle.textContent = t(rule ? "editRuleTitle" : "addRuleTitle");
  elements.ruleId.value = rule?.id ?? "";
  elements.ruleName.value = rule?.name ?? "";
  elements.ruleEnabled.checked = rule?.enabled ?? true;
  elements.ruleDomain.value = rule?.domain ?? "";
  elements.ruleUrlRegex.value = rule?.urlRegex ?? "";
  elements.ruleFilenameRegex.value = rule?.filenameRegex ?? "";
  elements.ruleExtension.value = rule?.extension ?? "";
  elements.ruleMime.value = rule?.mimeType ?? "";
  elements.ruleDestination.value = rule?.destination ?? "";
  elements.formSection.scrollIntoView({ behavior: "smooth" });
}

function closeForm(): void {
  elements.formSection.hidden = true;
  elements.form.reset();
}

function optionalValue(input: HTMLInputElement): string | undefined {
  const value = input.value.trim();
  return value ? value : undefined;
}

function nextPriority(): number {
  if (rules.length === 0) {
    return 10;
  }
  return Math.max(...rules.map((rule) => rule.priority)) + 10;
}

function readRuleFromForm(): Rule | undefined {
  const name = elements.ruleName.value.trim();
  const destination = elements.ruleDestination.value.trim();
  if (!name || !destination) {
    return undefined;
  }

  const existingId = elements.ruleId.value;
  const existing = rules.find((rule) => rule.id === existingId);

  return {
    id: existingId || crypto.randomUUID(),
    name,
    enabled: elements.ruleEnabled.checked,
    priority: existing?.priority ?? nextPriority(),
    domain: optionalValue(elements.ruleDomain),
    urlRegex: optionalValue(elements.ruleUrlRegex),
    filenameRegex: optionalValue(elements.ruleFilenameRegex),
    extension: optionalValue(elements.ruleExtension),
    mimeType: optionalValue(elements.ruleMime),
    destination,
  };
}

async function submitForm(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const rule = readRuleFromForm();
  if (!rule) {
    elements.formError.textContent = t("formRequiredError");
    elements.formError.hidden = false;
    return;
  }

  const index = rules.findIndex((existing) => existing.id === rule.id);
  if (index >= 0) {
    rules[index] = rule;
  } else {
    rules.push(rule);
  }

  await saveRules(rules);
  closeForm();
  renderRules();
}

async function toggleEnabled(id: string, enabled: boolean): Promise<void> {
  const rule = rules.find((candidate) => candidate.id === id);
  if (!rule) {
    return;
  }
  rule.enabled = enabled;
  await saveRules(rules);
}

async function deleteRule(id: string): Promise<void> {
  rules = rules.filter((rule) => rule.id !== id);
  await saveRules(rules);
  renderRules();
}

async function moveRule(id: string, direction: -1 | 1): Promise<void> {
  const ordered = sortedByPriority(rules);
  const index = ordered.findIndex((rule) => rule.id === id);
  const swapIndex = index + direction;
  if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) {
    return;
  }

  const current = ordered[index];
  const neighbor = ordered[swapIndex];
  const currentPriority = current.priority;
  current.priority = neighbor.priority;
  neighbor.priority = currentPriority;

  await saveRules(rules);
  renderRules();
}

function runTest(): void {
  const input = {
    url: elements.testUrl.value.trim(),
    filename: elements.testFilename.value.trim(),
    mimeType: optionalValue(elements.testMime),
  };

  const rule = findMatchingRule(rules, input);
  elements.testResult.hidden = false;
  elements.testResult.replaceChildren();

  if (!rule) {
    elements.testResult.className = "result no-match";
    elements.testResult.textContent = t("testerNoMatch");
    return;
  }

  const destination = buildDestination(rule.destination, {
    url: input.url,
    filename: input.filename,
    now: new Date(),
  });
  elements.testResult.className = "result matched";
  const matched = document.createElement("div");
  matched.textContent = t("testerMatched", rule.name);
  const target = document.createElement("div");
  target.append(document.createTextNode(t("testerDestination")));
  const code = document.createElement("code");
  code.textContent = destination;
  target.append(code);
  elements.testResult.append(matched, target);
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function renderHistoryEntries(entries: DownloadLog[]): void {
  elements.historyList.replaceChildren();
  elements.historyEmpty.hidden = entries.length > 0;

  for (const entry of entries) {
    const item = document.createElement("li");

    const main = document.createElement("div");
    main.textContent = entry.filename;

    const meta = document.createElement("div");
    meta.className = "history-meta";
    const rulePart = entry.matchedRule ? ` · ${entry.matchedRule}` : "";
    meta.textContent = `${formatTimestamp(entry.timestamp)} → ${entry.destination}${rulePart}`;

    item.append(main, meta);
    elements.historyList.append(item);
  }
}

async function refreshHistory(): Promise<void> {
  renderHistoryEntries(await getHistory());
}

function exportRules(): void {
  const blob = new Blob([serializeRules(rules)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "download-router-rules.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function importRulesFromFile(file: File): Promise<void> {
  elements.importError.hidden = true;
  try {
    rules = parseRulesFile(await file.text());
  } catch (error) {
    elements.importError.textContent =
      error instanceof Error ? error.message : "Could not import rules.";
    elements.importError.hidden = false;
    return;
  }

  await saveRules(rules);
  renderRules();
}

function handleImportSelection(): void {
  const file = elements.importFile.files?.[0];
  if (file) {
    void importRulesFromFile(file);
  }
  elements.importFile.value = "";
}

interface PingResponse {
  ok?: boolean;
  version?: string;
}

async function checkHost(): Promise<void> {
  elements.hostInstallLink.href = RELEASES_URL;
  try {
    const response = (await browser.runtime.sendNativeMessage(HOST_NAME, {
      type: "ping",
    })) as PingResponse;
    if (!response?.ok) {
      throw new Error("native host did not acknowledge");
    }
    elements.hostStatus.textContent = t("hostConnected", response.version ?? "?");
    elements.hostStatus.className = "host-ok";
    elements.hostInstall.hidden = true;
  } catch {
    elements.hostStatus.textContent = t("hostMissing");
    elements.hostStatus.className = "host-missing";
    elements.hostInstall.hidden = false;
  }
}

async function init(): Promise<void> {
  localizeDom();
  void checkHost();
  await seedDefaultRulesIfEmpty();
  rules = await getRules();
  renderRules();
  await refreshHistory();

  elements.addRule.addEventListener("click", () => openForm());
  elements.exportRules.addEventListener("click", exportRules);
  elements.importRules.addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", handleImportSelection);
  elements.cancelForm.addEventListener("click", closeForm);
  elements.form.addEventListener("submit", (event) => void submitForm(event));
  elements.runTest.addEventListener("click", runTest);
  elements.clearHistory.addEventListener("click", () => {
    void clearHistory().then(refreshHistory);
  });
}

void init();
