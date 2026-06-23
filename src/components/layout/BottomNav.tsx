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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="absolute inset-0 bg-card/90 backdrop-blur-lg border-t border-border/50" />
      <ul className="relative flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1 flex justify-center">
            {item.primary ? (
              <NavLink
                to={item.to}
                className="flex flex-col items-center justify-center -mt-3"
              >
                <span className="flex items-center justify-center w-13 h-13 rounded-full bg-primary text-primary-foreground shadow-md">
                  {item.icon}
                </span>
                <span className="text-[11px] mt-1 text-muted-foreground font-medium">
                  {item.label}
                </span>
              </NavLink>
            ) : (
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }: { isActive: boolean }) =>
                  `relative flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    {isActive && (
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                    <span className="size-6 flex items-center justify-center">{item.icon}</span>
                    <span className="text-[11px] font-medium leading-none">{item.label}</span>
                  </>
                )}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
