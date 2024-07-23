import fs from 'fs';
import path from 'path';
import { input, password, confirm } from '@inquirer/prompts';
import chalk from 'chalk';


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

  public async updateCredentials(): Promise<void> {
    const shouldUpdate = await confirm({
      message: 'Are you sure you want to update your Supabase credentials?',
    });

    if (shouldUpdate) {
      const projectUrl = await input({
        message: 'Enter your Supabase project URL:',
        validate: (value) => value.trim() !== '' || 'Project URL cannot be empty',
      });

      const apiKey = await password({
        message: 'Enter your Supabase API key:',
        validate: (value) => value.trim() !== '' || 'API key cannot be empty',
      });

      await this.saveConfig({ projectUrl, apiKey });
      console.log(chalk.green('Credentials updated successfully!'));
    }
  }
}