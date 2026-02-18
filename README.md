# 🎬 Cinema Ticket System API

Sistema backend robusto e escalável para reserva de ingressos de cinema com controle de concorrência, arquitetura event-driven e garantia ACID.

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Uso da API](#uso-da-api)
- [Decisões de Design](#decisões-de-design)
- [Fluxos de Negócio](#fluxos-de-negócio)
- [Rate Limiting](#rate-limiting)
- [Documentação Swagger](#documentação-swagger)
- [Futuras Melhorias](#futuras-melhorias)

---

## 🎯 Visão Geral

Este projeto é um sistema backend completo para gerenciamento de reservas de ingressos de cinema com foco em:

✅ **Controle de Concorrência**: Impede double-booking mesmo com múltiplas requisições simultâneas  
✅ **Arquitetura Event-Driven**: Usa RabbitMQ para comunicação assíncrona entre serviços  
✅ **Transações ACID**: Garante integridade dos dados com PostgreSQL  
✅ **Locks Distribuídos**: Redis para sincronização entre múltiplas instâncias  
✅ **Rate Limiting**: Proteção contra abuso com limite de 100 req/min por IP  
✅ **API Documentada**: Swagger/OpenAPI para fácil integração com frontend  

### Fluxo Principal

```
1. Usuário cria sessão (filme, horário, assentos)
2. Usuário reserva assento → Red lock + Transação ACID
3. Evento "reservation-created" publicado no RabbitMQ
4. Consumer agenda expiração (30s)
5. Após 30s sem confirmação → Evento "reservation-expired" + "seat-released"
6. Usuário confirma pagamento → Compra confirmada
```

---

## 🛠️ Tecnologias

### Backend Framework
- **NestJS** (v10+) - Framework TypeScript com arquitetura modular e injeção de dependência
- **TypeScript** - Type-safety para todo o código

### Banco de Dados
- **PostgreSQL 15** - Banco relacional com suporte a transações ACID
- **Prisma** - ORM type-safe com migrations automáticas

### Message Queue & Caching
- **RabbitMQ** - Message broker para arquitetura event-driven
- **Redis** - Cache em memória para locks distribuídos

### Utilidades
- **@nestjs/throttler** - Rate limiting global (100 req/min)
- **@nestjs/swagger** - Documentação OpenAPI automática
- **class-validator** - Validação de DTOs
- **Docker Compose** - Orquestração de containers

---

## 🏗️ Arquitetura

### Clean Architecture + Layered Pattern

```
📁 src/
├── 📁 modules/tickets/
│   ├── 📁 application/
│   │   ├── 📁 dto/
│   │   │   ├── create-session.dto.ts
│   │   │   └── create-reservation.dto.ts
│   │   ├── 📁 events/
│   │   │   ├── reservation-created.event.ts
│   │   │   ├── reservation-confirmed.event.ts
│   │   │   ├── reservation-expired.event.ts
│   │   │   └── seat-released.event.ts
│   │   └── 📁 use-cases/
│   │       ├── create-session.use-case.ts
│   │       ├── create-reservation.use-case.ts
│   │       ├── confirm-payment.use-case.ts
│   │       ├── expire-reservation.use-case.ts
│   │       ├── get-session-seats.use-case.ts
│   │       └── get-user-purchases.use-case.ts
│   ├── 📁 infrastructure/
│   │   ├── 📁 database/
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   ├── 📁 cache/
│   │   │   ├── redis-lock.service.ts
│   │   │   └── redis.module.ts
│   │   │   └── redis.service.ts
│   │   └── 📁 messaging/
│   │       ├── rabbitmq.service.ts
│   │       ├── rabbitmq.module.ts
│   │       ├── reservation-event.consumer.ts
│   │       └── seat-event.consumer.ts
│   │── 📁 presentation/
│   │   └── 📁 controllers/
│   │       ├── session.controller.ts
│   │       └── reservation.controller.ts
│   └── tickets.module.ts       
├── app.module.ts
└── main.ts
```

### Padrões Utilizados

**1. Use Cases** - Lógica de negócio isolada em classes especializadas  
**2. Dependency Injection** - NestJS gerencia todas as dependências  
**3. DTOs + Validação** - Class-validator valida entrada automaticamente  

---

## 📦 Requisitos

- **Node.js** 20+ ou **Docker**
- **Docker & Docker Compose** (recomendado)
- **PostgreSQL 15** (via Docker)
- **Redis 7** (via Docker)
- **RabbitMQ 3** (via Docker)

---

## 🚀 Instalação

### Opção 1: Com Docker (Recomendado)

```bash
# Clonar repositório
git clone git@github.com:GabrielaMoura25/starsoft-backend-challenge.git
cd starsoft-backend-challenge

# Criar arquivo .env
cat > .env << EOF
DATABASE_URL=postgresql://admin:admin@postgres:5432/cinema
REDIS_HOST=redis
REDIS_PORT=6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=cinema
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest
NODE_ENV=development
PORT=3000
EOF

# Iniciar todos os containers
docker compose up --build

# Migrações rodam automaticamente ao iniciar
```

### Opção 2: Local (Sem Docker)

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

---

## 📡 Uso da API

### Base URL
```
http://localhost:3000/api
```

### 📖 Documentação Interativa
```
http://localhost:3000/docs (Swagger)
```

---

### 1️⃣ **Criar Sessão de Cinema**

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "movieTitle": "Inception",
    "room": "Sala 1",
    "dateTime": "2026-02-20T19:00:00Z",
    "price": 45.50,
    "totalSeats": 100
  }'
```

---

### 2️⃣ **Consultar Disponibilidade**

```bash
curl -X GET http://localhost:3000/api/sessions/550e8400-e29b-41d4-a716-446655440000/seats
```

---

### 3️⃣ **Criar Reserva (Assento)**

⚠️ **A reserva expira em 30 segundos se não confirmada!**

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "seatId": "550e8400-e29b-41d4-a716-446655440002"
  }'
```

---

### 4️⃣ **Confirmar Pagamento**

```bash
curl -X POST http://localhost:3000/api/reservations/reservation-123/confirm
```

---

### 5️⃣ **Histórico de Compras**

```bash
curl -X GET http://localhost:3000/api/reservations/users/550e8400-e29b-41d4-a716-446655440001/purchases
```

---

## 🎨 Decisões de Design

### 1. **Locks Distribuídos com Redis**

**Por quê?**
- Previne race conditions com múltiplas instâncias
- Mais rápido que locks de banco de dados
- Timeout automático evita deadlock

```typescript
const token = await this.redisLock.acquire(
  `seat:${seatId}`, 
  5000, // TTL em ms
  100,  // retry interval
  5     // max retries
);

try {
  // Operação crítica
} finally {
  await this.redisLock.release(lockKey, token);
}
```

---

### 2. **Arquitetura Event-Driven com RabbitMQ**

**Por quê?**
- Desacoplamento entre serviços
- Escalabilidade horizontal
- Persistência de mensagens
- Retry automático

**Fluxo:**
```
CreateReservation 
  → "reservation-created" 
  → ReservationEventConsumer (agenda expiração)
  → After 30s: ExpireReservationsUseCase
  → "reservation-expired" + "seat-released"
  → SeatEventConsumer (processa eventos)
```

---

### 3. **Transações ACID em PostgreSQL**

**Por quê?**
- Operações "tudo ou nada"
- Previne estado inconsistente
- Isolamento entre transações concorrentes

```typescript
await this.prisma.$transaction(async (tx) => {
  const seat = await tx.$queryRawUnsafe(
    `SELECT * FROM "Seat" WHERE id = $1 FOR UPDATE`, 
    seatId
  );
  // Validações e operações garantidas ACID
});
```

---

### 4. **ConfirmChannel do RabbitMQ**

**Por quê?**
- Garante persistência de mensagens
- Callback confirma sucesso
- Permite retry em falha

---

## 🔄 Fluxos de Negócio

### ✅ Fluxo Feliz: Reserva → Compra

```
POST /sessions → Criar sessão (100 assentos)
GET /sessions/:id/seats → available: 100
POST /reservations → Criar reserva (PENDING)
  └─ Consumer agenda expiração em 30s
POST /reservations/:id/confirm → Confirmar pagamento (CONFIRMED)
GET /reservations/users/:userId/purchases → Ver compra
```

---

### ❌ Fluxo de Falha: Expiração

```
POST /reservations → Criar reserva (PENDING)
[Usuário não confirma em 30s]
Consumer expira:
  └─ reservation.status = EXPIRED
  └─ seat.status = AVAILABLE
  └─ Publicar "seat-released"
GET /sessions/:id/seats → available: 100 (liberado!)
```

---

### 🎯 Prevenção de Double-Booking

```
Dois usuários tentam o mesmo assento:

Instância 1: Acquire lock ✓
Instância 2: Acquire lock ✗ (espera)

Instância 1: Validar + UPDATE + COMMIT
Instância 2: Validar ✗ (assento já reservado) + ROLLBACK

Resultado: ✅ Apenas um conseguiu
          ✅ Outro recebe erro 409 Conflict
```

---

## 🛡️ Rate Limiting

**Limite:** 100 requisições por minuto por IP

```typescript
ThrottlerModule.forRoot([
  { ttl: 60000, limit: 100 }
])
```

**Resposta ao limite:**
```
HTTP/1.1 429 Too Many Requests
{
  "message": "Too Many Requests",
  "statusCode": 429
}
```

---

## 📚 Documentação Swagger

Acesse: `http://localhost:3000/docs`

**Funcionalidades:**
- ✅ Todos os 6 endpoints documentados
- ✅ DTOs com validações
- ✅ Testar via interface
- ✅ Exemplos de request/response
- ✅ Codes de erro

---

## 🔮 Futuras Melhorias

### 1. **Autenticação & Autorização (JWT)**
```typescript
// @UseGuards(JwtAuthGuard)
// Roles: ADMIN, USER, MANAGER
```

### 2. **Webhooks para Frontend**
- Notificação em tempo real de expiração
- Confirmação de pagamento
- Assento liberado

### 3. **Payment Gateway Integration**
- Stripe/PayPal
- Validar antes de confirmar

### 4. **Busca e Filtros Avançados**
```
GET /sessions?movie=Inception&date=2026-02-20&price_max=50
```

### 5. **Cancelamento de Compras**
```
DELETE /reservations/:id
```

### 6. **Relatórios & Analytics**
```
GET /admin/reports/sales
GET /admin/reports/occupancy
```

### 7. **Caching Estratégico**
- Cache de sessões em Redis (5min TTL)
- Invalidação automática

### 8. **Circuit Breaker Pattern**
- Fallback se RabbitMQ cair
- Queue em memória com retry

### 9. **Logging Centralizado**
- Winston + ELK Stack
- Rastreamento de operações

### 10. **Testes Automatizados**
```bash
npm run test       # Unit tests
npm run test:e2e   # E2E tests
npm run test:cov   # Coverage
```

---

## 📊 Monitoramento

### RabbitMQ Management
```
http://localhost:15672
user: guest
password: guest
```

### Logs
```bash
docker logs starsoft-app
docker logs starsoft-rabbitmq
docker logs starsoft-postgres
docker logs starsoft-redis
```

---

## 🧪 Teste End-to-End Completo

```bash
#!/bin/bash

# 1. Criar sessão
SESSION=$(curl -s -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "movieTitle": "Inception",
    "room": "Sala 1",
    "dateTime": "2026-02-20T19:00:00Z",
    "price": 45.50,
    "totalSeats": 100
  }' | jq -r '.id')

echo "📽️ Sessão: $SESSION"

# 2. Verificar disponibilidade
curl -s http://localhost:3000/api/sessions/$SESSION/seats | jq .

# 3. Criar reserva
RESERVATION=$(curl -s -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"550e8400-e29b-41d4-a716-446655440001\",
    \"sessionId\": \"$SESSION\",
    \"seatId\": \"550e8400-e29b-41d4-a716-446655440002\"
  }" | jq -r '.id')

echo "✅ Reserva: $RESERVATION"

# 4. Confirmar pagamento
curl -s -X POST http://localhost:3000/api/reservations/$RESERVATION/confirm | jq .

# 5. Ver histórico
curl -s http://localhost:3000/api/reservations/users/550e8400-e29b-41d4-a716-446655440001/purchases | jq .
```

---

## ❓ FAQ

**P: Posso usar múltiplas instâncias?**  
R: Sim! Redis sincroniza locks, RabbitMQ distribui eventos.

**P: Se RabbitMQ cair?**  
R: Mensagens persistem em disco, consumed ao voltar.

**P: TTL de reserva?**  
R: 30 segundos, alterável no consumer.

---

## 👨‍💻 Desenvolvido com ❤️

**Versão:** 1.0.0  
**Data:** 17 de fevereiro de 2026

---

<div align="center">

### ⬆️ [Voltar ao Topo](#-cinema-ticket-system-api)

</div>
