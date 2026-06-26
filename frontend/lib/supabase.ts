import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserTier = 'free' | 'pro' | 'agency'
export type UserType = 'individual' | 'corporate' | 'agency'

export interface AppUser {
  id: string
  clerk_id: string
  email: string
  name: string | null
  user_type: UserType
  tier: UserTier
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  analyses_count: number
  created_at: string
}

export interface Analysis {
  id: string
  user_id: string
  brand: string
  market: string
  overall_score: number
  active_models: string[]
  competitor_count: number
  prompt_count: number
  result_snapshot: Record<string, unknown>
  created_at: string
}

export const TIER_LIMITS = {
  free:   { analyses: 1,   prompts: 10, competitors: 1,  models: 2, history_days: 30,  pdf: false, monthly_alerts: false, white_label: false, sentiment: false, recommendations: false },
  pro:    { analyses: 10,  prompts: 25, competitors: 5,  models: 6, history_days: 90,  pdf: true,  monthly_alerts: true,  white_label: false, sentiment: true,  recommendations: true  },
  agency: { analyses: 999, prompts: 50, competitors: 10, models: 6, history_days: 365, pdf: true,  monthly_alerts: true,  white_label: true,  sentiment: true,  recommendations: true  },
}
