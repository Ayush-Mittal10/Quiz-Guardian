
// User and authentication types
export type UserRole = 'professor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// Quiz types
export interface QuizSettings {
  timeLimit: number; // in minutes
  shuffleQuestions: boolean;
  showResults: boolean;
  monitoringEnabled: boolean;
  allowedWarnings: number;
}

export type QuestionType = 'multiple-choice' | 'single-choice';

export interface QuizQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswers: number[]; // Indexes of correct options
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  settings: QuizSettings;
  questions: QuizQuestion[];
  testId: string;
  isActive?: boolean;
  updatedAt?: string;
}

// Student quiz attempt
export interface Warning {
  timestamp: string;
  type: 'tab-switch' | 'focus-loss' | 'multiple-faces' | 'no-face';
  description: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  answers: Record<string, number[]>; // Question ID -> selected option indexes
  warnings: Warning[];
  autoSubmitted: boolean;
  score?: number;
  // Extended properties for UI
  student?: {
    id: string;
    name: string;
    email: string;
  };
  timeSpent?: number;
  quizTitle?: string;
  testId?: string;
}

// Add a specific type for JSON data from Supabase
export type JsonWarning = {
  type: 'tab-switch' | 'focus-loss' | 'multiple-faces' | 'no-face';
  timestamp: string;
  description?: string;
};
