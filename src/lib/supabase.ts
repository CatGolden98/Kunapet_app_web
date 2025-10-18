import { createClient } from '@supabase/supabase-js';

// Fallback para producción (GitHub Pages) sin Secrets
const isGhPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');

// TODO: Reemplaza FALLBACK_ANON por tu anon key del proyecto hrtsvbpbvxsubeepwgqh
const FALLBACK_URL = 'https://hrtsvbpbvxsubeepwgqh.supabase.co';
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhydHN2YnBidnhzdWJlZXB3Z3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODkxNTMsImV4cCI6MjA3NjA2NTE1M30.J1AYc9lM0k2tC-kr_m8LFo4wk33k37hOjFyUX0e_0jY';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (isGhPages ? FALLBACK_URL : '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (isGhPages ? FALLBACK_ANON : '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabase] missing url/key', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey, isGhPages });
  throw new Error('Missing Supabase environment variables');
}

if (typeof window !== 'undefined') {
  console.info('[supabase]', { url: supabaseUrl, gh: isGhPages, keyPresent: !!supabaseAnonKey });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  },
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
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          user_type: 'customer' | 'provider';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      pets: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          species: string;
          breed: string | null;
          age: number | null;
          weight: number | null;
          photo_url: string | null;
          medical_notes: string | null;
          created_at: string;
        };
      };
      providers: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          description: string | null;
          logo_url: string | null;
          rating: number;
          total_reviews: number;
          verified: boolean;
          ong_alliance: boolean;
          ong_details: any;
          latitude: number | null;
          longitude: number | null;
          address: string | null;
          delivery_available: boolean;
          delivery_zones: any;
          created_at: string;
        };
      };
      services: {
        Row: {
          id: string;
          provider_id: string;
          category: string;
          name: string;
          description: string | null;
          price: number;
          duration_minutes: number | null;
          species_allowed: string[];
          photos: string[];
          active: boolean;
          created_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          provider_id: string;
          category: string;
          name: string;
          description: string | null;
          price: number;
          discount_percentage: number;
          stock: number;
          photos: string[];
          trending: boolean;
          featured: boolean;
          species: string[];
          created_at: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          provider_id: string;
          booking_type: 'service' | 'product';
          service_id: string | null;
          product_id: string | null;
          pet_id: string | null;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          scheduled_date: string | null;
          total_amount: number;
          kunapuntos_used: number;
          payment_status: string;
          delivery_address: string | null;
          notes: string | null;
          created_at: string;
        };
      };
      kunapuntos: {
        Row: {
          id: string;
          user_id: string;
          points: number;
          transaction_type: 'earned' | 'redeemed' | 'bonus';
          booking_id: string | null;
          description: string;
          created_at: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          plan_type: 'free' | 'monthly' | 'annual';
          status: 'active' | 'cancelled' | 'expired';
          start_date: string;
          end_date: string | null;
          auto_renew: boolean;
          created_at: string;
        };
      };
    };
  };
}
