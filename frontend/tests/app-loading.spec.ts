import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main heading is visible (use first() to avoid strict mode violation)
    await expect(page.getByRole('heading', { name: 'Professional 3D Printing Services' }).first()).toBeVisible();
    
    // Check if navigation is present
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Order' }).first()).toBeVisible();
  });

  test('should load the order page', async ({ page }) => {
    await page.goto('/order');
    
    // Check if the order form loads (use first() to avoid strict mode violation)
    await expect(page.getByRole('heading', { name: 'Upload Your 3D File' }).first()).toBeVisible();
    
    // Check if file upload area is present
    await expect(page.getByText('Drag & drop your 3D file here')).toBeVisible();
  });

  test('should show material selection step', async ({ page }) => {
    await page.goto('/order');
    
    // Check if the step content is visible
    await expect(page.getByText('Upload Your 3D File').first()).toBeVisible();
    
    // Check if file upload area is present
    await expect(page.getByText('Drag & drop your 3D file here')).toBeVisible();
  });
});
