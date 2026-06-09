import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  icon: string
  primary?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '首页', icon: '\u{1F3E0}' },
  { to: '/records', label: '账单', icon: '\u{1F4CB}' },
  { to: '/add', label: '记账', icon: '\u{2795}', primary: true },
  { to: '/budget', label: '预算', icon: '\u{1F4CA}' },
  { to: '/settings', label: '设置', icon: '\u{2699}\u{FE0F}' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <ul className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            {item.primary ? (
              <NavLink
                to={item.to}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500 text-white text-2xl shadow-lg">
                  {item.icon}
                </span>
                <span className="text-xs mt-1 text-gray-500">{item.label}</span>
              </NavLink>
            ) : (
              <NavLink
                to={item.to}
                className={({ isActive }: { isActive: boolean }) =>
                  [
                    'flex flex-col items-center justify-center py-1 transition-colors',
                    isActive ? 'text-indigo-600' : 'text-gray-400',
                  ].join(' ')
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
