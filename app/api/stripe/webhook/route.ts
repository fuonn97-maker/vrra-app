import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(req: NextRequest) {
  console.log('[v0] === STRIPE WEBHOOK RECEIVED ===')

  try {
    // Get signature from headers
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')
    const body = await req.text()

    console.log('[v0] Stripe signature present:', !!sig)
    console.log('[v0] STRIPE_WEBHOOK_SECRET configured:', !!STRIPE_WEBHOOK_SECRET)

    if (!sig || !STRIPE_WEBHOOK_SECRET) {
      console.error('[v0] Webhook signature verification failed: missing signature or secret')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const stripe = getStripe()
    let event

    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
      console.log('[v0] Webhook signature verified')
    } catch (err) {
      console.error('[v0] Webhook signature verification failed:', err instanceof Error ? err.message : String(err))
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('[v0] Event type:', event.type)

    // Initialize Supabase client with exact credentials
    console.log('[v0] Initializing Supabase...')
    console.log('[v0] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('[v0] SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[v0] Missing Supabase credentials')
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Handle checkout.session.completed - PRIMARY ACTIVATION EVENT
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      console.log('WEBHOOK EVENT:', event.type)
      
      // Extract subscription and user identification
      const subscriptionId = session.subscription || null
      const userIdFromMetadata = session.metadata?.userId || null
      const userIdFromReference = session.client_reference_id || null

      console.log('checkout userId:', userIdFromMetadata || userIdFromReference)
      console.log('subscription id:', subscriptionId)

      // Prioritize userId from metadata or client_reference_id
      const userId = userIdFromMetadata || userIdFromReference
      
      // If no userId, we can't proceed but acknowledge webhook
      if (!userId) {
        console.error('[v0] No user identification found in checkout session')
        return NextResponse.json({ received: true }, { status: 200 })
      }

      // Update Supabase - Set premium status
      console.log('[v0] Updating user:', userId)

      const customerId =
  typeof session.customer === 'string' ? session.customer : session.customer?.id

const planName = session.metadata?.plan || 'monthly'

const updatePayload: any = {
  is_premium: true,
  premium_plan: planName,
  stripe_customer_id: customerId || null,
  stripe_subscription_id: subscriptionId || null,
  premium_started_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

      console.log('[v0] Update payload:', JSON.stringify(updatePayload))

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        
      await supabase.from('subscriptions').upsert(
  {
    user_id: userId,
    stripe_customer_id: customerId || null,
    stripe_subscription_id: subscriptionId || null,
    plan_type: planName,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    onConflict: 'stripe_subscription_id',
  }
)

      console.log('[v0] Update result - data:', data)
      console.log('[v0] Update result - error:', error)

      if (error) {
        console.error('[v0] Profile update FAILED:', error.message)
      } else {
        console.log('[v0] premium activated for:', userId)
      }

      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Handle customer.subscription.created - SECONDARY ACTIVATION
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as any
      console.log('WEBHOOK EVENT:', event.type)
      
      const userId = subscription.metadata?.userId
      // Update Supabase - Set premium status
      console.log('[v0] Updating user:', userId)

      const updatePayload: any = {
        is_premium: true,
        updated_at: new Date().toISOString(),
      }

      console.log('[v0] Update payload:', JSON.stringify(updatePayload))

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()

      console.log('[v0] Update result - data:', data)
      console.log('[v0] Update result - error:', error)

      if (error) {
        console.error('[v0] Profile update FAILED:', error.message)
      } else {
        console.log('[v0] premium activated for:', userId)
      }

      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Handle customer.subscription.updated - SYNC STATUS
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any
      console.log('WEBHOOK EVENT:', event.type)
      
      const userId = subscription.metadata?.userId
      const subscriptionStatus = subscription.status

      console.log('subscription userId:', userId)
      console.log('subscription id:', subscription.id)

      if (!userId) {
        console.log('[v0] No userId in subscription metadata, skipping')
        return NextResponse.json({ received: true }, { status: 200 })
      }

      // For subscription.updated, check status
      // Active or trialing = premium is active
      if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
        console.log('[v0] Updating user:', userId)
        console.log('[v0] Subscription status:', subscriptionStatus)

        const updatePayload: any = {
          is_premium: true,
          updated_at: new Date().toISOString(),
        }

        console.log('[v0] Update payload:', JSON.stringify(updatePayload))

        const { data, error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId)
          .select()

        console.log('[v0] Update result - data:', data)
        console.log('[v0] Update result - error:', error)

        if (error) {
          console.error('[v0] Profile update FAILED:', error.message)
        } else {
          console.log('[v0] premium activated for:', userId)
        }
      }

      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Handle customer.subscription.deleted - DEACTIVATE PREMIUM
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any
      console.log('WEBHOOK EVENT:', event.type)
      
      const userId = subscription.metadata?.userId

      console.log('subscription userId:', userId)
      console.log('subscription id:', subscription.id)

      if (!userId) {
        console.log('[v0] No userId in subscription metadata, skipping')
        return NextResponse.json({ received: true }, { status: 200 })
      }

      console.log('[v0] Updating user:', userId)
      console.log('[v0] Deactivating premium')

      const updatePayload: any = {
        is_premium: false,
        updated_at: new Date().toISOString(),
      }

      console.log('[v0] Update payload:', JSON.stringify(updatePayload))

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()

      console.log('[v0] Update result - data:', data)
      console.log('[v0] Update result - error:', error)

      if (error) {
        console.error('[v0] Profile update FAILED:', error.message)
      } else {
        console.log('[v0] premium deactivated for:', userId)
      }

      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Unhandled event type
    console.log('[v0] Unhandled event type:', event.type)
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[v0] Webhook error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
