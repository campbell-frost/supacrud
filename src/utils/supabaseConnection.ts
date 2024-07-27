import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigManager } from './configManager.js';

export class SupabaseConnection {
  private supabase: SupabaseClient | null = null;

  constructor(private configManager: ConfigManager) { }

  async connect(): Promise<void> {
    const config = await this.configManager.getConfig();
    this.supabase = createClient(config.projectUrl, config.apiKey);
    await this.testConnection();
  }

  private async testConnection(): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    await this.supabase.from('_test').select('*').limit(1);
  }

  getClient() {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Call connect() first.');
    }
    return this.supabase;
  }
}