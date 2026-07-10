/* プロンプトライブラリ(一覧) */
window.pageInit = async function (config) {
  const wrap = document.getElementById("categories");
  if (!wrap) return;

  const cards = config.categories.map((cat) => {
    const coming = cat.status !== "available";
    const badge = coming
      ? `<span class="badge badge--coming">準備中</span>`
      : `<span class="badge badge--available">公開中</span>`;
    const foot = coming
      ? `<span class="cat-card__count">Coming soon</span>`
      : `<span class="cat-card__count">🔒 合言葉で閲覧 →</span>`;
    const inner = `
        <div class="cat-card__icon">${CoAX.icon(cat.icon)}</div>
        <h3 class="cat-card__name">${CoAX.escapeHTML(cat.name)}</h3>
        <p class="cat-card__scene">${CoAX.escapeHTML(cat.scene)}</p>
        <div class="cat-card__foot">${foot}${badge}</div>`;
    return coming
      ? `<div class="card cat-card is-coming" id="${cat.id}" aria-disabled="true">${inner}</div>`
      : `<a class="card cat-card" id="${cat.id}" href="category.html?cat=${cat.id}">${inner}</a>`;
  });

  wrap.innerHTML = cards.join("");
};
