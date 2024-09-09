import fs from 'fs';
import path from 'path';
import { input, password, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
export class ConfigManager {
    configPath;
    constructor(configDir) {
        this.configPath = path.join(configDir, 'config.json');
    }
    async getConfig() {
        if (!fs.existsSync(this.configPath)) {
            await this.createDefaultConfig();
        }
        const creds = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return creds;
    }
    async saveConfig(config) {
        try {
            await fs.promises.writeFile(this.configPath, JSON.stringify(config, null, 2));
            console.log(chalk.green('Config saved successfully'));
        }
        catch (error) {
            console.log(chalk.red('Failed to save config:', error.message));
        }
    }
    async createDefaultConfig() {
        try {
            const defaultConfig = { projectUrl: '', apiKey: '' };
            await fs.promises.mkdir(path.dirname(this.configPath), { recursive: true });
            await fs.promises.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2));
        }
        catch (error) {
            console.log(chalk.red('Failed to create default config:', error.message));
        }
    }
    async updateCredentials() {
        const shouldUpdate = await confirm({
            message: 'Are you sure you want to update your Supabase credentials?',
        });
        if (shouldUpdate) {
            await this.setCredentials(false);
        }
    }
    async setCredentials(firstTime) {
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
    async areCredentialsSet() {
        const config = await this.getConfig();
        return !!(config.projectUrl && config.apiKey);
    }
    async promptForApiKey() {
        return password({
            message: 'Enter your Supabase API key:',
            validate: (value) => value.trim() !== '' || 'API key cannot be empty',
        });
    }
    async promptForUrl() {
        return input({
            message: 'Enter your Supabase project URL:',
            validate: (value) => value.trim() !== '' || 'Project URL cannot be empty',
        });
    }
    async updateApiKey() {
        const apiKey = await this.promptForApiKey();
        const currentConfig = await this.getConfig();
        await this.saveConfig({ ...currentConfig, apiKey });
    }
    async updateProjectUrl() {
        const projectUrl = await this.promptForUrl();
        const currentConfig = await this.getConfig();
        await this.saveConfig({ ...currentConfig, projectUrl });
    }
}
