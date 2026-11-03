'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Send,
  Plus,
  Compass,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function EngagePage() {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<'for-you' | 'field' | 'following' | 'showcase'>('for-you');
  const [posts, setPosts] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Post composer state
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Active comment view
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');

  const loadFeed = async () => {
    setIsLoading(true);
    const res = await apiRequest(`/engage/feed?type=${feedType}`, { method: 'GET' });
    if (res.success && res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
      setPosts(items);
    } else {
      setPosts([]);
    }
    setIsLoading(false);
  };

  const loadCommunities = async () => {
    const res = await apiRequest('/engage/communities', { method: 'GET' });
    if (res.success && res.data) {
      const comms = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
      setCommunities(comms);
    } else {
      setCommunities([]);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['for-you', 'field', 'following', 'showcase'].includes(tab)) {
        setFeedType(tab as any);
      }
    }
  }, []);

  useEffect(() => {
    loadFeed();
    loadCommunities();
  }, [feedType]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsPosting(true);
    const res = await apiRequest('/engage/posts', {
      method: 'POST',
      body: JSON.stringify({
        content,
        mediaUrls: mediaUrl ? [mediaUrl] : [],
      }),
    });
    setIsPosting(false);

    if (res.success) {
      setContent('');
      setMediaUrl('');
      loadFeed();
    }
  };

  const handleToggleLike = async (postId: string) => {
    const res = await apiRequest(`/engage/posts/${postId}/like`, { method: 'POST' });
    if (res.success) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const isLiked = res.data?.isLiked;
            return {
              ...p,
              isLiked,
              likeCount: isLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1),
            };
          }
          return p;
        }),
      );
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }
    setActiveCommentPostId(postId);
    const res = await apiRequest(`/engage/posts/${postId}/comments`, { method: 'GET' });
    if (res.success && res.data) {
      setCommentsMap((prev) => ({ ...prev, [postId]: res.data }));
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    const res = await apiRequest(`/engage/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: commentText.trim() }),
    });
    if (res.success) {
      setCommentText('');
      const commentsRes = await apiRequest(`/engage/posts/${postId}/comments`, { method: 'GET' });
      if (commentsRes.success && commentsRes.data) {
        setCommentsMap((prev) => ({ ...prev, [postId]: commentsRes.data }));
      }
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)),
      );
    }
  };

  const handleJoinCommunity = async (commId: string) => {
    const res = await apiRequest(`/engage/communities/${commId}/join`, { method: 'POST' });
    if (res.success) {
      loadCommunities();
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-engage font-bold uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>ENGAGE Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Peer Learning & Social Discovery
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect with dedicated builders in your field, discuss technical implementations, and build credibility.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left Column: Post Composer & Feeds */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Composer Card */}
          {user ? (
            <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-800 border border-surface-border flex items-center justify-center font-bold text-xs uppercase text-white shrink-0">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
                <div className="w-full">
                  <textarea
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share a project breakthrough, code architecture, or learning milestone..."
                    className="w-full rounded-xl border border-surface-border/60 bg-surface-elevated/40 p-3 text-sm text-white placeholder-slate-500 focus:border-engage focus:outline-none"
                  />
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="Optional image/demo URL"
                      className="w-full sm:w-80 rounded-lg border border-surface-border bg-surface-elevated/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      onClick={handleCreatePost}
                      disabled={isPosting || !content.trim()}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-engage px-5 py-2 text-xs font-bold text-slate-950 hover:bg-engage/90 transition-all disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isPosting ? 'Posting...' : 'Share Update (+75 XP)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-surface-border bg-surface p-6 text-center shadow-lg">
              <h3 className="text-sm font-bold text-white mb-1">Join the Technical Discourse</h3>
              <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
                Sign in to post technical updates, share portfolio milestones, and collaborate with peers in your field.
              </p>
              <Link
                href="/login?redirect=/engage"
                className="inline-flex items-center gap-1.5 rounded-lg bg-engage px-4 py-2 text-xs font-bold text-slate-950 hover:bg-engage/90 transition-all"
              >
                Sign In to Participate
              </Link>
            </div>
          )}

          {/* Feed Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-surface-border/60 pb-3 text-xs font-semibold overflow-x-auto">
            {[
              { key: 'for-you', label: 'For You (Field-Weighted)' },
              { key: 'following', label: 'Following Stream' },
              { key: 'field', label: 'All Field Updates' },
              { key: 'showcase', label: 'Project Showcase' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFeedType(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  feedType === tab.key
                    ? 'bg-engage/15 text-engage font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feed Items */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading feed updates...</div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-surface-border bg-surface p-5 hover:border-slate-700 transition-colors"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-800 border border-surface-border flex items-center justify-center font-bold text-xs uppercase text-white">
                        {post.author.displayName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{post.author.displayName}</h4>
                        <span className="text-[10px] text-slate-500">
                          @{post.author.username} • {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {post.field && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-surface-elevated px-2 py-0.5 rounded border border-surface-border">
                        {post.field.name}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-sm text-slate-200 leading-relaxed mb-3 whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Media */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-surface-border max-h-96">
                      <img
                        src={post.mediaUrls[0]}
                        alt="Post media"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-6 pt-3 border-t border-surface-border text-xs text-slate-400">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.isLiked ? 'text-red-400 font-bold' : 'hover:text-red-400'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-red-400' : ''}`} />
                      <span>{post.likeCount}</span>
                    </button>

                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 hover:text-engage transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.commentCount}</span>
                    </button>

                    <button className="flex items-center gap-1.5 hover:text-white transition-colors ml-auto">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Comments Drawer */}
                  {activeCommentPostId === post.id && (
                    <div className="mt-4 pt-4 border-t border-surface-border/60 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a constructive comment or feedback..."
                          className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="rounded-lg bg-engage px-3 py-1.5 text-xs font-bold text-slate-950"
                        >
                          Send
                        </button>
                      </div>

                      <div className="space-y-2 mt-2">
                        {commentsMap[post.id]?.map((c: any) => (
                          <div
                            key={c.id}
                            className="rounded-lg bg-surface-elevated/50 p-2.5 text-xs text-slate-300"
                          >
                            <div className="flex justify-between font-semibold text-[11px] text-slate-400 mb-1">
                              <span>{c.author.profile?.displayName || 'User'}</span>
                              <span className="text-[10px]">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p>{c.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-surface-border p-12 text-center text-slate-500 text-xs">
              No updates in this stream yet. Be the first to share an insight!
            </div>
          )}
        </div>

        {/* Right Column: Communities Hub */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Field Communities
              </h3>
              <span className="text-[10px] text-engage font-semibold">Active Hubs</span>
            </div>

            {communities.length > 0 ? (
              <div className="space-y-3">
                {communities.map((comm) => (
                  <div
                    key={comm.id}
                    className="rounded-xl border border-surface-border bg-surface-elevated p-3.5"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-white text-xs">{comm.name}</h4>
                      <button
                        onClick={() => handleJoinCommunity(comm.id)}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded border border-surface-border"
                      >
                        Join
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2">{comm.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{comm.field?.name || 'General'}</span>
                      <span>{comm._count?.members || 1} members</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No communities created yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

