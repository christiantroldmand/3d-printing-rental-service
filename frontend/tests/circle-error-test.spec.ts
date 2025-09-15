import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Circle Error Test', () => {
  test('should not have Circle errors when uploading STL file', async ({ page }) => {
    // Navigate to the order page
    await page.goto('/order');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Set up console error monitoring
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console Error:', msg.text());
      }
    });
    
    // Get the file path
    const filePath = path.join(__dirname, '../../D-P_Head.stl');
    
    // Try to upload the STL file
    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);
      
      // Wait for any processing
      await page.waitForTimeout(5000);
      
      // Check for Circle errors specifically
      const circleErrors = consoleErrors.filter(error => 
        error.includes('Circle is not part of the THREE namespace') ||
        error.includes('R3F: Circle') ||
        error.includes('Circle')
      );
      
      console.log('Total console errors:', consoleErrors.length);
      console.log('Circle errors found:', circleErrors);
      
      // The main test: verify no Circle errors occurred
      expect(circleErrors).toHaveLength(0);
      
    } catch (error) {
      console.log('File upload failed:', error);
      // Even if file upload fails, we should not have Circle errors
      const circleErrors = consoleErrors.filter(err => 
        err.includes('Circle is not part of the THREE namespace') ||
        err.includes('R3F: Circle') ||
        err.includes('Circle')
      );
      expect(circleErrors).toHaveLength(0);
    }
  });

  test('should load order page without Circle errors', async ({ page }) => {
    // Set up console error monitoring
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console Error:', msg.text());
      }
    });
    
    // Navigate to the order page
    await page.goto('/order');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(2000);
    
    // Check for Circle errors
    const circleErrors = consoleErrors.filter(error => 
      error.includes('Circle is not part of the THREE namespace') ||
      error.includes('R3F: Circle') ||
      error.includes('Circle')
    );
    
    console.log('Total console errors:', consoleErrors.length);
    console.log('Circle errors found:', circleErrors);
    
    // Verify no Circle errors occurred
    expect(circleErrors).toHaveLength(0);
  });
});
