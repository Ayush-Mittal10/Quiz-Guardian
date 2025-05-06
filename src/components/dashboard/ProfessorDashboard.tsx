
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizzes } from '@/hooks/useQuizzes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

export function ProfessorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: quizzes, isLoading, isError, error } = useQuizzes();

  // Use useEffect to show toast on error instead of doing it directly in render
  React.useEffect(() => {
    if (isError && error) {
      toast.error("Failed to load quizzes", {
        description: "Please try again later.",
      });
    }
  }, [isError, error]);

  const handleQuizActivation = async (quizId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: !currentState })
        .eq('id', quizId);

      if (error) throw error;

      toast.success(currentState ? 'Quiz deactivated' : 'Quiz activated');
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    } catch (err) {
      toast.error('Failed to update quiz status', {
        description: 'Please try again later.',
      });
    }
  };

  const handleQuizDelete = async (quizId: string, quizTitle: string) => {
    try {
      // First, delete all questions associated with the quiz
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId);
        
      if (questionsError) {
        throw questionsError;
      }
      
      // Then delete the quiz itself
      const { error: quizError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);
        
      if (quizError) {
        throw quizError;
      }

      toast.success(`Quiz "${quizTitle}" deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    } catch (err) {
      console.error('Error deleting quiz:', err);
      toast.error('Failed to delete quiz', {
        description: 'Please try again later.',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Professor Dashboard</h1>
          <p className="text-muted-foreground">Manage your quizzes and review results</p>
        </div>
        <Button onClick={() => navigate('/create-quiz')}>Create New Quiz</Button>
      </div>

      <div className="grid gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Quizzes</h2>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <p className="text-muted-foreground">Loading quizzes...</p>
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Unable to load quizzes. Please try again later.
                </p>
              </CardContent>
            </Card>
          ) : quizzes?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  You haven't created any quizzes yet. Click "Create New Quiz" to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes?.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{quiz.title}</CardTitle>
                        <CardDescription>Test ID: {quiz.testId}</CardDescription>
                      </div>
                      <Switch
                        checked={quiz.isActive}
                        onCheckedChange={() => handleQuizActivation(quiz.id, quiz.isActive || false)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{quiz.description}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Time:</span> {quiz.settings.timeLimit} min
                      </div>
                      <div>
                        <span className="font-medium">Monitoring:</span>{' '}
                        {quiz.settings.monitoringEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/edit-quiz/${quiz.id}`)}>
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete this quiz?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the quiz "{quiz.title}" 
                              and all associated questions and student attempts.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleQuizDelete(quiz.id, quiz.title)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => navigate(`/monitor-quiz/${quiz.id}`)}>
                        Monitor
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/results/${quiz.id}`)}>
                        Results
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
