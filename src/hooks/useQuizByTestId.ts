
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Quiz, QuizQuestion, QuizSettings } from '@/types';

export function useQuizByTestId(testId: string | undefined) {
  return useQuery({
    queryKey: ['quiz', testId],
    queryFn: async () => {
      if (!testId) throw new Error('Test ID is required');

      console.log('Fetching quiz with test_id:', testId);
      
      // First, get the quiz details
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('test_id', testId)
        .single();

      if (quizError) {
        console.error('Error fetching quiz by test_id:', quizError);
        throw quizError;
      }
      
      if (!quiz) {
        console.error('No quiz found for test_id:', testId);
        throw new Error('Quiz not found');
      }

      console.log('Found quiz:', quiz);
      console.log('Quiz ID for question lookup:', quiz.id);

      // Check if the quiz ID is a valid UUID before proceeding
      if (!quiz.id || typeof quiz.id !== 'string' || quiz.id.length < 36) {
        console.error('Invalid quiz ID format:', quiz.id);
        throw new Error('Invalid quiz ID format');
      }

      // Try to fetch questions with the updated RLS policies
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id.toString());

      if (questionsError) {
        console.error('Error fetching questions for quiz_id:', quiz.id, questionsError);
        throw questionsError;
      }
      
      console.log('Found questions count with new RLS policies:', questions?.length || 0);
      
      // Add detailed debugging for questions
      if (questions && questions.length > 0) {
        console.log('Questions found for quiz_id:', quiz.id);
        questions.forEach((q, index) => {
          console.log(`Question ${index + 1}:`, {
            id: q.id,
            quiz_id: q.quiz_id,
            text: q.text,
            type: q.type,
            correctAnswers: q.correct_answers,
            options: Array.isArray(q.options) ? q.options : []
          });
        });
      } else {
        console.log('No questions found for quiz_id:', quiz.id);
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
      console.log('Question count after formatting:', formattedQuiz.questions.length);
      return formattedQuiz;
    },
    enabled: !!testId,
  });
}
