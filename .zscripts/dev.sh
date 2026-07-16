#!/usr/bin/env bash
set -euo pipefail

echo "=== Dashboard SLA — Startup ==="

# Gera cliente Prisma (se necessário)
echo "[1/4] Gerando cliente Prisma..."
bunx prisma generate 2>/dev/null

# Sincroniza schema com banco
echo "[2/4] Sincronizando schema com banco..."
bunx prisma db push 2>/dev/null

# Verifica se há dados, se não, faz seed
RECORDS=$(bun -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.slaRecord.count().then(c => { console.log(c); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$RECORDS" = "0" ] || [ -z "$RECORDS" ]; then
  echo "[3/4] Inserindo dados de seed..."
  bun run prisma/seed.ts
else
  echo "[3/4] Banco já tem $RECORDS registros — pulando seed"
fi

# Inicia Next.js e mini-service WS
echo "[4/4] Iniciando serviços..."

# Next.js em background
bun run dev &
NEXT_PID=$!

# Mini-service WS em background
(cd mini-services/sla-ws && bun --hot index.ts) &
WS_PID=$!

echo ""
echo "Next.js rodando em http://localhost:3000 (PID $NEXT_PID)"
echo "WebSocket rodando em http://localhost:3003 (PID $WS_PID)"
echo "Pressione Ctrl+C para parar ambos."

cleanup() {
  echo ""
  echo "Encerrando serviços..."
  kill $NEXT_PID $WS_PID 2>/dev/null
  wait $NEXT_PID $WS_PID 2>/dev/null
  echo "Serviços encerrados."
}
trap cleanup SIGINT SIGTERM EXIT

wait