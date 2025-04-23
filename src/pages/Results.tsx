
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Warning, JsonWarning } from '@/types';

interface QuizAttempt {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  score: number;
  timeSpent: number; // in seconds
  submittedAt: string;
  autoSubmitted: boolean;
  warnings: Warning[];
}

interface Warning {
  type: 'tab-switch' | 'focus-loss' | 'multiple-faces' | 'no-face';
  timestamp: string;
  description?: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  testId: string;
  totalQuestions: number;
}

interface ProfileResult {
  id: string;
  name: string;
  email: string;
}

const Results = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizAndAttempts = async () => {
      if (!quizId) return;
      
      setLoading(true);
      try {
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('id, title, description, test_id')
          .eq('id', quizId)
          .single();
        
        if (quizError) throw quizError;
        
        // Fetch questions count
        const { count: questionCount, error: countError } = await supabase
          .from('questions')
          .select('id', { count: 'exact' })
          .eq('quiz_id', quizId);
          
        if (countError) throw countError;
        
        // Fetch attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select(`
            id, 
            quiz_id,
            student_id,
            started_at,
            submitted_at,
            answers,
            warnings,
            auto_submitted,
            score
          `)
          .eq('quiz_id', quizId);
          
        if (attemptsError) throw attemptsError;
        
        // Get student profiles separately
        const studentIds = attemptsData.map(attempt => attempt.student_id);
        
        if (studentIds.length === 0) {
          // Handle case with no attempts
          setQuiz({
            id: quizData.id,
            title: quizData.title,
            description: quizData.description || '',
            testId: quizData.test_id,
            totalQuestions: questionCount || 0
          });
          setAttempts([]);
          setLoading(false);
          return;
        }
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            name
          `)
          .in('id', studentIds);
          
        if (profilesError) throw profilesError;
        
        // Using the auth API to get emails is typically restricted
        // Instead, we'll manage without emails for now
        const profilesMap = new Map<string, ProfileResult>();
        
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, {
            id: profile.id,
            name: profile.name,
            email: '' // We won't have emails available through regular queries
          });
        });
        
        // Transform data to match our component's expected format
        const formattedQuiz: Quiz = {
          id: quizData.id,
          title: quizData.title,
          description: quizData.description || '',
          testId: quizData.test_id,
          totalQuestions: questionCount || 0
        };
        
        const formattedAttempts: QuizAttempt[] = attemptsData.map(attempt => {
          const studentProfile = profilesMap.get(attempt.student_id) || {
            id: attempt.student_id,
            name: 'Unknown Student',
            email: ''
          };
          
          // Properly parse the warnings as Warning[] type
          const parsedWarnings: Warning[] = Array.isArray(attempt.warnings) 
            ? attempt.warnings.map((warning: JsonWarning) => ({
                type: warning.type,
                timestamp: warning.timestamp,
                description: warning.description
              }))
            : [];
          
          return {
            id: attempt.id,
            student: {
              id: studentProfile.id,
              name: studentProfile.name,
              email: studentProfile.email
            },
            score: attempt.score || 0,
            timeSpent: calculateTimeSpent(attempt.started_at, attempt.submitted_at),
            submittedAt: attempt.submitted_at || attempt.started_at,
            autoSubmitted: attempt.auto_submitted || false,
            warnings: parsedWarnings
          };
        });
        
        setQuiz(formattedQuiz);
        setAttempts(formattedAttempts);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error fetching results',
          description: error.message || 'Failed to load quiz results',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizAndAttempts();
  }, [quizId, toast]);

  const calculateTimeSpent = (startTime: string, endTime?: string): number => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    return Math.round((end - start) / 1000); // Convert to seconds
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const averageScore = attempts.length > 0 
    ? attempts.reduce((sum, result) => sum + result.score, 0) / attempts.length
    : 0;

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
                <div className="text-3xl font-bold">{attempts.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Integrity Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {attempts.filter(r => r.warnings && r.warnings.length > 0).length}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time Spent</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Warnings</TableHead>
                      <TableHead>Integrity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((result) => (
                      <TableRow
                        key={result.id}
                        className={selectedStudent === result.student.id ? 'bg-blue-50' : ''}
                        onClick={() => setSelectedStudent(result.student.id)}
                      >
                        <TableCell>
                          <div>{result.student.name}</div>
                          <div className="text-xs text-muted-foreground">{result.student.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${
                            result.score >= 70 ? 'text-green-600' :
                            result.score >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {result.score}%
                          </div>
                        </TableCell>
                        <TableCell>{formatTime(result.timeSpent)}</TableCell>
                        <TableCell>
                          <div>{new Date(result.submittedAt).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(result.submittedAt).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {result.warnings && result.warnings.length > 0 ? (
                            <span className="text-red-500">{result.warnings.length}</span>
                          ) : (
                            <span className="text-green-500">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.autoSubmitted ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              Auto-submitted
                            </span>
                          ) : result.warnings && result.warnings.length > 0 ? (
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                              Warning
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Good
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {attempts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No quiz attempts found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selectedStudent && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>
                  Student Details: {attempts.find(r => r.student.id === selectedStudent)?.student.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Warning Logs</h3>
                    <div className="border rounded-md p-3">
                      {attempts.find(r => r.student.id === selectedStudent)?.warnings?.length ? (
                        <div className="space-y-2">
                          {attempts.find(r => r.student.id === selectedStudent)?.warnings.map((warning, index) => (
                            <div key={index} className="text-sm border-b pb-2">
                              <div className="text-red-500">{warning.type}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(warning.timestamp).toLocaleTimeString()}
                              </div>
                              {warning.description && (
                                <div className="text-xs">{warning.description}</div>
                              )}
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
                        toast({
                          title: "Export Feature",
                          description: "This feature would export detailed results for this student"
                        });
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
