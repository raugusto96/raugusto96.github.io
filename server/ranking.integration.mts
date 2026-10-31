import 'dotenv/config'

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.ts'
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const runIds = [randomUUID(), randomUUID()]
const post = (data: unknown) => fetch('http://127.0.0.1:5173/api/ranking', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
try {
  const data = {runId:runIds[0],nickname:'Ranking test',score:20}
  const first = await post(data); assert.equal(first.status,200)
  const id = (await first.json()).id
  const replay = await post(data); assert.equal((await replay.json()).id,id)
  assert.equal(await db.snakeScore.count({where:{runId:runIds[0]}}),1)
  assert.equal((await post({...data,score:30})).status,409)
  for(const invalid of [{...data,score:-10},{...data,score:15},{...data,nickname:'a'},{...data,nickname:'bad\u0000nick'},{...data,runId:'bad'}]) assert.equal((await post(invalid)).status,400)
  assert.equal((await post({runId:runIds[1],nickname:'Ranking test 2',score:30})).status,200)
  const ranking = await (await fetch('http://127.0.0.1:5173/api/ranking')).json()
  assert.ok(ranking.length <= 10)
  assert.ok(ranking.findIndex((entry: {id:string})=>entry.id===id)>0)
  console.log('PASS: create, persist, retry without duplicates, conflict, validation and ordering through Vite proxy')
} finally { await db.snakeScore.deleteMany({where:{runId:{in:runIds}}}); await db.$disconnect() }


