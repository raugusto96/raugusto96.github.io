import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const git = promisify(execFile)
export default defineConfig({
  plugins: [react(), {
    name: 'portfolio-local-git-status',
    configureServer(server) {
      server.middlewares.use('/__portfolio_git_status', async (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        try {
          const options = { cwd: server.config.root, windowsHide: true, timeout: 3000 }
          const [branch, status] = await Promise.all([
            git('git', ['branch', '--show-current'], options),
            git('git', ['status', '--porcelain', '--untracked-files=normal'], options),
          ])
          response.end(JSON.stringify({ branch: branch.stdout.trim() || 'HEAD', dirty: Boolean(status.stdout.trim()) }))
        } catch { response.statusCode = 503; response.end(JSON.stringify({ error: 'Git unavailable' })) }
      })
    },
  }],
  server: { proxy: { '/api': 'http://127.0.0.1:4001' } },
})
