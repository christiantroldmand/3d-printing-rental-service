import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Debug Circle Error', () => {
  test('should identify source of Circle error', async ({ page }) => {
    // Set up comprehensive console monitoring
    const consoleMessages: { type: string, text: string }[] = [];
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
      console.log('STACK:', error.stack);
    });
    
    // Navigate to the order page
    await page.goto('/order');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    console.log('=== After page load ===');
    consoleMessages.forEach(msg => {
      if (msg.text.includes('Circle') || msg.text.includes('circle')) {
        console.log(`CIRCLE RELATED: [${msg.type}] ${msg.text}`);
      }
    });
    
    // Try to upload the STL file
    try {
      const filePath = path.join(__dirname, '../../D-P_Head.stl');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);
      
      console.log('=== After file upload ===');
      
      // Wait for processing
      await page.waitForTimeout(5000);
      
      console.log('=== After wait ===');
      
      // Check all console messages for Circle errors
      const circleMessages = consoleMessages.filter(msg => 
        msg.text.includes('Circle') || 
        msg.text.includes('circle') ||
        msg.text.includes('R3F:')
      );
      
      console.log('=== All Circle-related messages ===');
      circleMessages.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
      });
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-circle-error.png', fullPage: true });
      
      // The test: no Circle errors should occur
      const circleErrors = circleMessages.filter(msg => 
        msg.text.includes('Circle is not part of the THREE namespace') ||
        msg.text.includes('R3F: Circle')
      );
      
      expect(circleErrors).toHaveLength(0);
      
    } catch (error) {
      console.log('Test error:', error);
      // Even if the test fails, log what we found
      const circleMessages = consoleMessages.filter(msg => 
        msg.text.includes('Circle') || msg.text.includes('circle')
      );
      console.log('Circle messages found during error:', circleMessages);
      throw error;
    }
  });
});
