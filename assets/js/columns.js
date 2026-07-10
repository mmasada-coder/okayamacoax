/* コラム・イベントレポート一覧(新着順) */
window.pageInit = async function () {
  const list = document.getElementById("article-list");
  let cols = [];
  try { cols = await CoAX.loadJSON("data/columns.json"); }
  catch (e) { cols = []; }

  if (!cols.length) {
    list.innerHTML = `<div class="empty"><div class="empty__icon">📝</div>
      <h3>記事は準備中です</h3><p>コラム・イベントレポートを順次公開していきます。</p></div>`;
    return;
  }

  cols = cols.sort((a, b) => new Date(b.date) - new Date(a.date));
  list.innerHTML = cols.map(c => `
    <a class="article-row" href="column.html?id=${encodeURIComponent(c.id)}">
      <span class="article-row__date">${CoAX.formatDate(c.date)}</span>
      <span class="article-row__body">
        <span class="badge badge--available" style="margin-bottom:6px">${CoAX.escapeHTML(c.category || "コラム")}</span>
        <span class="article-row__title" style="display:block">${CoAX.escapeHTML(c.title)}</span>
        <span class="article-row__excerpt">${CoAX.escapeHTML(c.excerpt || "")}</span>
      </span>
    </a>`).join("");
};
