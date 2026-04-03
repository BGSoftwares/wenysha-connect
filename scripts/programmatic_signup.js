#!/usr/bin/env node
// Programmatically submit signup using the frontend's fetch logic
const DEFAULT_BASE = 'http://127.0.0.1:8001/api';
const base = (process.env.VITE_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
const payload = {
  full_name: process.env.FULL_NAME || 'Programmatic Frontend Tester',
  email: process.env.EMAIL || `prog_frontend_${Date.now()}@example.com`,
  password: process.env.PASSWORD || 'Testpass123',
  confirm_password: process.env.PASSWORD || 'Testpass123',
  role: process.env.ROLE || 'student',
};

async function run() {
  const url = `${base}/auth/signup/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  console.log('HTTP_STATUS:' + res.status);
  console.log(JSON.stringify(data, null, 2));
  if (!res.ok) process.exit(2);
}

run().catch(err => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
