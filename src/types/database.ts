
import { Json } from "@/integrations/supabase/types";

// Extended types to add monitoring_available field to quiz_attempts
export interface QuizAttemptRow {
  answers?: Json | null;
  auto_submitted?: boolean | null;
  created_at: string;
  id: string;
  quiz_id: string;
  score?: number | null;
  started_at: string;
  student_id: string;
  submitted_at?: string | null;
  warnings?: Json | null;
  monitoring_available?: boolean;
}

// Helper type for upserts/updates
export type QuizAttemptUpdate = {
  answers?: Json | null;
  auto_submitted?: boolean | null;
  created_at?: string;
  id?: string;
  quiz_id?: string;
  score?: number | null;
  started_at?: string;
  student_id?: string;
  submitted_at?: string | null;
  warnings?: Json | null;
  monitoring_available?: boolean;
};
