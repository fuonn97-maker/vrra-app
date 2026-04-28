'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProfileScreen({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [friendsCount, setFriendsCount] = useState(0)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: postData } = await supabase
      .from('community_posts')
      .select('*')
      .eq('user_id', user.id)

    const { data: friendData } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    setProfile(profileData)
    setPosts(postData || [])
    setFriendsCount(friendData?.length || 0)
  }

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-lime-400 flex items-center justify-center text-4xl font-bold text-black">
          {profile?.username?.charAt(0)?.toUpperCase()}
        </div>

        <div>
          <h1 className="text-2xl font-bold">@{profile?.username}</h1>
          <p className="text-white/60">
            {profile?.is_premium ? 'Premium Member' : 'Free Member'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{posts.length}</p>
          <p className="text-white/60">Posts</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{friendsCount}</p>
          <p className="text-white/60">Friends</p>
        </div>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="rounded-2xl overflow-hidden">
            {post.video_url && (
              <video
                src={post.video_url}
                controls
                className="w-full rounded-2xl"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}