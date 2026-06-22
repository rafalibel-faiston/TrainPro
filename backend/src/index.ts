import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { authRouter } from './routes/auth.js';
import { studentsRouter } from './routes/students.js';
import { workoutsRouter } from './routes/workouts.js';
import { progressRouter } from './routes/progress.js';
import { appointmentsRouter } from './routes/appointments.js';
import { paymentsRouter } from './routes/payments.js';

const app = express();

app.use(cors({ origin: env.webOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'trainpro-api' }));

app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/payments', paymentsRouter);

// Qualquer rota /api desconhecida responde 404 em JSON (e não o index.html do SPA).
app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// Em produção (deploy único no Railway) o backend serve o build do app web.
// O caminho pode ser sobrescrito por WEB_DIST; o padrão aponta para ../web/dist.
const here = path.dirname(fileURLToPath(import.meta.url));
const webDist = env.webDist ?? path.resolve(here, '../../web/dist');
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  // Fallback do SPA: qualquer rota não-API devolve o index.html.
  app.get('*', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
  console.log(`Servindo o app web de ${webDist}`);
}

// Tratamento de erros não capturados nas rotas.
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  },
);

app.listen(env.port, () => {
  console.log(`TrainPro API rodando em http://localhost:${env.port}`);
});
