import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '@supabase/supabase-js'
import figlet from 'figlet'
import chalk from 'chalk'
import { getSupabaseConfig, getProjectDetails } from '../utils/supabaseConfig.js';


export default class SupaCRUD extends Command {
  static override description = 'Welcome to supaCRUD'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --table users',
  ]

  static override flags = {
    table: Flags.string({
      char: 't',
      description: 'Table name to perform CRUD ops on',
      required: false,
    }),
  }

  static override args = {
    name: Args.string({ description: 'Your name', required: false }),
  }

  private supabase: any

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SupaCRUD);

    console.log(chalk.cyan(figlet.textSync('supaCRUD', { horizontalLayout: 'full' })));

    try {
      const { projectUrl, apiKey } = await getProjectDetails();
      const supabase = createClient(projectUrl, apiKey);
      this.log(`Connected to Supabase project at ${projectUrl}`);
    } catch (error) {
      this.error(`Failed to get Supabase configuration: ${error.message}`);
    }
    if (args.name) {
      this.log(chalk.yellow(`Hello, ${args.name}!`));
    }

    if (flags.table) {
      this.log(chalk.blue(`You've selected the "${flags.table}" table.`));
      await this.showTableInfo(flags.table);
    } else {
      this.log(chalk.magenta('Tip: Use the --table flag to specify a table for CRUD operations.'));
    }

    this.log(chalk.green('\nHappy CRUDing! 🚀'));
  }

  private async showTableInfo(tableName: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        this.log(chalk.cyan(`Table structure for "${tableName}":`));
        this.log(chalk.gray(JSON.stringify(data[0], null, 2)));
      } else {
        this.log(chalk.yellow(`The "${tableName}" table appears to be empty.`));
        this.log(data);
      }
    } catch (error: any) {
      this.error(chalk.red(`Error accessing "${tableName}" table: ${error.message}`));
    }
  }
}