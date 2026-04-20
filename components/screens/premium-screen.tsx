import { Check, Zap } from 'lucide-react'
import { PREMIUM_FEATURES, getPricingPlan } from '@/lib/pricing-config'

interface PremiumScreenProps {
  onUpgrade?: () => void
}

export default function PremiumScreen({ onUpgrade }: PremiumScreenProps) {
  const monthlyPlan = getPricingPlan('monthly')

  return (
    <div className="w-full max-w-md mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs text-accent font-black uppercase tracking-wider flex items-center gap-2">
            ⚡ Unlock Premium
          </p>
          <h1 className="text-4xl font-black text-foreground">Go Beyond Limits</h1>
        </div>
        <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full" />
        <div className="space-y-2">
          <p className="text-lg text-foreground font-semibold">Unlimited Nutrition Tracking</p>
        </div>
        <p className="text-muted-foreground text-balance">
          Unlock advanced insights, unlimited scans, and personalized coaching to transform your fitness journey.
        </p>
      </div>

      {/* Premium Card */}
      <div className="bg-gradient-to-br from-primary/15 via-[#1a2410] to-card border border-primary/40 rounded-3xl p-8 backdrop-blur-sm space-y-8 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-lg">
            <Zap size={40} className="text-primary-foreground" />
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4">
          {PREMIUM_FEATURES.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <Check size={20} className="text-primary flex-shrink-0 font-bold" />
              <div>
                <span className="text-foreground text-base font-medium block">{feature.title}</span>
                <span className="text-foreground/60 text-sm">{feature.description}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-card/50 to-secondary/10 border border-border/40 rounded-2xl p-6 space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-primary">{monthlyPlan.displayPrice}</span>
            <span className="text-muted-foreground text-sm">{monthlyPlan.displayPeriod}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-3">Cancel anytime. No commitment required.</p>
        </div>

        {/* Trial Info */}
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            Flexible billing • Cancel anytime
          </p>
          <p className="text-xs text-muted-foreground">
            No commitment required
          </p>
        </div>

        {/* CTA Button */}
        <button 
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground font-black py-7 rounded-2xl hover:shadow-[0_0_60px_rgba(156,204,102,0.6)] transition-all duration-300 border border-primary/50 text-xl uppercase letter-spacing-wide active:scale-95 transform hover:scale-105">
          Unlock Full Access
        </button>
      </div>

      {/* Comparison */}
      <div className="space-y-5">
        <p className="text-foreground/60 text-xs uppercase tracking-wider font-semibold">Compare Plans</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { feature: 'Daily tracking', free: '✓', premium: '✓' },
            { feature: 'Basic stats', free: '✓', premium: '✓' },
            { feature: 'Unlimited scans', free: '×', premium: '✓' },
            { feature: 'Advanced insights', free: '×', premium: '✓' },
            { feature: 'Weekly reports', free: '×', premium: '✓' },
            { feature: 'Custom plans', free: '×', premium: '✓' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="col-span-2 flex items-center justify-between bg-card/60 border border-border/30 rounded-xl p-4"
            >
              <span className="text-foreground font-medium">{item.feature}</span>
              <div className="flex items-center gap-6">
                <span className={item.free === '✓' ? 'text-primary font-bold' : 'text-muted-foreground'}>
                  {item.free}
                </span>
                <span
                  className={`font-bold ${item.premium === '✓' ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {item.premium}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-br from-accent/15 to-primary/10 border border-primary/30 rounded-2xl p-7 text-center space-y-3">
        <p className="text-foreground font-bold text-lg">Ready to transform?</p>
        <p className="text-sm text-muted-foreground">Join thousands improving their fitness today</p>
        <p className="text-xs text-accent font-semibold pt-2">Secure checkout powered by Stripe</p>
      </div>
    </div>
  )
}
