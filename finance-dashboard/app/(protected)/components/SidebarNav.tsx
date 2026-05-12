'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function BoardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 14V9.5H5V14H2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.5 14V6H9.5V14H6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11 14V2.5H14V14H11Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function BriefingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 3.5C2 2.67 2.67 2 3.5 2H12.5C13.33 2 14 2.67 14 3.5V9.5C14 10.33 13.33 11 12.5 11H8.5L5.5 14V11H3.5C2.67 11 2 10.33 2 9.5V3.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WorkloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="3" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 13.5c0-1.93 1.34-3.5 3-3.5s3 1.57 3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 13.5c0-1.93 1.34-3.5 3-3.5s3 1.57 3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 13.5c0-2.21 1.34-4 3-4s3 1.79 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.5 8H13.5M10.5 5.5L13.5 8L10.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2.5H4C3.17 2.5 2.5 3.17 2.5 4V12C2.5 12.83 3.17 13.5 4 13.5H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'Board', href: '/', Icon: BoardIcon },
  { label: 'Analytics', href: '/analytics', Icon: AnalyticsIcon },
  { label: 'Workload', href: '/workload', Icon: WorkloadIcon },
  { label: 'Briefing', href: '/briefing', Icon: BriefingIcon },
  { label: 'Chat', href: '/chat', Icon: ChatIcon },
  { label: 'Team', href: '/team', Icon: TeamIcon },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <p
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#323232',
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          padding: '4px 8px 6px',
          margin: 0,
        }}
      >
        Workspace
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {NAV_LINKS.map(({ label, href, Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '7px 8px',
                  borderRadius: '6px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#ffffff' : '#636363',
                  background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.1s ease, color 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = '#999999'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#636363'
                  }
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: isActive ? '#ffffff' : '#444444',
                    transition: 'color 0.1s ease',
                  }}
                >
                  <Icon />
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      <div
        style={{
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid #1e1e1e',
        }}
      >
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              width: '100%',
              padding: '7px 8px',
              borderRadius: '6px',
              fontSize: '13.5px',
              color: '#404040',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.1s ease, color 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = '#777777'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = '#404040'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <LogoutIcon />
            </span>
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
