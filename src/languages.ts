export const languages = [
  { id: 'plaintext', label: 'Texto simples', ext: 'txt' },
  { id: 'json', label: 'JSON', ext: 'json' },
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'sql', label: 'SQL', ext: 'sql' },
  { id: 'html', label: 'HTML', ext: 'html' },
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'markdown', label: 'Markdown', ext: 'md' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'csharp', label: 'C#', ext: 'cs' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
  { id: 'yaml', label: 'YAML', ext: 'yml' },
  { id: 'xml', label: 'XML', ext: 'xml' },
  { id: 'shell', label: 'Shell', ext: 'sh' },
] as const
export function languageFor(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'jsx') return 'javascript'
  if (ext === 'tsx') return 'typescript'
  if (ext === 'yaml') return 'yaml'
  return languages.find(item => item.ext === ext)?.id ?? 'plaintext'
}

