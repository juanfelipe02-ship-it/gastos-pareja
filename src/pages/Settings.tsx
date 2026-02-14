import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const CURRENCIES = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'PEN', 'CLP']

export function Settings() {
  const { user, partner, categories, currency, setCurrency, darkMode, toggleDarkMode, setCategories } = useStore()
  const { signOut, joinPartner } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [inviteCode, setInviteCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [message, setMessage] = useState('')
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('')

  async function handleSaveName() {
    if (!user || !name.trim()) return
    await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.id)
    setMessage('Nombre actualizado')
    setTimeout(() => setMessage(''), 2000)
  }

  async function handleJoinPartner() {
    try {
      await joinPartner(joinCode)
      setMessage('¡Pareja vinculada!')
      setJoinCode('')
    } catch (err: any) {
      setMessage(err.message || 'Error al vincular')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleUpdateCategory(id: string) {
    if (!catName.trim()) return
    await supabase
      .from('categories')
      .update({ name: catName.trim(), icon: catIcon })
      .eq('id', id)
    setCategories(
      categories.map((c) =>
        c.id === id ? { ...c, name: catName.trim(), icon: catIcon } : c
      )
    )
    setEditingCat(null)
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Configuración
      </h1>

      {message && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm p-3 rounded-2xl mb-4 animate-fade-in">
          {message}
        </div>
      )}

      {/* Profile */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Perfil
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="input flex-1"
          />
          <button onClick={handleSaveName} className="btn-primary text-sm px-4">
            Guardar
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{user?.email}</p>
      </div>

      {/* Partner linking */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Pareja
        </h3>
        {partner ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-lg">
              💑
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{partner.name}</p>
              <p className="text-xs text-emerald-500">Vinculado/a</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* My invite code */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Tu código de invitación:</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-xl text-lg font-mono font-bold tracking-widest text-emerald-600">
                  {user?.invite_code || '------'}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user?.invite_code || '')
                    setMessage('Código copiado')
                    setTimeout(() => setMessage(''), 2000)
                  }}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Copiar
                </button>
              </div>
            </div>

            {/* Join with code */}
            <div>
              <p className="text-xs text-gray-500 mb-1">O ingresa el código de tu pareja:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO"
                  maxLength={6}
                  className="input flex-1 text-center font-mono tracking-widest uppercase"
                />
                <button
                  onClick={handleJoinPartner}
                  disabled={joinCode.length < 6}
                  className={cn(
                    'btn-primary text-sm px-4',
                    joinCode.length < 6 && 'opacity-40'
                  )}
                >
                  Vincular
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Categorías
        </h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id}>
              {editingCat === cat.id ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="w-12 input text-center text-xl p-2"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={() => handleUpdateCategory(cat.id)}
                    className="text-emerald-500 text-sm font-medium px-2"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingCat(null)}
                    className="text-gray-400 text-sm px-2"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingCat(cat.id)
                    setCatName(cat.name)
                    setCatIcon(cat.icon)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{cat.name}</span>
                  <span className="ml-auto text-xs text-gray-400">Editar</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Moneda
        </h3>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                currency === c
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Modo oscuro
            </h3>
            <p className="text-xs text-gray-400">Cambiar apariencia</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={cn(
              'w-14 h-8 rounded-full transition-colors relative',
              darkMode ? 'bg-emerald-500' : 'bg-gray-300'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-sm',
                darkMode ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full text-red-500 text-sm font-medium py-4 mb-8"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
