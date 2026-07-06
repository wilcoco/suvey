const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { QUESTIONS, PART_INFO, CHOICES } = require('./questions');

const PORT = process.env.PORT || 3000;
const COMPANY = process.env.COMPANY_NAME || 'CAMS';
const ADMIN_KEY = process.env.ADMIN_KEY || '';
// Railway에서는 볼륨을 마운트하고 DATA_DIR을 그 경로로 지정한다.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'responses.jsonl');

fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();
app.disable('x-powered-by');
// 익명성 보장: 접속 로그를 남기지 않으며(로거 미사용), IP·UA 등 식별 정보를 저장하지 않는다.
app.set('trust proxy', false);
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function renderedQuestions() {
  return QUESTIONS.map((q) => ({ ...q, text: q.text.replaceAll('{COMPANY}', COMPANY) }));
}

app.get('/api/questions', (req, res) => {
  res.json({ company: COMPANY, questions: renderedQuestions(), partInfo: PART_INFO, choices: CHOICES });
});

function validAnswers(body) {
  if (!body || typeof body !== 'object' || typeof body.answers !== 'object' || body.answers === null) return null;
  const a = body.answers;
  const out = {};
  for (const q of QUESTIONS) {
    const v = a[q.id];
    if (q.type === 'text') {
      if (v === undefined || v === null || v === '') { out[q.id] = ''; continue; }
      if (typeof v !== 'string' || v.length > 3000) return null;
      out[q.id] = v.trim();
    } else {
      const max = CHOICES[q.type].length - 1;
      if (!Number.isInteger(v) || v < 0 || v > max) return null;
      out[q.id] = v;
    }
  }
  return out;
}

app.post('/api/submit', (req, res) => {
  const answers = validAnswers(req.body);
  if (!answers) return res.status(400).json({ error: '응답 형식이 올바르지 않습니다.' });
  const record = {
    id: crypto.randomUUID(),
    // 익명성 보호: 제출 시각은 날짜 단위까지만 저장한다 (시각으로 응답자 추정 방지).
    date: new Date().toISOString().slice(0, 10),
    answers,
  };
  fs.appendFileSync(DATA_FILE, JSON.stringify(record) + '\n');
  res.json({ ok: true });
});

// ---- 관리자 (대표이사 열람용) ----

function checkAdmin(req, res) {
  if (!ADMIN_KEY) {
    res.status(503).json({ error: 'ADMIN_KEY 환경변수가 설정되지 않았습니다.' });
    return false;
  }
  const given = String(req.headers['x-admin-key'] || '');
  const h1 = crypto.createHash('sha256').update(given).digest();
  const h2 = crypto.createHash('sha256').update(ADMIN_KEY).digest();
  if (!crypto.timingSafeEqual(h1, h2)) {
    res.status(401).json({ error: '인증 실패' });
    return false;
  }
  return true;
}

function loadResponses() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return fs
    .readFileSync(DATA_FILE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);
}

app.get('/api/admin/results', (req, res) => {
  if (!checkAdmin(req, res)) return;
  const rows = loadResponses();
  const qs = renderedQuestions();
  const stats = qs.map((q) => {
    if (q.type === 'text') {
      const texts = rows.map((r) => r.answers[q.id]).filter((t) => t && t.length > 0);
      return { id: q.id, part: q.part, type: q.type, text: q.text, texts };
    }
    const counts = new Array(CHOICES[q.type].length).fill(0);
    for (const r of rows) {
      const v = r.answers[q.id];
      if (Number.isInteger(v) && v >= 0 && v < counts.length) counts[v]++;
    }
    return { id: q.id, part: q.part, type: q.type, text: q.text, choices: CHOICES[q.type], counts };
  });
  res.json({ company: COMPANY, total: rows.length, stats });
});

app.get('/api/admin/csv', (req, res) => {
  if (!checkAdmin(req, res)) return;
  const rows = loadResponses();
  const qs = renderedQuestions();
  const esc = (s) => '"' + String(s).replaceAll('"', '""') + '"';
  const header = ['date', ...qs.map((q) => q.id)].map(esc).join(',');
  const lines = rows.map((r) =>
    [r.date, ...qs.map((q) => {
      const v = r.answers[q.id];
      if (q.type === 'text') return v || '';
      return Number.isInteger(v) ? CHOICES[q.type][v] : '';
    })].map(esc).join(','),
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="responses.csv"');
  res.send('﻿' + [header, ...lines].join('\n'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`survey server on :${PORT}`);
});
