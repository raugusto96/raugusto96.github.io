import { useSyncExternalStore } from 'react'
import english from './locales/en.json'

export type Locale = 'pt-BR' | 'en'
export type LocalePreference = Locale | 'auto'
const key = 'portfolio.locale.v1'
const subscribers = new Set<() => void>()
export function detectLocale(languages: readonly string[]): Locale {
  for (const value of languages) {
    const language = value.toLowerCase().split('-')[0]
    if (language === 'pt') return 'pt-BR'
    if (language === 'en') return 'en'
  }
  return 'pt-BR'
}
function readPreference(): LocalePreference {
  try { const saved = localStorage.getItem(key); if (saved === 'en' || saved === 'pt-BR') return saved } catch { /* Browser storage may be unavailable. */ }
  return 'auto'
}
let preference = readPreference()
function currentLocale(): Locale { return preference === 'auto' ? detectLocale(navigator.languages.length ? navigator.languages : [navigator.language]) : preference }
function notify() { document.documentElement.lang = currentLocale(); subscribers.forEach(callback => callback()) }
export function setLocalePreference(value: LocalePreference) {
  preference = value
  try { if (value === 'auto') localStorage.removeItem(key); else localStorage.setItem(key, value) } catch { /* Keep the choice for the current session. */ }
  notify()
}
window.addEventListener('languagechange', notify)
window.addEventListener('storage', event => { if (event.key === key || event.key === null) { preference = readPreference(); notify() } })
document.documentElement.lang = currentLocale()
export function useLocale() {
  useSyncExternalStore(callback => { subscribers.add(callback); return () => { subscribers.delete(callback) } }, () => `${preference}:${currentLocale()}`)
  return { locale: currentLocale(), preference, setPreference: setLocalePreference }
}
export function t(source: string, parameters: readonly (string | number)[] = []): string {
  const translation = currentLocale() === 'en' ? (english as Record<string, string>)[source] ?? source : source
  return translation.replace(/\{(\d+)\}/g, (match, index: string) => String(parameters[Number(index)] ?? match))
}
