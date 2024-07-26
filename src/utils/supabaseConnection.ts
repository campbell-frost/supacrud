import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigManager } from './configManager.js';

export class SupabaseConnection {
  private supabase: SupabaseClient;

  constructor(private configManager: ConfigManager) { }

  async connect(): Promise<void> {
    const config = await this.configManager.getConfig();
    this.supabase = createClient(config.projectUrl, config.apiKey);
    await this.testConnection();
  }

  private async testConnection(): Promise<void> {
    await this.supabase.from('_test').select('*').limit(1);
  }

  public async getTableSchema(tableName: string) {
    const { data, error } = await this.supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
  
    if (error) {
      console.error('Error fetching table schema:', error)
      return null
    }
    return data
  }

  getClient() {
    return this.supabase;
  }
}