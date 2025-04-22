
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz, QuizQuestion, Warning } from '@/types';

// Mock quiz data
const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Introduction to Computer Science',
  description: 'Basic concepts of computer science and programming',
  createdBy: 'user-123',
  createdAt: '2023-05-15T10:30:00Z',
  settings: {
    timeLimit: 30,
    shuffleQuestions: true,
    showResults: true,
    monitoringEnabled: true,
    allowedWarnings: 3,
  },
  questions: [
    {
      id: 'q1',
      text: 'What does CPU stand for?',
      type: 'single-choice',
      options: [
        'Central Processing Unit',
        'Computer Personal Unit',
        'Central Processor Underlying',
        'Central Program Utility',
      ],
      correctAnswers: [0],
      points: 1,
    },
    {
      id: 'q2',
      text: 'Which of the following are programming languages? (Select all that apply)',
      type: 'multiple-choice',
      options: ['Python', 'HTML', 'Java', 'Binary'],
      correctAnswers: [0, 2],
      points: 2,
    },
    {
      id: 'q3',
      text: 'Which data structure operates on a First-In-First-Out (FIFO) principle?',
      type: 'single-choice',
      options: ['Stack', 'Queue', 'Tree', 'Heap'],
      correctAnswers: [1],
      points: 1,
    },
  ],
  testId: 'CS101',
};

const TakeQuiz = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz] = useState<Quiz>(mockQuiz);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.settings.timeLimit * 60); // in seconds
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Start camera feed
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        addWarning('no-face', 'Camera access failed');
      }
    };
    
    if (quiz.settings.monitoringEnabled) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [quiz.settings.monitoringEnabled]);
  
  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitQuiz(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Monitor tab/window focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addWarning('tab-switch', 'Tab change detected');
      }
    };
    
    const handleFocusLoss = () => {
      addWarning('focus-loss', 'Window focus lost');
    };
    
    if (quiz.settings.monitoringEnabled) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleFocusLoss);
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleFocusLoss);
    };
  }, [quiz.settings.monitoringEnabled]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const addWarning = (type: 'tab-switch' | 'focus-loss' | 'multiple-faces' | 'no-face', description: string) => {
    const newWarning: Warning = {
      timestamp: new Date().toISOString(),
      type,
      description,
    };
    
    setWarnings(prev => {
      const updatedWarnings = [...prev, newWarning];
      
      // Show alert
      setAlertMessage(`Warning: ${description}`);
      setIsAlertVisible(true);
      setTimeout(() => setIsAlertVisible(false), 3000);
      
      // Auto-submit if too many warnings
      if (updatedWarnings.length >= quiz.settings.allowedWarnings) {
        submitQuiz(true);
      }
      
      return updatedWarnings;
    });
  };
  
  const handleAnswerChange = (questionId: string, optionIndex: number, checked: boolean) => {
    const question = quiz.questions.find(q => q.id === questionId);
    
    if (!question) return;
    
    if (question.type === 'single-choice') {
      setAnswers(prev => ({
        ...prev,
        [questionId]: [optionIndex],
      }));
    } else {
      setAnswers(prev => {
        const currentAnswers = prev[questionId] || [];
        
        if (checked) {
          return {
            ...prev,
            [questionId]: [...currentAnswers, optionIndex],
          };
        } else {
          return {
            ...prev,
            [questionId]: currentAnswers.filter(index => index !== optionIndex),
          };
        }
      });
    }
  };
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const submitQuiz = (autoSubmitted: boolean = false) => {
    // In a real app, this would submit to the server
    console.log('Quiz submitted', {
      quizId: quiz.id,
      studentId: user?.id,
      answers,
      warnings,
      autoSubmitted,
    });
    
    navigate('/quiz-submitted', { 
      state: { 
        quizId: quiz.id,
        autoSubmitted,
        warnings: warnings.length,
      } 
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Warning alert */}
      {isAlertVisible && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Warning!</strong>
          <span className="block sm:inline"> {alertMessage}</span>
        </div>
      )}
      
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">{quiz.title}</h1>
          <div className="flex items-center gap-4">
            <div className="text-lg font-bold text-red-600">
              Time Left: {formatTime(timeLeft)}
            </div>
            <div className="text-sm">
              Warnings: {warnings.length}/{quiz.settings.allowedWarnings}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main content - Question */}
          <div className="md:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                  </span>
                  <span className="text-sm font-medium">
                    {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                  </span>
                </div>
                
                <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
                
                {currentQuestion.type === 'single-choice' ? (
                  <RadioGroup
                    value={(answers[currentQuestion.id]?.[0] ?? -1).toString()}
                    onValueChange={(value) => 
                      handleAnswerChange(currentQuestion.id, parseInt(value), true)
                    }
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                          {option}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                        <Checkbox
                          id={`option-${index}`}
                          checked={(answers[currentQuestion.id] || []).includes(index)}
                          onCheckedChange={(checked) => 
                            handleAnswerChange(currentQuestion.id, index, checked === true)
                          }
                        />
                        <label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={goToPrevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  
                  {currentQuestionIndex < quiz.questions.length - 1 ? (
                    <Button onClick={goToNextQuestion}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={() => submitQuiz(false)}>
                      Submit Quiz
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar - Camera feed */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-2">Monitoring</h3>
                <div className="rounded-md overflow-hidden bg-black mb-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-auto"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Stay in front of your camera and keep this window active.
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Question Navigator</h3>
                  <div className="grid grid-cols-5 gap-1">
                    {quiz.questions.map((_, index) => (
                      <Button
                        key={index}
                        variant={currentQuestionIndex === index ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TakeQuiz;
