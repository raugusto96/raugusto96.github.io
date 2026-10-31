import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import './CodeEditor'
import { languageFor } from './languages'

export type FileProblem = { fileId: string; name: string; message: string; line: number; column: number; severity: 'error' | 'warning' }
monaco.typescript.typescriptDefaults.setEagerModelSync(true)
monaco.typescript.javascriptDefaults.setEagerModelSync(true)

type Document = { id: string; name: string; content: string; language?: string }

export default function Diagnostics({ documents, onProblems }: { documents: Document[]; onProblems: (items: FileProblem[]) => void }) {
  const owned = useRef(new Map<string, monaco.editor.ITextModel>())
  useEffect(() => {
    const valid = new Set(documents.map(file => `inmemory://portfolio/${file.id}`))
    for (const [uri, model] of owned.current) {
      if (!valid.has(uri)) { model.dispose(); owned.current.delete(uri) }
    }
    for (const file of documents) {
      const uri = monaco.Uri.parse(`inmemory://portfolio/${file.id}`)
      let model = monaco.editor.getModel(uri)
      const language = file.language ?? languageFor(file.name)
      if (!model) { model = monaco.editor.createModel(file.content, language, uri); owned.current.set(uri.toString(), model) }
      else {
        if (model.getLanguageId() !== language) monaco.editor.setModelLanguage(model, language)
        if (model.getValue() !== file.content) model.setValue(file.content)
      }
    }
    function collect() {
      const problems: FileProblem[] = []
      for (const file of documents) {
        for (const marker of monaco.editor.getModelMarkers({ resource: monaco.Uri.parse(`inmemory://portfolio/${file.id}`) })) {
          if (marker.severity !== monaco.MarkerSeverity.Error && marker.severity !== monaco.MarkerSeverity.Warning) continue
          problems.push({ fileId: file.id, name: file.name, message: marker.message, line: marker.startLineNumber, column: marker.startColumn, severity: marker.severity === monaco.MarkerSeverity.Error ? 'error' : 'warning' })
        }
      }
      onProblems(problems)
    }
    collect()
    const subscription = monaco.editor.onDidChangeMarkers(collect)
    return () => subscription.dispose()
  }, [documents, onProblems])
  useEffect(() => {
    const models = owned.current
    return () => { for (const model of models.values()) model.dispose(); models.clear() }
  }, [])
  return null
}
