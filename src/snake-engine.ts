export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'
export type SnakeState = { size: number; snake: Point[]; direction: Direction; food: Point | null; score: number; status: 'ready' | 'running' | 'paused' | 'lost' | 'won' }
const vectors: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }
export function spawnFood(snake: Point[], size: number, random = Math.random): Point | null {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`))
  const free: Point[] = []
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!occupied.has(`${x},${y}`)) free.push({ x, y })
  return free.length ? free[Math.min(free.length - 1, Math.floor(random() * free.length))] : null
}
export function createGame(random = Math.random): SnakeState {
  const snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }]
  return { size: 20, snake, direction: 'right', food: spawnFood(snake, 20, random), score: 0, status: 'ready' }
}
export function isReverse(a: Direction, b: Direction): boolean { return vectors[a].x + vectors[b].x === 0 && vectors[a].y + vectors[b].y === 0 }
export function stepGame(state: SnakeState, requested: Direction = state.direction, random = Math.random): SnakeState {
  if (state.status !== 'running') return state
  const direction = isReverse(state.direction, requested) ? state.direction : requested
  const vector = vectors[direction], head = { x: (state.snake[0].x + vector.x + state.size) % state.size, y: (state.snake[0].y + vector.y + state.size) % state.size }
  const eats = !!state.food && head.x === state.food.x && head.y === state.food.y
  const body = eats ? state.snake : state.snake.slice(0, -1)
  if (body.some(p => p.x === head.x && p.y === head.y)) return { ...state, direction, status: 'lost' }
  const snake = [head, ...state.snake]; if (!eats) snake.pop()
  const food = eats ? spawnFood(snake, state.size, random) : state.food
  return { ...state, snake, direction, food, score: state.score + (eats ? 10 : 0), status: food ? 'running' : 'won' }
}
