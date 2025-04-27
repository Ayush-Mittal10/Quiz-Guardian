
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/types';

interface GenerateQuestionsParams {
  topic: string;
  numQuestions: number;
  difficulty?: 'easy' | 'moderate' | 'hard' | 'expert';
}

export async function generateQuestionsWithAI({
  topic,
  numQuestions,
  difficulty = 'moderate'
}: GenerateQuestionsParams): Promise<QuizQuestion[]> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-quiz-questions', {
      body: {
        topic,
        numQuestions,
        difficulty
      }
    });

    if (error) {
      console.error('Error invoking generate-quiz-questions function:', error);
      throw new Error(error.message || 'Failed to generate questions');
    }

    if (!data || !data.questions) {
      throw new Error('No questions generated');
    }

    return data.questions;
  } catch (error) {
    console.error('Error generating AI questions:', error);
    throw error;
  }
}
