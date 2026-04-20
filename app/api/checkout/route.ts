import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getPlanNameFromPriceId } from '@/lib/pricing-config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(req: NextRequest) {
  try {
    console.log('[v0] === CHECKOUT REQUEST START ===')

    const { userId, priceId } = await req.json()

    console.log('[v0] Request body - userId:', userId, 'priceId:', priceId)

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const selectedPriceId = priceId || 'price_1TNaKDAykD9zzIWZnzJf6Q3w'
    const planName = getPlanNameFromPriceId(selectedPriceId) || 'monthly'

    console.log('[v0] Selected price ID:', selectedPriceId)
    console.log('[v0] Plan name:', planName)

    const stripe = getStripe()

    let userEmail: string | undefined

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('[v0] Failed to load user email from profiles:', profileError.message)
      } else {
        userEmail = profile?.email || undefined
      }
    } else {
      console.log('[v0] Supabase public env missing, skipping email lookup')
    }

    console.log('[v0] customer_email:', userEmail || 'not found')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL is missing' },
        { status: 500 }
      )
    }

    const successUrl = `${appUrl}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${appUrl}/upgrade`

    console.log('[v0] Success URL:', successUrl)
    console.log('[v0] Cancel URL:', cancelUrl)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      customer_email: userEmail,
      metadata: {
        userId,
        plan: planName,
      },
      subscription_data: {
        metadata: {
          userId,
          plan: planName,
        },
      },
      allow_promotion_codes: true,
    })

    console.log('[v0] Checkout session created successfully:', session.id)
    console.log('[v0] Session subscription mode:', session.mode)
    console.log('[v0] === CHECKOUT REQUEST SUCCESS ===')

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('[v0] === CHECKOUT ERROR ===')
    console.error(
      '[v0] Error message:',
      error instanceof Error ? error.message : String(error)
    )
    console.error(
      '[v0] Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    )

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Checkout failed',
      },
      { status: 500 }
    )
  }
}
