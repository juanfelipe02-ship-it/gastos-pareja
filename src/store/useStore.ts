import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, Category, Expense, Settlement } from '@/types/database'

interface AppState {
  // Auth
  user: Profile | null
  partner: Profile | null
  setUser: (user: Profile | null) => void
  setPartner: (partner: Profile | null) => void

  // Categories
  categories: Category[]
  setCategories: (categories: Category[]) => void

  // Expenses
  expenses: Expense[]
  setExpenses: (expenses: Expense[]) => void
  addExpense: (expense: Expense) => void
  updateExpense: (id: string, expense: Partial<Expense>) => void
  removeExpense: (id: string) => void

  // Settlements
  settlements: Settlement[]
  setSettlements: (settlements: Settlement[]) => void
  addSettlement: (settlement: Settlement) => void

  // UI
  currency: string
  setCurrency: (currency: string) => void
  darkMode: boolean
  toggleDarkMode: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      partner: null,
      setUser: (user) => set({ user }),
      setPartner: (partner) => set({ partner }),

      categories: [],
      setCategories: (categories) => set({ categories }),

      expenses: [],
      setExpenses: (expenses) => set({ expenses }),
      addExpense: (expense) =>
        set((state) => ({ expenses: [expense, ...state.expenses] })),
      updateExpense: (id, data) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),
      removeExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      settlements: [],
      setSettlements: (settlements) => set({ settlements }),
      addSettlement: (settlement) =>
        set((state) => ({
          settlements: [settlement, ...state.settlements],
        })),

      currency: 'COP',
      setCurrency: (currency) => set({ currency }),
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'gastos-pareja-storage',
      partialize: (state) => ({
        currency: state.currency,
        darkMode: state.darkMode,
        user: state.user,
        partner: state.partner,
        categories: state.categories,
        expenses: state.expenses,
        settlements: state.settlements,
      }),
    }
  )
)
