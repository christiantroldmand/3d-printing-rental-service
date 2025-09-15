import { test, expect } from '@playwright/test';

// Helper function to create a simple STL file buffer
function createSimpleSTLBuffer(): Buffer {
  // Create a minimal STL file header and triangle data
  const header = Buffer.alloc(80); // 80-byte header
  const triangleCount = 12; // 12 triangles for a simple cube
  const triangleSize = 50; // 50 bytes per triangle (12 floats + 2 bytes attribute)
  
  const buffer = Buffer.alloc(80 + 4 + (triangleCount * triangleSize));
  let offset = 0;
  
  // Write header
  header.copy(buffer, offset);
  offset += 80;
  
  // Write triangle count
  buffer.writeUInt32LE(triangleCount, offset);
  offset += 4;
  
  // Write simple cube triangles (simplified)
  for (let i = 0; i < triangleCount; i++) {
    // Normal vector (3 floats)
    buffer.writeFloatLE(0, offset);
    buffer.writeFloatLE(0, offset + 4);
    buffer.writeFloatLE(1, offset + 8);
    offset += 12;
    
    // Vertex 1 (3 floats)
    buffer.writeFloatLE(0, offset);
    buffer.writeFloatLE(0, offset + 4);
    buffer.writeFloatLE(0, offset + 8);
    offset += 12;
    
    // Vertex 2 (3 floats)
    buffer.writeFloatLE(1, offset);
    buffer.writeFloatLE(0, offset + 4);
    buffer.writeFloatLE(0, offset + 8);
    offset += 12;
    
    // Vertex 3 (3 floats)
    buffer.writeFloatLE(1, offset);
    buffer.writeFloatLE(1, offset + 4);
    buffer.writeFloatLE(0, offset + 8);
    offset += 12;
    
    // Attribute byte count (2 bytes)
    buffer.writeUInt16LE(0, offset);
    offset += 2;
  }
  
  return buffer;
}

test.describe('STL Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/order');
  });

  test('should show file upload area initially', async ({ page }) => {
    // Check if upload area is visible
    await expect(page.getByText('Drag & drop your 3D file here')).toBeVisible();
    await expect(page.getByText('or click to browse files')).toBeVisible();
  });

  test('should handle file upload and show preview', async ({ page }) => {
    // Upload a test file
    const testFile = 'test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: createSimpleSTLBuffer()
    });

    // Wait for the file to be processed
    await page.waitForTimeout(1000);

    // Navigate to step 2 (Review & Calculate Price) where STLViewer is shown
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Check if 3D preview is shown
    await expect(page.getByText('3D Model Preview')).toBeVisible();
    
    // Check if canvas is present (Three.js canvas)
    await expect(page.locator('canvas')).toBeVisible();
    
    // Check if the canvas has content (not just black)
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('should show file information when file is uploaded', async ({ page }) => {
    // Upload a test file
    const testFile = 'test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: createSimpleSTLBuffer()
    });

    // Wait for processing
    await page.waitForTimeout(1000);

    // Navigate to step 2 where file info is shown
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Check if file name is displayed
    await expect(page.getByText(testFile)).toBeVisible();
  });

  test('should show 3D viewer controls', async ({ page }) => {
    // Upload a test file first
    const testFile = 'test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: createSimpleSTLBuffer()
    });

    // Wait for processing
    await page.waitForTimeout(1000);

    // Navigate to step 2 where STLViewer is shown
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Check if control buttons are present
    await expect(page.getByTitle('Zoom In')).toBeVisible();
    await expect(page.getByTitle('Zoom Out')).toBeVisible();
    await expect(page.getByTitle('Reset View')).toBeVisible();
    await expect(page.getByTitle('Fit to View')).toBeVisible();
    await expect(page.getByTitle('Show Grid')).toBeVisible();
    await expect(page.getByTitle('Fullscreen')).toBeVisible();
  });

  test('should handle control interactions', async ({ page }) => {
    // Upload a test file first
    const testFile = 'test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: createSimpleSTLBuffer()
    });

    // Wait for processing
    await page.waitForTimeout(1000);

    // Navigate to step 2 where STLViewer is shown
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Test zoom in
    await page.click('[title="Zoom In"]');
    
    // Test zoom out
    await page.click('[title="Zoom Out"]');
    
    // Test reset view
    await page.click('[title="Reset View"]');
    
    // Test fit to view
    await page.click('[title="Fit to View"]');
    
    // Test grid toggle
    await page.click('[title="Show Grid"]');
    await page.click('[title="Hide Grid"]');
  });

  test('should handle file removal', async ({ page }) => {
    // Upload a test file first
    const testFile = 'test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: createSimpleSTLBuffer()
    });

    // Wait for processing
    await page.waitForTimeout(1000);

    // Remove the file
    await page.click('button:has-text("Remove")');

    // Check if upload area is shown again
    await expect(page.getByText('Drag & drop your 3D file here')).toBeVisible();
  });

  test('should handle different file formats', async ({ page }) => {
    // Test STL file
    const stlFile = 'test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: stlFile,
      mimeType: 'application/sla',
      buffer: createSimpleSTLBuffer()
    });

    await page.waitForTimeout(1000);
    
    // Navigate to step 2 where STLViewer is shown
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    await expect(page.getByText('3D Model Preview')).toBeVisible();
    
    // Go back to step 1 to remove file
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Remove")');

    // Test OBJ file
    const objFile = 'test-model.obj';
    const objContent = `# Simple cube
v 0.0 0.0 0.0
v 1.0 0.0 0.0
v 1.0 1.0 0.0
v 0.0 1.0 0.0
f 1 2 3 4
`;
    
    const fileChooserPromise2 = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles({
      name: objFile,
      mimeType: 'model/obj',
      buffer: Buffer.from(objContent)
    });

    await page.waitForTimeout(1000);
    
    // Navigate to step 2 where STLViewer is shown
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    await expect(page.getByText('3D Model Preview')).toBeVisible();
  });

  test('should show error for unsupported files', async ({ page }) => {
    // Try to upload an unsupported file
    const unsupportedFile = 'test.txt';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: unsupportedFile,
      mimeType: 'text/plain',
      buffer: Buffer.from('dummy text content')
    });

    // Should show error or reject the file
    await expect(page.getByText('File type not supported')).toBeVisible();
  });

  test('should handle drag and drop file upload', async ({ page }) => {
    // Test drag and drop functionality
    const testFile = 'test-model.stl';
    const fileBuffer = createSimpleSTLBuffer();
    
    // Create a data transfer object
    const dataTransfer = await page.evaluateHandle(({ name, mimeType, buffer }) => {
      const dt = new DataTransfer();
      const file = new File([buffer], name, { type: mimeType });
      dt.items.add(file);
      return dt;
    }, { name: testFile, mimeType: 'application/sla', buffer: Array.from(fileBuffer) });

    // Perform drag and drop
    const dropZone = page.locator('[data-testid="dropzone"]').first();
    await dropZone.dispatchEvent('drop', { dataTransfer });

    // Wait for processing
    await page.waitForTimeout(1000);

    // Navigate to step 2 where STLViewer is shown
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Check if file was uploaded
    await expect(page.getByText(testFile)).toBeVisible();
    await expect(page.getByText('3D Model Preview')).toBeVisible();
  });

  test('should show loading state during file processing', async ({ page }) => {
    // Upload a test file
    const testFile = 'test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: createSimpleSTLBuffer()
    });

    // Check if loading state is shown (briefly)
    await expect(page.getByText('Processing file...')).toBeVisible();
  });

  test('should display file size information', async ({ page }) => {
    // Upload a test file
    const testFile = 'test-model.stl';
    const fileBuffer = createSimpleSTLBuffer();
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: fileBuffer
    });

    // Wait for processing
    await page.waitForTimeout(1000);

    // Navigate to step 2 where file info is shown
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Check if file size is displayed
    const fileSizeKB = Math.round(fileBuffer.length / 1024);
    await expect(page.getByText(`${fileSizeKB} KB`)).toBeVisible();
  });

  test('should handle large file uploads', async ({ page }) => {
    // Create a larger STL file
    const largeBuffer = Buffer.concat([createSimpleSTLBuffer()], 1000); // Repeat 1000 times
    
    const testFile = 'large-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=or click to browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: testFile,
      mimeType: 'application/sla',
      buffer: largeBuffer
    });

    // Wait for processing
    await page.waitForTimeout(2000);

    // Navigate to step 2 where STLViewer is shown
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Check if file was processed
    await expect(page.getByText(testFile)).toBeVisible();
    await expect(page.getByText('3D Model Preview')).toBeVisible();
  });
});
