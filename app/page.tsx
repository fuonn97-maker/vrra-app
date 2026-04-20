'use client'

import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      <h1 className="text-4xl font-bold mb-4">VRRA</h1>

      <h2 className="text-2xl text-center mb-6">
        Your Fitness Score, Simplified
      </h2>

      <div className="flex gap-4">
        <Link href="/auth/signup">
          <button className="bg-green-500 px-6 py-3 rounded-lg text-black">
            Sign Up
          </button>
        </Link>

        <Link href="/auth/login">
          <button className="border border-green-500 px-6 py-3 rounded-lg text-green-400">
            Sign In
          </button>
        </Link>
      </div>

    </div>
  )
}