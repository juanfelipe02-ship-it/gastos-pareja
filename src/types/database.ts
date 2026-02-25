export type SplitType = '50/50' | 'solo_yo' | 'solo_pareja' | 'custom'

export interface Profile {
  id: string
  name: string
  email?: string
  partner_id: string | null
  household_id: string | null
  invite_code: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  household_id: string
  created_at: string
}

export interface Expense {
  id: string
  amount: number
  description: string | null
  category_id: string
  paid_by: string
  split_type: SplitType
  split_percentage: number
  date: string
  created_by: string
  household_id: string
  receipt_url: string | null
  created_at: string
  // Joined fields
  category?: Category
  payer?: Profile
}

export interface Settlement {
  id: string
  amount: number
  paid_by: string
  paid_to: string
  date: string
  household_id: string
  created_at: string
  // Joined
  payer?: Profile
  receiver?: Profile
}

export interface Budget {
  id: string
  category_id: string
  household_id: string
  month: string
  amount: number
  created_at: string
  category?: Category
}

export interface AnnualBudget {
  id: string
  category_id: string
  household_id: string
  year: number
  amount: number
  created_at: string
  category?: Category
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'household_id' | 'created_at'>[] = [
  { name: 'Mercado', icon: '🛒', color: '#10b981' },
  { name: 'Restaurantes', icon: '🍽️', color: '#f59e0b' },
  { name: 'Hogar', icon: '🏠', color: '#3b82f6' },
  { name: 'Transporte', icon: '🚗', color: '#8b5cf6' },
  { name: 'Salud', icon: '💊', color: '#ef4444' },
  { name: 'Entretenimiento', icon: '🎬', color: '#ec4899' },
  { name: 'Ropa', icon: '👕', color: '#06b6d4' },
  { name: 'Otros', icon: '📦', color: '#6b7280' },
]
