import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileManagementService {
  private readonly dataPath = path.join(process.cwd(), 'data');

  constructor() {
    fs.mkdir(this.dataPath, { recursive: true }).catch((err) => {
      console.error('Error creating data directory:', err);
    });
  }

  async readJSON<T extends object>(filename: string): Promise<T | null> {
    const filePath = path.join(this.dataPath, `${filename}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`File not found: ${filePath}`);
        return null;
      }
      console.error(`Error reading file: ${filePath}`, error);
      throw new Error(`Error reading file: ${filePath}`);
    }
  }

  async writeJSON<T extends object>(filename: string, data: T): Promise<void> {
    const filePath = path.join(this.dataPath, `${filename}.json`);
    try {
      await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
      console.log(`File written: ${filePath}`);
    } catch (error) {
      console.error(`Error writing to file: ${filePath}`, error);
      throw new Error(`Error writing to file: ${filePath}`);
    }
  }
}
