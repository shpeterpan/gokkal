// 전면 광고를 언제 띄울지(사용자 2026-11-02: 판 중엔 광고 없음, 판 사이 세 판 또는 15분에 한 번, 보상형 없음).
// 오마고에서 옮겨 온 규칙. 진 직후(끝 화면이 뜨는 순간)가 아니라, 끝 화면을 보고 다음을 고른 뒤에 띄운다.
// 고깔 셋은 판이 끝나 다음으로 갈 때(run)만 쓴다(month 는 오마고의 달 넘김, 남겨 둔다). 처음 freeRuns 판은 띄우지 않는다.
// 처음 화면으로 나갈 때는 한 번 미룬다(그날의 마지막 기억이 광고가 되지 않게). 미룬 차례는 다음 틈에 그대로 남는다.

export interface InterstitialRule {
  freeRuns: number
  every: number
  playMs: number
  minIntervalMs: number
}

export const DEFAULT_RULE: InterstitialRule = { freeRuns: 3, every: 3, playMs: 15 * 60_000, minIntervalMs: 3 * 60_000 }

export interface AdHistory {
  /** 지금까지 끝낸 판 */
  runs: number
  /** 마지막 광고 뒤로 끝낸 판 */
  sinceLast: number
  /** 마지막 광고 뒤로 한 시간(쉬는 틈마다 더한다) */
  playSinceLast: number
  lastShownAt: number | null
  /** 처음 화면으로 나가서 차례를 한 번 미뤘다(연달아 미루지 않는다) */
  heldOnLeave?: boolean
}

export const EMPTY_HISTORY: AdHistory = { runs: 0, sinceLast: 0, playSinceLast: 0, lastShownAt: null }

/** 쉬는 틈의 종류: 판이 끝나 다음으로 / 달을 넘겨 장터로 */
export interface Break {
  kind: 'run' | 'month'
  /** 처음 화면으로 나간다 */
  leaving?: boolean
}

/** 지난 틈 뒤로 한 시간. 켜 둔 채 자리를 비운 시간까지 세지 않게 한 번에 30분까지만 */
export const MAX_SEGMENT_MS = 30 * 60_000

/** 쉬는 틈에 광고를 띄울지와 새 기록. skipped 는 띄우려 했지만 못 띄웠을 때 쓸 기록(센 것만 늘린다). */
export function onBreak(h: AdHistory, now: number, playMs: number, b: Break, rule: InterstitialRule = DEFAULT_RULE): { show: boolean; next: AdHistory; skipped: AdHistory } {
  const run = b.kind === 'run' ? 1 : 0
  const skipped: AdHistory = {
    runs: h.runs + run,
    sinceLast: h.sinceLast + run,
    playSinceLast: (h.playSinceLast || 0) + Math.min(MAX_SEGMENT_MS, Math.max(0, playMs || 0)),
    lastShownAt: h.lastShownAt,
    ...(h.heldOnLeave ? { heldOnLeave: true } : {}),
  }
  const enough = b.kind === 'run' ? skipped.sinceLast >= rule.every || skipped.playSinceLast >= rule.playMs : skipped.playSinceLast >= rule.playMs
  const due = skipped.runs >= rule.freeRuns && enough && (h.lastShownAt === null || now - h.lastShownAt >= rule.minIntervalMs)
  const hold = due && !!b.leaving && !h.heldOnLeave
  const show = due && !hold
  return {
    show,
    next: show ? { runs: skipped.runs, sinceLast: 0, playSinceLast: 0, lastShownAt: now } : hold ? { ...skipped, heldOnLeave: true } : skipped,
    skipped,
  }
}
