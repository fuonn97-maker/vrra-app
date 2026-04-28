'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfileScreen({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [friendsCount, setFriendsCount] = useState(0)
  const [friends, setFriends] = useState<any[]>([])
  const [showFriends, setShowFriends] = useState(false)
  const [isFriend, setIsFriend] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const router = useRouter()
  const [viewingUserId, setViewingUserId] = useState(user.id)

  useEffect(() => {
  loadProfile()
}, [viewingUserId])

  const handleAvatarUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0]
  if (!file) return

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file)

  if (uploadError) {
    alert(uploadError.message)
    return
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: data.publicUrl,
    })
    .eq('id', user.id)

  if (updateError) {
    alert(updateError.message)
    return
  }

  loadProfile()
}

const loadProfile = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', viewingUserId)
      .single()
    
      const { data: postData } = await supabase
      .from('community_posts')
      .select('*')
      .eq('user_id', viewingUserId)

    const { data: friendData } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    setProfile(profileData)
setPosts(postData || [])

const friendIds = (friendData || []).map((friend: any) => {
  if (friend.user_id === user.id) {
    return friend.friend_id
  }

  return friend.user_id
})

const uniqueFriendIds = Array.from(new Set(friendIds))

setFriendsCount(uniqueFriendIds.length)

setIsFriend(
  friendData?.some(
    (f: any) =>
      (f.user_id === user.id && f.friend_id === viewingUserId) ||
      (f.friend_id === user.id && f.user_id === viewingUserId)
  ) || false
)

if (uniqueFriendIds.length > 0) {
  const { data: friendsProfileData } = await supabase
    .from('profiles')
    .select('*')
    .in('id', uniqueFriendIds)

  setFriends(friendsProfileData || [])
} else {
  setFriends([])
}
  }

  const handleRemoveFriend = async () => {
  const confirmed = window.confirm(
    'Are you sure you want to remove this friend?'
  )

  if (!confirmed) return

  await supabase
    .from('friendships')
    .delete()
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${viewingUserId}),and(user_id.eq.${viewingUserId},friend_id.eq.${user.id})`
    )

    await supabase
  .from('friend_requests')
  .delete()
  .or(
    `and(sender_id.eq.${user.id},receiver_id.eq.${viewingUserId}),and(sender_id.eq.${viewingUserId},receiver_id.eq.${user.id})`
  )

  loadProfile()
}
return (
  <div className="p-4 space-y-5">
    <button
      onClick={() => {
        if (viewingUserId !== user.id) {
          setProfile(null)
          setPosts([])
          setFriends([])
          setViewingUserId(user.id)
        } else {
          router.back()
        }
      }}
      className="text-white/70 text-sm mb-2"
    >
      ← Back
    </button>

    <div className="flex items-center gap-4">
      <label className="w-24 h-24 rounded-full bg-lime-400 overflow-hidden cursor-pointer shrink-0">
        {profile?.avatar_url ? (
          <img
            src={`${profile.avatar_url}?t=${Date.now()}`}
            alt=""
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          profile?.username?.charAt(0)?.toUpperCase()
        )}

        {viewingUserId === user.id && (
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        )}
      </label>

      <div>
        <h1 className="text-2xl font-bold">@{profile?.username}</h1>

        <p className="text-white/60">
          {profile?.is_premium ? 'Premium Member' : 'Free Member'}
        </p>

        {viewingUserId !== user.id && isFriend && (
          <button
            onClick={handleRemoveFriend}
            className="mt-3 px-4 py-2 bg-red-500 rounded-xl text-white text-sm"
          >
            Remove Friend
          </button>
        )}
      </div>
    </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{posts.length}</p>
          <p className="text-white/60">Posts</p>
        </div>

        <div
  onClick={() => setShowFriends(true)}
  className="bg-white/5 rounded-xl p-4 text-center cursor-pointer"
>
          <p className="text-2xl font-bold">{friendsCount}</p>
          <p className="text-white/60">Friends</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-6">
  {posts.map((post: any) => (
    <div
  key={post.id}
  onClick={() => setSelectedPost(post)}
  className="aspect-square overflow-hidden rounded-xl bg-white/5 cursor-pointer"
>
      {post.video_url ? (
        <div className="relative w-full h-full">
  <video
    src={post.video_url}
    className="w-full h-full object-cover"
    muted
    playsInline
    preload="metadata"
  />
  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
    <div className="w-10 h-10 rounded-full bg-white/80 text-black flex items-center justify-center text-lg">
      ▶
    </div>
  </div>
</div>
      ) : post.image_url ? (
        <img
          src={post.image_url}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : null}
    </div>
  ))}
</div>

{showFriends && (
  <div
    className="fixed inset-0 bg-black/90 z-50 p-4 overflow-y-auto"
  >
    <button
      onClick={() => setShowFriends(false)}
      className="text-white mb-4"
    >
      ← Close
    </button>

    <h2 className="text-2xl font-bold mb-4">Friends</h2>

    <div className="space-y-3">
      {friends.map((friend: any) => (
  <div
    key={friend.id}
    onClick={() => {
      setViewingUserId(friend.id)
      setShowFriends(false)
    }}
    className="bg-white/5 rounded-xl p-4 flex items-center gap-3 cursor-pointer"
  >
          {friend.avatar_url ? (
  <img
    src={friend.avatar_url}
    alt=""
    className="w-12 h-12 rounded-full object-cover"
  />
) : (
  <div className="w-12 h-12 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold">
    {(friend.username || 'U').charAt(0).toUpperCase()}
  </div>
)}

          <p className="font-semibold">@{friend.username}</p>
        </div>
      ))}
    </div>
  </div>
)}

{selectedPost && (
  <div
    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
    onClick={() => setSelectedPost(null)}
  >
    {selectedPost.video_url ? (
      <video
        src={selectedPost.video_url}
        controls
        autoPlay
        playsInline
        className="max-w-full max-h-full rounded-xl"
      />
    ) : (
      <img
        src={selectedPost.image_url}
        alt=""
        className="max-w-full max-h-full rounded-xl"
      />
    )}
  </div>
)}

    </div>
  )
}