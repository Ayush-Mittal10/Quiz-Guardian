
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface QuizErrorDisplayProps {
  error: string;
}

export const QuizErrorDisplay: React.FC<QuizErrorDisplayProps> = ({ error }) => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-6">
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || "Quiz not found. Please check the test ID and try again."}
        </AlertDescription>
      </Alert>
      <div className="flex justify-center mt-6">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
