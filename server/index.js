
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in server/.env');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'MyTrack API',
    message: 'Backend is running.'
  });
});

// Test the Supabase database connection.
app.get('/api/db-test', async (_req, res) => {
  const { error } = await supabase
    .from('tasks')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Supabase query failed:', error.message);
    return res.status(500).json({
      ok: false,
      message: 'Database query failed. Check server logs.'
    });
  }

  res.json({
    ok: true,
    message: 'MyTrack backend connected to Supabase.'
  });
});

app.get('/api', (_req, res) => {
  res.json({
    name: 'MyTrack API',
    version: '1.0.0',
    status: 'ready'
  });
});

app.listen(PORT, () => {
  console.log(`MyTrack API running at http://localhost:${PORT}`);
});
