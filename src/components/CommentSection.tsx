import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Upload, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabaseClient';

interface Comment {
  id: string;
  username: string;
  text: string;
  photoBase64: string | null;
  timestamp: number;
}

export const CommentSection: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
  const [username, setUsername] = useState(isAdmin ? 'Admin kawaii' : '');
  const [text, setText] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !text.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        alert('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
        setIsSubmitting(false);
        return;
      }
      
      const newComment = {
        id: Date.now().toString(),
        username: username.trim(),
        text: text.trim(),
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
      
      const { error } = await supabase
        .from('comments')
        .update({ text: editText.trim() })
        .eq('id', id);
        
      if (!error) {
        setComments(comments.map(c => c.id === id ? { ...c, text: editText.trim() } : c));
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

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your name"
                  readOnly={isAdmin}
                  className={`w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 outline-none transition-all font-medium text-slate-800 ${isAdmin ? 'opacity-75 cursor-not-allowed' : 'focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'}`}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Message</label>
              <textarea
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  ref={fileInputRef}
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer text-sm"
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
                disabled={isSubmitting || !username.trim() || !text.trim()}
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
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 group"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center shrink-0">
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-800">{comment.username}</h4>
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
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">{comment.text}</p>
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
                    
                    <div className="flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  );
};
