#!/bin/bash
# $(dirname $0) should point to ~/.npm/_npx/.../node_modules/.bin

Bundle="ProseEditor"
bundle="prose-editor"
echo $bundle
mkdir -p ./$Bundle
cd ./$Bundle
cp -R $(dirname $0)/../@hauke5/$bundle/dist/example/* ./
cp -R $(dirname $0)/../@hauke5/$bundle/dist/lib ./

npm i
cp -R ./node_modules/@hauke5/utils/dist/lib ./
cp -R ./node_modules/@hauke5/nextjs-utils/dist/lib ./
echo "point a browser to http://localhost:3000/examples/"$Bundle
npm run dev
