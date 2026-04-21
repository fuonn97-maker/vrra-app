import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: Request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() {
            return undefined
          },
          set() {},
          remove() {}
        }
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    // 👉 更新 workouts_completed +1
    const { data, error } = await supabase
      .from('profiles')
      .update({
        workouts_completed: supabase.rpc ? undefined : undefined
      })
      .eq('id', user.id)

    if (error) {
      console.error(error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ⚠️ 正确写法（增加1）
    await supabase.rpc('increment_workouts', {
      user_id_input: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
