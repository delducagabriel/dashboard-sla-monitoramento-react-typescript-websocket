import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/sla/teams
// Retorna lista de equipes com SLA alvo, dado semi-estático,
// ideal para popular filtros no frontend.
export async function GET() {
  try {
    const teams = await db.team.findMany({
      include: {
        _count: {
          select: { agents: true, records: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Erro ao buscar equipes:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}