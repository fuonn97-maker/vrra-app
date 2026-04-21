import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ENV
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ==============================
// GET /api/scores
// ==============================
export async function GET(req: NextRequest) {
  console.log('🔥🔥🔥 SCORES API RUNNING 🔥🔥🔥')

  try {
    const { searchParams } = new URL(req.url)
    const days = searchParams.get('days') || '7'

    console.log('[INFO] days:', days)

    // ==============================
    // AUTH
    // ==============================
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: Bearer ${token},
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    const userId = user.id

    // ==============================
    // TIMEZONE（固定马来西亚）
    // ==============================
    const userTimezone = 'Asia/Kuala_Lumpur'

    // ==============================
    // 读取 scans
    // ==============================
    const { data: scans, error: scansError } = await supabase
      .from('scans')
      .select('created_at, is_deleted')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (scansError) {
      console.error('[ERROR] Fetch scans:', scansError.message)
    }

    // ==============================
    // 转换成“本地日期”
    // ==============================
    const uniqueScanDates = new Set<string>()

    if (scans) {
      for (const scan of scans) {
        const localDate = new Date(scan.created_at).toLocaleDateString('en-CA', {
          timeZone: userTimezone,
        })

        console.log('[SCAN]', scan.created_at, '→', localDate)

        uniqueScanDates.add(localDate)
      }
    }

    // ==============================
    // 今天日期（本地）
    // ==============================
    const todayLocalDate = new Date().toLocaleDateString('en-CA', {
      timeZone: userTimezone,
    })

    console.log('[TODAY]', todayLocalDate)
    console.log('[DATES]', Array.from(uniqueScanDates))

    // ==============================
    // streak 计算
    // ==============================
    let streak = 0
    let currentDate = new Date()

    for (let i = 0; i < 365; i++) {
      const checkDate = currentDate.toLocaleDateString('en-CA', {
        timeZone: userTimezone,
      })

      if (uniqueScanDates.has(checkDate)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    // ==============================
    // 是否今天有scan
    // ==============================
    const hasTodayScans = uniqueScanDates.has(todayLocalDate)

    console.log('[RESULT]')
    console.log('streak:', streak)
    console.log('hasTodayScans:', hasTodayScans)

    // ==============================
    // 返回数据
    // ==============================
    return NextResponse.json({
      scores: [],
      bodyScore: 0,
      dailyScore: 0,
      streak,
      hasTodayScans,
      workoutsCompleted: 0,
    })
  } catch (error: any) {
    console.error('[FATAL]', error.message)

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
