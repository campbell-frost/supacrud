import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigManager } from './configManager.js';
import chalk from 'chalk';

export class SupabaseConnection {
  private supabase: SupabaseClient | null = null;

  constructor(private configManager: ConfigManager) {}

  async connect(): Promise<void> {
    let config = await this.configManager.getConfig();
    let connectionSuccessful = false;

    while (!connectionSuccessful) {
      try {
        this.supabase = createClient(config.projectUrl, config.apiKey);
        await this.testConnection();
        connectionSuccessful = true;
      } catch (error) {
        console.log(chalk.red('Failed to connect to Supabase. Your credentials might be invalid.'));
        
        if (error instanceof Error && error.message.includes('Invalid API key')) {
          console.log(chalk.yellow('Your API key seems to be invalid. Let\'s update it.'));
          await this.configManager.updateApiKey();
        } else if (error instanceof Error && error.message.includes('Invalid URL')) {
          console.log(chalk.yellow('Your project URL seems to be invalid. Let\'s update it.'));
          await this.configManager.updateProjectUrl();
        } else {
          console.log(chalk.yellow('Let\'s update both your API key and project URL.'));
          await this.configManager.setCredentials(false);
        }

        config = await this.configManager.getConfig();
      }
    }

    console.log(chalk.green('Successfully connected to Supabase!'));
  }

  private async testConnection(): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    try {
      await this.supabase.from('_test').select('*').limit(1);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Connection test failed: ${error.message}`);
      } else {
        throw new Error('Connection test failed with an unknown error');
      }
    }
  }

  getClient() {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Call connect() first.');
    }
    return this.supabase;
  }
}