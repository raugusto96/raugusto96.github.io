import { useEffect, useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'

export default function TiltCard({ children, label }: { children: ReactNode; label: string }) {
  const frame = useRef<number | null>(null)
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current) }, [])

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const element = event.currentTarget
    const bounds = element.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      element.style.setProperty('--tilt-x', `${(0.5 - y) * 6}deg`)
      element.style.setProperty('--tilt-y', `${(x - 0.5) * 8}deg`)
      element.style.setProperty('--glow-x', `${x * 100}%`)
      element.style.setProperty('--glow-y', `${y * 100}%`)
      frame.current = null
    })
  }
  function reset(event: PointerEvent<HTMLDivElement>) {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    for (const name of ['--tilt-x', '--tilt-y', '--glow-x', '--glow-y']) event.currentTarget.style.removeProperty(name)
  }
  return <div className="code-art tilt-card" aria-label={label} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>{children}</div>
}
