# 고깔 셋 앱 출시 준비 (iOS·Android)

코드는 준비돼 있어요. 아래는 계정·결제·서명이 필요한 일이에요. 지금 앱은 구글 **시험용 광고 ID** 로 만들어져 "Test Ad" 가 나와요.

## 수익 (오마고와 같은 규칙, 2026-11-02)

- 무료 + 광고. 배너는 화면 아래에 늘(판 중에도). 판 아래 줄(◀ 가져오기 ▶)은 배너 높이만큼 위로 올라간다(`--ad-space`).
- 전면 광고는 쉬는 틈에만: 결과 화면에서 다시 하기·방으로·처음으로를 누를 때, 처음 세 판 뒤 세 판마다 또는 15분마다(`src/ads/policy.ts`). 처음으로 나갈 때는 한 번 미룬다.
- 같이 하기의 손님은 전면 광고를 보지 않는다(방장 화면을 따라가야 해서). 방장은 판 사이에만 본다.
- 보상형 광고는 쓰지 않는다.
- "광고 없애기" 한 번 결제(비소모성). App Store `gokkal.remove_ads`, Play `remove_ads`. **값은 아직 정하지 않았다.**

## 1. AdMob (ohmalab@gmail.com, 게시자 pub-5991395996042876)

1. 앱 추가 두 번: iOS `com.gokkal.app`, Android `com.gokkal.app` (스토어에 아직 없으면 "게시 안 됨").
2. 앱마다 광고 단위 둘: 배너(적응형), 전면.
3. 차단 관리 > 민감한 카테고리: 도박·베팅, 데이트, 주류를 막는다(아이도 하는 게임).
4. 개인정보 보호 및 메시지: GDPR 메시지와 IDFA 안내 메시지(한국어) 게시.

## 2. ID 넣기

- 광고 단위 넷: `.env.app.example` 을 `.env.app` 으로 복사해 0 자리를 바꾼다(커밋하지 않음).
- iOS 앱 ID: `ios/App/App/Info.plist` 의 `GADApplicationIdentifier`(지금은 구글 시험용).
- Android 앱 ID: `android/gradle.properties` 에 `ADMOB_APP_ID=ca-app-pub-5991395996042876~…`.
- 그다음 `bash scripts/cap-sync.sh`. 여섯 자리가 모두 우리 게시자 번호의 ID 가 아니면 멈춘다.
  시뮬레이터에서 시험 광고로 볼 때는 `bash scripts/cap-sync.sh --dirty --test-ads`.

## 3. 스토어 기록

- App Store Connect: 새 앱 `com.gokkal.app`, 이름은 `store/listing.md`, 앱 내 구입 비소모성 `gokkal.remove_ads`.
- Play Console(조직 오마랩): 새 앱, 인앱 상품 `remove_ads`, 광고 포함 표시.
- 개인정보 처리방침 주소: https://shpeterpan.github.io/gokkal/privacy.html (원본 `store/privacy.html`, `npm run pages` 가 함께 올린다).
- App Store 개인정보(영양 성분표): 기기 ID(광고용, 추적), 사용 데이터(광고 데이터). 카메라 화면은 모으지 않는다.
- Play 데이터 보안: 기기 ID(광고, AdMob), 앱 활동(광고). 위치·연락처 없음.
- 연령 등급: 폭력·도박 없음. 같이 하기는 같은 자리의 친구끼리 휴대폰을 직접 잇는 것(채팅 없음, 낯선 사람과 이어지지 않음).
- 심사 메모: 혼자 하기로 모든 화면을 볼 수 있다. 같이 하기는 휴대폰 두 대가 필요하다(한 대가 방 만들기 → 친구 부르기 QR, 다른 한 대가 그 QR을 카메라로 찍으면 웹 판이 열리고, 그 화면의 QR을 방장이 찍는다). 서버는 없다.
- 제출 전에는 `store-review-preflight` 스킬과 `~/src/ohma-release` 를 거친다.

## 웹 판 광고 (AdSense, 코드는 들어가 있음)

- 판 사이 전면 광고는 AdSense H5 게임 광고(Ad Placement API, `adBreak`)로 앱과 같은 규칙, 화면 아래 배너는 디스플레이 광고 단위(320x50).
- 게시자 ID 를 넣기 전에는 웹이 광고 없이 만들어진다. 넣는 법: `.env.web.example` 을 `.env.production.local` 로 복사해 `VITE_ADSENSE_CLIENT`(ca-pub-…), `VITE_ADSENSE_BANNER_SLOT` 을 채우고 `npm run pages`.
- 사용자가 할 일: AdSense 계정(ohmalab@gmail.com), 사이트 추가, H5 게임 광고 신청, 개인정보 보호 및 메시지(GDPR) 게시.
- ads.txt 는 도메인 맨 위에 있어야 한다. `shpeterpan.github.io/gokkal/` 은 맨 위가 아니라서, 사용자 사이트 저장소(`shpeterpan.github.io`)를 만들어 ads.txt 를 두거나 ohmalab.com 같은 내 도메인으로 옮겨야 한다. github.io 주소는 승인이 어려울 수 있다.
- 화면 확인: `VITE_ADSENSE_CLIENT=ca-pub-1234567890123456 VITE_ADSENSE_BANNER_SLOT=1234567890 VITE_ADSENSE_TEST=1 npx vite build` 로 만들면 구글 시험 광고("Interstitial ad example")가 뜬다(2026-11-02 확인).

## 4. 남은 일

- 스토어 스크린샷(한국어·영어, 1인칭·3인칭·같이 하기 QR).
- iOS 영어 권한 문구(`en.lproj/InfoPlist.strings`): 지금 카메라·로컬 네트워크·추적 문구가 한국어뿐이다. Android 앱 이름은 `values-en` 에 영어가 있다.
- 실제 휴대폰 두 대로 같이 하기 확인(같은 와이파이, 방장 핫스팟, 앱↔웹). 시험 브라우저로는 끝까지 됐다.
- 웹 판은 앱이 나와도 닫지 않는다: 앱이 없는 친구가 초대 QR로 웹 판을 열어 같이 한다.

## 빌드

- 웹(GitHub Pages): `npm run pages` 뒤 커밋·푸시. 광고 없는 판.
- iOS: `bash scripts/cap-sync.sh` 뒤 Xcode 에서 보관(Archive).
- Android: `cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew bundleRelease`(서명 설정 필요).
- 아이콘·시작 화면을 바꾸면 `python3 scripts/native-assets.py`.
