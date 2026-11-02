#!/bin/bash
# index.html 은 아티팩트 형식(문서 머리 없음)이라, 일반 주소용으로 머리를 붙여 docs/ 에 만든다(GitHub Pages 가 docs/ 를 낸다).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p docs
{
  cat <<'HEAD'
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="description" content="고깔 다섯 개 중 셋을 내 자리에 모아 1초 버티는 운동장 게임">
<meta name="theme-color" content="#E9EFF1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#10161B" media="(prefers-color-scheme: dark)">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:border-box}</style>
</head>
<body>
HEAD
  cat index.html
  printf '\n</body>\n</html>\n'
} > docs/index.html
echo "docs/index.html $(wc -c < docs/index.html) bytes"
