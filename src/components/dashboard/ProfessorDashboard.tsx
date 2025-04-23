
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useToast } from '@/hooks/use-toast';

export function ProfessorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: quizzes, isLoading, isError } = useQuizzes();
  const { toast } = useToast();

  if (isError) {
    toast({
      title: "Error",
      description: "Failed to load quizzes. Please try again later.",
      variant: "destructive",
    });
  }

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
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>Test ID: {quiz.testId}</CardDescription>
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
                    <Button variant="outline" size="sm" onClick={() => navigate(`/edit-quiz/${quiz.id}`)}>
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/monitor-quiz/${quiz.id}`)}>
                      Monitor
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/results/${quiz.id}`)}>
                      Results
                    </Button>
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
