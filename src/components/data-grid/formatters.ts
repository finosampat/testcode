import { toDate } from './utils'

type Formatter = (value: unknown) => string

const blank = (v: unknown) => v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))

/** Ready-made `valueFormatter` factories. */
export const formatters = {
  number(options: Intl.NumberFormatOptions & { locale?: string } = {}): Formatter {
    const { locale, ...rest } = options
    const f = new Intl.NumberFormat(locale, rest)
    return (v) => (blank(v) ? '' : f.format(Number(v)))
  },
  currency(options: { currency?: string; locale?: string; maximumFractionDigits?: number } = {}): Formatter {
    const { currency = 'USD', locale, maximumFractionDigits } = options
    const f = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...(maximumFractionDigits != null
        ? { maximumFractionDigits, minimumFractionDigits: Math.min(maximumFractionDigits, 2) }
        : {}),
    })
    return (v) => (blank(v) ? '' : f.format(Number(v)))
  },
  /** `scale: 100` when values are already 0–100. */
  percent(options: { locale?: string; scale?: 1 | 100; maximumFractionDigits?: number } = {}): Formatter {
    const { locale, scale = 1, maximumFractionDigits = 1 } = options
    const f = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits })
    return (v) => (blank(v) ? '' : f.format(Number(v) / (scale === 100 ? 100 : 1)))
  },
  date(options: Intl.DateTimeFormatOptions & { locale?: string } = { dateStyle: 'medium' }): Formatter {
    const { locale, ...rest } = options
    const f = new Intl.DateTimeFormat(locale, Object.keys(rest).length ? rest : { dateStyle: 'medium' })
    return (v) => {
      const d = toDate(v)
      return d ? f.format(d) : ''
    }
  },
  dateTime(options: { locale?: string } = {}): Formatter {
    const f = new Intl.DateTimeFormat(options.locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (v) => {
      const d = toDate(v)
      return d ? f.format(d) : ''
    }
  },
}
