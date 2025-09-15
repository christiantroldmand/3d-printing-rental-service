import { test, expect } from '@playwright/test';

test.describe('Order Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/order');
  });

  test('should load order form with all steps', async ({ page }) => {
    // Check if stepper is present
    await expect(page.getByText('Upload 3D File')).toBeVisible();
    await expect(page.getByText('Select Material & Settings')).toBeVisible();
    await expect(page.getByText('Review & Calculate Price')).toBeVisible();
    await expect(page.getByText('Place Order')).toBeVisible();

    // Check if first step content is visible
    await expect(page.getByText('Upload Your 3D File')).toBeVisible();
  });

  test('should handle file upload', async ({ page }) => {
    // Create a test STL file
    const testFile = 'test-model.stl';
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    
    // Create a dummy file for testing
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: Buffer.from('dummy stl content')
    });

    // Check if file is selected
    await expect(page.getByText(testFile)).toBeVisible();
  });

  test('should navigate between steps', async ({ page }) => {
    // Try to go to next step (should show error for missing file)
    await page.click('button:has-text("Next")');
    
    // Should show error message
    await expect(page.getByText('Please upload a 3D file to continue')).toBeVisible();

    // Upload a file first
    const testFile = 'test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: Buffer.from('dummy stl content')
    });

    // Now try to go to next step
    await page.click('button:has-text("Next")');
    
    // Should be on step 2
    await expect(page.getByText('Material & Print Settings')).toBeVisible();
  });

  test('should show 3D preview when file is uploaded', async ({ page }) => {
    // Upload a file
    const testFile = 'test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: Buffer.from('dummy stl content')
    });

    // Check if 3D preview is shown
    await expect(page.getByText('3D Preview')).toBeVisible();
  });

  test('should handle Thingiverse import', async ({ page }) => {
    // Click on Thingiverse tab
    await page.click('text=Import from Thingiverse');
    
    // Check if Thingiverse content is shown
    await expect(page.getByText('Import 3D Models from Thingiverse')).toBeVisible();
    
    // Click browse button
    await page.click('button:has-text("Browse Thingiverse")');
    
    // Check if Thingiverse dialog opens
    await expect(page.getByText('Import from Thingiverse')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    // Try to proceed without file
    await page.click('button:has-text("Next")');
    await expect(page.getByText('Please upload a 3D file to continue')).toBeVisible();

    // Upload file and proceed
    const testFile = 'test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: Buffer.from('dummy stl content')
    });

    await page.click('button:has-text("Next")');
    
    // Should be on step 2
    await expect(page.getByText('Material & Print Settings')).toBeVisible();
  });
});
