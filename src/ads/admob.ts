// 앱(iOS·Android)의 AdMob 광고: 화면 아래 배너(판 중에도 떠 있다), 쉬는 틈의 전면 광고(policy.ts). 보상형은 쓰지 않는다
// (판 사이 흐름을 끊지 않게). 오마고 src/ads/admob.ts 를 옮긴 것.
// 광고 단위 ID 는 빌드 때 .env.app 의 VITE_ADMOB_* 로 넣는다. 비어 있으면 구글이 공개한 시험용 ID 로, 그 ID 는 늘 시험 광고만 낸다.
// (isTesting 옵션은 쓰지 않는다. 켜 두면 진짜 ID 까지 시험용으로 바꿔 버린다.)

import type { PluginListenerHandle } from '@capacitor/core'
import { Capacitor } from '@capacitor/core'
import { AdMob, AdmobConsentStatus, BannerAdPluginEvents, BannerAdPosition, BannerAdSize, InterstitialAdPluginEvents, MaxAdContentRating, type AdmobConsentInfo } from '@capacitor-community/admob'
import { readJson, writeJson } from './store.ts'
import type { AdService } from './ads.ts'
import { DEFAULT_RULE, EMPTY_HISTORY, onBreak, type AdHistory } from './policy.ts'

// https://developers.google.com/admob/ios/test-ads , /android/test-ads
const TEST_IDS = {
  ios: { banner: 'ca-app-pub-3940256099942544/2435281174', interstitial: 'ca-app-pub-3940256099942544/4411468910' },
  android: { banner: 'ca-app-pub-3940256099942544/9214589741', interstitial: 'ca-app-pub-3940256099942544/1033173712' },
}

const HISTORY_KEY = 'gokkal.ads'
/** 지난번에 받은 배너 높이. 광고가 오기 전에 이만큼 자리를 먼저 비운다(늦게 와도 판이 한 번 밀리지 않게) */
const BANNER_HEIGHT_KEY = 'gokkal.bannerHeight'
/** 지난번에 광고를 띄워도 된다는 동의를 받았는지. 오프라인으로 켜서 동의 확인이 안 될 때 쓴다 */
const CONSENT_KEY = 'gokkal.adsConsent'
/** 미리 받아 둔 광고는 한 시간쯤 지나면 못 쓴다 */
const STALE_MS = 50 * 60_000
/** 전면 광고가 닫혔다는 이벤트를 이만큼 기다린다 */
const INTERSTITIAL_MS = 120_000
/** 배너와 판 아래 줄(◀ 가져오기 ▶ 단추) 사이 틈. 바로 붙으면 누르려다 광고를 누른다(구글 정책에도 어긋난다) */
const AD_GAP = 14

function adIds() {
  const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
  const env = import.meta.env
  const p = platform === 'ios' ? 'IOS' : 'ANDROID'
  const pick = (key: string, fallback: string) => (env[`VITE_ADMOB_${p}_${key}`] as string | undefined) || fallback
  return { banner: pick('BANNER', TEST_IDS[platform].banner), interstitial: pick('INTERSTITIAL', TEST_IDS[platform].interstitial) }
}

function remember(info: AdmobConsentInfo): { canRequestAds: boolean; privacyRequired: boolean } {
  writeJson(CONSENT_KEY, info.canRequestAds)
  return { canRequestAds: info.canRequestAds, privacyRequired: info.privacyOptionsRequirementStatus === 'REQUIRED' }
}

/** 동의 확인(UMP). 구글 권고대로 SDK 를 켜기 전에 한다. 확인이 안 되면(오프라인 등) 지난번 결과를 믿고, 믿을 결과가 없으면 던진다 */
async function gatherConsent(): Promise<{ canRequestAds: boolean; privacyRequired: boolean }> {
  let info: AdmobConsentInfo | null = null
  try {
    info = await AdMob.requestConsentInfo()
    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) info = await AdMob.showConsentForm()
  } catch (e) {
    if (info && !info.canRequestAds) throw e
    if (!info) {
      const saved = readJson<boolean>(CONSENT_KEY)
      if (saved === null) throw e
      return { canRequestAds: saved === true, privacyRequired: false }
    }
  }
  return remember(info)
}

async function changeConsent(): Promise<{ canRequestAds: boolean; privacyRequired: boolean }> {
  await AdMob.showPrivacyOptionsForm()
  return remember(await AdMob.requestConsentInfo())
}

async function listen(handles: PluginListenerHandle[], p: Promise<PluginListenerHandle>): Promise<void> {
  handles.push(await p)
}

/** 아이도 하는 운동장 게임이라 광고는 모든 연령 등급(G)만 받는다. 정하지 않으면 SDK 가 성인용 광고까지 보낸다.
 *  도박·데이트 같은 분류는 AdMob 콘솔(차단 관리 > 민감한 카테고리)에서 따로 막는다(RELEASE.md). */
const INIT = { maxAdContentRating: MaxAdContentRating.General }

export async function createAdMob(restart: () => void): Promise<AdService> {
  const ids = adIds()
  const consent = await gatherConsent()
  // iOS 추적 허용 창은 앱을 켤 때 묻는다(오마버블이 "ATT 창을 못 찾음"으로 반려된 적이 있다, 2026-10-27)
  if (Capacitor.getPlatform() === 'ios' && consent.canRequestAds) {
    try {
      const { status } = await AdMob.trackingAuthorizationStatus()
      if (status === 'notDetermined') await AdMob.requestTrackingAuthorization()
    } catch {
      /* 묻지 못해도 광고는 맞춤 없이 나온다 */
    }
  }
  if (!consent.canRequestAds) {
    let privacyRequired = consent.privacyRequired
    return {
      banner: () => {},
      atBreak: async () => {},
      privacyOptionsRequired: () => privacyRequired,
      async showPrivacyOptions() {
        const c = await changeConsent()
        privacyRequired = c.privacyRequired
        if (c.canRequestAds) restart()
      },
      stop: async () => {},
    }
  }
  await AdMob.initialize(INIT)

  // 배너: 보일 화면에 들어올 때 받고 떠날 때 지운다(숨겨 두기는 쓰지 않는다: 보이지 않는 배너가 새로 고쳐지면 구글 정책에 어긋난다).
  // 배너가 화면 아래를 덮는 만큼(+ 틈) 페이지 아래에 자리를 비운다(App.css 의 --ad-space).
  let stopped = false
  const setSpace = (px: number) => document.documentElement.style.setProperty('--ad-space', `${px}px`)
  let bannerWanted = false
  let bannerPhase: 'off' | 'loading' | 'on' = 'off'
  await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
    if (stopped || size.height <= 0) return
    if (!bannerWanted) {
      bannerPhase = 'off'
      void AdMob.removeBanner().catch(() => {})
      return
    }
    bannerPhase = 'on'
    const height = Math.ceil(size.height)
    writeJson(BANNER_HEIGHT_KEY, height)
    setSpace(height + AD_GAP)
  })
  await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
    bannerPhase = 'off'
    if (!stopped) setSpace(0)
  })
  const showBanner = (show: boolean) => {
    if (stopped || show === bannerWanted) return
    bannerWanted = show
    if (!show) {
      setSpace(0)
      if (bannerPhase === 'on') {
        bannerPhase = 'off'
        void AdMob.removeBanner().catch(() => {})
      }
      return
    }
    const last = readJson<number>(BANNER_HEIGHT_KEY)
    if (typeof last === 'number' && last > 0) setSpace(last + AD_GAP)
    if (bannerPhase !== 'off') return
    bannerPhase = 'loading'
    void AdMob.showBanner({ adId: ids.banner, adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: 0 }).catch(() => {
      bannerPhase = 'off'
      if (!stopped) setSpace(0)
    })
  }

  // 전면 광고: 미리 하나 받아 둔다. 다 보고 닫았거나 띄우지 못했을 때 다음 것을 받는다
  let readyAt = 0
  const prepare = () =>
    AdMob.prepareInterstitial({ adId: ids.interstitial }).then(
      () => void (readyAt = Date.now()),
      () => void (readyAt = 0),
    )
  await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => void prepare())
  await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => void prepare())
  void prepare()
  const ready = (now: number) => readyAt > 0 && now - readyAt <= STALE_MS

  /** 전면 광고를 띄우고 닫힐 때까지 기다린다. 띄웠으면 true */
  const showInterstitial = () =>
    new Promise<boolean>((resolve) => {
      const handles: PluginListenerHandle[] = []
      let settled = false
      const finish = (shown: boolean) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        for (const h of handles) void h.remove()
        resolve(shown)
      }
      const timer = setTimeout(() => finish(true), INTERSTITIAL_MS)
      void Promise.all([
        listen(handles, AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => finish(true))),
        listen(handles, AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => finish(false))),
      ])
        .then(() => AdMob.showInterstitial())
        .catch(() => {
          finish(false)
          void prepare()
        })
    })

  let history: AdHistory = { ...EMPTY_HISTORY, ...readJson<AdHistory>(HISTORY_KEY) }
  let lastBreakAt = Date.now()
  let privacyRequired = consent.privacyRequired

  return {
    banner: showBanner,
    async atBreak(b) {
      if (stopped) return
      const now = Date.now()
      const r = onBreak(history, now, now - lastBreakAt, b, DEFAULT_RULE)
      lastBreakAt = now
      if (!r.show) history = r.next
      else if (!ready(now)) {
        history = r.skipped
        void prepare()
      } else {
        readyAt = 0
        history = (await showInterstitial()) ? r.next : r.skipped
      }
      writeJson(HISTORY_KEY, history)
    },
    privacyOptionsRequired: () => privacyRequired,
    async showPrivacyOptions() {
      privacyRequired = (await changeConsent()).privacyRequired
    },
    async stop() {
      stopped = true
      setSpace(0)
      await AdMob.removeBanner().catch(() => {})
    },
  }
}
