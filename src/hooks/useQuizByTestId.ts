
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Quiz, QuizQuestion, QuizSettings } from '@/types';

export function useQuizByTestId(testId: string | undefined) {
  return useQuery({
    queryKey: ['quiz', testId],
    queryFn: async () => {
      if (!testId) throw new Error('Test ID is required');

      // First, get the quiz details
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('test_id', testId)
        .single();

      if (quizError) throw quizError;
      if (!quiz) throw new Error('Quiz not found');

      // Then, get the questions for this quiz
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id);

      if (questionsError) throw questionsError;

      // Transform the data to match our Quiz type
      const formattedQuiz: Quiz = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description || '',
        createdBy: quiz.created_by,
        createdAt: quiz.created_at,
        settings: {
          timeLimit: quiz.settings.timeLimit || 30,
          shuffleQuestions: quiz.settings.shuffleQuestions || false,
          showResults: quiz.settings.showResults || true,
          monitoringEnabled: quiz.settings.monitoringEnabled || false,
          allowedWarnings: quiz.settings.allowedWarnings || 3
        } as QuizSettings,
        testId: quiz.test_id,
        isActive: quiz.is_active || false,
        // Map the questions to match our QuizQuestion type
        questions: questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswers: q.correct_answers,
          points: q.points
        })) as QuizQuestion[]
      };

      return formattedQuiz;
    },
    enabled: !!testId,
  });
}
