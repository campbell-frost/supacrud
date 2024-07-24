import { input, password, select, confirm } from '@inquirer/prompts';
import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { SupabaseConnection } from '../utils/supabaseConnection.js';
import { ConfigManager } from '../utils/configManager.js';
import { OpProvider } from '../utils/opProvider.js';

export default class SupaCRUD extends Command {
  static override description = 'Welcome to supaCRUD';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --table users',
    '<%= config.bin %> <%= command.id %> --table users -c -r',
    '<%= config.bin %> <%= command.id %> -t posts -u -d',
    '<%= config.bin %> <%= command.id %> -t comments -a',
    '<%= config.bin %> <%= command.id %> -s',
  ];

  static override flags = {
    table: Flags.string({ char: 't', description: 'Table name to perform CRUD ops on', required: false }),
    all: Flags.boolean({ char: 'a', description: 'Generate all CRUD operations', required: false }),
    create: Flags.boolean({ char: 'c', description: 'Generate create operation', required: false }),
    read: Flags.boolean({ char: 'r', description: 'Generate read operation', required: false }),
    update: Flags.boolean({ char: 'u', description: 'Generate update operation', required: false }),
    delete: Flags.boolean({ char: 'd', description: 'Generate delete operation', required: false }),
    'set-creds': Flags.boolean({ char: 's', description: 'Update your Supabase credentials', required: false }),
  };

  private configManager: ConfigManager;
  private supabaseConnection: SupabaseConnection;

  constructor(argv: string[], config: any) {
    super(argv, config);
    this.configManager = new ConfigManager(this.config.configDir);
    this.supabaseConnection = new SupabaseConnection(this.configManager);
  }

  private async promptForTable(): Promise<string> {
    return input({
      message: 'Enter the name of the table you want to work with:',
      validate: (value) => value.trim() !== '' || 'Table name cannot be empty',
    });
  }
  private async selectCrudOperation(): Promise<string> {
    return select({
      message: 'Select a CRUD operation:',
      choices: [
        { value: 'all', name: 'Generate all CRUD operations' },
        { value: 'create', name: 'Generate create operation' },
        { value: 'read', name: 'Generate read operation' },
        { value: 'update', name: 'Generate update operation' },
        { value: 'delete', name: 'Generate delete operation' },
      ],
    });
  }

  private async performCRUDOperation(table: string): Promise<void> {
    const operation = await this.selectCrudOperation();
    const crudOperation = OpProvider.getOperation(operation, table);
    await crudOperation.execute();
  }

  private async setCredentials(): Promise<void> {
    const shouldUpdate = await confirm({
      message: 'Are you sure you want to update your Supabase credentials?',
    });

    if (shouldUpdate) {
      const projectUrl = await input({
        message: 'Enter your Supabase project URL:',
        validate: (value) => value.trim() !== '' || 'Project URL cannot be empty',
      });

      const apiKey = await password({
        message: 'Enter your Supabase API key:',
        validate: (value) => value.trim() !== '' || 'API key cannot be empty',
      });

      await this.configManager.saveConfig({ projectUrl, apiKey });
      this.log(chalk.green('Credentials updated successfully!'));
    }
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(SupaCRUD);
    this.log(chalk.yellow('Welcome to supaCRUD!'));
 
    try {
      if (flags['update-credentials']) {
        await this.setCredentials();
        return;
      }

      await this.supabaseConnection.connect();
      const table = flags.table || await this.promptForTable();
      this.log(chalk.blue(`You've selected the "${table}" table.`));

      const ops: string[] = [];
      if (flags.all) ops.push('all');
      if (flags.create) ops.push('create');
      if (flags.read) ops.push('read');
      if (flags.update) ops.push('update');
      if (flags.delete) ops.push('delete');

      if (ops.length === 0) {
        await this.performCRUDOperation(table);
      } else {
        for (const op of ops) {
          const crudOp = OpProvider.getOperation(op, table);
          await crudOp.execute();
        }
      }
      this.log(chalk.green('\nHappy CRUDing! 🚀'));
    } catch (error: any) {
      this.error(chalk.red(`An error occurred: ${error.message}`));
    }
  }
}