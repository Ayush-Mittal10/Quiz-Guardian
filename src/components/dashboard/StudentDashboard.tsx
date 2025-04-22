
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { QuizAttempt } from '@/types';

// Mock quiz attempts data
const mockAttempts: QuizAttempt[] = [
  {
    id: 'attempt-1',
    quizId: 'quiz-1',
    studentId: 'user-456',
    startedAt: '2023-05-16T09:45:00Z',
    submittedAt: '2023-05-16T10:15:00Z',
    answers: {},
    warnings: [],
    autoSubmitted: false,
    score: 85,
  },
  {
    id: 'attempt-2',
    quizId: 'quiz-2',
    studentId: 'user-456',
    startedAt: '2023-05-21T13:30:00Z',
    submittedAt: '2023-05-21T14:10:00Z',
    answers: {},
    warnings: [
      {
        timestamp: '2023-05-21T13:45:00Z',
        type: 'tab-switch',
        description: 'Tab change detected',
      },
    ],
    autoSubmitted: false,
    score: 72,
  },
];

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [testId, setTestId] = useState('');
  const [attempts] = useState<QuizAttempt[]>(mockAttempts);

  const handleJoinQuiz = () => {
    if (testId.trim()) {
      navigate(`/join-quiz/${testId}`);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Join quizzes and view your previous attempts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Join a Quiz</CardTitle>
          <CardDescription>Enter the test ID provided by your professor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Test ID (e.g., CS101)"
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
            />
            <Button onClick={handleJoinQuiz}>Join</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quiz History</h2>
        {attempts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                You haven't taken any quizzes yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">Quiz</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Score</th>
                  <th className="p-2 text-left">Warnings</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b border-muted">
                    <td className="p-2">
                      {attempt.quizId === 'quiz-1'
                        ? 'Introduction to Computer Science'
                        : 'Advanced Mathematics'}
                    </td>
                    <td className="p-2">
                      {new Date(attempt.startedAt).toLocaleDateString()}
                    </td>
                    <td className="p-2">{attempt.score}%</td>
                    <td className="p-2">{attempt.warnings.length}</td>
                    <td className="p-2">
                      {attempt.autoSubmitted ? (
                        <span className="text-destructive">Auto-submitted</span>
                      ) : (
                        <span className="text-green-600">Completed</span>
                      )}
                    </td>
                    <td className="p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/quiz-result/${attempt.id}`)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
