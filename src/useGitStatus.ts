import { useEffect, useState } from 'react'
export function useGitStatus() {
  const [status, setStatus] = useState({ branch: 'main', dirty: false })
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const controller = new AbortController()
    let active = true
    let timer: ReturnType<typeof setTimeout>
    async function refresh() {
      try {
        const response = await fetch('/__portfolio_git_status', { signal: controller.signal, cache: 'no-store' })
        if (response.ok) {
          const value = await response.json()
          if (active && typeof value.branch === 'string' && typeof value.dirty === 'boolean') setStatus(previous => previous.branch === value.branch && previous.dirty === value.dirty ? previous : value)
        }
      } catch { /* Keep the last known status if the development server restarts. */ }
      if (active) timer = setTimeout(refresh, 2000)
    }
    void refresh()
    return () => { active = false; controller.abort(); clearTimeout(timer) }
  }, [])
  return status
}
