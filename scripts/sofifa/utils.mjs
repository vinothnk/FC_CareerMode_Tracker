import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = argv[index + 1];

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
    } else if (next && !next.startsWith("--")) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(`${filePath}.tmp`, filePath);
}

export function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
}

export function text(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function numberOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function slug(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeFoot(value) {
  const normalized = text(value).toLowerCase();
  if (normalized === "left" || normalized === "right") {
    return normalized;
  }

  return null;
}

export function normalizeHeightCm(value) {
  const raw = text(value).toLowerCase();
  const cm = raw.match(/(\d+)\s*cm/);
  if (cm) {
    return numberOrNull(cm[1]);
  }

  const feet = raw.match(/(\d+)['’]\s*(\d+)/);
  if (feet) {
    return Math.round(Number(feet[1]) * 30.48 + Number(feet[2]) * 2.54);
  }

  return numberOrNull(raw);
}

export function parseMoney(value) {
  const raw = text(value).toUpperCase();
  if (!raw || raw === "-") {
    return { amount: null, currency: "EUR" };
  }

  const currency = raw.includes("$") ? "USD" : raw.includes("£") ? "GBP" : "EUR";
  const match = raw.match(/([\d.]+)\s*([KMB])?/);
  if (!match) {
    return { amount: null, currency };
  }

  const multiplier = match[2] === "B" ? 1_000_000_000 : match[2] === "M" ? 1_000_000 : match[2] === "K" ? 1_000 : 1;
  return { amount: Number(match[1]) * multiplier, currency };
}

export function uniqueBy(values, keyFn) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const key = keyFn(value);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(value);
  }

  return result;
}

export function sourceKey(type, idOrName) {
  return `${type}:${idOrName}`;
}

export async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "fc26-career-console-reference-pipeline/0.1 (+local development)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}
