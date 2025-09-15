import { test, expect } from '@playwright/test';

test.describe('Thingiverse Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/order');
  });

  test('should open Thingiverse import dialog', async ({ page }) => {
    // Click on Thingiverse tab
    await page.click('text=Import from Thingiverse');
    
    // Click browse button
    await page.click('button:has-text("Browse Thingiverse")');
    
    // Check if dialog opens
    await expect(page.getByText('Import from Thingiverse')).toBeVisible();
  });

  test('should have search functionality in Thingiverse dialog', async ({ page }) => {
    // Open Thingiverse dialog
    await page.click('text=Import from Thingiverse');
    await page.click('button:has-text("Browse Thingiverse")');
    
    // Check if search tab is active
    await expect(page.getByText('Search')).toBeVisible();
    
    // Check if search input is present
    await expect(page.getByPlaceholder('Search for 3D models...')).toBeVisible();
    
    // Check if search button is present
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
  });

  test('should have popular models tab', async ({ page }) => {
    // Open Thingiverse dialog
    await page.click('text=Import from Thingiverse');
    await page.click('button:has-text("Browse Thingiverse")');
    
    // Click on Popular tab
    await page.click('text=Popular');
    
    // Check if popular models section is shown
    await expect(page.getByText('Popular Models')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    // Open Thingiverse dialog
    await page.click('text=Import from Thingiverse');
    await page.click('button:has-text("Browse Thingiverse")');
    
    // Enter search query
    await page.fill('input[placeholder="Search for 3D models..."]', 'phone case');
    
    // Click search button
    await page.click('button:has-text("Search")');
    
    // Wait for results (mock response)
    await page.waitForTimeout(1000);
    
    // Check if search results are shown
    await expect(page.getByText('Search Results')).toBeVisible();
  });

  test('should show model information', async ({ page }) => {
    // Open Thingiverse dialog
    await page.click('text=Import from Thingiverse');
    await page.click('button:has-text("Browse Thingiverse")');
    
    // Mock a model selection
    await page.evaluate(() => {
      // Simulate clicking on a model card
      const event = new CustomEvent('modelSelect', { 
        detail: { 
          id: '12345', 
          name: 'Test Model',
          creator: { name: 'Test Creator' },
          downloadCount: 100,
          likeCount: 50,
          viewCount: 200
        } 
      });
      window.dispatchEvent(event);
    });
    
    // Check if model details are shown
    await expect(page.getByText('Selected Model:')).toBeVisible();
  });

  test('should handle file selection for import', async ({ page }) => {
    // Open Thingiverse dialog
    await page.click('text=Import from Thingiverse');
    await page.click('button:has-text("Browse Thingiverse")');
    
    // Mock model selection with multiple files
    await page.evaluate(() => {
      const event = new CustomEvent('modelSelect', { 
        detail: { 
          id: '12345', 
          name: 'Test Model',
          files: [
            { name: 'model.stl', type: 'stl' },
            { name: 'model_v2.stl', type: 'stl' }
          ]
        } 
      });
      window.dispatchEvent(event);
    });
    
    // Check if file selection is shown
    await expect(page.getByText('Available Files:')).toBeVisible();
  });

  test('should handle import process', async ({ page }) => {
    // Open Thingiverse dialog
    await page.click('text=Import from Thingiverse');
    await page.click('button:has-text("Browse Thingiverse")');
    
    // Mock model selection and import
    await page.evaluate(() => {
      const event = new CustomEvent('modelSelect', { 
        detail: { 
          id: '12345', 
          name: 'Test Model',
          files: [{ name: 'model.stl', type: 'stl' }]
        } 
      });
      window.dispatchEvent(event);
    });
    
    // Click import button
    await page.click('button:has-text("Import Model")');
    
    // Check if dialog closes and file is imported
    await expect(page.getByText('Import from Thingiverse')).not.toBeVisible();
  });

  test('should handle dialog close', async ({ page }) => {
    // Open Thingiverse dialog
    await page.click('text=Import from Thingiverse');
    await page.click('button:has-text("Browse Thingiverse")');
    
    // Click close button
    await page.click('button[aria-label="close"]');
    
    // Check if dialog closes
    await expect(page.getByText('Import from Thingiverse')).not.toBeVisible();
  });

  test('should handle cancel button', async ({ page }) => {
    // Open Thingiverse dialog
    await page.click('text=Import from Thingiverse');
    await page.click('button:has-text("Browse Thingiverse")');
    
    // Click cancel button
    await page.click('button:has-text("Cancel")');
    
    // Check if dialog closes
    await expect(page.getByText('Import from Thingiverse')).not.toBeVisible();
  });
});
