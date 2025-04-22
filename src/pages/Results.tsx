
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

// Mock results data
const mockResults = [
  {
    studentId: 'student-1',
    studentName: 'John Smith',
    studentEmail: 'john@university.edu',
    score: 85,
    timeSpent: 1560, // in seconds
    submittedAt: '2023-05-16T10:15:00Z',
    autoSubmitted: false,
    warnings: [
      { type: 'tab-switch', timestamp: '2023-05-16T10:05:30Z' },
    ],
  },
  {
    studentId: 'student-2',
    studentName: 'Emily Johnson',
    studentEmail: 'emily@university.edu',
    score: 100,
    timeSpent: 1200,
    submittedAt: '2023-05-16T10:10:00Z',
    autoSubmitted: false,
    warnings: [],
  },
  {
    studentId: 'student-3',
    studentName: 'Michael Brown',
    studentEmail: 'michael@university.edu',
    score: 55,
    timeSpent: 1680,
    submittedAt: '2023-05-16T10:20:00Z',
    autoSubmitted: true,
    warnings: [
      { type: 'tab-switch', timestamp: '2023-05-16T10:02:15Z' },
      { type: 'focus-loss', timestamp: '2023-05-16T10:06:45Z' },
      { type: 'tab-switch', timestamp: '2023-05-16T10:12:30Z' },
    ],
  },
];

const Results = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results] = useState(mockResults);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Mock quiz data
  const quiz = {
    id: quizId,
    title: 'Introduction to Computer Science',
    totalQuestions: 3,
    totalPoints: 5,
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;

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
          <h1 className="text-3xl font-bold mb-6">Results: {quiz.title}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{averageScore.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{results.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Integrity Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {results.filter(r => r.warnings.length > 0).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Student</th>
                      <th className="p-2 text-left">Score</th>
                      <th className="p-2 text-left">Time Spent</th>
                      <th className="p-2 text-left">Submitted</th>
                      <th className="p-2 text-left">Warnings</th>
                      <th className="p-2 text-left">Integrity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr
                        key={result.studentId}
                        className={`border-b border-muted ${
                          selectedStudent === result.studentId ? 'bg-blue-50' : ''
                        } hover:bg-gray-50 cursor-pointer`}
                        onClick={() => setSelectedStudent(result.studentId)}
                      >
                        <td className="p-2">
                          <div>{result.studentName}</div>
                          <div className="text-xs text-muted-foreground">{result.studentEmail}</div>
                        </td>
                        <td className="p-2">
                          <div className={`font-medium ${
                            result.score >= 70 ? 'text-green-600' :
                            result.score >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {result.score}%
                          </div>
                        </td>
                        <td className="p-2">{formatTime(result.timeSpent)}</td>
                        <td className="p-2">
                          <div>{new Date(result.submittedAt).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(result.submittedAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="p-2">
                          {result.warnings.length > 0 ? (
                            <span className="text-red-500">{result.warnings.length}</span>
                          ) : (
                            <span className="text-green-500">0</span>
                          )}
                        </td>
                        <td className="p-2">
                          {result.autoSubmitted ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              Auto-submitted
                            </span>
                          ) : result.warnings.length > 0 ? (
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                              Warning
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Good
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {selectedStudent && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>
                  Student Details: {results.find(r => r.studentId === selectedStudent)?.studentName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Warning Logs</h3>
                    <div className="border rounded-md p-3">
                      {results.find(r => r.studentId === selectedStudent)?.warnings.length ? (
                        <div className="space-y-2">
                          {results.find(r => r.studentId === selectedStudent)?.warnings.map((warning, index) => (
                            <div key={index} className="text-sm border-b pb-2">
                              <div className="text-red-500">{warning.type}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(warning.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No warnings recorded</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedStudent(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        // In a real app, this would download detailed results
                        alert('Detailed results would be downloaded here');
                      }}
                    >
                      Export Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Results;
