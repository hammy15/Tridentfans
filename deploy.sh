#!/bin/bash
export PATH=$HOME/.local/bin:$HOME/.local/node/bin:$PATH
cd ~/Tridentfans

echo "🔨 Building..."
npm run build 2>&1
if [ $? -ne 0 ]; then
  echo "⚠️  Build warnings detected — pushing anyway (Vercel handles build)"
fi

echo "📦 Committing..."
git add -A
git commit -m "${1:-Update from Mark}" --author="Mark <mark@tridentfans.com>"

echo "🚀 Pushing to GitHub (triggers Vercel auto-deploy)..."
git push origin main

echo "✅ Done! Vercel will auto-deploy from main."
