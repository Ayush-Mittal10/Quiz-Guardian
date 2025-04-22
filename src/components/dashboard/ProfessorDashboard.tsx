
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz } from '@/types';

// Mock quizzes data
const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Introduction to Computer Science',
    description: 'Basic concepts of computer science and programming',
    createdBy: 'user-123',
    createdAt: '2023-05-15T10:30:00Z',
    settings: {
      timeLimit: 30,
      shuffleQuestions: true,
      showResults: true,
      monitoringEnabled: true,
      allowedWarnings: 3,
    },
    questions: [],
    testId: 'CS101',
  },
  {
    id: 'quiz-2',
    title: 'Advanced Mathematics',
    description: 'Calculus and linear algebra problems',
    createdBy: 'user-123',
    createdAt: '2023-05-20T14:15:00Z',
    settings: {
      timeLimit: 45,
      shuffleQuestions: true,
      showResults: false,
      monitoringEnabled: true,
      allowedWarnings: 2,
    },
    questions: [],
    testId: 'MATH201',
  },
];

export function ProfessorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes] = useState<Quiz[]>(mockQuizzes);

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
          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  You haven't created any quizzes yet. Click "Create New Quiz" to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
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
