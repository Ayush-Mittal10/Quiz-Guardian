
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const JoinQuiz = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
  });

  // Mock quiz data - in a real app this would come from an API
  const quizInfo = {
    title: 'Introduction to Computer Science',
    description: 'Basic concepts of computer science and programming',
    timeLimit: 30,
    monitoringEnabled: true,
  };

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      // Request camera permission
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStream.getTracks().forEach(track => track.stop()); // Stop the stream after getting permission
      
      // Request microphone permission
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getTracks().forEach(track => track.stop()); // Stop the stream
      
      setPermissions({
        camera: true,
        microphone: true,
      });
    } catch (error) {
      console.error('Error requesting permissions:', error);
      // Continue anyway for this demo
      setPermissions({
        camera: false,
        microphone: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => {
    // In a real app, we would create a quiz attempt in the database
    navigate(`/take-quiz/${testId}`);
  };

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
                <h2 className="text-xl font-semibold">{quizInfo.title}</h2>
                <p className="text-muted-foreground">{quizInfo.description}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Time Limit:</span>
                  <span>{quizInfo.timeLimit} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Monitoring:</span>
                  <span>{quizInfo.monitoringEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              
              {quizInfo.monitoringEnabled && (
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
                    <strong>Warning:</strong> After 3 integrity violations, your quiz will be automatically submitted.
                  </div>
                </div>
              )}
              
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              {permissions.camera && permissions.microphone ? (
                <Button onClick={startQuiz}>Start Quiz</Button>
              ) : (
                <Button 
                  onClick={requestPermissions} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Requesting...' : 'Grant Permissions'}
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
