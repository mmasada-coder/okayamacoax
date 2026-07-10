/* ===========================================================
   おかやまCoAX  合言葉による暗号化/復号（Web Crypto / AES-GCM）
   - サイト側（復号）と 暗号化ツール（tools/encryptor.html）で共用
   - 公開されるのは暗号文のみ。合言葉が無ければ本文は読めません
   ※ Web Crypto は「安全なコンテキスト」でのみ動作します
      （https:// または localhost）。http:// では動きません
   =========================================================== */
const CoAXCrypto = (() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const ITER = 200000;

  function b64encode(buf) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
  }
  function b64decode(str) {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
  }

  function assertAvailable() {
    if (!(window.crypto && window.crypto.subtle)) {
      throw new Error("この環境では暗号機能が使えません（https:// または localhost で開いてください）");
    }
  }

  async function deriveKey(password, salt, iterations) {
    const base = await crypto.subtle.importKey(
      "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /** plainText(文字列) を password で暗号化し、保存用オブジェクトを返す */
  async function encrypt(plainText, password) {
    assertAvailable();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt, ITER);
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plainText));
    return {
      v: 1,
      kdf: "PBKDF2-SHA256",
      iter: ITER,
      salt: b64encode(salt),
      iv: b64encode(iv),
      ct: b64encode(ct),
    };
  }

  /** encrypt() が返したオブジェクトを password で復号し、元の文字列を返す */
  async function decrypt(obj, password) {
    assertAvailable();
    const salt = b64decode(obj.salt);
    const iv = b64decode(obj.iv);
    const ct = b64decode(obj.ct);
    const key = await deriveKey(password, salt, obj.iter || ITER);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return dec.decode(pt);
  }

  return { encrypt, decrypt };
})();
