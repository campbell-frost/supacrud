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
   
    const creds = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    return creds;
  }

  async saveConfig(config: { projectUrl: string; apiKey: string }): Promise<void> {
    try {
      await fs.promises.writeFile(this.configPath, JSON.stringify(config, null, 2));
      console.log(chalk.green('Config saved successfully'));
    } catch (error: any) {
      console.log(chalk.red('Failed to save config:', error.message));
    }
  }

  private async createDefaultConfig(): Promise<void> {
    try {
      const defaultConfig = { projectUrl: '', apiKey: '' };
      await fs.promises.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.promises.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2));
    } catch (error: any) {
      console.log(chalk.red('Failed to create default config:', error.message));
    }
  }

  public async updateCredentials(): Promise<void> {
    const shouldUpdate = await confirm({
      message: 'Are you sure you want to update your Supabase credentials?',
    });
    if (shouldUpdate) {
      await this.setCredentials(false);
    }
  }

  public async setCredentials(firstTime: boolean): Promise<void> {
    let shouldUpdate = firstTime;
    if (!firstTime) {
      shouldUpdate = await confirm({
        message: 'Are you sure you want to update your Supabase credentials?',
      });
    }
    
    if (shouldUpdate) {
      const projectUrl = await this.promptForUrl();
      const apiKey = await this.promptForApiKey();
      
      await this.saveConfig({ projectUrl, apiKey });
      console.log(chalk.green('Credentials updated successfully!'));
    }
  }

  public async areCredentialsSet(): Promise<boolean> {
    const config = await this.getConfig();
    return !!(config.projectUrl && config.apiKey);
  }

  public async promptForApiKey(): Promise<string> {
    return password({
      message: 'Enter your Supabase API key:',
      validate: (value) => value.trim() !== '' || 'API key cannot be empty',
    });
  }

  public async promptForUrl(): Promise<string> {
    return input({
      message: 'Enter your Supabase project URL:',
      validate: (value) => value.trim() !== '' || 'Project URL cannot be empty',
    });
  }

  public async updateApiKey(): Promise<void> {
    const apiKey = await this.promptForApiKey();
    const currentConfig = await this.getConfig();
    await this.saveConfig({ ...currentConfig, apiKey });
  }

  public async updateProjectUrl(): Promise<void> {
    const projectUrl = await this.promptForUrl();
    const currentConfig = await this.getConfig();
    await this.saveConfig({ ...currentConfig, projectUrl });
  }
}