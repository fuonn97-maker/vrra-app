import { Home, Camera, TrendingUp, Settings, Dumbbell, Users } from 'lucide-react'
import Link from 'next/link'

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onScanClick?: () => void
}

export default function Navigation({ activeTab, setActiveTab, onScanClick }: NavigationProps) {
  const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'scan', label: 'Scan', icon: Camera },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'workout', label: 'Workout', icon: Dumbbell },
]

  return (
    <>
      <Link
        href="/dashboard/settings"
        className="fixed top-6 right-6 z-40 p-2 hover:bg-foreground/10 rounded-lg transition-colors"
        aria-label="Settings"
      >
        <Settings size={24} className="text-foreground/70 hover:text-foreground" />
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-[#0f1420] to-transparent border-t border-border/20 backdrop-blur-md">
        <div className="max-w-md mx-auto flex items-center justify-around px-4 py-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)

                  if (tab.id === 'scan' && onScanClick) {
                    onScanClick()
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300"
              >
                <Icon
                  size={24}
                  className={`transition-all duration-300 ${isActive
                      ? 'text-primary drop-shadow-[0_0_8px_rgba(153,204,102,0.4)]'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                />
                <span
                  className={`text-xs font-medium transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}