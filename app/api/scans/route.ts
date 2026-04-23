import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mealName, calories, protein, carbs, fat } = await req.json()

    // Get user's profile to check premium status and free scans used
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, free_scans_used')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      console.error('[v0] Failed to fetch user profile:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const isPremium = profileData.is_premium || false
    const freeScansUsed = profileData.free_scans_used || 0

    // Check limit for free users (3 total scans lifetime)
    if (!isPremium && freeScansUsed >= 3) {
      return NextResponse.json(
        {
          error: 'Scan limit reached',
          message: 'You have used all 3 free scans. Upgrade to premium for unlimited scans.',
          scansUsed: freeScansUsed,
          scansLimit: 3,
        },
        { status: 429 }
      )
    }

    // Create scan record
    const { data, error } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        meal_name: mealName,
        calories,
        protein,
        carbs,
        fat,
        health_score: 0,
      })
      .select()

    if (error) throw error

    // For free users, increment free_scans_used after successful scan
    if (!isPremium) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ free_scans_used: freeScansUsed + 1 })
        .eq('id', user.id)

      if (updateError) {
        console.error('[v0] Failed to update free_scans_used:', updateError)
      }
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json({ error: 'Failed to create scan' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to check premium status and free scans used
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, free_scans_used')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      console.error('[v0] Failed to fetch user profile:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const isPremium = profileData.is_premium || false
    const freeScansUsed = profileData.free_scans_used || 0

    // For free users, scansRemaining is based on free_scans_used
    // For premium users, scansRemaining is unlimited
    const scansRemaining = isPremium ? null : Math.max(0, 3 - freeScansUsed)

    return NextResponse.json({
      scansToday: freeScansUsed,
      scansLimit: isPremium ? null : 3,
      scansRemaining: scansRemaining,
      isPremium: isPremium,
    })
  } catch (error) {
    console.error('Get scans error:', error)
    return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 })
  }
}

