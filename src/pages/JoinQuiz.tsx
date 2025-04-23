
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizByTestId } from '@/hooks/useQuizByTestId';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const JoinQuiz = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
  });
  
  const { quiz, isLoading: quizLoading, error: quizError } = useQuizByTestId(testId);

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
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-primary">Academic Quiz Guardian</h1>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {quizError || "Quiz not found. Please check the test ID and try again."}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">Academic Quiz Guardian</h1>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Join Quiz: {testId}</CardTitle>
              <CardDescription>You are about to take a quiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{quiz.title}</h2>
                <p className="text-muted-foreground">{quiz.description}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Time Limit:</span>
                  <span>{quiz.settings.timeLimit} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Monitoring:</span>
                  <span>{quiz.settings.monitoringEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Questions:</span>
                  <span>{quiz.questions.length}</span>
                </div>
              </div>
              
              {quiz.settings.monitoringEnabled && (
                <div className="border rounded-md p-4 bg-amber-50">
                  <h3 className="font-semibold mb-2">Important: Monitoring Enabled</h3>
                  <p className="text-sm mb-4">
                    This quiz requires camera and microphone access to monitor for academic honesty.
                    The following actions will be tracked:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Face detection through your camera</li>
                    <li>Tab switching and window focus</li>
                    <li>Multiple or no faces in camera view</li>
                  </ul>
                  <div className="mt-4 text-sm">
                    <strong>Warning:</strong> After {quiz.settings.allowedWarnings} integrity violations, your quiz will be automatically submitted.
                  </div>
                </div>
              )}
              
              {quiz.settings.monitoringEnabled && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Permissions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`border rounded-md p-3 ${permissions.camera ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span>Camera</span>
                        {permissions.camera ? (
                          <span className="text-green-600 text-sm">Granted</span>
                        ) : (
                          <span className="text-amber-600 text-sm">Required</span>
                        )}
                      </div>
                    </div>
                    <div className={`border rounded-md p-3 ${permissions.microphone ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span>Microphone</span>
                        {permissions.microphone ? (
                          <span className="text-green-600 text-sm">Granted</span>
                        ) : (
                          <span className="text-amber-600 text-sm">Required</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              {quiz.settings.monitoringEnabled ? (
                permissions.camera && permissions.microphone ? (
                  <Button onClick={startQuiz}>Start Quiz</Button>
                ) : (
                  <Button 
                    onClick={requestPermissions} 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Requesting...' : 'Grant Permissions'}
                  </Button>
                )
              ) : (
                <Button onClick={startQuiz}>Start Quiz</Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default JoinQuiz;
