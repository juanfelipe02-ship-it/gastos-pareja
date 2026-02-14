import { useState, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { useExpenses } from '@/hooks/useExpenses'
import { useReceipts } from '@/hooks/useReceipts'
import { formatCurrency, cn } from '@/lib/utils'
import type { SplitType } from '@/types/database'

interface Props {
  onClose: () => void
}

type Step = 'amount' | 'details'

export function ExpenseModal({ onClose }: Props) {
  const { user, partner, categories, currency } = useStore()
  const { createExpense } = useExpenses()
  const { uploadReceipt, uploading } = useReceipts()

  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paidBy, setPaidBy] = useState(user?.id || '')
  const [splitType, setSplitType] = useState<SplitType>('50/50')
  const [splitPercentage, setSplitPercentage] = useState(50)
  const [description, setDescription] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const numericAmount = parseFloat(amount) || 0

  function handleNumpad(key: string) {
    if (key === 'del') {
      setAmount((prev) => prev.slice(0, -1))
    } else if (key === '.' && amount.includes('.')) {
      return
    } else if (key === '000') {
      setAmount((prev) => prev + '000')
    } else {
      setAmount((prev) => prev + key)
    }
  }

  function handleNext() {
    if (numericAmount <= 0) return
    setStep('details')
  }

  function handleReceiptSelect(file: File) {
    setReceiptFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setReceiptPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (numericAmount <= 0 || !categoryId || saving) return

    setSaving(true)
    try {
      let receiptUrl: string | null = null
      if (receiptFile) {
        receiptUrl = await uploadReceipt(receiptFile)
      }

      await createExpense({
        amount: numericAmount,
        description: description || undefined,
        category_id: categoryId,
        paid_by: paidBy,
        split_type: splitType,
        split_percentage: splitType === 'custom' ? splitPercentage : 50,
        date: new Date().toISOString().split('T')[0],
        receipt_url: receiptUrl || undefined,
      })
      setSaved(true)
      setTimeout(() => onClose(), 800)
    } catch (err) {
      console.error('Error saving expense:', err)
      setSaving(false)
    }
  }

  return (
    <div className="bottom-sheet" onClick={onClose}>
      <div className="bottom-sheet-overlay" />
      <div
        className="bottom-sheet-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {saved ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-check text-6xl mb-4">✅</div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              ¡Gasto guardado!
            </p>
          </div>
        ) : step === 'amount' ? (
          <AmountStep
            amount={amount}
            numericAmount={numericAmount}
            currency={currency}
            onNumpad={handleNumpad}
            onNext={handleNext}
          />
        ) : (
          <DetailsStep
            categories={categories}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            paidBy={paidBy}
            setPaidBy={setPaidBy}
            splitType={splitType}
            setSplitType={setSplitType}
            splitPercentage={splitPercentage}
            setSplitPercentage={setSplitPercentage}
            description={description}
            setDescription={setDescription}
            receiptPreview={receiptPreview}
            onReceiptSelect={handleReceiptSelect}
            onReceiptRemove={() => { setReceiptFile(null); setReceiptPreview(null) }}
            uploading={uploading}
            userId={user?.id || ''}
            partnerName={partner?.name || 'Pareja'}
            partnerId={partner?.id || ''}
            numericAmount={numericAmount}
            currency={currency}
            onBack={() => setStep('amount')}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

function AmountStep({
  amount,
  numericAmount,
  currency,
  onNumpad,
  onNext,
}: {
  amount: string
  numericAmount: number
  currency: string
  onNumpad: (key: string) => void
  onNext: () => void
}) {
  return (
    <div className="px-4 pb-4">
      <h2 className="text-lg font-semibold text-center text-gray-700 dark:text-gray-200 mb-4">
        Nuevo gasto
      </h2>

      <div className="text-center mb-6">
        <p className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">
          {numericAmount > 0 ? formatCurrency(numericAmount, currency) : '$0'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'].map(
          (key) => (
            <button
              key={key}
              onClick={() => onNumpad(key)}
              className="numpad-btn"
            >
              {key === 'del' ? '⌫' : key}
            </button>
          )
        )}
      </div>

      <button
        onClick={onNext}
        disabled={numericAmount <= 0}
        className={cn(
          'w-full btn-primary text-lg',
          numericAmount <= 0 && 'opacity-40 cursor-not-allowed'
        )}
      >
        Siguiente
      </button>
    </div>
  )
}

function DetailsStep({
  categories,
  categoryId,
  setCategoryId,
  paidBy,
  setPaidBy,
  splitType,
  setSplitType,
  splitPercentage,
  setSplitPercentage,
  description,
  setDescription,
  receiptPreview,
  onReceiptSelect,
  onReceiptRemove,
  uploading,
  userId,
  partnerName,
  partnerId,
  numericAmount,
  currency,
  onBack,
  onSave,
  saving,
}: {
  categories: { id: string; name: string; icon: string; color: string }[]
  categoryId: string
  setCategoryId: (id: string) => void
  paidBy: string
  setPaidBy: (id: string) => void
  splitType: SplitType
  setSplitType: (type: SplitType) => void
  splitPercentage: number
  setSplitPercentage: (pct: number) => void
  description: string
  setDescription: (desc: string) => void
  receiptPreview: string | null
  onReceiptSelect: (file: File) => void
  onReceiptRemove: () => void
  uploading: boolean
  userId: string
  partnerName: string
  partnerId: string
  numericAmount: number
  currency: string
  onBack: () => void
  onSave: () => void
  saving: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="px-4 pb-4 animate-fade-in">
      {/* Header with amount */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-xl p-2">
          ←
        </button>
        <p className="text-xl font-bold text-emerald-600">
          {formatCurrency(numericAmount, currency)}
        </p>
        <div className="w-10" />
      </div>

      {/* Categories */}
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Categoría</p>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all duration-150',
                categoryId === cat.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500 scale-105'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              )}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 truncate w-full text-center">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Who paid */}
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">¿Quién pagó?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPaidBy(userId)}
            className={cn(
              'py-3 rounded-2xl font-semibold transition-all duration-150',
              paidBy === userId
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            🙋 Yo
          </button>
          <button
            onClick={() => setPaidBy(partnerId)}
            disabled={!partnerId}
            className={cn(
              'py-3 rounded-2xl font-semibold transition-all duration-150',
              paidBy === partnerId
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
              !partnerId && 'opacity-40 cursor-not-allowed'
            )}
          >
            💑 {partnerName}
          </button>
        </div>
      </div>

      {/* Split type */}
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">¿Cómo se divide?</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { type: '50/50' as SplitType, label: '50/50', icon: '⚖️' },
            { type: 'solo_yo' as SplitType, label: 'Solo mío', icon: '🙋' },
            { type: 'solo_pareja' as SplitType, label: `Solo ${partnerName}`, icon: '💑' },
            { type: 'custom' as SplitType, label: 'Custom %', icon: '🎚️' },
          ]).map((opt) => (
            <button
              key={opt.type}
              onClick={() => setSplitType(opt.type)}
              className={cn(
                'py-2.5 rounded-2xl text-sm font-medium transition-all duration-150',
                splitType === opt.type
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              )}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
        {splitType === 'custom' && (
          <div className="mt-3 px-2">
            <input
              type="range"
              min="0"
              max="100"
              value={splitPercentage}
              onChange={(e) => setSplitPercentage(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Yo: {splitPercentage}%</span>
              <span>{partnerName}: {100 - splitPercentage}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Description + Receipt */}
      <div className="mb-5 space-y-3">
        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input text-sm"
        />

        {/* Receipt upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          capture="environment"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onReceiptSelect(f)
          }}
          className="hidden"
        />

        {receiptPreview ? (
          <div className="relative">
            <img
              src={receiptPreview}
              alt="Recibo"
              className="w-full h-32 object-cover rounded-2xl border border-gray-200 dark:border-gray-600"
            />
            <button
              onClick={onReceiptRemove}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full
                         flex items-center justify-center text-sm shadow-md"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed
                       border-gray-200 dark:border-gray-600 text-gray-400 hover:border-emerald-400
                       hover:text-emerald-500 transition-colors text-sm"
          >
            📸 Adjuntar recibo / factura
          </button>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={!categoryId || saving || uploading}
        className={cn(
          'w-full btn-primary text-lg',
          (!categoryId || saving || uploading) && 'opacity-40 cursor-not-allowed'
        )}
      >
        {saving || uploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {uploading ? 'Subiendo recibo...' : 'Guardando...'}
          </span>
        ) : (
          'Guardar'
        )}
      </button>
    </div>
  )
}
