import { useEffect, useState } from 'react'

interface MealToastProps {
  isVisible: boolean
  onHide: () => void
}

export default function MealToast({ isVisible, onHide }: MealToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onHide, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onHide])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 animate-bounce z-50">
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white px-6 py-3 rounded-full shadow-lg shadow-emerald-500/50 flex items-center gap-2">
        <span className="text-xl">🔥</span>
        <span className="font-semibold text-sm">+1 Progress! You're building a strong habit</span>
      </div>
    </div>
  )
}
