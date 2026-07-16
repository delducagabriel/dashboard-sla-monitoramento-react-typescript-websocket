import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/sla/history?teamId=xxx&days=30
// Retorna série temporal de compliance por dia
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const days = parseInt(searchParams.get('days') || '30', 10)

    if (days < 1 || days > 90) {
      return NextResponse.json(
        { error: 'O parâmetro "days" deve estar entre 1 e 90' },
        { status: 400 }
      )
    }

    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    // Filtro base: último N dias
    const whereClause: Record<string, unknown> = {
      createdAt: { gte: since },
    }

    // Filtro opcional por equipe
    if (teamId) {
      whereClause.teamId = teamId
    }

    // Busca todos os registros do período (volume é gerenciável: ~30 dias)
    const records = await db.slaRecord.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        responseTimeSec: true,
        slaTargetSec: true,
      },
    })

    const byDay = new Map<string, {
      total: number
      completed: number
      breached: number
      totalResponseSec: number
    }>()

    for (const r of records) {
    // toLocaleDateString preserva timezone local (UTC criaria off-by-one)
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

    // Converte para array ordenada por data
    const history = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        totalTickets: data.total,
        completed: data.completed,
        breached: data.breached,
        avgResponseSec: Math.round(data.totalResponseSec / data.total),
        complianceRate: Math.round((data.completed / data.total) * 1000) / 10,
      }))

    return NextResponse.json(history)
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}