// 사방 줄다리기: 모서리에 선 사람들이 가운데 매듭에 묶인 줄을 각자 바깥으로 당긴다.
// 매듭을 내 쪽으로 끌어와 내 깃발에 먼저 손이 닿으면 이긴다. 당기기를 빠르게 누를수록 세게 당기고,
// 세게 당길수록 기력이 빠진다(언제 몰아서 당기고 언제 쉬나가 판단거리). 계획은 ROADMAP.md 1장.
//
// 공통 흐름(메뉴·카운트·결과·머리 줄·같이 하기)은 main.js 가 맡고, 이 모듈은 판 안의 일만 한다.

const TAU = Math.PI * 2;
// 숫자는 봇과 300판씩 돌려 맞췄다(2026-11-03): 판은 30~40초, 2분 넘게 끄는 판은 거의 없고,
// 쉬었다 몰아 당기면 초당 5.5번으로 3명 판 40~53%·4명 판 약 30%, 쉬지 않고 연타만 하면 이기지 못한다.
export const TUG = {
  L: 6,            // 매듭에서 사람까지 줄 길이(m)
  GAP: 3.5,        // 처음 자리에서 깃발에 손이 닿기까지 매듭이 와야 하는 거리(m)
  MAX_RATE: 8,     // 이보다 빠른 연타는 더 세지지 않는다(초당 번)
  DRAIN: 0.03,     // 초당 누른 횟수 × 이것만큼 기력이 빠진다(초당 6번이면 약 5초에 바닥)
  REFILL: 0.25,    // 안 누르면 초당 이만큼 찬다(약 4초에 가득)
  TIRED: 0.18,     // 기력이 바닥이면 힘이 이만큼으로 줄어든다
  MOB: 0.18,       // 힘 1 이 매듭을 초당 이만큼 끈다(혼자 초당 6번이면 약 3초에 깃발)
  RAMP_AT: 15,     // 이 초가 지나면 줄이 점점 잘 끌린다(판이 끝없이 버티지 않게)
  RAMP: 6,         // RAMP 초마다 끌리는 빠르기가 한 배씩 더해진다
  BLOCK_AT: 0.9,   // 남이 깃발까지 이만큼 오면, 반대쪽 봇이 막으러 당긴다
  BLOCK_STAM: 0.6, // 막으러 당기려면 기력이 이만큼은 남아 있어야 한다
  BOT_MIN: 4,      // 봇이 몰아 당길 때 초당 누르는 횟수: BOT_MIN ~ BOT_MIN + BOT_SPREAD
  BOT_SPREAD: 2.5,
};
const ROPE_Y = 0.85;

export function createTug(api) {
  const { THREE, G, lam, flat, makePlayer, poleG, poleM, flagG, COLORS, emit, tapRate } = api;
  const ropeG = new THREE.CylinderGeometry(0.045, 0.045, 1, 8);
  const ropeM = lam(0xC9B48A);
  const knotM = lam(0x8A6A3E);
  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
  let knotMesh = null;

  function build(n, humans, w) {
    G.knot = { x: 0, z: 0, vx: 0, vz: 0 };
    G.players = [];
    // 모서리를 잇는 흰 선(판 모양)
    const corners = [];
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 + i * TAU / n;
      corners.push(new THREE.Vector3(Math.cos(a) * (TUG.L + TUG.GAP + 1.2), 0.03, Math.sin(a) * (TUG.L + TUG.GAP + 1.2)));
    }
    const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(corners), new THREE.LineBasicMaterial({ color: 0xF4F6F2 }));
    w.add(outline);
    knotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), knotM);
    w.add(knotMesh);
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 + i * TAU / n, ux = Math.cos(a), uz = Math.sin(a), col = COLORS[i];
      const x = ux * TUG.L, z = uz * TUG.L, fx = ux * (TUG.L + TUG.GAP + 0.6), fz = uz * (TUG.L + TUG.GAP + 0.6);
      // 깃발(손이 닿아야 하는 곳)과 발밑 출발선
      // 깃대는 1인칭 시야 한가운데를 가리지 않게 오른쪽으로 비켜 세운다
      const sx = fx - uz * 1.3, sz = fz + ux * 1.3;
      const pole = new THREE.Mesh(poleG, poleM); pole.position.set(sx, 1.6, sz);
      const flag = new THREE.Mesh(flagG, lam(col)); flag.position.set(sx - uz * 0.45, 2.9, sz + ux * 0.45); flag.rotation.y = -a;
      const goal = flat(new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshLambertMaterial({ color: col, transparent: true, opacity: 0.5 })));
      goal.position.set(ux * (TUG.L + TUG.GAP), 0.02, uz * (TUG.L + TUG.GAP));
      const mesh = makePlayer(col);
      mesh.rotation.order = 'YXZ';
      const rope = new THREE.Mesh(ropeG, ropeM);
      w.add(pole, flag, goal, mesh, rope);
      const h = Math.atan2(ux, uz);   // 바깥(내 깃발)을 본다
      const kind = i === G.me ? 'me' : humans.includes(i) ? 'human' : 'bot';
      G.players.push({
        i, kind, u: { x: ux, z: uz }, x, z, h, th: h, rx: x, rz: z, rh: h,
        base: { x: ux * (TUG.L + TUG.GAP), z: uz * (TUG.L + TUG.GAP) },
        mesh, rope, carry: -1, hold: 0, tickT: 0,
        stamina: 1, force: 0, rate: 0, remoteRate: 0, prog: 0, near: false,
        ai: { pulling: Math.random() < 0.5, hi: 0.65 + Math.random() * 0.25, lo: 0.12 + Math.random() * 0.2, speed: TUG.BOT_MIN + Math.random() * TUG.BOT_SPREAD, jitter: 0 }
      });
    }
  }

  const progOf = p => (G.knot.x * p.u.x + G.knot.z * p.u.z) / TUG.GAP;

  // 봇: 기력이 hi 까지 차면 몰아서 당기고 lo 까지 빠지면 쉰다. 누가 깃발 앞이면 그 반대쪽 봇은 막으러 당긴다.
  function botRate(b, dt) {
    const ai = b.ai;
    if (ai.pulling && b.stamina <= ai.lo) ai.pulling = false;
    else if (!ai.pulling && b.stamina >= ai.hi) ai.pulling = true;
    let urgent = b.prog > 0.75;
    for (const o of G.players) {
      if (o === b || o.prog < TUG.BLOCK_AT || b.stamina < TUG.BLOCK_STAM) continue;
      if (o.u.x * b.u.x + o.u.z * b.u.z < -0.2) urgent = true;
    }
    ai.jitter += dt;
    const wobble = 0.85 + 0.3 * Math.abs(Math.sin(ai.jitter * 1.7 + b.i));
    if ((ai.pulling || urgent) && b.stamina > 0.03) return ai.speed * wobble;
    return 0;
  }

  // 판 굴리기(혼자·방장만)
  function simulate(dt) {
    let px = 0, pz = 0;
    for (const p of G.players) {
      const rate = Math.min(TUG.MAX_RATE, p.kind === 'bot' ? botRate(p, dt) : p.i === G.me ? tapRate() : p.remoteRate || 0);
      p.rate = rate;
      if (rate > 0.5) p.stamina = Math.max(0, p.stamina - TUG.DRAIN * rate * dt);
      else p.stamina = Math.min(1, p.stamina + TUG.REFILL * dt);
      p.force = rate * (TUG.TIRED + (1 - TUG.TIRED) * p.stamina);
      px += p.force * p.u.x; pz += p.force * p.u.z;
    }
    const k = G.knot, ease = Math.min(1, dt * 6);
    const mob = TUG.MOB * (1 + Math.max(0, (G.time || 0) - TUG.RAMP_AT) / TUG.RAMP);
    k.vx += (px * mob - k.vx) * ease;
    k.vz += (pz * mob - k.vz) * ease;
    k.x += k.vx * dt; k.z += k.vz * dt;
    const r = Math.hypot(k.x, k.z), max = TUG.GAP + 0.2;
    if (r > max) { k.x *= max / r; k.z *= max / r; }
    for (const p of G.players) {
      p.prog = progOf(p);
      if (p.prog > 0.75 && !p.near) { p.near = true; emit({ e: 'near', who: p.i }); }
      else if (p.prog < 0.55) p.near = false;
    }
    for (const p of G.players) if (p.prog >= 1) return p.i;
    return -1;
  }

  // 그리기(모두): 사람은 매듭에서 줄 길이만큼 떨어져 바깥을 본다. 당길수록 앞으로 기운다.
  function place() {
    const k = G.knot;
    for (const p of G.players) {
      p.x = k.x + p.u.x * TUG.L; p.z = k.z + p.u.z * TUG.L; p.h = Math.atan2(p.u.x, p.u.z);
      p.rx = p.x; p.rz = p.z; p.rh = p.h;
    }
  }
  function sync(fp, meIndex) {
    const k = G.knot;
    knotMesh.position.set(k.x, ROPE_Y, k.z);
    for (const p of G.players) {
      p.mesh.position.set(p.rx, 0, p.rz);
      p.mesh.rotation.y = p.rh;
      p.mesh.rotation.x = 0.32 * Math.min(1, p.force / 6);
      p.mesh.visible = !(fp && p.i === meIndex);
      dir.set(p.rx - k.x, 0, p.rz - k.z);
      const len = dir.length();
      p.rope.position.set((p.rx + k.x) / 2, ROPE_Y, (p.rz + k.z) / 2);
      p.rope.scale.set(1, Math.max(0.01, len - 0.3), 1);
      p.rope.quaternion.setFromUnitVectors(up, dir.normalize());
    }
  }

  // 같이 하기: 방장이 보내는 판 상태 / 손님이 받는 판 상태
  const r2 = v => Math.round(v * 100) / 100;
  function snapshot() {
    const k = G.knot;
    return { kn: [r2(k.x), r2(k.z), r2(k.vx), r2(k.vz)], tp: G.players.map(p => [r2(p.stamina), r2(p.force), r2(p.prog)]) };
  }
  function apply(d) {
    if (Array.isArray(d.kn)) { const k = G.knot; k.x = +d.kn[0] || 0; k.z = +d.kn[1] || 0; k.vx = +d.kn[2] || 0; k.vz = +d.kn[3] || 0; }
    (Array.isArray(d.tp) ? d.tp : []).forEach((a, i) => {
      const p = G.players[i];
      if (!p || !Array.isArray(a)) return;
      p.stamina = +a[0] || 0; p.force = +a[1] || 0; p.prog = +a[2] || 0;
    });
  }
  // 손님 화면은 다음 상태가 올 때까지 매듭을 속도대로 미리 움직여 둔다
  function coast(dt) {
    const k = G.knot;
    k.x += k.vx * dt; k.z += k.vz * dt;
    const r = Math.hypot(k.x, k.z), max = TUG.GAP + 0.2;
    if (r > max) { k.x *= max / r; k.z *= max / r; }
  }

  return { build, simulate, place, sync, snapshot, apply, coast };
}
