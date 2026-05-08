import SidebarNav from './components/SidebarNav'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <aside
        className="flex flex-col flex-shrink-0 h-full"
        style={{
          width: '220px',
          background: '#111111',
          borderRight: '1px solid #e5e5e5',
        }}
      >
        <div className="px-4 py-5" style={{ borderBottom: '1px solid #222222' }}>
          <span className="text-white text-sm" style={{ fontWeight: 500 }}>
            Finance Dashboard
          </span>
        </div>
        <div className="flex flex-col flex-1 py-3 overflow-hidden">
          <SidebarNav />
        </div>
      </aside>

      <main
        className="flex-1 overflow-auto"
        style={{ background: '#fafafa', padding: '2rem' }}
      >
        {children}
      </main>
    </div>
  )
}
