'use client'

import { useRouter } from 'next/navigation'
import { Crown, Sparkles, Lock } from 'lucide-react'

interface LimitReachedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LimitReachedModal({
  open,
  onOpenChange,
}: LimitReachedModalProps) {
  const router = useRouter()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
      <div className="w-full max-w-md rounded-3xl border border-border/30 bg-[#0b111c] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-[0_0_30px_rgba(120,255,120,0.25)]">
            <Crown size={24} className="text-primary-foreground" />
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Not now
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Free Limit Reached
            </p>
            <h2 className="text-3xl font-black leading-tight text-white">
              You&apos;ve used all 3 free scans
            </h2>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            Upgrade to Premium to unlock unlimited meal scans, faster tracking,
            and a smoother fitness journey with VRRA.
          </p>

          <div className="space-y-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="mt-0.5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-white">Unlimited meal scans</p>
                <p className="text-xs text-muted-foreground">
                  Scan as many meals as you want without hitting a cap.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock size={18} className="mt-0.5 text-secondary" />
              <div>
                <p className="text-sm font-semibold text-white">Keep your progress going</p>
                <p className="text-xs text-muted-foreground">
                  No interruptions when tracking your meals and fitness goals.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/20 bg-card/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Premium Access
            </p>

            <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Yearly</p>
                  <p className="text-xs text-muted-foreground">Best value</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">$19.99</p>
                  <p className="text-xs text-muted-foreground">/ year</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/20 bg-card/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Monthly</p>
                  <p className="text-xs text-muted-foreground">Flexible plan</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">$4.99</p>
                  <p className="text-xs text-muted-foreground">/ month</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Unlimited scans after upgrade. Cancel anytime.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                onOpenChange(false)
                router.push('/upgrade')
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 text-base font-bold text-primary-foreground transition-all hover:shadow-[0_0_32px_rgba(120,255,120,0.25)]"
            >
              Upgrade Now
            </button>

            <button
              onClick={() => onOpenChange(false)}
              className="w-full rounded-2xl border border-border/30 bg-card/30 py-4 text-sm font-semibold text-foreground transition-all hover:bg-card/50"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}