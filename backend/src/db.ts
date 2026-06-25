// Camada de banco de dados usando better-sqlite3 (SQLite local para dev).
// Exporta `db` — um wrapper com API semelhante ao Prisma para manter as rotas compatíveis.

import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = env.dbFile ?? path.resolve(here, '../../backend/prisma/dev.db');

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ── Schema ───────────────────────────────────────────────────────────────────

sqlite.exec(`
CREATE TABLE IF NOT EXISTS User (
  id        TEXT PRIMARY KEY,
  email     TEXT UNIQUE NOT NULL,
  password  TEXT NOT NULL,
  name      TEXT NOT NULL,
  role      TEXT NOT NULL,
  phone     TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS TrainerProfile (
  id     TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  bio    TEXT
);

CREATE TABLE IF NOT EXISTS StudentProfile (
  id        TEXT PRIMARY KEY,
  userId    TEXT UNIQUE NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  birthDate TEXT,
  goal      TEXT,
  trainerId TEXT REFERENCES TrainerProfile(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Workout (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  notes     TEXT,
  studentId TEXT NOT NULL REFERENCES StudentProfile(id) ON DELETE CASCADE,
  trainerId TEXT REFERENCES TrainerProfile(id) ON DELETE SET NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS WorkoutExercise (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  sets        INTEGER NOT NULL DEFAULT 3,
  reps        TEXT NOT NULL DEFAULT '12',
  weightKg    REAL,
  restSeconds INTEGER,
  "order"     INTEGER NOT NULL DEFAULT 0,
  workoutId   TEXT NOT NULL REFERENCES Workout(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ProgressEntry (
  id        TEXT PRIMARY KEY,
  date      TEXT NOT NULL DEFAULT (datetime('now')),
  weightKg  REAL,
  bodyFat   REAL,
  measurements TEXT,
  notes     TEXT,
  studentId TEXT NOT NULL REFERENCES StudentProfile(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Appointment (
  id        TEXT PRIMARY KEY,
  startsAt  TEXT NOT NULL,
  endsAt    TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'SCHEDULED',
  notes     TEXT,
  trainerId TEXT NOT NULL REFERENCES TrainerProfile(id) ON DELETE CASCADE,
  studentId TEXT NOT NULL REFERENCES StudentProfile(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Payment (
  id        TEXT PRIMARY KEY,
  amount    REAL NOT NULL,
  dueDate   TEXT NOT NULL,
  paidAt    TEXT,
  status    TEXT NOT NULL DEFAULT 'PENDING',
  notes     TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  studentId TEXT NOT NULL REFERENCES StudentProfile(id) ON DELETE CASCADE
);
`);

// ── Helpers ──────────────────────────────────────────────────────────────────

function cuid(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `c${t}${r}`;
}

function now(): string {
  return new Date().toISOString();
}

// ── db object (API compatível com as rotas) ───────────────────────────────────

export const db = {
  // ── User ─────────────────────────────────────────────────────────────────

  user: {
    findUnique({ where }: { where: { email?: string; id?: string } }) {
      if (where.email) return sqlite.prepare('SELECT * FROM User WHERE email = ?').get(where.email) ?? null;
      if (where.id) return sqlite.prepare('SELECT * FROM User WHERE id = ?').get(where.id) ?? null;
      return null;
    },

    create({ data }: {
      data: {
        id?: string; name: string; email: string; password: string; role: string; phone?: string;
        trainerProfile?: { create: object };
        studentProfile?: { create: { trainerId?: string | null; goal?: string; birthDate?: string } };
      };
    }) {
      const id = data.id ?? cuid();
      const ts = now();
      sqlite.prepare(
        'INSERT INTO User (id, email, password, name, role, phone, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)'
      ).run(id, data.email, data.password, data.name, data.role, data.phone ?? null, ts, ts);

      if (data.trainerProfile) {
        sqlite.prepare('INSERT INTO TrainerProfile (id, userId) VALUES (?,?)').run(cuid(), id);
      }
      if (data.studentProfile) {
        const sp = data.studentProfile.create as { trainerId?: string | null; goal?: string; birthDate?: string };
        sqlite.prepare(
          'INSERT INTO StudentProfile (id, userId, trainerId, goal, birthDate) VALUES (?,?,?,?,?)'
        ).run(cuid(), id, sp.trainerId ?? null, sp.goal ?? null, sp.birthDate ?? null);
      }

      return sqlite.prepare('SELECT * FROM User WHERE id = ?').get(id);
    },
  },

  // ── TrainerProfile ────────────────────────────────────────────────────────

  trainerProfile: {
    findUnique({ where }: { where: { userId?: string; id?: string } }) {
      if (where.userId) return sqlite.prepare('SELECT * FROM TrainerProfile WHERE userId = ?').get(where.userId) ?? null;
      if (where.id) return sqlite.prepare('SELECT * FROM TrainerProfile WHERE id = ?').get(where.id) ?? null;
      return null;
    },
  },

  // ── StudentProfile ────────────────────────────────────────────────────────

  studentProfile: {
    findUnique({ where, include }: { where: { userId?: string; id?: string }; include?: object }) {
      let row: StudentProfileRow | undefined;
      if (where.userId) row = sqlite.prepare('SELECT * FROM StudentProfile WHERE userId = ?').get(where.userId) as StudentProfileRow | undefined;
      else if (where.id) row = sqlite.prepare('SELECT * FROM StudentProfile WHERE id = ?').get(where.id) as StudentProfileRow | undefined;
      if (!row) return null;
      return expandStudent(row, include as IncludeOptions | undefined);
    },

    findFirst({ where }: { where: { id?: string; trainerId?: string } }) {
      if (where.id && where.trainerId) {
        return sqlite.prepare('SELECT * FROM StudentProfile WHERE id = ? AND trainerId = ?').get(where.id, where.trainerId) ?? null;
      }
      if (where.id) return sqlite.prepare('SELECT * FROM StudentProfile WHERE id = ?').get(where.id) ?? null;
      return null;
    },

    findMany({ where, include, orderBy }: {
      where: { trainerId?: string };
      include?: object;
      orderBy?: object;
    }) {
      const rows = sqlite.prepare('SELECT * FROM StudentProfile WHERE trainerId = ? ORDER BY id').all(where.trainerId) as StudentProfileRow[];
      return rows.map((r) => expandStudent(r, include as IncludeOptions | undefined));
    },
  },

  // ── Workout ───────────────────────────────────────────────────────────────

  workout: {
    findMany({ where, include }: { where: { studentId?: string; trainerId?: string }; include?: object }) {
      let rows: WorkoutRow[];
      if (where.studentId && where.trainerId) {
        rows = sqlite.prepare('SELECT * FROM Workout WHERE studentId = ? AND trainerId = ? ORDER BY createdAt DESC').all(where.studentId, where.trainerId) as WorkoutRow[];
      } else if (where.studentId) {
        rows = sqlite.prepare('SELECT * FROM Workout WHERE studentId = ? ORDER BY createdAt DESC').all(where.studentId) as WorkoutRow[];
      } else if (where.trainerId) {
        rows = sqlite.prepare('SELECT * FROM Workout WHERE trainerId = ? ORDER BY createdAt DESC').all(where.trainerId) as WorkoutRow[];
      } else {
        rows = [];
      }
      return rows.map((w) => expandWorkout(w));
    },

    findFirst({ where }: { where: { id?: string; trainerId?: string } }) {
      if (where.id && where.trainerId) {
        return sqlite.prepare('SELECT * FROM Workout WHERE id = ? AND trainerId = ?').get(where.id, where.trainerId) ?? null;
      }
      if (where.id) return sqlite.prepare('SELECT * FROM Workout WHERE id = ?').get(where.id) ?? null;
      return null;
    },

    create({ data }: {
      data: {
        name: string; notes?: string; studentId: string; trainerId?: string | null;
        exercises?: { create: ExerciseInput[] };
      };
    }) {
      const id = cuid();
      const ts = now();
      sqlite.prepare(
        'INSERT INTO Workout (id, name, notes, studentId, trainerId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?)'
      ).run(id, data.name, data.notes ?? null, data.studentId, data.trainerId ?? null, ts, ts);

      if (data.exercises?.create) {
        for (const ex of data.exercises.create) insertExercise(id, ex);
      }
      return expandWorkout(sqlite.prepare('SELECT * FROM Workout WHERE id = ?').get(id) as WorkoutRow);
    },

    update({ where, data }: {
      where: { id: string };
      data: {
        name?: string; notes?: string;
        exercises?: { deleteMany: object; create: ExerciseInput[] };
      };
    }) {
      const ts = now();
      if (data.name !== undefined || data.notes !== undefined) {
        sqlite.prepare('UPDATE Workout SET name = COALESCE(?, name), notes = COALESCE(?, notes), updatedAt = ? WHERE id = ?')
          .run(data.name ?? null, data.notes ?? null, ts, where.id);
      }
      if (data.exercises) {
        sqlite.prepare('DELETE FROM WorkoutExercise WHERE workoutId = ?').run(where.id);
        for (const ex of data.exercises.create) insertExercise(where.id, ex);
      }
      return expandWorkout(sqlite.prepare('SELECT * FROM Workout WHERE id = ?').get(where.id) as WorkoutRow);
    },

    delete({ where }: { where: { id: string } }) {
      sqlite.prepare('DELETE FROM Workout WHERE id = ?').run(where.id);
    },
  },

  // ── ProgressEntry ─────────────────────────────────────────────────────────

  progressEntry: {
    findMany({ where }: { where: { studentId: string } }) {
      return sqlite.prepare('SELECT * FROM ProgressEntry WHERE studentId = ? ORDER BY date DESC').all(where.studentId);
    },

    create({ data }: {
      data: {
        studentId: string; date?: string | Date; weightKg?: number; bodyFat?: number;
        measurements?: string; notes?: string;
      };
    }) {
      const id = cuid();
      const date = data.date ? new Date(data.date).toISOString() : now();
      sqlite.prepare(
        'INSERT INTO ProgressEntry (id, studentId, date, weightKg, bodyFat, measurements, notes) VALUES (?,?,?,?,?,?,?)'
      ).run(id, data.studentId, date, data.weightKg ?? null, data.bodyFat ?? null, data.measurements ?? null, data.notes ?? null);
      return sqlite.prepare('SELECT * FROM ProgressEntry WHERE id = ?').get(id);
    },
  },

  // ── Appointment ───────────────────────────────────────────────────────────

  appointment: {
    findMany({ where }: { where: { studentId?: string; trainerId?: string } }) {
      let rows: AppointmentRow[];
      if (where.studentId) {
        rows = sqlite.prepare('SELECT * FROM Appointment WHERE studentId = ? ORDER BY startsAt ASC').all(where.studentId) as AppointmentRow[];
      } else if (where.trainerId) {
        rows = sqlite.prepare('SELECT * FROM Appointment WHERE trainerId = ? ORDER BY startsAt ASC').all(where.trainerId) as AppointmentRow[];
      } else {
        rows = [];
      }
      return rows.map(expandAppointment);
    },

    findFirst({ where }: { where: { id?: string; trainerId?: string } }) {
      if (where.id && where.trainerId) {
        return sqlite.prepare('SELECT * FROM Appointment WHERE id = ? AND trainerId = ?').get(where.id, where.trainerId) ?? null;
      }
      return null;
    },

    create({ data }: {
      data: { trainerId: string; studentId: string; startsAt: Date; endsAt: Date; notes?: string };
    }) {
      const id = cuid();
      sqlite.prepare(
        'INSERT INTO Appointment (id, trainerId, studentId, startsAt, endsAt, notes) VALUES (?,?,?,?,?,?)'
      ).run(id, data.trainerId, data.studentId, data.startsAt.toISOString(), data.endsAt.toISOString(), data.notes ?? null);
      return expandAppointment(sqlite.prepare('SELECT * FROM Appointment WHERE id = ?').get(id) as AppointmentRow);
    },

    update({ where, data }: {
      where: { id: string };
      data: { status?: string; notes?: string; startsAt?: Date; endsAt?: Date };
    }) {
      sqlite.prepare(
        'UPDATE Appointment SET status = COALESCE(?, status), notes = COALESCE(?, notes), startsAt = COALESCE(?, startsAt), endsAt = COALESCE(?, endsAt) WHERE id = ?'
      ).run(
        data.status ?? null,
        data.notes ?? null,
        data.startsAt?.toISOString() ?? null,
        data.endsAt?.toISOString() ?? null,
        where.id,
      );
      return expandAppointment(sqlite.prepare('SELECT * FROM Appointment WHERE id = ?').get(where.id) as AppointmentRow);
    },
  },

  // ── Payment ───────────────────────────────────────────────────────────────

  payment: {
    findMany({ where, include }: {
      where: { studentId?: string; student?: { trainerId?: string } };
      include?: object;
    }) {
      let rows: PaymentRow[];
      if (where.studentId) {
        rows = sqlite.prepare('SELECT * FROM Payment WHERE studentId = ? ORDER BY dueDate DESC').all(where.studentId) as PaymentRow[];
      } else if (where.student?.trainerId) {
        rows = sqlite.prepare(
          'SELECT p.* FROM Payment p JOIN StudentProfile sp ON sp.id = p.studentId WHERE sp.trainerId = ? ORDER BY p.dueDate DESC'
        ).all(where.student.trainerId) as PaymentRow[];
      } else {
        rows = [];
      }
      return rows.map((p) => expandPayment(p, include));
    },

    findFirst({ where }: { where: { id?: string; student?: { trainerId?: string } } }) {
      if (where.id && where.student?.trainerId) {
        return sqlite.prepare(
          'SELECT p.* FROM Payment p JOIN StudentProfile sp ON sp.id = p.studentId WHERE p.id = ? AND sp.trainerId = ?'
        ).get(where.id, where.student.trainerId) ?? null;
      }
      return null;
    },

    create({ data }: {
      data: { studentId: string; amount: number; dueDate: Date; notes?: string };
    }) {
      const id = cuid();
      const ts = now();
      sqlite.prepare(
        'INSERT INTO Payment (id, studentId, amount, dueDate, notes, createdAt) VALUES (?,?,?,?,?,?)'
      ).run(id, data.studentId, data.amount, data.dueDate.toISOString(), data.notes ?? null, ts);
      return sqlite.prepare('SELECT * FROM Payment WHERE id = ?').get(id);
    },

    update({ where, data }: {
      where: { id: string };
      data: { status?: string; paidAt?: Date };
    }) {
      sqlite.prepare('UPDATE Payment SET status = COALESCE(?, status), paidAt = COALESCE(?, paidAt) WHERE id = ?')
        .run(data.status ?? null, data.paidAt?.toISOString() ?? null, where.id);
      return sqlite.prepare('SELECT * FROM Payment WHERE id = ?').get(where.id);
    },
  },
};

// ── Internal helpers ─────────────────────────────────────────────────────────

interface StudentProfileRow { id: string; userId: string; trainerId: string | null; goal: string | null; birthDate: string | null }
interface WorkoutRow { id: string; name: string; notes: string | null; studentId: string; trainerId: string | null; createdAt: string; updatedAt: string }
interface ExerciseInput { name: string; sets?: number; reps?: string; weightKg?: number; restSeconds?: number; order?: number }
interface AppointmentRow { id: string; startsAt: string; endsAt: string; status: string; notes: string | null; trainerId: string; studentId: string }
interface PaymentRow { id: string; amount: number; dueDate: string; paidAt: string | null; status: string; notes: string | null; createdAt: string; studentId: string }
interface IncludeOptions { user?: { select?: object }; workouts?: { include?: object }; progress?: object; appointments?: object; payments?: object }

function insertExercise(workoutId: string, ex: ExerciseInput) {
  sqlite.prepare(
    'INSERT INTO WorkoutExercise (id, workoutId, name, sets, reps, weightKg, restSeconds, "order") VALUES (?,?,?,?,?,?,?,?)'
  ).run(cuid(), workoutId, ex.name, ex.sets ?? 3, ex.reps ?? '12', ex.weightKg ?? null, ex.restSeconds ?? null, ex.order ?? 0);
}

function expandWorkout(w: WorkoutRow) {
  const exercises = sqlite.prepare('SELECT * FROM WorkoutExercise WHERE workoutId = ? ORDER BY "order" ASC').all(w.id);
  return { ...w, exercises };
}

function expandStudent(row: StudentProfileRow, include?: IncludeOptions) {
  const result: Record<string, unknown> = { ...row };
  if (include?.user) {
    const user = sqlite.prepare('SELECT id, name, email, phone FROM User WHERE id = ?').get(row.userId) as { id: string; name: string; email: string; phone: string | null } | undefined;
    result.user = user;
  }
  if (include?.workouts) {
    const workouts = sqlite.prepare('SELECT * FROM Workout WHERE studentId = ? ORDER BY createdAt DESC').all(row.id) as WorkoutRow[];
    result.workouts = workouts.map(expandWorkout);
  }
  if (include?.progress) {
    result.progress = sqlite.prepare('SELECT * FROM ProgressEntry WHERE studentId = ? ORDER BY date DESC').all(row.id);
  }
  if (include?.appointments) {
    result.appointments = sqlite.prepare('SELECT * FROM Appointment WHERE studentId = ? ORDER BY startsAt DESC').all(row.id);
  }
  if (include?.payments) {
    result.payments = sqlite.prepare('SELECT * FROM Payment WHERE studentId = ? ORDER BY dueDate DESC').all(row.id);
  }
  return result;
}

function expandAppointment(a: AppointmentRow) {
  const student = sqlite.prepare('SELECT sp.*, u.name as userName FROM StudentProfile sp JOIN User u ON u.id = sp.userId WHERE sp.id = ?').get(a.studentId) as { id: string; userName: string } | undefined;
  return { ...a, student: student ? { ...student, user: { name: student.userName } } : null };
}

function expandPayment(p: PaymentRow, include?: object) {
  if (!include) return p;
  const student = sqlite.prepare('SELECT sp.*, u.name as userName FROM StudentProfile sp JOIN User u ON u.id = sp.userId WHERE sp.id = ?').get(p.studentId) as { id: string; userName: string } | undefined;
  return { ...p, student: student ? { ...student, user: { name: student.userName } } : null };
}
