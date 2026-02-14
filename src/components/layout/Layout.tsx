import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { FAB } from './FAB'

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-lg mx-auto pb-24">
        <Outlet />
      </main>
      <FAB />
      <BottomNav />
    </div>
  )
}
