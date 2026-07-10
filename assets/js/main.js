/* ===========================================================
   おかやまCoAX  共通スクリプト
   - 設定(config.json)の読み込み
   - ヘッダー / フッターの描画
   - 各ページ共通のヘルパー
   =========================================================== */

const CoAX = (() => {
  const CONFIG_URL = "data/config.json";
  let _config = null;

  /* ---- データ取得 ---- */
  async function loadJSON(path) {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error(`読み込み失敗: ${path} (${res.status})`);
    return res.json();
  }

  async function getConfig() {
    if (_config) return _config;
    _config = await loadJSON(CONFIG_URL);
    return _config;
  }

  /* ---- ヘルパー ---- */
  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function escapeHTML(str = "") {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function formatDate(iso, withTime = false) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const w = "日月火水木金土"[d.getDay()];
    let s = `${y}年${m}月${day}日(${w})`;
    if (withTime) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      s += ` ${hh}:${mm}`;
    }
    return s;
  }

  /* ---- カテゴリアイコン(インラインSVG) ---- */
  const ICONS = {
    person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
    document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M14 8a4 4 0 0 1 0 8"/><path d="M17 5a8 8 0 0 1 0 14"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="5" width="3" height="12"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.3 2.9-5 6.5-5s6.5 1.7 6.5 5"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6M18 15c2.6.4 4.5 1.9 4.5 4.5"/></svg>',
  };
  function icon(name) { return ICONS[name] || ICONS.document; }

  const COPY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>';
  const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  /* ---- ヘッダー / フッター描画 ---- */
  function renderChrome(config, activePage) {
    const nav = [
      { href: "index.html", label: "トップ", key: "home" },
      { href: "prompts.html", label: "プロンプト集", key: "prompts" },
      { href: "columns.html", label: "コラム", key: "columns" },
    ];
    const navHTML = nav.map(n =>
      `<a href="${n.href}"${n.key === activePage ? ' class="is-active"' : ""}>${n.label}</a>`
    ).join("");

    const header = document.getElementById("site-header");
    if (header) {
      header.className = "site-header";
      header.innerHTML = `
        <div class="site-header__inner">
          <a class="brand" href="index.html">
            <span class="brand__logo">Co</span>
            <span class="brand__name">${escapeHTML(config.siteName)}<small>${escapeHTML(config.concept)}</small></span>
          </a>
          <button class="nav-toggle" aria-label="メニュー" onclick="document.getElementById('site-nav').classList.toggle('is-open')">
            <span></span><span></span><span></span>
          </button>
          <nav class="nav" id="site-nav">
            ${navHTML}
            <a href="${escapeHTML(config.lineFormUrl)}" class="btn btn--line btn--sm" target="_blank" rel="noopener">LINEで参加</a>
          </nav>
        </div>`;
    }

    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = `
        <div class="site-footer__inner">
          <div>
            <div class="site-footer__brand">${escapeHTML(config.siteName)}
              <small>${escapeHTML(config.concept)} ／ 運営: ${escapeHTML(config.operator)}</small>
            </div>
          </div>
          <nav class="site-footer__nav">
            <a href="index.html">トップ</a>
            <a href="prompts.html">プロンプトライブラリ</a>
            <a href="columns.html">コラム・イベントレポート</a>
            <a href="${escapeHTML(config.lineFormUrl)}" target="_blank" rel="noopener">LINEオープンチャットに参加する</a>
          </nav>
          <div class="site-footer__copy">© ${new Date().getFullYear()} ${escapeHTML(config.operator)} / ${escapeHTML(config.siteName)}</div>
        </div>`;
    }
  }

  /* ---- 初期化: 各ページのdata-page属性からactiveを判定 ---- */
  async function init() {
    const activePage = document.body.dataset.page || "";
    try {
      const config = await getConfig();
      renderChrome(config, activePage);
      if (typeof window.pageInit === "function") {
        await window.pageInit(config);
      }
    } catch (err) {
      console.error(err);
      const main = document.getElementById("main");
      if (main) {
        main.innerHTML = `<div class="container section"><div class="empty">
          <div class="empty__icon">⚠️</div>
          <h3>データの読み込みに失敗しました</h3>
          <p>ローカルで確認する場合は、簡易サーバー経由で開いてください（README参照）。</p>
        </div></div>`;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  return { loadJSON, getConfig, qs, escapeHTML, formatDate, icon, COPY_SVG, CHECK_SVG };
})();

/* コピー機能(グローバル) */
function coaxCopy(btn, encoded) {
  const text = decodeURIComponent(encoded);
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.innerHTML;
    btn.classList.add("is-copied");
    btn.innerHTML = `${CoAX.CHECK_SVG}<span>コピーしました</span>`;
    setTimeout(() => { btn.classList.remove("is-copied"); btn.innerHTML = original; }, 1800);
  }).catch(() => {
    // clipboard APIが使えない環境向けフォールバック
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    btn.classList.add("is-copied");
    btn.innerHTML = `${CoAX.CHECK_SVG}<span>コピーしました</span>`;
    setTimeout(() => { btn.classList.remove("is-copied"); btn.innerHTML = `${CoAX.COPY_SVG}<span>コピー</span>`; }, 1800);
  });
}
