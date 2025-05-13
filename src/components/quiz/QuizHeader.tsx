import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';

interface QuizHeaderProps {
  title: string;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="Quizzly Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-primary">Quizzly</h1>
        </Link>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </header>
  );
};
