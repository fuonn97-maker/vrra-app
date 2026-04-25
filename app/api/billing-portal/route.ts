import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function createPortal(userId: string | null) {
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (error || !profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'Stripe customer not found' }, { status: 404 })
  }

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vrra-app.vercel.app'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/premium`,
  })

  return NextResponse.json({ url: portalSession.url })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  return createPortal(searchParams.get('userId'))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  return createPortal(body.userId)
}