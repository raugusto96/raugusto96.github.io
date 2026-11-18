import 'dotenv/config'
import { createServer } from 'node:http'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.ts'
import { validateScore } from './validation.ts'
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const port = Number(process.env.PORT ?? 4001)
const host = process.env.RENDER === 'true' ? '0.0.0.0' : '127.0.0.1'
const allowedOrigins = new Set([
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:5174', 'http://127.0.0.1:5174',
  'https://rodrigo-girodo.dev',
])
const attempts = new Map<string, { count: number; until: number }>()
const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  const send = (status: number, body: unknown) => { res.writeHead(status); res.end(JSON.stringify(body)) }
  try {
    if (req.url === '/api/health' && req.method === 'GET') { await prisma.$queryRawUnsafe('SELECT 1'); send(200, { ok: true }); return }
    if (req.url !== '/api/ranking') { send(404, { error: 'Not found' }); return }
    const origin = req.headers.origin
    res.setHeader('Vary', 'Origin')
    if (origin) {
      if (!allowedOrigins.has(origin)) { send(403, { error: 'Origin not allowed' }); return }
      res.setHeader('Access-Control-Allow-Origin', origin)
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      res.writeHead(204).end()
      return
    }
    if (req.method === 'GET') {
      send(200, await prisma.snakeScore.findMany({ take: 10, orderBy: [{ score: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }], select: { id: true, nickname: true, score: true, createdAt: true } })); return
    }
    if (req.method !== 'POST') { send(405, { error: 'Method not allowed' }); return }
    if (!req.headers['content-type']?.startsWith('application/json')) { send(415, { error: 'JSON required' }); return }
    const now = Date.now()
    for (const [ip, entry] of attempts) if (entry.until < now) attempts.delete(ip)
    const ip = req.socket.remoteAddress ?? 'local'
    const entry = attempts.get(ip) ?? { count: 0, until: now + 60000 }
    attempts.set(ip, entry)
    if (++entry.count > 20) { send(429, { error: 'Too many requests' }); return }
    let body = ''
    for await (const chunk of req) { body += chunk.toString(); if (Buffer.byteLength(body) > 4096) { send(413, { error: 'Body too large' }); return } }
    let parsed: unknown
    try { parsed = JSON.parse(body) } catch { send(400, { error: 'Invalid JSON' }); return }
    const data = validateScore(parsed)
    if (!data) { send(400, { error: 'Invalid nickname, score or runId' }); return }
    const saved = await prisma.snakeScore.upsert({ where: { runId: data.runId }, create: data, update: {} })
    if (saved.nickname !== data.nickname || saved.score !== data.score) { send(409, { error: 'Run already saved' }); return }
    send(200, { id: saved.id, nickname: saved.nickname, score: saved.score })
  } catch (error) { console.error('Ranking request failed:', error instanceof Error ? error.name : 'Unknown error'); if (!res.headersSent) send(503, { error: 'Ranking unavailable' }) }
})
server.requestTimeout = 10000
server.listen(port, host, () => console.log('Ranking API listening on port', port))
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { server.close(() => { void prisma.$disconnect().finally(() => process.exit()) }) })
