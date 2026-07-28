import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { Trash2 } from 'lucide-react';

interface Comment {
  id: string;
  username: string;
  text: string;
  photoBase64: string | null;
  timestamp: number;
}

export const AdminPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAdmin') === 'true');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'seramaula432') {
      localStorage.setItem('isAdmin', 'true');
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('timestamp', { ascending: false });
        
      if (data && !error) {
        setComments(data.map((c: any) => ({
          id: c.id,
          username: c.username,
          text: c.text,
          photoBase64: c.photo_base64,
          timestamp: c.timestamp
        })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchComments();
    }
  }, [isAuthenticated]);

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
      } else {
        alert('Failed to delete comment: ' + error.message);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Admin Login</h2>
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none"
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-slate-800">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300"
          >
            Logout
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Manage Comments</h2>
          
          {isLoading ? (
            <p className="text-slate-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-slate-500">No comments found.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-start gap-4">
                  <div>
                    <div className="font-bold text-slate-800">{comment.username} <span className="text-sm font-normal text-slate-400">{new Date(comment.timestamp).toLocaleString()}</span></div>
                    <p className="text-slate-600 mt-2">{comment.text}</p>
                    {comment.photoBase64 && (
                      <img src={comment.photoBase64} alt="Attached" className="max-h-24 mt-2 rounded-lg border border-slate-200" />
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Comment"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
