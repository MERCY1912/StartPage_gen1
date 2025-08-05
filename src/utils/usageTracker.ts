import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface UsageData {
  count: number;
  date: string;
  isAnonymous: boolean;
}

export class UsageTracker {
  private static readonly ANONYMOUS_STORAGE_KEY = 'mystical_ai_anonymous_id';
  private static readonly ANONYMOUS_DAILY_LIMIT = 5;
  private static readonly REGISTERED_DAILY_LIMIT = 10;

  private static getAnonymousId(): string {
    let anonymousId = localStorage.getItem(this.ANONYMOUS_STORAGE_KEY);
    if (!anonymousId) {
      anonymousId = uuidv4();
      localStorage.setItem(this.ANONYMOUS_STORAGE_KEY, anonymousId);
    }
    return anonymousId;
  }

  private static clearAnonymousId(): void {
    localStorage.removeItem(this.ANONYMOUS_STORAGE_KEY);
  }

  static async getTodayUsage(userId?: string): Promise<UsageData> {
    const today = new Date().toISOString().split('T')[0];
    const isAnonymous = !userId;
    const identifier = userId || this.getAnonymousId();

    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase environment variables not configured, using fallback values');
        return {
          count: 0,
          date: today,
          isAnonymous,
        };
      }

      // Check if using placeholder values
      if (import.meta.env.VITE_SUPABASE_URL.includes('your-project-url') || 
          import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key')) {
        console.warn('Supabase using placeholder values, using fallback');
        return {
          count: 0,
          date: today,
          isAnonymous,
        };
      }

      let query = supabase
        .from('user_usage')
        .select('*')
        .eq('request_date', today);

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('anonymous_id', identifier);
      }

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116' && error.code !== 'MOCK_ERROR') {
        console.warn('Error fetching usage data, using fallback:', error);
        return {
          count: 0,
          date: today,
          isAnonymous,
        };
      }

      // Handle mock error
      if (error && error.code === 'MOCK_ERROR') {
        return {
          count: 0,
          date: today,
          isAnonymous,
        };
      }

      if (!data) {
        // Create new usage record
        const newUsage = {
          user_id: userId || null,
          anonymous_id: userId ? null : identifier,
          request_date: today,
          request_count: 0,
          is_premium: false,
          premium_expires_at: null,
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('user_usage')
          .insert(newUsage)
          .select()
          .single();

        if (insertError) {
          console.warn('Error creating usage record, using fallback:', insertError);
          return {
            count: 0,
            date: today,
            isAnonymous,
          };
        }

        return {
          count: 0,
          date: today,
          isAnonymous,
        };
      }

      return {
        count: data.request_count,
        date: today,
        isAnonymous,
      };
    } catch (error) {
      console.warn('Error in getTodayUsage, using fallback:', error);
      // Fallback to default values
      return {
        count: 0,
        date: today,
        isAnonymous,
      };
    }
  }

  static async canMakeRequest(userId?: string): Promise<boolean> {
    const usage = await this.getTodayUsage(userId);
    const limit = userId ? this.REGISTERED_DAILY_LIMIT : this.ANONYMOUS_DAILY_LIMIT;
    return usage.count < limit;
  }

  static async getRemainingRequests(userId?: string): Promise<number> {
    const usage = await this.getTodayUsage(userId);
    const limit = userId ? this.REGISTERED_DAILY_LIMIT : this.ANONYMOUS_DAILY_LIMIT;
    return Math.max(0, limit - usage.count);
  }

  static async incrementUsage(userId?: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const isAnonymous = !userId;
    const identifier = userId || this.getAnonymousId();

    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || 
          !import.meta.env.VITE_SUPABASE_ANON_KEY ||
          import.meta.env.VITE_SUPABASE_URL.includes('your-project-url') || 
          import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key')) {
        console.warn('Supabase not configured, skipping usage increment');
        return;
      }

      let query = supabase
        .from('user_usage')
        .select('*')
        .eq('request_date', today);

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('anonymous_id', identifier);
      }

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116' && error.code !== 'MOCK_ERROR') {
        console.warn('Error fetching usage for increment, skipping:', error);
        return;
      }

      // Handle mock error
      if (error && error.code === 'MOCK_ERROR') {
        console.warn('Mock Supabase client, skipping usage increment');
        return;
      }

      if (!data) {
        // Create new record with count 1
        const newUsage = {
          user_id: userId || null,
          anonymous_id: userId ? null : identifier,
          request_date: today,
          request_count: 1,
          is_premium: false,
          premium_expires_at: null,
        };

        const { error: insertError } = await supabase
          .from('user_usage')
          .insert(newUsage);

        if (insertError) {
          console.warn('Error creating usage record for increment, skipping:', insertError);
          return;
        }
      } else {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_usage')
          .update({ 
            request_count: data.request_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);

        if (updateError) {
          console.warn('Error updating usage count, skipping:', updateError);
          return;
        }
      }
    } catch (error) {
      console.warn('Error in incrementUsage, skipping:', error);
      return;
    }
  }

  static async migrateAnonymousUsage(userId: string): Promise<void> {
    const anonymousId = this.getAnonymousId();
    
    try {
      // Update all anonymous usage records to be associated with the user
      const { error } = await supabase
        .from('user_usage')
        .update({
          user_id: userId,
          anonymous_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('anonymous_id', anonymousId);

      if (error) {
        console.error('Error migrating anonymous usage:', error);
        // Don't throw here, as this is not critical
      } else {
        // Clear the anonymous ID from localStorage
        this.clearAnonymousId();
      }
    } catch (error) {
      console.error('Error in migrateAnonymousUsage:', error);
      // Don't throw here, as this is not critical
    }
  }
}