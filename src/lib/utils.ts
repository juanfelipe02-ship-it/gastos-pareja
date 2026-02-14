import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Expense, Profile, SplitType } from '@/types/database'

export function formatCurrency(amount: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string): string {
  return format(parseISO(date), "d 'de' MMM", { locale: es })
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: es })
}

export function getMonthRange(date: Date) {
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

export function calculateOwed(
  expense: Expense,
  currentUserId: string
): number {
  const { amount, paid_by, split_type, split_percentage } = expense

  const isMine = paid_by === currentUserId

  // Returns positive = partner owes me, negative = I owe partner
  switch (split_type) {
    case '50/50':
      // Whoever paid, the other owes half
      return isMine ? amount / 2 : -(amount / 2)
    case 'solo_yo':
      // This expense is 100% mine
      // If I paid: nobody owes anything (0)
      // If partner paid for me: I owe them the full amount
      return isMine ? 0 : -amount
    case 'solo_pareja':
      // This expense is 100% partner's
      // If partner paid: nobody owes anything (0)
      // If I paid for them: they owe me the full amount
      return isMine ? amount : 0
    case 'custom': {
      // split_percentage = my share %
      const myShare = amount * split_percentage / 100
      const partnerShare = amount - myShare
      // If I paid: partner owes me their share
      // If partner paid: I owe them my share
      return isMine ? partnerShare : -myShare
    }
    default:
      return 0
  }
}

export function calculateBalance(
  expenses: Expense[],
  settlements: { amount: number; paid_by: string; paid_to: string }[],
  currentUserId: string
): number {
  let balance = 0

  for (const expense of expenses) {
    balance += calculateOwed(expense, currentUserId)
  }

  for (const settlement of settlements) {
    if (settlement.paid_by === currentUserId) {
      balance -= settlement.amount
    } else {
      balance += settlement.amount
    }
  }

  return balance
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
