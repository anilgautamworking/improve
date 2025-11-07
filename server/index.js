require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';

app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    
    const token = jwt.sign({ userId: result.rows[0].id, email }, JWT_SECRET);
    res.json({ user: result.rows[0], token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Questions routes
app.post('/api/questions/generate', authenticateToken, async (req, res) => {
  try {
    const { category, count = 2 } = req.body;
    
    // Get category ID
    const catResult = await pool.query('SELECT id FROM categories WHERE name = $1', [category]);
    if (catResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Get existing questions
    const questions = await pool.query(
      'SELECT * FROM questions WHERE category_id = $1 ORDER BY created_at DESC LIMIT $2',
      [catResult.rows[0].id, count * 3]
    );
    
    const shuffled = questions.rows.sort(() => Math.random() - 0.5).slice(0, count);
    res.json({ questions: shuffled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/answers', authenticateToken, async (req, res) => {
  try {
    const { question_id, selected_answer, is_correct } = req.body;
    
    await pool.query(
      'INSERT INTO user_answers (user_id, question_id, selected_answer, is_correct) VALUES ($1, $2, $3, $4)',
      [req.user.userId, question_id, selected_answer, is_correct]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/answers/correct', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT question_id FROM user_answers WHERE user_id = $1 AND is_correct = true',
      [req.user.userId]
    );
    
    res.json({ correctAnswers: result.rows.map(r => r.question_id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT is_correct FROM user_answers WHERE user_id = $1',
      [req.user.userId]
    );
    
    const totalAnswered = result.rows.length;
    const correctAnswers = result.rows.filter(r => r.is_correct).length;
    const wrongAnswers = totalAnswered - correctAnswers;
    
    res.json({ totalAnswered, correctAnswers, wrongAnswers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

