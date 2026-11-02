// 웹 판(GitHub Pages)의 광고: Google AdSense.
// - 판 사이 전면 광고: H5 게임 광고(Ad Placement API, adBreak). 앱과 같은 규칙(policy.ts)으로 띄운다.
// - 화면 아래 배너: 일반 디스플레이 광고 단위(VITE_ADSENSE_BANNER_SLOT 이 있을 때만).
// 게시자 ID(VITE_ADSENSE_CLIENT)가 없으면 이 파일을 불러오지 않는다(ads.ts). VITE_ADSENSE_TEST=1 이면 구글 시험 광고만 낸다.

import type { AdService } from './ads.ts'
import { DEFAULT_RULE, EMPTY_HISTORY, onBreak, type AdHistory } from './policy.ts'
import { readJson, writeJson } from './store.ts'

const HISTORY_KEY = 'gokkal.webAds'
/** 배너와 판 아래 줄(◀ 가져오기 ▶) 사이 틈. 바로 붙으면 누르려다 광고를 누른다(구글 정책에도 어긋난다) */
const AD_GAP = 14
const BANNER_H = 50
/** adBreak 가 끝났다는 알림(adBreakDone)을 이만큼 기다린다 */
const BREAK_MS = 90_000

type AdBreak = (o: Record<string, unknown>) => void
declare global {
  interface Window {
    adsbygoogle?: unknown[]
    adBreak?: AdBreak
    adConfig?: (o: Record<string, unknown>) => void
  }
}

function loadScript(client: string, test: boolean): Promise<void> {
  return new Promise((ok, no) => {
    const s = document.createElement('script')
    s.async = true
    s.crossOrigin = 'anonymous'
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`
    s.dataset.adClient = client
    if (test) s.dataset.adbreakTest = 'on'
    s.onload = () => ok()
    s.onerror = () => no(new Error('adsense'))
    document.head.appendChild(s)
  })
}

export async function createWebAds(): Promise<AdService> {
  const env = import.meta.env
  const client = String(env.VITE_ADSENSE_CLIENT || '')
  const slot = String(env.VITE_ADSENSE_BANNER_SLOT || '')
  const test = env.VITE_ADSENSE_TEST === '1'
  window.adsbygoogle = window.adsbygoogle || []
  // Ad Placement API 의 두 함수는 스크립트보다 먼저 정해 둔다(구글 안내대로)
  window.adBreak = window.adConfig = (o) => void window.adsbygoogle!.push(o)
  await loadScript(client, test)
  // 소리는 게임이 직접 켜고 끄니 광고에 알려 둔다. 미리 받아 두기는 켠다
  window.adConfig({ sound: 'on', preloadAdBreaks: 'on' })

  const setSpace = (px: number) => document.documentElement.style.setProperty('--ad-space', `${px}px`)
  let box: HTMLElement | null = null
  let stopped = false
  const showBanner = (show: boolean) => {
    if (stopped || !slot) return
    if (!show) {
      if (box) box.hidden = true
      setSpace(0)
      return
    }
    if (!box) {
      box = document.createElement('div')
      box.className = 'webad'
      const ins = document.createElement('ins')
      ins.className = 'adsbygoogle'
      ins.style.cssText = `display:inline-block;width:320px;height:${BANNER_H}px`
      ins.dataset.adClient = client
      ins.dataset.adSlot = slot
      if (test) ins.dataset.adtest = 'on'
      box.appendChild(ins)
      document.body.appendChild(box)
      window.adsbygoogle!.push({})
    }
    box.hidden = false
    setSpace(BANNER_H + AD_GAP)
  }

  let history: AdHistory = { ...EMPTY_HISTORY, ...readJson<AdHistory>(HISTORY_KEY) }
  let lastBreakAt = Date.now()
  const showBreak = () =>
    new Promise<boolean>((resolve) => {
      let done = false
      const finish = (shown: boolean) => {
        if (done) return
        done = true
        clearTimeout(timer)
        resolve(shown)
      }
      const timer = setTimeout(() => finish(false), BREAK_MS)
      window.adBreak!({
        type: 'next',
        name: 'between-matches',
        // viewed(다 봄)·dismissed(닫음)만 띄운 것으로 센다. notReady·frequencyCapped 등은 못 띄운 것
        adBreakDone: (info: { breakStatus?: string }) => finish(info?.breakStatus === 'viewed' || info?.breakStatus === 'dismissed'),
      })
    })

  return {
    banner: showBanner,
    async atBreak(b) {
      if (stopped) return
      const now = Date.now()
      const r = onBreak(history, now, now - lastBreakAt, b, DEFAULT_RULE)
      lastBreakAt = now
      history = r.show ? ((await showBreak()) ? r.next : r.skipped) : r.next
      writeJson(HISTORY_KEY, history)
    },
    privacyOptionsRequired: () => false,
    showPrivacyOptions: async () => {},
    async stop() {
      stopped = true
      setSpace(0)
      box?.remove()
    },
  }
}
