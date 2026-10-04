/* Shared, dependency-free validation and update preparation. Browser + Node. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CoAXContent = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const text = v => typeof v === "string" && v.trim().length > 0;
  function day(v) {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const d = new Date(v + "T00:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }
  function eventDate(v) {
    if (v === "") return true;
    return typeof v === "string" &&
      /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:00\+09:00$/.test(v) &&
      day(v.slice(0, 10));
  }
  function validFigure(figure) {
    return !!figure && typeof figure === "object" && !Array.isArray(figure) &&
      typeof figure.src === "string" &&
      /^assets\/img\/reports\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/.test(figure.src) &&
      text(figure.alt) && text(figure.caption);
  }
  function validateData(columns, events) {
    const errors = [];
    function rows(data, kind) {
      if (!Array.isArray(data)) { errors.push(kind + ": 配列が必要です"); return []; }
      const ids = new Set();
      data.forEach((item, i) => {
        const at = kind + "[" + i + "]";
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          errors.push(at + ": オブジェクトが必要です"); return;
        }
        if (!text(item.id)) errors.push(at + ": id が必要です");
        if (ids.has(item.id)) errors.push(at + ": id が重複しています");
        ids.add(item.id);
        if (!text(item.title)) errors.push(at + ": title が必要です");
        if (kind === "columns") {
          if (!/^col-\d{3,}$/.test(item.id || "")) errors.push(at + ": col-連番の id が必要です");
          if (!day(item.date)) errors.push(at + ": date は実在する YYYY-MM-DD が必要です");
          if (!["コラム", "イベントレポート"].includes(item.category)) errors.push(at + ": category が不正です");
          if (item.figure !== undefined && !validFigure(item.figure)) errors.push(at + ": figure は公開画像パス・代替テキスト・説明が必要です");
          if (!text(item.excerpt)) errors.push(at + ": excerpt が必要です");
          // Keep existing string bodies readable; new articles use blocks.
          if (!(text(item.body) || (Array.isArray(item.body) && item.body.length &&
            item.body.every(b => b && ["p", "h2"].includes(b.type) && text(b.text))))) {
            errors.push(at + ": body は本文、または p/h2 の配列が必要です");
          }
        } else {
          if (!eventDate(item.date)) errors.push(at + ": date は空文字または実在する日本時間の日時が必要です");
          if (!["オンライン", "オフライン"].includes(item.type)) errors.push(at + ": type が不正です");
          if (item.status !== undefined && !["planned", "completed", "postponed", "cancelled"].includes(item.status)) {
            errors.push(at + ": status が不正です");
          }
          if (typeof item.note !== "string") errors.push(at + ": note は文字列が必要です");
        }
      });
      return data;
    }
    rows(columns, "columns"); rows(events, "events");
    return errors;
  }
  function visibleEvents(events, now = Date.now()) {
    return events.filter(e => (!e.status || e.status === "planned") && eventDate(e.date))
      .filter(e => e.date === "" || Date.parse(e.date) >= now - 12 * 3600 * 1000)
      .sort((a, b) => (a.date === "" ? Infinity : Date.parse(a.date)) -
                      (b.date === "" ? Infinity : Date.parse(b.date)))
      .slice(0, 3);
  }
  function prepareBundle(bundle, columns, events, currentCommit) {
    const errors = validateData(columns, events);
    if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) throw new Error("更新パックはオブジェクトが必要です");
    if (!/^[a-f0-9]{40}$/.test(bundle.baseCommit || "") || bundle.baseCommit !== currentCommit) {
      errors.push("GitHubの最新版と baseCommit が一致しません。最新版を読み直してください");
    }
    if (!day(bundle.generatedOn)) errors.push("generatedOn は YYYY-MM-DD が必要です");
    if (!Array.isArray(bundle.events)) errors.push("events は変更する予定の配列が必要です（変更なしは []）");
    if (!bundle.line || !["announcement", "note", "eventDescription"].every(k => text(bundle.line[k]))) {
      errors.push("LINEの告知・ノート・イベント説明をすべて入力してください");
    }
    for (const key of ["sources", "assumptions", "confirmations"]) {
      if (!Array.isArray(bundle[key]) || !bundle[key].every(text)) errors.push(key + " は文字列の配列が必要です");
    }
    let nextColumns = JSON.parse(JSON.stringify(columns));
    let nextEvents = JSON.parse(JSON.stringify(events));
    if (bundle.column !== null && bundle.column !== undefined) {
      const c = bundle.column;
      if (!c || typeof c !== "object" || !Array.isArray(c.body)) errors.push("追加コラムの body は p/h2 配列が必要です");
      else {
        if (columns.some(x => x.id === c.id)) errors.push("追加コラムの id が既存と重複しています");
        const max = Math.max(0, ...columns.map(x => Number((/^col-(\d+)$/.exec(x.id || "") || [0, 0])[1])));
        if (c.id !== "col-" + String(max + 1).padStart(3, "0")) errors.push("追加コラムの id は次の連番にしてください");
        const body = c.body.map(b => b && typeof b.text === "string" ? b.text : "").join("\n");
        const count = Array.from(body.replace(/\s/g, "")).length;
        if (count < 600 || count > 900) errors.push("追加コラムの本文は600〜900字（見出しを含み空白を除く）にしてください");
        if (!body.startsWith("合同会社リバースの正田です。") || !body.endsWith("共に、次へ。")) errors.push("追加コラムの書き出し・締めを確認してください");
        if (/必ず|絶対|100[%％]|誰でも|確実に/.test(body)) errors.push("追加コラムに禁止表現があります");
        nextColumns.unshift(c);
      }
    }
    const updateIds = new Set();
    if (Array.isArray(bundle.events)) bundle.events.forEach(e => {
      if (!e || typeof e !== "object" || Array.isArray(e)) { errors.push("更新予定はオブジェクトが必要です"); return; }
      if (updateIds.has(e.id)) errors.push("更新予定の id が重複しています");
      updateIds.add(e.id);
      const i = nextEvents.findIndex(x => x.id === e.id);
      if (i < 0) nextEvents.push(e); else nextEvents[i] = e;
    });
    errors.push(...validateData(nextColumns, nextEvents));
    if (errors.length) throw new Error([...new Set(errors)].join("\n"));
    const changed = {};
    if (JSON.stringify(columns) !== JSON.stringify(nextColumns)) changed["data/columns.json"] = JSON.stringify(nextColumns, null, 2) + "\n";
    if (JSON.stringify(events) !== JSON.stringify(nextEvents)) changed["data/events.json"] = JSON.stringify(nextEvents, null, 2) + "\n";
    const drafts = {
      "LINE-announcement.txt": bundle.line.announcement,
      "LINE-note.txt": bundle.line.note,
      "LINE-event-description.txt": bundle.line.eventDescription
    };
    const section = (title, items) => "\n" + title + "\n" + (items.length ? items.map(x => "- " + x).join("\n") : "なし") + "\n";
    const review = "おかやまCoAX 更新確認\n作成日: " + bundle.generatedOn + "\n基準コミット: " + currentCommit +
      "\n変更ファイル: " + (Object.keys(changed).join(", ") || "なし") +
      "\nコラム追加: " + (bundle.column ? bundle.column.title : "なし") +
      section("変更する予定", (bundle.events || []).map(e => e.title + " / " + (e.date || "日程調整中"))) +
      section("出典・確認した事実", bundle.sources) +
      section("推測・企画案", bundle.assumptions) +
      section("正田真澄に確認が必要なこと", bundle.confirmations) +
      "\nJSONとLINE原稿をまとめて確認後、承認された変更だけをGitHubへ反映してください。\nLINEへの投稿は運営者が行います。\n";
    return { changed, drafts, review };
  }
  return { day, eventDate, validFigure, validateData, visibleEvents, prepareBundle };
});
