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
  const { amount, paid_by, split_type, split_percentage, created_by } = expense

  const iPaid = paid_by === currentUserId
  const iCreated = created_by === currentUserId

  // Determine my share of this expense based on who created it
  // "solo_yo"/"solo_pareja"/split_percentage are relative to the creator
  let myShare: number
  switch (split_type) {
    case '50/50':
      myShare = amount / 2
      break
    case 'solo_yo':
      // Creator's expense — creator pays 100%, partner pays 0%
      myShare = iCreated ? amount : 0
      break
    case 'solo_pareja':
      // Creator's partner's expense — partner pays 100%, creator pays 0%
      myShare = iCreated ? 0 : amount
      break
    case 'custom':
      // split_percentage = creator's share %
      myShare = iCreated
        ? amount * split_percentage / 100
        : amount * (100 - split_percentage) / 100
      break
    default:
      myShare = amount / 2
  }

  // Positive = partner owes me, negative = I owe partner
  // If I paid: the other person owes me their share (total - myShare)
  // If they paid: I owe them my share
  return iPaid ? (amount - myShare) : -myShare
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
      // I paid someone → my debt decreases → balance goes up
      balance += settlement.amount
    } else {
      // Someone paid me → their debt decreases → balance goes down
      balance -= settlement.amount
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
