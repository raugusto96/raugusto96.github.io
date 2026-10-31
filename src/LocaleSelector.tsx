import { useRef, useState } from 'react'
import { t, useLocale } from './i18n'

function Flag({ locale }: { locale: 'pt-BR' | 'en' }) {
  return <svg className="locale-flag" viewBox="0 0 32 32" aria-hidden="true">
    {locale === 'pt-BR' ? <><path fill="#168349" d="M0 0h32v32H0z" /><path fill="#ffdb43" d="m16 4 14 12-14 12L2 16Z" /><circle fill="#214fa1" cx="16" cy="16" r="7" /><path d="M9.5 14.1a18 18 0 0 1 13 4" fill="none" stroke="white" strokeWidth="1.2" /></> : <><path fill="#fff" d="M0 0h32v32H0z" />{Array.from({ length: 7 }, (_, index) => <rect key={index} fill="#b22234" x="0" y={index * 4.92} width="32" height="2.47" />)}<path fill="#3c3b6e" d="M0 0h17v17H0z" />{Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (_, column) => <circle key={`${row}-${column}`} fill="#fff" cx={1.8 + column * 3.3} cy={1.7 + row * 3.25} r=".55" />))}</>}
  </svg>
}
export default function LocaleSelector() {
  const { locale, preference, setPreference } = useLocale()
  const popover = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  return <div className="locale-selector">
    <button className="locale-trigger" popoverTarget="locale-options" aria-label={t('Selecionar idioma')} title={t('Selecionar idioma')} aria-expanded={open} aria-controls="locale-options"><Flag locale={locale} /></button>
    <div id="locale-options" ref={popover} className="locale-options" popover="auto" onToggle={event => setOpen(event.newState === 'open')} role="group" aria-label={t('Idioma da interface')}>
      <button aria-pressed={preference === 'pt-BR'} onClick={() => { setPreference('pt-BR'); popover.current?.hidePopover() }}><Flag locale="pt-BR" /><span>Português (Brasil)</span>{preference === 'pt-BR' && <span>✓</span>}</button>
      <button aria-pressed={preference === 'en'} onClick={() => { setPreference('en'); popover.current?.hidePopover() }}><Flag locale="en" /><span>English (US)</span>{preference === 'en' && <span>✓</span>}</button>
      <button className="locale-auto" aria-pressed={preference === 'auto'} onClick={() => { setPreference('auto'); popover.current?.hidePopover() }}><span aria-hidden="true">◎</span><span>{t('Seguir idioma do navegador')}</span>{preference === 'auto' && <span>✓</span>}</button>
    </div>
  </div>
}
