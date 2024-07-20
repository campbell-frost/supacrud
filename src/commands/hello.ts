import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '@supabase/supabase-js'
import figlet from 'figlet'
import chalk from 'chalk'

export default class Hello extends Command {
  static override description = 'Welcome to supaCRUD - A Supabase CRUD CLI'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --table users',
  ]

  static override flags = {
    table: Flags.string({
      char: 't',
      description: 'Table name to perform CRUD operations on',
      required: false,
    }),
  }

  static override args = {
    name: Args.string({ description: 'Your name', required: false }),
  }

  private supabase: any

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Hello)

    console.log(chalk.cyan(figlet.textSync('supaCRUD', { horizontalLayout: 'full' })))

    this.log(chalk.green('Welcome to supaCRUD - Your Supabase CRUD CLI!'))

    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    )

    if (args.name) {
      this.log(chalk.yellow(`Hello, ${args.name}! Ready to perform some CRUD operations?`))
    }

    if (flags.table) {
      this.log(chalk.blue(`You've selected the "${flags.table}" table.`))
      await this.showTableInfo(flags.table)
    } else {
      this.log(chalk.magenta('Tip: Use the --table flag to specify a table for CRUD operations.'))
    }

    this.log(chalk.green('\nHappy CRUDing! 🚀'))
  }

  private async showTableInfo(tableName: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        this.log(chalk.cyan(`Table structure for "${tableName}":`))
        this.log(chalk.gray(JSON.stringify(data[0], null, 2)))
      } else {
        this.log(chalk.yellow(`The "${tableName}" table appears to be empty.`))
      }
    } catch (error: any) {
      this.error(chalk.red(`Error accessing "${tableName}" table: ${error.message}`))
    }
  }
}