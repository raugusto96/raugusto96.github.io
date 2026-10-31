import { useEffect, useRef, useState } from 'react'
import { createGame, isReverse, stepGame } from './snake-engine'
import type { Direction } from './snake-engine'
import { t } from './i18n'
import SnakeRanking from './SnakeRanking'

export type SnakeGameProps = { onClose: () => void; onLog: (message: string) => void }
export default function SnakeGame({ onClose, onLog }: SnakeGameProps) {
  const [game, setGame] = useState(createGame)
  const [runId, setRunId] = useState(() => crypto.randomUUID())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLElement>(null)
  const turns = useRef<Direction[]>([])
  const stateRef = useRef(game)
  stateRef.current = game
  const logRef = useRef(onLog)
  logRef.current = onLog
  const initialized = useRef(false)
  const previous = useRef({ status: game.status, score: 0 })

  useEffect(() => {
    hostRef.current?.focus()
    const context = canvasRef.current?.getContext('2d')
    if (!initialized.current) {
      initialized.current = true
      logRef.current(context ? 'Canvas inicializado. Jogo pronto para começar.' : 'Não foi possível inicializar o canvas do jogo.')
    }
  }, [])
  useEffect(() => {
    const before = previous.current
    if (before.status !== game.status) {
      const messages = { running: 'Jogo em execução.', paused: 'Jogo pausado.', lost: 'Fim de jogo.', won: 'Tabuleiro completo. Você venceu!', ready: 'Nova partida preparada.' }
      logRef.current(messages[game.status])
    }
    if (before.score !== game.score && game.score > 0) logRef.current('Ponto marcado: +10.')
    previous.current = { status: game.status, score: game.score }
  }, [game.status, game.score])
  useEffect(() => {
    if (game.status !== 'running') return
    const timer = window.setInterval(() => {
      const next = stepGame(stateRef.current, turns.current.shift())
      stateRef.current = next
      setGame(next)
    }, 135)
    return () => window.clearInterval(timer)
  }, [game.status])
  useEffect(() => {
    function pauseOnBlur() { turns.current = []; setGame(previous => previous.status === 'running' ? { ...previous, status: 'paused' } : previous) }
    function visibility() { if (document.hidden) pauseOnBlur() }
    window.addEventListener('blur', pauseOnBlur)
    document.addEventListener('visibilitychange', visibility)
    return () => { window.removeEventListener('blur', pauseOnBlur); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => {
    const canvas = canvasRef.current, context = canvas?.getContext('2d')
    if (!context || !canvas) return
    const theme = getComputedStyle(hostRef.current!)
    const accent = theme.getPropertyValue('--accent').trim() || '#c4a0ff'
    const cell = canvas.width / game.size
    context.fillStyle = theme.getPropertyValue('--bg').trim() || '#111218'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#8d7aaf18'; context.lineWidth = 1
    for (let i = 1; i < game.size; i++) { context.beginPath(); context.moveTo(i * cell, 0); context.lineTo(i * cell, canvas.height); context.stroke(); context.beginPath(); context.moveTo(0, i * cell); context.lineTo(canvas.width, i * cell); context.stroke() }
    game.snake.forEach((point, index) => { context.fillStyle = accent; context.globalAlpha = index ? .65 : 1; context.fillRect(point.x * cell + 2, point.y * cell + 2, cell - 4, cell - 4) })
    context.globalAlpha = 1
    if (game.food) { context.fillStyle = '#ef91a5'; context.beginPath(); context.arc((game.food.x + .5) * cell, (game.food.y + .5) * cell, cell * .3, 0, Math.PI * 2); context.fill() }
  })

  function direction(next: Direction) {
    const current = stateRef.current
    if (current.status !== 'running') {
      turns.current = []
      const fresh = current.status === 'lost' || current.status === 'won'
      const base = fresh ? createGame() : current
      if (fresh) setRunId(crypto.randomUUID())
      const starting = base.status === 'ready'
      const direction = starting || !isReverse(base.direction, next) ? next : base.direction
      const snake = starting && next === 'left' ? [...base.snake].reverse() : base.snake
      const started = { ...base, snake, direction, status: 'running' as const }
      stateRef.current = started
      setGame(started)
      return
    }
    if (turns.current.length >= 2) return
    const last = turns.current.at(-1) ?? current.direction
    if (next !== last && !isReverse(last, next)) turns.current.push(next)
  }
  function toggle() {
    turns.current = []
    if (game.status === 'lost' || game.status === 'won') setRunId(crypto.randomUUID())
    setGame(previous => previous.status === 'lost' || previous.status === 'won' ? { ...createGame(), status: 'running' } : { ...previous, status: previous.status === 'running' ? 'paused' : 'running' })
  }
  return <section className="snake-game" ref={hostRef} tabIndex={-1} aria-label={t('Jogo da cobra')} onKeyDown={event => {
    if (event.ctrlKey || event.metaKey || event.altKey || (event.target instanceof HTMLElement && (event.target.closest('input, textarea, select') || event.target.isContentEditable))) return
    const key = event.key.toLowerCase()
    const keys: Record<string, Direction> = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' }
    if (keys[key]) { event.preventDefault(); event.stopPropagation(); if (!event.repeat || stateRef.current.status === 'running') direction(keys[key]) }
    if (key === ' ' && event.target === hostRef.current && !event.repeat) { event.preventDefault(); toggle() }
    if (key === 'escape') { event.preventDefault(); onClose() }
  }}>
    <div className="snake-heading"><div><div className="eyebrow">bash snake.sh</div><h2>{t('Uma pausa para jogar.')}</h2></div><button className="secondary" onClick={onClose}>{t('Voltar ao portfólio')}</button></div>
    <div className="snake-layout"><div className="snake-board"><canvas ref={canvasRef} width="400" height="400" role="img" aria-label={t('Tabuleiro da cobra. Use as setas ou WASD para controlar.')} />
      {game.status !== 'running' && <div className="snake-overlay"><h3>{t(game.status === 'lost' ? 'Fim de jogo' : game.status === 'won' ? 'Você venceu!' : game.status === 'paused' ? 'Pausado' : 'Pronto para jogar?')}</h3></div>}
    </div><div className="snake-guide"><div className="snake-score"><span>{t('Pontuação')}</span><strong aria-live="polite">{game.score}</strong></div>
      <SnakeRanking key={runId} finished={game.status === 'lost' || game.status === 'won'} score={game.score} runId={runId} onLog={onLog} />
    </div></div>
  </section>
}
