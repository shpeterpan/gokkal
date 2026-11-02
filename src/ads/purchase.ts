// 앱의 "광고 없애기" 한 번 결제(오마스도쿠 src/ads/purchase.ts 와 같은 방식). 산 뒤로는 배너·전면 광고가 없다.
// 웹은 원래 광고가 없어 아무것도 하지 않는다. 앱 빌드(VITE_ADS=admob)를 네이티브에서 돌릴 때만 결제 모듈을 불러온다.
// 산 기록은 기기에 적어 둔다(오프라인으로 켜도 광고가 다시 뜨지 않게). 켤 때마다 스토어에 다시 물어 다른 기기에서 산 것도 받고,
// 안드로이드는 확인(acknowledge)이 빠진 결제를 마저 확인한다(3일 안에 확인하지 않으면 구글이 환불한다).
// 스토어가 산 기록을 돌려주지 않아도 기기의 기록은 지우지 않는다(Apple ID 를 잠깐 로그아웃한 사람에게 광고가 다시 뜨지 않게).

import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { readJson, writeJson } from './store.ts'

const AD_FREE_KEY = 'gokkal.adFree'
/** 스토어에 만든 비소모성 상품 ID. App Store 는 개발자 계정 전체에서 하나뿐이어야 해서 앱 이름을 붙이고, Play 는 앱마다 따로 */
const productId = (): string =>
  (import.meta.env.VITE_IAP_REMOVE_ADS as string | undefined) || (Capacitor.getPlatform() === 'ios' ? 'gokkal.remove_ads' : 'remove_ads')

export type BuyResult = 'bought' | 'pending' | 'cancelled' | 'failed'
/** 구매 복원: 찾음 / 산 기록 없음 / 스토어에 닿지 못함 */
export type RestoreResult = 'found' | 'none' | 'failed'

const isAndroid = (): boolean => Capacitor.getPlatform() === 'android'

type Plugin = typeof import('@capgo/native-purchases')
let plugin: Plugin | null = null
let adFree = readJson<boolean>(AD_FREE_KEY) === true
const listeners = new Set<() => void>()

/** 결제를 받는 빌드인지(광고를 켠 앱) */
export const purchasesAvailable = (): boolean => import.meta.env.VITE_ADS === 'admob' && Capacitor.isNativePlatform()

export const isAdFree = (): boolean => adFree

/** 광고 없애기를 산 순간(복원 포함) 한 번 불린다. 떼는 함수를 돌려준다. */
export function onAdFree(fn: () => void): () => void {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

function grant(): void {
  if (adFree) return
  adFree = true
  writeJson(AD_FREE_KEY, true)
  for (const fn of listeners) fn()
}

async function load(): Promise<Plugin> {
  plugin ??= await import('@capgo/native-purchases')
  return plugin
}

/** 스토어에 산 기록이 있는지 본다. 있으면 광고를 끈다. */
async function checkOwned(): Promise<boolean> {
  const { NativePurchases, PURCHASE_TYPE } = await load()
  const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP, onlyCurrentEntitlements: true })
  // 안드로이드 purchaseState: "1" 결제 끝, "2" 대기. iOS 에는 없다(현재 권리만 받았으니 있으면 산 것).
  const mine = purchases.filter((p) => p.productIdentifier === productId() && (p.purchaseState === undefined || p.purchaseState === '1'))
  for (const p of mine) {
    if (p.isAcknowledged === false && p.purchaseToken) await NativePurchases.acknowledgePurchase({ purchaseToken: p.purchaseToken }).catch(() => {})
  }
  if (mine.length) grant()
  return mine.length > 0
}

/** 앱을 켤 때 한 번. 스토어가 늦게 답하면 기다리지 않고 넘어간다(답이 오면 그때 광고를 끈다). */
export async function startPurchases(timeoutMs = 3000): Promise<void> {
  if (!purchasesAvailable()) return
  void watchPurchases()
  const check = checkOwned().catch(() => false)
  if (adFree) return
  await Promise.race([check, new Promise((r) => setTimeout(r, timeoutMs))])
}

/** 결제 흐름 밖에서 들어오는 결제(대기하던 결제, 자녀 구매 승인, 코드 상환)를 받는다 */
async function watchPurchases(): Promise<void> {
  try {
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && !adFree) void checkOwned().catch(() => {})
    })
    if (isAndroid()) return
    const { NativePurchases } = await load()
    await NativePurchases.addListener('transactionUpdated', (t) => {
      if (t.productIdentifier === productId() && !t.revocationDate) grant()
    })
  } catch {
    /* 알림을 못 받아도 다음에 켤 때 스토어에 묻는다 */
  }
}

/** 스토어에 적힌 가격("₩5,900"). 못 불러오면 null */
export async function removeAdsPrice(): Promise<string | null> {
  if (!purchasesAvailable()) return null
  try {
    const { NativePurchases, PURCHASE_TYPE } = await load()
    const { product } = await NativePurchases.getProduct({ productIdentifier: productId(), productType: PURCHASE_TYPE.INAPP })
    return product.priceString || null
  } catch {
    return null
  }
}

export async function buyRemoveAds(): Promise<BuyResult> {
  if (!purchasesAvailable()) return 'failed'
  try {
    const { NativePurchases, PURCHASE_TYPE } = await load()
    // 안드로이드는 플러그인이 확인을 걸어 두고 바로 연결을 끊어 확인이 빠질 수 있다. 직접 확인한다.
    const t = await NativePurchases.purchaseProduct({ productIdentifier: productId(), productType: PURCHASE_TYPE.INAPP, autoAcknowledgePurchases: !isAndroid() })
    if (isAndroid() && t.purchaseToken) await NativePurchases.acknowledgePurchase({ purchaseToken: t.purchaseToken }).catch(() => {})
    grant()
    return 'bought'
  } catch (e) {
    const err = e as { code?: unknown; message?: unknown } | null
    const text = `${String(err?.code ?? '')} ${String(err?.message ?? e)}`
    if (/cancel/i.test(text)) return 'cancelled'
    if (/pending/i.test(text)) return 'pending'
    if (/ALREADY_OWNED/.test(text)) return (await restoreRemoveAds()) === 'found' ? 'bought' : 'failed'
    return 'failed'
  }
}

/** 전에 산 것을 되살린다(새 기기, 앱을 지웠다 깐 경우). */
export async function restoreRemoveAds(): Promise<RestoreResult> {
  if (!purchasesAvailable()) return 'failed'
  try {
    const { NativePurchases } = await load()
    await NativePurchases.restorePurchases()
    return (await checkOwned()) ? 'found' : 'none'
  } catch {
    return 'failed'
  }
}
