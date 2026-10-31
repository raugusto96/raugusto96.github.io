import { t } from './i18n'
import { useEffect, useRef } from 'react'
import { defaultSettings } from './settings'
import { settingsModelUri, settingsSchema } from './settings-schema'
import type { PortfolioSettings } from './settings'
import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker'
import JsonWorker from 'monaco-editor/language/json/json.worker.js?worker'
import CssWorker from 'monaco-editor/language/css/css.worker.js?worker'
import HtmlWorker from 'monaco-editor/language/html/html.worker.js?worker'
import TsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker'

self.MonacoEnvironment = {
  getWorker(_id, label) {
    if (label === 'json') return new JsonWorker()
    if (['css', 'scss', 'less'].includes(label)) return new CssWorker()
    if (['html', 'handlebars', 'razor'].includes(label)) return new HtmlWorker()
    if (['typescript', 'javascript'].includes(label)) return new TsWorker()
    return new EditorWorker()
  },
}
loader.config({ monaco })
monaco.json.jsonDefaults.setDiagnosticsOptions({
  ...monaco.json.jsonDefaults.diagnosticsOptions,
  validate: true,
  schemas: [
    ...(monaco.json.jsonDefaults.diagnosticsOptions.schemas ?? []).filter(schema => schema.uri !== 'portfolio://schemas/settings'),
    { uri: 'portfolio://schemas/settings', fileMatch: [settingsModelUri], schema: settingsSchema },
  ],
})

export default function CodeEditor(props: {
  location?: { line: number; column: number; request: number }; settings: PortfolioSettings; id: string; content: string; language: string; theme: string; large: boolean;
  onChange: (value: string) => void; onSelectLanguage: () => void
}) {
  const settings = { ...defaultSettings, ...props.settings }
  const hostRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    function handleEditorKey(event: KeyboardEvent) {
      const editor = editorRef.current
      if (!editor?.hasTextFocus() || event.isComposing) return
      if (event.key === 'Tab' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault()
        event.stopImmediatePropagation()
        editor.trigger('keyboard', event.shiftKey ? 'outdent' : 'tab', {})
      } else if (event.key === 'Escape' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        // Move to the editor container so the next Tab can leave the editor.
        host?.focus()
      }
    }
    host.addEventListener('keydown', handleEditorKey, true)
    return () => host.removeEventListener('keydown', handleEditorKey, true)
  }, [])
  useEffect(() => {
    if (!props.location) return
    const editor = editorRef.current
    const position = { lineNumber: props.location.line, column: props.location.column }
    editor?.setPosition(position); editor?.revealPositionInCenter(position); editor?.focus()
  }, [props.location, props.id])
  return <div ref={hostRef} tabIndex={-1} style={{ height: '100%' }} aria-label={t("Área de edição. Tab indenta, Shift+Tab reduz a indentação. Escape permite sair pelo teclado.")}><Editor keepCurrentModel height="100%" path={`inmemory://portfolio/${props.id}`} value={props.content} language={props.language} theme={props.theme}
    onChange={value => props.onChange(value ?? '')}
    onMount={(editor, api) => {
      editorRef.current = editor
      editor.addAction({ id: 'portfolio.selectLanguage', label: t("Alterar linguagem do arquivo"), keybindings: [api.KeyMod.chord(api.KeyMod.CtrlCmd | api.KeyCode.KeyK, api.KeyCode.KeyM)], run: props.onSelectLanguage })
      editor.updateOptions({ tabFocusMode: false })
      if (props.location) {
        const position = { lineNumber: props.location.line, column: props.location.column }
        editor.setPosition(position); editor.revealPositionInCenter(position)
      }
      editor.focus()
    }}
    options={{ wordBasedSuggestions: props.id === 'portfolio-settings' ? 'off' : 'currentDocument', fixedOverflowWidgets: true, automaticLayout: true, fontSize: props.large ? Math.max(18, settings['editor.fontSize']) : settings['editor.fontSize'], lineHeight: props.large ? 28 : 24, minimap: { enabled: settings['editor.minimap.enabled'] }, tabSize: settings['editor.tabSize'], insertSpaces: settings['editor.insertSpaces'], tabFocusMode: false, detectIndentation: false, wordWrap: settings['editor.wordWrap'], lineNumbers: settings['editor.lineNumbers'], scrollBeyondLastLine: false, padding: { top: 16 }, ariaLabel: t("Editor de código"), accessibilitySupport: 'auto' }}
    loading={<p className="editor-loading">{t("Carregando editor…")}</p>} /></div>
}
