'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock } from 'lucide-react'
import type { DetailRecord } from './types'
import { formatSeconds } from './types'

interface DetailsTableProps {
  records: DetailRecord[]
  loading: boolean
  teamName?: string
}

export function DetailsTable({ records, loading, teamName }: DetailsTableProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Últimos Atendimentos
          {teamName && (
            <span className="text-muted-foreground font-normal ml-2">
              — {teamName}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Registros mais recentes com status de SLA
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <div className="px-6 py-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground text-sm">
            Selecione uma equipe para ver os detalhes
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Ticket</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[130px]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Tempo
                    </span>
                  </TableHead>
                  <TableHead className="w-[100px]">SLA Alvo</TableHead>
                  <TableHead className="w-[90px]">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs">
                      {record.ticketId}
                    </TableCell>
                    <TableCell className="text-sm">{record.agentName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={record.isBreached ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {record.isBreached ? 'Fora do SLA' : 'Dentro'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatSeconds(record.responseTimeSec)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatSeconds(record.slaTargetSec)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {/* fallback seguro se createdAt for inválido */}
                      {record.createdAt
                        ? new Date(record.createdAt).toLocaleDateString('pt-BR')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}