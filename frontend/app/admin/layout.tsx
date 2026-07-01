import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel | VisibilityRadar',
  robots: { index: false, follow: false },
}

const ADMIN_EMAIL = 'sarefe12@gmail.com'

const nav = [
  { href: '/admin/dashboard',     label: 'Dashboard',      icon: '▦' },
  { href: '/admin/users',         label: 'Users',          icon: '👥' },
  { href: '/admin/analyses',      label: 'Analyses',       icon: '📈' },
  { href: '/admin/tokens',        label: 'Token & Cost',   icon: '⚡' },
  { href: '/admin/subscriptions', label: 'Subscriptions',  icon: '💳' },
  { href: '/admin/retention',     label: 'Retention',      icon: '🔄' },
  { href: '/admin/leads',         label: 'Leads',          icon: '🎯' },
  { href: '/admin/outbound',      label: 'Outbound',       icon: '🚀' },
  { href: '/admin/contacts',      label: 'Contacts',       icon: '✉️' },
  { href: '/admin/audit',         label: 'Audit Logs',     icon: '📋' },
  { href: '/admin/health',        label: 'System Health',  icon: '❤️' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress

  if (email !== ADMIN_EMAIL) {
    redirect('/sign-in')
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Admin</div>
          <div className="text-sm font-bold text-white mt-0.5">VisibilityRadar</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 truncate">{email}</div>
          <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors mt-1 block">← Back to site</Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
