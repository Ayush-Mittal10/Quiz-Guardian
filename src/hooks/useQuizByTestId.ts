
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Quiz, QuizQuestion, QuizSettings } from '@/types';

export function useQuizByTestId(testId: string | undefined) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!testId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch quiz by test_id
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select(`
            id, 
            title, 
            description, 
            created_at,
            created_by,
            test_id,
            settings
          `)
          .eq('test_id', testId.toUpperCase())
          .maybeSingle(); // Change from single() to maybeSingle() to handle the case where no quiz is found
        
        if (quizError) throw quizError;
        
        if (!quizData) {
          setError(`No quiz found with test ID: ${testId}`);
          setIsLoading(false);
          return;
        }
        
        // Fetch questions for this quiz
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizData.id);
          
        if (questionsError) throw questionsError;
        
        // Transform data to match our Quiz type
        const formattedQuestions: QuizQuestion[] = questionsData.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type as 'multiple-choice' | 'single-choice',
          options: q.options as string[],
          correctAnswers: q.correct_answers as number[],
          points: q.points
        }));
        
        // Safely parse settings from JSON to our QuizSettings type
        const rawSettings = quizData.settings as Record<string, any>;
        const settings: QuizSettings = {
          timeLimit: typeof rawSettings?.timeLimit === 'number' ? rawSettings.timeLimit : 30,
          shuffleQuestions: typeof rawSettings?.shuffleQuestions === 'boolean' ? rawSettings.shuffleQuestions : true,
          showResults: typeof rawSettings?.showResults === 'boolean' ? rawSettings.showResults : true,
          monitoringEnabled: typeof rawSettings?.monitoringEnabled === 'boolean' ? rawSettings.monitoringEnabled : true,
          allowedWarnings: typeof rawSettings?.allowedWarnings === 'number' ? rawSettings.allowedWarnings : 3
        };
        
        const formattedQuiz: Quiz = {
          id: quizData.id,
          title: quizData.title,
          description: quizData.description || '',
          createdBy: quizData.created_by,
          createdAt: quizData.created_at,
          settings: settings,
          questions: formattedQuestions,
          testId: quizData.test_id
        };
        
        setQuiz(formattedQuiz);
      } catch (error: any) {
        console.error('Error fetching quiz:', error);
        setError(error.message || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuiz();
  }, [testId]);

  return { quiz, isLoading, error };
}
