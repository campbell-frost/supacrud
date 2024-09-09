import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as configManager from './configManager.js';
import chalk from 'chalk';

export const connect = async (configDir: string): Promise<void> => {
  let config = await configManager.getConfig(configDir);
  let connectionSuccessful = false;
  let supabase: SupabaseClient | null = null;

  while (!connectionSuccessful) {
    try {
      supabase = createClient(config.projectUrl, config.apiKey);
      await testConnection(supabase);
      connectionSuccessful = true;
    } catch (error) {
      console.log(chalk.red('Failed to connect to Supabase. Your credentials might be invalid.'));

      if (error instanceof Error && error.message.includes('Invalid API key')) {
        console.log(chalk.yellow('Your API key seems to be invalid. Let\'s update it.'));
        await configManager.updateApiKey(configDir);
      } else if (error instanceof Error && error.message.includes('Invalid URL')) {
        console.log(chalk.yellow('Your project URL seems to be invalid. Let\'s update it.'));
        await configManager.updateProjectUrl(configDir);
      } else {
        console.log(chalk.yellow('Your project URL and your API key seem to be invalid. Let\'s try updating both.'));
        await configManager.setCredentials(configDir, false);
      }

      config = await configManager.getConfig(configDir);
    }
  }

  console.log(chalk.green('Successfully connected to Supabase!'));
}

const testConnection = async (supabase: SupabaseClient): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  try {
    await supabase.from('_test').select('*').limit(1);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Connection test failed: ${error.message}`);
    } else {
      throw new Error('Connection test failed with an unknown error');
    }
  }
}