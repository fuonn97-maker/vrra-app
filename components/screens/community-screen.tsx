'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Share } from '@capacitor/share'

export default function CommunityScreen({ user }: { user: any }) {
  const [posts, setPosts] = useState<any[]>([])
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [searchUsername, setSearchUsername] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [friendMessage, setFriendMessage] = useState('')
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [savedPostIds, setSavedPostIds] = useState<string[]>([])
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [friends, setFriends] = useState<any[]>([])
  const [feedSort, setFeedSort] = useState<'latest' | 'trending'>('latest')
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const highlightedCommentRef = useRef<HTMLDivElement | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<{ [key: string]: boolean }>({})
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const [commentReactions, setCommentReactions] = useState<any[]>([])
  const [postReactions, setPostReactions] = useState<any[]>([])

  const fetchPostReactions = async () => {
  const { data, error } = await supabase
    .from('post_reactions')
    .select('*')

  if (!error && data) {
    setPostReactions(data)
  }
}

  const fetchCommentReactions = async () => {
  const { data, error } = await supabase
    .from('comment_reactions')
    .select('*')

  if (!error && data) {
    setCommentReactions(data)
  }
}

const toggleCommentReaction = async (commentId: string, emoji: string) => {
  const existing = commentReactions.find(
    (r) => r.comment_id === commentId && r.user_id === user.id
  )

  if (existing?.emoji === emoji) {
    await supabase
      .from('comment_reactions')
      .delete()
      .eq('id', existing.id)
  } else if (existing) {
    await supabase
      .from('comment_reactions')
      .update({ emoji })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('comment_reactions')
      .insert({
        comment_id: commentId,
        user_id: user.id,
        emoji,
      })
  }

  fetchCommentReactions()
}

const togglePostReaction = async (postId: string, emoji: string) => {
  const existing = postReactions.find(
    (r) => String(r.post_id) === String(postId) && r.user_id === user.id
  )

  if (existing?.emoji === emoji) {
    await supabase
      .from('post_reactions')
      .delete()
      .eq('id', existing.id)
  } else if (existing) {
    await supabase
      .from('post_reactions')
      .update({ emoji })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('post_reactions')
      .insert({
        post_id: postId,
        user_id: user.id,
        emoji,
      })

const post = posts.find((p) => String(p.id) === String(postId))

if (post && post.user_id !== user.id) {
  const { error: reactionNotificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: post.user_id,
      actor_id: user.id,
      post_id: postId,
      type: 'reaction',
      message: 'Someone reacted to your post',
      is_read: false,
    })

  if (reactionNotificationError) {
    console.log('REACTION NOTIFICATION ERROR:', reactionNotificationError)
  } else {
    console.log('REACTION NOTIFICATION SUCCESS')
  }
}

  }

  fetchPostReactions()
}


  useEffect(() => {
  fetchPosts()
  fetchFriendRequests()
  fetchSavedPosts()
  fetchComments()
  fetchCommentReactions()
  fetchPostReactions()
  fetchFriends()
  fetchNotifications()
}, [])

useEffect(() => {
  if (!selectedPost?.highlightCommentId) return

  setTimeout(() => {
    highlightedCommentRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, 300)
}, [selectedPost?.highlightCommentId])

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement

        video.muted = true

        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      })
    },
    {
      threshold: 0.3,
    }
  )

  const timer = setTimeout(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.muted = true
        observer.observe(video)
      }
    })

    const firstVideo = Object.values(videoRefs.current)[0]
    if (firstVideo) {
      firstVideo.muted = true
      firstVideo.play().catch(() => {})
    }
  }, 500)

  return () => {
    clearTimeout(timer)
    observer.disconnect()
  }
}, [posts])

  const fetchNotifications = async () => {
  if (!user?.id) return

  const { data, error } = await supabase
  .from('notifications')
.select(`
  id,
  type,
  message,
  is_read,
  created_at,
  post_id,
  actor_id,
  actor:profiles!notifications_actor_id_fkey(
    id,
    username,
    avatar_url
  )
`)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

  if (!error && data) {
    setNotifications(data)
  }
}

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
    .select('id, username, avatar_url')
    .in('id', commentUserIds)

  const commentsWithProfiles = commentsData.map((comment) => ({
    ...comment,
    profile: profiles?.find((profile) => profile.id === comment.user_id),
  }))

  setComments(commentsWithProfiles)
}

const fetchSavedPosts = async () => {
  if (!user?.id) return

  const { data, error } = await supabase
    .from('post_saves')
    .select('post_id')
    .eq('user_id', user.id)

  if (!error && data) {
    setSavedPostIds(data.map((item) => item.post_id))
  }
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
    .select('id, username, avatar_url')
    .in('id', senderIds)

  const requestsWithProfiles = requests.map((request) => ({
    ...request,
    profile: profiles?.find((p) => p.id === request.sender_id),
  }))

  setFriendRequests(requestsWithProfiles)
}

const fetchFriends = async () => {
  const { data: friendships } = await supabase
    .from('friendships')
    .select('*')
    .eq('user_id', user.id)

  if (!friendships) {
    setFriends([])
    return
  }

  const friendIds = friendships.map((item) => item.friend_id)

  if (friendIds.length === 0) {
    setFriends([])
    return
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', friendIds)

  setFriends(profiles || [])
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

await supabase.from('notifications').insert({
  user_id: senderId,
  actor_id: user.id,
  type: 'friend_accept',
  message: 'accepted your friend request',
  is_read: false,
})

  }

  setFriendMessage(
    action === 'accepted'
      ? 'Friend request accepted.'
      : 'Friend request rejected.'
  )

  fetchFriendRequests()
}

const isFriend = (profileId: string) => {
  return friends.some((friend: any) => friend.id === profileId)
}

const removeFriend = async (friendId: string) => {
  await supabase
    .from('friendships')
    .delete()
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
    )

  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`
    )

  if (error) {
    alert(error.message)
    return
  }

  fetchFriends()
  fetchPosts()
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
    .select('id, username, avatar_url')
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
  alert(uploadError.message)
  setUploading(false)
  return
}

    const { data } = supabase.storage
      .from('community-posts')
      .getPublicUrl(filePath)

    const isVideo = file.type.startsWith('video/')

const { error: insertError } = await supabase.from('community_posts').insert({
  user_id: user.id,
  image_url: isVideo ? null : data.publicUrl,
  video_url: isVideo ? data.publicUrl : null,
  caption
})

if (insertError) {
  alert(insertError.message)
  setUploading(false)
  return
}

    setCaption('')
    setUploading(false)

    fetchPosts()
  }

  const deletePost = async (id: string) => {
  await supabase
    .from('post_comments')
    .delete()
    .eq('post_id', id)

  await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', id)

  await supabase
    .from('community_posts')
    .delete()
    .eq('id', id)

  fetchPosts()
  fetchComments()
}

  const addComment = async (postId: string, parentId: string | null = null) => {
  const notificationType = parentId ? 'reply' : 'comment'
    console.log('ADD COMMENT parentId:', parentId)
  if (commentingPostId === postId && !parentId) return
  if (!commentTexts[postId]?.trim()) return

  setCommentingPostId(postId)

  const { error } = await supabase
    .from('post_comments')
    .insert({
  post_id: postId,
  user_id: user.id,
  comment: commentTexts[postId].trim(),
  parent_id: parentId,
})

  if (!error) {
    setCommentTexts({
      ...commentTexts,
      [postId]: '',
    })

    setReplyingTo(null)
    setCommentingPostId(null)
    fetchComments()
    
    let targetUserId = null
let notificationType = 'comment'

if (parentId) {
  const parentComment = comments.find(
  (c: any) => String(c.id) === String(parentId)
)

  if (parentComment && parentComment.user_id !== user.id) {
    targetUserId = parentComment.user_id
    notificationType = 'reply'
  }
}
    
    const postOwner = posts.find(
  (p: any) => String(p.id) === String(postId)
)

if (!targetUserId && postOwner && postOwner.user_id !== user.id) {
  targetUserId = postOwner.user_id
}

if (targetUserId) {
  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: targetUserId,
    actor_id: user.id,
    post_id: postId,
    type: notificationType,
    comment_id: parentId || null,
    reply_id: null,
    message:
      notificationType === 'reply'
        ? 'Someone replied to your comment'
        : 'Someone commented on your post',
    is_read: false,
  })
if (notificationError) {
  console.log('NOTIFICATION INSERT ERROR:', notificationError)
} else {
  console.log('NOTIFICATION INSERT SUCCESS')
  fetchNotifications()
}

}
    
    await fetchComments()
  }

  setCommentingPostId(null)
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

const sharePost = async (post: any) => {

  await Share.share({
    title: 'VRRA Community Post',
    text: `${post.caption || 'Check this out!'}\n\nwatch here:\n${post.image_url || post.video_url || window.location.href}`,
    dialogTitle: 'Share this post',
  })
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

    if (!error) {
  fetchPosts()

  if (post.user_id !== user.id) {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: post.user_id,
        actor_id: user.id,
        post_id: post.id,
        type: 'like',
        message: 'Someone liked your post',
        is_read: false,
      })

    if (notificationError) {
      console.log('LIKE NOTIFICATION ERROR:', notificationError)
    } else {
      console.log('LIKE NOTIFICATION SUCCESS')
    }
  }
}
    fetchNotifications()
  }
}

const toggleSave = async (post: any) => {
  const isSaved = savedPostIds.includes(post.id)

  if (isSaved) {
    await supabase
      .from('post_saves')
      .delete()
      .eq('post_id', post.id)
      .eq('user_id', user.id)

    setSavedPostIds((current) =>
      current.filter((id) => id !== post.id)
    )
  } else {
    await supabase
      .from('post_saves')
      .insert({
        post_id: post.id,
        user_id: user.id,
      })

    setSavedPostIds((current) => [...current, post.id])
  }
}

const doubleTapLike = (post: any) => {
  setShowHeart(true)

setTimeout(() => {
  setShowHeart(false)
}, 800)
  if (!post.liked_by_me) {
    toggleLike(post)
  }
}

  const searchUsers = async () => {
  if (!searchUsername.trim()) return

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .ilike('username', `%${searchUsername.trim()}%`)
    .neq('id', user.id)
    .limit(10)

  if (!error && data) {
    setSearchResults(data)
  }
}

const sendFriendRequest = async (receiverId: string) => {
  setFriendMessage('')

  await supabase
  .from('friend_requests')
  .delete()
  .or(
    `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
  )
  
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

const { error: notificationError } = await supabase
  .from('notifications')
  .insert({
    user_id: receiverId,
    actor_id: user.id,
    type: 'friend_request',
    message: 'sent you a friend request',
    is_read: false,
  })

fetchNotifications()

setFriendMessage('Friend request sent.')
}
const isPending = (profileId: string) => {
  return friendRequests.some(
    (request: any) =>
      request.receiver_id === profileId &&
      request.sender_id === user.id &&
      request.status === 'pending'
  )
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

    {selectedProfile && (
  <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
    <div className="min-h-screen pb-20">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl px-4 py-4 border-b border-white/10">
        <button
          onClick={() => setSelectedProfile(null)}
          className="text-white text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Profile Top */}
      <div className="px-5 pt-6">

        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-lime-400 overflow-hidden flex items-center justify-center text-4xl font-bold text-black">
  {selectedProfile.avatar_url ? (
    <img
      src={selectedProfile.avatar_url}
      alt={selectedProfile.username}
      className="w-full h-full object-cover"
    />
  ) : (
    (selectedProfile.username || 'U').charAt(0).toUpperCase()
  )}
</div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              @{selectedProfile.username || 'User'}
            </h2>

            <p className="text-white/60 text-sm mt-1">
              VRRA Community Member
            </p>

            {selectedProfile.id !== user.id && (
  isFriend(selectedProfile.id) ? (
    <button
      onClick={() => removeFriend(selectedProfile.id)}
      className="mt-4 px-5 py-2 rounded-full bg-red-500 text-white text-sm font-medium"
    >
      Remove Friend
    </button>
  ) : isPending(selectedProfile.id) ? (
  <button
    disabled
    className="mt-4 px-5 py-2 rounded-full bg-yellow-500 text-black text-sm font-medium opacity-70"
  >
    Pending
  </button>
) : (
  <button
    onClick={() => {
  sendFriendRequest(selectedProfile.id)
}}
      className="mt-4 px-5 py-2 rounded-full bg-lime-500 text-black text-sm font-medium"
    >
      Add Friend
    </button>
  )
)}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">
              {posts.filter((post) => post.user_id === selectedProfile.id).length}
            </p>
            <p className="text-white/60 text-sm">Posts</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">
              {savedPostIds.length}
            </p>
            <p className="text-white/60 text-sm">Saved</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">
              {friends.length}
            </p>
            <p className="text-white/60 text-sm">Friends</p>
          </div>
        </div>

        {/* Posts */}
        <div className="mt-8">
          <p className="text-lg font-bold mb-4">
            Posts
          </p>

          {isFriend(selectedProfile.id) ? (
  <div className="grid grid-cols-2 gap-3">
    {posts
      .filter((post) => post.user_id === selectedProfile.id)
      .map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative rounded-2xl overflow-hidden bg-white/5"
                >
                  {post.video_url ? (
                    <video
                      src={post.video_url}
                      className="w-full h-[220px] object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : post.image_url ? (
                    <img
                      src={post.image_url}
                      className="w-full h-[220px] object-cover"
                    />
                  ) : null}
                </div>
              ))}
  </div>
) : (
  <div className="rounded-2xl bg-white/5 p-6 text-center text-white/60">
    Add friend to view posts
  </div>
)}
        </div>

      </div>
    </div>
  </div>
)}

{selectedPost && (
  <div className="fixed inset-0 bg-black z-50 overflow-y-auto pb-24">
    <div className="p-4">
      <button
        onClick={() => setSelectedPost(null)}
        className="text-white/70 text-sm mb-4"
      >
        ← Back
      </button>

      <div
        id={`post-${selectedPost.id}`}
        className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3"
      >
        <div className="flex items-center gap-3">
  <img
    src={selectedPost.profile?.avatar_url || '/default-avatar.png'}
    alt="avatar"
    className="w-10 h-10 rounded-full object-cover"
  />

  <div>
    <p className="font-semibold text-white">
      @{selectedPost.profile?.username || 'User'}
    </p>

    <p className="text-xs text-white/50">
      {formatTimeAgo(selectedPost.created_at)}
    </p>
  </div>
</div>

{selectedPost.caption && (
  <p className="text-white text-sm">
    {selectedPost.caption}
  </p>
)}

{selectedPost.video_url ? (
  <video
    src={selectedPost.video_url}
    controls
    className="w-full rounded-2xl"
  />
) : (
  <img
    src={selectedPost.image_url}
    alt="post"
    className="w-full rounded-2xl"
  />
)}

<div className="flex items-center gap-4 text-sm">
  <button onClick={() => toggleLike(selectedPost)}>
  ❤️ {selectedPost.likes_count || 0}
</button>

<div className="flex gap-2 mt-2 text-sm">
  {['👍', '😂', '😍', '😡', '❤️'].map((emoji) => {
    const count = postReactions.filter(
      (r) =>
        String(r.post_id) === String(selectedPost.id) &&
        r.emoji === emoji
    ).length

    return (
      <button
        key={emoji}
        onClick={() =>
          togglePostReaction(String(selectedPost.id), emoji)
        }
        className="bg-white/5 px-2 py-1 rounded-full text-xs"
      >
        {emoji} {count > 0 ? count : ''}
      </button>
    )
  })}
</div>

  <button onClick={() => toggleSave(selectedPost)}>
    Save
  </button>

  <button onClick={() => sharePost(selectedPost)}>
    Share
  </button>
</div>

<p className="text-xs text-white/50 mt-3">
  💬 {
    comments.filter(
      (comment) => comment.post_id === selectedPost.id
    ).length
  } comments
</p>

<div className="space-y-2 mt-3">
  {comments
    .filter(
      (comment: any) =>
        comment.post_id === selectedPost.id && !comment.parent_id
    )
    .map((comment: any) => (
      <div
        key={comment.id}
        className="flex items-start gap-3"
      >
        <img
          src={comment.profile?.avatar_url || '/placeholder.svg'}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />

        <div className="flex-1">
          <p className="text-sm text-white font-medium">
            @{comment.profile?.username || 'User'}
          </p>

          <p className="text-sm text-white/80">
            {comment.content || comment.comment || comment.text || comment.message}
          </p>

          <button
          onClick={() => {
          setReplyingTo(comment.id)
          setCommentingPostId(selectedPost.id)
          }}
          className="text-xs text-primary mt-1"
          >
          Reply
          </button>

          <div className="ml-10 mt-2 space-y-2 border-l border-white/10 pl-4">
          {comments
          .filter(
          (reply: any) =>
          String(reply.parent_id) === String(comment.id)
          )
          .map((reply: any) => (
          <div
          key={reply.id}
          className="flex items-start gap-2"
          >
          <img
          src={reply.profile?.avatar_url || '/placeholder.svg'}
          alt=""
          className="w-6 h-6 rounded-full object-cover shrink-0"
          />

          <div className="flex-1">
          <p className="text-xs text-white/70">
            Replying to @{comment.profile?.username || 'User'}
            </p>

          <p className="text-sm text-white">
            <span className="font-semibold">
              @{reply.profile?.username || 'User'}
            </span>{' '}
            {reply.content || reply.comment || reply.text || reply.message}
            </p>
            </div>
            </div>
            ))}
      </div>

          <div className="flex items-center gap-2 mt-4 w-full">
          <input
          value={commentTexts[selectedPost.id] || ''}
          onChange={(e) =>
          setCommentTexts({
          ...commentTexts,
          [selectedPost.id]: e.target.value,
          })
          }
          placeholder={
           replyingTo
           ? `Replying to @${
           comments.find((c: any) => c.id === replyingTo)?.profile?.username || 'User'
           }...`
           : 'Write a comment...'
           }
           className="flex-1 min-w-0 px-3 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none"
           />

           <button
           onClick={() =>
  addComment(
    selectedPost.id,
    replyingTo || null
  )
}
           className="px-2 py-3 rounded-xl bg-white/10 text-sm shrink-0"
           >
           Send
           </button>
           </div>
           </div>
           </div>
           ))}
           </div>

       </div>
    </div>
  </div>
)}

    <div className="px-3 pt-0 pb-24 space-y-1">
      <div className="flex items-center justify-between">
  <h1 className="text-xl font-bold mb-2">
    Community
  </h1>

  <button
    onClick={() => {
  setShowNotifications(!showNotifications)

  
}}
    className="relative inline-flex items-center justify-center"
  >
    🔔

    {notifications.filter((n) => !n.is_read).length > 0 && (
      <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
        {notifications.filter((n) => !n.is_read).length}
      </span>
    )}
  </button>
</div>

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
        <div className="flex items-center gap-3">
  {profile.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt=""
      className="w-12 h-12 rounded-full object-cover"
    />
  ) : (
    <div className="w-12 h-12 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold">
      {(profile.username || 'U').charAt(0).toUpperCase()}
    </div>
  )}

  <div>
    <button
      onClick={() => setSelectedProfile(profile)}
      className="font-medium text-left"
    >
      @{profile.username || 'User'}
    </button>

    <p className="text-xs text-white/40">
      {profile.email}
    </p>
  </div>
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

</div>

{showNotifications ? (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
    <h2 className="font-semibold">Notifications</h2>


  
    {notifications.length === 0 ? (
      <p className="text-sm text-white/60">
        No notifications yet
      </p>
    ) : (
      notifications.map((notification) => (
  <div
  key={notification.id}
  onClick={async () => {
    await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notification.id)

fetchNotifications()

const targetPost = posts.find(
  (post) => String(post.id) === String(notification.post_id)
)

console.log('TARGET POST:', targetPost)
console.log('NOTIFICATION POST ID:', notification.post_id)

if (targetPost) {
  setSelectedPost({
  ...targetPost,
  likes_count: targetPost.likes_count || 0,
  highlightCommentId: notification.comment_id || null,
  fromNotification: true
})
await fetchPostReactions

  setShowNotifications(false)

  return
}

    if (notification.type === 'friend_request') {
  setShowNotifications(false)

  setTimeout(() => {
    document
      .getElementById('friend-requests-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 100)

  return
}

if (notification.type === 'friend_accept') {
  if (notification.actor) {
    setSelectedProfile(notification.actor)
    setShowNotifications(false)
  }

  return
}


  }}
  className="bg-white/5 rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98]"
>
    <img
      src={notification.actor?.avatar_url || '/default-avatar.png'}
      alt={notification.actor?.username || 'User'}
      className="w-10 h-10 rounded-full object-cover"
    />

    <div className="text-sm">
      <span className="font-semibold">
        {notification.actor?.username || 'Someone'}
      </span>{' '}
      {notification.type === 'like' && 'liked your post'}
      {notification.type === 'comment' && 'commented on your post'}
      {notification.type === 'share' && 'shared your post'}
      {notification.type === 'friend_request' && 'sent you a friend request'}
      {notification.type === 'friend_accept' && 'accepted your friend request'}
    </div>
  </div>
))
    )}
  </div>
) : null}

{friendRequests.length > 0 && (
    <div
  id="friend-requests-section"
  className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3"
>
  <h2 className="font-semibold">Friend Requests</h2>

  {friendRequests.map((request) => (
    <div
      key={request.id}
      className="bg-black/20 rounded-2xl p-4 flex items-center justify-between gap-3 overflow-hidden"
    >
      <div className="flex items-center gap-3">
  <img
    src={request.profile?.avatar_url || '/default-avatar.png'}
    alt={request.profile?.username || 'User'}
    className="w-16 h-16 rounded-full object-cover border-2 border-lime-400"
  />

  <div>
    <p className="font-medium">
      @{request.profile?.username || 'Unknown user'}
    </p>
  </div>
</div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() =>
            respondFriendRequest(
              request.id,
              request.sender_id,
              'accepted'
            )
          }
          className="px-3 py-2 rounded-x1 bg-lime-400 text-black text-sm font-semibold"
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
          className="px-3 py-2 rounded-x1 bg-red-500 text-white text-sm font-semibold"
        >
          Reject
        </button>
      </div>
    </div>
  ))}
</div>
  )}

<div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3">
  <h2 className="font-semibold">Friends</h2>

  {friends.length === 0 && (
    <p className="text-sm text-white/40">
      No friends yet.
    </p>
  )}

<div className="flex gap-4 overflow-x-auto pb-2">
  {friends.map((friend) => {
    const name = friend.username || 'User'

    return (
      <button
        key={friend.id}
        type="button"
        onClick={() => setSelectedProfile(friend)}
        className="shrink-0 flex flex-col items-center gap-1 min-w-[64px]"
      >
        {friend.avatar_url ? (
  <img
    src={friend.avatar_url}
    alt=""
    className="w-12 h-12 rounded-full object-cover"
  />
) : (
  <div className="w-12 h-12 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold">
    {friend.avatar_url ? (
  <img
    src={friend.avatar_url}
    alt={friend.username}
    className="w-12 h-12 rounded-full object-cover"
  />
) : (
  friend.username?.charAt(0)?.toUpperCase()
)}
  </div>
)}

<p className="text-xs text-white/80 text-center truncate w-16">
  {name}
</p>
      </button>
    )
  })}
</div>
</div>

<div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3">
      <textarea
  value={caption}
  onChange={(e) => setCaption(e.target.value)}
  placeholder="Share your workout, meal, progress, or fitness moment..."
  className="w-full h-16 p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none focus:border-lime-400"
/>

    <label className="flex items-center justify-center w-full h-16 rounded-2xl border border-dashed border-white/20 bg-white/5 cursor-pointer hover:bg-white/10 transition">
  Upload Photo or Video
  <input
    type="file"
    accept="image/,video/"
    onChange={handleUpload}
    className="hidden"
  />
</label>
</div>


      {uploading && (
  <p className="text-sm text-white/70">
    Posting...
  </p>
)}
      
      <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
  <button
    onClick={() => {
      setShowSavedOnly(false)
      setFeedSort('latest')
    }}
    className={`px-4 py-2 rounded-xl text-sm font-semibold ${
      !showSavedOnly && feedSort === 'latest'
        ? 'bg-lime-400 text-black'
        : 'bg-white/10 text-white'
    }`}
  >
    Latest
  </button>

  <button
    onClick={() => {
      setShowSavedOnly(false)
      setFeedSort('trending')
    }}
    className={`px-4 py-2 rounded-xl text-sm font-semibold ${
      !showSavedOnly && feedSort === 'trending'
        ? 'bg-lime-400 text-black'
        : 'bg-white/10 text-white'
    }`}
  >
    Trending
  </button>

  <button
    onClick={() => {
      setShowSavedOnly(true)
    }}
    className={`px-4 py-2 rounded-xl text-sm font-semibold ${
      showSavedOnly
        ? 'bg-lime-400 text-black'
        : 'bg-white/10 text-white'
    }`}
  >
    Saved
  </button>
</div>
          <div className="space-y-4">
  {[...(showSavedOnly
  ? posts.filter((post) => savedPostIds.includes(post.id))
  : posts)]
    .sort((a, b) => {
      if (feedSort === 'trending') {
        return (b.likes_count || 0) - (a.likes_count || 0)
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      )
    })
    .map((post) => (
      <div
  id={`post-${post.id}`}
  key={post.id}
  className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3 shadow-lg"
>
           

           <div className="flex items-center gap-3">
  {post.profile?.avatar_url ? (
    <img
      src={post.profile.avatar_url}
      alt=""
      className="w-10 h-10 rounded-full object-cover"
    />
  ) : (
    <div className="w-10 h-10 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold">
      {post.profile?.username?.charAt(0)?.toUpperCase()}
    </div>
  )}

  <p
    className="font-semibold cursor-pointer"
    onClick={async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_premium')
        .eq('id', post.user_id)
        .single()

      if (data) {
        setSelectedProfile(data)
      }
    }}
  >
    @{post.profile?.username || 'User'}

    <span className="ml-2 text-xs text-white/40">
      {formatTimeAgo(post.created_at)}
    </span>
  </p>
</div>

{post.caption && (
  <p className="mt-2">
    {post.caption}
  </p>
)}

{post.video_url ? (
  <video
    src={post.video_url}
    controls
    playsInline
    onDoubleClick={() => doubleTapLike(post)}
    className="w-full h-[280px] object-cover rounded-2xl"
  />
) : (
  <img
    src={post.image_url}
    onClick={() => setSelectedPost(post)}
    onDoubleClick={() => doubleTapLike(post)}
    alt=""
    className="w-full h-[280px] object-cover rounded-2xl"
  />
)}

<button
  onClick={() => toggleLike(post)}
  className="flex items-center gap-2 text-sm font-medium bg-white/5 px-3 py-2 rounded-xl"
>
  {post.liked_by_me ? '❤️' : '🤍'} {post.likes_count || 0}
</button>

<div className="flex gap-2 mt-2 text-sm">
  {['👍','😂','😍','😡','❤️'].map((emoji) => {
    const count = postReactions.filter(
      (r) => String(r.post_id) === String(post.id) && r.emoji === emoji
    ).length

    return (
      <button
        key={emoji}
        onClick={() => togglePostReaction(String(post.id), emoji)}
        className="bg-white/5 px-2 py-1 rounded-full text-xs"
      >
        {emoji} {count > 0 ? count : ''}
      </button>
    )
  })}
</div>

<button
  onClick={() => toggleSave(post)}
  className="text-sm font-medium bg-white/5 px-3 py-2 rounded-xl mt-2"
>
  {savedPostIds.includes(post.id) ? 'Saved' : 'Save'}
</button>

<button
  onClick={() => sharePost(post)}
  className="text-sm font-medium bg-white/5 px-3 py-2 rounded-xl mt-2"
>
  🔗 Share
</button>

<p className="text-xs text-white/50 mt-1">
  💬 {comments.filter((comment) => comment.post_id === post.id).length} comments
</p>

<div className="space-y-2 mt-3">
  {comments
  .filter((comment: any) => comment.post_id === post.id && !comment.parent_id)
  .map((comment: any) => (
    <div
      key={comment.id}
      className="block space-y-2"
    >
<div
  ref={
    String(comment.id) === String(selectedPost?.highlightCommentId)
      ? highlightedCommentRef
      : null
  }
  className={
    "flex items-start gap-3 " +
    (
      String(comment.id) === String(selectedPost?.highlightCommentId)
        ? "bg-lime-400/20 border border-lime-400/40 rounded-2xl p-2"
        : ""
    )
  }
>
  <img
    src={comment.profile?.avatar_url || '/placeholder.svg'}
    alt=""
    className="w-8 h-8 rounded-full object-cover"
  />

  <div className="flex-1">
      <p className="text-sm text-white/70">
  <span className="font-semibold text-white">
    @{comment.profile?.username || 'User'}
  </span>{' '}
  {comment.comment}

<div className="flex gap-2 mt-2 text-sm">
  {['👍', '😂', '😍', '😡', '❤️'].map((emoji) => {
    const count = commentReactions.filter(
      (r) => r.comment_id === comment.id && r.emoji === emoji
    ).length

    return (
      <button
        key={emoji}
        onClick={() => toggleCommentReaction(comment.id, emoji)}
        className="bg-white/5 px-2 py-1 rounded-full text-xs"
      >
        {emoji} {count > 0 ? count : ''}
      </button>
    )
  })}
</div>

  <span className="ml-2 text-xs text-white/40">
    {formatTimeAgo(comment.created_at)}
  </span>
</p>
</div>
</div>
<div className="ml-11 mt-2 space-y-2 border-l-2 border-white/20 pl-4">
  {comments
    .filter(
      (reply: any) =>
        String(reply.parent_id) === String(comment.id)
    )
    .slice(0, expandedReplies[comment.id] ? 999 : 3)
    .map((reply: any) => (
        <div
  key={reply.id}
  className="flex items-start gap-2"
>
  <img
  src={reply.profile?.avatar_url || '/placeholder.svg'}
  alt=""
  className="w-7 h-7 rounded-full object-cover shrink-0"
/>

  <div className="bg-white/5 rounded-xl px-3 py-2 inline-block max-w-[85%]">
        <div className="text-xs text-white/40 mb-1">
          Replying to @{comment.profile?.username || 'User'}
        </div>

        <span className="font-semibold text-white">
          @{reply.profile?.username || 'User'}
        </span>{' '}
        {reply.comment}

<div className="flex gap-2 mt-2 text-sm">
  {['👍', '😂', '😍', '😡', '❤️'].map((emoji) => {
    const count = commentReactions.filter(
      (r) => String(r.comment_id) === String(reply.id) && r.emoji === emoji
    ).length

    return (
      <button
        key={emoji}
       onClick={() => toggleCommentReaction(String(reply.id), emoji)}
        className="bg-white/5 px-2 py-1 rounded-full text-xs"
      >
        {emoji} {count > 0 ? count : ''}
      </button>
    )
  })}
</div>

        <div className="flex gap-3 mt-2">
  <div className="flex gap-3 mt-2">
  {reply.user_id === user.id && (
    <button
      onClick={() => deleteComment(reply.id)}
      className="text-xs text-red-400"
    >
      Delete
    </button>
  )}

  <button
    onClick={() => {
      setReplyingTo(reply.id)
      setCommentingPostId(post.id)
    }}
    className="text-primary text-xs"
  >
    Reply
  </button>
</div>
</div>

      </div>
      </div>
    ))}
</div>

{comments.filter((reply: any) => String(reply.parent_id) === String(comment.id)).length > 3 && (
  <button
    onClick={() =>
      setExpandedReplies({
        ...expandedReplies,
        [comment.id]: !expandedReplies[comment.id],
      })
    }
    className="ml-11 mt-1 text-xs text-white/50"
  >
    {expandedReplies[comment.id]
      ? 'Hide replies'
      : `View ${
          comments.filter((reply: any) => String(reply.parent_id) === String(comment.id)).length - 3
        } more replies`}
  </button>
)}

      <div className="flex items-center gap-3">
  <button
    onClick={() => {
      setReplyingTo(comment.id)
      setCommentingPostId(post.id)
    }}
    className="text-xs text-primary"
  >
    Reply
  </button>

  {(comment.user_id === user.id || post.user_id === user.id) && (
    <button
      onClick={() => deleteComment(comment.id)}
      className="text-xs text-red-400"
    >
      Delete
    </button>
  )}
</div>
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
      placeholder={
        replyingTo
        ? `Replying to @${comments.find((c: any) => c.id === replyingTo)?.profile?.username || 'User'}...`
        : "Write a comment..."
}
      className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none focus:border-lime-400"
    />

    <button
      onClick={() => addComment(post.id, replyingTo)}
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
      </>
  )
}