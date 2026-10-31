export function validateScore(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const { nickname, score, runId } = value as Record<string, unknown>
  if (typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 24 || /[\u0000-\u001f\u007f]/.test(nickname)) return null
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 3970 || score % 10) return null
  if (typeof runId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)) return null
  return { nickname: nickname.trim(), score, runId }
}
