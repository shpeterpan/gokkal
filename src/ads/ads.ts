// 화면은 광고를 이 모듈로만 부른다. 광고 SDK 를 화면에서 직접 부르지 않는다.
// 웹은 아무것도 띄우지 않는다. 앱 빌드(VITE_ADS=admob)를 네이티브에서 돌릴 때만 AdMob 을 불러온다.
// 빌드 설정이 상수로 바뀌어 웹 번들에는 AdMob 코드가 들어가지 않는다.
// 고깔 셋의 광고(오마고와 같은 규칙, 2026-11-02): 판 중에도 떠 있는 아래 배너 하나, 판 사이 전면 광고(policy.ts), 보상형 없음, 광고 없애기 한 번 결제.
// 오마고 src/ads 를 그대로 옮겨 왔다.

import { Capacitor } from '@capacitor/core'
import type { Break } from './policy.ts'
import { isAdFree, onAdFree } from './purchase.ts'

export interface AdService {
  /** 아래 배너를 보일지 */
  banner(show: boolean): void
  /** 쉬는 틈(판이 끝나 다음 판·방·처음 화면으로). 규칙에 맞으면 전면 광고를 띄우고 닫힐 때까지 기다린다. 판 도중에는 부르지 않는다. */
  atBreak(b: Break): Promise<void>
  /** 광고 개인정보 설정(동의 다시 고르기)을 보여 줘야 하는지(유럽 등) */
  privacyOptionsRequired(): boolean
  showPrivacyOptions(): Promise<void>
  /** 광고를 모두 내린다(광고 없애기를 샀을 때) */
  stop(): Promise<void>
}

const none: AdService = {
  banner: () => {},
  atBreak: async () => {},
  privacyOptionsRequired: () => false,
  showPrivacyOptions: async () => {},
  stop: async () => {},
}

let impl: AdService = none
/** 배너를 보일 화면인지. 광고를 늦게 켜도 그때 화면에 맞춰 배너를 띄운다. */
let bannerShown = false
let stopped = false

export const ads: AdService = {
  banner: (show) => {
    bannerShown = show
    impl.banner(show)
  },
  atBreak: (b) => impl.atBreak(b),
  privacyOptionsRequired: () => impl.privacyOptionsRequired(),
  showPrivacyOptions: () => impl.showPrivacyOptions(),
  stop: () => impl.stop(),
}

/** 광고를 켜는 빌드인지 */
export const adsBuild = (): boolean => import.meta.env.VITE_ADS === 'admob' && Capacitor.isNativePlatform()

function stopAds(): void {
  stopped = true
  stopRetrying()
  const was = impl
  impl = none
  void was.stop().catch(() => {})
}

let starting = false
let watching = false
let retrying: (() => void) | null = null

/** 앱을 켤 때 한 번. 광고를 못 띄워도 게임은 그대로 된다. 켜다가 실패하면 앱이 다시 앞에 오거나 인터넷이 돌아올 때 다시 해 본다. */
export async function startAds(): Promise<void> {
  // 빌드 설정을 여기 그대로 적어야 웹 번들에서 아래 AdMob 불러오기가 통째로 빠진다
  if (import.meta.env.VITE_ADS !== 'admob' || !Capacitor.isNativePlatform()) return
  if (starting || stopped) return
  if (isAdFree()) return stopAds()
  if (!watching) {
    watching = true
    onAdFree(stopAds)
  }
  starting = true
  try {
    const { createAdMob } = await import('./admob.ts')
    const made = await createAdMob(() => {
      impl = none
      void startAds()
    })
    if (stopped) void made.stop().catch(() => {})
    else {
      impl = made
      if (bannerShown) made.banner(true)
    }
    stopRetrying()
  } catch {
    impl = none
    retryLater()
  } finally {
    starting = false
  }
}

function retryLater(): void {
  if (retrying) return
  const again = () => void startAds()
  const onVisible = () => {
    if (document.visibilityState === 'visible') again()
  }
  window.addEventListener('online', again)
  document.addEventListener('visibilitychange', onVisible)
  retrying = () => {
    window.removeEventListener('online', again)
    document.removeEventListener('visibilitychange', onVisible)
    retrying = null
  }
}

function stopRetrying(): void {
  retrying?.()
}
