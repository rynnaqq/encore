const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

code = code.replace(
  "import { Send, Upload, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';",
  "import { Send, Upload, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';\nimport { getSupabaseClient } from '../lib/supabaseClient';"
);

const fetchReplacement = `
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
`;

code = code.replace(/  const fetchComments = async \(\) => \{[\s\S]*?\};\n/, fetchReplacement);

const submitReplacement = `
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
        alert(\`Failed to post comment. \${error.message}\`);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
`;

code = code.replace(/  const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?\};\n/, submitReplacement);

const editReplacement = `
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
`;

code = code.replace(/  const handleEditSubmit = async \(id: string\) => \{[\s\S]*?\};\n/, editReplacement);

const deleteReplacement = `
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
`;

code = code.replace(/  const handleDelete = async \(id: string\) => \{[\s\S]*?\};\n/, deleteReplacement);

fs.writeFileSync('src/components/CommentSection.tsx', code);
