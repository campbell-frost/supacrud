import fs from 'fs';
import path from 'path';
import { input, password, confirm } from '@inquirer/prompts';
import chalk from 'chalk';

type Config = {
  projectUrl: string;
  apiKey: string;
}

export const getConfig = async (configDir: string): Promise<Config> => {
  const configPath = path.join(configDir, 'config.json');
  if (!fs.existsSync(configPath)) {
    await createDefaultConfig(configPath);
  }

  const creds = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return creds;
}

export const saveConfig = async (configDir: string, config: Config): Promise<void> => {
  const configPath = path.join(configDir, 'config.json');
  try {
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green('Config saved successfully'));
  } catch (error: any) {
    console.log(chalk.red('Failed to save config:', error.message));
  }
}

  const createDefaultConfig =async (configPath: string): Promise <void> => {
  try {
    const defaultConfig = { projectUrl: '', apiKey: '' };
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
  } catch(error: any) {
    console.log(chalk.red('Failed to create default config:', error.message));
  }
}

  export const updateCredentials = async (configDir: string): Promise <void> => {
  const shouldUpdate = await confirm({
    message: 'Are you sure you want to update your Supabase credentials?',
  });
  if(shouldUpdate) {
    await setCredentials(configDir, false);
  }
}

export const setCredentials = async (configDir: string, firstTime: boolean): Promise<void> => {
  let shouldUpdate = firstTime;
  if (!firstTime) {
    shouldUpdate = await confirm({
      message: 'Are you sure you want to update your Supabase credentials?',
    });
  }

  if (shouldUpdate) {
    const projectUrl = await promptForUrl();
    const apiKey = await promptForApiKey();
    await saveConfig(configDir, { projectUrl, apiKey });
    console.log(chalk.green('Credentials updated successfully!'));
  }
};

export const areCredentialsSet = async (configDir: string): Promise<boolean> => {
  const config = await getConfig(configDir);
  return !!(config.projectUrl && config.apiKey);
};

const promptForApiKey = async (): Promise<string> => {
  return password({
    message: 'Enter your Supabase API key:',
    validate: (value) => value.trim() !== '' || 'API key cannot be empty',
  });
};

const promptForUrl = async (): Promise<string> => {
  return input({
    message: 'Enter your Supabase project URL:',
    validate: (value) => value.trim() !== '' || 'Project URL cannot be empty',
  });
};

export const updateApiKey = async (configDir: string): Promise<void> => {
  const apiKey = await promptForApiKey();
  const currentConfig = await getConfig(configDir);
  await saveConfig(configDir, { ...currentConfig, apiKey });
};

export const updateProjectUrl = async (configDir: string): Promise<void> => {
  const projectUrl = await promptForUrl();
  const currentConfig = await getConfig(configDir);
  await saveConfig(configDir, { ...currentConfig, projectUrl });
};