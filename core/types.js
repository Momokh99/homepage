/**
 * Central type definitions for the extension.
 *
 * @module types
 */

/**
 * @typedef {Object} BackgroundConfig
 * @property {'color'|'image'} [type]
 * @property {string} [value]
 * @property {number} [blur]
 * @property {number} [dim]
 * @property {'none'|'gradient'|'stars'|'waves'|'shooting'} [animation]
 */

/**
 * @typedef {Object} WidgetInstance
 * @property {string} instanceId
 * @property {string} type
 * @property {Record<string, any>} [config]
 */

/**
 * @typedef {Object} GroupConfig
 * @property {number} [positionX]
 * @property {number} [positionY]
 */

/**
 * @typedef {Object} Settings
 * @property {boolean} [initialized]
 * @property {boolean} [setupComplete]
 * @property {BackgroundConfig} [background]
 * @property {WidgetInstance[]} [widgets]
 * @property {Record<string, GroupConfig>} [groups]
 */

/**
 * @typedef {Object} FieldBase
 * @property {string} key
 * @property {string} label
 */

/** @typedef {FieldBase & {type:'text'}} TextField */
/** @typedef {FieldBase & {type:'number', min?:number, max?:number, step?:number}} NumberField */
/** @typedef {FieldBase & {type:'range', min?:number, max?:number, step?:number}} RangeField */
/** @typedef {FieldBase & {type:'select', options:string[]}} SelectField */
/** @typedef {FieldBase & {type:'toggle'}} ToggleField */
/** @typedef {FieldBase & {type:'color'}} ColorField */
/** @typedef {FieldBase & {type:'list', itemSchema:Field[], itemDefaults?:Record<string, any>}} ListField */
/** @typedef {FieldBase & {type:'textarea', rows?:number, placeholder?:string}} TextareaField */

/**
 * A single settings control description. Discriminated on `type` so that a
 * typo in a widget's `settingsSchema` is a type error rather than a control
 * that silently renders as nothing.
 *
 * @typedef {TextField|NumberField|RangeField|SelectField|ToggleField|ColorField|ListField|TextareaField} Field
 */

/**
 * @typedef {Object} WidgetDefinition
 * @property {string} id
 * @property {string} name
 * @property {Record<string, any>} [defaults]
 * @property {Field[]} [settingsSchema]
 * @property {(this: WidgetDefinition, box: HTMLElement, config: Record<string, any>) => void} render
 */

export {}