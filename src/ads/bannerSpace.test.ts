import { beforeEach, describe, expect, it, vi } from 'vitest'

// 앱은 광고가 있든 없든 배너 자리를 같은 높이로 비운다(bannerSpace.ts). 판 아래 줄(◀ 가져오기 ▶)이 움직이지 않게.
// AdMob 플러그인은 이벤트만 흉내 낸다.
const m = vi.hoisted(() => {
  const listeners = new Map<string, ((data: unknown) => void)[]>()
  return {
    native: true,
    adFree: false,
    listeners,
    emit(event: string, data?: unknown) {
      for (const f of listeners.get(event) ?? []) f(data)
    },
    AdMob: {
      requestConsentInfo: vi.fn(async () => ({
        canRequestAds: true,
        isConsentFormAvailable: false,
        status: 'OBTAINED',
        privacyOptionsRequirementStatus: 'NOT_REQUIRED',
      })),
      showConsentForm: vi.fn(),
      initialize: vi.fn(async () => {}),
      addListener: vi.fn(async (event: string, f: (data: unknown) => void) => {
        listeners.set(event, [...(listeners.get(event) ?? []), f])
        return { remove: async () => {} }
      }),
      showBanner: vi.fn(async () => {}),
      removeBanner: vi.fn(async () => {}),
      prepareInterstitial: vi.fn(async () => ({})),
    },
  }
})

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => m.native, getPlatform: () => 'android' } }))
vi.mock('./purchase.ts', () => ({ isAdFree: () => m.adFree, onAdFree: () => () => {} }))
vi.mock('@capacitor-community/admob', () => ({
  AdMob: m.AdMob,
  AdmobConsentStatus: { REQUIRED: 'REQUIRED' },
  BannerAdPluginEvents: { SizeChanged: 'bannerAdSizeChanged', FailedToLoad: 'bannerAdFailedToLoad' },
  BannerAdPosition: { BOTTOM_CENTER: 'BOTTOM_CENTER' },
  BannerAdSize: { ADAPTIVE_BANNER: 'ADAPTIVE_BANNER' },
  MaxAdContentRating: { General: 'General' },
  InterstitialAdPluginEvents: { Dismissed: 'interstitialAdDismissed', FailedToShow: 'interstitialAdFailedToShow' },
}))

const store = new Map<string, string>()
const css = new Map<string, string>()
beforeEach(() => {
  vi.resetModules()
  m.native = true
  m.adFree = false
  m.listeners.clear()
  m.AdMob.showBanner.mockClear()
  m.AdMob.removeBanner.mockClear()
  store.clear()
  css.clear()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
  vi.stubGlobal('window', Object.assign(new EventTarget(), { innerWidth: 390 }))
  vi.stubGlobal(
    'document',
    Object.assign(new EventTarget(), {
      visibilityState: 'visible',
      documentElement: { style: { setProperty: (k: string, v: string) => void css.set(k, v) } },
    }),
  )
  vi.stubEnv('VITE_ADS', 'admob')
})

const space = () => css.get('--ad-space') ?? '0px'
const loaded = (height: number) => m.emit('bannerAdSizeChanged', { width: 390, height })

describe('배너 자리', () => {
  it('광고를 켜기 전에도, 받아도, 못 받아도 자리는 같다', async () => {
    store.set('gokkal.bannerHeight', '60')
    const { ads, startAds } = await import('./ads.ts')
    ads.banner(true)
    expect(space()).toBe('74px')

    await startAds()
    expect(m.AdMob.showBanner).toHaveBeenCalledOnce()
    loaded(60)
    expect(space()).toBe('74px')

    m.emit('bannerAdFailedToLoad', { code: 3, message: 'No fill' })
    expect(space()).toBe('74px')
  })

  it('광고 없애기를 샀어도 자리를 비운다', async () => {
    store.set('gokkal.bannerHeight', '60')
    m.adFree = true
    const { ads, startAds } = await import('./ads.ts')
    await startAds()
    ads.banner(true)
    expect(space()).toBe('74px')
    expect(m.AdMob.showBanner).not.toHaveBeenCalled()
  })

  it('광고를 내리는 화면(QR 찍기)에서만 0 이다', async () => {
    store.set('gokkal.bannerHeight', '60')
    const { ads, startAds } = await import('./ads.ts')
    ads.banner(true)
    await startAds()
    ads.banner(false)
    expect(space()).toBe('0px')
    ads.banner(true)
    expect(space()).toBe('74px')
  })

  it('배너를 한 번도 못 받은 기기는 화면 너비로 어림하고, 처음 받으면 그 높이로 맞춘다', async () => {
    const { ads, startAds } = await import('./ads.ts')
    ads.banner(true)
    expect(space()).toBe('75px')
    await startAds()
    loaded(62)
    expect(space()).toBe('76px')
    expect(store.get('gokkal.bannerHeight')).toBe('62')
  })

  it('웹(앱 광고 없는 빌드)은 0', async () => {
    m.native = false
    const { ads } = await import('./ads.ts')
    ads.banner(true)
    expect(space()).toBe('0px')
  })
})
