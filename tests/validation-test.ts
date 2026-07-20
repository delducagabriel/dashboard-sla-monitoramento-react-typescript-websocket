import { describe, expect, it } from 'bun:test'

// Lógica de validação extraída das API routes para teste isolado.

function validateHistoryParams(days: unknown, teamId: unknown): { valid: boolean; error?: string; days: number; teamId: string | null } {
  const parsedDays = parseInt(days === undefined || days === null ? '30' : String(days), 10)

  if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 90) {
    return { valid: false, error: 'O parâmetro "days" deve estar entre 1 e 90', days: 0, teamId: null }
  }

  return { valid: true, days: parsedDays, teamId: teamId ? String(teamId) : null }
}

function validateDetailsParams(teamId: unknown, limit: unknown): { valid: boolean; error?: string; teamId: string; limit: number } {
  if (!teamId) {
    return { valid: false, error: 'O parâmetro "teamId" é obrigatório', teamId: '', limit: 0 }
  }

  const parsedLimit = Math.min(parseInt(String(limit) || '50', 10), 100)

  return { valid: true, teamId: String(teamId), limit: isNaN(parsedLimit) ? 50 : parsedLimit }
}

// Tests

describe('validateHistoryParams', () => {
  it('aceita days=30 (default)', () => {
    const r = validateHistoryParams('30', null)
    expect(r.valid).toBe(true)
    expect(r.days).toBe(30)
    expect(r.teamId).toBeNull()
  })

  it('aceita days=1 (mínimo)', () => {
    const r = validateHistoryParams('1', null)
    expect(r.valid).toBe(true)
    expect(r.days).toBe(1)
  })

  it('aceita days=90 (máximo)', () => {
    const r = validateHistoryParams('90', null)
    expect(r.valid).toBe(true)
    expect(r.days).toBe(90)
  })

  it('rejeita days=0', () => {
    const r = validateHistoryParams('0', null)
    expect(r.valid).toBe(false)
  })

  it('rejeita days=91', () => {
    const r = validateHistoryParams('91', null)
    expect(r.valid).toBe(false)
  })

  it('rejeita days negativo', () => {
    const r = validateHistoryParams('-5', null)
    expect(r.valid).toBe(false)
  })

  it('rejeita days não numérico', () => {
    const r = validateHistoryParams('abc', null)
    expect(r.valid).toBe(false)
  })

  it('aceita teamId válido', () => {
    const r = validateHistoryParams('7', 'clxyz123')
    expect(r.valid).toBe(true)
    expect(r.teamId).toBe('clxyz123')
  })

  it('default para days vazio é 30', () => {
    const r = validateHistoryParams(undefined, null)
    expect(r.valid).toBe(true)
    expect(r.days).toBe(30)
  })
})

describe('validateDetailsParams', () => {
  it('aceita teamId + limit default', () => {
    const r = validateDetailsParams('clxyz', undefined)
    expect(r.valid).toBe(true)
    expect(r.teamId).toBe('clxyz')
    expect(r.limit).toBe(50)
  })

  it('rejeita teamId ausente', () => {
    const r = validateDetailsParams(null, undefined)
    expect(r.valid).toBe(false)
  })

  it('rejeita teamId vazio', () => {
    const r = validateDetailsParams('', undefined)
    expect(r.valid).toBe(false)
  })

  it('limit é capado em 100', () => {
    const r = validateDetailsParams('clxyz', '200')
    expect(r.limit).toBe(100)
  })

  it('limit=0 retorna 0 (sem resultados)', () => {
    const r = validateDetailsParams('clxyz', '0')
    expect(r.limit).toBe(0)
  })
})