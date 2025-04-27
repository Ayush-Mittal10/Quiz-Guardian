import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuizResults } from '@/hooks/useQuizResults';
import { QuizStatsCards } from '@/components/quiz/QuizStatsCards';
import { StudentResultsTable } from '@/components/quiz/StudentResultsTable';
import { StudentDetailsPanel } from '@/components/quiz/StudentDetailsPanel';
import { FileExcel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Results = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const { loading, quiz, attempts } = useQuizResults(quizId);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl">Loading results...</p>
      </div>
    );
  }

  const selectedAttempt = selectedStudent 
    ? attempts.find(a => a.studentId === selectedStudent) 
    : null;

  const handleExportResults = () => {
    if (!attempts || attempts.length === 0) {
      toast({
        title: "No results to export",
        description: "There are no quiz attempts to export.",
        variant: "destructive"
      });
      return;
    }

    const sortedAttempts = [...attempts].sort((a, b) => (b.score || 0) - (a.score || 0));

    const headers = ['Rank', 'Student Name', 'Email', 'Score (%)', 'Time Spent (mm:ss)', 'Warnings', 'Status', 'Submitted At'];
    const csvContent = [headers];

    sortedAttempts.forEach((attempt, index) => {
      const mins = Math.floor((attempt.timeSpent || 0) / 60);
      const secs = (attempt.timeSpent || 0) % 60;
      const timeSpentFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;
      
      const status = attempt.autoSubmitted ? 'Auto-submitted' : 
        (attempt.warnings && attempt.warnings.length > 0 ? 'Warning' : 'Good');

      csvContent.push([
        (index + 1).toString(),
        attempt.student?.name || 'Unknown Student',
        attempt.student?.email || '',
        attempt.score?.toString() || '0',
        timeSpentFormatted,
        (attempt.warnings?.length || 0).toString(),
        status,
        attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'Not submitted'
      ]);
    });

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${quiz?.title || 'Quiz'}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "The results have been exported to a CSV file.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">Academic Quiz Guardian</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportResults}>
              <FileExcel className="mr-2" />
              Export Results
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
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

          {selectedAttempt && (
            <StudentDetailsPanel
              attempt={selectedAttempt}
              onClose={() => setSelectedStudent(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Results;
