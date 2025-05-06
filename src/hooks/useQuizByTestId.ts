
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

      console.log('Found quiz:', quiz);

      // Then, get the questions for this quiz
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id);

      if (questionsError) throw questionsError;
      
      console.log('Found questions:', questions?.length || 0);
      
      // Add this debugging to check the structure of returned questions
      if (questions) {
        questions.forEach((q, index) => {
          console.log(`Question ${index + 1}:`, {
            id: q.id,
            text: q.text,
            correctAnswers: q.correct_answers,
            options: Array.isArray(q.options) ? q.options : []
          });
        });
      }

      // Cast the settings object to ensure TypeScript recognizes its structure
      const quizSettings = quiz.settings as Record<string, any>;

      // Transform the data to match our Quiz type
      const formattedQuiz: Quiz = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description || '',
        createdBy: quiz.created_by,
        createdAt: quiz.created_at,
        settings: {
          timeLimit: typeof quizSettings.timeLimit === 'number' ? quizSettings.timeLimit : 30,
          shuffleQuestions: typeof quizSettings.shuffleQuestions === 'boolean' ? quizSettings.shuffleQuestions : false,
          showResults: typeof quizSettings.showResults === 'boolean' ? quizSettings.showResults : true,
          monitoringEnabled: typeof quizSettings.monitoringEnabled === 'boolean' ? quizSettings.monitoringEnabled : false,
          allowedWarnings: typeof quizSettings.allowedWarnings === 'number' ? quizSettings.allowedWarnings : 3
        } as QuizSettings,
        testId: quiz.test_id,
        isActive: quiz.is_active || false,
        // Map the questions to match our QuizQuestion type and ensure it's never undefined
        questions: Array.isArray(questions) ? questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswers: Array.isArray(q.correct_answers) ? q.correct_answers : [],
          points: typeof q.points === 'number' ? q.points : 1
        })) as QuizQuestion[] : []
      };

      console.log('Formatted quiz:', formattedQuiz);
      console.log('Question count:', formattedQuiz.questions.length);
      return formattedQuiz;
    },
    enabled: !!testId,
  });
}
