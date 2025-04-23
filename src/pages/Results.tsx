
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuizResults } from '@/hooks/useQuizResults';
import { QuizStatsCards } from '@/components/quiz/QuizStatsCards';
import { StudentResultsTable } from '@/components/quiz/StudentResultsTable';
import { StudentDetailsPanel } from '@/components/quiz/StudentDetailsPanel';

const Results = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const { loading, quiz, attempts } = useQuizResults(quizId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl">Loading results...</p>
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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Results: {quiz?.title || 'Quiz'}</h1>

          <QuizStatsCards attempts={attempts} />

          <Card>
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
            </CardHeader>
            <CardContent>
              <StudentResultsTable
                attempts={attempts}
                selectedStudent={selectedStudent}
                onSelectStudent={setSelectedStudent}
              />
            </CardContent>
          </Card>

          {selectedStudent && (
            <StudentDetailsPanel
              attempt={attempts.find(a => a.student.id === selectedStudent)!}
              onClose={() => setSelectedStudent(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Results;
