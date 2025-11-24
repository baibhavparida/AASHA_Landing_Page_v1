import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase initialization:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl || 'NOT SET',
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  allEnvVars: import.meta.env
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');
  console.error('Available env vars:', Object.keys(import.meta.env));
  console.error('Raw env values:', {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY
  });

  const errorMessage = 'Missing Supabase environment variables. The .env file exists but variables are not loaded. The dev server must be restarted.';
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone_number: string;
          country_code: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: string;
          language: string;
          marital_status: string;
          registration_type: 'myself' | 'loved-one';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone_number: string;
          country_code: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: string;
          language: string;
          marital_status: string;
          registration_type: 'myself' | 'loved-one';
          created_at?: string;
          updated_at?: string;
        };
      };
      elderly_profiles: {
        Row: {
          id: string;
          profile_id: string | null;
          caregiver_profile_id: string | null;
          phone_number: string;
          country_code: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: string;
          language: string;
          marital_status: string;
          call_time_preference: 'morning' | 'afternoon' | 'evening';
          relationship_to_caregiver: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          caregiver_profile_id?: string | null;
          phone_number: string;
          country_code: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: string;
          language: string;
          marital_status: string;
          call_time_preference: 'morning' | 'afternoon' | 'evening';
          relationship_to_caregiver?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      medications: {
        Row: {
          id: string;
          elderly_profile_id: string;
          name: string;
          dosage: string;
          frequency: string;
          time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          elderly_profile_id: string;
          name: string;
          dosage: string;
          frequency: string;
          time: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      interests: {
        Row: {
          id: string;
          elderly_profile_id: string;
          interest: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          elderly_profile_id: string;
          interest: string;
          created_at?: string;
        };
      };
      calls: {
        Row: {
          id: string;
          retell_call_id: string;
          elderly_profile_id: string;
          call_type: 'onboarding' | 'daily_checkin';
          call_status: 'successful' | 'voicemail' | 'failed';
          started_at: string;
          ended_at: string | null;
          duration_seconds: number;
          agent_id: string | null;
          access_token: string | null;
          access_token_expires_at: string | null;
          raw_webhook_data: Record<string, any>;
          retell_webhook_received: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          retell_call_id: string;
          elderly_profile_id: string;
          call_type: 'onboarding' | 'daily_checkin';
          call_status: 'successful' | 'voicemail' | 'failed';
          started_at: string;
          ended_at?: string | null;
          duration_seconds?: number;
          agent_id?: string | null;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          raw_webhook_data?: Record<string, any>;
          retell_webhook_received?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          call_status?: 'successful' | 'voicemail' | 'failed';
          ended_at?: string | null;
          duration_seconds?: number;
          agent_id?: string | null;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          raw_webhook_data?: Record<string, any>;
          retell_webhook_received?: boolean;
          updated_at?: string;
        };
      };
      call_analysis: {
        Row: {
          id: string;
          call_id: string;
          call_summary: string;
          user_sentiment: 'Positive' | 'Negative' | 'Neutral' | null;
          call_successful: boolean;
          in_voicemail: boolean;
          medicine_taken: boolean | null;
          custom_analysis_data: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          call_summary?: string;
          user_sentiment?: 'Positive' | 'Negative' | 'Neutral' | null;
          call_successful?: boolean;
          in_voicemail?: boolean;
          medicine_taken?: boolean | null;
          custom_analysis_data?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          call_summary?: string;
          user_sentiment?: 'Positive' | 'Negative' | 'Neutral' | null;
          call_successful?: boolean;
          in_voicemail?: boolean;
          medicine_taken?: boolean | null;
          custom_analysis_data?: Record<string, any>;
        };
      };
      call_transcripts: {
        Row: {
          id: string;
          call_id: string;
          transcript_text: string | null;
          speaker_segments: Record<string, any>;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          transcript_text?: string | null;
          speaker_segments?: Record<string, any>;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          transcript_text?: string | null;
          speaker_segments?: Record<string, any>;
        };
      };
      call_costs: {
        Row: {
          id: string;
          call_id: string;
          combined_cost: number;
          llm_tokens_used: number;
          llm_average_tokens: number;
          llm_num_requests: number;
          llm_token_values: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          combined_cost?: number;
          llm_tokens_used?: number;
          llm_average_tokens?: number;
          llm_num_requests?: number;
          llm_token_values?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          combined_cost?: number;
          llm_tokens_used?: number;
          llm_average_tokens?: number;
          llm_num_requests?: number;
          llm_token_values?: Record<string, any>;
        };
      };
      daily_medicine_log: {
        Row: {
          id: string;
          elderly_profile_id: string;
          log_date: string;
          medicine_taken: boolean;
          call_id: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          elderly_profile_id: string;
          log_date: string;
          medicine_taken: boolean;
          call_id?: string | null;
          logged_at?: string;
        };
        Update: {
          medicine_taken?: boolean;
          call_id?: string | null;
        };
      };
      special_events: {
        Row: {
          id: string;
          elderly_profile_id: string;
          event_name: string;
          event_date: string;
          event_type: 'birthday' | 'anniversary' | 'appointment' | 'family_visit' | 'holiday' | 'other';
          description: string;
          is_recurring: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          elderly_profile_id: string;
          event_name: string;
          event_date: string;
          event_type: 'birthday' | 'anniversary' | 'appointment' | 'family_visit' | 'holiday' | 'other';
          description?: string;
          is_recurring?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          event_name?: string;
          event_date?: string;
          event_type?: 'birthday' | 'anniversary' | 'appointment' | 'family_visit' | 'holiday' | 'other';
          description?: string;
          is_recurring?: boolean;
        };
      };
      medication_tracking: {
        Row: {
          id: string;
          medication_id: string;
          scheduled_datetime: string;
          taken_datetime: string | null;
          status: 'taken' | 'missed' | 'skipped';
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          medication_id: string;
          scheduled_datetime: string;
          taken_datetime?: string | null;
          status: 'taken' | 'missed' | 'skipped';
          notes?: string;
          created_at?: string;
        };
        Update: {
          taken_datetime?: string | null;
          status?: 'taken' | 'missed' | 'skipped';
          notes?: string;
        };
      };
      family_member_alerts: {
        Row: {
          id: string;
          elderly_profile_id: string;
          family_member_id: string;
          alert_type: 'medication_missed' | 'no_conversation' | 'mood_change' | 'health_concern' | 'system_notification';
          severity: 'low' | 'medium' | 'high' | 'critical';
          title: string;
          description: string;
          related_entity_id: string | null;
          is_acknowledged: boolean;
          acknowledged_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          elderly_profile_id: string;
          family_member_id: string;
          alert_type: 'medication_missed' | 'no_conversation' | 'mood_change' | 'health_concern' | 'system_notification';
          severity: 'low' | 'medium' | 'high' | 'critical';
          title: string;
          description: string;
          related_entity_id?: string | null;
          is_acknowledged?: boolean;
          acknowledged_at?: string | null;
          created_at?: string;
        };
        Update: {
          is_acknowledged?: boolean;
          acknowledged_at?: string | null;
        };
      };
      shared_content: {
        Row: {
          id: string;
          elderly_profile_id: string;
          uploaded_by: string;
          content_type: 'family_news' | 'photo' | 'milestone' | 'reminder' | 'conversation_topic';
          title: string;
          description: string;
          file_url: string | null;
          tags: string[];
          is_approved: boolean;
          mention_priority: 'low' | 'normal' | 'high';
          expiration_date: string | null;
          mentioned_count: number;
          last_mentioned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          elderly_profile_id: string;
          uploaded_by: string;
          content_type: 'family_news' | 'photo' | 'milestone' | 'reminder' | 'conversation_topic';
          title: string;
          description: string;
          file_url?: string | null;
          tags?: string[];
          is_approved?: boolean;
          mention_priority?: 'low' | 'normal' | 'high';
          expiration_date?: string | null;
          mentioned_count?: number;
          last_mentioned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content_type?: 'family_news' | 'photo' | 'milestone' | 'reminder' | 'conversation_topic';
          title?: string;
          description?: string;
          file_url?: string | null;
          tags?: string[];
          is_approved?: boolean;
          mention_priority?: 'low' | 'normal' | 'high';
          expiration_date?: string | null;
        };
      };
      family_activity_log: {
        Row: {
          id: string;
          elderly_profile_id: string;
          family_member_id: string;
          action_type: 'profile_updated' | 'medication_added' | 'medication_updated' | 'medication_deleted' | 'event_created' | 'event_updated' | 'event_deleted' | 'content_uploaded' | 'interest_added' | 'interest_removed' | 'alert_acknowledged';
          entity_type: 'profile' | 'medication' | 'event' | 'interest' | 'content' | 'conversation' | 'alert';
          entity_id: string | null;
          description: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          elderly_profile_id: string;
          family_member_id: string;
          action_type: 'profile_updated' | 'medication_added' | 'medication_updated' | 'medication_deleted' | 'event_created' | 'event_updated' | 'event_deleted' | 'content_uploaded' | 'interest_added' | 'interest_removed' | 'alert_acknowledged';
          entity_type: 'profile' | 'medication' | 'event' | 'interest' | 'content' | 'conversation' | 'alert';
          entity_id?: string | null;
          description: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      conversation_prompts: {
        Row: {
          id: string;
          elderly_profile_id: string;
          created_by: string;
          prompt_text: string;
          category: 'memory' | 'family_update' | 'health_check' | 'activity_suggestion' | 'general';
          priority: 'low' | 'normal' | 'high';
          is_active: boolean;
          used_count: number;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          elderly_profile_id: string;
          created_by: string;
          prompt_text: string;
          category: 'memory' | 'family_update' | 'health_check' | 'activity_suggestion' | 'general';
          priority?: 'low' | 'normal' | 'high';
          is_active?: boolean;
          used_count?: number;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: {
          prompt_text?: string;
          category?: 'memory' | 'family_update' | 'health_check' | 'activity_suggestion' | 'general';
          priority?: 'low' | 'normal' | 'high';
          is_active?: boolean;
        };
      };
    };
  };
}
