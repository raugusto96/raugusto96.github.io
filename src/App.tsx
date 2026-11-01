import { useGitStatus } from './useGitStatus'
import { VscSourceControl, VscError, VscWarning } from 'react-icons/vsc'
import Projects from './Projects'
import TiltCard from './TiltCard'
import LocaleSelector from './LocaleSelector'
import { t, useLocale } from './i18n'
import { FaJava, FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa'
import { SiTypescript, SiReact, SiAngular, SiJavascript, SiNodedotjs, SiPostgresql, SiApachekafka, SiGit, SiDocker, SiKeycloak } from 'react-icons/si'
import { TbApi, TbDatabase, TbGitMerge, TbShieldLock } from 'react-icons/tb'
import { useEffect, useRef, useState } from 'react'
import type { SnakeGameProps } from './SnakeGame'
import type { ComponentType, FormEvent, MouseEvent } from 'react'
import './App.css'
import { loadSettings, settingsKey } from './settings'
import type { PortfolioSettings } from './settings'
import { useTextFiles } from './TextFiles'

const files = {
  "inicio": "inicio.tsx",
  "sobre": "sobre.md",
  "projetos": "projetos.json",
  "stack": "stack.ts",
  "contato": "contato.yml"
} as const
type Page = keyof typeof files
const pageKeys = Object.keys(files) as Page[]
function isPage(value: string): value is Page { return pageKeys.some(key => key === value) }

const fileIcons: Record<Page, { icon: string; color: string }> = {
  inicio: { icon: 'react_ts', color: 'react' }, sobre: { icon: 'markdown', color: 'purple' },
  projetos: { icon: 'json', color: 'gold' }, stack: { icon: 'typescript', color: 'blue' },
  contato: { icon: 'yaml', color: 'coral' },
}

function App() {
  const gitStatus = useGitStatus()
  useLocale()
  const [nameExpressionVisible, setNameExpressionVisible] = useState(false)
  const [page, setPage] = useState<Page | null>(null)
  const [openPages, setOpenPages] = useState<Page[]>([])
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [editorSettings, setEditorSettings] = useState(loadSettings)
  const [light, setLight] = useState(() => ['vs', 'hc-light'].includes(loadSettings()['workbench.colorTheme']))
  const [largeText, setLargeText] = useState(false)
  const [highContrast, setHighContrast] = useState(() => ['hc-black', 'hc-light'].includes(loadSettings()['workbench.colorTheme']))
  const currentSettings: PortfolioSettings = { ...editorSettings, 'workbench.colorTheme': highContrast ? (light ? 'hc-light' : 'hc-black') : light ? 'vs' : 'vs-dark' }
  function applyEditorSettings(settings: PortfolioSettings) {
    localStorage.setItem(settingsKey, JSON.stringify(settings))
    setEditorSettings(settings)
    setLight(['vs', 'hc-light'].includes(settings['workbench.colorTheme']))
    setHighContrast(['hc-black', 'hc-light'].includes(settings['workbench.colorTheme']))
  }
  useEffect(() => { try { localStorage.setItem(settingsKey, JSON.stringify(currentSettings)) } catch { /* Settings editor reports write errors when applying. */ } }, [editorSettings, light, highContrast])
  const textFiles = useTextFiles(() => setPage(null), { light, highContrast, largeText, settings: currentSettings, onApplySettings: applyEditorSettings })
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 })
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const [terminalOpen, setTerminalOpen] = useState(true)
  const [SnakeGameView, setSnakeGameView] = useState<ComponentType<SnakeGameProps> | null>(null)
  const snakeLoading = useRef(false)
  const [executionLog, setExecutionLog] = useState<{ message: string; time: string; id: number }[]>([])
  const logNumber = useRef(0)
  const executionRef = useRef<HTMLDivElement>(null)
  function logExecution(message: string) {
    const entry = { message, time: new Date().toLocaleTimeString(), id: ++logNumber.current }
    setExecutionLog(previous => [...previous.slice(-99), entry])
  }
  useEffect(() => { const element = executionRef.current; if (element) element.scrollTop = element.scrollHeight }, [executionLog])
  async function startSnake() {
    setTerminalOpen(true); setPanelTab('output')
    if (snakeLoading.current || SnakeGameView) { logExecution('O jogo já está aberto ou carregando.'); return }
    snakeLoading.current = true
    logExecution('Comando reconhecido: bash snake.sh (execução no navegador).')
    logExecution('Carregando o módulo do jogo…')
    try {
      const module = await import('./SnakeGame')
      logExecution('Módulo carregado. Montando o jogo.')
      setSnakeGameView(() => module.default)
    } catch {
      logExecution('Falha ao carregar o jogo. Execute bash snake.sh para tentar novamente.')
    } finally { snakeLoading.current = false }
  }
  function closeSnake() {
    setSnakeGameView(null); logExecution('Jogo encerrado. Retornando ao portfólio.')
    setTerminalOpen(true); setPanelTab('terminal')
    requestAnimationFrame(() => document.getElementById('terminal-input')?.focus())
  }
  const [panelTab, setPanelTab] = useState<'problems' | 'output' | 'terminal'>('terminal')
  useEffect(() => {
    function togglePanel(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j' && !event.altKey && !event.shiftKey && !event.repeat && !event.isComposing && !document.querySelector('dialog[open]')) {
        event.preventDefault()
        event.stopImmediatePropagation()
        setTerminalOpen(previous => !previous)
      }
    }
    window.addEventListener('keydown', togglePanel, true)
    return () => window.removeEventListener('keydown', togglePanel, true)
  }, [])
  const [command, setCommand] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState(0)
  const paletteRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTriggerRef = useRef<HTMLElement | null>(null)
  const results = pageKeys.filter(key => files[key].includes(search.trim().toLowerCase()))
  const contentRef = useRef<HTMLElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  function navigate(next: Page) {
    textFiles.deactivate()
    setOpenPages(previous => previous.includes(next) ? previous : [...previous, next])
    setPage(next)
    contentRef.current?.scrollTo(0, 0)
  }
  function closePage(closed: Page) {
    const remaining = openPages.filter(key => key !== closed)
    setOpenPages(remaining)
    if (page === closed) {
      const index = openPages.indexOf(closed)
      setPage(remaining[Math.min(index, remaining.length - 1)] ?? null)
    }
  }
  function openSearch() {
    if (document.activeElement instanceof HTMLElement) searchTriggerRef.current = document.activeElement
    setSearch(''); setSelectedResult(0); setSearchOpen(true)
  }
  function closeSearch(restoreFocus = false) {
    setSearchOpen(false)
    if (restoreFocus) searchTriggerRef.current?.focus()
  }
  function selectResult(next: Page) { navigate(next); closeSearch(); contentRef.current?.focus() }
  useEffect(() => {
    if (!searchOpen) return
    searchInputRef.current?.focus()
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !paletteRef.current?.contains(event.target)) setSearchOpen(false)
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); setSearchOpen(false); searchTriggerRef.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [searchOpen])
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') { event.preventDefault(); openSearch() }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [textFiles.active])
  useEffect(() => {
    const terminal = terminalRef.current
    if (terminal) terminal.scrollTop = terminal.scrollHeight
  }, [output])

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return
    const button = event.target.closest('button')
    const next = button?.dataset.page
    if (next && isPage(next)) navigate(next)
    if (button?.id === 'explorer-toggle') setExplorerOpen(value => !value)
    if (button?.hasAttribute('data-search')) openSearch()
    if (button?.id === 'theme') setLight(value => !value)
    if (button?.id === 'terminal-toggle') setTerminalOpen(value => !value)
    if (button?.id === 'close-terminal') setTerminalOpen(false)
  }
  function runCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const rawCommand = command.trim().toLowerCase()
    const aliases: Record<string, string> = { home: 'inicio', about: 'sobre', projects: 'projetos', contact: 'contato', theme: 'tema' }
    const value = aliases[rawCommand] ?? rawCommand
    setCommand('')
    if (!value) return
    if (['bash snake.sh', './snake.sh', 'snake'].includes(value)) {
      setOutput(previous => [...previous, '❯ ' + rawCommand, t('Inicializando Snake. Acompanhe a aba Saída.')])
      void startSnake(); return
    }
    if (value === 'clear') { setOutput([]); return }
    let response = t("Comando desconhecido. Digite help.")
    if (value === 'help') response = t("Páginas: inicio, sobre, projetos, stack, contato • Outros: tema, clear • snake")
    else if (isPage(value)) { navigate(value); response = t("Aberto: ") + files[value] }
    else if (value === 'tema') { setLight(previous => !previous); response = t("Tema alterado.") }
    setOutput(previous => [...previous, '❯ ' + value, response])
  }
  const pages = {
    inicio: <><div className="hero"><div><div className="eyebrow"><span>//</span>{t("OLÁ, MUNDO. EU SOU")}</div><h1><button type="button" className={nameExpressionVisible ? 'profile-name revealed' : 'profile-name'} aria-label={t('Ver expressão do nome')} aria-pressed={nameExpressionVisible} onClick={() => setNameExpressionVisible(value => !value)} onMouseLeave={() => setNameExpressionVisible(false)} onBlur={() => setNameExpressionVisible(false)}><span className="profile-name-text">Rodrigo Girodo<span className="green">.</span></span><span className="profile-name-expression" aria-hidden="true"><span className="value">{'`${'}</span><span className="purple">new</span>{' '}FullStackDeveloper().<span className="green">name</span><span className="value">{'}.' + '`'}</span></span></button>{t("Transformo ideias")}<br />{t("em")} <em>{t("projetos.")}</em></h1><p className="intro">{t("Engenheiro de Software • Full Stack • Engenharia de IA Aplicada")}<br />{t("Entre interfaces, APIs e bancos de dados, construo soluções que fazem sentido de ponta a ponta.")}</p><div className="actions"><button className="primary" data-page="projetos">{t("Explore os projetos")}</button><button className="secondary" data-page="contato">{t("Vamos conversar")}</button></div></div><TiltCard label={t("Cartão de código com perfil profissional")}><div className="code-top"><b></b><b></b><b></b><span>developer.ts</span></div><pre>{[
  <><span className="purple">abstract class</span> Developer {'{'}</>,
  <>{'  '}<span className="purple">constructor</span>(<span className="purple">readonly</span> name: <span className="key">string</span>) {'{}'}</>,
  <>{'}'}</>,
  <></>,
  <><span className="key">export default class</span> FullStackDeveloper <span className="purple">extends</span> Developer {'{'}</>,
  <>{'  '}<span className="purple">constructor</span>() {'{'}</>,
  <>{'    '}<span className="purple">super</span>(<span className="value">'Rodrigo Girodo'</span>);</>,
  <>{'  }'}</>,
  <></>,
  <>{'  '}<span className="purple">readonly</span> stack = {'{'}</>,
  <>{'    '}frontend: [<span className="value">'React'</span>, <span className="value">'TypeScript'</span>],</>,
  <>{'    '}backend: [<span className="value">'Node.js'</span>, <span className="value">'Java'</span>],</>,
  <>{'  };'}</>,
  <></>,
  <>{'  '}<span className="purple">readonly</span> focus = {'{'}</>,
  <>{'    '}interfaces: <span className="value">'{t('Com propósito')}'</span>,</>,
  <>{'    '}apis: <span className="value">'{t('Bem construídas')}'</span>,</>,
  <>{'    '}delivery: <span className="value">'{t('De ponta a ponta')}'</span>,</>,
  <>{'  };'}</>,
  <>{'}'}</>,
].map((line, index) => <span className="profile-code-line" key={index}><span className="line">{String(index + 1).padStart(2, '0')}</span><span>{line}</span>{'\n'}</span>)}</pre><div className="code-bottom">{t("✓ A próxima ideia começa com uma conversa.")}</div></TiltCard></div></>,
    sobre: <>
      <div className="eyebrow">{t("// UM POUCO ALÉM DO CÓDIGO")}</div>
      <h2>{t("Problemas complexos.")}<br />{t("Melhorias concretas.")}</h2>
      <p className="section-copy">{t("Sou Desenvolvedor Full Stack, com mais de quatro anos de experiência. Transformo desafios de performance, integrações e sistemas legados em melhorias para aplicações e operações, trabalhando com TypeScript, JavaScript, Node.js, React, AngularJS, PostgreSQL e SQL Server.")}</p>
      <p className="section-copy">{t("Minha experiência inclui aplicações web, APIs REST, otimização de consultas SQL e investigação de falhas em produção. Também atuo com liderança técnica, planejamento e decisões de arquitetura, mantendo participação direta no desenvolvimento.")}</p>
      <div className="cards">
        <article className="card"><span className="number">{t("01 / PERFORMANCE")}</span><h3>{t("Resultados mensuráveis.")}</h3><p>{t("Reduzi uma consulta de 10,6 s para cerca de 1,15 s, uma melhoria de aproximadamente 89% no tempo de execução. Também refatorei o backend de dois sistemas, com ganho aproximado de 20% de performance.")}</p></article>
        <article className="card"><span className="number">{t("02 / INTEGRAÇÕES")}</span><h3>{t("Conexões confiáveis.")}</h3><p>{t("Implementei e evoluí integrações com Asaas e Stone, com processamento assíncrono e prevenção de cobranças duplicadas, além de rastreamento em tempo real com Traccar e notificações via WebSocket.")}</p></article>
        <article className="card"><span className="number">{t("03 / MODERNIZAÇÃO")}</span><h3>{t("Evoluir sem perder o contexto.")}</h3><p>{t("Modernizei um CRM legado com React e TypeScript. Gosto de investigar a causa dos problemas e construir soluções que facilitem o trabalho de quem utiliza o sistema.")}</p></article>
      </div>
    </>,
    projetos: <Projects />,
    stack: <><div className="eyebrow">{t("// MINHA CAIXA DE FERRAMENTAS")}</div><h2>{t("Tecnologia a serviço da solução.")}</h2><p className="section-copy">{t("Ferramentas com as quais já trabalhei, organizadas pela parte do problema que ajudam a resolver.")}</p><div className="stack-group"><h3>01 / FRONTEND</h3><span className="tag tech-tag"><SiTypescript aria-hidden="true" />TypeScript</span><span className="tag tech-tag"><SiReact aria-hidden="true" />React</span><span className="tag tech-tag"><SiAngular aria-hidden="true" />AngularJS</span><span className="tag tech-tag"><SiJavascript aria-hidden="true" />JavaScript</span></div><div className="stack-group"><h3>{t("02 / BACKEND & DADOS")}</h3><span className="tag tech-tag"><SiNodedotjs aria-hidden="true" />Node.js</span><span className="tag tech-tag"><FaJava aria-hidden="true" />Java</span><span className="tag tech-tag"><TbApi aria-hidden="true" />APIs REST</span><span className="tag tech-tag"><SiPostgresql aria-hidden="true" />PostgreSQL</span><span className="tag tech-tag"><TbDatabase aria-hidden="true" />SQL Server</span><span className="tag tech-tag"><SiApachekafka aria-hidden="true" />Kafka</span></div><div className="stack-group"><h3>{t("03 / ENTREGA & ACESSO")}</h3><span className="tag tech-tag"><SiGit aria-hidden="true" />Git</span><span className="tag tech-tag"><SiDocker aria-hidden="true" />Docker</span><span className="tag tech-tag"><TbGitMerge aria-hidden="true" />CI/CD</span><span className="tag tech-tag"><SiKeycloak aria-hidden="true" />Keycloak</span><span className="tag tech-tag"><TbShieldLock aria-hidden="true" />RBAC</span></div></>,
    contato: <><div className="eyebrow">{t("// A PRÓXIMA CONVERSA")}</div><h2>{t("Vamos construir algo")}<br />{t("que faça sentido")}<span className="green">?</span></h2><p className="section-copy">{t("Uma ideia, um desafio técnico ou uma oportunidade. Entre em contato comigo pelos canais abaixo.")}</p><a className="contact-line" href="mailto:rodrigoaugusto96@outlook.com"><span className="contact-label"><FaEnvelope aria-hidden="true" />E-mail</span><span>rodrigoaugusto96@outlook.com</span></a><a className="contact-line" href="https://www.linkedin.com/in/roh-augusto96/" target="_blank" rel="noopener noreferrer"><span className="contact-label"><FaLinkedin aria-hidden="true" />LinkedIn</span><span>in/roh-augusto96 ↗</span></a><a className="contact-line" href="https://github.com/raugusto96/" target="_blank" rel="noopener noreferrer"><span className="contact-label"><FaGithub aria-hidden="true" />GitHub</span><span>github.com/raugusto96 ↗</span></a></>,
  }
  return <div className={['portfolio', light && 'light', largeText && 'large-text', highContrast && 'high-contrast'].filter(Boolean).join(' ')} onClick={handleClick}>

<header className="titlebar"><span className="brand" aria-label={t("Código")}>&lt;/&gt;</span>{textFiles.menu}<button ref={editButtonRef} className="edit-menu-trigger" aria-expanded={accessibilityOpen} aria-controls="accessibility-options" onClick={() => { const bounds = editButtonRef.current?.getBoundingClientRect(); if (bounds) setMenuPosition({ left: bounds.left, top: (editButtonRef.current?.closest('header')?.getBoundingClientRect().bottom ?? bounds.bottom) - 1 }) }} popoverTarget="accessibility-options" aria-label={t("Editar opções de acessibilidade")}>{t("Editar")}<svg className={accessibilityOpen ? 'edit-chevron open' : 'edit-chevron'} width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
<div id="accessibility-options" className="accessibility-menu" style={{ left: menuPosition.left, top: menuPosition.top }} popover="auto" onToggle={event => setAccessibilityOpen(event.newState === 'open')}>
  <button onClick={() => { document.getElementById('accessibility-options')?.hidePopover(); textFiles.openSettings() }}>{t("Abrir settings.json")}</button><h2>{t("Acessibilidade")}</h2>
  <label><input type="checkbox" checked={largeText} onChange={event => setLargeText(event.target.checked)} />{t("Textos maiores")}</label>
  <label><input type="checkbox" checked={highContrast} onChange={event => setHighContrast(event.target.checked)} />{t("Alto contraste")}</label>
  <button onClick={() => { setLargeText(false); setHighContrast(false) }}>{t("Restaurar padrão")}</button>
</div><button className="command" style={{ visibility: searchOpen ? 'hidden' : 'visible' }} data-search aria-label={t("Buscar uma seção")}><span>⌕</span> portfolio / full-stack-developer <kbd>Ctrl P</kbd></button><LocaleSelector /></header>
<div className="workspace">
<nav className="activity" aria-label={t("Ferramentas")}>
  <button id="explorer-toggle" className={explorerOpen ? 'selected' : ''} aria-expanded={explorerOpen} aria-controls="explorer" aria-label={explorerOpen ? t("Recolher explorador") : t("Abrir explorador")} data-tooltip={explorerOpen ? t("Recolher explorador") : t("Abrir explorador")}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5h6l2 2h10v13H3V7Z" /></svg>
  </button>
  <button data-search aria-label={t("Buscar páginas")} data-tooltip={t("Buscar páginas (Ctrl+P)")}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
  </button>
  <button className={page === 'projetos' ? 'selected' : ''} aria-current={page === 'projetos' ? 'page' : undefined} data-page="projetos" aria-label={t("Projetos")} data-tooltip={t("Projetos")}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
  </button>
  <button className={page === 'contato' ? 'selected' : ''} aria-current={page === 'contato' ? 'page' : undefined} data-page="contato" aria-label={t("Contato")} data-tooltip={t("Contato")}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 6 9 7 9-7" /></svg>
  </button>
  <div className="activity-bottom">
    <button id="theme" aria-label={light ? t("Ativar tema escuro") : t("Ativar tema claro")} data-tooltip={light ? t("Ativar tema escuro") : t("Ativar tema claro")}>
      {light ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>}
    </button>
    <button aria-keyshortcuts="Control+j Meta+j" id="terminal-toggle" aria-label={terminalOpen ? t("Ocultar terminal") : t("Mostrar terminal")} aria-expanded={terminalOpen} aria-controls="terminal" data-tooltip={(terminalOpen ? t("Ocultar terminal") : t("Mostrar terminal")) + ' (Ctrl+J)'}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m6 9 3 3-3 3m7 0h5" /></svg>
    </button>
  </div>
</nav>
{explorerOpen && <aside className="sidebar" id="explorer">
  <div className="side-title">{t("EXPLORADOR")}</div>
  <details className="explorer-section" open>
    <summary className="explorer-section-heading"><svg className="section-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 4 4 4-4 4" /></svg><span>PORTFOLIO</span>

    </summary>
    <div className="tree">
      {pageKeys.map(key => <button key={key} className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined} data-page={key}><i className={fileIcons[key].color}><img className="material-file-icon" src={`/icons/material/${fileIcons[key].icon}.svg`} alt="" aria-hidden="true" /></i>{files[key]}</button>)}

    </div>
    
  </details>
  <details className="explorer-section user-files-section" open>
    <summary className="explorer-section-heading"><svg className="section-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 4 4 4-4 4" /></svg><span>{t("EXPLORADOR")}</span>
      <button className="new-file-button" aria-label={t("Novo arquivo de texto")} title={t("Novo arquivo de texto (Alt+N)")} onClick={event => { event.preventDefault(); event.stopPropagation(); const section = event.currentTarget.closest('details'); if (section) section.open = true; textFiles.create() }}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3H5v18h14V9l-6-6Zm0 0v6h6M9 15h6m-3-3v6" /></svg>
      </button>
    </summary>
    <div className="tree">{textFiles.explorerFiles}</div>
  </details>
<div className="side-note"><span className="dot"></span>{t("Construído para conectar.")}<small>{t("Pessoas, ideias e código.")}</small></div></aside>}<div className="editor">
{(openPages.length > 0 || textFiles.hasOpen) && <nav className="tabs" aria-label={t("Arquivos abertos")}>
  {textFiles.tabs}{openPages.map(key => <div className={page === key ? 'editor-tab active' : 'editor-tab'} key={key}
    onMouseDown={event => { if (event.button === 1) event.preventDefault() }}
    onAuxClick={event => { if (event.button === 1) { event.preventDefault(); closePage(key) } }}>
    <button className="tab-open" data-page={key} aria-current={page === key ? 'page' : undefined}>
      <span className={fileIcons[key].color}><img className="material-file-icon" src={`/icons/material/${fileIcons[key].icon}.svg`} alt="" aria-hidden="true" /></span>{files[key]}
    </button>
    <button className="tab-close" aria-label={t("Fechar ") + files[key]} title={t("Fechar ") + files[key]} onClick={() => closePage(key)}>×</button>
  </div>)}
</nav>}
{page && <div className="breadcrumbs">portfolio <span>›</span> src <span>›</span> <span id="crumb">{files[page]}</span></div>}
<main id="content" className={SnakeGameView ? 'snake-main' : textFiles.active ? 'text-main' : page ? '' : 'welcome-main'} tabIndex={-1} ref={contentRef}>
{SnakeGameView ? <SnakeGameView onClose={closeSnake} onLog={logExecution} /> : textFiles.active ? textFiles.editor : page ? pages[page] : <section className="welcome" aria-label={t("Boas-vindas ao portfólio")}>
  <div className="welcome-heading"><div className="eyebrow">PORTFOLIO / RODRIGO GIRODO</div><h1>{t("Bem-vindo ao meu")}<br /><em>{t("espaço de trabalho.")}</em></h1><p>{t("Engenheiro de Software • Full Stack • Engenharia de IA Aplicada. Explore as ideias, as ferramentas e a pessoa por trás dos projetos.")}</p></div>
  <div className="welcome-columns">
    <section className="welcome-start"><h2>{t("Comece por aqui")}</h2>
      <button data-page="inicio"><span className="react"><svg className="welcome-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m9 9-3 3 3 3m6-6 3 3-3 3" /></svg></span><span>{t("Conheça meu trabalho")}<small>{t("Uma apresentação de ponta a ponta")}</small></span></button>
      <button data-page="sobre"><span className="purple"><svg className="welcome-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></svg></span><span>{t("Um pouco sobre mim")}<small>{t("Experiência, ideias e trajetória")}</small></span></button>
      <button data-page="projetos"><span className="gold"><svg className="welcome-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a23 23 0 0 0 18 0m-9 0v3" /></svg></span><span>{t("Explore os projetos")}<small>{t("Espaço para as soluções que construo")}</small></span></button>
      <button data-page="contato"><span className="coral"><svg className="welcome-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8 8 0 0 1-8 8H5l-3 3v-11a9 9 0 0 1 19 0Z" /><path d="M7 11h10m-10 4h6" /></svg></span><span>{t("Vamos conversar")}<small>{t("Uma ideia começa com uma conexão")}</small></span></button>
    </section>
    <section className="welcome-discover"><h2>{t("Explore o portfólio")}</h2>
      <button className="welcome-card" data-page="stack"><span className="blue"><svg className="welcome-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" /></svg></span><div><h3>{t("Minha caixa de ferramentas")}</h3><p>{t("As tecnologias que conectam a interface, os serviços e os dados.")}</p></div></button>
      <button className="welcome-card" onClick={() => setExplorerOpen(value => !value)}><span className="green"><svg className="welcome-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5h6l2 2h10v13H3V7Z" /></svg></span><div><h3>{t("Do seu jeito")}</h3><p>{t("Abra o explorador, navegue pelos arquivos e feche as abas quando quiser.")}</p></div></button>
      <div className="welcome-tip"><span><svg className="welcome-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg></span><p>{t("Encontre qualquer seção pela busca.")}<br /><kbd>Ctrl</kbd> + <kbd>P</kbd> {t("ou use o ícone da lupa.")}</p></div>
    </section>
  </div>
  
</section>}
</main>
<section className="terminal" id="terminal" hidden={!terminalOpen}><div className="terminal-tabs"><button className={panelTab === 'problems' ? 'panel-tab active' : 'panel-tab'} onClick={() => setPanelTab('problems')}>{t("PROBLEMAS")}<b>{textFiles.problems.length}</b></button><button className={panelTab === 'output' ? 'panel-tab active' : 'panel-tab'} onClick={() => setPanelTab('output')}>{t("SAÍDA")}</button><button className={panelTab === 'terminal' ? 'panel-tab active' : 'panel-tab'} onClick={() => setPanelTab('terminal')}>TERMINAL</button><button id="close-terminal" aria-label={t("Fechar terminal")}>×</button></div><div className="terminal-body" hidden={panelTab !== 'terminal'} ref={terminalRef}><div className="terminal-help">{t("Bem-vindo ao meu espaço. Digite")} <span>help</span> {t("para explorar.")}</div><div id="terminal-output" aria-live="polite">{output.map((line, index) => <div key={index}>{line}</div>)}</div><form id="terminal-form" onSubmit={runCommand}><label htmlFor="terminal-input"><span className="green">{editorSettings['terminal.userName']}</span><span className="muted">@portfolio</span> <span className="purple">~</span> <span className="green">❯</span></label><input value={command} onChange={e => setCommand(e.target.value)} id="terminal-input" autoComplete="off" spellCheck={false} aria-label={t("Comando do terminal")} /></form></div><div className="problems-body" hidden={panelTab !== 'problems'}>
  {textFiles.problems.length ? textFiles.problems.map((problem, index) => <button key={problem.fileId + ':' + index} className="problem-row" onClick={() => textFiles.openProblem(problem)}><span className={problem.severity === 'error' ? 'problem-error' : 'problem-warning'}>{problem.severity === 'error' ? '⊗' : '⚠'}</span><span className="problem-file">{problem.name}:{problem.line}:{problem.column}</span><span>{problem.message}</span></button>) : <p>{t("Nenhum problema detectado nos arquivos locais.")}</p>}
</div><div className="problems-body execution-output" ref={executionRef} hidden={panelTab !== 'output'}><div className="execution-toolbar"><span>{t('Execução no navegador')}</span><button onClick={() => setExecutionLog([])}>{t('Limpar saída')}</button></div>{executionLog.length > 0 ? executionLog.map(entry => <div key={entry.id} className="execution-line"><time>{entry.time}</time><span>{t(entry.message)}</span></div>) : <p>{t('Nenhuma saída registrada.')}</p>}{textFiles.message && <p>{textFiles.message}</p>}</div></section>
</div></div>
<div className="file-announcement" role="status">{textFiles.storageError ? t("Não foi possível salvar os rascunhos. Baixe seu texto pelo menu Arquivo.") : textFiles.message}</div><footer className="status"><span className="status-diagnostics"><span className="status-branch"><VscSourceControl aria-hidden="true" /> {gitStatus.branch}{gitStatus.dirty ? '*' : ''}</span><button onClick={() => { setTerminalOpen(true); setPanelTab('problems') }} aria-label={t('Erros: {0}', [textFiles.problems.filter(problem => problem.severity === 'error').length])} title={t('Erros: {0}', [textFiles.problems.filter(problem => problem.severity === 'error').length])}><VscError aria-hidden="true" />{textFiles.problems.filter(problem => problem.severity === 'error').length}</button><button onClick={() => { setTerminalOpen(true); setPanelTab('problems') }} aria-label={t('Avisos: {0}', [textFiles.problems.filter(problem => problem.severity === 'warning').length])} title={t('Avisos: {0}', [textFiles.problems.filter(problem => problem.severity === 'warning').length])}><VscWarning aria-hidden="true" />{textFiles.problems.filter(problem => problem.severity === 'warning').length}</button></span><span className="status-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21 3.7 13A5.5 5.5 0 0 1 12 5.8 5.5 5.5 0 0 1 20.3 13Z" /></svg>{t("Feito de curiosidade e amor")}</span><span className="status-right">{textFiles.languageControl} UTF-8　 {textFiles.active ? '◉ Local' : 'TypeScript React　 ◉ Local'}</span></footer>
{searchOpen && <div className="quick-open" ref={paletteRef} aria-label={t("Acesso rápido aos arquivos")} onBlur={event => {
  if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) closeSearch()
}}>
  <div className="quick-open-input"><span aria-hidden="true">⌕</span><input ref={searchInputRef} value={search} onChange={event => { setSearch(event.target.value); setSelectedResult(0) }}
    id="portfolio-quick-open" name="portfolio-quick-open" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} placeholder={t("Buscar arquivos pelo nome…")} aria-label={t("Buscar arquivos pelo nome")} role="combobox" aria-expanded={true} aria-controls="quick-open-results" aria-autocomplete="list"
    aria-activedescendant={results[selectedResult] ? 'result-' + results[selectedResult] : undefined}
    onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const delta = event.key === 'ArrowDown' ? 1 : -1
        setSelectedResult(previous => results.length ? (previous + delta + results.length) % results.length : 0)
      }
      if (event.key === 'Enter') { event.preventDefault(); const result = results[selectedResult]; if (result) selectResult(result) }
    }} /><button className="quick-open-close" aria-label={t("Fechar busca")} onClick={() => closeSearch(true)}>Esc</button></div>
  <div className="quick-open-heading"><span>{t("Ir para arquivo")}</span><span>Ctrl + P</span></div>
  <div id="quick-open-results" role="listbox" aria-label={t("Arquivos do portfólio")}>
    {results.map((key, index) => <button type="button" role="option" aria-selected={selectedResult === index} id={'result-' + key} key={key}
      className={selectedResult === index ? 'quick-result selected' : 'quick-result'} onMouseEnter={() => setSelectedResult(index)} onClick={() => selectResult(key)}>
      <span className={fileIcons[key].color}><img className="material-file-icon" src={`/icons/material/${fileIcons[key].icon}.svg`} alt="" aria-hidden="true" /></span><span>{files[key]}</span><small>portfolio / src</small>{openPages.includes(key) && <span className="quick-opened">{t("aberto")}</span>}
    </button>)}
    {!results.length && <p className="quick-empty" role="status">{t("Nenhum arquivo encontrado.")}</p>}
  </div>
  <div className="quick-open-footer"><span>{t("↑ ↓ navegar")}</span><span>{t("↵ abrir")}</span><span>{t("esc fechar")}</span></div>
</div>}

  </div>
}
export default App
