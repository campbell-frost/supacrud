import { input, password, select } from '@inquirer/prompts';
import { Args, Command, Flags } from '@oclif/core';
import { createClient } from '@supabase/supabase-js';
import figlet from 'figlet';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

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

  private async loadConfig(): Promise<{ projectUrl: string; apiKey: string } | null> {
    try {
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
    if (!config) {
      this.log(chalk.yellow('No configuration found. Let\'s set up your Supabase connection.'));
      config = await this.promptForSupabaseCredentials();
      await this.saveConfig(config);
    }
    this.supabase = createClient(config.projectUrl, config.apiKey);
    this.log(chalk.green(`Connected to Supabase project at ${config.projectUrl}`));
  }

  private async showTableInfo(tableName: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.from(tableName).select('*').limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        this.log(chalk.cyan(`Table structure for "${tableName}":`));
        this.log(chalk.gray(JSON.stringify(data[0], null, 2)));
      } else {
        this.log(chalk.yellow(`The "${tableName}" table appears to be empty.`));
      }
    } catch (error: any) {
      this.error(chalk.red(`Error accessing "${tableName}" table: ${error.message}`));
    }
  }

  private async performCRUDOperation(table: string): Promise<void> {
    const operation = await select({
      message: 'Select a CRUD operation:',
      choices: [
        { value: 'create', name: 'Create new record' },
        { value: 'read', name: 'Read records' },
        { value: 'update', name: 'Update a record' },
        { value: 'delete', name: 'Delete a record' },
      ],
    });

    switch (operation) {
      case 'create':
        this.log(chalk.yellow('Create operation not implemented yet.'));
        break;
      case 'read':
        await this.showTableInfo(table);
        break;
      case 'update':
        this.log(chalk.yellow('Update operation not implemented yet.'));
        break;
      case 'delete':
        this.log(chalk.yellow('Delete operation not implemented yet.'));
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