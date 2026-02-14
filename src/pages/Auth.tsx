import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function Auth() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        if (!name.trim()) {
          setError('Ingresa tu nombre')
          setLoading(false)
          return
        }
        await signUp(email, password, name.trim())
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-4">💰</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gastos Pareja
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Control de gastos compartidos
        </p>
      </div>

      {/* Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-2xl p-1 mb-6 w-full max-w-sm">
        <button
          onClick={() => setIsLogin(true)}
          className={cn(
            'flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all',
            isLogin
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={cn(
            'flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all',
            !isLogin
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          Registrarse
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        {!isLogin && (
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            autoComplete="name"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          required
          minLength={6}
        />

        {error && (
          <p className="text-red-500 text-sm text-center animate-fade-in">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn('w-full btn-primary text-lg', loading && 'opacity-60')}
        >
          {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}
