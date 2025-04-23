
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface QuizHeaderProps {
  title: string;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">Academic Quiz Guardian</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </header>
  );
};
