import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Upload, Edit2, Trash2, X, Image as ImageIcon, Pin, PinOff, Reply, MessageSquare, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { AdminBadge, isAdminName, DeveloperBadge, isDeveloperName, GuestBadge } from './AdminBadge';


interface Comment {
  id: string;
  username: string;
  text: string;
  photoBase64: string | null;
  timestamp: number;
}


const parseCommentText = (rawText: string) => {
  let isPinned = false;
  let parentId: string | null = null;
  let replyToUsername: string | null = null;
  let text = rawText;

  if (text.startsWith('[PINNED]:')) {
    isPinned = true;
    text = text.substring(9);
  }

  const replyMatch = text.match(/^\[REPLY_TO:([^\]:]+)(?::([^\]]+))?\](.*)/s);
  if (replyMatch) {
    parentId = replyMatch[1];
    replyToUsername = replyMatch[2] || null;
    text = replyMatch[3];
  }

  return { isPinned, parentId, replyToUsername, text };
};

const serializeCommentText = (text: string, isPinned: boolean, parentId: string | null, replyToUsername: string | null = null) => {
  let res = text;
  if (parentId) {
    if (replyToUsername) {
      res = `[REPLY_TO:${parentId}:${replyToUsername}]${res}`;
    } else {
      res = `[REPLY_TO:${parentId}]${res}`;
    }
  }
  if (isPinned) {
    res = `[PINNED]:${res}`;
  }
  return res;
};

export const CommentSection: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const { currentUser, login, register, logout, openLoginModal } = useAuth();
  
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
  }, []);

  const fetchComments = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setComments([]);
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('timestamp', { ascending: true });
        
      if (error) {
        console.error('Error fetching comments:', error);
      } else if (data) {
        setComments(data.map(c => ({
          id: c.id,
          username: c.username,
          text: c.text,
          photoBase64: c.photo_base64,
          timestamp: c.timestamp
        })));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        alert('File size too large (max 1MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!username.trim() || !password.trim()) {
      setAuthError('Username and password are required');
      return;
    }

    if (isLoginMode) {
      const res = login(username.trim(), password);
      if (!res.success) {
        setAuthError(res.message || 'Login failed');
        return;
      }
      setUsername('');
      setPassword('');
    } else {
      const res = register(username.trim(), password);
      if (!res.success) {
        setAuthError(res.message || 'Registration failed');
        return;
      }
      setUsername('');
      setPassword('');
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
      if (!supabase) {
        alert('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
        setIsSubmitting(false);
        return;
      }
      
      const rootId = replyingToId ? resolveRootId(replyingToId) : null;
      const serializedText = serializeCommentText(text.trim(), false, replyingToId, replyingToUser);

      const newComment = {
        id: Date.now().toString(),
        username: loggedInUser.trim(),
        text: serializedText,
        photo_base64: photoBase64,
        timestamp: Date.now()
      };
      
      const { error } = await supabase
        .from('comments')
        .insert([newComment]);
        
      if (!error) {
        setComments([...comments, {
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
        console.error('Response failed:', error);
        alert(`Failed to post comment. ${error.message}`);
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
      if (!supabase) return;
      
      const comment = comments.find(c => c.id === id);
      if (!comment) return;
      const { isPinned, parentId, replyToUsername } = parseCommentText(comment.text);
      const finalString = serializeCommentText(editText.trim(), isPinned, parentId, replyToUsername);

      const { error } = await supabase
        .from('comments')
        .update({ text: finalString })
        .eq('id', id);
        
      if (!error) {
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
      if (!supabase) return;
      
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);
        
      if (!error) {
        setComments(comments.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };


  const handlePin = async (id: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      const comment = comments.find(c => c.id === id);
      if (!comment) return;
      
      const { isPinned, parentId, replyToUsername, text } = parseCommentText(comment.text);
      const finalString = serializeCommentText(text, !isPinned, parentId, replyToUsername);

      const { error } = await supabase
        .from('comments')
        .update({ text: finalString })
        .eq('id', id);
        
      if (!error) {
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


  const commentsWithMeta = comments.map(c => {
    const { isPinned, parentId, replyToUsername, text } = parseCommentText(c.text);
    return { ...c, isPinned, parentId, replyToUsername, parsedText: text };
  });

  const resolveRootId = (commentId: string): string => {
    let currentId = commentId;
    let maxDepth = 10;
    while (maxDepth > 0) {
      const parent = commentsWithMeta.find(c => c.id === currentId);
      if (!parent || !parent.parentId) break;
      currentId = parent.parentId;
      maxDepth--;
    }
    return currentId;
  };

  const topLevelComments = commentsWithMeta
    .filter(c => !c.parentId)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const repliesByRootId = commentsWithMeta
    .filter(c => c.parentId)
    .reduce((acc, reply) => {
      const rootId = resolveRootId(reply.id);
      if (rootId !== reply.id) {
        if (!acc[rootId]) acc[rootId] = [];
        acc[rootId].push(reply);
      }
      return acc;
    }, {} as Record<string, typeof commentsWithMeta>);

  return (
    <section id="comments" className="py-20 relative bg-white dark:bg-slate-900 border-t-2 border-slate-100 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-4">
            <Send className="w-4 h-4" />
            <span>Community</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-4">
            Leave a Comment
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
            Share your thoughts, suggestions, or just say hello!
          </p>
        </motion.div>

        {/* Comment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 mb-12 shadow-sm"
        >
          
          {!loggedInUser ? (
            
            <form onSubmit={handleAuth} className="space-y-4 max-w-md mx-auto bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{isLoginMode ? 'Log in to continue commenting' : 'Sign up to start commenting'}</p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-sm font-bold text-center border border-rose-100 dark:border-rose-900/60">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none transition-colors"
                    maxLength={30}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 pr-12 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                {isLoginMode ? 'Log In' : 'Sign Up'}
              </button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setAuthError('');
                  }}
                  className="text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  {isLoginMode ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                </button>
              </div>
            </form>

          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" id="comment-form-section">
              {replyingToId && (
                <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-100 dark:border-indigo-900/60">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Replying to {replyingToUser ? <span className="font-bold">@{replyingToUser}</span> : 'comment'}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setReplyingToId(null); setReplyingToUser(null); }}
                    className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Commenting as:</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-transparent dark:border-indigo-900/50">
                    {loggedInUser}
                  </span>
                </div>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none transition-colors resize-y min-h-[120px]"
                  maxLength={500}
                />
                <div className="text-right mt-1">
                  <span className={`text-xs font-medium ${text.length >= 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {text.length}/500
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                  />
                  <label
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Attach Photo</span>
                  </label>
                  {photoBase64 && (
                    <div className="mt-3 relative inline-block">
                      <img src={photoBase64} alt="Preview" className="h-16 rounded-lg border border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoBase64(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-500 flex items-center justify-center hover:bg-rose-50 transition-colors shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !loggedInUser.trim() || !text.trim()}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Posting...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Post Comment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </motion.div>

        {/* Comments List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 font-medium animate-pulse">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              No comments yet. Be the first!
            </div>
          ) : (
            <AnimatePresence>
              {topLevelComments.map((comment, index) => {
                const threadReplies = repliesByRootId[comment.id] || [];
                
                return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col gap-3"
                >
                  <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3 sm:gap-4 group">
                    {isAdminName(comment.username) ? (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/70 flex items-center justify-center shrink-0 overflow-hidden border-2 border-indigo-200 dark:border-indigo-800/60">
                        <img src="/assets/images/favicon.png" alt="Admin" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-black text-sm sm:text-base flex items-center justify-center shrink-0 border border-transparent dark:border-indigo-800/40">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h4 className={`text-xs sm:text-sm ${isDeveloperName(comment.username) ? "font-bold text-emerald-600" : isAdminName(comment.username) ? "font-bold text-red-600" : "font-bold text-slate-800 dark:text-slate-100"}`}>
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
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium shrink-0">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {editingId === comment.id ? (
                        <div className="mt-2 space-y-3">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 outline-none text-sm text-slate-700 dark:text-slate-300"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSubmit(comment.id)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                        {comment.isPinned && (
                          <div className="flex items-center gap-1 text-xs font-bold text-indigo-500 mb-1">
                            <Pin className="w-3 h-3" /> Pinned by Admin
                          </div>
                        )}
                        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm whitespace-pre-wrap break-words">
                          {comment.parsedText}
                        </p>
                        </>
                      )}
                      
                      {comment.photoBase64 && (
                        <div className="mt-3">
                          <img 
                             src={comment.photoBase64} 
                             alt="Attached" 
                             onClick={() => setPreviewImage(comment.photoBase64)}
                             className="max-h-40 sm:max-h-48 max-w-full rounded-xl border border-slate-200 dark:border-slate-700 object-cover shadow-sm cursor-pointer hover:opacity-90 hover:shadow-md transition-all duration-200"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4 transition-opacity">
                        {loggedInUser && (
                          <button 
                            onClick={() => {
                              setReplyingToId(comment.id);
                              setReplyingToUser(comment.username);
                              document.getElementById('comment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              setText('');
                            }}
                            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                        )}
                        {(isAdmin || (loggedInUser && loggedInUser === comment.username)) && (
                          <>
                            {isAdmin && (
                              <button 
                                onClick={() => handlePin(comment.id)}
                                className="text-xs font-bold text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {comment.isPinned ? <><PinOff className="w-3 h-3" /> Unpin</> : <><Pin className="w-3 h-3" /> Pin</>}
                              </button>
                            )}
                            <button 
                              onClick={() => startEditing(comment)}
                              className="text-xs font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(comment.id)}
                              className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
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
                    <div className="ml-4 sm:ml-8 pl-3 sm:pl-4 mt-1">
                      <button 
                        onClick={() => toggleReplies(comment.id)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        {expandedReplies[comment.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {expandedReplies[comment.id] ? 'Hide Replies' : `View ${threadReplies.length} ${threadReplies.length === 1 ? 'Reply' : 'Replies'}`}
                      </button>
                    </div>
                  )}

                  {/* Replies List */}
                  {threadReplies.length > 0 && expandedReplies[comment.id] && (
                    <div className="ml-3 sm:ml-8 pl-2.5 sm:pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-3 mt-2 sm:mt-3">
                      {threadReplies.map(reply => (
                        <div key={reply.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-2.5 sm:gap-3">
                          {isAdminName(reply.username) ? (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/70 flex items-center justify-center shrink-0 overflow-hidden border border-indigo-200 dark:border-indigo-800/60">
                              <img src="/assets/images/favicon.png" alt="Admin" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-black text-xs sm:text-sm flex items-center justify-center shrink-0 border border-transparent dark:border-indigo-800/40">
                              {reply.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <h4 className={`text-xs sm:text-sm ${isDeveloperName(reply.username) ? "font-bold text-emerald-600" : isAdminName(reply.username) ? "font-bold text-red-600" : "font-bold text-slate-800 dark:text-slate-100"}`}>
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
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                {new Date(reply.timestamp).toLocaleDateString()}
                              </span>
                            </div>

                            {editingId === reply.id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 outline-none text-sm text-slate-700 dark:text-slate-300"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditSubmit(reply.id)}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap">
                                {reply.replyToUsername && <span className="text-indigo-600 font-bold mr-1">@{reply.replyToUsername}</span>}
                                {reply.parsedText}
                              </p>
                            )}

                            {reply.photoBase64 && (
                              <div className="mt-2">
                                <img 
                                   src={reply.photoBase64} 
                                   alt="Attached" 
                                   onClick={() => setPreviewImage(reply.photoBase64)}
                                   className="max-h-32 rounded-lg border border-slate-200 dark:border-slate-700 object-cover shadow-sm cursor-pointer hover:opacity-90 hover:shadow-md transition-all duration-200"
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-4 mt-3 transition-opacity">
                              {loggedInUser && (
                                <button 
                                  onClick={() => {
                                    setReplyingToId(reply.id);
                                    setReplyingToUser(reply.username);
                                    document.getElementById('comment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setText('');
                                  }}
                                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                >
                                  <Reply className="w-3 h-3" /> Reply
                                </button>
                              )}
                              {(isAdmin || (loggedInUser && loggedInUser === reply.username)) && (
                                <>
                                  <button 
                                    onClick={() => startEditing(reply)}
                                    className="text-xs font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(reply.id)}
                                    className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
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
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 cursor-zoom-out"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                className="relative max-w-5xl max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
              >
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-full flex items-center justify-center shadow-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
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
