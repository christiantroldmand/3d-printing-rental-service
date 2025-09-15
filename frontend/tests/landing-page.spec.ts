import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load and display main elements', async ({ page }) => {
    await page.goto('/');

    // Check if the main heading is visible
    await expect(page.getByRole('heading', { name: 'Professional 3D Printing Services', level: 1 })).toBeVisible();

    // Check if the hero section is present
    await expect(page.getByText('Transform your ideas into reality')).toBeVisible();

    // Check if the pricing calculator is present (it's hidden by default)
    // We'll test it in the pricing calculator test

    // Check if the features section is present
    await expect(page.getByText('Why Choose NORDSJÆLLAND 3D PRINT SERVICE?')).toBeVisible();

    // Check if the stats section is present
    await expect(page.getByText('Our numbers speak for themselves')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Check if navbar is present
    await expect(page.getByRole('navigation')).toBeVisible();

    // Check if logo is present
    await expect(page.getByRole('link', { name: 'NORDSJÆLLAND 3D PRINT SERVICE' })).toBeVisible();

    // Check if navigation links are present (desktop view)
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 768) {
      // Desktop navigation
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Order Print' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    } else {
      // Mobile navigation - open drawer first
      await page.click('[aria-label="open drawer"]');
      await page.waitForTimeout(500);
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Order' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    }
  });

  test('should have working pricing calculator', async ({ page }) => {
    await page.goto('/');

    // Click the "Learn More" button to show the pricing calculator
    await page.click('button:has-text("Learn More")');

    // Wait for the pricing calculator to appear
    await expect(page.getByText('Instant Price Calculator')).toBeVisible();

    // Fill in the pricing calculator
    await page.fill('input[placeholder="Enter STL volume"]', '100');
    
    // Click and select Material-UI selects using force click
    await page.click('[data-testid="material-select"]');
    await page.click('text=PLA', { force: true });
    
    await page.click('[data-testid="layer-height-select"]');
    await page.click('text=0.2mm (Normal)', { force: true });
    
    await page.click('[data-testid="infill-select"]');
    await page.click('text=20% (Standard)', { force: true });

    // Wait for pricing calculation
    await page.waitForTimeout(1000);

    // Check if pricing is displayed
    await expect(page.getByText('€')).toBeVisible();
  });

  test('should have working call-to-action buttons', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if order button is present and clickable
    const orderButton = page.getByRole('link', { name: 'Start Your Order' });
    await expect(orderButton).toBeVisible();
    await orderButton.click();

    // Should navigate to order page
    await expect(page).toHaveURL('/order');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if mobile navigation works
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Click the mobile menu button to open the drawer
    await page.click('[aria-label="open drawer"]');
    
    // Wait for the drawer to open
    await page.waitForTimeout(500);
    
    // Check if mobile menu items are visible
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Order' })).toBeVisible();

    // Check if content is readable on mobile
    await expect(page.getByRole('heading', { name: 'Professional 3D Printing Services', level: 1 })).toBeVisible();
  });
});
