import { input, select } from '@inquirer/prompts';
import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import * as configManager from './utils/configManager.js';
import * as supabaseConnection from './utils/supabaseConnection.js';
import * as opProvider from './utils/opProvider.js';
import path from 'path';
import process from 'process';
import getTableSchema from './utils/getTableSchema.js';

process.removeAllListeners('warning');

export default class Supacrud extends Command {
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --table users',
    '<%= config.bin %> <%= command.id %> --table users -c -r',
    '<%= config.bin %> <%= command.id %> -t posts -u -d',
    '<%= config.bin %> <%= command.id %> -t comments -a',
    '<%= config.bin %> <%= command.id %> -s',
    '<%= config.bin %> <%= command.id %> -t users -l',
  ];

  static flags = {
    table: Flags.string({ char: 't', description: 'Table name to perform CRUD ops on', required: false }),
    all: Flags.boolean({ char: 'a', description: 'Generate all CRUD operations', required: false }),
    create: Flags.boolean({ char: 'c', description: 'Generate create operation', required: false }),
    read: Flags.boolean({ char: 'r', description: 'Generate read operation', required: false }),
    update: Flags.boolean({ char: 'u', description: 'Generate update operation', required: false }),
    delete: Flags.boolean({ char: 'd', description: 'Generate delete operation', required: false }),
    list: Flags.boolean({ char: 'l', description: 'Generate list operation', required: false }),
    'set-creds': Flags.boolean({ char: 's', description: 'Update your Supabase credentials', required: false }),
  };

  async promptForTable(): Promise<string> {
    return input({
      message: 'Enter the name of the table you want to work with:',
      validate: (value: string) => value.trim() !== '' || 'Table name cannot be empty',
    });
  }

  async selectCrudOperation(): Promise<string> {
    return select({
      message: 'Select a CRUD operation:',
      choices: [
        { value: 'all', name: 'Generate all CRUD operations' },
        { value: 'create', name: 'Generate create operation' },
        { value: 'read', name: 'Generate read operation' },
        { value: 'update', name: 'Generate update operation' },
        { value: 'list', name: 'Generate list operation' },
        { value: 'delete', name: 'Generate delete operation' },
      ],
    });
  }

  async performCRUDOperation(table: string, config: configManager.Config): Promise<void> {
    const operation = await this.selectCrudOperation();
    const crudOperation = opProvider.getOperation(operation, table, config);
    await crudOperation.execute();
  }

  async run(): Promise<void> {
    try {
      this.config.configDir = path.join(this.config.configDir, configManager.getProjectName());
      const configDir = this.config.configDir;
      await supabaseConnection.initializeSupabaseConnection(configDir);
      const config = await configManager.getConfig(configDir);
      const { flags } = await this.parse(Supacrud);

      if (flags['set-creds']) {
        await configManager.setCredentials(configDir, false);
        return;
      }

      const table = flags.table || await this.promptForTable();
      if (!await getTableSchema(table)) {
        throw new Error(`Could not find table ${table}`)
      } else {
        this.log(chalk.blue(`You've selected the "${table}" table.`));
      }
      const ops: string[] = [];
      if (flags.all) ops.push('all');
      if (flags.create) ops.push('create');
      if (flags.read) ops.push('read');
      if (flags.update) ops.push('update');
      if (flags.delete) ops.push('delete');
      if (flags.list) ops.push('list');

      if (ops.length === 0) {
        await this.performCRUDOperation(table, config);
      } else {
        for (const op of ops) {
          const crudOp = opProvider.getOperation(op, table, config);
          await crudOp.execute();
        }
      }

      this.log(chalk.yellow('\nHappy CRUDing! 🚀'));
    } catch (error) {
      if (error instanceof Error) {
        this.log(chalk.red('An error occurred: ', error.message));
      }
    }
  }
}
