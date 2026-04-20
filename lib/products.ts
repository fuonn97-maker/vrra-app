export interface Product {
  id: string
  name: string
  description: string
  priceId: string
}

export const PRODUCTS: Product[] = [
  {
    id: 'premium-monthly',
    name: 'Premium Monthly',
    description: 'Unlimited meal scans, advanced analytics, and AI insights',
    priceId: 'price_1TNaKDAykD9zzIWZnzJf6Q3w',
  },
  {
    id: 'premium-yearly',
    name: 'Premium Yearly',
    description: 'Unlimited meal scans, advanced analytics, and AI insights (Save 20%)',
    priceId: 'price_1TNaKDAykD9zzIWZPfDYdXQe',
  },
]
