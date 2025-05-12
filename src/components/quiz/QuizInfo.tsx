import React from 'react';
import { Quiz } from '@/types';

interface QuizInfoProps {
  quiz: Quiz;
}

export const QuizInfo: React.FC<QuizInfoProps> = ({ quiz }) => {
  return (
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
      {quiz.settings.monitoringEnabled && (
        <div className="flex justify-between">
          <span className="font-medium">Warning Limit:</span>
          <span>{quiz.settings.allowedWarnings} warnings</span>
        </div>
      )}
    </div>
  );
};
