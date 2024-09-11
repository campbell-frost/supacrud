import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as configManager from './configManager.js';
import chalk from 'chalk';

export const initializeSupabaseConnection = async (configDir: string): Promise<SupabaseClient> => {
  let config = await getOrSetConfig(configDir);
  let supabase: SupabaseClient | null = null;

  while (true) {
    try {
      supabase = createClient(config.projectUrl, config.apiKey);
      await testConnection(supabase);
      console.log(chalk.green('Successfully connected to Supabase!'));
      return supabase;
    } catch (error) {
      console.log(chalk.red('Failed to connect to Supabase. Your credentials might be invalid.'));
      console.log(chalk.yellow('Your credentials can be found in your supabase project dashboard under Project Settings -> API'));
      config = await promptForNewCredentials(configDir);
    }
  }
};

const getOrSetConfig = async (configDir: string): Promise<configManager.Config> => {
  let config = await configManager.getConfig(configDir);
  if (!config.projectUrl || !config.apiKey) {
    const envConfig = await configManager.findEnvConfig(process.cwd());
    if (envConfig.projectUrl && envConfig.apiKey) {
      await configManager.saveConfig(configDir, envConfig);
      return envConfig;
    } else {
      console.log(chalk.yellow('Supabase credentials are not set. Let\'s set them up.\nYour credentials can be found in your supabase project dashboard under Project Settings -> API'));
      return await promptForNewCredentials(configDir);
    }
  }
  return config;
};

const promptForNewCredentials = async (configDir: string): Promise<configManager.Config> => {
  const projectUrl = await configManager.promptForUrl();
  const apiKey = await configManager.promptForApiKey();
  const newConfig = { projectUrl, apiKey };
  await configManager.saveConfig(configDir, newConfig);
  console.log(chalk.green('Credentials updated successfully!'));
  return newConfig;
};

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
};