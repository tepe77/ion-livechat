# ION Live Chat — Realtime ISP Customer Support Platform

[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://docker.com)

A high-concurrency, self-hosted Customer Service Live Chat application built specifically for Internet Service Providers (ISP) with real-time WebSocket communication, automated FIFO smart routing, agent capacity management, supervisor monitoring dashboards, and role-based access control.

---

## 🚀 Key Features

* **Member Experience**: Instant live chat assistance without needing to manually select agents. Real-time typing indicators, read receipts, secure image/document attachment uploads, and post-chat CSAT ratings (1–5 stars).
* **Smart Routing Engine**: Concurrency-safe automatic agent assignment prioritizing:
  1. **Lowest Active Workload** (`active_conversations < max_concurrent_conversations`)
  2. **Longest Availability** (`available_since ASC`)
  3. **Deterministic Tie-Break** (`id ASC`)
* **FIFO Waiting Queue**: Graceful fallback queue when all agents are occupied or offline, with automatic assignment as soon as an agent becomes available or a conversation is closed.
* **Agent Workspace**: Multi-chat tabbed inbox, availability toggle (`Available`, `Away`, `Busy`), heartbeat monitoring, conversation transfer modal with available agent capacity indicators.
* **Supervisor/Manager Portal**: Real-time KPI monitoring (Waiting queue, Active sessions, FRT, CSAT), agent capacity management, conversation inspection, and transfer control.
* **Superadmin Governance**: User management, granular permission assignment, and immutable audit logs capturing IP and user-agent metadata.
* **Self-Hosted WebSocket**: Real-time broadcasting powered by **Laravel Reverb**, completely free from third-party vendor lock-in (e.g. Pusher, Twilio).
* **State Reconciliation**: PostgreSQL is the single source of truth. WebSockets are used for fast event streaming, and clients gracefully reconcile state via REST API on reconnection.

---

## 🏗️ Architecture & Tech Stack

```
                     ┌────────────────────────┐
                     │   Reverse Proxy / SSL   │
                     │         (Nginx)        │
                     └───────────┬────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │ /                  │ /api /storage      │ /app (WS)
            ▼                    ▼                    ▼
   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
   │ Next.js Web App │  │   Laravel 12    │  │ Laravel Reverb  │
   │   (Port 3000)   │  │   (Port 8000)   │  │   (Port 8080)   │
   └─────────────────┘  └────────┬────────┘  └────────┬────────┘
                                 │                    │
            ┌────────────────────┴────────────────────┴──────────┐
            ▼                                                     ▼
   ┌─────────────────┐                                   ┌─────────────────┐
   │  PostgreSQL 16  │                                   │     Redis 7     │
   │  (Relational)   │                                   │ (PubSub/Queue)  │
   └─────────────────┘                                   └─────────────────┘
```

| Layer | Technologies |
|---|---|
| **Backend API** | Laravel 12, PHP 8.2+, Laravel Sanctum, Laravel Reverb, Laravel Socialite |
| **Frontend Web** | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Zustand, Lucide Icons |
| **Shared Types** | TypeScript package `@ion/types` shared between backend resource contracts & frontend |
| **Datastores** | PostgreSQL 16 (Authoritative store), Redis 7 (Queues, Cache, Pub/Sub broadcasting) |
| **Gateway & Infra** | Nginx Reverse Proxy (HTTP & WebSocket Upgrade), Docker & Docker Compose |
| **CI/CD** | GitLab CI/CD Pipeline (Automated testing, container building, registry publishing) |

---

## 👥 Seeded User Accounts

The database comes pre-seeded with ready-to-test accounts across all roles. Default password for all accounts is: `password`.

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Superadmin** | `admin@ion.test` | `password` | Full system access, User Management, Roles, Audit Logs |
| **Manager (SPV)** | `manager@ion.test` | `password` | Realtime Dashboard, Agent Monitoring, Conversation Inspection |
| **Agent 1** | `agent1@ion.test` | `password` | Agent Workspace, 5 Max Concurrent Chats, Live Chat Inbox |
| **Agent 2** | `agent2@ion.test` | `password` | Agent Workspace, 3 Max Concurrent Chats, Live Chat Inbox |
| **Member 1** | `member1@ion.test` | `password` | Member Chat, History, CSAT Rating Dialog |
| **Member 2** | `member2@ion.test` | `password` | Member Chat, History, CSAT Rating Dialog |

---

## ⚡ Quickstart with Docker Compose

### 1. Clone & Setup Environment
```bash
git clone https://gitlab.com/ion/livechat.git
cd ion-livechat

# Copy environment file
cp .env.example .env
```

### 2. Launch with Docker Compose
```bash
# Start all 8 containers (postgres, redis, api, reverb, queue, scheduler, web, nginx)
docker compose up -d

# Or using Makefile
make up
```

### 3. Access the Application
* **Web Application**: [http://localhost](http://localhost)
* **REST API Healthcheck**: [http://localhost/api/v1/health](http://localhost/api/v1/health)
* **API Documentation & Specs**: See `04_API_SPEC.md` and `05_WEBSOCKET_SPEC.md`

---

## 🧪 Testing & Validation

### Automated Backend Tests
Includes complete unit test coverage of the Smart Routing algorithm, FIFO waiting queue, and the **P0 Concurrency Test** (guaranteeing that 1 agent with capacity 5 receiving 10 simultaneous requests atomically assigns exactly 5 and puts 5 into the waiting queue without race conditions).

```bash
cd apps/api
php artisan test

# Or using Makefile from workspace root
make test-backend
```

### Frontend Build & Type Validation
Validates TypeScript type safety across all components and compiles the production Next.js standalone bundle:

```bash
cd apps/web
npm run build

# Or using Makefile from workspace root
make test-frontend
```

---

## 📁 Repository Structure

```
.
├── 01_PRD.md                             # Product Requirements Document
├── 02_ARCHITECTURE.md                    # System & Component Architecture
├── 03_DATABASE_ERD.md                    # Database Schema & Relational Design
├── 04_API_SPEC.md                        # REST API Specifications
├── 05_WEBSOCKET_SPEC.md                  # Real-Time WebSocket Specifications
├── 06_BACKEND_IMPLEMENTATION_SPEC.md     # Backend Architecture Details
├── 07_UI_UX_SPEC.md                      # UI/UX Specifications & Tokens
├── 08_FRONTEND_IMPLEMENTATION_SPEC.md    # Frontend Component Specs
├── 09_TESTING_QA_SPEC.md                 # QA Protocols & Concurrency Test Scenarios
├── 10_DEVOPS_DEPLOYMENT_SPEC.md          # Docker, Nginx & Deployment Specs
├── 11_ANTIGRAVITY_EXECUTION_SPEC.md      # Master Implementation Roadmap
│
├── apps/
│   ├── api/                              # Laravel 12 Backend API
│   │   ├── app/
│   │   │   ├── Enums/                    # UserRole, ConversationStatus, etc.
│   │   │   ├── Events/                   # MessageCreated, ConversationAssigned, etc.
│   │   │   ├── Http/Controllers/        # REST Controllers (Auth, Chat, Manager, Admin)
│   │   │   ├── Jobs/                     # Stale Agent & Capacity Reconciliation Jobs
│   │   │   ├── Models/                   # Eloquent Models
│   │   │   ├── Policies/                 # Sanctum & Model Authorization Policies
│   │   │   └── Services/                 # Domain Services (Routing, Queue, Chat, Metrics)
│   │   ├── database/migrations/          # PostgreSQL Migrations
│   │   ├── database/seeders/             # Roles, Permissions & Default Users
│   │   └── tests/                        # Unit & Concurrency Feature Tests
│   │
│   └── web/                              # Next.js 16 App Router Frontend
│       ├── app/                          # App Router Pages ((auth), member, agent, manager, admin)
│       ├── components/                   # Shadcn/ui & Feature Components
│       ├── lib/                          # API clients, utils, Echo/Reverb client
│       └── stores/                       # Zustand state stores (authStore, chatStore)
│
├── packages/
│   └── types/                            # Shared TypeScript Domain & API Types (@ion/types)
│
├── infrastructure/
│   ├── docker/
│   │   ├── api/                          # Multi-stage PHP 8.2 Alpine Dockerfile & Entrypoint
│   │   └── web/                          # Multi-stage Next.js Standalone Dockerfile
│   └── nginx/                            # Nginx config & reverse proxy reverse routing
│
├── docker-compose.yml                    # Unified Docker Compose
├── docker-compose.dev.yml                # Local development overrides
├── docker-compose.prod.yml               # Production deployment overrides
├── Makefile                              # Make task runner
├── .gitlab-ci.yml                        # GitLab CI/CD pipeline
└── .env.example                          # Environment template
```

---

## 🔒 Security & Concurrency Design

* **Zero Race Conditions**: Conversation routing leverages PostgreSQL `lockForUpdate()` and database transactions to ensure capacity limits are strictly enforced under high concurrency.
* **Closed Conversation Immutability**: Closed conversations cannot be reopened or sent messages to. Any subsequent messages are rejected with `409 Conflict`.
* **Member Ownership of Ratings**: Only the member who initiated a conversation can submit a CSAT rating, and only once per closed conversation (`unique(conversation_id)`).
* **Audit Trail**: High-privilege actions (role changes, manual reassignments, agent status modifications) are automatically recorded with IP address and User-Agent.

---

## 📄 License

Proprietary & Confidential. Built for ION Internet Service Provider.
