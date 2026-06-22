# TrainPro

Plataforma para **personal trainers** gerenciarem seus **alunos**: cadastro, montagem de
treinos, acompanhamento de evolução, agenda de sessões e controle de pagamentos.

O projeto é um **monorepo** com backend compartilhado entre a aplicação web e o app mobile.

```
trainpro/
├── backend/   API REST (Node + TypeScript + Express + Prisma + SQLite, auth JWT)
├── web/       App web (React + Vite + TypeScript)
└── mobile/    App mobile (Expo / React Native) — consome a mesma API
```

## Papéis

- **Personal (TRAINER)** — cadastra alunos, monta fichas de treino, acompanha a evolução,
  agenda sessões e controla mensalidades.
- **Aluno (STUDENT)** — visualiza seus treinos, registra evolução e vê sua agenda e pagamentos.

## Funcionalidades (v1)

1. **Cadastro de alunos e personal** — autenticação, perfis e vínculo personal↔aluno.
2. **Montagem de treinos** — fichas com exercícios, séries, repetições, cargas e descanso.
3. **Acompanhamento de evolução** — peso, % de gordura, medidas e notas ao longo do tempo.
4. **Agenda e pagamentos** — agendamento de sessões e controle de mensalidades.

## Como rodar o backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init   # cria o banco SQLite
npm run seed                          # (opcional) dados de exemplo
npm run dev                           # API em http://localhost:4000
```

## Como rodar o web

```bash
cd web
npm install
npm run dev                           # http://localhost:5173
```

## Tecnologias

| Camada   | Stack                                             |
|----------|---------------------------------------------------|
| Backend  | Node, TypeScript, Express, Prisma, SQLite, JWT    |
| Web      | React, Vite, TypeScript                           |
| Mobile   | Expo, React Native, TypeScript                    |

> SQLite é usado para facilitar o desenvolvimento local; a troca para PostgreSQL em produção
> exige apenas mudar o `provider` no `prisma/schema.prisma` e a `DATABASE_URL`.
