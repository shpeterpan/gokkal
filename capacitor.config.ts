import type { CapacitorConfig } from '@capacitor/cli'

/**
 * 앱(iOS·Android) 껍데기 설정. 웹 번들(dist)을 그대로 싣는다(scripts/cap-sync.sh).
 * 앱 이름은 iOS Info.plist 의 CFBundleDisplayName, Android strings.xml 의 app_name 에서 "고깔 셋"으로 둔다.
 */
const config: CapacitorConfig = {
  appId: 'com.gokkal.app',
  appName: 'Gokkal',
  webDir: 'dist',
  // https 스킴이어야 Android 에서 localStorage·카메라가 보안 출처 규칙으로 돈다
  server: { androidScheme: 'https' },
  ios: {
    // 세이프에어리어는 CSS env() 로 이미 처리한다. WebView 가 따로 밀지 않게
    contentInset: 'never',
  },
}

export default config
