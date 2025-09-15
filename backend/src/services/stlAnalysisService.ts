import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as stlParser from 'stl-parser';

const prisma = new PrismaClient();

interface STLAnalysis {
  volume: number; // in cm³
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  surfaceArea: number; // in cm²
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  estimatedPrintTime: number; // in hours
  materialUsage: number; // in grams
  supportRequired: boolean;
  printabilityScore: number; // 0-100
}

interface PrintSettings {
  layerHeight: number; // mm
  infillPercentage: number; // 0-100
  wallThickness: number; // mm
  supportDensity: number; // 0-100
  materialType: string; // PLA, PETG, ABS, etc.
  printQuality: string; // draft, normal, high
}

class STLAnalysisService {
  private readonly PRINTER_SPECS = {
    buildVolume: { x: 256, y: 256, z: 256 }, // Bamboo Lab X1 Carbon build volume in mm
    maxLayerHeight: 0.3,
    minLayerHeight: 0.05,
    nozzleDiameter: 0.4,
    maxPrintSpeed: 300, // mm/s
    averagePrintSpeed: 60, // mm/s
  };

  private readonly MATERIAL_DENSITIES = {
    PLA: 1.24, // g/cm³
    PETG: 1.27, // g/cm³
    ABS: 1.04, // g/cm³
    TPU: 1.20, // g/cm³
    ASA: 1.05, // g/cm³
  };

  async analyzeSTLFile(filePath: string, settings: PrintSettings): Promise<STLAnalysis> {
    try {
      // Read STL file
      const stlData = await this.readSTLFile(filePath);
      
      // Parse STL data and calculate geometry
      const geometry = await this.parseSTLData(stlData);
      
      // Calculate material usage
      const materialUsage = this.calculateMaterialUsage(geometry, settings);
      
      // Estimate print time
      const printTime = this.estimatePrintTime(geometry, settings);
      
      // Check printability
      const printabilityScore = this.calculatePrintabilityScore(geometry);
      
      // Determine if support is required
      const supportRequired = this.requiresSupport(geometry, settings);

      return {
        volume: geometry.volume,
        dimensions: geometry.dimensions,
        surfaceArea: geometry.surfaceArea,
        boundingBox: geometry.boundingBox,
        estimatedPrintTime: printTime,
        materialUsage,
        supportRequired,
        printabilityScore,
      };
    } catch (error) {
      console.error('Error analyzing STL file:', error);
      throw new Error('Failed to analyze STL file');
    }
  }

  private async readSTLFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.promises.readFile(filePath);
    } catch (error) {
      throw new Error(`Failed to read STL file: ${error}`);
    }
  }

  private async parseSTLData(stlData: Buffer): Promise<any> {
    try {
      // Use stl-parser library for better STL parsing
      const stlString = stlData.toString('binary');
      const parsed = stlParser.parseStlSync(stlString);
      
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      let totalVolume = 0;
      let totalSurfaceArea = 0;
      let totalTriangles = 0;

      // Process all triangles
      for (const triangle of parsed.triangles) {
        const v1 = triangle.vertex1;
        const v2 = triangle.vertex2;
        const v3 = triangle.vertex3;

        // Update bounding box
        minX = Math.min(minX, v1.x, v2.x, v3.x);
        minY = Math.min(minY, v1.y, v2.y, v3.y);
        minZ = Math.min(minZ, v1.z, v2.z, v3.z);
        maxX = Math.max(maxX, v1.x, v2.x, v3.x);
        maxY = Math.max(maxY, v1.y, v2.y, v3.y);
        maxZ = Math.max(maxZ, v1.z, v2.z, v3.z);

        // Calculate triangle area
        const area = this.calculateTriangleArea(v1, v2, v3);
        totalSurfaceArea += area;

        // Calculate volume using tetrahedron method (more accurate)
        const tetrahedronVolume = this.calculateTetrahedronVolume(
          { x: 0, y: 0, z: 0 }, // Origin
          v1, v2, v3
        );
        totalVolume += Math.abs(tetrahedronVolume);
        totalTriangles++;
      }

      // Convert to cm
      const width = (maxX - minX) / 10;
      const height = (maxY - minY) / 10;
      const depth = (maxZ - minZ) / 10;

      return {
        volume: totalVolume / 1000, // Convert to cm³
        dimensions: {
          width,
          height,
          depth,
        },
        surfaceArea: totalSurfaceArea / 100, // Convert to cm²
        boundingBox: {
          min: { x: minX / 10, y: minY / 10, z: minZ / 10 },
          max: { x: maxX / 10, y: maxY / 10, z: maxZ / 10 },
        },
        triangleCount: totalTriangles,
      };
    } catch (error) {
      console.error('Error parsing STL with library, falling back to manual parsing:', error);
      // Fallback to manual parsing if library fails
      return this.parseSTLDataManual(stlData);
    }
  }

  private async parseSTLDataManual(stlData: Buffer): Promise<any> {
    // Fallback manual STL parser
    const header = stlData.slice(0, 80);
    const triangleCount = stlData.readUInt32LE(80);
    
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let totalVolume = 0;
    let totalSurfaceArea = 0;

    // Parse triangles (limit for performance)
    const maxTriangles = Math.min(triangleCount, 5000);
    for (let i = 0; i < maxTriangles; i++) {
      const offset = 84 + (i * 50);
      
      // Read vertices
      const v1x = stlData.readFloatLE(offset + 12);
      const v1y = stlData.readFloatLE(offset + 16);
      const v1z = stlData.readFloatLE(offset + 20);
      
      const v2x = stlData.readFloatLE(offset + 24);
      const v2y = stlData.readFloatLE(offset + 28);
      const v2z = stlData.readFloatLE(offset + 32);
      
      const v3x = stlData.readFloatLE(offset + 36);
      const v3y = stlData.readFloatLE(offset + 40);
      const v3z = stlData.readFloatLE(offset + 44);

      // Update bounding box
      minX = Math.min(minX, v1x, v2x, v3x);
      minY = Math.min(minY, v1y, v2y, v3y);
      minZ = Math.min(minZ, v1z, v2z, v3z);
      maxX = Math.max(maxX, v1x, v2x, v3x);
      maxY = Math.max(maxY, v1y, v2y, v3y);
      maxZ = Math.max(maxZ, v1z, v2z, v3z);

      // Calculate triangle area
      const area = this.calculateTriangleArea(
        { x: v1x, y: v1y, z: v1z },
        { x: v2x, y: v2y, z: v2z },
        { x: v3x, y: v3y, z: v3z }
      );
      totalSurfaceArea += area;

      // Calculate volume using tetrahedron method
      const tetrahedronVolume = this.calculateTetrahedronVolume(
        { x: 0, y: 0, z: 0 },
        { x: v1x, y: v1y, z: v1z },
        { x: v2x, y: v2y, z: v2z },
        { x: v3x, y: v3y, z: v3z }
      );
      totalVolume += Math.abs(tetrahedronVolume);
    }

    // Scale up volume if we limited triangles
    if (maxTriangles < triangleCount) {
      totalVolume *= (triangleCount / maxTriangles);
    }

    const width = (maxX - minX) / 10;
    const height = (maxY - minY) / 10;
    const depth = (maxZ - minZ) / 10;

    return {
      volume: totalVolume / 1000, // Convert to cm³
      dimensions: {
        width,
        height,
        depth,
      },
      surfaceArea: totalSurfaceArea / 100, // Convert to cm²
      boundingBox: {
        min: { x: minX / 10, y: minY / 10, z: minZ / 10 },
        max: { x: maxX / 10, y: maxY / 10, z: maxZ / 10 },
      },
      triangleCount: maxTriangles,
    };
  }

  private calculateTriangleArea(v1: any, v2: any, v3: any): number {
    // Calculate triangle area using cross product
    const a = Math.sqrt(
      Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2) + Math.pow(v2.z - v1.z, 2)
    );
    const b = Math.sqrt(
      Math.pow(v3.x - v1.x, 2) + Math.pow(v3.y - v1.y, 2) + Math.pow(v3.z - v1.z, 2)
    );
    const c = Math.sqrt(
      Math.pow(v3.x - v2.x, 2) + Math.pow(v3.y - v2.y, 2) + Math.pow(v3.z - v2.z, 2)
    );
    
    const s = (a + b + c) / 2;
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
  }

  private calculateTetrahedronVolume(v0: any, v1: any, v2: any, v3: any): number {
    // Calculate volume of tetrahedron using scalar triple product
    // Volume = |(v1-v0) · ((v2-v0) × (v3-v0))| / 6
    
    const a = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const b = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
    const c = { x: v3.x - v0.x, y: v3.y - v0.y, z: v3.z - v0.z };
    
    // Calculate cross product b × c
    const cross = {
      x: b.y * c.z - b.z * c.y,
      y: b.z * c.x - b.x * c.z,
      z: b.x * c.y - b.y * c.x
    };
    
    // Calculate dot product a · (b × c)
    const dot = a.x * cross.x + a.y * cross.y + a.z * cross.z;
    
    return Math.abs(dot) / 6;
  }

  private calculateMaterialUsage(geometry: any, settings: PrintSettings): number {
    // Calculate material usage based on volume, infill, and support
    const baseVolume = geometry.volume; // cm³
    
    // Calculate wall volume (perimeter * height * wall thickness)
    const wallVolume = this.calculateWallVolume(geometry, settings);
    
    // Calculate infill volume (internal volume * infill percentage)
    const internalVolume = Math.max(0, baseVolume - wallVolume);
    const infillVolume = internalVolume * (settings.infillPercentage / 100);
    
    // Calculate support volume if needed
    const supportVolume = settings.supportRequired ? this.calculateSupportVolume(geometry, settings) : 0;
    
    // Calculate brim/raft volume (estimated)
    const brimVolume = this.calculateBrimVolume(geometry, settings);
    
    const totalVolume = wallVolume + infillVolume + supportVolume + brimVolume;
    
    // Get material density
    const materialDensity = this.MATERIAL_DENSITIES[settings.materialType as keyof typeof this.MATERIAL_DENSITIES] || this.MATERIAL_DENSITIES.PLA;
    
    return totalVolume * materialDensity;
  }

  private calculateWallVolume(geometry: any, settings: PrintSettings): number {
    // Calculate wall volume based on perimeter and layer height
    const perimeter = 2 * (geometry.dimensions.width + geometry.dimensions.depth); // cm
    const height = geometry.dimensions.height; // cm
    const wallThickness = settings.wallThickness / 10; // Convert mm to cm
    
    return perimeter * height * wallThickness;
  }

  private calculateSupportVolume(geometry: any, settings: PrintSettings): number {
    // Estimate support volume (simplified)
    const baseArea = geometry.dimensions.width * geometry.dimensions.depth;
    const supportHeight = geometry.dimensions.height * 0.3; // Assume 30% of height needs support
    const supportDensity = settings.supportDensity / 100;
    
    return baseArea * supportHeight * supportDensity;
  }

  private calculateBrimVolume(geometry: any, settings: PrintSettings): number {
    // Calculate brim/raft volume
    const baseArea = geometry.dimensions.width * geometry.dimensions.depth;
    const brimWidth = 5; // 5mm brim width
    const brimHeight = settings.layerHeight / 10; // Convert mm to cm
    
    // Brim extends around the perimeter
    const perimeter = 2 * (geometry.dimensions.width + geometry.dimensions.depth);
    const brimArea = perimeter * (brimWidth / 10); // Convert mm to cm
    
    return brimArea * brimHeight;
  }

  private estimatePrintTime(geometry: any, settings: PrintSettings): number {
    // Estimate print time based on geometry and settings
    const volume = geometry.volume; // cm³
    const surfaceArea = geometry.surfaceArea; // cm²
    const dimensions = geometry.dimensions;
    
    // Calculate layer count
    const layerCount = Math.ceil(dimensions.height * 10 / settings.layerHeight);
    
    // Get print speeds based on quality and material
    const speeds = this.getPrintSpeeds(settings);
    
    // Calculate perimeter time (outer walls)
    const perimeterLength = 2 * (dimensions.width + dimensions.depth) * 10; // Convert to mm
    const perimeterTime = (perimeterLength * layerCount) / speeds.perimeter;
    
    // Calculate infill time
    const infillArea = dimensions.width * dimensions.depth * 100; // Convert to mm²
    const infillTime = (infillArea * layerCount * settings.infillPercentage / 100) / speeds.infill;
    
    // Calculate support time
    const supportTime = settings.supportRequired ? 
      (infillArea * layerCount * 0.3) / speeds.support : 0;
    
    // Calculate brim time
    const brimLength = 2 * (dimensions.width + dimensions.depth) * 10; // Convert to mm
    const brimTime = (brimLength * 5) / speeds.perimeter; // 5 lines of brim
    
    // Calculate layer change time
    const layerChangeTime = layerCount * 0.2; // 0.2 seconds per layer change
    
    // Calculate acceleration/deceleration overhead (10% of total time)
    const baseTime = perimeterTime + infillTime + supportTime + brimTime + layerChangeTime;
    const overhead = baseTime * 0.1;
    
    const totalTimeSeconds = baseTime + overhead;
    return totalTimeSeconds / 3600; // Convert to hours
  }

  private getPrintSpeeds(settings: PrintSettings): { perimeter: number; infill: number; support: number } {
    const baseSpeed = this.PRINTER_SPECS.averagePrintSpeed;
    
    // Adjust speeds based on quality
    let speedMultiplier = 1.0;
    switch (settings.printQuality) {
      case 'draft':
        speedMultiplier = 1.5;
        break;
      case 'normal':
        speedMultiplier = 1.0;
        break;
      case 'high':
        speedMultiplier = 0.7;
        break;
    }
    
    // Adjust speeds based on material
    let materialMultiplier = 1.0;
    switch (settings.materialType) {
      case 'PLA':
        materialMultiplier = 1.0;
        break;
      case 'PETG':
        materialMultiplier = 0.8;
        break;
      case 'ABS':
        materialMultiplier = 0.6;
        break;
      case 'TPU':
        materialMultiplier = 0.3;
        break;
    }
    
    const finalMultiplier = speedMultiplier * materialMultiplier;
    
    return {
      perimeter: baseSpeed * finalMultiplier,
      infill: baseSpeed * finalMultiplier * 1.2, // Infill is typically faster
      support: baseSpeed * finalMultiplier * 1.5, // Support is typically fastest
    };
  }

  private calculatePrintabilityScore(geometry: any): number {
    let score = 100;
    
    // Check if model fits in build volume
    const buildVolume = this.PRINTER_SPECS.buildVolume;
    if (geometry.dimensions.width > buildVolume.x / 10 || 
        geometry.dimensions.height > buildVolume.y / 10 || 
        geometry.dimensions.depth > buildVolume.z / 10) {
      score -= 50; // Major penalty for oversized model
    }
    
    // Check for very thin features
    const minDimension = Math.min(geometry.dimensions.width, geometry.dimensions.height, geometry.dimensions.depth);
    if (minDimension < 0.5) { // Less than 5mm
      score -= 20;
    }
    
    // Check for very large overhangs
    const aspectRatio = geometry.dimensions.height / Math.max(geometry.dimensions.width, geometry.dimensions.depth);
    if (aspectRatio > 3) {
      score -= 15; // Tall, thin models are harder to print
    }
    
    return Math.max(0, score);
  }

  private requiresSupport(geometry: any, settings: PrintSettings): boolean {
    // Simple support detection based on overhangs
    const aspectRatio = geometry.dimensions.height / Math.max(geometry.dimensions.width, geometry.dimensions.depth);
    
    // If model is very tall relative to its base, it likely needs support
    if (aspectRatio > 2) {
      return true;
    }
    
    // Check for overhangs (simplified)
    const maxOverhangAngle = 45; // degrees
    const layerHeight = settings.layerHeight;
    const maxOverhangDistance = layerHeight / Math.tan(maxOverhangAngle * Math.PI / 180);
    
    // This is a simplified check - real implementation would analyze the actual geometry
    return geometry.dimensions.width > maxOverhangDistance * 2;
  }

  async updateSTLFileAnalysis(stlFileId: string, analysis: STLAnalysis): Promise<void> {
    try {
      await prisma.sTLFile.update({
        where: { id: stlFileId },
        data: {
          volume: analysis.volume,
          dimensions: JSON.stringify(analysis.dimensions),
          surfaceArea: analysis.surfaceArea,
          boundingBox: JSON.stringify(analysis.boundingBox),
          estimatedPrintTime: analysis.estimatedPrintTime,
          materialUsage: analysis.materialUsage,
          supportRequired: analysis.supportRequired,
          printabilityScore: analysis.printabilityScore,
        },
      });
    } catch (error) {
      console.error('Error updating STL file analysis:', error);
      throw error;
    }
  }
}

export default new STLAnalysisService();
