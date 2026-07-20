import { describe, expect, it } from 'bun:test'
import { formatSeconds, formatPercent, complianceColor, complianceBg } from '../src/components/dashboard/types'

describe('formatSeconds', () => {
  it('formata segundos simples', () => {
    expect(formatSeconds(45)).toBe('45s')
    expect(formatSeconds(0)).toBe('0s')
    expect(formatSeconds(1)).toBe('1s')
  })

  it('formata minutos inteiros sem segundos residuais', () => {
    expect(formatSeconds(60)).toBe('1m')
    expect(formatSeconds(120)).toBe('2m')
    expect(formatSeconds(3600)).toBe('60m')
  })

  it('formata minutos com segundos residuais', () => {
    expect(formatSeconds(90)).toBe('1m 30s')
    expect(formatSeconds(187)).toBe('3m 7s')
    expect(formatSeconds(61)).toBe('1m 1s')
  })
})

describe('formatPercent', () => {
  it('formata com 1 casa decimal', () => {
    expect(formatPercent(94.856)).toBe('94.9%')
    expect(formatPercent(100)).toBe('100.0%')
    expect(formatPercent(0)).toBe('0.0%')
  })

  it('arredonda corretamente', () => {
    expect(formatPercent(94.85)).toBe('94.8%') // toFixed usa banker's rounding
    expect(formatPercent(94.84)).toBe('94.8%')
  })
})

describe('complianceColor', () => {
  it('retorna verde para compliance >= 95%', () => {
    expect(complianceColor(95)).toBe('text-emerald-600')
    expect(complianceColor(100)).toBe('text-emerald-600')
    expect(complianceColor(99.9)).toBe('text-emerald-600')
  })

  it('retorna amarelo para compliance >= 85% e < 95%', () => {
    expect(complianceColor(94.9)).toBe('text-amber-600')
    expect(complianceColor(85)).toBe('text-amber-600')
    expect(complianceColor(90)).toBe('text-amber-600')
  })

  it('retorna vermelho para compliance < 85%', () => {
    expect(complianceColor(84.9)).toBe('text-red-600')
    expect(complianceColor(0)).toBe('text-red-600')
    expect(complianceColor(50)).toBe('text-red-600')
  })
})

describe('complianceBg', () => {
  it('retorna bg verde para compliance >= 95%', () => {
    expect(complianceBg(95)).toBe('bg-emerald-50 border-emerald-200')
  })

  it('retorna bg amarelo para compliance >= 85%', () => {
    expect(complianceBg(90)).toBe('bg-amber-50 border-amber-200')
  })

  it('retorna bg vermelho para compliance < 85%', () => {
    expect(complianceBg(80)).toBe('bg-red-50 border-red-200')
  })
})