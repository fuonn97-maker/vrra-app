import { Lock, Zap } from 'lucide-react'
import { getPricingPlan } from '@/lib/pricing-config'

interface LimitScreenProps {
  onUpgrade: () => void
}

export default function LimitScreen({ onUpgrade }: LimitScreenProps) {
  const monthlyPlan = getPricingPlan('monthly')
  return (
    <div className="w-full max-w-md mx-auto px-6 py-12 space-y-12 flex flex-col items-center justify-center min-h-screen">
      {/* Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center shadow-lg">
          <Lock size={48} className="text-primary-foreground" />
        </div>
      </div>

      {/* Content */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-black text-foreground">Daily Scan Limit Reached</h1>
        <p className="text-base text-muted-foreground max-w-xs">
          You've used all 3 free scans today. Upgrade to unlimited scanning and continue tracking your meals.
        </p>
      </div>

      {/* Upgrade Card */}
      <div className="w-full bg-gradient-to-br from-primary/15 to-card border border-primary/30 rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-primary font-semibold uppercase tracking-wider">Premium Benefits</p>
          <ul className="space-y-3 text-sm text-foreground">
            <li className="flex items-center gap-3">
              <Zap size={16} className="text-primary flex-shrink-0" />
              Unlimited meal scans
            </li>
            <li className="flex items-center gap-3">
              <Zap size={16} className="text-primary flex-shrink-0" />
              Advanced nutrition insights
            </li>
            <li className="flex items-center gap-3">
              <Zap size={16} className="text-primary flex-shrink-0" />
              Weekly performance reports
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-border/30">
          <p className="text-2xl font-black text-primary mb-2">{monthlyPlan.displayPrice}{monthlyPlan.displayPeriod}</p>
          <p className="text-xs text-muted-foreground">Cancel anytime</p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="w-full space-y-3">
        <button
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-black py-6 rounded-2xl hover:shadow-[0_0_40px_rgba(156,204,102,0.5)] transition-all duration-300 border border-primary/30 text-lg uppercase tracking-wide"
        >
          Unlock Unlimited Scans
        </button>
        <p className="text-center text-xs text-muted-foreground">
          7-day free trial • Cancel anytime
        </p>
      </div>

      {/* Social Proof */}
      <div className="text-center space-y-2">
        <p className="text-xs text-accent font-semibold">Over 10,000 users already upgraded</p>
        <p className="text-xs text-muted-foreground">Join them and transform your fitness today</p>
      </div>
    </div>
  )
}
