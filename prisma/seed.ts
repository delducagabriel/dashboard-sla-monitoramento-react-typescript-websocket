import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// Dados de equipes com SLAs diferenciados por setor
const teams = [
  { name: 'Suporte N1', sector: 'Operações', slaTarget: 240 },    // 4 min
  { name: 'Suporte N2', sector: 'Operações', slaTarget: 600 },    // 10 min
  { name: 'Financeiro', sector: 'Back-office', slaTarget: 1800 },  // 30 min
  { name: 'Comercial', sector: 'Vendas', slaTarget: 480 },         // 8 min
  { name: 'Onboarding', sector: 'Customer Success', slaTarget: 3600 }, // 60 min
]

// Operadores por equipe (3-4 por equipe)
const agentsByTeam: Record<string, string[]> = {
  'Suporte N1': ['Ana Costa', 'Bruno Lima', 'Carla Mendes'],
  'Suporte N2': ['Diego Souza', 'Elena Rocha', 'Fabio Alves', 'Gabriela Nunes'],
  'Financeiro': ['Henrique Dias', 'Isabela Ferreira', 'Juliana Martins'],
  'Comercial': ['Lucas Oliveira', 'Marina Santos', 'Nicolas Pereira', 'Olivia Barros'],
  'Onboarding': ['Paulo Ribeiro', 'Rafaela Campos', 'Samuel Gomes'],
}

function generateResponseTime(slaTarget: number): number {
  // Box-Muller para distribuição normal, depois exponencial
  const u1 = Math.random()
  const u2 = Math.random()
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  
  // Média = 60% do SLA, desvio padrão = 25% do SLA
  const mean = slaTarget * 0.6
  const stdDev = slaTarget * 0.25
  
  let responseTime = mean + normal * stdDev
  
  // Floor em 5 segundos (ninguém atende em 0s)
  responseTime = Math.max(5, Math.round(responseTime))
  
  return responseTime
}

async function main() {
  console.log('Seed: Limpando dados existentes...')
  await prisma.slaRecord.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.team.deleteMany()

  console.log('Seed: Criando equipes e operadores...')

  const teamMap = new Map<string, string>()

  for (const team of teams) {
    const created = await prisma.team.create({
      data: {
        name: team.name,
        sector: team.sector,
      },
    })
    teamMap.set(team.name, created.id)
    console.log(`  Equipe: ${team.name} (${team.sector}) — SLA alvo: ${team.slaTarget}s`)
  }

  // Criar operadores
  const agentMap = new Map<string, { id: string; teamId: string; teamName: string }>()

  for (const [teamName, agentNames] of Object.entries(agentsByTeam)) {
    const teamId = teamMap.get(teamName)!
    for (const name of agentNames) {
      const agent = await prisma.agent.create({
        data: {
          name,
          teamId,
        },
      })
      agentMap.set(name, { id: agent.id, teamId, teamName })
    }
    console.log(`  ${teamName}: ${agentNames.length} operadores criados`)
  }

  console.log('Seed: Gerando registros de SLA (30 dias)...')

  // Gerar 30 dias de dados, ~500 registros por equipe = ~2.500 total por dia variável
  const now = new Date()
  const totalRecords: Prisma.SlaRecordCreateManyInput[] = []

  for (const team of teams) {
    const teamAgents = Array.from(agentMap.entries())
      .filter(([, v]) => v.teamName === team.name)
      .map(([, v]) => v)

    // ~500 registros por equipe distribuídos em 30 dias
    // Variação: mais registros em dias úteis, menos no fim de semana
    const recordsPerDay = Math.ceil(500 / 30)

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const date = new Date(now)
      date.setDate(date.getDate() - dayOffset)
      const dayOfWeek = date.getDay()
      
      // Dias úteis (seg-sex) têm ~30% mais volume
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
      const dayMultiplier = isWeekday ? 1.0 : 0.65
      
      const dayRecords = Math.round(recordsPerDay * dayMultiplier)

      for (let i = 0; i < dayRecords; i++) {
        // Distribuir registros ao longo das horas úteis (8h-20h)
        const hour = 8 + Math.random() * 12
        const minute = Math.random() * 60
        const second = Math.random() * 60
        
        const createdAt = new Date(date)
        createdAt.setHours(Math.floor(hour), Math.floor(minute), Math.floor(second))

        const responseTime = generateResponseTime(team.slaTarget)
        const status = responseTime <= team.slaTarget ? 'completed' : 'breached'

        // Distribui aleatoriamente entre os operadores da equipe
        const agent = teamAgents[Math.floor(Math.random() * teamAgents.length)]

        totalRecords.push({
          agentId: agent.id,
          teamId: agent.teamId,
          // FIX #15: crypto.randomUUID() — sem risco de colisão (vs Math.random com 900k valores)
        ticketId: `TKT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          status,
          slaTargetSec: team.slaTarget,
          responseTimeSec: responseTime,
          createdAt,
        })
      }
    }
  }

  // Batch insert em chunks de 500 (SQLite tem limite de variáveis por query)
  const CHUNK_SIZE = 500
  for (let i = 0; i < totalRecords.length; i += CHUNK_SIZE) {
    const chunk = totalRecords.slice(i, i + CHUNK_SIZE)
    await prisma.slaRecord.createMany({ data: chunk })
    console.log(`  Inseridos ${Math.min(i + CHUNK_SIZE, totalRecords.length)}/${totalRecords.length} registros...`)
  }

  // Estatísticas
  const completed = totalRecords.filter(r => r.status === 'completed').length
  const breached = totalRecords.filter(r => r.status === 'breached').length
  const complianceRate = ((completed / totalRecords.length) * 100).toFixed(1)

  console.log('\nSeed finalizado!')
  console.log(`  Total de registros: ${totalRecords.length}`)
  console.log(`  Dentro do SLA: ${completed} (${complianceRate}%)`)
  console.log(`  Fora do SLA: ${breached} (${(100 - parseFloat(complianceRate)).toFixed(1)}%)`)
  console.log(`  Equipes: ${teams.length}`)
  console.log(`  Operadores: ${Object.values(agentsByTeam).flat().length}`)
  console.log(`  Período: 30 dias`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())