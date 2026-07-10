/* カテゴリ別ページ（プロンプト一覧 + 合言葉ゲート + コピー） */
const CoAX_PASS_KEY = "coax_pass"; // sessionStorage（タブを閉じるまで保持）

window.pageInit = async function (config) {
  const catId = CoAX.qs("cat");
  const cat = config.categories.find(c => c.id === catId);
  const head = document.getElementById("cat-head");
  const list = document.getElementById("prompt-list");

  if (!cat) {
    head.innerHTML = "";
    list.innerHTML = `<div class="empty"><div class="empty__icon">🔍</div>
      <h3>カテゴリが見つかりません</h3>
      <p><a href="prompts.html">プロンプトライブラリに戻る</a></p></div>`;
    return;
  }

  document.title = `${cat.name} | プロンプトライブラリ | ${config.siteName}`;
  head.innerHTML = `
    <p class="crumbs"><a href="index.html">トップ</a> ／ <a href="prompts.html">プロンプト集</a> ／ ${CoAX.escapeHTML(cat.name)}</p>
    <div class="section__head" style="text-align:left; margin-bottom:8px">
      <div class="cat-card__icon" style="margin-bottom:12px">${CoAX.icon(cat.icon)}</div>
      <h1 class="section__title" style="text-align:left">${CoAX.escapeHTML(cat.name)}</h1>
      <p class="section__lead" style="text-align:left">${CoAX.escapeHTML(cat.scene)}</p>
    </div>`;

  // 暗号化ファイルを取得
  let encData;
  try {
    encData = await CoAX.loadJSON(`data/prompts/${cat.id}.enc.json`);
  } catch (e) {
    list.innerHTML = `<div class="empty"><div class="empty__icon">🛠️</div>
      <h3>準備中です（Coming soon）</h3>
      <p>このカテゴリのプロンプトは現在準備中です。</p>
      <p style="margin-top:20px"><a class="btn btn--ghost btn--sm" href="prompts.html">他のカテゴリを見る</a></p></div>`;
    return;
  }

  // すでにこのセッションで合言葉を入力済みなら自動で開く
  const saved = sessionStorage.getItem(CoAX_PASS_KEY);
  if (saved) {
    const arr = await tryDecrypt(encData, saved);
    if (arr) { renderPrompts(list, arr); return; }
    sessionStorage.removeItem(CoAX_PASS_KEY); // 合言葉が変わった等
  }

  renderGate(list, encData);
};

async function tryDecrypt(encData, password) {
  try {
    const text = await CoAXCrypto.decrypt(encData, password);
    return JSON.parse(text);
  } catch (e) {
    return null; // 合言葉違い or 復号失敗
  }
}

function renderGate(list, encData, errorMsg) {
  list.innerHTML = `
    <div class="gate">
      <div class="gate__icon">🔒</div>
      <h3 class="gate__title">この先は合言葉が必要です</h3>
      <p class="gate__lead">プロンプト本文は、コミュニティ参加者向けに合言葉で保護されています。<br>
        登録時にお送りする合言葉を入力してください。</p>
      <form class="gate__form" id="gate-form">
        <input class="gate__input" id="gate-input" type="password" inputmode="text"
               autocomplete="off" placeholder="合言葉を入力" aria-label="合言葉" required>
        <button class="btn btn--primary" type="submit">解除する</button>
      </form>
      <p class="gate__error" id="gate-error">${errorMsg ? CoAX.escapeHTML(errorMsg) : ""}</p>
    </div>`;

  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-input");
  const errEl = document.getElementById("gate-error");
  input.focus();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = input.value.trim();
    if (!pw) return;
    errEl.textContent = "確認中…";
    const arr = await tryDecrypt(encData, pw);
    if (arr) {
      sessionStorage.setItem(CoAX_PASS_KEY, pw);
      renderPrompts(list, arr);
    } else {
      errEl.textContent = "合言葉が正しくないようです。もう一度お試しください。";
      input.value = "";
      input.focus();
    }
  });
}

function renderPrompts(list, prompts) {
  if (!Array.isArray(prompts) || !prompts.length) {
    list.innerHTML = `<div class="empty"><div class="empty__icon">🛠️</div>
      <h3>準備中です</h3><p>このカテゴリのプロンプトは現在準備中です。</p></div>`;
    return;
  }
  list.innerHTML = prompts.map(p => {
    const encoded = encodeURIComponent(p.body);
    return `
      <div class="card prompt-card">
        <div class="prompt-card__head">
          <div>
            <h3 class="prompt-card__title">${CoAX.escapeHTML(p.title)}</h3>
            ${p.description ? `<p class="prompt-card__desc">${CoAX.escapeHTML(p.description)}</p>` : ""}
          </div>
          <button class="copy-btn" onclick="coaxCopy(this, '${encoded}')">${CoAX.COPY_SVG}<span>コピー</span></button>
        </div>
        <div class="prompt-body">${CoAX.escapeHTML(p.body)}</div>
      </div>`;
  }).join("");
}
