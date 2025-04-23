
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { QuizHeader } from '@/components/quiz/QuizHeader';
import { supabase } from '@/integrations/supabase/client';
import { Quiz, QuizSettings } from '@/types';
import { EditQuizForm } from '@/components/quiz/EditQuizForm';

const EditQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          description,
          settings,
          created_at,
          created_by,
          test_id,
          is_active
        `)
        .eq('id', quizId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Quiz not found');
      
      // Map the Supabase data structure to our Quiz type structure
      const formattedQuiz: Quiz = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        createdBy: data.created_by,
        createdAt: data.created_at,
        settings: data.settings as unknown as QuizSettings,
        questions: [], // We'll fetch questions separately if needed
        testId: data.test_id,
        isActive: data.is_active
      };
      
      return formattedQuiz;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <QuizHeader title="Edit Quiz" />
        <main className="container mx-auto px-4 py-6">
          <p>Loading quiz details...</p>
        </main>
      </div>
    );
  }

  if (error) {
    toast.error('Failed to load quiz', {
      description: 'Please try again later.',
    });
    return (
      <div className="min-h-screen bg-gray-50">
        <QuizHeader title="Edit Quiz" />
        <main className="container mx-auto px-4 py-6">
          <p className="text-red-500">Error loading quiz: {(error as Error).message}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizHeader title="Edit Quiz" />
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{quiz?.title}</CardTitle>
            <CardDescription>Edit quiz details and settings</CardDescription>
          </CardHeader>
          <CardContent>
            {quiz && <EditQuizForm quiz={quiz} />}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditQuiz;
