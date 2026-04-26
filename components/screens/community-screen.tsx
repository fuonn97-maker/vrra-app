'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CommunityScreen({ user }: { user: any }) {
  const [posts, setPosts] = useState<any[]>([])
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [searchUsername, setSearchUsername] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [friendMessage, setFriendMessage] = useState('')
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({})
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
  fetchPosts()
  fetchFriendRequests()
  fetchComments()
}, [])

  const fetchComments = async () => {
  const { data: commentsData, error } = await supabase
    .from('post_comments')
    .select('*')
    .order('created_at', { ascending: true })

  if (error || !commentsData) {
    setComments([])
    return
  }

  const commentUserIds = [...new Set(commentsData.map((comment) => comment.user_id))]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', commentUserIds)

  const commentsWithProfiles = commentsData.map((comment) => ({
    ...comment,
    profile: profiles?.find((profile) => profile.id === comment.user_id),
  }))

  setComments(commentsWithProfiles)
}
  
  const fetchFriendRequests = async () => {
  const { data: requests, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('receiver_id', user.id)
    .eq('status', 'pending')

  if (error || !requests) {
    setFriendRequests([])
    return
  }

  const senderIds = requests.map((request) => request.sender_id)

  if (senderIds.length === 0) {
    setFriendRequests([])
    return
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, email')
    .in('id', senderIds)

  const requestsWithProfiles = requests.map((request) => ({
    ...request,
    profile: profiles?.find((p) => p.id === request.sender_id),
  }))

  setFriendRequests(requestsWithProfiles)
}

const respondFriendRequest = async (
  requestId: string,
  senderId: string,
  action: 'accepted' | 'rejected'
) => {
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: action })
    .eq('id', requestId)

  if (updateError) {
    setFriendMessage('Failed to update friend request.')
    return
  }

  if (action === 'accepted') {
    await supabase.from('friendships').insert([
      {
        user_id: user.id,
        friend_id: senderId,
      },
      {
        user_id: senderId,
        friend_id: user.id,
      },
    ])
  }

  setFriendMessage(
    action === 'accepted'
      ? 'Friend request accepted.'
      : 'Friend request rejected.'
  )

  fetchFriendRequests()
}

  const fetchPosts = async () => {
  const { data: friendships } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', user.id)

  const friendIds = friendships?.map((item) => item.friend_id) || []
  const visibleUserIds = [user.id, ...friendIds]

  const { data: postsData, error } = await supabase
    .from('community_posts')
    .select('*')
    .in('user_id', visibleUserIds)
    .order('created_at', { ascending: false })

  if (error || !postsData) {
    setPosts([])
    return
  }

  const postUserIds = [...new Set(postsData.map((post) => post.user_id))]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', postUserIds)

  const postIds = postsData.map((post) => post.id)

  const { data: likes } = await supabase
  .from('post_likes')
  .select('post_id, user_id')
  .in('post_id', postIds)
  
  const postsWithProfiles = postsData.map((post) => {
  const postLikes = likes?.filter((like) => like.post_id === post.id) || []

  return {
    ...post,
    profile: profiles?.find((profile) => profile.id === post.user_id),
    likes_count: postLikes.length,
    liked_by_me: postLikes.some((like) => like.user_id === user.id),
  }
})

  setPosts(postsWithProfiles)
}

  const handleUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  if (uploading) return
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const filePath = `${user.id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('community-posts')
      .upload(filePath, file)

    if (uploadError) {
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('community-posts')
      .getPublicUrl(filePath)

    await supabase.from('community_posts').insert({
      user_id: user.id,
      image_url: data.publicUrl,
      caption
    })

    setCaption('')
    setUploading(false)

    fetchPosts()
  }

  const deletePost = async (id: string) => {
    await supabase
      .from('community_posts')
      .delete()
      .eq('id', id)

    fetchPosts()
  }

  const addComment = async (postId: string) => {
  if (!commentTexts[postId]?.trim()) return

  const { error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      comment: commentTexts[postId].trim(),
    })

  if (!error) {
    setCommentTexts({
  ...commentTexts,
  [postId]: '',
})
    fetchComments()
  }
}

const deleteComment = async (commentId: string) => {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)

  if (!error) {
    fetchComments()
  }
}

const formatTimeAgo = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`

  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}d ago`
}

  const toggleLike = async (post: any) => {
  if (post.liked_by_me) {
    setPosts((currentPosts: any[]) =>
      currentPosts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              liked_by_me: false,
              likes_count: Math.max((item.likes_count || 1) - 1, 0),
            }
          : item
      )
    )

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', post.id)
      .eq('user_id', user.id)

    if (error) {
      fetchPosts()
    }
  } else {
    setPosts((currentPosts: any[]) =>
      currentPosts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              liked_by_me: true,
              likes_count: (item.likes_count || 0) + 1,
            }
          : item
      )
    )

    const { error } = await supabase
      .from('post_likes')
      .insert({
        post_id: post.id,
        user_id: user.id,
      })

    if (error) {
      fetchPosts()
    }
  }
}

  const searchUsers = async () => {
  if (!searchUsername.trim()) return

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email')
    .ilike('username', `%${searchUsername.trim()}%`)
    .neq('id', user.id)
    .limit(10)

  if (!error && data) {
    setSearchResults(data)
  }
}

const sendFriendRequest = async (receiverId: string) => {
  setFriendMessage('')

  const { error } = await supabase
    .from('friend_requests')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending'
    })

  if (error) {
    setFriendMessage('Friend request already sent or failed.')
    return
  }

  setFriendMessage('Friend request sent.')
}

  return (
  <>
    {selectedImage && (
      <div
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
        onClick={() => setSelectedImage('')}
      >
        <img
          src={selectedImage}
          alt=""
          className="max-w-full max-h-full object-contain"
        />
      </div>
    )}
    <div className="min-h-screen px-4 pt-6 pb-28 space-y-6">
      <h1 className="text-2xl font-bold">
        Community
      </h1>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3">
  <h2 className="font-semibold">Find Friends</h2>

  <div className="flex gap-2">
    <input
      value={searchUsername}
      onChange={(e) => setSearchUsername(e.target.value)}
      placeholder="Search username..."
      className="flex-1 h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none"
    />

    <button
      onClick={searchUsers}
      className="px-4 rounded-2xl bg-lime-400 text-black font-semibold"
    >
      Search
    </button>
  </div>

  {friendMessage && (
    <p className="text-sm text-lime-400">{friendMessage}</p>
  )}

  <div className="space-y-2">
    {searchResults.map((profile) => (
      <div
        key={profile.id}
        className="flex items-center justify-between bg-black/20 rounded-2xl p-3"
      >
        <div>
          <p className="font-medium">@{profile.username}</p>
          <p className="text-xs text-white/40">{profile.email}</p>
        </div>

        <button
          onClick={() => sendFriendRequest(profile.id)}
          className="px-3 py-2 rounded-xl bg-white/10 text-sm"
        >
          Add
        </button>
      </div>
    ))}
  </div>
</div>

<div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3">
  <h2 className="font-semibold">Friend Requests</h2>

  {friendRequests.length === 0 && (
    <p className="text-sm text-white/40">
      No pending friend requests.
    </p>
  )}

  {friendRequests.map((request) => (
    <div
      key={request.id}
      className="flex items-center justify-between bg-black/20 rounded-2xl p-3"
    >
      <div>
        <p className="font-medium">
          @{request.profile?.username || 'Unknown user'}
        </p>
        <p className="text-xs text-white/40">
          wants to add you
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() =>
            respondFriendRequest(
              request.id,
              request.sender_id,
              'accepted'
            )
          }
          className="px-3 py-2 rounded-xl bg-lime-400 text-black text-sm font-semibold"
        >
          Accept
        </button>

        <button
          onClick={() =>
            respondFriendRequest(
              request.id,
              request.sender_id,
              'rejected'
            )
          }
          className="px-3 py-2 rounded-xl bg-white/10 text-sm"
        >
          Reject
        </button>
      </div>
    </div>
  ))}
</div>

      <textarea
  value={caption}
  onChange={(e) => setCaption(e.target.value)}
  placeholder="Share your fitness journey..."
  className="w-full min-h-[90px] p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none focus:border-lime-400"
/>

      <label className="flex items-center justify-center w-full h-14 rounded-2xl border border-white/10 bg-white/5 cursor-pointer">
  Upload Photo
  <input
    type="file"
    accept="image/*"
    onChange={handleUpload}
    className="hidden"
  />
</label>

      {uploading && (
  <p className="text-sm text-white/70">
    Posting...
  </p>
)}

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-3 shadow-lg"
          >
            <img
  src={post.image_url}
  onClick={() => setSelectedImage(post.image_url)}
              alt=""
              className="w-full h-[280px] object-cover rounded-2xl"
            />

            <p className="font-semibold">
  @{post.profile?.username || 'User'}

  <span className="ml-2 text-xs text-white/40">
    {formatTimeAgo(post.created_at)}
  </span>
</p>

{post.caption && (
  <p className="mt-2">
    {post.caption}
  </p>
)}

<button
  onClick={() => toggleLike(post)}
  className="text-sm font-medium"
>
  {post.liked_by_me ? '❤️' : '🤍'} {post.likes_count || 0}
</button>

<p className="text-xs text-white/50 mt-1">
  💬 {comments.filter((comment) => comment.post_id === post.id).length} comments
</p>

<div className="space-y-2 mt-3">
  {comments
  .filter((comment) => comment.post_id === post.id)
  .map((comment) => (
    <div
      key={comment.id}
      className="flex items-center justify-between"
    >
      <p className="text-sm text-white/70">
  <span className="font-semibold text-white">
    @{comment.profile?.username || 'User'}
  </span>{' '}
  {comment.comment}
  <span className="ml-2 text-xs text-white/40">
    {formatTimeAgo(comment.created_at)}
  </span>
</p>

      {(comment.user_id === user.id ||
        post.user_id === user.id) && (
        <button
          onClick={() => deleteComment(comment.id)}
          className="text-xs text-red-400"
        >
          Delete
        </button>
      )}
    </div>
))}

  <div className="flex gap-2">
    <input
      value={commentTexts[post.id] || ''}
      onChange={(e) =>
  setCommentTexts({
    ...commentTexts,
    [post.id]: e.target.value,
  })
}
      placeholder="Write a comment..."
      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
    />

    <button
      onClick={() => addComment(post.id)}
      className="px-3 py-2 rounded-xl bg-white/10 text-sm"
    >
      Send
    </button>
  </div>
</div>

{post.user_id === user.id && (
  <button
    onClick={() => deletePost(post.id)}
    className="text-red-500 text-sm"
  >
    Delete
  </button>
)}
          </div>
        ))}
      </div>
    </div>
    </>
  )
}