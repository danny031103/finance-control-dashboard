'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Board', href: '/' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Briefing', href: '/briefing' },
  { label: 'Chat', href: '/chat' },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col flex-1">
      <ul className="flex flex-col gap-0.5">
        {NAV_LINKS.map(({ label, href }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                className="block px-4 py-2 text-sm rounded"
                style={{ color: isActive ? '#ffffff' : '#888888', fontWeight: isActive ? 500 : 400 }}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="block w-full text-left px-4 py-2 text-sm"
            style={{ color: '#888888' }}
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
