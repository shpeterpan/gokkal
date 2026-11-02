// 고깔 셋: 웹(GitHub Pages)과 앱(Capacitor, 광고 포함)이 같은 번들을 쓴다.
import * as THREE from 'three';
import qrcode from 'qrcode-generator';
import '@fontsource/black-han-sans';
import './style.css';
import { Capacitor } from '@capacitor/core';
import { ads, startAds } from './ads/ads.ts';
import { startPurchases, purchasesAvailable, isAdFree, onAdFree, removeAdsPrice, buyRemoveAds, restoreRemoveAds } from './ads/purchase.ts';

const TAU = Math.PI * 2;
const R = 15, BASE_D = 12.5, BASE_R = 1.8, PR = 0.45;
const GRAB_R = 1.7;   // 봇이 손을 뻗는 거리
const TOUCH_R = 1.2;  // 사람은 고깔에 닿으면 저절로 집는다
const SPEED = 5.2, BOT_SPEED = 4.3, SNAP = Math.PI / 6;
const CONES = 5, NEED = 3, HOLD = 1;
const COLORS = [0x2F6FD6, 0x1F9A5F, 0xE3AE0E, 0xC8377A, 0x2B3138, 0x1597B8];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

const STR = {
  ko: {
    title: '고깔 셋',
    rule: '가운데 고깔 다섯 개 중 셋을 내 자리로 옮겨 1초 버티면 이겨요. ◀ ▶로 가져올 곳을 한 칸씩 고르고 가져오기를 누르면, 달려가 집어서 내 자리로 돌아와요. 남의 자리 고깔도 가져올 수 있어요.',
    view: '시점', first: '1인칭', third: '3인칭', players: '인원 (혼자 할 때)', n: '{n}명',
    six: '6명은 3인칭으로만 해요.', auto: '기기 설정 따름',
    keys: '키보드: ← → 고르기, 스페이스 가져오기',
    solo: '혼자 하기', together: '같이 하기', start: '시작',
    me: '나', botName: '{c} 봇', home: '내 자리로',
    colors: ['파랑', '초록', '노랑', '분홍', '검정', '하늘'],
    left: '왼쪽 칸', right: '오른쪽 칸', grab: '가져오기', center: '가운데', spot: '{c} 자리', cnt: '{n}개', cnt1: '1개', carrying: '내 자리로 가는 중',
    stole: '{who} 내 고깔을 가져갔어요', holdOther: '{who} 셋을 모았어요', holdMe: '셋! 1초만 버텨요',
    win: '이겼어요!', lose: '{who} 먼저 모았어요', time: '{s}초 걸렸어요', go: '출발',
    again: '다시 하기', menu: '처음으로', toLobby: '방으로', leave: '나가기',
    create: '방 만들기', scanJoin: 'QR 찍고 들어가기', back: '뒤로', cancel: '취소',
    togetherNote: '한 사람이 방을 만들고, 다른 사람은 방장 화면의 QR을 휴대폰 카메라로 찍어 들어와요. 같은 와이파이나 방장 핫스팟에 있으면 잘 이어져요.',
    invite: '친구 부르기', scanFriend: '친구 QR 찍기', making: 'QR을 만드는 중이에요',
    inviteNote: '친구가 휴대폰 카메라로 이 QR을 찍으면 게임이 열려요. 친구 화면에 QR이 뜨면 아래 단추로 찍어 주세요.',
    connecting: '잇는 중이에요. 잠깐만 기다려 주세요.',
    noCam: '카메라가 없으면 친구 화면의 글자를 붙여 넣어요', paste: '넣기',
    showHost: '방장에게 보여 주세요', showHostNote: '방장이 이 QR을 찍으면 들어가요.',
    hostNoCam: '방장 화면에 카메라가 없으면 글자를 보내 주세요', copy: '복사', copied: '복사했어요',
    scanHint: 'QR을 네모 안에 맞춰 주세요',
    people: '들어온 사람', host: '{c} (방장)',
    fill: '3명이 안 되면 봇이 채워요.', waitHost: '방장이 시작하면 바로 시작해요.', waitAgain: '방장이 다시 시작하면 이어서 해요.',
    gone: '{who} 나갔어요. 봇이 이어서 해요.',
    errCam: '카메라를 열지 못했어요. 브라우저 설정에서 카메라를 허용해 주세요.',
    errQr: '이 게임의 QR이 아니에요. 방장 화면의 QR을 다시 찍어 주세요.',
    errOld: '이 QR은 지금 부르는 친구 것이 아니에요. 친구 부르기를 다시 눌러 주세요.',
    errFail: '연결하지 못했어요. 같은 와이파이나 방장 핫스팟에 있는지 확인하고 다시 해 주세요.',
    errStarted: '이미 시작한 판이에요. 판이 끝나고 방장이 다시 불러 주면 들어와 주세요.',
    errClosed: '방장과 연결이 끊겼어요.',
    settings: '설정', done: '완료', sound: '소리', haptic: '진동', theme: '화면 밝기', light: '밝게', dark: '어둡게',
    removeAds: '광고 없애기', removeAdsPrice: '광고 없애기 {p}', restore: '구매 복원', adFreeDone: '광고를 없앴어요.',
    buyPending: '결제가 끝나면 광고가 사라져요.', buyFailed: '결제하지 못했어요. 잠시 뒤에 다시 해 주세요.',
    restoreNone: '이 계정으로 산 기록이 없어요.', restoreFailed: '스토어에 닿지 못했어요. 인터넷 연결을 확인해 주세요.',
    adPrivacy: '광고 개인정보 설정', privacy: '개인정보 처리방침',
    coach: '◀ ▶로 가져올 곳을 고르고 가져오기를 눌러요'
  },
  en: {
    title: 'Three Cones',
    rule: 'Five cones sit in the middle. Carry three to your spot and keep them there for 1 second. Pick a spot one step at a time with ◀ ▶, then tap Grab to run over, pick one up and bring it home. You can take cones from other spots too.',
    view: 'View', first: 'First person', third: 'Third person', players: 'Players (solo)', n: '{n}',
    six: 'Six players play in third person only.', auto: 'Device setting',
    keys: 'Keyboard: ← → pick a spot, Space grab',
    solo: 'Play solo', together: 'Play together', start: 'Start',
    me: 'You', botName: '{c} bot', home: 'Go home',
    colors: ['Blue', 'Green', 'Yellow', 'Pink', 'Black', 'Sky'],
    left: 'Previous spot', right: 'Next spot', grab: 'Grab', center: 'Middle', spot: "{c}'s spot", cnt: '{n} cones', cnt1: '1 cone', carrying: 'Heading home',
    stole: '{who} took your cone', holdOther: '{who} has three', holdMe: 'Three! Hold on for 1 second',
    win: 'You won!', lose: '{who} got there first', time: '{s} seconds', go: 'Go',
    again: 'Play again', menu: 'Menu', toLobby: 'Back to room', leave: 'Leave',
    create: 'Make a room', scanJoin: 'Scan QR to join', back: 'Back', cancel: 'Cancel',
    togetherNote: "One person makes a room. Everyone else scans the host's QR with their phone camera. It connects best on the same Wi-Fi or the host's hotspot.",
    invite: 'Invite a friend', scanFriend: "Scan friend's QR", making: 'Making the QR',
    inviteNote: "Your friend scans this QR with their phone camera to open the game. When a QR shows on their screen, scan it with the button below.",
    connecting: 'Connecting. Hang on a moment.',
    noCam: "No camera? Paste the text from your friend's screen", paste: 'Paste',
    showHost: 'Show this to the host', showHostNote: 'You join when the host scans this QR.',
    hostNoCam: "Host has no camera? Send them this text", copy: 'Copy', copied: 'Copied',
    scanHint: 'Fit the QR inside the square',
    people: 'In the room', host: '{c} (host)',
    fill: 'Bots fill in up to 3 players.', waitHost: 'The game starts when the host starts it.', waitAgain: 'You keep playing when the host starts again.',
    gone: '{who} left. A bot takes over.',
    errCam: "Couldn't open the camera. Allow camera access in your browser settings.",
    errQr: "That isn't a QR from this game. Scan the host's QR again.",
    errOld: "That QR is for a different invite. Tap Invite a friend again.",
    errFail: "Couldn't connect. Check that you're on the same Wi-Fi or the host's hotspot, then try again.",
    errStarted: 'That game already started. Join when the host invites you after it ends.',
    errClosed: 'Lost the connection to the host.',
    settings: 'Settings', done: 'Done', sound: 'Sound', haptic: 'Vibration', theme: 'Appearance', light: 'Light', dark: 'Dark',
    removeAds: 'Remove ads', removeAdsPrice: 'Remove ads for {p}', restore: 'Restore purchase', adFreeDone: 'Ads are off.',
    buyPending: 'Ads go away once the payment completes.', buyFailed: "Couldn't complete the payment. Try again in a moment.",
    restoreNone: 'No purchase found for this account.', restoreFailed: "Couldn't reach the store. Check your internet connection.",
    adPrivacy: 'Ad privacy choices', privacy: 'Privacy policy',
    coach: 'Pick a spot with ◀ ▶, then tap Grab'
  }
};

const S = { view: 'first', count: 3, lang: 'auto', sound: true, haptic: true, theme: 'auto' };
try { Object.assign(S, JSON.parse(localStorage.getItem('gokkal-set') || '{}')); } catch (e) {}
S.count = [3, 4, 5, 6].includes(+S.count) ? +S.count : 3;
if (!['first', 'third'].includes(S.view)) S.view = 'first';
if (!['auto', 'ko', 'en'].includes(S.lang)) S.lang = 'auto';
if (!['auto', 'light', 'dark'].includes(S.theme)) S.theme = 'auto';
S.sound = S.sound !== false; S.haptic = S.haptic !== false;
function save() { try { localStorage.setItem('gokkal-set', JSON.stringify(S)); } catch (e) {} }

let lang = 'ko';
function resolveLang() {
  const dev = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase();
  lang = S.lang === 'auto' ? (dev.startsWith('ko') ? 'ko' : 'en') : S.lang;
}
function t(k, v) {
  let s = STR[lang][k];
  if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]);
  return s;
}
// 받침이 있으면 a(이), 없으면 b(가). 숫자는 읽는 소리로.
function josa(w, a, b) {
  const ch = w[w.length - 1];
  if (/[0-9]/.test(ch)) return '013678'.includes(ch) ? a : b;
  const code = ch.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return b;
  return code % 28 ? a : b;
}
const subj = name => lang === 'ko' ? name + josa(name, '이', '가') : name;
const colorName = i => STR[lang].colors[i];
function nameOf(i) {
  if (i === G.me) return t('me');
  const p = G.players[i];
  return p && p.kind === 'bot' ? t('botName', { c: colorName(i) }) : colorName(i);
}
const numFmt = () => new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const hex = c => '#' + c.toString(16).padStart(6, '0');

/* ---------- 장면 ---------- */
const $ = id => document.getElementById(id);
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const SKY = 0xCFE3EC;
scene.background = new THREE.Color(SKY);
const fog = new THREE.Fog(SKY, 30, 80);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xffffff, 0x5d7a4c, 0.85));
const sun = new THREE.DirectionalLight(0xffffff, 0.75);
sun.position.set(12, 24, 8);
scene.add(sun);

const lam = c => new THREE.MeshLambertMaterial({ color: c });
const flat = m => { m.rotation.x = -Math.PI / 2; return m; };
scene.add(flat(new THREE.Mesh(new THREE.CircleGeometry(90, 48), lam(0x6E9A57))));
const field = flat(new THREE.Mesh(new THREE.CircleGeometry(R, 72), lam(0x5E9147)));
field.position.y = 0.01;
scene.add(field);
function flatRing(r0, r1, color, y) {
  const m = flat(new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96), new THREE.MeshBasicMaterial({ color })));
  m.position.y = y;
  return m;
}
scene.add(flatRing(R - 0.12, R, 0xF4F6F2, 0.02), flatRing(2.3, 2.42, 0xF4F6F2, 0.02));

// 방향을 잡을 수 있게 둘레에 나무, 한쪽에 학교 건물
let seed = 7;
const srnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const trunkG = new THREE.CylinderGeometry(0.18, 0.25, 1.4, 8), leafG = new THREE.ConeGeometry(1.3, 3.2, 10);
const trunkM = lam(0x6B4E36), leafMs = [lam(0x2F6B3A), lam(0x3C7D43), lam(0x285E36)];
for (let k = 0; k < 26; k++) {
  const a = k / 26 * TAU + srnd() * 0.2, d = 20 + srnd() * 12, s = 0.8 + srnd() * 0.9;
  if (Math.sin(a) < -0.75) continue;
  const g = new THREE.Group();
  const tr = new THREE.Mesh(trunkG, trunkM); tr.position.y = 0.7;
  const lf = new THREE.Mesh(leafG, leafMs[k % 3]); lf.position.y = 3;
  g.add(tr, lf); g.scale.setScalar(s); g.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
  scene.add(g);
}
const school = new THREE.Mesh(new THREE.BoxGeometry(34, 9, 6), lam(0xD9DEDA));
school.position.set(0, 4.5, -34);
scene.add(school);
const roof = new THREE.Mesh(new THREE.BoxGeometry(35, 0.6, 7), lam(0x8C9A93));
roof.position.set(0, 9.2, -34);
scene.add(roof);

// 고깔
const coneM = lam(0xF26B1D), whiteM = lam(0xF7F7F2);
const coneBaseG = new THREE.BoxGeometry(0.7, 0.06, 0.7);
const coneBodyG = new THREE.CylinderGeometry(0.05, 0.3, 0.85, 20);
const coneBandG = new THREE.CylinderGeometry(0.152, 0.192, 0.16, 20, 1, true);
function makeCone() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(coneBaseG, coneM); b.position.y = 0.03;
  const body = new THREE.Mesh(coneBodyG, coneM); body.position.y = 0.485;
  const band = new THREE.Mesh(coneBandG, whiteM); band.position.y = 0.535;
  g.add(b, body, band);
  return g;
}
// 가져올 곳으로 고른 칸 표시
const pick = flatRing(2.0, 2.25, 0xFFFFFF, 0.035);
pick.visible = false;
scene.add(pick);

// 사람
const bodyG = new THREE.CylinderGeometry(0.36, 0.42, 1.1, 20), headG = new THREE.SphereGeometry(0.3, 20, 14);
const noseG = new THREE.BoxGeometry(0.16, 0.1, 0.16), skinM = lam(0xF0D2B8), noseM = lam(0x2B3138);
const poleG = new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8), flagG = new THREE.BoxGeometry(0.9, 0.55, 0.04);
const poleM = lam(0xE8ECEA);
function makePlayer(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(bodyG, lam(color)); body.position.y = 0.55;
  const head = new THREE.Mesh(headG, skinM); head.position.y = 1.38;
  const nose = new THREE.Mesh(noseG, noseM); nose.position.set(0, 1.38, 0.3);
  g.add(body, head, nose);
  return g;
}

/* ---------- 상태 ---------- */
// role: solo(혼자) · host(방장, 판을 굴린다) · guest(손님, 내 몸만 움직이고 나머지는 방장이 보낸 대로)
const G = {
  state: 'menu', role: 'solo', me: 0, players: [], cones: [], world: null, view: 'first',
  time: 0, countT: 0, lastN: -1, goT: 0, winner: -1, orbit: 0.6, hudEls: [], auto: null, homeArmed: false,
  events: [], sendT: 0, resultTimer: 0
};
const input = { left: false, right: false, fwd: false, turnT: 0 };
const P = () => G.players;
const d2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const wrap = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const r2 = v => Math.round(v * 100) / 100;
const authority = () => G.role !== 'guest';
const isLocal = p => p.i === G.me || (authority() && p.kind === 'bot');

function buildWorld(n, humans) {
  if (G.world) scene.remove(G.world);
  const w = new THREE.Group();
  G.world = w; scene.add(w);
  G.players = []; G.cones = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI / 2 + i * TAU / n, bx = Math.cos(a) * BASE_D, bz = Math.sin(a) * BASE_D, col = COLORS[i];
    const disc = flat(new THREE.Mesh(new THREE.CircleGeometry(BASE_R, 40), new THREE.MeshLambertMaterial({ color: col, transparent: true, opacity: 0.5 })));
    disc.position.set(bx, 0.015, bz);
    const edge = flatRing(BASE_R - 0.12, BASE_R, col, 0.02); edge.position.x = bx; edge.position.z = bz;
    const pole = new THREE.Mesh(poleG, poleM);
    const ox = bx + Math.cos(a) * (BASE_R + 0.4), oz = bz + Math.sin(a) * (BASE_R + 0.4);
    pole.position.set(ox, 1.6, oz);
    const flag = new THREE.Mesh(flagG, lam(col)); flag.position.set(ox, 2.9, oz); flag.rotation.y = -a;
    flag.position.x += Math.sin(a) * 0.45; flag.position.z -= Math.cos(a) * 0.45;
    const ring = flat(new THREE.Mesh(new THREE.RingGeometry(BASE_R + 0.15, BASE_R + 0.45, 48, 1, Math.PI / 2, TAU), new THREE.MeshBasicMaterial({ color: 0xF26B1D })));
    ring.position.set(bx, 0.03, bz); ring.visible = false;
    const mesh = makePlayer(col);
    w.add(disc, edge, pole, flag, ring, mesh);
    const h = Math.atan2(-bx, -bz);
    const kind = i === G.me ? 'me' : humans.includes(i) ? 'human' : 'bot';
    G.players.push({
      i, kind, x: bx, z: bz, h, th: h, rx: bx, rz: bz, rh: h, carry: -1, hold: 0, tickT: 0,
      base: { x: bx, z: bz }, mesh, ring,
      speed: kind === 'bot' ? BOT_SPEED * (0.94 + Math.random() * 0.1) : SPEED,
      ai: { target: -1, think: Math.random() * 0.4, grabT: 0 }
    });
  }
  for (let k = 0; k < CONES; k++) {
    const a = k / CONES * TAU - Math.PI / 2, mesh = makeCone();
    w.add(mesh);
    G.cones.push({ i: k, x: Math.cos(a) * 0.9, z: Math.sin(a) * 0.9, owner: -1, carrier: -1, slot: -1, mesh });
  }
}

function counts() {
  const c = new Array(G.players.length).fill(0);
  for (const k of G.cones) if (k.owner >= 0) c[k.owner]++;
  return c;
}
const canTake = (p, c) => c.carrier < 0 && c.owner !== p.i;
function nearestTake(p, r) {
  let best = null, bd = r;
  for (const c of G.cones) {
    if (!canTake(p, c)) continue;
    const d = d2(p.x, p.z, c.x, c.z);
    if (d <= bd) { bd = d; best = c; }
  }
  return best;
}
const inBase = p => d2(p.x, p.z, p.base.x, p.base.z) < BASE_R;
function clamp(p) {
  const r = Math.hypot(p.x, p.z), m = R - 0.4;
  if (r > m) { p.x *= m / r; p.z *= m / r; }
}
function move(p, d) { p.x += Math.sin(p.h) * d; p.z += Math.cos(p.h) * d; clamp(p); }

/* ---------- 판 굴리기 (혼자·방장만) ---------- */
function emit(e) {
  handleEvent(e);
  if (G.role === 'host') G.events.push(e);
}
function grab(p, c) {
  const from = c.owner;
  c.owner = -1; c.slot = -1; c.carrier = p.i; p.carry = c.i;
  emit({ e: 'grab', who: p.i });
  if (from >= 0) emit({ e: 'stole', by: p.i, from });
}
function deposit(p) {
  const c = G.cones[p.carry];
  const used = new Set(G.cones.filter(k => k.owner === p.i).map(k => k.slot));
  let s = 0;
  while (used.has(s)) s++;
  const a = s / CONES * TAU + Math.atan2(p.base.z, p.base.x);
  c.x = p.base.x + Math.cos(a) * 0.85; c.z = p.base.z + Math.sin(a) * 0.85;
  c.owner = p.i; c.slot = s; c.carrier = -1; p.carry = -1;
  emit({ e: 'dep', who: p.i });
}

// 봇: 가까운 것, 집에서 가까운 것, 많이 모은 사람 것을 먼저 노린다. 약간 흔들어서 셋이 똑같이 움직이지 않게.
function botThink(b) {
  b.ai.think = 0.35 + Math.random() * 0.4;
  if (b.carry >= 0) { b.ai.target = -1; return; }
  const cnt = counts();
  let best = -1, bc = Infinity;
  for (const c of G.cones) {
    if (!canTake(b, c)) continue;
    let cost = d2(b.x, b.z, c.x, c.z) + d2(c.x, c.z, b.base.x, b.base.z) * 0.5;
    if (c.owner >= 0) cost += 4 - cnt[c.owner] * 2.5;
    cost += (Math.random() - 0.5) * 2.4;
    if (c.i === b.ai.target) cost -= 1.5;
    if (cost < bc) { bc = cost; best = c.i; }
  }
  b.ai.target = best;
}
function botUpdate(b, dt) {
  b.ai.think -= dt;
  const tc = b.ai.target >= 0 ? G.cones[b.ai.target] : null;
  if (b.ai.think <= 0 || (b.carry < 0 && (!tc || !canTake(b, tc)))) botThink(b);
  let tx = b.base.x, tz = b.base.z;
  if (b.carry < 0 && b.ai.target >= 0) { tx = G.cones[b.ai.target].x; tz = G.cones[b.ai.target].z; }
  const dist = d2(b.x, b.z, tx, tz);
  const diff = wrap(Math.atan2(tx - b.x, tz - b.z) - b.h);
  const tr = 5 * dt;
  b.h += Math.max(-tr, Math.min(tr, diff)); b.th = b.h;
  if (dist > (b.carry >= 0 ? 0.3 : 0.5)) move(b, b.speed * dt * (Math.abs(diff) < 0.9 ? 1 : 0.35));
  if (b.carry < 0 && b.ai.target >= 0 && dist < GRAB_R * 0.85) {
    b.ai.grabT += dt;
    if (b.ai.grabT > 0.15) { const c = nearestTake(b, GRAB_R); if (c) grab(b, c); b.ai.grabT = 0; }
  } else b.ai.grabT = 0;
}
// 사람은 각자 자기 몸을 움직이니 봇만 밀어낸다
function separateBots() {
  const L = G.players;
  for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) {
    const A = L[a], B = L[b];
    if (A.kind !== 'bot' && B.kind !== 'bot') continue;
    const dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz);
    if (d < 1e-4 || d >= PR * 2) continue;
    const push = PR * 2 - d, nx = dx / d, nz = dz / d;
    const wa = A.kind === 'bot' ? (B.kind === 'bot' ? 0.5 : 1) : 0, wb = 1 - wa;
    A.x -= nx * push * wa; A.z -= nz * push * wa; B.x += nx * push * wb; B.z += nz * push * wb;
    clamp(A); clamp(B);
  }
}
function simulate(dt) {
  G.time += dt;
  for (const p of G.players) if (p.kind === 'bot') botUpdate(p, dt);
  separateBots();
  for (const p of G.players) {
    if (p.kind !== 'bot' && p.carry < 0) { const c = nearestTake(p, TOUCH_R); if (c) grab(p, c); }
  }
  for (const p of G.players) if (p.carry >= 0 && inBase(p)) deposit(p);
  const cnt = counts();
  for (const p of G.players) {
    if (cnt[p.i] >= NEED) {
      if (p.hold === 0) emit({ e: 'hold', who: p.i });
      p.hold += dt;
      if (p.hold >= HOLD) { p.hold = HOLD; G.winner = p.i; setState('over'); return; }
    } else p.hold = 0;
  }
}

/* ---------- 내 몸 (모두) ---------- */
// 가져올 곳: 가운데('c')와 다른 사람 자리(번호). ◀ ▶가 한 칸씩 옮기고, 가만히 있을 땐 그쪽을 바라본다.
function spotPos(key) {
  if (key === 'c') return { x: 0, z: 0 };
  const p = G.players[key];
  return p ? p.base : null;
}
const spotOf = c => (c.owner >= 0 ? c.owner : 'c');
const spotName = key => (key === 'c' ? t('center') : t('spot', { c: colorName(key) }));
function conesAt(key) {
  const me = G.players[G.me];
  return G.cones.filter(c => canTake(me, c) && spotOf(c) === key);
}
function nearestAt(key) {
  const me = G.players[G.me];
  let best = null, bd = Infinity;
  for (const c of conesAt(key)) { const d = d2(me.x, me.z, c.x, c.z); if (d < bd) { bd = d; best = c; } }
  return best;
}
function stepSpot(dir) {
  if ((G.state !== 'play' && G.state !== 'count') || !G.players.length) return;
  const me = G.players[G.me];
  const ang = k => { const s = spotPos(k); return Math.atan2(s.x - me.x, s.z - me.z); };
  const cur = ang(G.sel);
  // 왼쪽(dir 1)은 지금 고른 곳에서 시계 반대쪽으로 가장 가까운 칸, 끝이면 반대편 끝으로 돈다
  let best = null, bd = Infinity;
  for (const k of ['c', ...G.players.filter(p => p.i !== G.me).map(p => p.i)]) {
    if (k === G.sel) continue;
    let d = wrap(ang(k) - cur) * dir;
    if (d <= 1e-6) d += TAU;
    if (d < bd) { bd = d; best = k; }
  }
  if (best === null) return;
  G.sel = best;
  if (me.carry < 0) G.auto = null;
  sfx.select();
}
function meUpdate(dt) {
  const me = G.players[G.me];
  // 집으면 알아서 내 자리로 돌아간다
  if (me.carry >= 0 && !G.homeArmed) { G.homeArmed = true; G.auto = { home: true }; }
  if (me.carry < 0) G.homeArmed = false;
  let tx = null, tz = 0;
  const a = G.auto;
  if (a && (a.home || me.carry >= 0)) {
    if (me.carry < 0 && inBase(me)) G.auto = null;
    else { tx = me.base.x; tz = me.base.z; }
  } else if (a) {
    let c = G.cones[a.cone];
    // 누가 먼저 집어 가면 같은 곳의 다른 고깔로
    if (!c || !canTake(me, c)) { c = nearestAt(G.sel); if (c) a.cone = c.i; }
    if (c && canTake(me, c)) { tx = c.x; tz = c.z; } else G.auto = null;
  }
  if (tx !== null) {
    if (d2(me.x, me.z, tx, tz) < 0.4) return;
    const diff = wrap(Math.atan2(tx - me.x, tz - me.z) - me.h), tr = 7 * dt;
    me.h += Math.max(-tr, Math.min(tr, diff)); me.th = me.h;
    move(me, SPEED * dt * (Math.abs(diff) < 0.8 ? 1 : 0.4));
    return;
  }
  // 가만히 있을 땐 고른 곳을 바라본다
  const s = spotPos(G.sel);
  if (s && d2(me.x, me.z, s.x, s.z) > 0.8) {
    const diff = wrap(Math.atan2(s.x - me.x, s.z - me.z) - me.h), tr = (reduce.matches ? 100 : 8) * dt;
    me.h += Math.max(-tr, Math.min(tr, diff)); me.th = me.h;
  }
}
function act() {
  if (G.state !== 'play') return;
  const me = G.players[G.me];
  if (me.carry >= 0) return;
  const c = nearestAt(G.sel);
  if (c) { G.auto = { cone: c.i }; coachOff(); }
}

/* ---------- 흐름 ---------- */
function setState(st) {
  G.state = st;
  if (st === 'count') {
    hidePanels();
    $('hud').hidden = false; $('controls').hidden = false; $('homeBtn').hidden = false;
    $('compass').style.display = G.view === 'first' ? '' : 'none';
    G.lastN = -1;
  } else if (st === 'play') {
    G.goT = 0.6; showCount(t('go')); sfx.count(0); coachOn();
  } else if (st === 'over') {
    G.auto = null;
    coachOff();
    $('controls').hidden = true; $('homeBtn').hidden = true;
    if (G.winner === G.me) { sfx.win(); buzz('win'); } else sfx.lose();
    clearTimeout(G.resultTimer);
    G.resultTimer = setTimeout(showResult, 800);
  } else {
    // menu · lobby
    clearTimeout(G.resultTimer);
    ['hud', 'controls', 'homeBtn', 'result', 'count', 'toast'].forEach(id => { $(id).hidden = true; });
  }
}
function hidePanels() { ['menu', 'joinPanel', 'answerPanel', 'lobby', 'result'].forEach(id => { $(id).hidden = true; }); }

function update(dt) {
  if (G.state === 'menu' || G.state === 'lobby') {
    if (!reduce.matches) G.orbit += dt * 0.08;
    net.tick(dt);
    return;
  }
  if (G.state === 'count') {
    if (authority()) { G.countT -= dt; if (G.countT <= 0) setState('play'); }
    const n = Math.ceil(G.countT);
    if (G.state === 'count' && n !== G.lastN && n > 0) { G.lastN = n; showCount(String(n)); sfx.count(n); }
  }
  if (G.goT > 0) { G.goT -= dt; if (G.goT <= 0) $('count').hidden = true; }
  if (G.state === 'play') {
    meUpdate(dt);
    if (authority()) simulate(dt);
  }
  // 셋을 모은 사람 쪽에서 똑딱 (방장이 보낸 값으로 손님도 같이 울린다)
  for (const p of G.players) {
    if (p.hold > 0 && G.state === 'play') { p.tickT -= dt; if (p.tickT <= 0) { p.tickT = 0.25; sfx.tick(p); } }
    else p.tickT = 0;
  }
  // 남이 움직이는 몸은 부드럽게 따라간다
  const k = Math.min(1, dt * 12);
  for (const p of G.players) {
    if (isLocal(p) || d2(p.rx, p.rz, p.x, p.z) > 4) { p.rx = p.x; p.rz = p.z; p.rh = p.h; }
    else { p.rx += (p.x - p.rx) * k; p.rz += (p.z - p.rz) * k; p.rh += wrap(p.h - p.rh) * k; }
  }
  net.tick(dt);
}

function beginMatch(n, humans, view) {
  G.view = view;
  buildWorld(n, humans);
  buildHud();
  Object.assign(input, { left: false, right: false, fwd: false, turnT: 0 });
  G.time = 0; G.countT = 3; G.lastN = -1; G.goT = 0; G.winner = -1; G.auto = null; G.homeArmed = false; G.events = []; G.sel = 'c'; G.gLabel = '';
  document.querySelectorAll('.ctl.on').forEach(el => el.classList.remove('on'));
  setState('count');
}
function startSolo() {
  audio();
  G.role = 'solo'; G.me = 0;
  beginMatch(S.count, [0], S.count >= 6 ? 'third' : S.view);
}
function startHosted() {
  audio();
  const humans = [0, ...net.peers.map((_, k) => k + 1)];
  const n = Math.max(3, humans.length);
  const view = n >= 6 ? 'third' : S.view;
  net.map = {};
  net.peers.forEach((slot, k) => { net.map[slot.id] = k + 1; });
  G.me = 0;
  beginMatch(n, humans, view);
  net.broadcast({ k: 'start', n, view, humans, map: net.map });
}
function showResult() {
  if (G.state !== 'over') return;
  const w = G.winner;
  $('resT').textContent = w === G.me ? t('win') : t('lose', { who: subj(nameOf(w)) });
  $('resS').textContent = t('time', { s: numFmt().format(G.time) });
  $('again').hidden = G.role === 'guest';
  $('toMenu').hidden = G.role !== 'solo';
  $('toLobby').hidden = G.role !== 'host';
  $('resLeave').hidden = G.role !== 'guest';
  $('resWait').hidden = G.role !== 'guest';
  $('result').hidden = false;
}
function toMenu(err) {
  G.role = 'solo'; G.me = 0;
  setState('menu');
  hidePanels();
  buildWorld(S.count, [0]);
  const e = $('menuErr');
  e.textContent = err || ''; e.hidden = !err;
  $('menu').hidden = false;
}

/* ---------- 화면 맞추기 ---------- */
function fitDist(r, aspect, vfov) {
  const v = vfov * Math.PI / 180, h = 2 * Math.atan(Math.tan(v / 2) * aspect);
  return r / Math.sin(Math.min(v, h) / 2);
}
function placeCamera() {
  const aspect = camera.aspect, overview = G.state === 'menu' || G.state === 'lobby';
  // 안개는 1인칭에서만. 내려다보는 시점은 멀리서 보니 안개에 판이 묻힌다
  scene.fog = !overview && G.view === 'first' ? fog : null;
  if (overview) {
    camera.fov = 45;
    const D = fitDist(R + 2, aspect, 45), el = 0.95, a = G.orbit;
    camera.position.set(Math.sin(a) * Math.cos(el) * D, Math.sin(el) * D, Math.cos(a) * Math.cos(el) * D);
    camera.lookAt(0, 0, 0);
    // 세로 화면에선 아래 판이 가리니 운동장을 위쪽 빈 곳으로 올린다
    if (aspect < 0.8) camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.26, innerWidth, innerHeight);
    else camera.clearViewOffset();
  } else if (G.view === 'first') {
    camera.clearViewOffset();
    const me = G.players[G.me];
    camera.fov = aspect < 1 ? 80 : 70;
    camera.position.set(me.x, 1.55, me.z);
    // 세로 화면은 하늘이 반을 먹으니 고개를 조금 더 숙인다
    camera.lookAt(me.x + Math.sin(me.h) * 10, aspect < 1 ? -0.4 : 0.9, me.z + Math.cos(me.h) * 10);
  } else {
    camera.clearViewOffset();
    camera.fov = 45;
    const D = fitDist(R + 1, aspect, 45), el = 1.0;
    camera.position.set(0, Math.sin(el) * D, Math.cos(el) * D);
    camera.lookAt(0, 0, 0);
  }
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}
const hand = new THREE.Vector3();
function sync() {
  const fp = G.view === 'first' && G.state !== 'menu' && G.state !== 'lobby';
  for (const p of G.players) {
    p.mesh.position.set(p.rx, 0, p.rz);
    p.mesh.rotation.y = p.rh;
    p.mesh.visible = !(fp && p.i === G.me);
    p.ring.visible = p.hold > 0;
    if (p.hold > 0) p.ring.geometry.setDrawRange(0, 6 * Math.max(1, Math.round(48 * Math.min(1, p.hold / HOLD))));
  }
  for (const c of G.cones) {
    if (c.carrier >= 0 && G.players[c.carrier]) {
      const p = G.players[c.carrier];
      if (fp && p.i === G.me) {
        const side = Math.min(0.5, 0.55 * Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
        hand.set(side, -0.95, -1.1);
        camera.localToWorld(hand);
        c.mesh.position.copy(hand);
      } else {
        c.mesh.position.set(p.rx + Math.sin(p.rh) * 0.5, 0.55, p.rz + Math.cos(p.rh) * 0.5);
      }
      c.mesh.rotation.set(0, p.rh, 0);
    } else {
      c.mesh.position.set(c.x, 0, c.z);
      c.mesh.rotation.set(0, 0, 0);
    }
  }
  // 고른 곳 둘레에 흰 고리
  const sp = (G.state === 'play' || G.state === 'count') && G.players.length ? spotPos(G.sel) : null;
  pick.visible = !!sp;
  if (sp) pick.position.set(sp.x, 0.035, sp.z);
}

/* ---------- 머리 줄 ---------- */
function buildHud() {
  const hud = $('hud');
  hud.innerHTML = '';
  G.hudEls = G.players.map(p => {
    const el = document.createElement('div');
    el.className = 'chip' + (p.i === G.me ? ' me' : '');
    el.innerHTML = '<span class="dot"></span><span class="nm"></span><span class="pips"><i></i><i></i><i></i></span><span class="extra"></span><span class="bar"><b></b></span>';
    el.querySelector('.dot').style.background = hex(COLORS[p.i]);
    el.querySelector('.nm').textContent = nameOf(p.i);
    hud.appendChild(el);
    return { el, last: -1, nm: el.querySelector('.nm'), pips: [...el.querySelectorAll('.pips i')], extra: el.querySelector('.extra'), bar: el.querySelector('.bar b') };
  });
}
function refreshNames() { G.hudEls.forEach((h, i) => { h.nm.textContent = nameOf(i); }); }
function updateHud() {
  if (G.state === 'menu' || G.state === 'lobby' || !G.players.length) return;
  const cnt = counts();
  G.hudEls.forEach((h, i) => {
    if (cnt[i] !== h.last) {
      h.last = cnt[i];
      h.pips.forEach((el, k) => el.classList.toggle('on', k < cnt[i]));
      h.extra.textContent = cnt[i] > NEED ? '+' + (cnt[i] - NEED) : '';
    }
    h.bar.style.transform = 'scaleX(' + Math.min(1, G.players[i].hold / HOLD) + ')';
  });
  const gme = G.players[G.me], n = conesAt(G.sel).length;
  const label = gme.carry >= 0 ? t('carrying') : spotName(G.sel) + ' ' + (n === 1 ? t('cnt1') : t('cnt', { n }));
  const off = gme.carry >= 0 || n === 0 || G.state !== 'play';
  if (label + off !== G.gLabel) {
    G.gLabel = label + off;
    $('gsub').textContent = label;
    $('bG').setAttribute('aria-disabled', String(off));
  }
  if (G.view === 'first') {
    const me = G.players[G.me];
    const rel = wrap(Math.atan2(me.base.x - me.x, me.base.z - me.z) - me.h);
    $('needle').setAttribute('transform', 'rotate(' + (-rel * 180 / Math.PI) + ' 14 14)');
  }
}
let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
}
function showCount(s) { const el = $('count'); el.textContent = s; el.hidden = false; }

function handleEvent(e) {
  if (e.e === 'grab' && e.who === G.me) { sfx.grab(); buzz('light'); }
  else if (e.e === 'dep' && e.who === G.me) { sfx.deposit(); buzz('light'); }
  else if (e.e === 'stole' && e.from === G.me && G.players[e.by]) { toast(t('stole', { who: subj(nameOf(e.by)) })); sfx.stolen(G.players[e.by]); buzz('heavy'); }
  else if (e.e === 'hold') toast(e.who === G.me ? t('holdMe') : t('holdOther', { who: subj(nameOf(e.who)) }));
}

/* ---------- 소리 ---------- */
let ac = null;
function audio() {
  try {
    if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); }
    if (ac && ac.state === 'suspended') ac.resume();
  } catch (e) {}
}
function tone(f, dur, o = {}) {
  if (!ac || !S.sound) return;
  const { type = 'sine', vol = 0.12, pan = 0, to = 0, delay = 0 } = o;
  const t0 = ac.currentTime + delay, osc = ac.createOscillator(), g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  let out = g;
  if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); out = p; }
  out.connect(ac.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}
// 1인칭이면 내가 보는 방향 기준으로 좌우를 나눠, 안 보이는 곳 일도 귀로 알 수 있게
function where(x, z) {
  const me = G.players[G.me];
  const d = d2(me.x, me.z, x, z);
  const pan = G.view === 'first' ? -Math.sin(wrap(Math.atan2(x - me.x, z - me.z) - me.h)) : x / R;
  return { pan, vol: Math.max(0.35, 1 - d / 30) };
}
const sfx = {
  grab() { tone(520, 0.09, { type: 'triangle', to: 780 }); },
  select() { tone(700, 0.05, { type: 'triangle', vol: 0.06 }); },
  deposit() { tone(300, 0.14, { type: 'square', vol: 0.05 }); tone(450, 0.12, { type: 'triangle', delay: 0.06 }); },
  stolen(p) { const w = where(p.x, p.z); tone(330, 0.25, { type: 'sawtooth', vol: 0.07 * w.vol, to: 180, pan: w.pan }); },
  tick(p) { const w = p.i === G.me ? { pan: 0, vol: 1 } : where(p.base.x, p.base.z); tone(p.i === G.me ? 1046 : 880, 0.06, { vol: 0.1 * w.vol, pan: w.pan }); },
  count(n) { tone(n ? 600 : 900, n ? 0.12 : 0.3, { type: 'triangle' }); },
  win() { [523, 659, 784, 1046].forEach((f, k) => tone(f, 0.22, { type: 'triangle', delay: k * 0.11 })); },
  lose() { [440, 370, 311].forEach((f, k) => tone(f, 0.25, { type: 'triangle', vol: 0.09, delay: k * 0.14 })); }
};

/* ---------- 같이 하기 ---------- */
// 서버 없이 휴대폰끼리 바로 잇는다(WebRTC). 잇는 데 필요한 쪽지(SDP)는 QR로 주고받는다:
// 방장 화면 QR(게임 주소#j=초대 쪽지) → 친구가 카메라 앱으로 찍어 게임을 연다 → 친구 화면에 답 QR → 방장이 찍는다.
// 방장 화면이 판을 굴리고(고깔·봇·승패) 손님마다 열린 통로로 판 전체를 보낸다. 손님은 자기 몸 위치만 보낸다.
// 공용 STUN 은 서로 다른 망(휴대폰 데이터끼리)일 때 길을 찾는 데만 쓴다. 같은 와이파이·핫스팟이면 없어도 이어진다.
const ICE = [{ urls: 'stun:stun.l.google.com:19302' }];
const P2P = typeof RTCPeerConnection === 'function' && window.isSecureContext && !window.claude;
// 초대 QR에 넣는 게임 주소. 앱(capacitor://)에서 만든 초대는 친구가 앱이 없어도 열 수 있게 웹 주소로 보낸다.
const WEB_URL = 'https://shpeterpan.github.io/gokkal/';
const INVITE_BASE = /^https?:$/.test(location.protocol) ? location.origin + location.pathname + location.search : WEB_URL;

// 쪽지를 QR에 들어갈 만큼 줄인다: 필요 없는 줄을 빼고 deflate 로 눌러 base64url 로. 첫 글자 o(초대)/a(답), 둘째 z(눌림)/p(그대로)
const b64u = {
  enc(u8) { let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; return Uint8Array.from(atob(str), c => c.charCodeAt(0)); }
};
const pipe = async (u8, stream) => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer());
// 작게 담기(c): 지문·ufrag·pwd·후보 주소만 바이트로 담고, 받는 쪽이 정해진 틀로 쪽지를 다시 쓴다. 약 120자라 QR이 듬성듬성해진다.
// 틀에 안 맞는 쪽지(sha-256 지문이 아님, 후보 없음)는 아래의 눌러 담기(z)로 간다.
const SETUPS = ['actpass', 'active', 'passive'];
function compact(desc) {
  const L = desc.sdp.split(/\r?\n/);
  const get = k => { const l = L.find(x => x.startsWith('a=' + k + ':')); return l ? l.slice(k.length + 3).trim() : ''; };
  const fp = get('fingerprint').split(' '), ufrag = get('ice-ufrag'), pwd = get('ice-pwd'), setup = SETUPS.indexOf(get('setup'));
  if (!/^sha-256$/i.test(fp[0]) || !fp[1] || !ufrag || !pwd || setup < 0 || ufrag.length > 255 || pwd.length > 255) return null;
  const fpb = fp[1].split(':').map(h => parseInt(h, 16));
  if (fpb.length !== 32 || fpb.some(isNaN)) return null;
  const out = [setup, ...fpb, ufrag.length, ...[...ufrag].map(c => c.charCodeAt(0) & 255), pwd.length, ...[...pwd].map(c => c.charCodeAt(0) & 255)];
  const cands = [];
  for (const l of L) {
    const m = l.match(/^a=candidate:\S+ 1 udp \d+ (\S+) (\d+) typ (host|srflx)\b/i);
    if (!m || cands.length >= 4) continue;
    const addr = m[1], port = +m[2], kind = m[3].toLowerCase() === 'host' ? 0 : 1;
    let bytes = null, at = 0;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.local$/i.test(addr)) { at = 0; bytes = addr.slice(0, 36).replace(/-/g, '').match(/../g).map(h => parseInt(h, 16)); }
    else if (/^\d{1,3}(\.\d{1,3}){3}$/.test(addr)) { at = 4; bytes = addr.split('.').map(Number); }
    if (!bytes) continue;
    cands.push([kind, port >> 8, port & 255, at, ...bytes]);
  }
  if (!cands.length) return null;
  out.push(cands.length);
  cands.forEach(c => out.push(...c));
  return new Uint8Array(out);
}
function expand(u8, type) {
  let i = 0;
  const take = n => { const s = u8.slice(i, i + n); i += n; if (s.length !== n) throw new Error('qr'); return s; };
  const str = () => String.fromCharCode(...take(take(1)[0]));
  const setup = SETUPS[take(1)[0]];
  const fp = [...take(32)].map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
  const ufrag = str(), pwd = str(), n = take(1)[0];
  if (!setup) throw new Error('qr');
  const lines = ['v=0', 'o=- 1 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0', 'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0'];
  for (let k = 0; k < n; k++) {
    const [kind, ph, pl, at] = take(4), port = ph * 256 + pl;
    let addr;
    if (at === 4) addr = [...take(4)].join('.');
    else { const h = [...take(16)].map(b => b.toString(16).padStart(2, '0')).join(''); addr = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}.local`; }
    lines.push(kind === 0
      ? `a=candidate:${k + 1} 1 udp ${2113937151 - k} ${addr} ${port} typ host`
      : `a=candidate:${k + 1} 1 udp ${1677729535 - k} ${addr} ${port} typ srflx raddr 0.0.0.0 rport 0`);
  }
  lines.push('a=ice-ufrag:' + ufrag, 'a=ice-pwd:' + pwd, 'a=fingerprint:sha-256 ' + fp, 'a=setup:' + setup, 'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144');
  return { type, sdp: lines.join('\r\n') + '\r\n' };
}
async function pack(desc) {
  const head = desc.type === 'offer' ? 'o' : 'a', small = compact(desc);
  if (small) return head + 'c' + b64u.enc(small);
  const sdp = desc.sdp.split(/\r?\n/)
    .filter(l => l && !/^a=(extmap-allow-mixed|msid-semantic)/.test(l) && !/^a=candidate:\S+ \d+ tcp /i.test(l))
    .join('\n');
  let z = 'p', data = new TextEncoder().encode(sdp);
  try { data = await pipe(data, new CompressionStream('deflate-raw')); z = 'z'; } catch (_) {}
  return head + z + b64u.enc(data);
}
async function unpack(code) {
  const type = { o: 'offer', a: 'answer' }[code[0]];
  if (!type || !/^[zpc]$/.test(code[1])) throw new Error('qr');
  let data = b64u.dec(code.slice(2));
  if (code[1] === 'c') return expand(data, type);
  if (code[1] === 'z') data = await pipe(data, new DecompressionStream('deflate-raw'));
  return { type, sdp: new TextDecoder().decode(data).split('\n').join('\r\n') + '\r\n' };
}
// QR 글자에서 쪽지만: 초대는 주소(…#j=쪽지), 답은 쪽지 그대로
function codeFrom(text) {
  const s = String(text || '').trim(), m = s.match(/#j=([A-Za-z0-9_-]+)/);
  return m ? m[1] : /^[oa][zpc][A-Za-z0-9_-]+$/.test(s) ? s : '';
}
function gathered(pc) {
  return new Promise(ok => {
    if (pc.iceGatheringState === 'complete') return ok();
    const timer = setTimeout(ok, 3000);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(timer); ok(); } });
  });
}
function drawQr(box, text) {
  const qr = qrcode(0, 'L');
  qr.addData(text);
  qr.make();
  box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
}

const net = {
  pc: null, dc: null, answer: '',      // 손님: 방장으로 가는 통로 하나
  peers: [], pending: null, nextId: 0, // 방장: 들어온 손님들(차례대로), 지금 부르는 자리
  myId: 0, peerIds: [], map: {}, sendT: 0,
  send(o) { if (this.dc && this.dc.readyState === 'open') this.dc.send(JSON.stringify(o)); },
  broadcast(o) {
    const s = JSON.stringify(o);
    for (const p of this.peers) if (p.dc.readyState === 'open') p.dc.send(s);
  },
  tick(dt) {
    if (G.role === 'solo' || !['count', 'play', 'over'].includes(G.state)) return;
    this.sendT -= dt;
    if (this.sendT > 0) return;
    this.sendT = 0.05;
    if (G.role === 'host') {
      this.broadcast({
        k: 's', st: G.state, ct: r2(G.countT), tm: r2(G.time), w: G.winner,
        b: G.players.filter(p => p.kind === 'bot').map(p => p.i),
        p: G.players.map(p => [r2(p.x), r2(p.z), r2(p.h), p.carry, r2(p.hold)]),
        c: G.cones.map(c => [r2(c.x), r2(c.z), c.owner, c.carrier]),
        ev: G.events.splice(0)
      });
    } else {
      const me = G.players[G.me];
      if (me) this.send({ k: 'me', x: r2(me.x), z: r2(me.z), h: r2(me.h) });
    }
  }
};
function closeSlot(s) {
  if (!s) return;
  s.dead = true;
  try { s.dc.close(); } catch (_) {}
  try { s.pc.close(); } catch (_) {}
}
function leaveNet() {
  closeScanner();
  const pc = net.pc, dc = net.dc;
  net.pc = null; net.dc = null;
  try { if (dc) dc.close(); } catch (_) {}
  try { if (pc) pc.close(); } catch (_) {}
  const all = net.peers.concat(net.pending ? [net.pending] : []);
  net.peers = []; net.pending = null;
  all.forEach(closeSlot);
  Object.assign(net, { answer: '', myId: 0, peerIds: [], map: {} });
}
function dropped(msg) {
  leaveNet();
  if (G.state === 'menu') joinError(msg); else toMenu(msg);
}
function leaveRoom() { leaveNet(); toMenu(); }

/* 방장 */
function hostRoom() {
  audio();
  leaveNet();
  G.role = 'host'; G.me = 0;
  showLobby();
}
async function startInvite() {
  if (G.role !== 'host' || net.peers.length >= 5) return;
  closeSlot(net.pending);
  $('lobErr').hidden = true;
  const pc = new RTCPeerConnection({ iceServers: ICE });
  const dc = pc.createDataChannel('gokkal');
  const slot = { id: ++net.nextId, pc, dc, dead: false };
  net.pending = slot;
  renderInvite('making');
  dc.onopen = () => {
    if (slot.dead) return;
    if (net.pending === slot) net.pending = null;
    if (G.role !== 'host' || G.state !== 'lobby' || net.peers.length >= 5) { dc.send(JSON.stringify({ k: 'busy' })); setTimeout(() => closeSlot(slot), 300); renderInvite(null); return; }
    net.peers.push(slot);
    dc.send(JSON.stringify({ k: 'hello', id: slot.id }));
    sendLobby();
    renderInvite(null);
    renderLobby();
    sfx.deposit();
  };
  dc.onmessage = e => { let d; try { d = JSON.parse(e.data); } catch (_) { return; } onGuestMsg(slot.id, d); };
  dc.onclose = () => guestLeft(slot);
  pc.onconnectionstatechange = () => {
    if (pc.connectionState !== 'failed' || slot.dead) return;
    if (net.pending === slot) { lobbyError(t('errFail')); cancelInvite(); }
    else guestLeft(slot);
  };
  try {
    await pc.setLocalDescription(await pc.createOffer());
    await gathered(pc);
    const code = await pack(pc.localDescription);
    if (net.pending !== slot) return;
    drawQr($('qrBox'), INVITE_BASE + '#j=' + code);
    renderInvite('show');
  } catch (e) {
    if (net.pending === slot) { lobbyError(t('errFail')); cancelInvite(); }
  }
}
async function acceptAnswer(text) {
  const slot = net.pending;
  if (!slot) return;
  const code = codeFrom(text);
  let desc;
  try { if (!code || code[0] !== 'a') throw 0; desc = await unpack(code); } catch (_) { lobbyError(t('errQr')); return; }
  try {
    await slot.pc.setRemoteDescription(desc);
    $('lobErr').hidden = true;
    renderInvite('connecting');
  } catch (_) { lobbyError(t('errOld')); }
}
function cancelInvite() { closeSlot(net.pending); net.pending = null; renderInvite(null); }
function guestLeft(slot) {
  const k = net.peers.indexOf(slot);
  if (k < 0) return;
  net.peers.splice(k, 1);
  closeSlot(slot);
  if (G.role !== 'host') return;
  if (G.state === 'lobby') { sendLobby(); renderLobby(); return; }
  const idx = net.map[slot.id], pl = G.players[idx];
  delete net.map[slot.id];
  if (pl && pl.kind === 'human') {
    pl.kind = 'bot'; pl.speed = BOT_SPEED;
    refreshNames();
    toast(t('gone', { who: subj(colorName(idx)) }));
  }
}
function sendLobby() { net.broadcast({ k: 'lobby', peers: net.peers.map(p => p.id) }); }
function onGuestMsg(id, d) {
  if (d.k !== 'me') return;
  const idx = net.map[id], p = idx !== undefined && G.players[idx];
  if (!p || p.kind !== 'human' || !Number.isFinite(d.x) || !Number.isFinite(d.z) || !Number.isFinite(d.h)) return;
  p.x = d.x; p.z = d.z; p.h = d.h;
  clamp(p);
}

/* 손님 */
async function joinWith(code) {
  audio();
  leaveNet();
  G.role = 'guest'; G.me = 0;
  if (G.state !== 'menu') setState('menu');
  hidePanels();
  $('ansQr').textContent = t('making');
  $('ansNote').textContent = t('showHostNote');
  $('ansText').value = '';
  $('ansCopy').disabled = true;
  $('answerPanel').hidden = false;
  let desc;
  try { desc = await unpack(code); if (desc.type !== 'offer') throw 0; } catch (_) { joinError(t('errQr')); return; }
  const pc = new RTCPeerConnection({ iceServers: ICE });
  net.pc = pc;
  pc.ondatachannel = e => {
    const dc = e.channel;
    net.dc = dc;
    dc.onmessage = ev => { let d; try { d = JSON.parse(ev.data); } catch (_) { return; } onHostMsg(d); };
    dc.onclose = () => { if (net.dc === dc) dropped(t('errClosed')); };
  };
  pc.onconnectionstatechange = () => {
    if (net.pc !== pc) return;
    if (pc.connectionState === 'connecting') $('ansNote').textContent = t('connecting');
    if (pc.connectionState === 'failed') dropped(t(net.myId ? 'errClosed' : 'errFail'));
  };
  try {
    await pc.setRemoteDescription(desc);
    await pc.setLocalDescription(await pc.createAnswer());
    await gathered(pc);
    if (net.pc !== pc) return;
    net.answer = await pack(pc.localDescription);
    if (net.pc !== pc) return;
    drawQr($('ansQr'), net.answer);
    $('ansText').value = net.answer;
    $('ansCopy').disabled = false;
  } catch (_) {
    if (net.pc === pc) dropped(t('errFail'));
  }
}
function onHostMsg(d) {
  if (d.k === 'hello') {
    net.myId = d.id;
  } else if (d.k === 'lobby') {
    net.peerIds = Array.isArray(d.peers) ? d.peers : [];
    if (G.state !== 'lobby') showLobby(); else renderLobby();
  } else if (d.k === 'start') {
    const idx = d.map && d.map[net.myId];
    if (!Number.isInteger(idx) || !Number.isInteger(d.n)) return;
    audio();
    G.me = idx;
    beginMatch(d.n, Array.isArray(d.humans) ? d.humans : [0, idx], d.view === 'third' ? 'third' : 'first');
  } else if (d.k === 'busy') {
    dropped(t('errStarted'));
  } else if (d.k === 's' && G.players.length) {
    applySnap(d);
  }
}
function applySnap(d) {
  const bots = new Set(Array.isArray(d.b) ? d.b : []);
  let renamed = false;
  (Array.isArray(d.p) ? d.p : []).forEach((a, i) => {
    const p = G.players[i];
    if (!p || !Array.isArray(a)) return;
    if (i !== G.me) {
      p.x = +a[0] || 0; p.z = +a[1] || 0; p.h = +a[2] || 0;
      if (bots.has(i) && p.kind !== 'bot') { p.kind = 'bot'; renamed = true; }
    }
    p.carry = Number.isInteger(a[3]) ? a[3] : -1;
    p.hold = +a[4] || 0;
  });
  (Array.isArray(d.c) ? d.c : []).forEach((a, i) => {
    const c = G.cones[i];
    if (!c || !Array.isArray(a)) return;
    c.x = +a[0] || 0; c.z = +a[1] || 0;
    c.owner = Number.isInteger(a[2]) ? a[2] : -1;
    c.carrier = Number.isInteger(a[3]) ? a[3] : -1;
  });
  if (renamed) refreshNames();
  G.time = +d.tm || 0; G.countT = +d.ct || 0; G.winner = Number.isInteger(d.w) ? d.w : -1;
  (Array.isArray(d.ev) ? d.ev : []).forEach(e => { if (e && typeof e === 'object') handleEvent(e); });
  if (d.st !== G.state && ['count', 'play', 'over'].includes(d.st)) setState(d.st);
}

/* 방 화면 */
function myLobbyIndex() { return G.role === 'host' ? 0 : 1 + net.peerIds.indexOf(net.myId); }
function showLobby() {
  setState('lobby');
  hidePanels();
  renderInvite(null);
  renderLobby();
  $('lobby').hidden = false;
}
function renderLobby() {
  const host = G.role === 'host';
  const total = 1 + (host ? net.peers.length : net.peerIds.length), mine = myLobbyIndex();
  const box = $('lobPeople');
  box.textContent = '';
  for (let k = 0; k < total; k++) {
    const el = document.createElement('span');
    el.className = 'chip' + (k === mine ? ' me' : '');
    const dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = hex(COLORS[k]);
    const nm = document.createElement('span');
    nm.textContent = k === mine ? t('me') : k === 0 ? t('host', { c: colorName(0) }) : colorName(k);
    el.append(dot, nm);
    box.appendChild(el);
  }
  const inviting = host && !!net.pending;
  $('inviteBtn').hidden = !host || inviting || net.peers.length >= 5;
  $('lobViewWrap').hidden = !host || inviting;
  $('lobStart').hidden = !host || inviting;
  $('lobNote').hidden = inviting;
  $('lobNote').textContent = host ? t('fill') : t('waitHost');
  const six = Math.max(3, total) >= 6;
  $('lv-first').disabled = six;
  $('lv-first').checked = !six && S.view === 'first';
  $('lv-third').checked = six || S.view === 'third';
  if (G.players.length !== Math.max(3, total)) { G.me = 0; buildWorld(Math.max(3, total), [0]); }
}
function renderInvite(stage) {
  const box = $('invite');
  box.hidden = !stage;
  if (stage === 'making') { $('qrBox').textContent = t('making'); $('inviteNote').textContent = t('inviteNote'); $('pasteIn').value = ''; }
  if (stage === 'connecting') $('inviteNote').textContent = t('connecting');
  if (stage === 'show') $('inviteNote').textContent = t('inviteNote');
  $('scanFriend').disabled = stage !== 'show';
  $('pasteGo').disabled = stage !== 'show';
  if (G.state === 'lobby') {
    $('inviteBtn').hidden = G.role !== 'host' || !!stage || net.peers.length >= 5;
    $('lobViewWrap').hidden = G.role !== 'host' || !!stage;
    $('lobStart').hidden = G.role !== 'host' || !!stage;
    $('lobNote').hidden = !!stage;
  }
}
function lobbyError(msg) { const e = $('lobErr'); e.textContent = msg; e.hidden = false; }
function joinError(msg) {
  leaveNet();
  hidePanels();
  G.role = 'solo'; G.me = 0;
  if (G.state !== 'menu') setState('menu');
  const e = $('joinErr');
  e.textContent = msg || ''; e.hidden = !msg;
  $('joinPanel').hidden = false;
}
function openJoin() {
  hidePanels();
  $('joinErr').hidden = true;
  $('joinPanel').hidden = false;
}

/* QR 찍기: 되는 브라우저는 BarcodeDetector, 아니면(아이폰 사파리 등) jsQR */
let scan = null;
async function openScanner(onText) {
  closeScanner();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); }
  catch (_) { return false; }
  let det = null;
  try { if ('BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats()).includes('qr_code')) det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (_) {}
  let jsQR = null;
  if (!det) { try { jsQR = (await import('jsqr')).default; } catch (_) {} }
  const video = $('scanVideo');
  video.srcObject = stream;
  $('scanner').hidden = false;
  ads.banner(false);
  try { await video.play(); } catch (_) {}
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  const s = scan = { stream, timer: 0, alive: true };
  const step = async () => {
    if (!s.alive) return;
    let text = null;
    if (video.readyState >= 2 && video.videoWidth) {
      try {
        if (det) { const r = await det.detect(video); if (r && r[0]) text = r[0].rawValue; }
        else if (jsQR) {
          const w = Math.min(960, video.videoWidth), h = Math.round(video.videoHeight * w / video.videoWidth);
          cv.width = w; cv.height = h; cx.drawImage(video, 0, 0, w, h);
          const r = jsQR(cx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
          if (r) text = r.data;
        }
      } catch (_) {}
    }
    if (text && s.alive) { closeScanner(); onText(text); return; }
    if (s.alive) s.timer = setTimeout(step, 150);
  };
  step();
  return true;
}
function closeScanner() {
  if (!scan) return;
  scan.alive = false;
  clearTimeout(scan.timer);
  scan.stream.getTracks().forEach(tr => tr.stop());
  scan = null;
  $('scanVideo').srcObject = null;
  $('scanner').hidden = true;
  ads.banner(true);
}

/* ---------- 입력 ---------- */
function bindTap(el, fn) {
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); audio();
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    el.classList.add('on');
    fn();
  });
  const up = () => el.classList.remove('on');
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => el.addEventListener(n, up));
  el.addEventListener('contextmenu', e => e.preventDefault());
}
bindTap($('bL'), () => stepSpot(1));
bindTap($('bR'), () => stepSpot(-1));
bindTap($('bG'), act);
function goHome() { if (G.state === 'play' || G.state === 'count') G.auto = { home: true }; }
$('homeBtn').addEventListener('click', goHome);

// 화면에 보이는 고깔을 누르면 그리로 간다. 손가락이 조금 빗나가도 잡히게 화면 거리로 고른다
const proj = new THREE.Vector3();
canvas.addEventListener('pointerdown', e => {
  if (G.state !== 'play' && G.state !== 'count') return;
  audio();
  const me = G.players[G.me], W = innerWidth, H = innerHeight;
  let best = null, bd = 90;
  for (const c of G.cones) {
    if (!canTake(me, c)) continue;
    proj.set(c.x, 0.45, c.z).project(camera);
    if (proj.z < -1 || proj.z > 1) continue;
    const d = Math.hypot((proj.x + 1) / 2 * W - e.clientX, (1 - proj.y) / 2 * H - e.clientY);
    if (d < bd) { bd = d; best = c; }
  }
  if (best) { G.sel = spotOf(best); G.auto = { cone: best.i }; return; }
  proj.set(me.base.x, 0, me.base.z).project(camera);
  if (proj.z >= -1 && proj.z <= 1 && Math.hypot((proj.x + 1) / 2 * W - e.clientX, (1 - proj.y) / 2 * H - e.clientY) < 80) G.auto = { home: true };
});

addEventListener('keydown', e => {
  if ((G.state !== 'play' && G.state !== 'count') || e.repeat) return;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); stepSpot(1); }
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); stepSpot(-1); }
  else if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); act(); }
  else if (e.code === 'KeyH') goHome();
});

/* ---------- 시작 판 ---------- */
function syncMenu() {
  const six = S.count >= 6;
  $('v-first').disabled = six;
  $('v-first').checked = !six && S.view === 'first';
  $('v-third').checked = six || S.view === 'third';
  $('sixNote').hidden = !six;
  $('c' + S.count).checked = true;
  $('lang').value = S.lang;
}
function applyTheme() {
  if (S.theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = S.theme;
}
function applyLang() {
  resolveLang();
  document.documentElement.lang = lang;
  document.title = t('title');
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.aria)); });
  document.querySelectorAll('[data-n]').forEach(el => { el.textContent = t('n', { n: el.dataset.n }); });
  refreshNames();
  G.gLabel = '';
}
document.querySelectorAll('input[name="view"]').forEach(el => el.addEventListener('change', () => { S.view = el.value; save(); syncMenu(); }));
document.querySelectorAll('input[name="lview"]').forEach(el => el.addEventListener('change', () => { S.view = el.value; save(); syncMenu(); }));
document.querySelectorAll('input[name="count"]').forEach(el => el.addEventListener('change', () => { S.count = +el.value; save(); syncMenu(); buildWorld(S.count, [0]); }));
$('lang').addEventListener('change', e => { S.lang = e.target.value; save(); applyLang(); });
$('solo').addEventListener('click', startSolo);
$('together').addEventListener('click', openJoin);
$('create').addEventListener('click', () => { $('joinErr').hidden = true; hostRoom(); });
$('scanJoin').addEventListener('click', async () => {
  $('joinErr').hidden = true;
  const ok = await openScanner(text => {
    const code = codeFrom(text);
    if (code && code[0] === 'o') joinWith(code); else joinError(t('errQr'));
  });
  if (!ok) joinError(t('errCam'));
});
$('joinBack').addEventListener('click', () => toMenu());
$('ansCancel').addEventListener('click', leaveRoom);
$('ansCopy').addEventListener('click', () => {
  const el = $('ansText');
  try { navigator.clipboard.writeText(el.value).then(() => toast(t('copied')), () => el.select()); } catch (_) { el.select(); }
});
$('inviteBtn').addEventListener('click', startInvite);
$('inviteCancel').addEventListener('click', cancelInvite);
$('scanFriend').addEventListener('click', async () => {
  $('lobErr').hidden = true;
  const ok = await openScanner(acceptAnswer);
  if (!ok) lobbyError(t('errCam'));
});
$('pasteGo').addEventListener('click', () => acceptAnswer($('pasteIn').value));
$('scanCancel').addEventListener('click', closeScanner);
$('lobStart').addEventListener('click', startHosted);
$('lobLeave').addEventListener('click', leaveRoom);
// 판 사이 쉬는 틈에만 전면 광고(규칙은 ads/policy.ts). 손님은 방장 화면을 따라가니 띄우지 않는다.
let breaking = false;
async function atBreak(leaving, next) {
  if (breaking) return;
  breaking = true;
  try { if (G.role !== 'guest') await ads.atBreak({ kind: 'run', leaving }); } catch (_) {}
  breaking = false;
  next();
}
$('again').addEventListener('click', () => atBreak(false, () => { if (G.role === 'host') startHosted(); else startSolo(); }));
$('toMenu').addEventListener('click', () => atBreak(true, () => toMenu()));
$('toLobby').addEventListener('click', () => atBreak(false, () => { showLobby(); sendLobby(); }));
$('resLeave').addEventListener('click', leaveRoom);

/* ---------- 진동 ---------- */
const native = Capacitor.isNativePlatform();
let hapticsMod = null;
function buzz(kind) {
  if (!S.haptic) return;
  if (native) {
    const go = h => {
      if (kind === 'win') h.Haptics.notification({ type: 'SUCCESS' }).catch(() => {});
      else h.Haptics.impact({ style: kind === 'heavy' ? 'HEAVY' : 'LIGHT' }).catch(() => {});
    };
    if (hapticsMod) go(hapticsMod);
    else import('@capacitor/haptics').then(h => { hapticsMod = h; go(h); }).catch(() => {});
  } else if (navigator.vibrate) {
    try { navigator.vibrate(kind === 'heavy' ? 40 : kind === 'win' ? [30, 60, 30] : 12); } catch (_) {}
  }
}

/* ---------- 설정 ---------- */
// 아래에서 올라오는 시트. 손잡이를 끌어내리거나 바깥·Esc 로 닫는다.
let lastFocus = null;
function openSettings() {
  lastFocus = document.activeElement;
  syncSettings();
  $('sheetScrim').hidden = false;
  $('settings').hidden = false;
  $('settings').style.transform = '';
  $('closeSettings').focus({ preventScroll: true });
}
function closeSettings() {
  $('sheetScrim').hidden = true;
  $('settings').hidden = true;
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
function syncSettings() {
  $('optSound').checked = S.sound;
  $('optHaptic').checked = S.haptic;
  $('hapticRow').hidden = !native && !navigator.vibrate;
  $('th-' + S.theme).checked = true;
  $('lang').value = S.lang;
  const sell = purchasesAvailable() && !isAdFree();
  $('adBox').hidden = !sell;
  $('adFreeDone').hidden = !(purchasesAvailable() && isAdFree());
  $('adPrivacy').hidden = !ads.privacyOptionsRequired();
  if (sell) {
    $('buyAdFree').textContent = t('removeAds');
    removeAdsPrice().then(p => { if (p && !isAdFree()) $('buyAdFree').textContent = t('removeAdsPrice', { p }); });
  }
}
$('openSettings').addEventListener('click', openSettings);
$('closeSettings').addEventListener('click', closeSettings);
$('sheetScrim').addEventListener('click', closeSettings);
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('settings').hidden) closeSettings(); });
(() => {
  const sheet = $('settings');
  let y0 = null, dy = 0;
  const start = e => { if (e.target.closest('button, input, select, a')) return; y0 = e.clientY; dy = 0; sheet.setPointerCapture?.(e.pointerId); };
  sheet.querySelector('.grabber').parentElement.addEventListener('pointerdown', e => { if (e.target.closest('.grabber, .sheethead')) start(e); });
  sheet.addEventListener('pointermove', e => {
    if (y0 === null) return;
    dy = Math.max(0, e.clientY - y0);
    sheet.style.transform = 'translateY(' + dy + 'px)';
  });
  const end = () => {
    if (y0 === null) return;
    y0 = null;
    if (dy > 80) closeSettings();
    sheet.style.transform = '';
  };
  sheet.addEventListener('pointerup', end);
  sheet.addEventListener('pointercancel', end);
})();
$('optSound').addEventListener('change', e => { S.sound = e.target.checked; save(); if (S.sound) { audio(); sfx.select(); } });
$('optHaptic').addEventListener('change', e => { S.haptic = e.target.checked; save(); buzz('light'); });
document.querySelectorAll('input[name="theme"]').forEach(el => el.addEventListener('change', () => { S.theme = el.value; save(); applyTheme(); }));
$('buyAdFree').addEventListener('click', async () => {
  const btn = $('buyAdFree'), msg = $('buyMsg');
  btn.disabled = true; msg.textContent = '';
  const r = await buyRemoveAds();
  btn.disabled = false;
  if (r === 'bought') syncSettings();
  else if (r === 'pending') msg.textContent = t('buyPending');
  else if (r === 'failed') msg.textContent = t('buyFailed');
});
$('restore').addEventListener('click', async () => {
  const msg = $('buyMsg');
  msg.textContent = '';
  const r = await restoreRemoveAds();
  if (r === 'found') syncSettings();
  else msg.textContent = t(r === 'none' ? 'restoreNone' : 'restoreFailed');
});
$('adPrivacy').addEventListener('click', () => { ads.showPrivacyOptions().catch(() => {}).then(syncSettings); });
onAdFree(() => { toast(t('adFreeDone')); if (!$('settings').hidden) syncSettings(); });

/* ---------- 처음 판 안내 ---------- */
// 처음 두 판만, 출발하고 5초 또는 가져오기를 처음 누를 때까지
let coachLeft = 2;
try { coachLeft = Math.max(0, 2 - (+localStorage.getItem('gokkal-coached') || 0)); } catch (_) {}
function coachOn() {
  if (coachLeft <= 0) return;
  coachLeft--;
  try { localStorage.setItem('gokkal-coached', String(2 - coachLeft)); } catch (_) {}
  const el = $('coach');
  el.textContent = t('coach'); el.hidden = false;
  clearTimeout(coachOn.timer);
  coachOn.timer = setTimeout(coachOff, 5000);
}
function coachOff() { $('coach').hidden = true; }

/* ---------- 돌리기 ---------- */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
}
addEventListener('resize', resize);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  placeCamera();
  sync();
  updateHud();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

resolveLang();
applyTheme();
applyLang();
syncMenu();
buildWorld(S.count, [0]);
resize();
requestAnimationFrame(frame);
// 같이 하기는 휴대폰끼리 바로 잇는(WebRTC) https 주소에서만. 아티팩트 안에서는 막혀 있어 혼자 하기만 보인다.
$('together').hidden = !P2P;
// 방장 QR(게임 주소#j=쪽지)을 카메라 앱으로 찍어 열었으면 바로 답 QR을 만든다
const inv = location.hash.match(/^#j=([A-Za-z0-9_-]+)$/);
if (P2P && inv) {
  try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
  joinWith(inv[1]);
}
// 앱: 광고·결제를 켠다(웹은 아무 일도 하지 않는다). 상태 막대 글자는 하늘색 운동장 위에서 읽히게 늘 짙게.
ads.banner(true);
startPurchases().finally(() => startAds());
if (native) import('@capacitor/status-bar').then(({ StatusBar, Style }) => StatusBar.setStyle({ style: Style.Light }).catch(() => {})).catch(() => {});
