#!/usr/bin/env bash
# 앱(iOS·Android)에 넣을 웹 번들을 광고 켠 설정(VITE_ADS=admob)으로 만들어 두 프로젝트에 복사한다.
# 광고 단위 ID 는 .env.app 의 VITE_ADMOB_* 에서 읽는다(.env.app.example).
#   bash scripts/cap-sync.sh                     # 스토어에 올릴 빌드: 커밋한 상태 + 진짜 광고 ID 가 다 있어야 한다
#   bash scripts/cap-sync.sh --dirty --test-ads  # 시뮬레이터에서 볼 때: 커밋 안 한 편집까지, 구글 시험용 광고로
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
DIRTY=0; TEST_ADS=0
for a in "$@"; do
  case "$a" in
    --dirty) DIRTY=1 ;;
    --test-ads) TEST_ADS=1 ;;
    *) echo "cap-sync.sh: 모르는 옵션 $a" >&2; exit 1 ;;
  esac
done
if [ "$DIRTY" = 0 ] && [ -n "$(git status --porcelain -- src public index.html vite.config.js capacitor.config.ts package.json package-lock.json 2>/dev/null)" ]; then
  echo "cap-sync.sh: 커밋 안 한 편집이 있다. 커밋하거나, 일부러면 --dirty." >&2; exit 1
fi
PUB=5991395996042876
if [ "$TEST_ADS" = 0 ]; then
  # 진짜 광고로 만들 때: 광고 단위 넷과 앱 ID 둘이 모두 우리 게시자 번호의 진짜 ID 여야 한다(빈 값·시험용·예시의 0 은 멈춘다)
  bad=""
  for k in IOS_BANNER IOS_INTERSTITIAL ANDROID_BANNER ANDROID_INTERSTITIAL; do
    v="$(grep -E "^VITE_ADMOB_$k=" .env.app 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
    [[ "$v" =~ ^ca-app-pub-$PUB/[0-9]{10}$ && "$v" != *"/0000000000" ]] || bad="$bad $k"
  done
  ios_app="$(plutil -extract GADApplicationIdentifier raw ios/App/App/Info.plist 2>/dev/null || true)"
  [[ "$ios_app" =~ ^ca-app-pub-$PUB~[0-9]{10}$ ]] || bad="$bad iOS앱ID(Info.plist)"
  and_app="$(grep -E '^ADMOB_APP_ID=' android/gradle.properties 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
  [[ "$and_app" =~ ^ca-app-pub-$PUB~[0-9]{10}$ ]] || bad="$bad Android앱ID(gradle.properties)"
  if [ -n "$bad" ]; then
    echo "cap-sync.sh: 진짜 광고 ID 가 없다:$bad" >&2
    echo "  .env.app 과 앱 ID 를 채우거나, 시험 광고로 볼 거면 --test-ads." >&2
    exit 1
  fi
fi

npx vitest run --silent >/dev/null
if [ "$TEST_ADS" = 1 ]; then
  # 시험 광고: .env.app 에 진짜 ID 가 있어도 번들에 넣지 않는다(내 기기에 진짜 광고가 뜨면 무효 트래픽)
  VITE_ADS=admob VITE_ADMOB_IOS_BANNER= VITE_ADMOB_IOS_INTERSTITIAL= VITE_ADMOB_ANDROID_BANNER= VITE_ADMOB_ANDROID_INTERSTITIAL= npx vite build --mode app
  echo "==> 구글 시험용 광고로 만든다(스토어에 올리면 안 된다)."
else
  VITE_ADS=admob npx vite build --mode app
fi
test -f dist/index.html
ls dist/assets/admob-*.js >/dev/null 2>&1 || { echo "cap-sync.sh: 번들에 광고 코드가 없다(VITE_ADS 를 못 읽었다)." >&2; exit 1; }
npx cap sync
