import { input, password, select } from '@inquirer/prompts';
import { Args, Command, Flags } from '@oclif/core';
import { createClient } from '@supabase/supabase-js';
import figlet from 'figlet';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { allOps, createOps, deleteOps, readOps, updateOps } from '../utils/crudWrites.js';

export default class SupaCRUD extends Command {
  static override description = 'Welcome to supaCRUD';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --table users',
  ];
  static override flags = {
    table: Flags.string({ char: 't', description: 'Table name to perform CRUD ops on', required: false }),
  };
  static override args = {
    name: Args.string({ description: 'Your name', required: false }),
  };

  private supabase: any;
  private configPath = path.join(this.config.configDir, 'config.json');

  private async doesConfigExist(): Promise<boolean> {
    if (!fs.existsSync(this.configPath)) {
      await fs.promises.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.promises.writeFile(this.configPath, '{}');
      return false;
    }
    return true;
  }

  private async loadConfig(): Promise<{ projectUrl: string; apiKey: string } | null> {
    try {
      this.doesConfigExist();
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return config;
    } catch (error) {
      return null;
    }
  }

  private async saveConfig(config: { projectUrl: string; apiKey: string }): Promise<void> {
    fs.writeFileSync(this.configPath, JSON.stringify(config));
  }

  private async promptForSupabaseCredentials(): Promise<{ projectUrl: string; apiKey: string }> {
    const projectUrl = await input({
      message: 'Enter your Supabase project URL:',
      validate: (value) => value.trim() !== '' || 'Project URL cannot be empty',
    });
    const apiKey = await password({
      message: 'Enter your Supabase API key:',
      validate: (value) => value.trim() !== '' || 'API key cannot be empty',
    });
    return { projectUrl, apiKey };
  }

  private async connectToSupabase(): Promise<void> {
    let config = await this.loadConfig();
    let connectionSuccessful = false;

    while (!connectionSuccessful) {
      if (!config) {
        this.log(chalk.yellow('No configuration found. Let\'s set up your Supabase connection.'));
        config = await this.promptForSupabaseCredentials();
        await this.saveConfig(config);
      }

      try {
        this.supabase = createClient(config.projectUrl, config.apiKey);
        await this.supabase.from('_test').select('*').limit(1);
        connectionSuccessful = true;
        this.log(chalk.green(`Connected to Supabase project at ${config.projectUrl}`));
      } catch (error: any) {
        if (error.message.includes('Invalid URL')) {
          this.log(chalk.red('Error: Invalid Supabase URL. Please enter your credentials again.'));
          config = await this.promptForSupabaseCredentials();
          await this.saveConfig(config);
        } else {
          throw error;
        }
      }
    }
  }

  private async performCRUDOperation(table: string): Promise<void> {
    const operation = await select({
      message: 'Select a CRUD operation:',
      choices: [
        { value: 'create', name: 'Generate create record' },
        { value: 'read', name: 'Generate read record' },
        { value: 'update', name: 'Generate update record' },
        { value: 'delete', name: 'Generate delete record' },
        { value: 'all', name: 'Create all CRUD Ops' }
      ],
    });

    switch (operation) {
      case 'create':
        await createOps(table);
        break;
      case 'read':
        await readOps(table);
        break;
      case 'update':
        await updateOps(table);
        break;
      case 'delete':
        await deleteOps(table);
        break;
      case 'all':
        await allOps(table);
        break;
    }
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SupaCRUD);
    console.log(chalk.cyan(figlet.textSync('supaCRUD', { horizontalLayout: 'full' })));

    try {
      await this.connectToSupabase();

      if (args.name) {
        this.log(chalk.yellow(`Hello, ${args.name}!`));
      }

      if (flags.table) {
        this.log(chalk.blue(`You've selected the "${flags.table}" table.`));
        await this.performCRUDOperation(flags.table);
      } else {
        const table = await input({
          message: 'Enter the name of the table you want to work with:',
          validate: (value) => value.trim() !== '' || 'Table name cannot be empty',
        });
        await this.performCRUDOperation(table);
      }

      this.log(chalk.green('\nHappy CRUDing! 🚀'));
    } catch (error: any) {
      this.error(chalk.red(`An error occurred: ${error.message}`));
    }
  }
}