import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
const { validateData } = createRequire(import.meta.url)("../assets/js/content-tools.js");
const load = async path => JSON.parse(await readFile(new URL("../" + path, import.meta.url), "utf8"));
try {
  const errors = validateData(await load("data/columns.json"), await load("data/events.json"));
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("コラム・予定の構文、重複、日付、必須項目を確認しました。");
} catch (e) { console.error(e.message); process.exitCode = 1; }
