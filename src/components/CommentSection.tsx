import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Upload, Edit2, Trash2, X, Download, Image as ImageIcon, Pin, PinOff, Reply, MessageSquare, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { getSupabaseClient, getSupabaseCredentials } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { AdminBadge, isAdminName, DeveloperBadge, isDeveloperName, GuestBadge } from './AdminBadge';
import { SectionHeader } from './SectionHeader';


interface Comment {
  id: string;
  username: string;
  text: string;
  photoBase64: string | null;
  timestamp: number;
}


import { parseCommentText, serializeCommentText } from '../lib/commentHelpers';
import { compressImageFile } from '../lib/imageCompressor';


export const CommentSection: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const { currentUser, login, register, logout } = useAuth();
  
  const loggedInUser = currentUser?.username || '';
  const isAdmin = currentUser ? (currentUser.role === 'admin' || isAdminName(currentUser.username)) : false;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  const [text, setText] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToUser, setReplyingToUser] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleReplies = (id: string) => setExpandedReplies(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    fetchComments();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('public:comments_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as any;
            if (newRow && newRow.id) {
              setComments(prev => {
                if (prev.some(c => String(c.id) === String(newRow.id))) return prev;
                return [...prev, {
                  id: String(newRow.id),
                  username: String(newRow.username || 'Anonymous'),
                  text: String(newRow.text || ''),
                  photoBase64: newRow.photo_base64 || newRow.photoBase64 || null,
                  timestamp: typeof newRow.timestamp === 'number' ? newRow.timestamp : Number(newRow.timestamp) || Date.now()
                }];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as any;
            if (updatedRow && updatedRow.id) {
              setComments(prev => prev.map(c => String(c.id) === String(updatedRow.id) ? {
                id: String(updatedRow.id),
                username: String(updatedRow.username || c.username),
                text: String(updatedRow.text || c.text),
                photoBase64: updatedRow.photo_base64 || updatedRow.photoBase64 || c.photoBase64,
                timestamp: typeof updatedRow.timestamp === 'number' ? updatedRow.timestamp : Number(updatedRow.timestamp) || c.timestamp
              } : c));
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            if (oldRow && oldRow.id) {
              setComments(prev => prev.filter(c => String(c.id) !== String(oldRow.id)));
            }
          }
        }
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      fetchComments();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const fetchComments = async () => {
    try {
      const supabase = getSupabaseClient();
      let rawData: any[] | null = null;

      // 1. Try Supabase SDK
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('comments')
            .select('*')
            .order('timestamp', { ascending: true });

          if (!error && Array.isArray(data) && data.length > 0) {
            rawData = data;
          } else if (error) {
            console.warn('Supabase SDK fetch warning:', error);
          }
        } catch (e) {
          console.warn('Supabase SDK fetch failed:', e);
        }
      }

      // 2. Direct Supabase PostgREST REST API fallback
      if (!rawData || rawData.length === 0) {
        try {
          const { url, key } = getSupabaseCredentials();
          if (url && key) {
            const restRes = await fetch(`${url}/rest/v1/comments?select=*&order=timestamp.asc`, {
              method: 'GET',
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`
              }
            });
            if (restRes.ok) {
              const resData = await restRes.json();
              if (Array.isArray(resData) && resData.length > 0) {
                rawData = resData;
              }
            }
          }
        } catch (e) {
          console.warn('Direct REST fetch failed:', e);
        }
      }

      // 3. Fallback to local /api/comments
      if (!rawData || rawData.length === 0) {
        try {
          const localRes = await fetch('/api/comments');
          if (localRes.ok) {
            const localData = await localRes.json();
            if (Array.isArray(localData) && localData.length > 0) {
              rawData = localData;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      if (rawData && Array.isArray(rawData)) {
        setComments(rawData.map((c: any) => ({
          id: String(c.id || Date.now()),
          username: String(c.username || 'Anonymous'),
          text: String(c.text || ''),
          photoBase64: c.photo_base64 || c.photoBase64 || null,
          timestamp: typeof c.timestamp === 'number' ? c.timestamp : Number(c.timestamp) || Date.now()
        })));
      }
    } catch (error) {
      console.error('Error in fetchComments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file terlalu besar (maksimal 5MB sebelum kompresi)');
        return;
      }
      try {
        const compressed = await compressImageFile(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.75,
          mimeType: 'image/webp'
        });
        setPhotoBase64(compressed);
      } catch (err) {
        console.error('Image compression error:', err);
        // Fallback to direct reading if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!username.trim() || !password.trim()) {
      setAuthError('Username and password are required');
      return;
    }

    try {
      if (isLoginMode) {
        const res = await login(username.trim(), password);
        if (!res.success) {
          setAuthError(res.message || 'Login failed');
          return;
        }
        setUsername('');
        setPassword('');
      } else {
        const res = await register(username.trim(), password);
        if (!res.success) {
          setAuthError(res.message || 'Registration failed');
          return;
        }
        setUsername('');
        setPassword('');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser.trim() || !text.trim()) return;

    if (!isAdmin && loggedInUser.trim().toLowerCase().includes('admin')) {
      alert('You cannot use "Admin" in your username.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const rootId = replyingToId ? resolveRootId(replyingToId) : null;
      const serializedText = serializeCommentText(text.trim(), false, replyingToId, replyingToUser);

      const newComment = {
        id: Date.now().toString(),
        username: loggedInUser.trim(),
        text: serializedText,
        photo_base64: photoBase64,
        timestamp: Date.now()
      };

      let success = false;
      const { url, key } = getSupabaseCredentials();

      // 1. Try Supabase SDK
      if (supabase) {
        try {
          const { error } = await supabase.from('comments').insert([newComment]);
          if (!error) {
            success = true;
          } else {
            console.warn('Supabase SDK insert error:', error);
          }
        } catch (e) {
          console.warn('Supabase SDK insert failed:', e);
        }
      }

      // 2. Try Direct REST
      if (!success && url && key) {
        try {
          const restRes = await fetch(`${url}/rest/v1/comments`, {
            method: 'POST',
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal'
            },
            body: JSON.stringify(newComment)
          });
          if (restRes.ok) success = true;
        } catch (e) {
          console.warn('Direct REST insert failed:', e);
        }
      }

      // 3. Try Local API
      if (!success) {
        try {
          const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: newComment.username, text: newComment.text, photoBase64 })
          });
          if (res.ok) success = true;
        } catch (e) {
          // ignore
        }
      }

      if (success) {
        setComments(prev => [...prev, {
          id: newComment.id,
          username: newComment.username,
          text: newComment.text,
          photoBase64: newComment.photo_base64,
          timestamp: newComment.timestamp
        }]);
        setText('');
        setPhotoBase64(null);
        if (rootId) {
          setExpandedReplies(prev => ({ ...prev, [rootId]: true }));
        }
        setReplyingToId(null);
        setReplyingToUser(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        alert('Failed to post comment. Please try again.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleEditSubmit = async (id: string) => {
    if (!editText.trim()) return;
    
    try {
      const supabase = getSupabaseClient();
      const { url, key } = getSupabaseCredentials();
      
      const comment = comments.find(c => c.id === id);
      if (!comment) return;
      const { isPinned, parentId, replyToUsername } = parseCommentText(comment.text);
      const finalString = serializeCommentText(editText.trim(), isPinned, parentId, replyToUsername);

      let success = false;
      if (supabase) {
        try {
          const { error } = await supabase.from('comments').update({ text: finalString }).eq('id', id);
          if (!error) success = true;
        } catch (e) {
          console.warn('Supabase SDK update failed:', e);
        }
      }

      if (!success && url && key) {
        try {
          const restRes = await fetch(`${url}/rest/v1/comments?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: finalString })
          });
          if (restRes.ok) success = true;
        } catch (e) {
          console.warn('Direct REST update failed:', e);
        }
      }

      if (!success) {
        try {
          const res = await fetch(`/api/comments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: finalString })
          });
          if (res.ok) success = true;
        } catch (e) {
          // ignore
        }
      }

      if (success) {
        setComments(comments.map(c => c.id === id ? { ...c, text: finalString } : c));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const supabase = getSupabaseClient();
      const { url, key } = getSupabaseCredentials();
      let success = false;

      if (supabase) {
        try {
          const { error } = await supabase.from('comments').delete().eq('id', id);
          if (!error) success = true;
        } catch (e) {
          console.warn('Supabase SDK delete failed:', e);
        }
      }

      if (!success && url && key) {
        try {
          const restRes = await fetch(`${url}/rest/v1/comments?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`
            }
          });
          if (restRes.ok) success = true;
        } catch (e) {
          console.warn('Direct REST delete failed:', e);
        }
      }

      if (!success) {
        try {
          const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
          if (res.ok) success = true;
        } catch (e) {
          // ignore
        }
      }

      if (success) {
        setComments(comments.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };


  const handlePin = async (id: string) => {
    try {
      const supabase = getSupabaseClient();
      const { url, key } = getSupabaseCredentials();
      
      const comment = comments.find(c => c.id === id);
      if (!comment) return;
      
      const { isPinned, parentId, replyToUsername, text } = parseCommentText(comment.text);
      const finalString = serializeCommentText(text, !isPinned, parentId, replyToUsername);

      let success = false;
      if (supabase) {
        try {
          const { error } = await supabase.from('comments').update({ text: finalString }).eq('id', id);
          if (!error) success = true;
        } catch (e) {
          console.warn('Supabase SDK pin update failed:', e);
        }
      }

      if (!success && url && key) {
        try {
          const restRes = await fetch(`${url}/rest/v1/comments?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: finalString })
          });
          if (restRes.ok) success = true;
        } catch (e) {
          console.warn('Direct REST pin update failed:', e);
        }
      }

      if (!success) {
        try {
          const res = await fetch(`/api/comments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: finalString })
          });
          if (res.ok) success = true;
        } catch (e) {
          // ignore
        }
      }

      if (success) {
        setComments(comments.map(c => c.id === id ? { ...c, text: finalString } : c));
      }
    } catch (error) {
      console.error('Error pinning comment:', error);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(parseCommentText(comment.text).text);
  };


  const commentsMap = new Map(comments.map(c => [String(c.id), c]));

  const commentsWithMeta = comments.map(c => {
    const { isPinned, parentId, replyToUsername, text } = parseCommentText(c.text);
    // If parentId is specified but doesn't exist in the database, keep it visible as top level comment
    const validParentId = parentId && commentsMap.has(String(parentId)) ? String(parentId) : null;
    return { ...c, id: String(c.id), isPinned, parentId: validParentId, rawParentId: parentId, replyToUsername, parsedText: text };
  });

  const resolveRootId = (commentId: string): string => {
    let currentId = String(commentId);
    let maxDepth = 15;
    const visited = new Set<string>();
    while (maxDepth > 0 && currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const parent = commentsWithMeta.find(c => String(c.id) === currentId);
      if (!parent || !parent.parentId) break;
      currentId = String(parent.parentId);
      maxDepth--;
    }
    return currentId;
  };

  const topLevelComments = commentsWithMeta
    .filter(c => !c.parentId)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0);
    });

  const visibleTopLevelComments = topLevelComments.length > 0
    ? topLevelComments
    : commentsWithMeta.slice().sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));

  const repliesByRootId = commentsWithMeta
    .filter(c => Boolean(c.parentId))
    .reduce((acc, reply) => {
      const rootId = resolveRootId(reply.id);
      if (rootId && rootId !== reply.id) {
        if (!acc[rootId]) acc[rootId] = [];
        acc[rootId].push(reply);
      }
      return acc;
    }, {} as Record<string, typeof commentsWithMeta>);

  // Sort thread replies ascending by timestamp
  Object.keys(repliesByRootId).forEach(rootId => {
    repliesByRootId[rootId].sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));
  });

  return (
    <section id="comments" className="py-20 relative bg-slate-50/50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <SectionHeader
          icon={<Send className="w-3.5 h-3.5" />}
          badgeText="Guestbook"
          title={
            <>
              Community <span className="text-[#E195AB]">Guestbook</span>
            </>
          }
          subtitle="Share your thoughts, suggestions, or just say hello to Encore and the community!"
        />

        {/* Comment Form with Double Bezel Architecture */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="p-1.5 sm:p-2 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/40 mb-10 shadow-xs"
        >
          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-[calc(1.5rem-0.375rem)] border border-slate-200/60 dark:border-slate-800">
            {!loggedInUser ? (
              <form onSubmit={handleAuth} className="space-y-4 max-w-md mx-auto p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shadow-xs">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{isLoginMode ? 'Log in to continue commenting' : 'Sign up to start commenting'}</p>
                </div>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center border border-rose-500/20">
                    {authError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider font-mono">Username</label>
                    <input
                      type="text"
                      placeholder="Your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:border-[#E195AB] outline-none transition-colors"
                      maxLength={30}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider font-mono">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 pr-11 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:border-[#E195AB] outline-none transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#E195AB] hover:bg-[#d68097] text-white font-bold text-xs uppercase tracking-wide transition-all shadow-xs active:scale-98 cursor-pointer"
                >
                  {isLoginMode ? 'Log In' : 'Sign Up'}
                </button>
                
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(!isLoginMode);
                      setAuthError('');
                    }}
                    className="text-xs font-semibold text-[#E195AB] hover:text-[#d68097] transition-colors cursor-pointer"
                  >
                    {isLoginMode ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" id="comment-form-section">
                {replyingToId && (
                  <div className="flex items-center justify-between bg-rose-500/10 text-rose-700 dark:text-rose-300 px-3.5 py-2 rounded-xl text-xs font-medium border border-rose-500/20">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Replying to {replyingToUser ? <span className="font-bold">@{replyingToUser}</span> : 'comment'}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setReplyingToId(null); setReplyingToUser(null); }}
                      className="p-1 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Commenting as:</span>
                    <span className="text-xs font-mono font-bold text-[#E195AB] bg-[#E195AB]/10 px-2.5 py-0.5 rounded-full border border-[#E195AB]/20">
                      {loggedInUser}
                    </span>
                  </div>
                  {!isAdmin && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      Log Out
                    </button>
                  )}
                </div>
                <div>
                  <textarea
                    placeholder="Write your comment..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:border-[#E195AB] outline-none transition-colors resize-y min-h-[110px]"
                    maxLength={500}
                  />
                  <div className="text-right mt-1">
                    <span className={`text-[11px] font-mono ${text.length >= 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {text.length}/500
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer text-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Attach Photo</span>
                    </button>
                    {photoBase64 && (
                      <div className="relative inline-block">
                        <img src={photoBase64} alt="Preview" draggable={false} onContextMenu={(e) => e.preventDefault()} className="h-12 w-12 rounded-lg border border-slate-200 dark:border-slate-700 object-cover shadow-xs select-none" />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoBase64(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 flex items-center justify-center hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !loggedInUser.trim() || !text.trim()}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E195AB] hover:bg-[#d68097] text-white font-bold text-xs uppercase tracking-wide active:scale-98 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Posting...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Post Comment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>

        {/* Comments List */}
        <div className="space-y-4 sm:space-y-5">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 font-sans text-xs font-medium animate-pulse">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-sans text-xs font-medium">
              No comments yet. Be the first!
            </div>
          ) : (
            <AnimatePresence>
              {visibleTopLevelComments.map((comment, index) => {
                const threadReplies = repliesByRootId[String(comment.id)] || [];
                
                return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex flex-col gap-2.5"
                >
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex gap-3 sm:gap-4 group">
                    {isAdminName(comment.username) ? (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center shrink-0 overflow-hidden border border-amber-500/30">
                        <img src="/assets/images/favicon.png" alt="Admin" draggable={false} onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-cover select-none" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-[#E195AB] font-black text-xs sm:text-sm flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h4 className={`text-xs sm:text-sm ${isDeveloperName(comment.username) ? "font-bold text-emerald-600 dark:text-emerald-400" : isAdminName(comment.username) ? "font-bold text-amber-600 dark:text-amber-400" : "font-bold text-slate-800 dark:text-slate-100"}`}>
                            {comment.username}
                          </h4>
                          {isDeveloperName(comment.username) ? (
                            <DeveloperBadge />
                          ) : isAdminName(comment.username) ? (
                            <AdminBadge />
                          ) : (
                            <GuestBadge />
                          )}
                        </div>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-mono shrink-0">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {editingId === comment.id ? (
                        <div className="mt-2 space-y-2.5">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-[#E195AB] outline-none text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSubmit(comment.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#E195AB] text-white text-xs font-bold hover:bg-[#d68097] transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                        {comment.isPinned && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1 font-mono">
                            <Pin className="w-3 h-3" /> Pinned by Admin
                          </div>
                        )}
                        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {comment.parsedText}
                        </p>
                        </>
                      )}
                      
                      {comment.photoBase64 && (
                        <div className="mt-2.5">
                          <img 
                             src={comment.photoBase64} 
                             alt="Attached" 
                             draggable={false}
                             onContextMenu={(e) => e.preventDefault()}
                             onClick={() => setPreviewImage(comment.photoBase64)}
                             className="max-h-40 sm:max-h-48 max-w-full rounded-xl border border-slate-200 dark:border-slate-700 object-cover shadow-xs cursor-pointer hover:opacity-90 hover:shadow-md transition-all select-none"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3">
                        {loggedInUser && (
                          <button 
                            onClick={() => {
                              setReplyingToId(comment.id);
                              setReplyingToUser(comment.username);
                              document.getElementById('comment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              setText('');
                            }}
                            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#E195AB] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                        )}
                        {(isAdmin || (loggedInUser && loggedInUser === comment.username)) && (
                          <>
                            {isAdmin && (
                              <button 
                                onClick={() => handlePin(comment.id)}
                                className="text-xs font-semibold text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {comment.isPinned ? <><PinOff className="w-3 h-3" /> Unpin</> : <><Pin className="w-3 h-3" /> Pin</>}
                              </button>
                            )}
                            <button 
                              onClick={() => startEditing(comment)}
                              className="text-xs font-semibold text-slate-400 hover:text-[#E195AB] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(comment.id)}
                              className="text-xs font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* View Replies Toggle */}
                  {threadReplies.length > 0 && (
                    <div className="ml-4 sm:ml-8 pl-3 sm:pl-4">
                      <button 
                        onClick={() => toggleReplies(comment.id)}
                        className="text-[#E195AB] hover:text-[#d68097] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer bg-[#E195AB]/10 hover:bg-[#E195AB]/15 px-2.5 py-1 rounded-lg border border-[#E195AB]/20"
                      >
                        {expandedReplies[comment.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{expandedReplies[comment.id] ? 'Sembunyikan Balasan' : `Lihat ${threadReplies.length} Balasan`}</span>
                      </button>
                    </div>
                  )}

                  {/* Replies List */}
                  {threadReplies.length > 0 && expandedReplies[comment.id] && (
                    <div className="ml-3 sm:ml-8 pl-2.5 sm:pl-4 border-l-2 border-slate-200/80 dark:border-slate-800 space-y-2.5 mt-1">
                      {threadReplies.map(reply => (
                        <div key={reply.id} className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex gap-2.5 sm:gap-3">
                          {isAdminName(reply.username) ? (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center shrink-0 overflow-hidden border border-amber-500/30">
                              <img src="/assets/images/favicon.png" alt="Admin" draggable={false} onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-cover select-none" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 text-[#E195AB] font-black text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                              {reply.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <h4 className={`text-xs ${isDeveloperName(reply.username) ? "font-bold text-emerald-600 dark:text-emerald-400" : isAdminName(reply.username) ? "font-bold text-amber-600 dark:text-amber-400" : "font-bold text-slate-800 dark:text-slate-100"}`}>
                                  {reply.username}
                                </h4>
                                {isDeveloperName(reply.username) ? (
                                  <DeveloperBadge />
                                ) : isAdminName(reply.username) ? (
                                  <AdminBadge />
                                ) : (
                                  <GuestBadge size="sm" />
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {new Date(reply.timestamp).toLocaleDateString()}
                              </span>
                            </div>

                            {editingId === reply.id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-[#E195AB] outline-none text-xs text-slate-700 dark:text-slate-300"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditSubmit(reply.id)}
                                    className="px-3 py-1.5 rounded-lg bg-[#E195AB] text-white text-xs font-bold hover:bg-[#d68097] transition-colors cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                                {reply.replyToUsername && <span className="text-[#E195AB] font-bold mr-1">@{reply.replyToUsername}</span>}
                                {reply.parsedText}
                              </p>
                            )}

                            {reply.photoBase64 && (
                              <div className="mt-2">
                                <img 
                                   src={reply.photoBase64} 
                                   alt="Attached" 
                                   draggable={false}
                                   onContextMenu={(e) => e.preventDefault()}
                                   onClick={() => setPreviewImage(reply.photoBase64)}
                                   className="max-h-32 rounded-lg border border-slate-200 dark:border-slate-700 object-cover shadow-xs cursor-pointer hover:opacity-90 hover:shadow-md transition-all select-none"
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-3.5 mt-2.5">
                              {loggedInUser && (
                                <button 
                                  onClick={() => {
                                    setReplyingToId(reply.id);
                                    setReplyingToUser(reply.username);
                                    document.getElementById('comment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setText('');
                                  }}
                                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#E195AB] flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Reply className="w-3 h-3" /> Reply
                                </button>
                              )}
                              {(isAdmin || (loggedInUser && loggedInUser === reply.username)) && (
                                <>
                                  <button 
                                    onClick={() => startEditing(reply)}
                                    className="text-xs font-semibold text-slate-400 hover:text-[#E195AB] flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3" /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(reply.id)}
                                    className="text-xs font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );})}
            </AnimatePresence>
          )}
        </div>
      </div>
      
      {/* Image Preview Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-8 cursor-zoom-out"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                className="relative max-w-5xl max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 flex flex-col sm:flex-row items-center gap-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!previewImage) return;
                      const link = document.createElement('a');
                      link.href = previewImage;
                      link.download = `encore_image_${Date.now()}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    title="Download Image"
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-full flex items-center justify-center shadow-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setPreviewImage(null)}
                    title="Close Preview"
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-full flex items-center justify-center shadow-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <img
                  src={previewImage}
                  alt="Preview"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 select-none"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
};

