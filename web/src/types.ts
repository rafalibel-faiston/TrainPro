export type Role = 'TRAINER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  // Apenas para alunos: personal vinculado (null se ainda não vinculado).
  trainer?: { id: string; name: string } | null;
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
  studentId: string;
  createdAt: string;
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

export interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED';
  notes?: string | null;
  student?: { user: { name: string } };
}

export interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  paidAt?: string | null;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  notes?: string | null;
  student?: { user: { name: string } };
}

export interface WorkoutLogEntry {
  id: string;
  exerciseName: string;
  setsDone?: number | null;
  repsDone?: string | null;
  weightKg?: number | null;
  done: boolean;
  order: number;
}

export interface WorkoutLog {
  id: string;
  date: string;
  notes?: string | null;
  workoutId: string;
  workout?: { name: string };
  entries: WorkoutLogEntry[];
}

export interface Meal {
  id: string;
  name: string;
  time?: string | null;
  description: string;
  order: number;
}

export interface DietPlan {
  id: string;
  name: string;
  notes?: string | null;
  createdAt: string;
  meals: Meal[];
}
