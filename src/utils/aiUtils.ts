
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
    console.log(`Invoking generate-quiz-questions with topic: ${topic}, numQuestions: ${numQuestions}, difficulty: ${difficulty}`);
    
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

    if (!data) {
      console.error('No data returned from function');
      throw new Error('No data returned from function');
    }

    if (data.error) {
      console.error('Error from edge function:', data.error);
      if (data.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing details.');
      }
      throw new Error(data.error);
    }

    if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      console.error('No questions generated or invalid questions format:', data);
      throw new Error('No questions generated');
    }

    console.log(`Successfully generated ${data.questions.length} questions`);
    return data.questions;
  } catch (error) {
    console.error('Error generating AI questions:', error);
    throw error;
  }
}
