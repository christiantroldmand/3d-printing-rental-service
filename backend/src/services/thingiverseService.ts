import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ThingiverseModel {
  id: string;
  name: string;
  description: string;
  creator: {
    name: string;
    url: string;
  };
  thumbnail: string;
  images: string[];
  files: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  tags: string[];
  downloadCount: number;
  likeCount: number;
  viewCount: number;
  created: string;
  modified: string;
}

interface ThingiverseSearchResult {
  hits: Array<{
    id: string;
    name: string;
    thumbnail: string;
    creator: {
      name: string;
      url: string;
    };
    downloadCount: number;
    likeCount: number;
    viewCount: number;
  }>;
  total: number;
  page: number;
  perPage: number;
}

class ThingiverseService {
  private apiUrl = 'https://api.thingiverse.com';
  private accessToken: string;

  constructor() {
    this.accessToken = process.env.THINGIVERSE_ACCESS_TOKEN || '';
  }

  async searchModels(query: string, page: number = 1, perPage: number = 20): Promise<ThingiverseSearchResult> {
    try {
      const response = await axios.get(`${this.apiUrl}/search/${encodeURIComponent(query)}`, {
        params: {
          page,
          per_page: perPage,
          sort: 'relevant',
          type: 'things',
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      return {
        hits: response.data.hits.map((hit: any) => ({
          id: hit.id.toString(),
          name: hit.name,
          thumbnail: hit.thumbnail,
          creator: {
            name: hit.creator.name,
            url: hit.creator.url,
          },
          downloadCount: hit.download_count || 0,
          likeCount: hit.like_count || 0,
          viewCount: hit.view_count || 0,
        })),
        total: response.data.total,
        page: response.data.page,
        perPage: response.data.per_page,
      };
    } catch (error) {
      console.error('Error searching Thingiverse:', error);
      throw new Error('Failed to search Thingiverse models');
    }
  }

  async getModelDetails(modelId: string): Promise<ThingiverseModel> {
    try {
      const response = await axios.get(`${this.apiUrl}/things/${modelId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data = response.data;

      return {
        id: data.id.toString(),
        name: data.name,
        description: data.description,
        creator: {
          name: data.creator.name,
          url: data.creator.url,
        },
        thumbnail: data.thumbnail,
        images: data.images?.map((img: any) => img.url) || [],
        files: data.files?.map((file: any) => ({
          name: file.name,
          url: file.url,
          size: file.size || 0,
          type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        })) || [],
        tags: data.tags?.map((tag: any) => tag.name) || [],
        downloadCount: data.download_count || 0,
        likeCount: data.like_count || 0,
        viewCount: data.view_count || 0,
        created: data.created_at,
        modified: data.modified_at,
      };
    } catch (error) {
      console.error('Error fetching Thingiverse model details:', error);
      throw new Error('Failed to fetch model details from Thingiverse');
    }
  }

  async downloadSTLFile(fileUrl: string, filename: string): Promise<Buffer> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading STL file from Thingiverse:', error);
      throw new Error('Failed to download STL file from Thingiverse');
    }
  }

  async importModelFromThingiverse(
    modelId: string,
    userId: string,
    selectedFileIndex: number = 0
  ): Promise<{ stlFileId: string; modelInfo: ThingiverseModel }> {
    try {
      // Get model details
      const modelInfo = await this.getModelDetails(modelId);
      
      // Find STL files
      const stlFiles = modelInfo.files.filter(file => 
        file.type === 'stl' || file.name.toLowerCase().endsWith('.stl')
      );

      if (stlFiles.length === 0) {
        throw new Error('No STL files found in this model');
      }

      const selectedFile = stlFiles[selectedFileIndex] || stlFiles[0];
      
      // Download the STL file
      const fileBuffer = await this.downloadSTLFile(selectedFile.url, selectedFile.name);
      
      // Save to local storage
      const filename = `thingiverse_${modelId}_${selectedFile.name}`;
      const filePath = `uploads/thingiverse/${filename}`;
      
      // Create directory if it doesn't exist
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.dirname(filePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, fileBuffer);
      
      // Save to database
      const stlFile = await prisma.sTLFile.create({
        data: {
          filename: filename,
          originalName: selectedFile.name,
          filePath: filePath,
          fileSize: fileBuffer.length,
          mimeType: 'application/sla',
          // Store Thingiverse metadata
          analysisData: {
            thingiverseId: modelId,
            thingiverseUrl: `https://www.thingiverse.com/thing:${modelId}`,
            creator: modelInfo.creator,
            tags: modelInfo.tags,
            downloadCount: modelInfo.downloadCount,
            likeCount: modelInfo.likeCount,
            viewCount: modelInfo.viewCount,
          },
        },
      });

      return {
        stlFileId: stlFile.id,
        modelInfo,
      };
    } catch (error) {
      console.error('Error importing model from Thingiverse:', error);
      throw error;
    }
  }

  async getPopularModels(category?: string, page: number = 1, perPage: number = 20): Promise<ThingiverseSearchResult> {
    try {
      const searchQuery = category ? `category:${category}` : 'popular';
      return await this.searchModels(searchQuery, page, perPage);
    } catch (error) {
      console.error('Error fetching popular models:', error);
      throw new Error('Failed to fetch popular models from Thingiverse');
    }
  }

  async getCategories(): Promise<string[]> {
    // Thingiverse doesn't have a public categories API, so we'll return common categories
    return [
      'Art',
      'Automotive',
      'Electronics',
      'Fashion',
      'Gadgets',
      'Hobby',
      'Household',
      'Learning',
      'Models',
      'Tools',
      'Toys & Games',
    ];
  }
}

export default new ThingiverseService();
