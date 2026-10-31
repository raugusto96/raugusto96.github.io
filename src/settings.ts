import { t } from './i18n'
export const defaultSettings = {
  'editor.fontSize': 14,
  'editor.tabSize': 2,
  'editor.insertSpaces': true,
  'editor.wordWrap': 'off' as 'off' | 'on',
  'editor.minimap.enabled': false,
  'editor.lineNumbers': 'on' as 'on' | 'off',
  'workbench.colorTheme': 'vs-dark' as 'vs-dark' | 'vs' | 'hc-black' | 'hc-light',
  'terminal.userName': 'visitante',
}
export type PortfolioSettings = typeof defaultSettings
export const settingsKey = 'portfolio.settings.v1'
export function parseSettings(content: string): PortfolioSettings {
  const data: unknown = JSON.parse(content)
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(t("As configurações devem ser um objeto JSON."))
  const value = data as Record<string, unknown>
  for (const key of Object.keys(value)) if (!(key in defaultSettings)) throw new Error(t("Configuração não suportada: {0}", [key]))
  const merged = { ...defaultSettings, ...value }
  for (const [key, min, max] of [['editor.fontSize', 10, 32], ['editor.tabSize', 1, 8]] as const) {
    if (!Number.isInteger(merged[key]) || Number(merged[key]) < min || Number(merged[key]) > max) throw new Error(t("{0}: use um inteiro entre {1} e {2}.", [key, min, max]))
  }
  for (const key of ['editor.insertSpaces', 'editor.minimap.enabled'] as const) if (typeof merged[key] !== 'boolean') throw new Error(t("{0}: use true ou false.", [key]))
  if (!['on', 'off'].includes(String(merged['editor.wordWrap']))) throw new Error(t("editor.wordWrap: use \"on\" ou \"off\"."))
  if (!['on', 'off'].includes(String(merged['editor.lineNumbers']))) throw new Error(t("editor.lineNumbers: use \"on\" ou \"off\"."))
  if (!['vs-dark', 'vs', 'hc-black', 'hc-light'].includes(String(merged['workbench.colorTheme']))) throw new Error(t("workbench.colorTheme: use \"vs-dark\", \"vs\", \"hc-black\" ou \"hc-light\"."))
  if (typeof merged['terminal.userName'] !== 'string' || !merged['terminal.userName'].trim() || merged['terminal.userName'].length > 40 || /[\x00-\x1f\x7f]/.test(merged['terminal.userName'])) throw new Error(t("terminal.userName: use um nome de 1 a 40 caracteres, sem quebras de linha."))
  return merged as PortfolioSettings
}
export function loadSettings(): PortfolioSettings {
  try { return parseSettings(localStorage.getItem(settingsKey) ?? '{}') } catch { return { ...defaultSettings } }
}
