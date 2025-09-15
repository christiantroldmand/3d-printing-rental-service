import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('STL File Upload Test', () => {
  test('should upload D-P_Head.stl file without Circle error', async ({ page }) => {
    // Navigate to the order page
    await page.goto('/order');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the file upload area is visible
    await expect(page.getByText('Drag & drop your 3D file here')).toBeVisible();
    
    // Get the file path
    const filePath = path.join(__dirname, '../../D-P_Head.stl');
    
    // Upload the STL file using the file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for file processing
    await page.waitForTimeout(2000);
    
    // Check if the file was uploaded successfully
    await expect(page.getByText('D-P_Head.stl')).toBeVisible();
    
    // Check if the 3D preview section appears
    await expect(page.getByText('3D Preview')).toBeVisible();
    
    // Navigate to step 2 (Review & Calculate Price) where STLViewer is shown
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Check if the 3D Model Preview is visible
    await expect(page.getByText('3D Model Preview')).toBeVisible();
    
    // Check if the canvas (3D viewer) is visible
    await expect(page.locator('canvas')).toBeVisible();
    
    // Check for any error messages in the console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit more to ensure any errors would have appeared
    await page.waitForTimeout(2000);
    
    // Verify no Circle errors occurred
    const circleErrors = consoleErrors.filter(error => 
      error.includes('Circle is not part of the THREE namespace') ||
      error.includes('R3F: Circle')
    );
    
    expect(circleErrors).toHaveLength(0);
    
    // Check if the 3D viewer is functioning (canvas should be visible and have content)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify the canvas has some content (not just a blank canvas)
    const canvasBoundingBox = await canvas.boundingBox();
    expect(canvasBoundingBox).not.toBeNull();
    expect(canvasBoundingBox!.width).toBeGreaterThan(0);
    expect(canvasBoundingBox!.height).toBeGreaterThan(0);
  });

  test('should handle file upload and show file details', async ({ page }) => {
    await page.goto('/order');
    await page.waitForLoadState('networkidle');
    
    // Upload the STL file
    const filePath = path.join(__dirname, '../../D-P_Head.stl');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check file details are displayed
    await expect(page.getByText('D-P_Head.stl')).toBeVisible();
    
    // Check if file size is displayed
    await expect(page.getByText(/KB|MB|bytes/)).toBeVisible();
    
    // Check if the remove button is available
    await expect(page.getByRole('button', { name: /remove|delete/i })).toBeVisible();
  });

  test('should allow file removal after upload', async ({ page }) => {
    await page.goto('/order');
    await page.waitForLoadState('networkidle');
    
    // Upload the STL file
    const filePath = path.join(__dirname, '../../D-P_Head.stl');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Verify file is uploaded
    await expect(page.getByText('D-P_Head.stl')).toBeVisible();
    
    // Click remove button
    await page.getByRole('button', { name: /remove|delete/i }).click();
    
    // Wait for removal
    await page.waitForTimeout(500);
    
    // Verify file is removed and upload area is back
    await expect(page.getByText('Drag & drop your 3D file here')).toBeVisible();
    await expect(page.getByText('D-P_Head.stl')).not.toBeVisible();
  });
});
