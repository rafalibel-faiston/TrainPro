export type Role = 'TRAINER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
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
