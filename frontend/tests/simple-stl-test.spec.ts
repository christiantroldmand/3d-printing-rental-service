import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Simple STL Upload Test', () => {
  test('should upload STL file and check for Circle errors', async ({ page }) => {
    // Navigate to the order page
    await page.goto('/order');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the file upload area is visible
    await expect(page.getByText('Drag & drop your 3D file here')).toBeVisible();
    
    // Get the file path
    const filePath = path.join(__dirname, '../../D-P_Head.stl');
    
    // Set up console error monitoring
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console Error:', msg.text());
      }
    });
    
    // Upload the STL file using the file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for file processing
    await page.waitForTimeout(3000);
    
    // Check if any file was uploaded (look for any file name pattern)
    const fileUploaded = await page.locator('text=/.*\\.stl/').isVisible();
    console.log('File uploaded:', fileUploaded);
    
    // Check for Circle errors specifically
    const circleErrors = consoleErrors.filter(error => 
      error.includes('Circle is not part of the THREE namespace') ||
      error.includes('R3F: Circle') ||
      error.includes('Circle')
    );
    
    console.log('Circle errors found:', circleErrors);
    
    // The main test: verify no Circle errors occurred
    expect(circleErrors).toHaveLength(0);
    
    // Also check if the page is still functional (no white screen)
    await expect(page.getByText('Drag & drop your 3D file here')).toBeVisible();
  });
});
