'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSLAStore } from '@/lib/sla-store'
import type { SlaSnapshot, AgentPerformance } from '@/components/dashboard/types'

export function useSLA() {
  const socketRef = useRef<Socket | null>(null)
  const {
    setSnapshot,
    setTopAgents,
    setConnected,
    isConnected,
  } = useSLAStore()

  useEffect(() => {
    // XTransformPort é necessário porque o Caddy proxy usa query param
    // para rotear para a porta correta. Ver documentação do gateway
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[WS] Conectado ao servidor SLA')
      setConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('[WS] Desconectado do servidor SLA')
      setConnected(false)
    })

    socket.on('sla-snapshot', (data: SlaSnapshot) => {
      setSnapshot(data)
    })

    socket.on('sla-agents', (data: AgentPerformance[]) => {
      setTopAgents(data)
    })

    socket.on('connect_error', (error) => {
      console.error('[WS] Erro de conexão:', error.message)
      setConnected(false)
    })

    // Cleanup → desconecta ao desmontar o componente
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [setSnapshot, setTopAgents, setConnected])

  return { isConnected }
}