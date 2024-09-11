import fs from 'fs';
import path from 'path';
import { input, password, confirm } from '@inquirer/prompts';
import chalk from 'chalk';

export type Config = {
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

export const findEnvConfig = async (rootDir: string): Promise<Config> => {
  const config: Config = {
    projectUrl: "",
    apiKey: ""
  };

  const files = await fs.promises.readdir(rootDir);
  const envFiles = files.filter(file => file.startsWith('.env') || file.startsWith('.env.'));
  let fileContents = '';

  for (const file of envFiles) {
    const filePath = path.join(rootDir, file);
    try {
      fileContents = fs.readFileSync(filePath, 'utf-8');
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        return config;
      }
    }
  }

  if (!fileContents) {
    return config;
  }

  try {
    const [lineOne, lineTwo] = fileContents.split('\n');
    config.projectUrl = lineOne.split("=")[1];
    config.apiKey = lineTwo.split("=")[1];

    return config;
  } catch (error) {
    return config;
  }
}

export const saveConfig = async (configDir: string, config: Config): Promise<void> => {
  const configPath = path.join(configDir, 'config.json');
  try {
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error: any) {
    console.log(chalk.red('Failed to save config:', error.message));
  }
}

const createDefaultConfig = async (configPath: string): Promise<void> => {
  try {
    const defaultConfig = await findEnvConfig(process.cwd());
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
  } catch (error: any) {
    if (error instanceof Error) {
      console.log(chalk.red('Failed to create default config:', error.message));
    } else {
      console.log(chalk.red('Failed to create default config:', error));
    }
  }
}

export const getProjectName = () => {
  const dir = process.cwd().split('/');
  return dir[dir.length - 1] || dir[dir.length - 2];
}

export const updateCredentials = async (configDir: string): Promise<void> => {
  const shouldUpdate = await confirm({
    message: 'Are you sure you want to update your Supabase credentials?',
  });
  if (shouldUpdate) {
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

export const promptForApiKey = async (): Promise<string> => {
  return password({
    message: 'Enter your Supabase API key:',
    validate: (value) => value.trim() !== '' || 'API key cannot be empty',
  });
};

export const promptForUrl = async (): Promise<string> => {
  return input({
    message: 'Enter your Supabase project URL:',
    validate: (value) => value.trim() !== '' || 'Project URL cannot be empty',
  });
};
