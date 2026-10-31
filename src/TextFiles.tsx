import FileIcon from './FileIcon'
import { t } from './i18n'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { FileProblem } from './Diagnostics'
import type { ChangeEvent, MouseEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'

import { defaultSettings, parseSettings } from './settings'
import type { PortfolioSettings } from './settings'
import { languages, languageFor } from './languages'
const Diagnostics = lazy(() => import('./Diagnostics'))
const CodeEditor = lazy(() => import('./CodeEditor'))

type TextFile = { id: string; name: string; content: string; exported: string; savedContent?: string; language?: string }
const STORAGE_KEY = 'portfolio.text-drafts.v1'
const OPEN_TABS_KEY = 'portfolio.text-tabs.v1'
function restoreTabs(drafts: TextFile[]): { opened: string[]; activeId: string | null } {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(OPEN_TABS_KEY) ?? 'null')
    if (!data || typeof data !== 'object') return { opened: [], activeId: null }
    const state = data as Record<string, unknown>
    const known = new Set(drafts.map(file => file.id))
    const opened = Array.isArray(state.opened) ? [...new Set(state.opened.filter((id): id is string => typeof id === 'string' && known.has(id)))] : []
    const activeId = typeof state.activeId === 'string' && opened.includes(state.activeId) ? state.activeId : null
    return { opened, activeId }
  } catch { return { opened: [], activeId: null } }
}
function restore(): TextFile[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(data)) return []
    const seen = new Set<string>()
    return data.filter((item): item is TextFile => {
      if (!item || typeof item !== 'object') return false
      const file = item as Record<string, unknown>
      if (typeof file.id !== 'string' || typeof file.name !== 'string' || typeof file.content !== 'string' || typeof file.exported !== 'string' || seen.has(file.id)) return false
      seen.add(file.id)
      return true
    })
  } catch { return [] }
}

export function useTextFiles(onActivate: () => void, appearance: { light: boolean; highContrast: boolean; largeText: boolean; settings: PortfolioSettings; onApplySettings: (settings: PortfolioSettings) => void }) {
  const [drafts, setDrafts] = useState<TextFile[]>(restore)
  const [initialTabs] = useState(() => restoreTabs(drafts))
  const [opened, setOpened] = useState<string[]>(initialTabs.opened)
  const [activeId, setActiveId] = useState<string | null>(initialTabs.activeId)
  useEffect(() => {
    try { localStorage.setItem(OPEN_TABS_KEY, JSON.stringify({ opened, activeId })) }
    catch { setMessage(t("Não foi possível guardar o estado das abas neste navegador.")) }
  }, [opened, activeId])
  const [problems, setProblems] = useState<FileProblem[]>([])
  const [problemLocation, setProblemLocation] = useState<{ fileId: string; line: number; column: number; request: number } | null>(null)
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null)
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3500); return () => window.clearTimeout(timer) }, [toast])
  const saveDialogRef = useRef<HTMLDialogElement>(null)
  const saveInputRef = useRef<HTMLInputElement>(null)
  const [saveName, setSaveName] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveTargetId, setSaveTargetId] = useState<string | null>(null)
  const [settingsNotice, setSettingsNotice] = useState('')
  const [pendingClose, setPendingClose] = useState<string | null>(null)
  const closeDialogRef = useRef<HTMLDialogElement>(null)
  const clearDialogRef = useRef<HTMLDialogElement>(null)
  const contextRef = useRef<HTMLDivElement>(null)
  const renameDialogRef = useRef<HTMLDialogElement>(null)
  const removeDialogRef = useRef<HTMLDialogElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [contextId, setContextId] = useState<string | null>(null)
  const [contextPosition, setContextPosition] = useState({ left: 0, top: 0 })
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState('')
  const contextFile = drafts.find(file => file.id === contextId)
  function showFileContext(id: string, event: MouseEvent<HTMLElement> | ReactKeyboardEvent<HTMLElement>) {
    event.preventDefault(); event.stopPropagation()
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = 'clientX' in event && event.clientX ? event.clientX : bounds.left + 12
    const y = 'clientY' in event && event.clientY ? event.clientY : bounds.bottom
    setContextId(id)
    setContextPosition({ left: Math.max(8, Math.min(x, window.innerWidth - 232)), top: Math.max(8, Math.min(y, window.innerHeight - 150)) })
    contextRef.current?.showPopover()
    requestAnimationFrame(() => contextRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus())
  }
  function fileContextHandlers(id: string) {
    return { onContextMenu: (event: MouseEvent<HTMLElement>) => showFileContext(id, event), onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) showFileContext(id, event)
    } }
  }
  function startRename() {
    if (!contextFile || contextId === 'portfolio-settings') return
    contextRef.current?.hidePopover(); setRenameValue(contextFile.name); setRenameError(''); renameDialogRef.current?.showModal()
    requestAnimationFrame(() => { renameInputRef.current?.focus(); renameInputRef.current?.select() })
  }
  function confirmRename() {
    const name = renameValue.trim()
    if (!name || name === '.' || name === '..' || /[<>:"/\\|?*\x00-\x1f]/.test(name)) { setRenameError(t("Informe um nome de arquivo válido.")); return }
    if (drafts.some(file => file.id !== contextId && file.name === name)) { setRenameError(t("Já existe um arquivo com esse nome.")); return }
    setDrafts(previous => previous.map(file => file.id === contextId ? { ...file, name, language: languageFor(name) } : file))
    renameDialogRef.current?.close(); setToast({ text: t("Arquivo renomeado."), error: false })
  }
  function confirmRemove() {
    if (!contextId || contextId === 'portfolio-settings') return
    finishClose(contextId)
    setDrafts(previous => previous.filter(file => file.id !== contextId))
    removeDialogRef.current?.close(); setToast({ text: t("Rascunho removido deste navegador."), error: false })
  }

  const [storageError, setStorageError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 42 })
  const menuRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLInputElement>(null)
  const languagePickerRef = useRef<HTMLDivElement>(null)
  const languageInputRef = useRef<HTMLInputElement>(null)
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false)
  const [languageAnchor, setLanguageAnchor] = useState<{ left: number; bottom: number } | null>(null)
  const [languageSearch, setLanguageSearch] = useState('')
  const [languageIndex, setLanguageIndex] = useState(0)
  const languageResults = languages.filter(item => `${t(item.label)} ${item.ext}`.toLowerCase().includes(languageSearch.toLowerCase()))
  function openLanguagePicker(anchor?: HTMLElement) {
    if (anchor) {
      const bounds = anchor.getBoundingClientRect()
      const width = Math.min(320, window.innerWidth - 24)
      setLanguageAnchor({ left: Math.max(12, Math.min(bounds.right - width, window.innerWidth - width - 12)), bottom: window.innerHeight - bounds.top + 4 })
    } else setLanguageAnchor(null)
    setLanguageSearch(''); setLanguageIndex(0); languagePickerRef.current?.showPopover(); languageInputRef.current?.focus()
  }
  const active = drafts.find(file => file.id === activeId)
  const language = active?.language ?? languageFor(active?.name ?? '')
  const selectedLanguage = languages.find(item => item.id === language) ?? languages[0]
  function changeLanguage(value: string) {
    const selection = languages.find(item => item.id === value)
    if (!selection || !active || active.id === 'portfolio-settings') return
    setDrafts(previous => previous.map(file => file.id === active.id ? { ...file, language: selection.id, name: file.name.replace(/\.[^.]+$/, '') + '.' + selection.ext } : file))
  }

  useEffect(() => {
    if (!activeId) return
    let chordStarted = 0
    function shortcut(event: KeyboardEvent) {
      if (event.repeat || event.isComposing) return
      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault(); event.stopImmediatePropagation(); chordStarted = Date.now(); return
      }
      if (chordStarted && key === 'm' && Date.now() - chordStarted < 2500 && !event.altKey) {
        event.preventDefault(); event.stopImmediatePropagation(); chordStarted = 0; openLanguagePicker(); return
      }
      if (!['control', 'meta', 'shift'].includes(key)) chordStarted = 0
    }
    window.addEventListener('keydown', shortcut, true)
    return () => window.removeEventListener('keydown', shortcut, true)
  }, [activeId])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts)); setStorageError(false) }
    catch { setStorageError(true) }
  }, [drafts])



  useEffect(() => {
    if (!storageError) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [storageError])

  useEffect(() => {
    function fileShortcut(event: KeyboardEvent) {
      if (event.repeat || event.isComposing || document.querySelector('dialog[open]')) return
      const key = event.key.toLowerCase()
      const isN = event.code === 'KeyN' || key === 'n'
      const newFile = event.altKey && !event.shiftKey && isN
      if (newFile) {
        event.preventDefault(); event.stopImmediatePropagation(); create()
      } else if ((event.ctrlKey || event.metaKey) && key === 'o' && !event.altKey && !event.shiftKey) {
        event.preventDefault(); event.stopImmediatePropagation(); hideMenu(); pickerRef.current?.click()
      } else if ((event.ctrlKey || event.metaKey) && key === 's' && !event.altKey && active) {
        event.preventDefault(); event.stopImmediatePropagation(); if (event.shiftKey) download(); else saveDraft()
      }
    }
    window.addEventListener('keydown', fileShortcut, true)
    return () => window.removeEventListener('keydown', fileShortcut, true)
  })
  function hideMenu() { menuRef.current?.hidePopover() }
  function select(id: string) { setOpened(previous => previous.includes(id) ? previous : [...previous, id]); setActiveId(id); onActivate() }
  function openSettings() {
    const existing = drafts.find(file => file.id === 'portfolio-settings')
    if (!existing) {
      const content = JSON.stringify(appearance.settings, null, 2)
      setDrafts(previous => [...previous, { id: 'portfolio-settings', name: 'settings.json', language: 'json', content, exported: content }])
    }
    select('portfolio-settings'); setSettingsNotice(t("Edite o JSON e clique em Aplicar configurações."))
  }
  function applySettings() {
    if (!active || active.id !== 'portfolio-settings') return
    try {
      const settings = parseSettings(active.content)
      appearance.onApplySettings(settings)
      setDrafts(previous => previous.map(file => file.id === active.id ? { ...file, exported: file.content } : file))
      setSettingsNotice(t("Configurações aplicadas e salvas neste navegador."))
    } catch (error) { setSettingsNotice(t("Não aplicado: ") + (error instanceof Error ? error.message : t("JSON inválido."))) }
  }
  function create() {
    let number = 1
    while (drafts.some(file => file.name === t("Sem título-{0}.txt", [number]))) number++
    const file = { id: crypto.randomUUID(), name: t("Sem título-{0}.txt", [number]), content: '', exported: '' }
    setDrafts(previous => [...previous, file]); select(file.id); hideMenu(); setMessage(t("Novo arquivo de texto criado."))
  }
  async function open(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!/\.(txt|json|js|jsx|ts|tsx|sql|html|css|md|py|java|cs|cpp|yml|yaml|xml|sh)$/i.test(file.name)) { setMessage(t("Escolha um arquivo de texto ou código suportado.")); return }
    if (file.size > 2 * 1024 * 1024) { setMessage(t("Escolha um arquivo de até 2 MB.")); return }
    try {
      const content = (await file.text()).replace(/\r\n?/g, '\n')
      const draft = { id: crypto.randomUUID(), name: file.name, content, exported: content, language: languageFor(file.name) }
      setDrafts(previous => [...previous, draft]); select(draft.id); setMessage(t("Arquivo aberto. O original permanece no seu computador."))
    } catch { setMessage(t("Não foi possível ler esse arquivo.")) }
  }
  function saveDraft() {
    if (!active) return
    if (active.id === 'portfolio-settings') { applySettings(); return }
    const updated = drafts.map(file => file.id === active.id ? { ...file, savedContent: file.content } : file)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setDrafts(updated); setStorageError(false); hideMenu()
      setToast({ text: t("Rascunho “{0}” salvo neste navegador.", [active.name]), error: false })
    } catch {
      setStorageError(true)
      setToast({ text: t("Não foi possível salvar o rascunho. Use Salvar como para baixar uma cópia."), error: true })
    }
  }
  function download() {
    if (!active) return
    setSaveTargetId(active.id); setSaveName(active.name); setSaveError('')
    hideMenu(); saveDialogRef.current?.showModal()
    requestAnimationFrame(() => { saveInputRef.current?.focus(); saveInputRef.current?.select() })
  }
  function confirmDownload() {
    const file = drafts.find(item => item.id === saveTargetId)
    if (!file) { saveDialogRef.current?.close(); return }
    const safeName = saveName.trim()
    if (!safeName || safeName === '.' || safeName === '..' || /[<>:"/\\|?*\x00-\x1f]/.test(safeName)) {
      setSaveError(t("Informe um nome válido, sem os caracteres < > : \" / \\ | ? *.")); return
    }
    const extension = languages.find(item => item.id === (file.language ?? languageFor(file.name)))?.ext ?? 'txt'
    const name = /\.[^.]+$/.test(safeName) ? safeName : `${safeName}.${extension}`
    const url = URL.createObjectURL(new Blob([file.content], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = name; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDrafts(previous => previous.map(item => item.id === file.id ? { ...item, name, exported: item.content, savedContent: item.content } : item))
    saveDialogRef.current?.close(); setMessage(t("Download solicitado. O rascunho continua neste navegador."))
  }
  function close(id: string) {
    const file = drafts.find(item => item.id === id)
    if (file && file.content !== (file.savedContent ?? file.exported)) { setPendingClose(id); hideMenu(); closeDialogRef.current?.showModal(); return }
    finishClose(id)
  }
  function finishClose(id: string) {
    const remaining = opened.filter(key => key !== id)
    setOpened(remaining)
    if (activeId === id) setActiveId(remaining[Math.min(opened.indexOf(id), remaining.length - 1)] ?? null)
    hideMenu()
  }
  function clearDrafts() {
    hideMenu()
    clearDialogRef.current?.showModal()
  }
  function confirmClearDrafts() {
    setDrafts([]); setOpened([]); setActiveId(null)
    clearDialogRef.current?.close()
    setMessage(t("Rascunhos apagados."))
  }

  const menu = <>
    <div ref={contextRef} popover="auto" className="file-context-menu" style={contextPosition} role="menu" aria-label={t("Ações do arquivo")} onKeyDown={event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
      buttons[next]?.focus()
    }}>
      <div className="context-file-name">{contextFile?.name}</div>
      <button role="menuitem" onClick={() => { if (!contextId) return; contextRef.current?.hidePopover(); if (opened.includes(contextId)) close(contextId); else select(contextId) }}>{contextId && opened.includes(contextId) ? t("Fechar arquivo") : t("Abrir arquivo")}</button>
      <button role="menuitem" disabled={contextId === 'portfolio-settings'} onClick={startRename}>{t("Renomear…")}</button>
      <button role="menuitem" disabled={contextId === 'portfolio-settings'} onClick={() => { contextRef.current?.hidePopover(); removeDialogRef.current?.showModal() }}>{t("Remover rascunho…")}</button>
    </div>
    <dialog ref={renameDialogRef} className="confirm-dialog" aria-labelledby="rename-title"><form onSubmit={event => { event.preventDefault(); confirmRename() }}>
      <h2 id="rename-title">{t("Renomear arquivo")}</h2><label className="save-name-label" htmlFor="rename-file">{t("Nome do arquivo")}</label>
      <input ref={renameInputRef} id="rename-file" className="save-name-input" autoComplete="off" value={renameValue} onChange={event => { setRenameValue(event.target.value); setRenameError('') }} aria-invalid={!!renameError} aria-describedby="rename-error" />
      <p id="rename-error" role="alert">{renameError}</p><div className="confirm-actions"><button type="button" className="secondary" onClick={() => renameDialogRef.current?.close()}>{t("Cancelar")}</button><button className="primary" type="submit">{t("Renomear")}</button></div>
    </form></dialog>
    <dialog ref={removeDialogRef} className="confirm-dialog" aria-labelledby="remove-draft-title"><h2 id="remove-draft-title">{t("Remover rascunho?")}</h2><p>“{contextFile?.name}{t("” será removido deste navegador. Os arquivos baixados serão mantidos.")}</p><div className="confirm-actions"><button className="secondary" autoFocus onClick={() => removeDialogRef.current?.close()}>{t("Cancelar")}</button><button className="danger-button" onClick={confirmRemove}>{t("Remover rascunho")}</button></div></dialog>

    <Suspense fallback={null}><Diagnostics documents={drafts} onProblems={setProblems} /></Suspense>
    {toast && <div className={toast.error ? 'draft-toast error' : 'draft-toast'} role={toast.error ? 'alert' : 'status'}><span className="toast-icon" aria-hidden="true">{toast.error ? '!' : '✓'}</span><span>{toast.text}</span><button aria-label={t("Fechar notificação")} onClick={() => setToast(null)}>×</button></div>}
    <dialog ref={saveDialogRef} className="confirm-dialog" aria-labelledby="save-file-title" onClose={() => setSaveTargetId(null)}>
      <form onSubmit={event => { event.preventDefault(); confirmDownload() }}>
        <h2 id="save-file-title">{t("Salvar como")}</h2>
        <label className="save-name-label" htmlFor="save-file-name">{t("Nome do arquivo")}</label>
        <input ref={saveInputRef} id="save-file-name" className="save-name-input" autoFocus autoComplete="off" spellCheck={false} value={saveName} onChange={event => { setSaveName(event.target.value); setSaveError('') }} aria-invalid={!!saveError} aria-describedby="save-file-description save-file-error" />
        <p id="save-file-description">{t("O arquivo será baixado. Seu rascunho continuará neste navegador.")}</p>
        <p id="save-file-error" className="save-name-error" role="alert">{saveError}</p>
        <div className="confirm-actions"><button type="button" className="secondary" onClick={() => saveDialogRef.current?.close()}>{t("Cancelar")}</button><button type="submit" className="primary">{t("Baixar arquivo")}</button></div>
      </form>
    </dialog>
    <dialog ref={closeDialogRef} className="confirm-dialog" aria-labelledby="close-file-title" onClose={() => setPendingClose(null)}>
      <h2 id="close-file-title">{t("Fechar arquivo?")}</h2>
      <p>“{drafts.find(file => file.id === pendingClose)?.name}{t("” tem alterações")} {pendingClose === 'portfolio-settings' ? t("não aplicadas") : t("desde o último salvamento manual")}. {storageError ? t("O armazenamento falhou. Baixe seu texto antes de sair.") : t("O rascunho continuará neste navegador.")}</p>
      <div className="confirm-actions"><button className="secondary" autoFocus onClick={() => closeDialogRef.current?.close()}>{t("Cancelar")}</button><button className="primary" onClick={() => { if (pendingClose) finishClose(pendingClose); closeDialogRef.current?.close() }}>{t("Fechar e manter rascunho")}</button></div>
    </dialog>
    <dialog ref={clearDialogRef} className="confirm-dialog" aria-labelledby="clear-drafts-title" aria-describedby="clear-drafts-description" onClick={event => {
      if (event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close()
      }
    }}>
      <h2 id="clear-drafts-title">{t("Apagar todos os rascunhos?")}</h2>
      <p id="clear-drafts-description">{t("Os rascunhos de texto serão removidos deste navegador. Os arquivos que você já baixou serão mantidos.")}</p>
      <div className="confirm-actions"><button className="secondary" autoFocus onClick={() => clearDialogRef.current?.close()}>{t("Cancelar")}</button><button className="danger-button" onClick={confirmClearDrafts}>{t("Apagar rascunhos")}</button></div>
    </dialog>
    <button className="edit-menu-trigger" popoverTarget="file-options" aria-expanded={menuOpen} aria-controls="file-options" onClick={event => {
      const bounds = event.currentTarget.getBoundingClientRect()
      setPosition({ left: bounds.left, top: (event.currentTarget.closest('header')?.getBoundingClientRect().bottom ?? bounds.bottom) - 1 })
    }}>{t("Arquivo")}<svg className={menuOpen ? 'edit-chevron open' : 'edit-chevron'} width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
    <div id="file-options" ref={menuRef} className="accessibility-menu file-menu" popover="auto" style={position} onToggle={event => setMenuOpen(event.newState === 'open')}>
      <button onClick={create} aria-keyshortcuts="Alt+n Control+Alt+n"><span>{t("Novo arquivo de texto")}</span><kbd title={t("Alternativa: Ctrl+Alt+N")}>Alt+N</kbd></button>
      <button onClick={() => { hideMenu(); pickerRef.current?.click() }} aria-keyshortcuts="Control+o"><span>{t("Abrir arquivo…")}</span><kbd>Ctrl+O</kbd></button>
      <button disabled={!active} onClick={saveDraft} aria-keyshortcuts="Control+s"><span>{t("Salvar rascunho")}</span><kbd>Ctrl+S</kbd></button><button disabled={!active} onClick={download} aria-keyshortcuts="Control+Shift+s"><span>{t("Salvar como…")}</span><kbd>Ctrl+Shift+S</kbd></button>
      <button disabled={!active} onClick={() => active && close(active.id)}>{t("Fechar arquivo de texto")}</button>
      <h2>{t("Rascunhos neste navegador")}</h2>
      {drafts.map(file => <button key={file.id} onClick={() => { select(file.id); hideMenu() }}>{file.name}</button>)}
      {!drafts.length && <p>{t("Nenhum rascunho salvo.")}</p>}
      <button disabled={!drafts.length} onClick={clearDrafts}>{t("Apagar rascunhos…")}</button>
    </div>
    <input ref={pickerRef} type="file" accept=".txt,.json,.js,.jsx,.ts,.tsx,.sql,.html,.css,.md,.py,.java,.cs,.cpp,.yml,.yaml,.xml,.sh" onChange={open} hidden />
  </>
  const tabs = drafts.filter(file => opened.includes(file.id)).map(file => <div key={file.id} {...fileContextHandlers(file.id)} className={activeId === file.id ? 'editor-tab active' : 'editor-tab'}
    onMouseDown={event => { if (event.button === 1) event.preventDefault() }} onAuxClick={event => { if (event.button === 1) { event.preventDefault(); close(file.id) } }}>
    <button className="tab-open" aria-current={activeId === file.id ? 'page' : undefined} onClick={() => select(file.id)}><FileIcon name={file.name} language={file.language} />{file.name}{file.content !== (file.savedContent ?? file.exported) && <span title={t("Alterações desde o último salvamento manual")}>●</span>}</button>
    <button className="tab-close" aria-label={t("Fechar {0}", [file.name])} onClick={() => close(file.id)}>×</button>
  </div>)
  const editor = active && <section className="text-workspace" aria-label={t("Editor de texto")}>
    <div className="text-file-info"><span>{active.name}</span><span>{storageError ? t("Falha ao salvar rascunho — baixe seu texto") : t("Rascunho automático neste navegador")}</span></div>
    {active.id === 'portfolio-settings' && <div className="settings-toolbar"><button className="primary" onClick={applySettings}>{t("Aplicar configurações")}</button><button className="secondary" onClick={() => { setDrafts(previous => previous.map(file => file.id === active.id ? { ...file, content: JSON.stringify(defaultSettings, null, 2) } : file)); setSettingsNotice(t("Padrões carregados. Clique em Aplicar configurações para confirmar.")) }}>{t("Carregar padrões")}</button><span role="status">{settingsNotice}</span></div>}
    <div className="monaco-container"><Suspense fallback={<p className="editor-loading">{t("Carregando editor…")}</p>}><CodeEditor location={problemLocation?.fileId === active.id ? problemLocation : undefined} settings={appearance.settings} id={active.id} content={active.content} language={language}
      theme={appearance.highContrast ? (appearance.light ? 'hc-light' : 'hc-black') : appearance.light ? 'vs' : 'vs-dark'} large={appearance.largeText}
      onSelectLanguage={openLanguagePicker}
      onChange={content => setDrafts(previous => previous.map(file => file.id === active.id ? { ...file, content } : file))} /></Suspense></div>

  </section>
  const languageControl = active && active.id !== 'portfolio-settings' && <>
    <button className="language-status" aria-expanded={languagePickerOpen} aria-controls="file-language-picker" aria-label={t("Alterar linguagem do arquivo")} title={t("Alterar linguagem (Ctrl+K, M)")} onClick={event => openLanguagePicker(event.currentTarget)}>{t(selectedLanguage.label)}<svg className={languagePickerOpen ? 'language-chevron open' : 'language-chevron'} width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
    <div id="file-language-picker" ref={languagePickerRef} popover="auto" onToggle={event => setLanguagePickerOpen(event.newState === 'open')} className={languageAnchor ? 'language-picker language-dropdown' : 'language-picker'} style={languageAnchor ? { left: languageAnchor.left, bottom: languageAnchor.bottom, top: 'auto', transform: 'none' } : undefined} aria-label={t("Selecionar linguagem")}>
      <input ref={languageInputRef} aria-label={t("Filtrar linguagens")} placeholder={t("Selecione a linguagem do arquivo…")} autoComplete="off" value={languageSearch} onChange={event => { setLanguageSearch(event.target.value); setLanguageIndex(0) }} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setLanguageIndex(previous => languageResults.length ? (previous + (event.key === 'ArrowDown' ? 1 : -1) + languageResults.length) % languageResults.length : 0) }
        if (event.key === 'Enter' && languageResults[languageIndex]) { event.preventDefault(); changeLanguage(languageResults[languageIndex].id); languagePickerRef.current?.hidePopover() }
      }} />
      <div className="language-results">{languageResults.map((item, index) => <button key={item.id} className={languageIndex === index ? 'chosen' : ''} onClick={() => { changeLanguage(item.id); languagePickerRef.current?.hidePopover() }}>{item.label}<span>.{item.ext}{language === item.id ? ' ✓' : ''}</span></button>)}{!languageResults.length && <p>{t("Nenhuma linguagem encontrada.")}</p>}</div>
    </div>
  </>
  const explorerFiles = drafts.filter(file => file.id !== 'portfolio-settings').map(file => <button key={file.id} {...fileContextHandlers(file.id)} className={activeId === file.id ? 'active' : ''} aria-current={activeId === file.id ? 'page' : undefined} title={file.name} onClick={() => select(file.id)}><FileIcon name={file.name} language={file.language} /><span className="explorer-file-name">{file.name}</span>{file.content !== (file.savedContent ?? file.exported) && <span className="draft-indicator" title={t("Alterações desde o último salvamento manual")}>●</span>}</button>)
  return { problems, openProblem: (problem: FileProblem) => { select(problem.fileId); setProblemLocation({ ...problem, request: Date.now() }) }, create, explorerFiles, openSettings, menu, tabs, editor, languageControl, active, hasOpen: opened.length > 0, deactivate: () => setActiveId(null), message, storageError }
}
