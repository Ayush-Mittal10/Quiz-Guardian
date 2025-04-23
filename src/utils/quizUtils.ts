
import { supabase } from '@/integrations/supabase/client';
import { Quiz, QuizQuestion, QuizSettings } from '@/types';

export async function saveQuiz(
  title: string, 
  description: string, 
  settings: QuizSettings,
  questions: QuizQuestion[],
  userId: string
): Promise<{ success: boolean; id: string; testId: string; error?: any }> {
  try {
    // Generate a unique test ID (uppercase letters and numbers)
    const testId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Insert the quiz - explicitly cast settings to Json type expected by Supabase
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title,
        description,
        settings: settings as any, // Cast to any to satisfy TypeScript
        created_by: userId,
        test_id: testId
      })
      .select()
      .single();
    
    if (quizError) {
      throw quizError;
    }

    // Insert all questions
    if (questions.length > 0) {
      const questionsToInsert = questions.map(question => ({
        quiz_id: quizData.id,
        text: question.text,
        type: question.type,
        options: question.options,
        correct_answers: question.correctAnswers,
        points: question.points
      }));
      
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);
      
      if (questionsError) {
        throw questionsError;
      }
    }

    return {
      success: true,
      id: quizData.id,
      testId
    };
  } catch (error) {
    console.error('Error saving quiz:', error);
    return {
      success: false,
      id: '',
      testId: '',
      error
    };
  }
}
