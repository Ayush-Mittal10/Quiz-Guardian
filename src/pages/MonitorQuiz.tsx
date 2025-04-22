
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

// Mock student data
const mockStudents = [
  {
    id: 'student-1',
    name: 'John Smith',
    email: 'john@university.edu',
    progress: 2, // questions completed
    timeElapsed: 360, // seconds
    warnings: [
      { type: 'tab-switch', timestamp: '2023-05-16T10:05:30Z' },
    ],
  },
  {
    id: 'student-2',
    name: 'Emily Johnson',
    email: 'emily@university.edu',
    progress: 3,
    timeElapsed: 420,
    warnings: [],
  },
  {
    id: 'student-3',
    name: 'Michael Brown',
    email: 'michael@university.edu',
    progress: 1,
    timeElapsed: 280,
    warnings: [
      { type: 'tab-switch', timestamp: '2023-05-16T10:02:15Z' },
      { type: 'focus-loss', timestamp: '2023-05-16T10:06:45Z' },
    ],
  },
];

const MonitorQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState(mockStudents);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [videoFeed, setVideoFeed] = useState<string | null>(null);

  // Mock quiz data
  const quiz = {
    id: quizId,
    title: 'Introduction to Computer Science',
    totalQuestions: 3,
    timeLimit: 30, // minutes
    inProgress: true,
  };

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStudents(prev => 
        prev.map(student => ({
          ...student,
          timeElapsed: student.timeElapsed + 5,
          progress: Math.min(quiz.totalQuestions, 
            Math.floor(Math.random() * 2) === 1 ? 
              student.progress + 1 : student.progress
          )
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [quiz.totalQuestions]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStudentClick = (studentId: string) => {
    setSelectedStudent(studentId);
    // In a real app, this would fetch the video feed for the student
    setVideoFeed('/placeholder.svg'); // Placeholder image
  };

  const endQuiz = () => {
    // In a real app, this would end the quiz for all students
    navigate('/dashboard');
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
              <h1 className="text-3xl font-bold">Monitoring: {quiz.title}</h1>
              <p className="text-muted-foreground">
                Total Questions: {quiz.totalQuestions} | Time Limit: {quiz.timeLimit} minutes
              </p>
            </div>
            <Button variant="destructive" onClick={endQuiz}>
              End Quiz
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Students List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Students ({students.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Progress</th>
                          <th className="p-2 text-left">Time</th>
                          <th className="p-2 text-left">Warnings</th>
                          <th className="p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr 
                            key={student.id} 
                            className={`border-b border-muted ${
                              selectedStudent === student.id ? 'bg-blue-50' : ''
                            } hover:bg-gray-50 cursor-pointer`}
                            onClick={() => handleStudentClick(student.id)}
                          >
                            <td className="p-2">
                              <div>{student.name}</div>
                              <div className="text-xs text-muted-foreground">{student.email}</div>
                            </td>
                            <td className="p-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${(student.progress / quiz.totalQuestions) * 100}%` }}
                                ></div>
                              </div>
                              <div className="text-xs mt-1">{student.progress}/{quiz.totalQuestions}</div>
                            </td>
                            <td className="p-2">{formatTime(student.timeElapsed)}</td>
                            <td className="p-2">
                              {student.warnings.length > 0 ? (
                                <span className="text-red-500">{student.warnings.length}</span>
                              ) : (
                                <span className="text-green-500">0</span>
                              )}
                            </td>
                            <td className="p-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStudentClick(student.id);
                                }}
                              >
                                Monitor
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                      <div>
                        <h3 className="font-medium mb-2">Video Feed</h3>
                        <div className="rounded-md overflow-hidden bg-black mb-2 aspect-video">
                          {videoFeed ? (
                            <img 
                              src={videoFeed} 
                              alt="Student video feed" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-white">
                              Loading video...
                            </div>
                          )}
                        </div>
                      </div>

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
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            // In a real app, this would forcibly end the quiz for this student
                            setStudents(prev => 
                              prev.filter(student => student.id !== selectedStudent)
                            );
                            setSelectedStudent(null);
                          }}
                        >
                          End for Student
                        </Button>
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
        </div>
      </main>
    </div>
  );
};

export default MonitorQuiz;
