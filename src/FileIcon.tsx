import { languageFor } from './languages'
const icons: Record<string, string> = { plaintext: 'document', json: 'json', javascript: 'javascript', typescript: 'typescript', sql: 'database', html: 'html', css: 'css', markdown: 'markdown', python: 'python', java: 'java', csharp: 'csharp', cpp: 'cpp', yaml: 'yaml', xml: 'xml', shell: 'console' }
export default function FileIcon({ name, language }: { name: string; language?: string }) {
  const selected = language ?? languageFor(name)
  const extension = name.split('.').pop()?.toLowerCase()
  const icon = selected === 'typescript' && extension === 'tsx' ? 'react_ts' : selected === 'javascript' && extension === 'jsx' ? 'react' : icons[selected] ?? 'document'
  return <img className="material-file-icon" src={'/icons/material/' + icon + '.svg'} alt="" aria-hidden="true" />
}
