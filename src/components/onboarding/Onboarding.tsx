import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/hooks/useAuth'
import { ExpenseModal } from '@/components/expenses/ExpenseModal'

export function Onboarding() {
  const { user } = useStore()
  const { joinPartner } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [partnerCode, setPartnerCode] = useState('')
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [linked, setLinked] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)

  const inviteCode = user?.invite_code || ''

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = inviteCode
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleLink() {
    if (!partnerCode.trim()) return
    setLinking(true)
    setError('')
    try {
      await joinPartner(partnerCode.trim())
      setLinked(true)
      setTimeout(() => setStep(2), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al vincular')
    } finally {
      setLinking(false)
    }
  }

  function handleSkip() {
    setStep(2)
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-8">
          <div>
            <div className="text-5xl mb-4">💑</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vincula a tu pareja
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Comparte tu codigo con tu pareja o ingresa el suyo para empezar a registrar gastos juntos.
            </p>
          </div>

          {/* Invite code display */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tu codigo de invitacion</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                {inviteCode}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                {copied ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Partner code input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 uppercase">o ingresa el codigo de tu pareja</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                maxLength={6}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-center text-lg font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
              <button
                onClick={handleLink}
                disabled={linking || !partnerCode.trim()}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {linking ? '...' : 'Vincular'}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {linked && (
              <p className="text-emerald-500 text-sm font-medium">Vinculado correctamente!</p>
            )}
          </div>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm underline underline-offset-2 transition-colors"
          >
            Omitir por ahora
          </button>
        </div>
      </div>
    )
  }

  // Step 2: First expense
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <div>
          <div className="text-5xl mb-4">{linked ? '🎉' : '💰'}</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {linked ? 'Pareja vinculada!' : 'Casi listo!'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {linked
              ? 'Excelente! Ahora agrega tu primer gasto para empezar.'
              : 'Agrega tu primer gasto para comenzar a usar la app. Podras vincular a tu pareja despues.'}
          </p>
        </div>

        <button
          onClick={() => setShowExpenseModal(true)}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-emerald-500/25 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar primer gasto
        </button>

        <p className="text-xs text-gray-400">
          Una vez agregues un gasto, podras ver el resumen y reportes.
        </p>
      </div>

      {showExpenseModal && (
        <ExpenseModal onClose={() => setShowExpenseModal(false)} />
      )}
    </div>
  )
}
