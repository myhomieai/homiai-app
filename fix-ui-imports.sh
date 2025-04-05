#!/bin/bash

echo "🔧 Fixing import path for 'initialCategories'..."
echo "-----------------------------------------------"

TARGET_FILE="./src/store/categories/store.ts"
OLD_IMPORT="from '@/features/categories/data/initialCategories'"
NEW_IMPORT="from '@/features/categories/data/initial-data'"

if [ -f "$TARGET_FILE" ]; then
  grep -q "$OLD_IMPORT" "$TARGET_FILE"
  if [ $? -eq 0 ]; then
    sed -i '' "s|$OLD_IMPORT|$NEW_IMPORT|" "$TARGET_FILE"
    echo "✅ Updated import in $TARGET_FILE"
  else
    echo "ℹ️  Import path already correct or not found in $TARGET_FILE"
  fi
else
  echo "❌ File not found: $TARGET_FILE"
fi

echo "✅ Done."