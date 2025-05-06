
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizMonitoring } from '@/hooks/useQuizMonitoring';
import { StudentVideoMonitor } from '@/components/quiz/StudentVideoMonitor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const MonitorQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  
  const {
    loading,
    students,
    totalQuestions,
    quizTitle,
    timeLimit,
    endQuizForStudent,
    endQuizForAll,
    refreshData
  } = useQuizMonitoring(quizId);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStudentClick = (studentId: string) => {
    setSelectedStudent(prevId => prevId === studentId ? null : studentId);
  };

  const handleEndQuiz = async () => {
    console.log("Ending quiz for all students");
    const success = await endQuizForAll();
    if (success) {
      toast({
        title: "Quiz ended",
        description: "The quiz has been ended for all students.",
      });
      
      // Wait a moment before navigating to results
      setTimeout(() => {
        navigate(`/results/${quizId}`);
      }, 1500);
    }
  };
  
  const handleEndForStudent = async (studentId: string, attemptId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection
    console.log(`Ending quiz for student ${studentId}`);
    await endQuizForStudent(studentId, attemptId);
    if (selectedStudent === studentId) {
      setSelectedStudent(null);
    }
  };

  const handleRefresh = () => {
    refreshData();
    toast({
      title: "Refreshed",
      description: "Monitoring data has been updated."
    });
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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Monitoring: {quizTitle || 'Quiz'}</h1>
              <p className="text-muted-foreground">
                Total Questions: {totalQuestions} | Time Limit: {timeLimit} minutes
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh Data
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">End Quiz</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                      End Quiz for All Students
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately submit the quiz for all students currently taking it 
                      and deactivate the quiz so no new students can join.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleEndQuiz}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      End Quiz
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading monitoring data...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Students List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Students ({students.length})</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {students.length === 0 ? 'No active students' : 'Real-time monitoring active'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {students.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No students are currently taking this quiz
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Warnings</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => (
                            <TableRow 
                              key={student.attemptId} 
                              className={`${selectedStudent === student.id ? 'bg-blue-50' : ''} cursor-pointer`}
                              onClick={() => handleStudentClick(student.id)}
                            >
                              <TableCell>
                                <div>{student.name}</div>
                                <div className="text-xs text-muted-foreground">{student.email}</div>
                              </TableCell>
                              <TableCell>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className="bg-blue-600 h-2.5 rounded-full" 
                                    style={{ width: `${totalQuestions > 0 ? (student.progress / totalQuestions) * 100 : 0}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs mt-1">{student.progress}/{totalQuestions}</div>
                              </TableCell>
                              <TableCell>{formatTime(student.timeElapsed)}</TableCell>
                              <TableCell>
                                {student.warnings.length > 0 ? (
                                  <span className="text-red-500">{student.warnings.length}</span>
                                ) : (
                                  <span className="text-green-500">0</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()} // Prevent row selection
                                    >
                                      End for Student
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>End Quiz for {student.name}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will immediately submit the quiz for this student.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={(e) => handleEndForStudent(student.id, student.attemptId, e as any)}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        End Quiz
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Student Monitoring */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedStudent ? (
                      <div className="space-y-4">
                        <StudentVideoMonitor studentId={selectedStudent} />

                        <div>
                          <h3 className="font-medium mb-2">Warning Logs</h3>
                          <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                            {students.find(s => s.id === selectedStudent)?.warnings.length ? (
                              <div className="space-y-2">
                                {students.find(s => s.id === selectedStudent)?.warnings.map((warning, index) => (
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
                            size="sm" 
                            className="flex-1"
                            onClick={() => setSelectedStudent(null)}
                          >
                            Close
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="flex-1"
                              >
                                End for Student
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>End Quiz for Student</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will immediately submit the quiz for this student.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={(e) => {
                                    const studentData = students.find(s => s.id === selectedStudent);
                                    if (studentData) {
                                      handleEndForStudent(studentData.id, studentData.attemptId, e as any);
                                    }
                                  }}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  End Quiz
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground p-4">
                        Select a student to view monitoring details
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MonitorQuiz;
