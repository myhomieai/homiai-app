#!/bin/bash

# --- שלב 0: גיבוי ---
echo " HomiAI Project Refactoring Script (v3 - Enterprise Structure + Test Setup)"
echo "---------------------------------------------------------------------------"
echo "IMPORTANT: Make sure you have committed your current changes to Git before running!"
read -p "Press Enter to continue if you have backed up your project..."

# --- שלב 1: יצירת התיקיות החדשות הנדרשות ---
echo "STEP 1: Creating new directories..."
mkdir -p src/features/categories/components
mkdir -p src/features/categories/data
mkdir -p src/features/categories/hooks
mkdir -p src/features/categories/services
mkdir -p src/features/categories/schemas
# mkdir -p src/features/categories/types

mkdir -p src/features/items/components
mkdir -p src/features/items/data
mkdir -p src/features/items/hooks
mkdir -p src/features/items/services
mkdir -p src/features/items/utils
mkdir -p src/features/items/schemas

mkdir -p src/store/categories
mkdir -p src/store/items

mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/styles
mkdir -p src/tests # תיקייה לקבצי setup של בדיקות

echo "Directory creation complete."
echo "---"

# --- שלב 2: העברת הקבצים הקיימים למיקומים החדשים ---
echo "STEP 2: Moving existing files..."

# (הפקודות להעברת קבצים נשארות זהות ל-v2 - ראה בתגובה הקודמת)
# ... (דוגמאות עיקריות - השלם לפי הצורך)
echo "- Moving Category components..."
mv src/features/components/CategoryTree.tsx src/features/categories/components/ 2>/dev/null || echo "  WARN: CategoryTree.tsx not found at source or already moved."
mv src/features/components/CategoryNode.tsx src/features/categories/components/ 2>/dev/null || echo "  WARN: CategoryNode.tsx not found at source or already moved."
echo "- Moving Item components..."
mv src/components/AddItemForm.tsx src/features/items/components/ 2>/dev/null || echo "  WARN: AddItemForm.tsx not found at source or already moved."
mv src/components/ItemList.tsx src/features/items/components/ 2>/dev/null || echo "  WARN: ItemList.tsx not found at source or already moved."
echo "- Moving Category utils..."
mv src/features/utils/categoryUtils.ts src/features/categories/utils.ts 2>/dev/null || echo "  WARN: categoryUtils.ts not found at source or already moved."
echo "- Moving initial category data..."
mv src/lib/utils/initial-data.ts src/features/categories/data/initialCategories.ts 2>/dev/null || echo "  WARN: initial-data.ts not found at source or already moved."
echo "- Moving Category store..."
mv src/features/store/categoryStore.ts src/store/categories/store.ts 2>/dev/null || echo "  WARN: categoryStore.ts not found at source or already moved."
echo "- Moving Item store..."
mv src/store/useHomiStore.ts src/store/items/store.ts 2>/dev/null || echo "  WARN: useHomiStore.ts not found at source or already moved."
echo "- Moving Schemas..."
mv src/features/schemas/categorySchema.ts src/features/categories/schemas/categorySchema.ts 2>/dev/null || echo "  WARN: categorySchema.ts not found at source or already moved."
mv src/lib/schemas/itemSchema.ts src/features/items/schemas/itemSchema.ts 2>/dev/null || echo "  WARN: itemSchema.ts not found at source or already moved."
echo "- Moving Category type back to global types..."
mv src/features/types.ts/category.ts src/types/category.ts 2>/dev/null || echo "  WARN: features/types.ts/category.ts not found (potential typo in original structure)."

echo "File moving complete."
echo "---"

# --- שלב 3: יצירת ותוכן התחלתי לקבצי index.ts ---
echo "STEP 3: Creating and populating barrel (index.ts) files..."

echo "export { useCategoryStore } from './store';" > src/store/categories/index.ts
echo "export { useHomiStore } from './store';" > src/store/items/index.ts # Verify hook name
echo "export * from './categories';" > src/store/index.ts
echo "export * from './items';" >> src/store/index.ts

echo "index.ts file creation and population complete."
echo "---"

# --- שלב 4: מחיקת תיקיות ישנות וריקות ---
echo "STEP 4: Attempting to remove old/empty directories..."
rmdir src/components/categories 2>/dev/null
rmdir src/features/components 2>/dev/null
rmdir src/features/schemas 2>/dev/null
rmdir src/features/store 2>/dev/null
rmdir src/features/types.ts 2>/dev/null
rmdir src/features/utils 2>/dev/null

echo "Directory cleanup attempted. Please review manually if needed."
echo "---"

# --- שלב 5: הקמת תשתית בדיקות (Vitest + React Testing Library) ---
echo "STEP 5: Setting up Testing Infrastructure (Vitest + RTL)..."

# התקנת התלויות (השתמש ב-npm או yarn לפי מה שאתה משתמש בפרויקט)
echo "- Installing testing dev dependencies..."
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
# או: yarn add --dev vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react

# יצירת קובץ קונפיגורציה ל-Vitest
echo "- Creating vitest.config.ts..."
cat << EOF > vitest.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Use Vitest globals (describe, it, expect)
    environment: 'jsdom', // Simulate browser environment
    setupFiles: './src/tests/setup.ts', // Optional setup file
    css: false, // Disable CSS processing if not needed
  },
  resolve: {
    alias: {
      // Ensure this alias matches your tsconfig.json
      '@': path.resolve(__dirname, './src'),
    },
  },
});
EOF

# יצירת קובץ setup אופציונלי (שימושי לייבוא של jest-dom)
echo "- Creating src/tests/setup.ts (for jest-dom)..."
cat << EOF > src/tests/setup.ts
// Import jest-dom matchers like .toBeInTheDocument()
import '@testing-library/jest-dom';
EOF

# יצירת קובץ בדיקה ראשוני לדוגמה (Co-location)
echo "- Creating sample test file src/features/categories/components/CategoryNode.test.tsx..."
cat << EOF > src/features/categories/components/CategoryNode.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CategoryNode } from './CategoryNode';
import type { Category } from '@/types/category'; // Adjust path if needed after refactor

// Mock data - ** Adjust this based on your ACTUAL Category type fields **
const mockCategory: Category = {
  id: 'cat1',
  name: 'Test Category Node',
  slug: 'test-category-node',
  parentId: null,
  path: 'test-category-node',
  depth: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // Add other required fields from your Category type with default values
  isLeaf: true, // Example default
  version: 1,  // Example default
  archived: false, // Example default
  hidden: false, // Example default
  isSystemCategory: false, // Example default
  orphanPolicy: 'prevent-delete', // Example default
};

const mockAllCategories: Record<string, Category> = {
  'cat1': mockCategory,
};

describe('CategoryNode Component', () => {
  it('should render the category name', () => {
    render(
      <CategoryNode
        category={mockCategory}
        allCategories={mockAllCategories}
      />
    );

    // Basic check: Does the name appear in the document?
    expect(screen.getByText(mockCategory.name)).toBeInTheDocument();
  });

  // TODO: Add more tests later:
  // - Children rendering on expand
  // - Toggle button functionality
  // - Action buttons appearance/interaction (might require mocking store actions)
});
EOF

# הוספת סקריפט בדיקה ל-package.json (תצטרך לעשות זאת ידנית)
echo "- ACTION REQUIRED: Add test script to your package.json:"
echo '  "scripts": {'
echo '    "test": "vitest",'
echo '    "test:ui": "vitest --ui", // Optional: for UI runner'
echo '    "coverage": "vitest run --coverage" // Optional: for coverage'
echo '    ...'
echo '  }'

echo "Testing infrastructure setup complete."
echo "---"


# --- שלב 6: בדיקת ייבואים שבורים פוטנציאליים (grep) ---
echo "STEP 6: Quick check for potentially broken old import paths (grep)..."
# (פקודות ה-grep נשארות זהות ל-v2)
(grep -rE "from '(@/|.*)components/categories" src/ && echo "  WARNING: Found potential old imports from components/categories") || echo "  ✔ No obvious old imports from components/categories found."
(grep -rE "from '(@/|.*)lib/store/categoryStore" src/ && echo "  WARNING: Found potential old imports from lib/store/categoryStore") || echo "  ✔ No obvious old imports from lib/store/categoryStore found."
# ... (שאר בדיקות ה-grep) ...
echo "Grep check finished. Manual import update is still required."
echo "---"

echo "Refactoring script (v3) finished."
echo "➡️ NEXT STEPS:"
echo "1. Manually review the file structure changes & test setup files."
echo "2. **Crucially: Update ALL import statements across your project to use the new file paths.**"
echo "   (Use aliases like '@/store', '@/features/categories/components', etc.)"
echo "3. Run 'npm install' or 'yarn install' again if you haven't."
echo "4. Add the 'test' script to your package.json."
echo "5. Run 'tsc --noEmit' to check for TypeScript errors."
echo "6. Run your linter (e.g., 'eslint . --fix')."
echo "7. Try running the tests: 'npm run test' (or yarn test)."
echo "8. Run the development server ('npm run dev') and test the application thoroughly."
echo "---------------------------------------------------------------------------"