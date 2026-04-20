'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import RecentMeals from '@/components/screens/recent-meals'

export default function MealsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-24 px-4 space-y-6">
        {/* Header with Back Button */}
        <div className="pt-6 flex items-center gap-3 pb-2">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-foreground">All Meals</h1>
            <p className="text-xs text-foreground/50 mt-1">Your complete meal history</p>
          </div>
        </div>

        {/* Meals List with premium spacing */}
        <RecentMeals showAll={true} />
      </div>
    </div>
  )
}
