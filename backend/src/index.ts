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
