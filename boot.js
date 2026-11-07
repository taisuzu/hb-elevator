// 公開版の入口：合言葉で写真・手紙・設定を復号してからサイトを起動する
(async () => {
  'use strict';
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  // 表記ゆれ対策：全角半角をそろえ、カタカナはひらがなに
  const norm = (s) => s.normalize('NFKC').trim().replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

  const lock = document.createElement('div');
  lock.id = 'lock';
  lock.innerHTML = `
    <div class="gate-inner">
      <p class="gate-kicker">PRIVATE ELEVATOR</p>
      <h1 class="gate-title"><em>for</em> you</h1>
      <p class="gate-sub">合言葉を入れてください</p>
      <form id="lockForm">
        <input id="lockPass" type="text" lang="ja" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="ひらがなで入力">
        <button id="lockBtn" type="submit">ひらく</button>
      </form>
      <p id="lockMsg" class="gate-note"></p>
    </div>`;
  document.body.append(lock);

  const meta = await fetch('data/meta.json', { cache: 'no-store' }).then((r) => r.json());
  const form = document.getElementById('lockForm');
  const input = document.getElementById('lockPass');
  const msg = document.getElementById('lockMsg');
  let busy = false;

  async function deriveKey(pass) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm(pass)), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64(meta.salt), iterations: meta.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }
  // 形式: IV(12byte) + 暗号文 + 認証タグ
  const decrypt = (key, bytes) => crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true; msg.textContent = 'たしかめています…';
    let key, manifest;
    try {
      key = await deriveKey(input.value);
      manifest = JSON.parse(new TextDecoder().decode(await decrypt(key, b64(meta.manifest))));
    } catch (err) {
      busy = false;
      msg.textContent = 'ちがうみたい…';
      input.value = '';
      input.classList.remove('ng'); void input.offsetWidth; input.classList.add('ng');
      return;
    }

    // 写真とちみたんを復号（並列で少しずつ）
    const entries = Object.entries(manifest.map);
    const map = {};
    let done = 0;
    const work = async ([path, [id, type]]) => {
      const buf = new Uint8Array(await fetch('data/' + id + '.bin').then((r) => r.arrayBuffer()));
      map[path] = URL.createObjectURL(new Blob([await decrypt(key, buf)], { type }));
      msg.textContent = `ひらいています… ${Math.round(++done / entries.length * 100)}%`;
    };
    for (let i = 0; i < entries.length; i += 8) await Promise.all(entries.slice(i, i + 8).map(work));
    window.ASSET_MAP = map;

    // 設定（名前・手紙など）を読み込んでから本体を起動
    const load = (src) => new Promise((ok, ng) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ng; document.body.append(s); });
    await load(URL.createObjectURL(new Blob([manifest.code], { type: 'text/javascript' })));
    await load('script.js');
    lock.classList.add('bye');
    setTimeout(() => lock.remove(), 900);
  });
  input.focus();
})();
