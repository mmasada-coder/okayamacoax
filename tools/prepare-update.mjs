#!/usr/bin/env node
// Input and outputs contain private drafts. Keep them under work/ (ignored by Git).
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const { prepareBundle } = createRequire(import.meta.url)("../assets/js/content-tools.js");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("使い方: node tools/prepare-update.mjs work/update.json work/review-YYYY-MM-DD-v1");
  process.exit(1);
}
try {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const response = await fetch("https://api.github.com/repos/mmasada-coder/okayamacoax/commits/main", {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "okayamacoax-update-preparer" }
  });
  if (!response.ok) throw new Error("GitHub最新版を確認できません（HTTP " + response.status + "）");
  const latest = (await response.json()).sha;
  if (head !== latest) throw new Error("この作業コピーはGitHub mainの最新版ではありません。変更を保管したうえで最新版を取得してください");
  // Never use locally edited or stale data as the baseline.
  const sources = {};
  for (const path of ["data/columns.json", "data/events.json"]) {
    const r = await fetch("https://raw.githubusercontent.com/mmasada-coder/okayamacoax/" + latest + "/" + path);
    if (!r.ok) throw new Error("GitHub正本を読めません: " + path);
    sources[path] = await r.json();
  }
  const bundle = JSON.parse(await readFile(resolve(input), "utf8"));
  const result = prepareBundle(bundle, sources["data/columns.json"], sources["data/events.json"], latest);
  const out = resolve(output);
  // A new, versioned destination only; never overwrite an earlier review.
  await mkdir(dirname(out), { recursive: true });
  await mkdir(out);
  await mkdir(join(out, "site"));
  await mkdir(join(out, "private"));
  for (const [path, content] of Object.entries(result.changed)) {
    await mkdir(dirname(join(out, "site", path)), { recursive: true });
    await writeFile(join(out, "site", path), content, { flag: "wx" });
  }
  for (const [name, content] of Object.entries(result.drafts)) {
    await writeFile(join(out, "private", name), content + "\n", { flag: "wx" });
  }
  await writeFile(join(out, "private", "review.txt"), result.review, { flag: "wx" });
  await writeFile(join(out, "private", "input.json"), JSON.stringify(bundle, null, 2) + "\n", { flag: "wx" });
  console.log("更新パックを準備しました: " + out);
  console.log("site/ は承認後にGitHubへ反映。private/ はDrive「おかやまCoAX」だけに保管してください。");
  console.log("まだ公開・LINE投稿は行っていません。");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
