
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizByTestId } from '@/hooks/useQuizByTestId';
import { QuizHeader } from '@/components/quiz/QuizHeader';
import { QuizInfo } from '@/components/quiz/QuizInfo';
import { MonitoringWarning } from '@/components/quiz/MonitoringWarning';
import { PermissionsStatus } from '@/components/quiz/PermissionsStatus';
import { QuizErrorDisplay } from '@/components/quiz/QuizErrorDisplay';
import { useToast } from '@/components/ui/use-toast';
import { useStudentAttempts } from '@/hooks/useStudentAttempts';

const JoinQuiz = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
  });
  
  const { data: quiz, isLoading: quizLoading, error: quizError } = useQuizByTestId(testId);
  const { attempts } = useStudentAttempts();

  const hasAttempted = quiz && attempts.some(attempt => attempt.quizId === quiz.id);

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      if (quiz?.settings.monitoringEnabled) {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStream.getTracks().forEach(track => track.stop());
        
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(track => track.stop());
      }
      
      setPermissions({
        camera: true,
        microphone: true,
      });
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setPermissions({
        camera: false,
        microphone: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => {
    if (testId) {
      navigate(`/take-quiz/${testId}`);
    }
  };
  
  useEffect(() => {
    if (quiz && !quiz.settings.monitoringEnabled) {
      setPermissions({
        camera: true,
        microphone: true,
      });
    }
    
    if (quiz) {
      console.log("Quiz joined:", quiz);
      console.log("Quiz questions:", quiz.questions);
      console.log("Questions count:", quiz.questions?.length);
      
      if (!quiz.questions || quiz.questions.length === 0) {
        toast({
          title: "Warning",
          description: "This quiz doesn't have any questions yet.",
          variant: "default",
        });
      }
      
      if (!quiz.isActive) {
        toast({
          title: "Quiz Not Active",
          description: "This quiz is currently not active. Please contact your professor.",
          variant: "destructive",
        });
      }
    }
  }, [quiz, toast]);

  if (quizLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading quiz information...</div>
      </div>
    );
  }

  if (quizError || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <QuizHeader title="Academic Quiz Guardian" />
        <QuizErrorDisplay error={quizError ? quizError.message : "Quiz not found"} />
      </div>
    );
  }

  if (hasAttempted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <QuizHeader title="Academic Quiz Guardian" />
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Already Attempted</CardTitle>
                <CardDescription>You have already taken this quiz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 text-center">
                  <div className="mb-4 text-amber-500 text-6xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Multiple Attempts Not Allowed</h2>
                  <p className="text-gray-500 mb-4">
                    You have already attempted this quiz. Only one attempt is allowed per student.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }
  
  if (!quiz.isActive) {
    return (
      <div className="min-h-screen bg-gray-50">
        <QuizHeader title="Academic Quiz Guardian" />
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Not Active</CardTitle>
                <CardDescription>This quiz is currently not available</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 text-center">
                  <div className="mb-4 text-red-500 text-6xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Quiz Not Active</h2>
                  <p className="text-gray-500 mb-4">
                    This quiz is currently not available for taking. Please contact your professor for more information.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizHeader title="Academic Quiz Guardian" />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Join Quiz: {testId}</CardTitle>
              <CardDescription>You are about to take a quiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quiz && (
                <>
                  <div>
                    <h2 className="text-xl font-semibold">{quiz.title}</h2>
                    <p className="text-muted-foreground">{quiz.description}</p>
                  </div>
                  
                  <QuizInfo quiz={quiz} />
                  <MonitoringWarning settings={quiz.settings} />
                  
                  {(!quiz.questions || quiz.questions.length === 0) && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                      <p className="font-medium">Warning: This quiz has no questions.</p>
                      <p className="text-sm">The professor may still be setting up this quiz.</p>
                    </div>
                  )}

                  {(quiz.questions && quiz.questions.length > 0) && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                      <p className="font-medium">Quiz ready: {quiz.questions.length} question(s) available.</p>
                    </div>
                  )}
                  
                  {quiz.settings.monitoringEnabled && (
                    <PermissionsStatus permissions={permissions} />
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              {quiz && quiz.settings.monitoringEnabled ? (
                permissions.camera && permissions.microphone ? (
                  <Button 
                    onClick={startQuiz}
                    disabled={!quiz.questions || quiz.questions.length === 0}
                  >
                    Start Quiz
                  </Button>
                ) : (
                  <Button 
                    onClick={requestPermissions} 
                    disabled={isLoading || !quiz.questions || quiz.questions.length === 0}
                  >
                    {isLoading ? 'Requesting...' : 'Grant Permissions'}
                  </Button>
                )
              ) : (
                <Button 
                  onClick={startQuiz}
                  disabled={quiz && (!quiz.questions || quiz.questions.length === 0)}
                >
                  Start Quiz
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default JoinQuiz;
