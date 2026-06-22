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

## Como rodar localmente

```bash
# 1. Sobe um PostgreSQL local (precisa de Docker)
docker compose up -d

# 2. Backend (API em http://localhost:4000)
cd backend
npm install
cp .env.example .env
npx prisma migrate deploy   # aplica as migrations no banco
npm run seed                # (opcional) dados de exemplo
npm run dev

# 3. Web (em outro terminal — http://localhost:5173)
cd web
npm install
npm run dev
```

Usuários de exemplo (após o seed): `personal@trainpro.dev` e `ana@trainpro.dev`, senha `123456`.

## Deploy no Railway (web + backend num único serviço)

O backend serve o build do app web, então **tudo roda numa única URL**.

1. No Railway, crie um projeto a partir deste repositório (deploy do GitHub).
2. Adicione o plugin **PostgreSQL** — ele injeta a variável `DATABASE_URL` automaticamente.
3. No serviço, defina as variáveis de ambiente:
   - `JWT_SECRET` — um segredo forte qualquer.
4. O Railway lê o `railway.json`:
   - **build:** `npm install && npm run build` (builda web e backend);
   - **start:** `npm start` → roda `prisma migrate deploy` e sobe a API servindo o web.

Pronto: a URL pública do serviço abre o app web e responde à API em `/api`.

## Mobile (Expo)

O app mobile **não vai para o Railway** — ele é distribuído como aplicativo. Veja
`mobile/README.md`. Para testar agora, use o **Expo Go** apontando a `apiUrl`
(em `mobile/app.json`) para a URL do backend (local ou do Railway).

## Tecnologias

| Camada   | Stack                                             |
|----------|---------------------------------------------------|
| Backend  | Node, TypeScript, Express, Prisma, PostgreSQL, JWT |
| Web      | React, Vite, TypeScript                           |
| Mobile   | Expo, React Native, TypeScript                    |
| Deploy   | Railway (serviço único) + PostgreSQL gerenciado   |
