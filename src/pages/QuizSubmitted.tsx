
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const QuizSubmitted = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    quizId: string;
    autoSubmitted: boolean;
    warnings: number;
    quizTitle?: string;
  } || { quizId: '', autoSubmitted: false, warnings: 0 };

  // Ensure warnings is a number and not undefined
  const warningsCount = typeof state.warnings === 'number' ? state.warnings : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {state.autoSubmitted ? (
                <span className="text-red-600">Quiz Auto-Submitted</span>
              ) : (
                'Quiz Submitted Successfully'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.autoSubmitted ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800 mb-2">
                  Your quiz was automatically submitted due to potential academic integrity violations.
                </p>
                <p className="text-sm text-red-700">
                  {warningsCount} warning{warningsCount !== 1 ? 's' : ''} were recorded during your session.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <p className="text-green-800">
                  Your answers have been recorded successfully.
                </p>
                {warningsCount > 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    Note: {warningsCount} warning{warningsCount !== 1 ? 's' : ''} were recorded during your session.
                  </p>
                )}
              </div>
            )}
            
            <div className="text-center mt-4">
              <p className="text-muted-foreground">
                Your professor will review the results and may reach out if they have any concerns.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default QuizSubmitted;
