
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

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      // Request camera permission if monitoring is enabled
      if (quiz?.settings.monitoringEnabled) {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStream.getTracks().forEach(track => track.stop()); // Stop the stream after getting permission
        
        // Request microphone permission
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(track => track.stop()); // Stop the stream
      }
      
      setPermissions({
        camera: true,
        microphone: true,
      });
    } catch (error) {
      console.error('Error requesting permissions:', error);
      // Continue anyway, but warn the user
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
    // If monitoring is disabled in quiz settings, auto-accept permissions
    if (quiz && !quiz.settings.monitoringEnabled) {
      setPermissions({
        camera: true,
        microphone: true,
      });
    }
    
    // Log quiz data for debugging
    if (quiz) {
      console.log("Quiz joined:", quiz);
      console.log("Quiz questions:", quiz.questions);
      
      if (!quiz.questions || quiz.questions.length === 0) {
        toast({
          title: "Warning",
          description: "This quiz doesn't have any questions yet.",
          variant: "warning",
        });
      }
    }
  }, [quiz]);

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
