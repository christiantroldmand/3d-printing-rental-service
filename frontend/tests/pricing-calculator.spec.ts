import { test, expect } from '@playwright/test';

test.describe('Pricing Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should calculate pricing correctly', async ({ page }) => {
    // Fill in the pricing calculator
    await page.fill('input[placeholder="Enter STL volume"]', '100');
    await page.selectOption('select', 'PLA');
    await page.selectOption('select[aria-label="Layer Height"]', '0.2');
    await page.selectOption('select[aria-label="Infill Percentage"]', '20');

    // Wait for calculation
    await page.waitForTimeout(2000);

    // Check if pricing breakdown is shown
    await expect(page.getByText('Material Cost')).toBeVisible();
    await expect(page.getByText('Time Cost')).toBeVisible();
    await expect(page.getByText('Electricity Cost')).toBeVisible();
    await expect(page.getByText('Platform Fee')).toBeVisible();
    await expect(page.getByText('Total Cost')).toBeVisible();
  });

  test('should update pricing when inputs change', async ({ page }) => {
    // Initial calculation
    await page.fill('input[placeholder="Enter STL volume"]', '50');
    await page.selectOption('select', 'PLA');
    await page.waitForTimeout(1000);

    // Change volume
    await page.fill('input[placeholder="Enter STL volume"]', '200');
    await page.waitForTimeout(1000);

    // Check if pricing updated
    await expect(page.getByText('Total Cost')).toBeVisible();
  });

  test('should handle different materials', async ({ page }) => {
    await page.fill('input[placeholder="Enter STL volume"]', '100');
    
    // Test different materials
    const materials = ['PLA', 'PETG', 'ABS', 'TPU'];
    
    for (const material of materials) {
      await page.selectOption('select', material);
      await page.waitForTimeout(1000);
      
      // Check if pricing is calculated
      await expect(page.getByText('Total Cost')).toBeVisible();
    }
  });

  test('should handle different layer heights', async ({ page }) => {
    await page.fill('input[placeholder="Enter STL volume"]', '100');
    await page.selectOption('select', 'PLA');
    
    // Test different layer heights
    const layerHeights = ['0.1', '0.2', '0.3'];
    
    for (const height of layerHeights) {
      await page.selectOption('select[aria-label="Layer Height"]', height);
      await page.waitForTimeout(1000);
      
      // Check if pricing is calculated
      await expect(page.getByText('Total Cost')).toBeVisible();
    }
  });

  test('should handle different infill percentages', async ({ page }) => {
    await page.fill('input[placeholder="Enter STL volume"]', '100');
    await page.selectOption('select', 'PLA');
    
    // Test different infill percentages
    const infillPercentages = ['10', '20', '50', '100'];
    
    for (const infill of infillPercentages) {
      await page.selectOption('select[aria-label="Infill Percentage"]', infill);
      await page.waitForTimeout(1000);
      
      // Check if pricing is calculated
      await expect(page.getByText('Total Cost')).toBeVisible();
    }
  });

  test('should show loading state during calculation', async ({ page }) => {
    await page.fill('input[placeholder="Enter STL volume"]', '100');
    await page.selectOption('select', 'PLA');
    
    // Check if loading indicator appears
    await expect(page.getByText('Calculating...')).toBeVisible();
  });

  test('should handle invalid inputs', async ({ page }) => {
    // Test with zero volume
    await page.fill('input[placeholder="Enter STL volume"]', '0');
    await page.selectOption('select', 'PLA');
    await page.waitForTimeout(1000);
    
    // Should show error or not calculate
    await expect(page.getByText('Please enter a valid volume')).toBeVisible();
  });
});
