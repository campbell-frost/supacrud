import { input, select } from '@inquirer/prompts';
import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { SupabaseConnection } from '../utils/supabaseConnection.js';
import { ConfigManager } from '../utils/configManager.js';
import { OpProvider } from '../utils/opProvider.js';

export default class Supacrud extends Command {

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --table users',
    '<%= config.bin %> <%= command.id %> --table users -c -r',
    '<%= config.bin %> <%= command.id %> -t posts -u -d',
    '<%= config.bin %> <%= command.id %> -t comments -a',
    '<%= config.bin %> <%= command.id %> -s',
    '<%= config.bin %> <%= command.id %> -t users -l',

  ];

  static override flags = {
    table: Flags.string({ char: 't', description: 'Table name to perform CRUD ops on', required: false }),
    all: Flags.boolean({ char: 'a', description: 'Generate all CRUD operations', required: false }),
    create: Flags.boolean({ char: 'c', description: 'Generate create operation', required: false }),
    read: Flags.boolean({ char: 'r', description: 'Generate read operation', required: false }),
    update: Flags.boolean({ char: 'u', description: 'Generate update operation', required: false }),
    delete: Flags.boolean({ char: 'd', description: 'Generate delete operation', required: false }),
    list: Flags.boolean({ char: 'l', description: 'Generate list operation', required: false }),
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
        { value: 'list', name: 'Generate list operation' },
        { value: 'delete', name: 'Generate delete operation' },
      ],
    });
  }

  private async performCRUDOperation(table: string): Promise<void> {
    const operation = await this.selectCrudOperation();
    const crudOperation = OpProvider.getOperation(operation, table);
    await crudOperation.execute();
  }

  public async run(): Promise<void> {
    try {
      const { flags } = await this.parse(Supacrud);

      if (flags['set-creds']) {
        await this.configManager.setCredentials(false);
        return;
      }

      if (!(await this.configManager.areCredentialsSet())) {
        this.log(chalk.yellow('Supabase credentials are not set. Let\'s set them up.  \nYour credentials can be found in your supabase project dashboard under Project Settings -> API'));
        await this.configManager.setCredentials(true);
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
      if(flags.list) ops.push('list');

      if (ops.length === 0) {
        await this.performCRUDOperation(table);
      } else {
        for (const op of ops) {
          const crudOp = OpProvider.getOperation(op, table);
          await crudOp.execute();
        }
      }
      this.log(chalk.yellow('\nHappy CRUDing! 🚀'));
    } catch (error) {
      this.log(chalk.red('An error occured', error.message));
    }
  }
}