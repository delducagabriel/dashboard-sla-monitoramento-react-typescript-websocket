import { describe, expect, it } from 'bun:test'

// Lógica de agregação extraída do history/route.ts para teste isolado
// Em produção, essa função seria exportada de um módulo separado

interface Record {
  createdAt: Date
  responseTimeSec: number
  slaTargetSec: number
}

interface DayAggregate {
  total: number
  completed: number
  breached: number
  totalResponseSec: number
}

interface HistoryPoint {
  date: string
  totalTickets: number
  completed: number
  breached: number
  avgResponseSec: number
  complianceRate: number
}

function aggregateByDay(records: Record[]): HistoryPoint[] {
  const byDay = new Map<string, DayAggregate>()

  for (const r of records) {
    const day = r.createdAt.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

    if (!byDay.has(day)) {
      byDay.set(day, { total: 0, completed: 0, breached: 0, totalResponseSec: 0 })
    }

    const entry = byDay.get(day)!
    entry.total++
    entry.totalResponseSec += r.responseTimeSec

    if (r.responseTimeSec <= r.slaTargetSec) {
      entry.completed++
    } else {
      entry.breached++
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      totalTickets: data.total,
      completed: data.completed,
      breached: data.breached,
      avgResponseSec: Math.round(data.totalResponseSec / data.total),
      complianceRate: Math.round((data.completed / data.total) * 1000) / 10,
    }))
}

// ─── Tests ────────────────────────────────────────────────────────

describe('aggregateByDay', () => {
  it('agrega registros por dia corretamente', () => {
    const records: Record[] = [
      { createdAt: new Date('2026-07-15T10:00:00'), responseTimeSec: 100, slaTargetSec: 120 },
      { createdAt: new Date('2026-07-15T14:00:00'), responseTimeSec: 150, slaTargetSec: 120 },
      { createdAt: new Date('2026-07-16T09:00:00'), responseTimeSec: 80, slaTargetSec: 120 },
    ]

    const result = aggregateByDay(records)

    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2026-07-15')
    expect(result[0].totalTickets).toBe(2)
    expect(result[0].completed).toBe(1)
    expect(result[0].breached).toBe(1)
    expect(result[0].avgResponseSec).toBe(125) // (100+150)/2
    expect(result[0].complianceRate).toBe(50.0) // 1/2 * 100

    expect(result[1].date).toBe('2026-07-16')
    expect(result[1].totalTickets).toBe(1)
    expect(result[1].completed).toBe(1)
    expect(result[1].breached).toBe(0)
  })

  it('retorna array vazio para lista vazia', () => {
    expect(aggregateByDay([])).toEqual([])
  })

  it('lida com compliance 100% (todos dentro do SLA)', () => {
    const records: Record[] = [
      { createdAt: new Date('2026-07-15T10:00:00'), responseTimeSec: 50, slaTargetSec: 120 },
      { createdAt: new Date('2026-07-15T11:00:00'), responseTimeSec: 100, slaTargetSec: 120 },
    ]

    const result = aggregateByDay(records)
    expect(result[0].complianceRate).toBe(100.0)
    expect(result[0].breached).toBe(0)
  })

  it('lida com compliance 0% (todos fora do SLA)', () => {
    const records: Record[] = [
      { createdAt: new Date('2026-07-15T10:00:00'), responseTimeSec: 200, slaTargetSec: 120 },
      { createdAt: new Date('2026-07-15T11:00:00'), responseTimeSec: 300, slaTargetSec: 120 },
    ]

    const result = aggregateByDay(records)
    expect(result[0].complianceRate).toBe(0.0)
    expect(result[0].completed).toBe(0)
    expect(result[0].breached).toBe(2)
  })

  it('ordena por data cronologicamente', () => {
    const records: Record[] = [
      { createdAt: new Date('2026-07-20T10:00:00'), responseTimeSec: 50, slaTargetSec: 120 },
      { createdAt: new Date('2026-07-10T10:00:00'), responseTimeSec: 50, slaTargetSec: 120 },
      { createdAt: new Date('2026-07-15T10:00:00'), responseTimeSec: 50, slaTargetSec: 120 },
    ]

    const result = aggregateByDay(records)
    expect(result[0].date).toBe('2026-07-10')
    expect(result[1].date).toBe('2026-07-15')
    expect(result[2].date).toBe('2026-07-20')
  })

  it('calcula avgResponseSec como média arredondada', () => {
    const records: Record[] = [
      { createdAt: new Date('2026-07-15T10:00:00'), responseTimeSec: 100, slaTargetSec: 120 },
      { createdAt: new Date('2026-07-15T11:00:00'), responseTimeSec: 200, slaTargetSec: 120 },
    ]

    const result = aggregateByDay(records)
    expect(result[0].avgResponseSec).toBe(150)
  })

  it('arredonda complianceRate para 1 casa decimal', () => {
    // 1 completed + 2 breached = 33.333...%
    const records: Record[] = [
      { createdAt: new Date('2026-07-15T10:00:00'), responseTimeSec: 50, slaTargetSec: 120 },
      { createdAt: new Date('2026-07-15T11:00:00'), responseTimeSec: 200, slaTargetSec: 120 },
      { createdAt: new Date('2026-07-15T12:00:00'), responseTimeSec: 200, slaTargetSec: 120 },
    ]

    const result = aggregateByDay(records)
    expect(result[0].complianceRate).toBe(33.3)
  })
})