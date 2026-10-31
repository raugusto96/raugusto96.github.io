import { defaultSettings } from './settings'

// Match only the application's settings model, never visitors' JSON drafts.
export const settingsModelUri = 'inmemory://portfolio/portfolio-settings'
export const settingsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    'editor.fontSize': { type: 'integer', minimum: 10, maximum: 32, enum: Array.from({ length: 23 }, (_, i) => i + 10), default: defaultSettings['editor.fontSize'] },
    'editor.tabSize': { type: 'integer', minimum: 1, maximum: 8, enum: [1, 2, 3, 4, 5, 6, 7, 8], default: defaultSettings['editor.tabSize'] },
    'editor.insertSpaces': { type: 'boolean', default: defaultSettings['editor.insertSpaces'] },
    'editor.wordWrap': { type: 'string', enum: ['off', 'on'], default: defaultSettings['editor.wordWrap'] },
    'editor.minimap.enabled': { type: 'boolean', default: defaultSettings['editor.minimap.enabled'] },
    'editor.lineNumbers': { type: 'string', enum: ['on', 'off'], default: defaultSettings['editor.lineNumbers'] },
    'workbench.colorTheme': { type: 'string', enum: ['vs-dark', 'vs', 'hc-black', 'hc-light'], default: defaultSettings['workbench.colorTheme'] },
    'terminal.userName': { type: 'string', minLength: 1, maxLength: 40, pattern: '^[^\\u0000-\\u001f\\u007f]*[^\\s\\u0000-\\u001f\\u007f][^\\u0000-\\u001f\\u007f]*$', default: defaultSettings['terminal.userName'] },
  },
} as const
