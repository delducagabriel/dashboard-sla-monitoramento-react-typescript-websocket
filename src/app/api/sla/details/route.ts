import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/sla/details?teamId=xxx&limit=50
// Retorna registros recentes de uma equipe para a tabela de detalhes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    if (!teamId) {
      return NextResponse.json(
        { error: 'O parâmetro "teamId" é obrigatório' },
        { status: 400 }
      )
    }

    const records = await db.slaRecord.findMany({
      where: { teamId },
      include: {
        agent: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Formata os dados para o frontend
    const formatted = records.map((r) => ({
      id: r.id,
      ticketId: r.ticketId,
      agentName: r.agent.name,
      status: r.status,
      slaTargetSec: r.slaTargetSec,
      responseTimeSec: r.responseTimeSec,
      // usa campo `status` do banco em vez de recalcular, fonte única de verdade
    isBreached: r.status === 'breached',
      createdAt: r.createdAt,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}