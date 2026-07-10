# BMS-5302: Off-Platform Study Guide

Technology map for [rest-services-mono](https://github.com/Ohanafy/rest-services-mono) — the monorepo that powers Ohanafy's off-Salesforce services.

Related ticket: [BMS-5302](https://ohanafy.atlassian.net/browse/BMS-5302) — Externally embeddable product catalogue

---

## Language & Runtime

| Tech | What it does here |
|------|-------------------|
| **TypeScript** | Primary language across all apps, infra, and client |
| **Node.js** | Runtime for all backend services |

## Backend Framework

| Tech | What it does here |
|------|-------------------|
| **NestJS** | Core backend framework (controllers, modules, DI, guards) |
| **Express** | HTTP layer underneath NestJS (`@nestjs/platform-express`) |
| **Passport / passport-jwt** | Authentication — JWT-based auth with JWKS |
| **Swagger** | API documentation (`@nestjs/swagger`) |
| **Joi / class-validator / class-transformer** | Request validation and DTO transformation |

## Databases & Data

| Tech | What it does here |
|------|-------------------|
| **MongoDB** (v6.0) | Primary database — via `mongoose` + `@nestjs/mongoose` |
| **Redis** | Caching (`@nestjs/cache-manager`, `cache-manager`, `ioredis`) and job queue backing store |

## Messaging & Queues

| Tech | What it does here |
|------|-------------------|
| **Kafka** (via `kafkajs`) | Event streaming / async messaging between services |
| **Zookeeper** | Kafka coordination (Bitnami image in Docker) |
| **Bull** (`@nestjs/bull`) | Redis-backed job/task queues |

## Real-Time

| Tech | What it does here |
|------|-------------------|
| **Socket.IO** | WebSockets — server (`@nestjs/websockets`, `@nestjs/platform-socket.io`) and client (`socket.io-client`) |

## AWS (via CDK)

| Tech                          | What it does here                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| **AWS CDK** (`aws-cdk-lib`)   | Infrastructure as code — defines all cloud stacks                                                        |
| **S3** (`@aws-sdk/client-s3`) | Object storage                                                                                           |
| **ECS / Fargate** (likely)    | Container hosting — CDK stacks: `applications-stack`, `big-kahuna-stack`, `ohana-stack`, `network-stack` |
| **CloudFront + S3** (likely)  | `web-client-stack` — static site hosting for the React client                                            |
| **VPC / networking**          | `network-stack` — VPC, subnets, security groups                                                          |


## Frontend

| Tech | What it does here |
|------|-------------------|
| **React** (v18) | UI framework |
| **Vite** (v5) | Build tool / dev server |
| **React Router** (v6) | Client-side routing |
| **Geist font** | Typography (`@fontsource-variable/geist`) |

## DevOps & CI/CD

| Tech | What it does here |
|------|-------------------|
| **Docker** | Containerized services (multi-stage Dockerfiles) |
| **Docker Compose** | Local dev orchestration (mongo, redis, kafka, zookeeper, apps) |
| **GitHub Actions** | CI/CD — 8 workflows: deploy apps, deploy BK, CDK synth/deploy, web client deploy, stale branch cleanup |
| **Dependabot** | Automated dependency updates |
| **CODEOWNERS** | PR review routing |

## Networking & Tunneling

| Tech | What it does here |
|------|-------------------|
| **ngrok** | Public tunnel for local dev — permanent domain, OAuth-gated portal access |

## Observability

| Tech | What it does here |
|------|-------------------|
| **Pino** (`nestjs-pino`, `pino-http`, `pino-pretty`) | Structured JSON logging |
| **Terminus** (`@nestjs/terminus`) | Health checks |

## Security

| Tech | What it does here |
|------|-------------------|
| **AES-256-GCM** | At-rest encryption for crown-jewel secrets (custom `BrokerCryptoService`) |
| **Throttler** (`@nestjs/throttler`) | Rate limiting |
| **nanoid** | Secure ID generation |

## Testing

| Tech | What it does here |
|------|-------------------|
| **Jest** / **ts-jest** | Unit testing |
| **Supertest** | HTTP integration testing |
| **E2E** | Docker-based e2e test suite |

## Scheduling

| Tech | What it does here |
|------|-------------------|
| **@nestjs/schedule** | Cron jobs / scheduled tasks |

## Other

| Tech | What it does here |
|------|-------------------|
| **Axios** (`@nestjs/axios`) | HTTP client for external API calls (Salesforce, Jira, etc.) |
| **RxJS** | Reactive patterns (NestJS microservices, interceptors) |
| **Yarn workspaces** | Monorepo package management |

---

## Repo Structure

| Path | What |
|------|------|
| `apps/applications/` | NestJS backend — broker, partners service, account-configurations (port 3010) |
| `apps/ohanafy/` | Core Ohanafy NestJS service (port 3030) |
| `apps/ohanafy/client/` | React/Vite frontend — portal UI |
| `apps/boggled/` | CLI Boggle game (terminal, MongoDB-backed) |
| `infra/big-kahuna/` | Big Kahuna orchestrator — Jira to Claude agent dispatch pipeline |
| `infra/lib/` | AWS CDK stack definitions (applications, big-kahuna, network, ohana, web-client) |
| `libs/common/` | Shared library code |
| `.github/workflows/` | CI/CD pipelines |

---

## Study Buckets (priority order for BMS-5302)

1. **NestJS** — modules, controllers, services, guards, interceptors, DTOs
2. **MongoDB / Mongoose** — schemas, queries, aggregation
3. **AWS CDK** — stacks, constructs, deploying ECS/Fargate services
4. **Docker / Docker Compose** — containerization, multi-stage builds, local dev
5. **Redis / Bull** — caching strategies, job queues
6. **Kafka** — event-driven architecture, producers, consumers
7. **React / Vite** — component architecture, routing, build pipeline
