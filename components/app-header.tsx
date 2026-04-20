'use client'

import { LogOut, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface AppHeaderProps {
  userEmail: string
  isPremium: boolean
  scansUsed: number
  maxScans: number
}

export default function AppHeader({ userEmail, isPremium }: AppHeaderProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="border-b border-border/10 bg-background">
      <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: VRRA Logo */}
        <div className="text-2xl font-black text-primary tracking-tight flex-shrink-0">
          VRRA
        </div>

        {/* Center: Premium Button (if premium) */}
        {isPremium && (
          <button
            onClick={() => router.push('/premium')}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary text-xs font-semibold transition-all"
            title="View Premium Features"
          >
            <Crown size={14} />
            Premium
          </button>
        )}

        {/* Right: User Avatar/Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm hover:shadow-[0_0_16px_rgba(156,204,102,0.3)] transition-all"
            title="User menu"
          >
            {userEmail.charAt(0).toUpperCase()}
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 bg-card border border-border/30 rounded-lg shadow-lg min-w-48 z-50">
              <div className="px-4 py-3 border-b border-border/20">
                <p className="text-xs text-muted-foreground">Logged in as</p>
                <p className="text-sm font-semibold text-foreground truncate">{userEmail}</p>
              </div>
              <div className="px-4 py-3 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <Crown size={14} className={isPremium ? 'text-primary' : 'text-accent'} />
                  <span className={`text-sm font-semibold ${isPremium ? 'text-primary' : 'text-accent'}`}>
                    {isPremium ? 'Premium' : 'Free Tier'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  handleSignOut()
                  setShowMenu(false)
                }}
                className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-card/60 flex items-center gap-2 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
