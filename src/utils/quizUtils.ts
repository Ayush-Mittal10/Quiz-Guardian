
import { supabase } from '@/integrations/supabase/client';
import { Quiz, QuizQuestion, QuizSettings, Warning, JsonWarning } from '@/types';

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
      console.error('Error creating quiz:', quizError);
      return {
        success: false,
        id: '',
        testId: '',
        error: quizError
      };
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
        console.error('Error inserting questions:', questionsError);
        return {
          success: false,
          id: quizData.id,
          testId,
          error: questionsError
        };
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

export async function saveQuizAttempt(
  quizId: string,
  studentId: string,
  answers: Record<string, number[]>,
  warnings: Warning[] = [],
  autoSubmitted: boolean = false
): Promise<{ success: boolean; id: string; error?: any }> {
  try {
    // First, calculate the score by comparing answers with correct answers
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, correct_answers, points')
      .eq('quiz_id', quizId);
    
    if (questionsError) {
      throw questionsError;
    }
    
    // Calculate the score
    let totalScore = 0;
    let totalPossibleScore = 0;
    
    questions.forEach((question: any) => {
      totalPossibleScore += question.points;
      
      const studentAnswers = answers[question.id] || [];
      const correctAnswers = question.correct_answers || [];
      
      // For a perfect match (all correct options selected and no incorrect ones)
      if (
        studentAnswers.length === correctAnswers.length &&
        studentAnswers.every(answer => correctAnswers.includes(answer))
      ) {
        totalScore += question.points;
      }
    });
    
    // Calculate percentage score (rounded to nearest integer)
    const scorePercentage = Math.round((totalScore / totalPossibleScore) * 100);
    
    // Convert warnings to JsonWarning format for database storage
    const jsonWarnings: Record<string, any>[] = warnings.map(warning => ({
      type: warning.type,
      timestamp: warning.timestamp,
      description: warning.description
    }));
    
    // Insert the attempt
    const { data: attemptData, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: studentId,
        answers: answers,
        warnings: jsonWarnings,
        auto_submitted: autoSubmitted,
        score: scorePercentage,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (attemptError) {
      throw attemptError;
    }
    
    return {
      success: true,
      id: attemptData.id
    };
  } catch (error: any) {
    console.error('Error saving quiz attempt:', error);
    return {
      success: false,
      id: '',
      error
    };
  }
}
