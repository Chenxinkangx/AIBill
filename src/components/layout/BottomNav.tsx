import { NavLink } from 'react-router-dom'
import { Home, ReceiptText, Plus, ChartPie, Settings } from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  primary?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '首页', icon: <Home className="size-6" /> },
  { to: '/records', label: '账单', icon: <ReceiptText className="size-6" /> },
  { to: '/add', label: '记账', icon: <Plus className="size-7" />, primary: true },
  { to: '/budget', label: '预算', icon: <ChartPie className="size-6" /> },
  { to: '/settings', label: '设置', icon: <Settings className="size-6" /> },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <ul className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            {item.primary ? (
              <NavLink
                to={item.to}
                className="flex flex-col items-center justify-center -mt-3"
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg">
                  {item.icon}
                </span>
                <span className="text-xs mt-1 text-muted-foreground">{item.label}</span>
              </NavLink>
            ) : (
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }: { isActive: boolean }) =>
                  [
                    'flex flex-col items-center justify-center py-1 transition-colors gap-0.5',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  ].join(' ')
                }
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
