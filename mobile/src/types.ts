export type Role = 'TRAINER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weightKg?: number | null;
  restSeconds?: number | null;
  order: number;
}

export interface Workout {
  id: string;
  name: string;
  notes?: string | null;
  createdAt?: string;
  exercises: Exercise[];
}

export interface ProgressEntry {
  id: string;
  date: string;
  weightKg?: number | null;
  bodyFat?: number | null;
  measurements?: string | null;
  notes?: string | null;
}

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELED';

export interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes?: string | null;
  student?: { user: { name: string } };
}

export interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  paidAt?: string | null;
  notes?: string | null;
  student?: { user: { name: string } };
}

export interface SetLog {
  id: string;
  exerciseName: string;
  setNumber: number;
  weightKg?: number | null;
  reps?: number | null;
  done: boolean;
  order: number;
}

export interface WorkoutSession {
  id: string;
  startedAt: string;
  durationSec: number;
  workoutId: string;
  workout?: { id: string; name: string };
  sets: SetLog[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  goal?: string | null;
  birthDate?: string | null;
  userId: string;
}
