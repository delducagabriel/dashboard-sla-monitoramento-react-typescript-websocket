'use client'

import { useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSLA } from '@/hooks/use-sla'
import { useSLAStore } from '@/lib/sla-store'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { ComplianceChart } from '@/components/dashboard/compliance-chart'
import { TeamBarChart } from '@/components/dashboard/team-bar-chart'
import { TopAgents } from '@/components/dashboard/top-agents'
import { DetailsTable } from '@/components/dashboard/details-table'
import { DashboardFilters } from '@/components/dashboard/filters'

// Constants
const STALE_TIME_MS = 5 * 60 * 1000

export default function DashboardPage() {
  // WebSocket: dados em tempo real
  useSLA()

  const {
    snapshot,
    topAgents,
    isConnected,
    selectedTeamId,
    teams,
    history,
    details,
    setSelectedTeamId,
    setTeams,
    setHistory,
    setDetails,
  } = useSLAStore()

  // Queries (dados semi-estáticos via API REST)

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['sla-teams'],
    queryFn: async () => {
      const res = await fetch('/api/sla/teams')
      if (!res.ok) throw new Error('Erro ao buscar equipes')
      return res.json()
    },
    staleTime: STALE_TIME_MS,
  })

  // Sincroniza dados do React Query com Zustand
  useEffect(() => {
    if (teamsData) setTeams(teamsData)
  }, [teamsData, setTeams])

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['sla-history', selectedTeamId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedTeamId) params.set('teamId', selectedTeamId)
      const res = await fetch(`/api/sla/history?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar histórico')
      return res.json()
    },
    staleTime: STALE_TIME_MS,
  })

  useEffect(() => {
    if (historyData) setHistory(historyData)
  }, [historyData, setHistory])

  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['sla-details', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return []
      const res = await fetch(`/api/sla/details?teamId=${selectedTeamId}`)
      if (!res.ok) throw new Error('Erro ao buscar detalhes')
      return res.json()
    },
    enabled: !!selectedTeamId,
    staleTime: 30 * 1000, // 30s para detalhes (mais dinâmicos)
  })

  useEffect(() => {
    if (detailsData) setDetails(detailsData)
  }, [detailsData, setDetails])

  // Handlers
  const handleTeamChange = useCallback(
    (teamId: string | null) => {
      setSelectedTeamId(teamId)
    },
    [setSelectedTeamId]
  )

  // Derived state
  // Filtra equipes no snapshot quando há seleção
  const filteredTeams = selectedTeamId
    ? snapshot?.teams.filter((t) => t.teamId === selectedTeamId) || []
    : snapshot?.teams || []

  const selectedTeamName = selectedTeamId
    ? teams.find((t) => t.id === selectedTeamId)?.name
    : undefined

  // Render

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Header + Filtros */}
        <DashboardFilters
          teams={teams}
          selectedTeamId={selectedTeamId}
          onTeamChange={handleTeamChange}
          isConnected={isConnected}
        />

        {/* KPI Cards — sempre visíveis, atualizados via WebSocket */}
        <KpiCards snapshot={snapshot} />

        {/* Grid de gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Compliance histórico — 2/3 da largura */}
          <div className="lg:col-span-2">
            <ComplianceChart data={history} loading={historyLoading} />
          </div>

          {/* Top agentes — 1/3 da largura */}
          <div>
            <TopAgents agents={topAgents} loading={!topAgents.length} />
          </div>
        </div>

        {/* Gráfico por equipe — largura total */}
        <TeamBarChart teams={filteredTeams} loading={teamsLoading} />

        {/* Tabela de detalhes — aparece quando uma equipe é selecionada */}
        <DetailsTable
          records={details}
          loading={detailsLoading}
          teamName={selectedTeamName}
        />
      </div>
    </main>
  )
}