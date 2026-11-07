// オリジナルBGM：オルゴール風のワルツをブラウザ内で自動演奏する（音源ファイル不要・著作権フリー）
// ケーキのろうそくを消すと「Happy Birthday to You」（パブリックドメイン）に切り替わる
window.Music = (() => {
  let ctx, master, dry, timer, loopGain = null, nextT = 0, loopN = 0, mode = 'loop', vol = 1;
  const BPM = 92, B = 60 / BPM; // 1拍の秒数
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init(c) {
    ctx = c;
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    // 簡易リバーブ（ホールっぽい響き）
    const rev = ctx.createConvolver(), len = ctx.sampleRate * 2.4;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    rev.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = .38;
    dry = ctx.createGain();
    dry.connect(master); dry.connect(rev); rev.connect(wet).connect(master);
  }

  // オルゴールの音（倍音つきサイン波が減衰）
  function bell(dest, m, t, v, dur = 2) {
    [[1, 1], [2, .25], [3.01, .08], [4.2, .03]].forEach(([h, a]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = mtof(m) * h;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v * a, t + .004);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur / Math.sqrt(h));
      o.connect(g).connect(dest); o.start(t); o.stop(t + dur + .1);
    });
  }
  // やわらかい伴奏音
  function soft(dest, m, t, v, dur = 1.2, type = 'sine') {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = mtof(m);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + .03);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur + .1);
  }

  // ---- 曲データ（ヘ長調・3拍子・16小節） ----
  // メロディ：[MIDI番号, 拍数]、0は休符
  const MEL = [
    [69, 1], [72, 1], [77, 1],   [76, 2], [74, 1],   [74, 1], [72, 1], [69, 1],   [67, 3],
    [65, 1], [67, 1], [69, 1],   [72, 2], [69, 1],   [70, 1], [69, 1], [67, 1],   [72, 3],
    [69, 1], [72, 1], [77, 1],   [79, 2], [76, 1],   [77, 1], [76, 1], [74, 1],   [74, 2], [72, 1],
    [70, 1], [74, 1], [77, 1],   [76, 2], [79, 1],   [77, 3],                     [0, 3],
  ];
  // 小節ごとのコード：[ベース, [和音]]
  const F = [41, [53, 57, 60]], Am = [40, [52, 57, 60]], Dm = [38, [50, 53, 57]], Cc = [36, [48, 52, 55]];
  const Bb = [34, [46, 50, 53]], FA = [33, [48, 53, 57]], Gm = [43, [50, 55, 58]], C7 = [36, [46, 52, 55]];
  const CH = [F, Am, Dm, Cc, Bb, FA, Gm, C7, F, Am, Dm, Bb, Gm, C7, F, F];
  const LOOP = 16 * 3 * B;

  function scheduleLoop(t0, n) {
    const g = ctx.createGain(); g.connect(dry); loopGain = g;
    const up = n % 2 === 1 ? 12 : 0; // 2周目はメロディを1オクターブ上で
    let beat = 0;
    MEL.forEach(([m, d]) => { if (m) bell(g, m + up, t0 + beat * B, up ? .07 : .1, 2.4); beat += d; });
    CH.forEach(([bass, tri], bar) => {
      const tb = t0 + bar * 3 * B;
      soft(g, bass, tb, .09, 1.6, 'triangle');                // 1拍目：ベース
      tri.forEach((m) => { soft(g, m, tb + B, .025, .9); soft(g, m, tb + 2 * B, .02, .9); }); // 2・3拍目：和音
      if (n % 2 === 1) tri.forEach((m, k) => bell(g, m + 12, tb + (k * .5 + .5) * B, .025, 1.2)); // 2周目はきらきら分散和音
    });
  }

  // Happy Birthday to You（パブリックドメイン）ヘ長調
  const HB = [
    [72, .75], [72, .25], [74, 1], [72, 1], [77, 1], [76, 2],
    [72, .75], [72, .25], [74, 1], [72, 1], [79, 1], [77, 2],
    [72, .75], [72, .25], [84, 1], [81, 1], [77, 1], [76, 1], [74, 1],
    [82, .75], [82, .25], [81, 1], [77, 1], [79, 1], [77, 3],
  ];
  const HB_CH = [[0, F], [1, F], [3, Cc], [6, C7], [9, F], [12, F], [15, Bb], [18, F], [21, C7], [24, F]]; // [拍, コード]
  function scheduleHB(t0) {
    const g = ctx.createGain(); g.connect(dry); loopGain = g;
    let beat = 0;
    HB.forEach(([m, d]) => { bell(g, m, t0 + beat * B * 1.1, .13, 2.6); beat += d; });
    HB_CH.forEach(([b, [bass, tri]]) => {
      const t = t0 + b * B * 1.1;
      soft(g, bass, t, .1, 2, 'triangle');
      tri.forEach((m, k) => bell(g, m + 12, t + k * .08, .03, 2));
    });
    return t0 + beat * B * 1.1;
  }

  function tick() {
    if (mode !== 'loop') return;
    if (ctx.currentTime > nextT - 1.5) { scheduleLoop(nextT, loopN++); nextT += LOOP; }
  }
  function applyVol() { if (master) master.gain.setTargetAtTime(1.4 * vol, ctx.currentTime, .4); }

  return {
    start(c) {
      if (ctx) return;
      init(c);
      nextT = ctx.currentTime + .4;
      tick(); timer = setInterval(tick, 250);
      applyVol();
    },
    setVolume(v) { vol = v; applyVol(); },
    birthday() {
      if (!ctx) return;
      mode = 'hb';
      loopGain?.gain.setTargetAtTime(0, ctx.currentTime, .15); // いまのループを止める
      const end = scheduleHB(ctx.currentTime + .6);
      setTimeout(() => { nextT = end + 1.2; loopN = 0; mode = 'loop'; }, (end - ctx.currentTime) * 1000);
    },
  };
})();
