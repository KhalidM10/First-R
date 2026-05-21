export interface TriageAnalyzeRequest {
  symptoms: string[]
  pre_existing_conditions?: string[]
  user_age?: number
  user_gender?: string
  county?: string
  duration_days?: number
}

export interface TriageRecommendations {
  immediate_action: string
  home_care: string[]
  when_to_escalate: string | string[]
  should_book_appointment: boolean
  emergency: boolean
}

export type TriageSeverity = 'mild' | 'moderate' | 'urgent'

export interface TriageResult {
  session_id: string
  severity: TriageSeverity
  confidence: number
  matched_conditions: string[]
  recommendations: TriageRecommendations
  suggested_specializations: string[]
  disclaimer: string
  saved_to_db: boolean
}
