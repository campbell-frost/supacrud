import fs from 'fs';
import path from 'path';
import { input, password, confirm } from '@inquirer/prompts';
import chalk from 'chalk';

export type Config = {
  env: boolean;
  prefix?: {
    projectUrl: string;
    apiKey: string;
  };
  suffix: {
    projectUrl: string;
    apiKey: string;
  };
};

export const findEnvConfig = async (rootDir: string): Promise<Config | null> => {
  const files = await fs.promises.readdir(rootDir);
  const envFiles = files.filter(file => file.startsWith('.env') || file.startsWith('.env.'));
  for (const file of envFiles) {
    const filePath = path.join(rootDir, file);
    try {
      const fileContents = await fs.promises.readFile(filePath, 'utf-8');
      const lines = fileContents.split('\n');
      let projectUrlPrefix: string | undefined = undefined;
      let projectUrlValue: string | undefined = undefined;
      let apiKeyPrefix: string | undefined = undefined;
      let apiKeyValue: string | undefined = undefined;

      for (const line of lines) {
        if (line.includes("supabase.co")) {
          [projectUrlPrefix, projectUrlValue] = line.split('=');
          break;
        }
      }
      if (!projectUrlValue || !projectUrlPrefix) {
        return null;
      }
      for (const line of lines) {
        if (isJwt(line.split("=")[1])) {
          const jwt = decodeJwt(line.split("=")[1])
          // if the jwt includes the first part of the projectUrl, it is the key for the project.
          if (jwt.includes(projectUrlValue.substring(8, 28))) {
            [apiKeyPrefix, apiKeyValue] = line.split('=');
            break;
          }
        }
      }
      if (!apiKeyValue || !apiKeyPrefix) {
        return null;
      }
      return {
        env: true,
        prefix: {
          projectUrl: projectUrlPrefix.trim(),
          apiKey: apiKeyPrefix.trim(),
        },
        suffix: {
          projectUrl: projectUrlValue.trim(),
          apiKey: apiKeyValue.trim(),
        },
      };

    } catch (error) {
      if (error instanceof Error && "code" in error && error.code !== 'ENOENT') {
        return null;
      }
    }
  }

  return null;
};

const decodeJwt = (jwt: string): string => jwt.split(".").map((s, i) => i < 2 ? atob(s.replace("-", "+").replace("_", "/")) : s).toString();

const isJwt = (token: string): boolean => {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const [header, _, signature] = parts;
    const headerDecoded = atob(header.replace(/-/g, '+').replace(/_/g, '/'));
    return headerDecoded.includes("alg") && headerDecoded.includes("JWT") && signature.length > 0;
  } catch (error) {
    return false;
  }
}

export const getConfig = async (configDir: string): Promise<Config> => {
  const configPath = path.join(configDir, 'config.json');
  if (!fs.existsSync(configPath)) {
    return createDefaultConfig(configPath);
  }
  const config = JSON.parse(await fs.promises.readFile(configPath, 'utf8'));
  return config;
};

export const saveConfig = async (configDir: string, config: Config): Promise<void> => {
  const configPath = path.join(configDir, 'config.json');
  try {
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error: any) {
    console.log(chalk.red('Failed to save config:', error.message));
  }
};

const createDefaultConfig = async (configPath: string): Promise<Config> => {
  try {
    const envConfig = await findEnvConfig(process.cwd());
    if (envConfig) {
      await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
      await fs.promises.writeFile(configPath, JSON.stringify(envConfig, null, 2));
      return envConfig;
    } else {
      const projectUrl = await promptForUrl();
      const apiKey = await promptForApiKey();
      const config: Config = {
        env: false,
        suffix: { projectUrl, apiKey },
      };
      await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
      await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
      return config;
    }
  } catch (error: any) {
    console.log(chalk.red('Failed to create default config:', error.message));
    throw error;
  }
};

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
};

export const setCredentials = async (configDir: string, firstTime: boolean): Promise<void> => {
  let shouldUpdate = firstTime;
  if (!firstTime) {
    shouldUpdate = await confirm({
      message: 'Are you sure you want to update your Supabase credentials?',
    });
  }

  if (shouldUpdate) {
    const envConfig = await findEnvConfig(process.cwd());

    if (envConfig) {
      await saveConfig(configDir, envConfig);
    } else {
      const projectUrl = await promptForUrl();
      const apiKey = await promptForApiKey();

      const newConfig: Config = {
        env: false,
        suffix: { projectUrl, apiKey }
      };

      await saveConfig(configDir, newConfig);
    }

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
