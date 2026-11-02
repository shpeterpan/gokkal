import { describe, it, expect } from 'vitest'
import { onBreak, EMPTY_HISTORY, DEFAULT_RULE, type AdHistory } from './policy.ts'

const MIN = 60_000
const runs = (n: number, start: AdHistory = EMPTY_HISTORY) => {
  let h = start
  let shown = 0
  for (let i = 0; i < n; i++) {
    const r = onBreak(h, (i + 1) * 10 * MIN, 5 * MIN, { kind: 'run' })
    if (r.show) shown++
    h = r.next
  }
  return { h, shown }
}

describe('전면 광고 차례', () => {
  it('처음 세 판은 없고, 그 뒤 세 판마다 한 번', () => {
    expect(runs(2).shown).toBe(0)
    expect(runs(3).shown).toBe(1)
    expect(runs(6).shown).toBe(2)
  })
  it('달 넘김은 15분이 쌓였을 때만', () => {
    const h: AdHistory = { runs: 5, sinceLast: 0, playSinceLast: 0, lastShownAt: 0 }
    expect(onBreak(h, 60 * MIN, 10 * MIN, { kind: 'month' }).show).toBe(false)
    expect(onBreak({ ...h, playSinceLast: 10 * MIN }, 60 * MIN, 6 * MIN, { kind: 'month' }).show).toBe(true)
  })
  it('처음 화면으로 나갈 때는 한 번 미루고, 다음 틈에 띄운다', () => {
    const h: AdHistory = { runs: 5, sinceLast: 2, playSinceLast: 0, lastShownAt: 0 }
    const a = onBreak(h, 60 * MIN, MIN, { kind: 'run', leaving: true })
    expect(a.show).toBe(false)
    expect(onBreak(a.next, 61 * MIN, MIN, { kind: 'run', leaving: true }).show).toBe(true)
  })
  it('켜 둔 채 자리를 비운 시간은 30분까지만 센다', () => {
    const r = onBreak(EMPTY_HISTORY, 0, 5 * 60 * MIN, { kind: 'month' })
    expect(r.next.playSinceLast).toBe(30 * MIN)
    expect(DEFAULT_RULE.freeRuns).toBe(3)
  })
})
