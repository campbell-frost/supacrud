import fs from 'fs';
import path from 'path';

export class ConfigManager {
  private configPath: string;

  constructor(configDir: string) {
    this.configPath = path.join(configDir, 'config.json');
  }

  async getConfig(): Promise<{ projectUrl: string; apiKey: string }> {
    if (!fs.existsSync(this.configPath)) {
      await this.createDefaultConfig();
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  async saveConfig(config: { projectUrl: string; apiKey: string }): Promise<void> {
    fs.writeFileSync(this.configPath, JSON.stringify(config));
  }

  private async createDefaultConfig(): Promise<void> {
    const defaultConfig = { projectUrl: '', apiKey: '' };
    await fs.promises.mkdir(path.dirname(this.configPath), { recursive: true });
    await fs.promises.writeFile(this.configPath, JSON.stringify(defaultConfig));
  }
}