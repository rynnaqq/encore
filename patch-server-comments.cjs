const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const commentApiCode = `
  // --- Comments API ---
  app.use(express.json({ limit: '10mb' }));

  const COMMENTS_FILE = path.join(process.cwd(), 'comments.json');
  
  const readComments = () => {
    if (fs.existsSync(COMMENTS_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const writeComments = (comments) => {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
  };

  app.get('/api/comments', (req, res) => {
    res.json(readComments());
  });

  app.post('/api/comments', (req, res) => {
    const { username, text, photoBase64 } = req.body;
    if (!username || !text) {
      return res.status(400).json({ error: 'Username and text are required' });
    }
    
    const newComment = {
      id: Date.now().toString(),
      username,
      text,
      photoBase64: photoBase64 || null,
      timestamp: Date.now()
    };
    
    const comments = readComments();
    comments.push(newComment);
    writeComments(comments);
    
    res.status(201).json(newComment);
  });

  app.put('/api/comments/:id', (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    
    const comments = readComments();
    const commentIndex = comments.findIndex(c => c.id === id);
    
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    comments[commentIndex].text = text;
    writeComments(comments);
    
    res.json(comments[commentIndex]);
  });

  app.delete('/api/comments/:id', (req, res) => {
    const { id } = req.params;
    
    let comments = readComments();
    comments = comments.filter(c => c.id !== id);
    writeComments(comments);
    
    res.json({ success: true });
  });

  // Vite middleware in dev mode
`;

code = code.replace(/(\/\/ Vite middleware in dev mode)/, 'const fs = require("fs");\n' + commentApiCode);

fs.writeFileSync('server.ts', code);
