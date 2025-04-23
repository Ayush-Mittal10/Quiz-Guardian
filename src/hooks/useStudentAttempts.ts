
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { QuizAttempt, JsonWarning, Warning } from '@/types';

export function useStudentAttempts() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttempts = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const { data, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select(`
            id, 
            quiz_id,
            student_id,
            started_at,
            submitted_at,
            answers,
            warnings,
            auto_submitted,
            score,
            quizzes(title, test_id)
          `)
          .eq('student_id', user.id)
          .order('started_at', { ascending: false });
        
        if (attemptsError) throw attemptsError;
        
        const formattedAttempts: QuizAttempt[] = data.map((attempt: any) => {
          // Calculate time spent
          const startTime = new Date(attempt.started_at).getTime();
          const endTime = attempt.submitted_at ? new Date(attempt.submitted_at).getTime() : Date.now();
          const timeSpent = Math.round((endTime - startTime) / 1000); // in seconds
          
          // Safely process warnings with proper type handling
          const rawWarnings = Array.isArray(attempt.warnings) ? attempt.warnings : [];
          const warnings: Warning[] = rawWarnings.map((w: any) => ({
            timestamp: w.timestamp || new Date().toISOString(),
            type: w.type || 'focus-loss',
            description: w.description || ''
          }));
          
          return {
            id: attempt.id,
            quizId: attempt.quiz_id,
            studentId: attempt.student_id,
            startedAt: attempt.started_at,
            submittedAt: attempt.submitted_at,
            answers: attempt.answers || {},
            warnings: warnings,
            autoSubmitted: attempt.auto_submitted || false,
            score: attempt.score,
            // Add extended properties for UI
            quizTitle: attempt.quizzes?.title || 'Unknown Quiz',
            testId: attempt.quizzes?.test_id || '',
            timeSpent
          };
        });
        
        setAttempts(formattedAttempts);
      } catch (error: any) {
        console.error('Error fetching attempts:', error);
        setError(error.message || 'Failed to load attempts');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAttempts();
  }, [user]);

  return { attempts, isLoading, error };
}
