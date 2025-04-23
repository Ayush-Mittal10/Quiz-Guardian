
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Quiz, Warning, JsonWarning } from '@/types';

interface QuizAttempt {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  score: number;
  timeSpent: number;
  submittedAt: string;
  autoSubmitted: boolean;
  warnings: Warning[];
}

export const useQuizResults = (quizId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizAndAttempts = async () => {
      if (!quizId) return;
      
      setLoading(true);
      try {
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('id, title, description, test_id')
          .eq('id', quizId)
          .single();
        
        if (quizError) throw quizError;
        
        // Fetch questions count
        const { count: questionCount, error: countError } = await supabase
          .from('questions')
          .select('id', { count: 'exact' })
          .eq('quiz_id', quizId);
          
        if (countError) throw countError;
        
        // Fetch attempts
        const { data: attemptsData, error: attemptsError } = await supabase
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
            score
          `)
          .eq('quiz_id', quizId);
          
        if (attemptsError) throw attemptsError;
        
        // Get student profiles separately
        const studentIds = attemptsData.map(attempt => attempt.student_id);
        
        if (studentIds.length === 0) {
          // Handle case with no attempts
          setQuiz({
            id: quizData.id,
            title: quizData.title,
            description: quizData.description || '',
            testId: quizData.test_id,
            totalQuestions: questionCount || 0
          });
          setAttempts([]);
          return;
        }
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            name
          `)
          .in('id', studentIds);
          
        if (profilesError) throw profilesError;
        
        // Create a map for easy profile lookup
        const profilesMap = new Map<string, { id: string; name: string; email: string }>();
        
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, {
            id: profile.id,
            name: profile.name,
            email: '' // We won't have emails available through regular queries
          });
        });
        
        // Transform data
        const formattedQuiz: Quiz = {
          id: quizData.id,
          title: quizData.title,
          description: quizData.description || '',
          testId: quizData.test_id,
          totalQuestions: questionCount || 0
        };
        
        const formattedAttempts: QuizAttempt[] = attemptsData.map(attempt => {
          const studentProfile = profilesMap.get(attempt.student_id) || {
            id: attempt.student_id,
            name: 'Unknown Student',
            email: ''
          };
          
          const parsedWarnings: Warning[] = Array.isArray(attempt.warnings) 
            ? attempt.warnings.map((warning: JsonWarning) => ({
                type: warning.type,
                timestamp: warning.timestamp,
                description: warning.description
              }))
            : [];
          
          return {
            id: attempt.id,
            student: studentProfile,
            score: attempt.score || 0,
            timeSpent: calculateTimeSpent(attempt.started_at, attempt.submitted_at),
            submittedAt: attempt.submitted_at || attempt.started_at,
            autoSubmitted: attempt.auto_submitted || false,
            warnings: parsedWarnings
          };
        });
        
        setQuiz(formattedQuiz);
        setAttempts(formattedAttempts);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error fetching results',
          description: error.message || 'Failed to load quiz results',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizAndAttempts();
  }, [quizId, toast]);

  const calculateTimeSpent = (startTime: string, endTime?: string): number => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    return Math.round((end - start) / 1000);
  };

  return { loading, quiz, attempts };
};
