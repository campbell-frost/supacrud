import { input, password, select } from '@inquirer/prompts';
import { Args, Command, Flags } from '@oclif/core';
import figlet from 'figlet';
import chalk from 'chalk';
import { SupabaseConnection } from '../utils/supabaseConnection.js';
import { ConfigManager } from '../utils/configManager.js';
import { CrudOperationFactory } from '../utils/operationFactory.js';

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
        { value: 'all', name: 'Create all CRUD Ops' },
        { value: 'create', name: 'Generate create record' },
        { value: 'read', name: 'Generate read record' },
        { value: 'update', name: 'Generate update record' },
        { value: 'delete', name: 'Generate delete record' },
      ],
    });
  }

  private async performCRUDOperation(table: string): Promise<void> {
    const operation = await this.selectCrudOperation();
    const crudOperation = CrudOperationFactory.getOperation(operation, table);
    await crudOperation.execute();
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SupaCRUD);
    console.log(chalk.cyan(figlet.textSync('supaCRUD', { horizontalLayout: 'full' })));

    try {
      await this.supabaseConnection.connect();

      if (args.name) {
        this.log(chalk.yellow(`Hello, ${args.name}!`));
      }

      const table = flags.table || await this.promptForTable();
      this.log(chalk.blue(`You've selected the "${table}" table.`));
      await this.performCRUDOperation(table);

      this.log(chalk.green('\nHappy CRUDing! 🚀'));
    } catch (error: any) {
      this.error(chalk.red(`An error occurred: ${error.message}`));
    }
  }
}