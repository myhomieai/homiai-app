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
