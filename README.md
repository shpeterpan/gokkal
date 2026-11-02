# 고깔 셋

가운데 고깔 다섯 개 중 셋을 내 자리로 옮겨 1초 버티면 이기는 운동장 게임.

- 혼자: 봇 2~5명과
- 같이: 서버 없이 휴대폰끼리 바로 잇는다(WebRTC). 방장 화면의 QR을 친구가 카메라로 찍고, 친구 화면에 뜬 답 QR을 방장이 찍는다.

웹(광고 없음)은 https://shpeterpan.github.io/gokkal/ , 앱(iOS·Android, 광고)은 Capacitor 로 같은 번들을 싣는다.

- `npm run dev` 개발, `npm run pages` 웹 판을 `docs/` 로, `bash scripts/cap-sync.sh` 앱 번들
- 출시 준비는 `RELEASE.md`, 스토어 문구는 `store/listing.md`
