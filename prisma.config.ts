import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'
export default defineConfig({ schema: 'server/prisma/schema.prisma', migrations: { path: 'server/prisma/migrations' }, datasource: { url: process.env.DIRECT_DATABASE_URL ?? env('DATABASE_URL') } })
