import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

// Prisma Singleton
// Evita múltiplas conexões com hot-reload do Bun
// Mesmo padrão do src/lib/db.ts do Next.js

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// HTTP + Socket.io

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    // CORS restrito — origin '*' permite qualquer site conectar
    // Em produção, use env var com domínios permitidos separados por vírgula
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Tipos 
// Em produção, viveriam num shared package (monorepo)
interface TeamKPI {
  teamId: string
  teamName: string
  sector: string
  totalTickets: number
  completedWithinSLA: number
  breached: number
  complianceRate: number
  avgResponseTimeSec: number
  slaTargetSec: number
}

interface SlaSnapshot {
  timestamp: string
  teams: TeamKPI[]
  globalCompliance: number
  globalAvgResponseSec: number
  globalTotalTickets: number
}

interface AgentPerformance {
  agentId: string
  agentName: string
  teamName: string
  totalTickets: number
  complianceRate: number
  avgResponseTimeSec: number
}

// Intervalo de push

const PUSH_INTERVAL_MS = 3000

// Mutex para broadcast
// Evita race condition quando múltiplos clientes conectam
// quase ao mesmo tempo e disparam broadcastSnapshot concorrentemente

let isBroadcasting = false

// Queries otimizadas 
async function getTeamKPIs(): Promise<TeamKPI[]> {
  const results = await prisma.$queryRaw<
    Array<{
      teamId: string
      teamName: string
      sector: string
      slaTargetSec: number
      totalTickets: bigint
      completed: bigint
      breached: bigint
      avgResponse: number | null
    }>
  >`
    SELECT
      t.id as "teamId",
      t.name as "teamName",
      t.sector,
      MAX(r."slaTargetSec") as "slaTargetSec",
      COUNT(*) as "totalTickets",
      SUM(CASE WHEN r."responseTimeSec" <= r."slaTargetSec" THEN 1 ELSE 0 END) as "completed",
      SUM(CASE WHEN r."responseTimeSec" > r."slaTargetSec" THEN 1 ELSE 0 END) as "breached",
      AVG(r."responseTimeSec") as "avgResponse"
    FROM "SlaRecord" r
    JOIN "Team" t ON r."teamId" = t.id
    GROUP BY t.id, t.name, t.sector
  `

  return results.map((r) => ({
    teamId: r.teamId,
    teamName: r.teamName,
    sector: r.sector,
    totalTickets: Number(r.totalTickets),
    completedWithinSLA: Number(r.completed),
    breached: Number(r.breached),
    complianceRate: Number(r.totalTickets) > 0
      ? Number(r.completed) / Number(r.totalTickets) * 100
      : 0,
    avgResponseTimeSec: Math.round(r.avgResponse ?? 0),
    slaTargetSec: Number(r.slaTargetSec),
  }))
}

async function getTopAgents(limit = 5): Promise<AgentPerformance[]> {
  // LIMIT é constante (5), não aceita input externo — sem risco de SQL injection
  // Se precisar ser dinâmico, usar Prisma.sql`LIMIT ${Prisma.int(limit)}`
  const results = await prisma.$queryRaw<
    Array<{
      agentId: string
      agentName: string
      teamName: string
      totalTickets: bigint
      completed: bigint
      avgResponse: number | null
    }>
  >`
    SELECT
      a.id as "agentId",
      a.name as "agentName",
      t.name as "teamName",
      COUNT(*) as "totalTickets",
      SUM(CASE WHEN r."responseTimeSec" <= r."slaTargetSec" THEN 1 ELSE 0 END) as "completed",
      AVG(r."responseTimeSec") as "avgResponse"
    FROM "SlaRecord" r
    JOIN "Agent" a ON r."agentId" = a.id
    JOIN "Team" t ON a."teamId" = t.id
    GROUP BY a.id, a.name, t.name
    ORDER BY "completed" DESC
    LIMIT 5
  `

  return results.map((r) => ({
    agentId: r.agentId,
    agentName: r.agentName,
    teamName: r.teamName,
    totalTickets: Number(r.totalTickets),
    complianceRate: Number(r.totalTickets) > 0
      ? Number(r.completed) / Number(r.totalTickets) * 100
      : 0,
    avgResponseTimeSec: Math.round(r.avgResponse ?? 0),
  }))
}

// Simulação de dados
const teamNames = ['Suporte N1', 'Suporte N2', 'Financeiro', 'Comercial', 'Onboarding']
const slaTargets: Record<string, number> = {
  'Suporte N1': 240,
  'Suporte N2': 600,
  'Financeiro': 1800,
  'Comercial': 480,
  'Onboarding': 3600,
}

async function insertSimulatedRecords() {
  const count = 1 + Math.floor(Math.random() * 3)

  for (let i = 0; i < count; i++) {
    const teamName = teamNames[Math.floor(Math.random() * teamNames.length)]
    const team = await prisma.team.findUnique({ where: { name: teamName } })
    if (!team) continue

    const agents = await prisma.agent.findMany({
      where: { teamId: team.id, isActive: true },
    })
    if (agents.length === 0) continue

    const agent = agents[Math.floor(Math.random() * agents.length)]
    const slaTarget = slaTargets[teamName]!

    const u1 = Math.random()
    const u2 = Math.random()
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const responseTime = Math.max(5, Math.round(slaTarget * 0.6 + normal * slaTarget * 0.25))

    // FIX #15: crypto.randomUUID() elimina risco de colisão vs Math.random()
    await prisma.slaRecord.create({
      data: {
        agentId: agent.id,
        teamId: team.id,
        ticketId: `TKT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        status: responseTime <= slaTarget ? 'completed' : 'breached',
        slaTargetSec: slaTarget,
        responseTimeSec: responseTime,
      },
    })
  }
}

// Event loop principal

async function broadcastSnapshot() {
  if (isBroadcasting) return
  isBroadcasting = true

  try {
    await insertSimulatedRecords()
    const teams = await getTeamKPIs()

    const globalTotalTickets = teams.reduce((acc, t) => acc + t.totalTickets, 0)
    const globalCompleted = teams.reduce((acc, t) => acc + t.completedWithinSLA, 0)
    const globalCompliance = globalTotalTickets > 0
      ? (globalCompleted / globalTotalTickets) * 100
      : 0
    const globalAvgResponse = globalTotalTickets > 0
      ? Math.round(teams.reduce((acc, t) => acc + t.avgResponseTimeSec * t.totalTickets, 0) / globalTotalTickets)
      : 0

    const snapshot: SlaSnapshot = {
      timestamp: new Date().toISOString(),
      teams,
      globalCompliance: Math.round(globalCompliance * 10) / 10,
      globalAvgResponseSec: globalAvgResponse,
      globalTotalTickets,
    }

    const topAgents = await getTopAgents(5)

    io.emit('sla-snapshot', snapshot)
    io.emit('sla-agents', topAgents)

    console.log(
      `[${new Date().toISOString()}] Push: ${globalTotalTickets} tickets, ` +
      `${globalCompliance.toFixed(1)}% compliance, ` +
      `${io.engine.clientsCount} clients`
    )
  } catch (error) {
    console.error('Erro no broadcast:', error)
  } finally {
    isBroadcasting = false
  }
}

// Conexões

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id} (total: ${io.engine.clientsCount})`)
  broadcastSnapshot()

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id} (total: ${io.engine.clientsCount - 1})`)
  })
})

// Startup
const PORT = 3003

// Salvar referência do intervalo para limpar no shutdown
let broadcastTimer: ReturnType<typeof setInterval>

httpServer.listen(PORT, () => {
  console.log(`SLA WebSocket service rodando na porta ${PORT}`)
  broadcastSnapshot()
  broadcastTimer = setInterval(broadcastSnapshot, PUSH_INTERVAL_MS)
})

// Graceful shutdown correto, limpa intervalo antes de fechar
function shutdown(signal: string) {
  console.log(`Recebido ${signal}, encerrando serviço...`)
  clearInterval(broadcastTimer)
  httpServer.close(() => {
    prisma.$disconnect()
    console.log('Serviço encerrado')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))