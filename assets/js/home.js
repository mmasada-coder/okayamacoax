/* トップページ */
window.pageInit = async function (config) {
  await Promise.all([renderEvents(), renderCategories(config), renderLatestColumns()]);
};

async function renderEvents() {
  const wrap = document.getElementById("events");
  if (!wrap) return;
  try {
    let events = await CoAX.loadJSON("data/events.json");
    events = CoAXContent.visibleEvents(events);

    if (!events.length) {
      wrap.innerHTML = `<div class="empty" style="padding:32px"><p>次回の開催予定は準備中です。LINEオープンチャットでお知らせします。</p></div>`;
      return;
    }
    wrap.innerHTML = events.map(e => {
      const hasDate = e.date !== "";
      const d = CoAX.dateParts(e.date);
      const tagClass = e.type === "オンライン" ? "tag--online" : "tag--offline";
      const dateTile = hasDate
        ? `<div class="event-date__day">${d.day}</div><div class="event-date__ym">${d.year}.${Number(d.month)}</div>`
        : `<div class="event-date__day" style="font-size:15px;line-height:1.25">日程<br>調整中</div>`;
      const whenText = hasDate ? CoAX.formatDate(e.date, true) : "日程調整中";
      return `
        <div class="event-item">
          <div class="event-date">${dateTile}</div>
          <div class="event-body">
            <p class="event-title">${CoAX.escapeHTML(e.title)}</p>
            <p class="event-meta">
              <span class="tag ${tagClass}">${CoAX.escapeHTML(e.type)}</span>
              <span>${CoAX.escapeHTML(whenText)}</span>
              ${e.note ? `<span>${CoAX.escapeHTML(e.note)}</span>` : ""}
            </p>
          </div>
        </div>`;
    }).join("");
  } catch (err) {
    wrap.innerHTML = `<div class="empty" role="status"><p>開催予定を読み込めませんでした。</p><p><a href="index.html">再読み込みする</a> ／ LINEオープンチャットでもご案内しています。</p></div>`;
  }
}

async function renderCategories(config) {
  const wrap = document.getElementById("categories");
  if (!wrap) return;

  const cards = config.categories.map((cat) => {
    const coming = cat.status !== "available";
    const badge = coming
      ? `<span class="badge badge--coming">準備中</span>`
      : `<span class="badge badge--available">公開中</span>`;
    const foot = coming
      ? `<span class="cat-card__count">Coming soon</span>`
      : `<span class="cat-card__count">🔒 合言葉で閲覧</span>`;
    const inner = `
        <div class="cat-card__icon">${CoAX.icon(cat.icon)}</div>
        <h3 class="cat-card__name">${CoAX.escapeHTML(cat.name)}</h3>
        <p class="cat-card__scene">${CoAX.escapeHTML(cat.scene)}</p>
        <div class="cat-card__foot">${foot}${badge}</div>`;
    return coming
      ? `<div class="card cat-card is-coming" aria-disabled="true">${inner}</div>`
      : `<a class="card cat-card" href="category.html?cat=${cat.id}">${inner}</a>`;
  });

  wrap.innerHTML = cards.join("");
}

async function renderLatestColumns() {
  const wrap = document.getElementById("latest-columns");
  if (!wrap) return;
  try {
    let cols = await CoAX.loadJSON("data/columns.json");
    cols = cols.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    if (!cols.length) {
      wrap.innerHTML = `<div class="empty" style="padding:32px"><p>コラムは準備中です。</p></div>`;
      return;
    }
    wrap.innerHTML = cols.map(c => `
      <a class="card column-card" href="column.html?id=${encodeURIComponent(c.id)}">
        <div class="column-card__meta">
          <span class="badge badge--available">${CoAX.escapeHTML(c.category || "コラム")}</span>
          <span class="column-card__date">${CoAX.formatDate(c.date)}</span>
        </div>
        <h3 class="column-card__title">${CoAX.escapeHTML(c.title)}</h3>
        <p class="column-card__excerpt">${CoAX.escapeHTML(c.excerpt || "")}</p>
      </a>`).join("");
  } catch (err) {
    wrap.innerHTML = `<div class="empty" role="status"><p>コラムを読み込めませんでした。</p><p><a href="index.html">再読み込みする</a></p></div>`;
  }
}
