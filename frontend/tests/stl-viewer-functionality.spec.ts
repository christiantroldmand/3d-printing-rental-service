import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('STL Viewer Functionality Test', () => {
  test('should load STL viewer without Circle errors', async ({ page }) => {
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
    await page.waitForLoadState('networkidle');
    
    // Check if the page loads correctly
    await expect(page.getByRole('heading', { name: 'Upload Your 3D File', exact: true })).toBeVisible();
    
    // Try to upload the STL file
    const filePath = path.join(__dirname, '../../D-P_Head.stl');
    const fileInput = page.locator('input[type="file"]');
    
    // Check if file input exists
    await expect(fileInput).toBeVisible();
    
    // Upload the file
    await fileInput.setInputFiles(filePath);
    
    // Wait for processing
    await page.waitForTimeout(3000);
    
    // Check for any errors
    const circleErrors = consoleErrors.filter(error => 
      error.includes('Circle is not part of the THREE namespace') ||
      error.includes('R3F: Circle') ||
      error.includes('Circle')
    );
    
    console.log('Total console errors:', consoleErrors.length);
    console.log('Circle errors found:', circleErrors);
    
    // Verify no Circle errors occurred
    expect(circleErrors).toHaveLength(0);
    
    // Check if the page is still functional
    await expect(page.getByText('Upload Your 3D File')).toBeVisible();
  });

  test('should navigate through order form steps without Circle errors', async ({ page }) => {
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
    await page.waitForLoadState('networkidle');
    
    // Check step 1 is visible
    await expect(page.getByRole('heading', { name: 'Upload Your 3D File', exact: true })).toBeVisible();
    
    // Try to go to next step (this might fail if no file is uploaded, but we're testing for Circle errors)
    try {
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(1000);
    } catch (error) {
      console.log('Next button click failed (expected if no file uploaded):', error);
    }
    
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
