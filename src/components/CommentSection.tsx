import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Upload, Edit2, Trash2, X, Image as ImageIcon, Pin, PinOff, Reply, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabaseClient';

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
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
  const [username, setUsername] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(isAdmin ? 'AdminKawaaii' : (typeof window !== 'undefined' ? localStorage.getItem('username') || '' : ''));
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  const [text, setText] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

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
        // Fallback to empty array if no supabase
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
        // map db columns to state
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
    
    if (!isAdmin && username.trim().toLowerCase().includes('admin')) {
      setAuthError('You cannot use "Admin" in your username.');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      if (isLoginMode) {
        // Log in
        const { data, error } = await supabase
          .from('comment_users')
          .select('*')
          .eq('username', username.trim())
          .eq('password', password)
          .single();

        if (error || !data) {
          setAuthError('Invalid username or password. (Note: Ensure comment_users table exists with username and password columns)');
          return;
        }

        localStorage.setItem('username', username.trim());
        setLoggedInUser(username.trim());
        setUsername('');
        setPassword('');
      } else {
        // Sign up
        const { data: existingUser } = await supabase
          .from('comment_users')
          .select('username')
          .eq('username', username.trim())
          .single();
          
        if (existingUser) {
          setAuthError('Username already taken');
          return;
        }

        const { error } = await supabase
          .from('comment_users')
          .insert([{ username: username.trim(), password: password }]);

        if (error) {
          setAuthError('Signup failed: ' + error.message + ' (Note: Ensure comment_users table exists)');
          return;
        }

        localStorage.setItem('username', username.trim());
        setLoggedInUser(username.trim());
        setUsername('');
        setPassword('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    setLoggedInUser('');
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
    <section id="comments" className="py-20 relative bg-white border-t-2 border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm mb-4">
            <Send className="w-4 h-4" />
            <span>Community</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-4">
            Leave a Comment
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            Share your thoughts, suggestions, or just say hello!
          </p>
        </motion.div>

        {/* Comment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 mb-12 shadow-sm"
        >
          
          {!loggedInUser ? (
            
            <form onSubmit={handleAuth} className="space-y-4 max-w-md mx-auto bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h3>
                <p className="text-slate-500 text-sm">{isLoginMode ? 'Log in to continue commenting' : 'Sign up to start commenting'}</p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold text-center border border-rose-100">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 outline-none transition-colors"
                    maxLength={30}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 outline-none transition-colors"
                    required
                  />
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
                <div className="flex items-center justify-between bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Replying to {replyingToUser ? <span className="font-bold">@{replyingToUser}</span> : 'comment'}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setReplyingToId(null); setReplyingToUser(null); }}
                    className="p-1 hover:bg-indigo-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium">Commenting as:</span>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
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
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-indigo-500 outline-none transition-colors resize-y min-h-[120px]"
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Attach Photo</span>
                  </label>
                  {photoBase64 && (
                    <div className="mt-3 relative inline-block">
                      <img src={photoBase64} alt="Preview" className="h-16 rounded-lg border border-slate-200 object-cover shadow-sm" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoBase64(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-200 text-rose-500 flex items-center justify-center hover:bg-rose-50 transition-colors shadow-sm"
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
                if (threadReplies.length > 0) console.log('Comment', comment.id, 'has replies:', threadReplies);
                
                return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col gap-3"
                >
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 group">
                    {comment.username === 'AdminKawaaii' ? (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-indigo-200">
                        <img src="/assets/images/favicon.png" alt="Admin" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center shrink-0">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className={comment.username === 'AdminKawaaii' ? "font-bold text-red-600" : "font-bold text-slate-800"}>
                            {comment.username}
                          </h4>
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                            comment.username === 'AdminKawaaii' 
                              ? "bg-red-100 text-red-600" 
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {comment.username === 'AdminKawaaii' ? 'Admin' : 'Guest'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {editingId === comment.id ? (
                        <div className="mt-2 space-y-3">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none text-sm text-slate-700"
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
                              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
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
                        <p className="text-slate-600 text-sm whitespace-pre-wrap">
                          {comment.parsedText}
                        </p>
                        </>
                      )}
                      
                      {comment.photoBase64 && (
                        <div className="mt-3">
                          <img 
                             src={comment.photoBase64} 
                             alt="Attached" 
                             className="max-h-48 rounded-xl border border-slate-200 object-cover shadow-sm"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-4 transition-opacity">
                        {loggedInUser && (
                          <button 
                            onClick={() => {
                              setReplyingToId(comment.id);
                              setReplyingToUser(comment.username);
                              document.getElementById('comment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              setText('');
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                        )}
                        {(isAdmin || (loggedInUser && loggedInUser === comment.username)) && (
                          <>
                            {isAdmin && (
                              <button 
                                onClick={() => handlePin(comment.id)}
                                className="text-xs font-bold text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
                              >
                                {comment.isPinned ? <><PinOff className="w-3 h-3" /> Unpin</> : <><Pin className="w-3 h-3" /> Pin</>}
                              </button>
                            )}
                            <button 
                              onClick={() => startEditing(comment)}
                              className="text-xs font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(comment.id)}
                              className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
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
                    <div className="ml-8 pl-4 mt-1">
                      <button 
                        onClick={() => toggleReplies(comment.id)}
                        className="text-indigo-600 font-bold text-xs flex items-center gap-1 hover:text-indigo-700 transition-colors"
                      >
                        {expandedReplies[comment.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {expandedReplies[comment.id] ? 'Hide Replies' : `View ${threadReplies.length} ${threadReplies.length === 1 ? 'Reply' : 'Replies'}`}
                      </button>
                    </div>
                  )}

                  {/* Replies List */}
                  {threadReplies.length > 0 && expandedReplies[comment.id] && (
                    <div className="ml-8 pl-4 border-l-2 border-slate-100 space-y-3 mt-3">
                      {threadReplies.map(reply => (
                        <div key={reply.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                          {reply.username === 'AdminKawaaii' ? (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden border border-indigo-200">
                              <img src="/assets/images/favicon.png" alt="Admin" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-black text-sm flex items-center justify-center shrink-0">
                              {reply.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h4 className={reply.username === 'AdminKawaaii' ? "font-bold text-sm text-red-600" : "font-bold text-sm text-slate-800"}>
                                  {reply.username}
                                </h4>
                                <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full ${
                                  reply.username === 'AdminKawaaii' 
                                    ? "bg-red-100 text-red-600" 
                                    : "bg-slate-200 text-slate-500"
                                }`}>
                                  {reply.username === 'AdminKawaaii' ? 'Admin' : 'Guest'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(reply.timestamp).toLocaleDateString()}
                              </span>
                            </div>

                            {editingId === reply.id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-indigo-400 outline-none text-sm text-slate-700"
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
                                    className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-300 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-600 text-sm whitespace-pre-wrap">
                                {reply.replyToUsername && <span className="text-indigo-600 font-bold mr-1">@{reply.replyToUsername}</span>}
                                {reply.parsedText}
                              </p>
                            )}

                            {reply.photoBase64 && (
                              <div className="mt-2">
                                <img 
                                   src={reply.photoBase64} 
                                   alt="Attached" 
                                   className="max-h-32 rounded-lg border border-slate-200 object-cover shadow-sm"
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
                                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
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
    </section>
  );
};
