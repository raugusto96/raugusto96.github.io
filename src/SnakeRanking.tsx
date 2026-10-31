import { useEffect, useState } from 'react'
import { t } from './i18n'
import './SnakeRanking.css'
type Entry = { id: string; nickname: string; score: number }
export default function SnakeRanking({ finished, score, runId, onLog }: { finished: boolean; score: number; runId: string; onLog: (message: string) => void }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setLoadError(false)
    fetch('/api/ranking', { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(); return response.json() }).then(setEntries).catch(error => { if (error.name !== 'AbortError') setLoadError(true) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [revision])
  async function save() {
    if (saving || saved) return
    setSaving(true); setSaveError(false)
    onLog('Salvando pontuação no ranking...')
    try {
      const response = await fetch('/api/ranking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: nickname.trim(), score, runId }), signal: AbortSignal.timeout(10000) })
      if (!response.ok) throw new Error()
      setSaved(true); setRevision(value => value + 1); onLog('Pontuação salva no ranking.')
    } catch { setSaveError(true); onLog('Não foi possível salvar a pontuação. Tente novamente.') }
    finally { setSaving(false) }
  }
  return <section className="snake-ranking" aria-label={t('Ranking')}>
    {finished && <div className="snake-submit">
      {saved ? <p role="status">{t('Pontuação salva no ranking.')}</p> : <form onSubmit={event => { event.preventDefault(); void save() }}>
        <label htmlFor="snake-nickname">{t('Quer registrar sua pontuação?')}</label>
        <div><input id="snake-nickname" value={nickname} onChange={event => setNickname(event.target.value)} minLength={2} maxLength={24} required autoComplete="off" placeholder={t('Seu nick')} disabled={saving} /><button className="primary" disabled={saving || nickname.trim().length < 2}>{t(saving ? 'Salvando...' : 'Salvar no ranking')}</button></div>
        {saveError && <p role="alert">{t('Não foi possível salvar a pontuação. Tente novamente.')}</p>}
      </form>}
    </div>}
    <h3>{t('Ranking')} <small>TOP 10</small></h3>
    {loading ? <p role="status">{t('Carregando ranking...')}</p> : loadError ? <p role="status">{t('Ranking indisponível.')} <button className="ranking-retry" onClick={() => setRevision(value => value + 1)}>{t('Tentar novamente')}</button></p> : entries.length ? <ol>{entries.map(entry => <li key={entry.id}><span>{entry.nickname}</span><strong>{entry.score}</strong></li>)}</ol> : <p>{t('Nenhuma pontuação ainda.')}</p>}
  </section>
}
