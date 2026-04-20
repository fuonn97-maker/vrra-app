'use client'

import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

export default function SuccessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0f1a] to-background flex items-center justify-center p-6">
      <div className="max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Check size={32} className="text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-foreground">Payment Successful</h1>
        <p className="text-muted-foreground">Welcome to VRRA Premium! You now have unlimited scans.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-3 rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
