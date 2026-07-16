import { create } from 'zustand'
import type { SlaSnapshot, AgentPerformance, TeamInfo, HistoryPoint, DetailRecord } from '@/components/dashboard/types'

interface SLAState {
  // Real-time (WebSocket)
  snapshot: SlaSnapshot | null
  topAgents: AgentPerformance[]
  isConnected: boolean

  // Filtros
  selectedTeamId: string | null

  // Dados semi-estáticos (API REST)
  teams: TeamInfo[]
  history: HistoryPoint[]
  details: DetailRecord[]

  // Actions
  setSnapshot: (snapshot: SlaSnapshot) => void
  setTopAgents: (agents: AgentPerformance[]) => void
  setConnected: (connected: boolean) => void
  setSelectedTeamId: (teamId: string | null) => void
  setTeams: (teams: TeamInfo[]) => void
  setHistory: (history: HistoryPoint[]) => void
  setDetails: (details: DetailRecord[]) => void
}

export const useSLAStore = create<SLAState>((set) => ({
  // Inicialização
  snapshot: null,
  topAgents: [],
  isConnected: false,
  selectedTeamId: null,
  teams: [],
  history: [],
  details: [],

  // Actions
  setSnapshot: (snapshot) => set({ snapshot }),
  setTopAgents: (topAgents) => set({ topAgents }),
  setConnected: (isConnected) => set({ isConnected }),
  setSelectedTeamId: (selectedTeamId) => set({ selectedTeamId }),
  setTeams: (teams) => set({ teams }),
  setHistory: (history) => set({ history }),
  setDetails: (details) => set({ details }),
}))