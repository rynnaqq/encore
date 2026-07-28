const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

code = code.replace(
  `  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };`,
  `  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text.startsWith('[PINNED]:') ? comment.text.substring(9) : comment.text);
  };`
);

const editReplacement = `  const handleEditSubmit = async (id: string) => {
    if (!editText.trim()) return;
    
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      const comment = comments.find(c => c.id === id);
      const isPinned = comment?.text.startsWith('[PINNED]:');
      const finalString = isPinned ? '[PINNED]:' + editText.trim() : editText.trim();

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
  };`;

code = code.replace(/  const handleEditSubmit = async \(id: string\) => \{[\s\S]*?\};\n/, editReplacement + '\n');

fs.writeFileSync('src/components/CommentSection.tsx', code);
