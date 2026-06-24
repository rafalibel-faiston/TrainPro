# TrainPro — Visão Geral do Produto

> Plataforma colaborativa para personal trainers gerenciarem alunos de forma integrada.

---

## O que é o TrainPro?

O **TrainPro** é um sistema web (com app mobile em desenvolvimento) que centraliza tudo o que um personal trainer precisa para gerenciar sua carteira de alunos: treinos, evolução física, agenda de sessões e controle de pagamentos — tudo em um único lugar.

---

## Para quem é?

### Personal Trainer
O personal tem controle total sobre seus alunos. Pelo sistema ele consegue:

- **Gerenciar alunos** — cadastrar, visualizar e acompanhar cada aluno individualmente
- **Montar fichas de treino** — criar treinos com exercícios detalhados (séries, repetições, carga em kg e tempo de descanso)
- **Acompanhar evolução** — registrar e visualizar o progresso de cada aluno (peso, % de gordura corporal, medidas)
- **Agendar sessões** — marcar sessões com data e hora de início e fim, com anotações
- **Controlar pagamentos** — lançar mensalidades, acompanhar vencimentos e marcar pagamentos como realizados
- **Dashboard centralizado** — ver todos os alunos em uma tela e acessar o detalhe de cada um

### Aluno
O aluno tem acesso à sua própria área, onde consegue:

- **Ver seus treinos** — acessar as fichas que o personal montou para ele
- **Registrar evolução** — anotar seu peso e observações pessoais
- **Consultar a agenda** — ver as sessões agendadas com o personal
- **Acompanhar pagamentos** — visualizar o histórico de mensalidades e o status de cada uma

---

## Stack Tecnológico

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Backend       | Node.js + TypeScript + Express      |
| Banco de dados| PostgreSQL (dev: SQLite via Prisma) |
| ORM           | Prisma v5                           |
| Autenticação  | JWT (7 dias) + bcrypt               |
| Validação     | Zod                                 |
| Frontend Web  | React 18 + Vite + TypeScript        |
| Mobile        | Expo + React Native                 |
| Deploy        | Railway                             |

---

## Arquitetura

O projeto é um **monorepo** com três pacotes:

```
TrainPro/
├── backend/      # API REST — porta 4000
├── web/          # SPA React — porta 5173
└── mobile/       # App Expo (iOS / Android)
```

Em produção, o backend Express serve o build do React como arquivos estáticos — tudo num único serviço no Railway, com PostgreSQL gerenciado pela plataforma.

---

## Modelo de Dados

```
User
 ├── TrainerProfile
 │    ├── StudentProfile[]   (alunos vinculados)
 │    ├── Workout[]          (fichas criadas)
 │    └── Appointment[]      (sessões agendadas)
 └── StudentProfile
      ├── Workout[]          (fichas atribuídas)
      ├── ProgressEntry[]    (histórico de evolução)
      ├── Appointment[]      (sessões)
      └── Payment[]          (mensalidades)

Workout
 └── WorkoutExercise[]       (exercícios da ficha)
```

---

## API REST — Rotas Disponíveis

Todas as rotas partem de `/api`.

| Recurso       | Endpoint                  | Quem acessa              |
|---------------|---------------------------|--------------------------|
| Autenticação  | `POST /auth/register`     | Público                  |
|               | `POST /auth/login`        | Público                  |
|               | `GET  /auth/me`           | Autenticado              |
| Alunos        | `GET  /students`          | Apenas TRAINER           |
|               | `POST /students`          | Apenas TRAINER           |
|               | `GET  /students/:id`      | Apenas TRAINER           |
| Treinos       | `GET  /workouts`          | Ambos                    |
|               | `POST /workouts`          | Apenas TRAINER           |
|               | `PUT  /workouts/:id`      | Apenas TRAINER           |
|               | `DELETE /workouts/:id`    | Apenas TRAINER           |
| Evolução      | `GET  /progress`          | Ambos                    |
|               | `POST /progress`          | Ambos                    |
| Agenda        | `GET  /appointments`      | Ambos                    |
|               | `POST /appointments`      | Apenas TRAINER           |
|               | `PUT  /appointments/:id`  | Apenas TRAINER           |
| Pagamentos    | `GET  /payments`          | Ambos                    |
|               | `POST /payments`          | Apenas TRAINER           |
|               | `POST /payments/:id/pay`  | Apenas TRAINER           |

---

## Roadmap de Melhorias

O sistema está funcional, mas os itens abaixo elevariam o produto a um nível profissional.

### Crítico — sem isso faltam recursos básicos

| # | Melhoria | Motivo |
|---|----------|--------|
| 1 | **Recuperação de senha** | Sem "esqueci minha senha", o acesso é perdido permanentemente |
| 2 | **Edição de perfil** | Não há como alterar nome, senha ou dados após o cadastro |
| 3 | **Notificações** | Aluno e personal não recebem alertas de sessão, pagamento ou treino novo |
| 4 | **Refresh token** | JWT expira em 7 dias sem renovação automática — desloga o usuário sem aviso |

### Importante — melhora muito a experiência

| # | Melhoria | Benefício |
|---|----------|-----------|
| 5 | **Galeria de progresso (fotos)** | Comparação visual da evolução com fotos e datas |
| 6 | **Avaliação física estruturada** | Formulário completo de anamnese com todas as medidas |
| 7 | **Histórico de treinos realizados** | Aluno marca treino como concluído e vê o histórico |
| 8 | **Chat trainer ↔ aluno** | Comunicação interna sem depender de WhatsApp |
| 9 | **Calendário visual** | Agenda em formato de calendário interativo, não apenas lista |
| 10 | **Gráficos de evolução** | Visualização da curva de peso e composição corporal ao longo do tempo |

### Negócio — para monetizar e escalar

| # | Melhoria | Benefício |
|---|----------|-----------|
| 11 | **Link de cadastro para aluno** | Aluno se cadastra sozinho via link, sem o personal criar manualmente |
| 12 | **Exportação de relatório em PDF** | Personal envia relatório de evolução para o aluno por WhatsApp |
| 13 | **Integração com pagamento** | Stripe ou PagSeguro para cobrar mensalidade direto pela plataforma |
| 14 | **Planos de assinatura** | Limite de alunos por plano (freemium / pro) |
| 15 | **App mobile funcional** | A estrutura existe, mas o app ainda não está desenvolvido |

### Qualidade técnica

| # | Melhoria | Benefício |
|---|----------|-----------|
| 16 | **Testes automatizados** | Nenhum teste existe hoje — risco alto de regressões |
| 17 | **Rate limiting** | API sem proteção contra abuso ou spam de requisições |
| 18 | **Monitoramento de erros** | Sem Sentry ou similar para capturar erros em produção |

---

## Como rodar localmente

```bash
# 1. Suba o banco de dados
docker compose up -d

# 2. Backend (http://localhost:4000)
cd backend && npm install && npm run dev

# 3. Frontend web (http://localhost:5173)
cd web && npm install && npm run dev
```

### Variáveis de ambiente (backend/.env)

```env
DATABASE_URL=postgresql://trainpro:trainpro@localhost:5432/trainpro?schema=public
PORT=4000
JWT_SECRET=troque-este-segredo-em-producao
JWT_EXPIRES_IN=7d
WEB_ORIGIN=http://localhost:5173
```

---

*Documento gerado em 24/06/2026*
