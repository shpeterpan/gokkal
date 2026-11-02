// 광고·결제 기록을 기기에 둔다. 저장이 막혀 있어도 게임은 그대로 된다.
export function readJson<T>(key: string): T | null {
  try {
    const s = localStorage.getItem(key)
    return s ? (JSON.parse(s) as T) : null
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 저장하지 못해도 광고 차례만 처음부터 다시 센다 */
  }
}
