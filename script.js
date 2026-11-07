// 誕生日エレベーター本体
(() => {
  'use strict';
  const C = window.CONFIG;
  // 暗号化版では復号した画像（blob URL）に置き換える
  const asset = (p) => (window.ASSET_MAP && window.ASSET_MAP[p]) || p;
  const $ = (s) => document.querySelector(s);
  const PREVIEW = new URLSearchParams(location.search).has('preview');
  const SEG = 1.5; // 1フロアあたりのスクロール量（画面何枚ぶん）
  history.scrollRestoration = 'manual';

  // ---------- 画像（読めなければ仮画像に差し替え） ----------
  const svgURI = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  const PH_CHIMI = svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="40" ry="35" fill="#fff" stroke="#c9b8a8" stroke-width="3"/><circle cx="37" cy="56" r="4" fill="#3a2e2a"/><circle cx="63" cy="56" r="4" fill="#3a2e2a"/><ellipse cx="28" cy="66" rx="6" ry="3.5" fill="#f7b6c2"/><ellipse cx="72" cy="66" rx="6" ry="3.5" fill="#f7b6c2"/><path d="M45 66 q5 5 10 0" stroke="#3a2e2a" stroke-width="2.5" fill="none" stroke-linecap="round"/><text x="50" y="20" font-size="11" text-anchor="middle" fill="#b06" font-family="sans-serif">仮</text></svg>`);
  const photoPH = (label, hue) => svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,82%)"/><stop offset="1" stop-color="hsl(${hue + 40},70%,70%)"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><text x="200" y="240" font-size="42" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="bold">${label}</text><text x="200" y="290" font-size="22" text-anchor="middle" fill="#fff" font-family="sans-serif">photos/ に入れてね</text></svg>`);

  let chimiN = 0;
  // 毎回ちがう顔ぶれになるよう、読み込みごとにシャッフル
  const chimiList = [...(C.chimitan || [])];
  for (let k = chimiList.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [chimiList[k], chimiList[j]] = [chimiList[j], chimiList[k]]; }
  function chimiImg(cls = '') {
    const img = new Image();
    img.className = 'chimi ' + cls; img.alt = ''; img.draggable = false;
    const list = chimiList;
    img.onerror = () => { img.onerror = null; img.src = PH_CHIMI; };
    img.src = list.length ? asset(list[chimiN++ % list.length]) : PH_CHIMI;
    return img;
  }
  function photoImg(src, label, hue) {
    const img = new Image();
    img.className = 'ph'; img.alt = label; img.draggable = false;
    img.onerror = () => { img.onerror = null; img.src = photoPH(label, hue); };
    img.src = asset(src);
    return img;
  }
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  // ---------- 季節の粒子 ----------
  const EN = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // テーマ → 使う粒子
  const THEME_FX = {
    snow: ['snow'], frost: ['snow-light', 'spark'], sakura: ['petal'], green: ['rays', 'motes'],
    rain: ['rain', 'drops'], stars: ['stars', 'firefly'], fireworks: ['stars', 'fireworks'],
    sunset: ['rays', 'motes'], autumn: ['leaf'], illumi: ['bokeh', 'ginkgo'],
  };
  // テーマ未指定時の月ごとのデフォルト
  const MONTH_THEME = ['', 'snow', 'frost', 'sakura', 'sakura', 'green', 'rain', 'stars', 'fireworks', 'sunset', 'autumn', 'illumi', 'illumi'];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function addFx(box, type) {
    const make = (cls, n, fn) => {
      for (let k = 0; k < n; k++) { const p = el('i', cls); fn(p.style, k); box.append(p); }
    };
    const fallStyle = (s, size, dur, sway) => {
      s.left = rnd(-5, 100) + '%';
      s.setProperty('--s', rnd(...size) + 'px');
      s.setProperty('--d', rnd(...dur) + 's');
      s.setProperty('--delay', -rnd(0, dur[1]) + 's'); // 最初から画面に散らばった状態にする
      s.setProperty('--sway', rnd(-sway, sway) + 'px');
      s.setProperty('--rot', rnd(-720, 720) + 'deg');
    };
    switch (type) {
      case 'snow': make('p-snow', 45, (s) => fallStyle(s, [2, 6], [6, 12], 40)); break;
      case 'snow-light': make('p-snow', 18, (s) => { fallStyle(s, [2, 4], [9, 14], 30); s.opacity = .7; }); break;
      case 'petal': make('p-petal', 28, (s) => { fallStyle(s, [7, 13], [6, 11], 70); s.setProperty('--c', pick(['#ffc4d6', '#ffd6e2', '#f7a8c0', '#fff0f4'])); }); break;
      case 'leaf': make('p-leaf', 20, (s) => { fallStyle(s, [10, 18], [6, 10], 80); s.setProperty('--c', pick(['#c0392b', '#e67e22', '#d35400', '#a93226', '#f0a030'])); }); break;
      case 'ginkgo': make('p-ginkgo', 16, (s) => fallStyle(s, [9, 15], [7, 11], 60)); break;
      case 'rain': make('p-rain', 55, (s) => { s.left = rnd(-20, 110) + '%'; s.setProperty('--d', rnd(.5, .85) + 's'); s.setProperty('--delay', -rnd(0, 1) + 's'); }); break;
      case 'drops': make('p-drop', 16, (s) => { s.left = rnd(2, 95) + '%'; s.top = rnd(3, 95) + '%'; s.setProperty('--s', rnd(4, 10) + 'px'); }); break;
      case 'stars': make('p-star', 55, (s) => { s.left = rnd(0, 100) + '%'; s.top = rnd(0, 70) + '%'; s.setProperty('--s', rnd(1, 2.6) + 'px'); s.setProperty('--d', rnd(2, 5) + 's'); s.setProperty('--delay', -rnd(0, 5) + 's'); }); break;
      case 'firefly': make('p-fly', 14, (s) => { s.left = rnd(5, 90) + '%'; s.top = rnd(40, 95) + '%'; s.setProperty('--d', rnd(4, 8) + 's'); s.setProperty('--delay', -rnd(0, 8) + 's'); s.setProperty('--dx', rnd(-40, 40) + 'px'); s.setProperty('--dy', rnd(-50, 10) + 'px'); }); break;
      case 'motes': make('p-mote', 20, (s) => { fallStyle(s, [2, 5], [7, 13], 30); }); break;
      case 'spark': make('p-spark', 14, (s) => { s.left = rnd(5, 95) + '%'; s.top = rnd(5, 90) + '%'; s.setProperty('--s', rnd(6, 14) + 'px'); s.setProperty('--d', rnd(1.5, 3.5) + 's'); s.setProperty('--delay', -rnd(0, 3) + 's'); }); break;
      case 'bokeh': make('p-bokeh', 18, (s) => { s.left = rnd(-5, 95) + '%'; s.top = rnd(0, 90) + '%'; s.setProperty('--s', rnd(16, 60) + 'px'); s.setProperty('--c', pick(['rgba(255,214,120,.8)', 'rgba(255,180,200,.7)', 'rgba(255,255,240,.7)', 'rgba(255,190,90,.8)'])); s.setProperty('--d', rnd(2.5, 5) + 's'); s.setProperty('--delay', -rnd(0, 5) + 's'); }); break;
      case 'rays': box.append(el('div', 'p-rays')); break;
      case 'fireworks':
        for (let k = 0; k < 5; k++) {
          const fw = el('div', 'fw');
          fw.style.left = rnd(12, 88) + '%'; fw.style.top = rnd(10, 45) + '%';
          fw.style.setProperty('--h', pick([0, 30, 45, 200, 280, 330]));
          fw.style.setProperty('--delay', (k * .55 + rnd(0, .3)) + 's');
          for (let j = 0; j < 18; j++) { const p = el('i'); p.style.setProperty('--a', (j * 20) + 'deg'); fw.append(p); }
          box.append(fw);
        }
        break;
    }
  }

  // ---------- 写真スライド（横長写真はぼかし背景の上に全体を表示） ----------
  function makeSlides(f, label) {
    const box = el('div', 'slides');
    f.slideEls = f.list.map((src, k) => {
      const sl = el('div', 'slide' + (k === 0 ? ' on' : ''));
      if (/\.mp4$/i.test(src)) {
        // 動画：音なしで自動再生（BGMとぶつからないように）
        const v = document.createElement('video');
        v.className = 'main'; v.src = asset(src);
        v.muted = true; v.playsInline = true; v.preload = 'auto';
        v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
        v.addEventListener('loadedmetadata', () => { if (v.videoWidth > v.videoHeight * 1.05) sl.classList.add('land'); });
        sl.classList.add('video'); sl.append(v); sl.video = v;
        box.append(sl);
        return sl;
      }
      const blur = photoImg(src, label, f.month * 30); blur.className = 'blur';
      const main = photoImg(src, label, f.month * 30); main.className = 'main';
      main.addEventListener('load', () => { if (main.naturalWidth > main.naturalHeight * 1.05) sl.classList.add('land'); });
      sl.append(blur, main);
      box.append(sl);
      return sl;
    });
    f.slideIdx = 0;
    if (f.list.length > 1) {
      const dots = el('div', 'dots');
      f.dotEls = f.list.map((_, k) => { const d = el('i', k === 0 ? 'on' : ''); dots.append(d); return d; });
      box.append(dots);
      box.addEventListener('click', () => nextSlide(f));
    }
    return box;
  }
  function nextSlide(f) {
    if (!f.slideEls || f.slideEls.length < 2) return;
    f.slideEls[f.slideIdx].classList.remove('on'); f.dotEls[f.slideIdx].classList.remove('on');
    f.slideIdx = (f.slideIdx + 1) % f.slideEls.length;
    f.slideEls[f.slideIdx].classList.add('on'); f.dotEls[f.slideIdx].classList.add('on');
    f.lastSlide = Date.now();
    playCurrent(f);
  }
  // 表示中のスライドが動画なら頭から再生し、それ以外の動画は止める
  function playCurrent(f) {
    (f.slideEls || []).forEach((sl, k) => {
      if (!sl.video) return;
      if (k === f.slideIdx) { sl.video.currentTime = 0; sl.video.play().catch(() => {}); }
      else sl.video.pause();
    });
  }
  const pauseAll = (f) => (f?.slideEls || []).forEach((sl) => sl.video?.pause());

  // ---------- フロア構成 ----------
  const floors = [
    { type: 'lobby', num: 'L', label: 'LOBBY' },
    ...C.floors.map((f) => ({ ...f, type: 'month', num: f.month + 'F', label: EN[f.month].slice(0, 3).toUpperCase() })),
    { type: 'bday', num: '★', label: C.bdayLabel || 'HAPPY' },
  ];
  const N = floors.length;
  const outside = $('#outside');

  floors.forEach((f, i) => {
    const s = el('div', 'scene ' + f.type);
    s.append(el('div', 'sky'));
    if (f.type === 'lobby') {
      s.append(el('div', 'chandelier'), el('div', 'lobby-sign', 'Lobby'), el('div', 'carpet'));
      const t = el('p', 'lobby-text');
      t.append(el('strong', '', C.herName + 'の2026年へ'), '上へまいります');
      s.append(t, chimiImg('bell'));
    } else if (f.type === 'month') {
      const theme = f.theme || MONTH_THEME[f.month];
      const layout = f.layout || 'frame';
      s.classList.add('theme-' + theme, 'layout-' + layout);
      if (i % 2 === 0) s.classList.add('alt'); // 左右を交互に
      const label = f.month + '月の写真';
      f.list = f.photos || (f.photo ? [f.photo] : []);
      const slides = f.list.length ? makeSlides(f, label) : null;
      if (layout === 'bg') {
        if (slides) s.append(slides);
        else { const st = chimiImg('standin'); st.classList.add('bgph'); s.append(st); }
        s.append(el('div', 'shade'));
      } else {
        const fr = el('figure', 'frame');
        fr.style.setProperty('--rot', (i % 2 ? 2 : -2) + 'deg');
        fr.append(slides || chimiImg('ph standin'));
        s.append(fr);
      }
      const fx = el('div', 'fx');
      (THEME_FX[theme] || []).forEach((t) => addFx(fx, t));
      const title = el('div', 'title');
      title.append(el('span', 'num', String(f.month).padStart(2, '0')), el('span', 'en', EN[f.month]));
      const w = el('div', 'waiter');
      w.append(chimiImg());
      if (f.chimiSay) w.append(el('span', 'bubble', f.chimiSay));
      s.append(fx, title, w);
    } else {
      s.append(el('div', 'spotlight'));
      const lights = el('div', 'lights');
      for (let k = 0; k < 11; k++) {
        const b = el('i');
        b.style.setProperty('--y', (Math.sin((k / 10) * Math.PI) * 5) + 'cqh');
        b.style.setProperty('--delay', -rnd(0, 2) + 's');
        lights.append(b);
      }
      const fx = el('div', 'fx'); addFx(fx, 'bokeh');
      const inner = el('div', 'bday-inner');
      const cake = el('div', 'cake');
      cake.append(el('div', 'plate'), el('div', 'tier t1'), el('div', 'tier t2'));
      const cs = el('div', 'candles');
      for (let k = 0; k < C.candles; k++) {
        const c = el('span', 'candle'); c.append(el('i', 'flame'));
        c.addEventListener('click', () => blowOut(c));
        cs.append(c);
      }
      cake.append(cs, chimiImg('cake-chimi'), chimiImg('cake-chimi2'));
      const blow = el('div', 'blow');
      const btn = el('button', 'pill', '🎤 ふーっと吹き消して'); btn.id = 'blowBtn';
      blow.append(btn, el('p', 'small', 'ろうそくをタップしても消せます'));
      const lb = el('button', 'pill', '手紙をひらく'); lb.id = 'letterBtn'; lb.hidden = true;
      inner.append(el('div', 'hb', 'Happy Birthday'), el('div', 'hbname', C.herName), cake, blow, lb);
      s.append(fx, lights, inner);
    }
    outside.append(s);
    f.el = s;
  });

  // ボタンパネル（上が最上階）
  const panel = $('#panel');
  [...floors].reverse().forEach((f) => {
    f.btn = el('b', '', f.type === 'month' ? String(f.month) : f.num);
    panel.append(f.btn);
  });

  // HTML内の <span data-chimi="クラス"> をちみたん画像に置き換え
  document.querySelectorAll('[data-chimi]').forEach((s) => s.replaceWith(chimiImg(s.dataset.chimi)));

  // ---------- 乗客ちみたん（フロアを通過するたび1匹ずつ乗ってくる） ----------
  // x: 左位置%, b: 下からの位置%, s: 大きさ（奥ほど小さく）
  const SLOTS = [
    { x: 4, b: 2, s: 1.15 }, { x: 70, b: 3, s: 1.1 }, { x: 37, b: 0, s: 1.25 },
    { x: 20, b: 22, s: .85 }, { x: 54, b: 24, s: .85 }, { x: 80, b: 26, s: .78 },
    { x: -3, b: 30, s: .75 }, { x: 38, b: 40, s: .68 }, { x: 66, b: 44, s: .62 },
    { x: 14, b: 50, s: .58 }, { x: 86, b: 52, s: .55 }, { x: 50, b: 58, s: .5 },
    { x: 28, b: 60, s: .48 }, { x: 0, b: 62, s: .46 },
  ];
  const ridersEl = $('#riders');
  const riders = [];
  function setRiders(n) {
    while (riders.length < n) {
      const k = riders.length, s = SLOTS[k % SLOTS.length];
      const d = el('div', 'rider pop' + (k % 2 ? ' flip' : ''));
      d.style.cssText = `left:${s.x}%;bottom:${s.b}%;width:${23 * s.s}%;z-index:${100 - s.b}`;
      d.append(chimiImg());
      d.addEventListener('click', () => riderTap(d));
      d.addEventListener('animationend', (e) => { if (e.animationName === 'pop' || e.animationName === 'jump') d.classList.remove('pop', 'jump'); });
      ridersEl.append(d); riders.push(d);
    }
    while (riders.length > n) riders.pop().remove();
  }
  function riderTap(d) {
    d.classList.remove('pop', 'jump'); void d.offsetWidth; d.classList.add('jump');
    d.querySelector('.bubble')?.remove();
    const lines = C.chimiLines || ['！'];
    d.append(el('span', 'bubble', lines[Math.floor(Math.random() * lines.length)]));
    boop();
  }

  // ---------- 音 ----------
  let actx = null;
  const ensureAudio = () => { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* 無音で続行 */ } } actx?.resume?.(); };
  function tone(freq, start, dur, vol = .12, type = 'sine') {
    if (!actx) return;
    const t = actx.currentTime + start, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + .05);
  }
  const ding = () => { tone(1318, 0, 1.2); tone(1046, .22, 1.4); };
  const boop = () => tone(600 + Math.random() * 500, 0, .18, .08, 'triangle');
  const fanfare = () => [523, 659, 784, 1046, 784, 1046].forEach((f, k) => tone(f, k * .13, .5, .1, 'triangle'));
  let muted = false;
  $('#mute').addEventListener('click', () => { muted = !muted; Music.setVolume(muted ? 0 : 1); $('#mute').textContent = muted ? '×' : '♪'; });

  // ---------- トースト ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
  }

  // ---------- スクロール連動 ----------
  const car = $('#car'), frame = $('#frame'), spacer = $('#spacer');
  const floorNum = $('#floorNum'), floorLabel = $('#floorLabel'), arrow = $('#arrow'), hint = $('#hint');
  const peek = document.querySelector('.peek');
  // 読み込み直後に高さが0になる環境があるので、その場合は取り直す
  const getVh = () => innerHeight || document.documentElement.clientHeight || 800;
  let vh = getVh(), lastW = innerWidth, started = false;
  let cur = -1, arrived = -1, fullShown = false, curOpen = 1;
  // 扉が開いている間は3.5秒ごとに写真を送る
  setInterval(() => {
    const f = floors[cur];
    if (!started || !f || curOpen < .95 || !f.slideEls) return;
    const v = f.slideEls[f.slideIdx].video;
    if (v && !v.ended && !v.paused) return; // 動画は最後まで見せてから次へ
    if (Date.now() - (f.lastSlide || 0) > 4200) nextSlide(f);
  }, 500);

  function layout() {
    vh = getVh();
    spacer.style.height = ((N - 1) * SEG * vh + vh) + 'px';
    spacer.querySelectorAll('.snap').forEach((s) => s.remove());
    for (let k = 0; k < N; k++) {
      const m = el('div', 'snap'); m.style.top = (k * SEG * vh) + 'px'; spacer.append(m);
    }
  }
  const ease = (x) => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  function update() {
    if (!vh) layout();
    const u = Math.max(0, scrollY / (SEG * vh)) + .5;
    let i = Math.floor(u), t = u - i;
    if (i >= N - 1) { i = N - 1; t = Math.min(t, .5); }
    // t: 0〜.15 到着中 / .15〜.3 ドア開く / .3〜.7 開いてる / .7〜.85 閉まる / .85〜1 移動
    let open = t < .15 ? 0 : t < .3 ? (t - .15) / .15 : t < .7 ? 1 : t < .85 ? 1 - (t - .7) / .15 : 0;
    if (i === N - 1 && t >= .3) open = 1;
    const moving = open === 0;
    frame.style.setProperty('--open', ease(open).toFixed(3));
    curOpen = open;
    car.classList.toggle('moving', moving && started);
    arrow.classList.toggle('on', moving);
    peek?.classList.toggle('show', moving && i % 3 === 1);

    if (i !== cur) {
      if (cur >= 0) { floors[cur].el.classList.remove('on'); floors[cur].btn.classList.remove('lit'); }
      floors[i].el.classList.add('on'); floors[i].btn.classList.add('lit');
      floorNum.textContent = floors[i].num; floorLabel.textContent = floors[i].label;
      cur = i;
    }
    setRiders(Math.min(i + 1, SLOTS.length));

    if (open > .6 && arrived !== i) { arrived = i; if (started) onArrive(floors[i]); }
    if (open === 0) arrived = -1;
    if (scrollY > vh * .3) hint.classList.add('hide');
  }

  function onArrive(f) {
    ding();
    floors.forEach((g) => { if (g !== f) pauseAll(g); });
    if (f.slideEls) playCurrent(f);
    navigator.vibrate?.(30);
    const ind = $('#indicator'); ind.classList.remove('flash'); void ind.offsetWidth; ind.classList.add('flash');
    if (f.type === 'bday') toast('最上階、おたんじょうび会場です');
    else if (riders.length >= 10 && !fullShown) { fullShown = true; toast('ブーッ！ 定員オーバーです…\nでも今日は特別にOK'); }
    else if (f.toast) toast(f.toast);
  }

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });
  addEventListener('resize', () => {
    if (innerWidth === lastW) return; // iOSのアドレスバー伸縮では再計算しない
    lastW = innerWidth; layout(); update();
  });

  // ---------- ろうそく ----------
  const bdayEl = floors[N - 1].el;
  let blown = 0, celebrated = false, micStream = null;
  function blowOut(c) {
    if (c.classList.contains('out') || celebrated) return;
    c.classList.add('out'); blown++; boop();
    if (blown >= C.candles) setTimeout(celebrate, 500);
  }
  const blowNext = () => { const c = bdayEl.querySelector('.candle:not(.out)'); if (c) blowOut(c); };

  async function startMic() {
    if (micStream) return;
    ensureAudio();
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
      const an = actx.createAnalyser(); an.fftSize = 1024;
      actx.createMediaStreamSource(micStream).connect(an);
      const buf = new Float32Array(an.fftSize);
      let loud = 0, cool = 0;
      if (!muted) Music.setVolume(.3); // 自分のBGMをマイクが拾わないように
      $('#blowBtn').textContent = 'ふーっ！ 🌬️';
      const loop = () => {
        if (celebrated) { micStream.getTracks().forEach((tr) => tr.stop()); return; }
        an.getFloatTimeDomainData(buf);
        let sum = 0; for (const v of buf) sum += v * v;
        const rms = Math.sqrt(sum / buf.length);
        if (cool > 0) cool--;
        else if (rms > .12) { if (++loud > 4) { blowNext(); loud = 0; cool = 12; } }
        else loud = Math.max(0, loud - 1);
        requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      micStream = null;
      toast('マイクが使えないみたい…\nろうそくをタップして消してね');
    }
  }
  $('#blowBtn').addEventListener('click', startMic);

  function celebrate() {
    if (celebrated) return;
    celebrated = true;
    if (!muted) Music.setVolume(1);
    fanfare();
    setTimeout(() => Music.birthday(), 900);
    car.classList.add('party');
    bdayEl.querySelector('.blow').hidden = true;
    $('#letterBtn').hidden = false;
    toast(C.herName + '\nお誕生日おめでとう！');
    burst();
  }
  function burst() {
    const fx = $('#fx');
    const colors = ['#f0d79a', '#c9a45c', '#fff', '#f4b6c8', '#e98aa8', '#fff3d6'];
    for (let k = 0; k < 90; k++) {
      const c = el('i', 'cf');
      c.style.cssText = `left:${Math.random() * 100}vw;background:${colors[k % colors.length]};animation-duration:${2.5 + Math.random() * 2.5}s;animation-delay:${Math.random() * .8}s;--r:${(Math.random() - .5) * 1440}deg`;
      fx.append(c);
    }
    // ちみたんの雨
    for (let k = 0; k < 18; k++) {
      const r = chimiImg('rain');
      r.style.cssText = `left:${Math.random() * 90}vw;width:${40 + Math.random() * 40}px;animation-duration:${3 + Math.random() * 3}s;animation-delay:${Math.random() * 2}s;--r:${(Math.random() - .5) * 720}deg`;
      fx.append(r);
    }
    setTimeout(() => { fx.innerHTML = ''; }, 9000);
  }

  // ---------- 手紙 ----------
  const collage = $('#collage');
  floors.filter((f) => f.type === 'month').forEach((f) => {
    const hue = (f.month * 29 + 330) % 360;
    if (f.list.length) f.list.forEach((src) => collage.append(photoImg(src, f.month + '月', hue)));
    else collage.append(chimiImg());
  });
  $('#letterBody').textContent = C.letter;
  $('#letterFrom').textContent = C.fromName;
  $('#letterBtn').addEventListener('click', () => { $('#letter').hidden = false; ding(); });
  $('#closeLetter').addEventListener('click', () => { $('#letter').hidden = true; });

  // 手紙の追伸 → 動画（流れている間はBGMを止める）
  if (C.finale) {
    const movie = $('#movie'), mv = $('#movieVideo'), mEnd = $('#movieEnd');
    mv.src = asset(C.finale);
    $('#letterPs').hidden = false;
    const play = () => { mEnd.hidden = true; mv.currentTime = 0; mv.play().catch(() => {}); };
    $('#openMovie').addEventListener('click', () => {
      Music.setVolume(0);
      $('#letter').hidden = true;
      movie.hidden = false;
      play();
    });
    mv.addEventListener('ended', () => { mEnd.hidden = false; });
    $('#movieAgain').addEventListener('click', play);
    $('#movieClose').addEventListener('click', () => {
      mv.pause(); movie.hidden = true; $('#letter').hidden = false;
      if (!muted) Music.setVolume(1);
    });
  }

  // ---------- 入口（カウントダウン・合言葉） ----------
  $('#gateName').textContent = C.herName;
  const openAt = C.openAt ? new Date(C.openAt).getTime() : 0;
  const pass = $('#pass');
  if (C.passphrase) pass.hidden = false;
  function tick() {
    const d = openAt - Date.now();
    if (d <= 0 || PREVIEW) { $('#countdown').hidden = true; $('#enterBox').hidden = false; return true; }
    const s = Math.floor(d / 1000), p = (n) => String(n).padStart(2, '0');
    $('#countdown').innerHTML = `${C.bdayLabel} 0:00 にドアがひらきます<br>あと<b>${Math.floor(s / 86400)}</b>日<b>${p(Math.floor(s / 3600) % 24)}</b>:<b>${p(Math.floor(s / 60) % 60)}</b>:<b>${p(s % 60)}</b>`;
    return false;
  }
  if (!tick()) { const id = setInterval(() => { if (tick()) clearInterval(id); }, 1000); }

  $('#enter').addEventListener('click', () => {
    if (C.passphrase && pass.value.trim() !== C.passphrase) {
      pass.classList.remove('ng'); void pass.offsetWidth; pass.classList.add('ng');
      pass.value = ''; pass.placeholder = 'ちがうみたい…';
      return;
    }
    ensureAudio();
    if (actx) Music.start(actx);
    document.documentElement.classList.add('started');
    started = true;
    scrollTo(0, 0);
    $('#gate').classList.add('bye');
    setTimeout(() => $('#gate').remove(), 900);
    ding();
    update();
  });

  layout();
  update();
})();
