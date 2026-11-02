#!/usr/bin/env bash
# 웹 판(GitHub Pages)을 만든다: 광고 없는 번들을 dist 에 만들고 docs/ 로 옮긴다. 처리방침(store/privacy.html)도 같이.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
npx vite build
rm -rf docs && mkdir docs
cp -a dist/. docs/
cp store/privacy.html docs/privacy.html
touch docs/.nojekyll
echo "==> docs/ 준비됨. 커밋하고 main 에 푸시하면 https://shpeterpan.github.io/gokkal/ 에 올라간다."
