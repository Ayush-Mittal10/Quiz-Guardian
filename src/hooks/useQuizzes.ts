
import { useQuery } from '@tanstack/react-query';
import { Quiz, QuizSettings } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useQuizzes() {
  const { user } = useAuth();
  
  const fetchQuizzes = async (): Promise<Quiz[]> => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        id, 
        title, 
        description, 
        created_at,
        created_by,
        test_id,
        settings,
        is_active
      `)
      .eq('created_by', user.id);
      
    if (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }

    return data.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || '',
      createdBy: quiz.created_by,
      createdAt: quiz.created_at,
      settings: quiz.settings as unknown as QuizSettings,
      questions: [],
      testId: quiz.test_id,
      isActive: quiz.is_active
    }));
  };
  
  return useQuery({
    queryKey: ['quizzes', user?.id],
    queryFn: fetchQuizzes,
    enabled: !!user,
    retry: 1,
  });
}
