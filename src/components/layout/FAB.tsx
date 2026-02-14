import { useState, useEffect } from 'react'
import { ExpenseModal } from '@/components/expenses/ExpenseModal'

export function FAB() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleOpen() { setOpen(true) }
    window.addEventListener('open-expense-modal', handleOpen)
    return () => window.removeEventListener('open-expense-modal', handleOpen)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600
                   active:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-500/30
                   flex items-center justify-center text-3xl font-light
                   transition-all duration-150 active:scale-90
                   md:right-[calc(50%-240px+16px)]"
        aria-label="Nuevo gasto"
      >
        +
      </button>
      {open && <ExpenseModal onClose={() => setOpen(false)} />}
    </>
  )
}
