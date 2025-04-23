
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { QuizHeader } from '@/components/quiz/QuizHeader';
import { supabase } from '@/integrations/supabase/client';
import { Quiz } from '@/types';

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
      return data as Quiz;
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
            {/* TODO: Add quiz edit form here */}
            <div className="flex justify-end space-x-4 mt-4">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditQuiz;
