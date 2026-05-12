import SidebarNav from './components/SidebarNav'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          height: '100%',
          background: '#111111',
          borderRight: '1px solid #1e1e1e',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            padding: '16px 16px 14px',
            borderBottom: '1px solid #1e1e1e',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" fill="white" />
              <rect x="8" y="1.5" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.55" />
              <rect x="1.5" y="8" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.55" />
              <rect x="8" y="8" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.25" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', lineHeight: '1.25', margin: 0, fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.01em' }}>
              Finance
            </p>
            <p style={{ fontSize: '11px', color: '#555555', lineHeight: '1.25', margin: 0 }}>
              PepsiCo · IT
            </p>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', overflow: 'hidden' }}>
          <SidebarNav />
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </main>
    </div>
  )
}
