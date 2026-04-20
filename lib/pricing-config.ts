/**
 * Centralized pricing configuration
 * Keeps pricing display and Stripe checkout in sync
 */

export type BillingPeriod = 'monthly' | 'yearly'

export interface PricingPlan {
  period: BillingPeriod
  priceId: string
  displayPrice: string
  displayPeriod: string
  label: string
  badge?: string
  savings?: string
  monthlyBreakdown?: string
}

export const PRICING_PLANS: Record<BillingPeriod, PricingPlan> = {
  monthly: {
    period: 'monthly',
    priceId: 'price_1TNaKDAykD9zzIWZnzJf6Q3w',
    displayPrice: '$4.99',
    displayPeriod: '/month',
    label: 'Monthly',
  },
  yearly: {
    period: 'yearly',
    priceId: 'price_1TNaKDAykD9zzIWZPfDYdXQe',
    displayPrice: '$19.99',
    displayPeriod: '/year',
    label: 'Yearly',
    badge: '🔥 BEST VALUE',
    savings: 'Save 66% vs monthly',
    monthlyBreakdown: '~$1.66/month',
  },
}

export const PREMIUM_FEATURES = [
  {
    title: 'Unlimited Scans',
    description: 'Log unlimited meals every day',
  },
  {
    title: 'Advanced Analytics',
    description: 'AI-powered macro and calorie insights',
  },
  {
    title: 'Meal History',
    description: 'Complete nutrition database and trends',
  },
  {
    title: 'Streak Tracking',
    description: 'Visual progress and consistency metrics',
  },
  {
    title: 'Goal Tracking',
    description: 'Personalized daily targets',
  },
  {
    title: 'Export Data',
    description: 'Download your nutrition history',
  },
]

/**
 * Get pricing plan by billing period
 */
export function getPricingPlan(period: BillingPeriod): PricingPlan {
  const plan = PRICING_PLANS[period]
  console.log('[v0] getPricingPlan:', {
    period,
    displayPrice: plan.displayPrice,
    displayPeriod: plan.displayPeriod,
    priceId: plan.priceId,
  })
  return plan
}

/**
 * Get default plan (monthly)
 */
export function getDefaultPlan(): PricingPlan {
  return PRICING_PLANS.monthly
}

/**
 * Get plan name from price ID
 */
export function getPlanNameFromPriceId(priceId: string): 'monthly' | 'yearly' | null {
  for (const [period, plan] of Object.entries(PRICING_PLANS)) {
    if (plan.priceId === priceId) {
      return period as 'monthly' | 'yearly'
    }
  }
  return null
}
