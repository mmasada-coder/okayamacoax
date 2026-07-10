/* コラム・イベントレポート詳細 */
window.pageInit = async function (config) {
  const id = CoAX.qs("id");
  const el = document.getElementById("article");
  let cols = [];
  try { cols = await CoAX.loadJSON("data/columns.json"); }
  catch (e) { cols = []; }

  const article = cols.find(c => c.id === id);
  if (!article) {
    el.innerHTML = `<div class="empty"><div class="empty__icon">🔍</div>
      <h3>記事が見つかりません</h3>
      <p><a href="columns.html">コラム一覧に戻る</a></p></div>`;
    return;
  }

  document.title = `${article.title} | ${config.siteName}`;

  const bodyHTML = renderBody(article.body);
  el.innerHTML = `
    <p class="crumbs"><a href="index.html">トップ</a> ／ <a href="columns.html">コラム</a> ／ 記事</p>
    <div class="article__head">
      <span class="badge badge--available">${CoAX.escapeHTML(article.category || "コラム")}</span>
      <h1 class="article__title">${CoAX.escapeHTML(article.title)}</h1>
      <p class="article__date">${CoAX.formatDate(article.date)}</p>
    </div>
    <div class="article__body">${bodyHTML}</div>
    <a class="back-link" href="columns.html">← コラム一覧に戻る</a>`;
};

/* body: 文字列 or [{type:'p'|'h2', text}] の両対応 */
function renderBody(body) {
  if (typeof body === "string") {
    return body.split(/\n{2,}/).map(t => `<p>${CoAX.escapeHTML(t).replace(/\n/g, "<br>")}</p>`).join("");
  }
  if (Array.isArray(body)) {
    return body.map(block => {
      const text = CoAX.escapeHTML(block.text || "").replace(/\n/g, "<br>");
      if (block.type === "h2") return `<h2>${text}</h2>`;
      return `<p>${text}</p>`;
    }).join("");
  }
  return "";
}
