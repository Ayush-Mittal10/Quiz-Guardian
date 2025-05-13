import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';

const Quiz: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(1200); // Assuming 20 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleExit = () => {
    // Implement exit logic
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Quizzly Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-primary">Quizzly</h1>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Time Remaining: {formatTime(timeLeft)}
            </div>
            <Button variant="outline" onClick={handleExit}>
              Exit Quiz
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Quiz; 