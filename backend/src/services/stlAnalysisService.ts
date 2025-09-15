import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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
    // This is a simplified STL parser
    // In production, you'd use a proper STL parsing library
    
    const header = stlData.slice(0, 80);
    const triangleCount = stlData.readUInt32LE(80);
    
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let totalVolume = 0;
    let totalSurfaceArea = 0;

    // Parse triangles (simplified - real implementation would be more complex)
    for (let i = 0; i < Math.min(triangleCount, 1000); i++) { // Limit for performance
      const offset = 84 + (i * 50);
      
      // Read normal vector (12 bytes)
      const nx = stlData.readFloatLE(offset);
      const ny = stlData.readFloatLE(offset + 4);
      const nz = stlData.readFloatLE(offset + 8);
      
      // Read vertices (36 bytes)
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

      // Calculate triangle area (simplified)
      const area = this.calculateTriangleArea(
        { x: v1x, y: v1y, z: v1z },
        { x: v2x, y: v2y, z: v2z },
        { x: v3x, y: v3y, z: v3z }
      );
      totalSurfaceArea += area;
    }

    // Calculate volume using bounding box approximation
    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;
    totalVolume = (width * height * depth) / 1000; // Convert to cm³

    return {
      volume: totalVolume,
      dimensions: {
        width: width / 10, // Convert to cm
        height: height / 10,
        depth: depth / 10,
      },
      surfaceArea: totalSurfaceArea / 100, // Convert to cm²
      boundingBox: {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
      },
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

  private calculateMaterialUsage(geometry: any, settings: PrintSettings): number {
    // Calculate material usage based on volume, infill, and support
    const baseVolume = geometry.volume; // cm³
    const infillVolume = baseVolume * (settings.infillPercentage / 100);
    const wallVolume = this.calculateWallVolume(geometry, settings);
    const supportVolume = settings.supportRequired ? this.calculateSupportVolume(geometry, settings) : 0;
    
    const totalVolume = infillVolume + wallVolume + supportVolume;
    
    // Convert to grams (assuming PLA density)
    const materialDensity = this.MATERIAL_DENSITIES.PLA; // g/cm³
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

  private estimatePrintTime(geometry: any, settings: PrintSettings): number {
    // Estimate print time based on geometry and settings
    const volume = geometry.volume; // cm³
    const surfaceArea = geometry.surfaceArea; // cm²
    
    // Base time calculation
    const layerCount = Math.ceil(geometry.dimensions.height * 10 / settings.layerHeight);
    const averageSpeed = this.PRINTER_SPECS.averagePrintSpeed; // mm/s
    
    // Time for perimeters
    const perimeterTime = (surfaceArea * 10) / averageSpeed; // Convert cm² to mm²
    
    // Time for infill
    const infillTime = (volume * settings.infillPercentage / 100) / averageSpeed;
    
    // Time for supports
    const supportTime = settings.supportRequired ? perimeterTime * 0.3 : 0;
    
    // Layer change time
    const layerChangeTime = layerCount * 0.1; // 0.1 seconds per layer
    
    const totalTimeSeconds = perimeterTime + infillTime + supportTime + layerChangeTime;
    return totalTimeSeconds / 3600; // Convert to hours
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
