// 앱 화면 아래 배너 자리(style.css 의 --ad-space). 광고가 떴든, 못 받았든(No fill·오프라인), 광고 없애기를 샀든,
// 동의를 안 했든, 광고를 아직 켜기 전이든 늘 같은 높이를 비운다. 광고가 오고 가는 데 따라 판 아래 줄(◀ 가져오기 ▶)이 움직이지 않게(2026-11-03).
// 배너를 내린 화면(QR 찍기)과 웹은 여기서 0. 웹 판 AdSense 배너는 web.ts 가 따로 비운다.
// 자리는 ads.ts 가 배너를 보일지 정할 때 맞추고, 배너 높이는 admob.ts 가 광고를 받을 때 알려 준다.

import { readJson, writeJson } from './store.ts'

/** 지난번에 받은 배너 높이. 광고가 없는 판에서도 이만큼 비운다 */
const BANNER_HEIGHT_KEY = 'gokkal.bannerHeight'
/** 배너와 판 아래 줄(◀ 가져오기 ▶ 단추) 사이 틈. 바로 붙으면 누르려다 광고를 누른다(구글 정책에도 어긋난다) */
export const AD_GAP = 14

/** 배너를 아직 한 번도 받지 못한 기기의 높이. 휴대폰의 적응형 배너는 화면 너비의 6분의 1쯤(390pt → 61pt), 50~90 사이 */
function guessHeight(): number {
  const width = typeof window === 'undefined' ? 390 : window.innerWidth
  return Math.min(90, Math.max(50, Math.round(width / 6.4)))
}

function bannerHeight(): number {
  const saved = readJson<number>(BANNER_HEIGHT_KEY)
  return typeof saved === 'number' && saved > 0 ? saved : guessHeight()
}

let shown = false

function apply(): void {
  document.documentElement.style.setProperty('--ad-space', shown ? `${bannerHeight() + AD_GAP}px` : '0px')
}

/** 광고를 켠 앱 빌드에서 배너를 보일 화면이면 true, 내릴 화면이면 false */
export function reserveBannerSpace(show: boolean): void {
  shown = show
  apply()
}

/** 받은 배너의 실제 높이. 지난번과 다르면(처음 받았거나 화면이 바뀌었다) 자리를 그 높이로 맞춘다 */
export function rememberBannerHeight(height: number): void {
  if (height <= 0 || readJson<number>(BANNER_HEIGHT_KEY) === height) return
  writeJson(BANNER_HEIGHT_KEY, height)
  apply()
}
