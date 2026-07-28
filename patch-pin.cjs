const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

const pinFunc = `
  const handlePin = async (id: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      const comment = comments.find(c => c.id === id);
      if (!comment) return;
      
      const isPinned = comment.text.startsWith('[PINNED]:');
      const finalString = isPinned ? comment.text.substring(9) : '[PINNED]:' + comment.text;

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
`;

code = code.replace("  const startEditing =", pinFunc + "\n  const startEditing =");

fs.writeFileSync('src/components/CommentSection.tsx', code);
