import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from './configManager.js';

export class SupabaseConnection {
  private supabase: any;

  constructor(private configManager: ConfigManager) {}

  async connect(): Promise<void> {
    const config = await this.configManager.getConfig();
    this.supabase = createClient(config.projectUrl, config.apiKey);
    await this.testConnection();
  }

  private async testConnection(): Promise<void> {
    await this.supabase.from('_test').select('*').limit(1);
  }

  getClient() {
    return this.supabase;
  }
}