#!/bin/bash

echo "🔍 Searching for old imports from '@/components/...'"
echo "----------------------------------------------------"

grep -rE "from ['\"]@/components/" src | while read -r line; do
  echo "⚠️  FOUND:"
  echo "$line"
  echo ""
done

echo "✅ DONE. Please update all these paths manually to:"
echo "  '@/features/items/components/...'"
echo ""
echo "🛠 Tip: Use your code editor's global search and replace feature (like VSCode ⌘⇧F or Ctrl+Shift+F)"