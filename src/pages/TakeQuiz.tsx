
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz, QuizQuestion, Warning } from '@/types';
import { useQuizByTestId } from '@/hooks/useQuizByTestId';
import { saveQuizAttempt, createInitialAttempt, updateQuizAttemptAnswers } from '@/utils/quizUtils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TakeQuiz = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: quiz, isLoading, error } = useQuizByTestId(testId);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  
  useEffect(() => {
    if (quiz && !quiz.isActive) {
      toast({
        title: "Quiz Not Active",
        description: "This quiz is not currently active. Please contact your professor.",
        variant: "destructive",
      });
      navigate(`/join-quiz/${testId}`);
    }
  }, [quiz, testId, navigate, toast]);
  
  useEffect(() => {
    if (quiz && user) {
      setTimeLeft(quiz.settings.timeLimit * 60);
      console.log("Quiz loaded with questions:", quiz.questions.length);
      
      // Create initial attempt when quiz is loaded
      const initializeAttempt = async () => {
        try {
          const result = await createInitialAttempt(quiz.id, user.id);
          if (result.success && result.id) {
            console.log("Initial attempt created with ID:", result.id);
            setAttemptId(result.id);
          } else if (result.attemptId) {
            // If there's an existing attempt, use that ID
            console.log("Existing attempt found:", result.attemptId);
            setAttemptId(result.attemptId);
            
            // If there are existing answers, load them
            if (result.answers) {
              console.log("Loading existing answers");
              setAnswers(result.answers);
            }
          } else {
            console.error("Failed to create initial attempt:", result.error || result.message);
            toast({
              title: "Error",
              description: result.message || "Failed to initialize quiz attempt",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error("Error initializing attempt:", err);
        }
      };
      
      initializeAttempt();
    }
  }, [quiz, user]);
  
  // Update answers in the database periodically
  useEffect(() => {
    if (!attemptId || Object.keys(answers).length === 0) return;
    
    const updateInterval = setInterval(async () => {
      console.log("Updating answers in database...");
      try {
        await updateQuizAttemptAnswers(attemptId, answers);
      } catch (error) {
        console.error("Error updating answers:", error);
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(updateInterval);
  }, [attemptId, answers]);
  
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      if (!quiz?.settings.monitoringEnabled) return;
      
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
    
    if (quiz) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [quiz]);
  
  useEffect(() => {
    if (!quiz || timeLeft <= 0) return;
    
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
  }, [quiz, timeLeft]);
  
  useEffect(() => {
    if (!quiz?.settings.monitoringEnabled) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addWarning('tab-switch', 'Tab change detected');
      }
    };
    
    const handleFocusLoss = () => {
      addWarning('focus-loss', 'Window focus lost');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleFocusLoss);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleFocusLoss);
    };
  }, [quiz]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const addWarning = (type: 'tab-switch' | 'focus-loss' | 'multiple-faces' | 'no-face', description: string) => {
    if (!quiz || !attemptId) return;
    
    const newWarning: Warning = {
      timestamp: new Date().toISOString(),
      type,
      description,
    };
    
    setWarnings(prev => {
      const updatedWarnings = [...prev, newWarning];
      
      setAlertMessage(`Warning: ${description}`);
      setIsAlertVisible(true);
      setTimeout(() => setIsAlertVisible(false), 3000);
      
      // Update warnings in the database
      if (attemptId) {
        try {
          supabase
            .from('quiz_attempts')
            .update({ warnings: updatedWarnings })
            .eq('id', attemptId)
            .then(({ error }) => {
              if (error) console.error("Error updating warnings:", error);
            });
        } catch (error) {
          console.error("Error updating warnings:", error);
        }
      }
      
      if (updatedWarnings.length >= quiz.settings.allowedWarnings) {
        submitQuiz(true);
      }
      
      return updatedWarnings;
    });
  };
  
  const handleAnswerChange = (questionId: string, optionIndex: number, checked: boolean) => {
    if (!quiz) return;
    
    const question = quiz.questions.find(q => q.id === questionId);
    
    if (!question) return;
    
    let updatedAnswers;
    
    if (question.type === 'single-choice') {
      updatedAnswers = {
        ...answers,
        [questionId]: [optionIndex],
      };
    } else {
      const currentAnswers = answers[questionId] || [];
      
      if (checked) {
        updatedAnswers = {
          ...answers,
          [questionId]: [...currentAnswers, optionIndex],
        };
      } else {
        updatedAnswers = {
          ...answers,
          [questionId]: currentAnswers.filter(index => index !== optionIndex),
        };
      }
    }
    
    setAnswers(updatedAnswers);
  };
  
  const goToNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const submitQuiz = async (autoSubmitted: boolean = false) => {
    if (!quiz || !user || submitting || !attemptId) return;
    
    setSubmitting(true);
    
    try {
      const result = await saveQuizAttempt(
        attemptId,
        quiz.id,
        user.id,
        answers,
        warnings,
        autoSubmitted
      );
      
      if (result.success) {
        navigate('/quiz-submitted', { 
          state: { 
            quizId: quiz.id,
            quizTitle: quiz.title,
            autoSubmitted,
            warnings: warnings.length,
          }
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to submit quiz. Please try again.",
          variant: "destructive",
        });
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading quiz...</div>
      </div>
    );
  }
  
  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-4">Error Loading Quiz</h1>
          <p className="text-muted-foreground mb-6">{error instanceof Error ? error.message : "Quiz not found"}</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  if (!quiz.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-4">Quiz Not Active</h1>
          <p className="text-muted-foreground mb-6">This quiz is not currently active. Please contact your professor.</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-4">No Questions Available</h1>
          <p className="text-muted-foreground mb-6">This quiz doesn't have any questions yet.</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen bg-gray-50 relative">
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
                    <Button 
                      onClick={() => submitQuiz(false)}
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-4">
                {quiz.settings.monitoringEnabled && (
                  <>
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
                  </>
                )}
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Question Navigator</h3>
                  <div className="grid grid-cols-5 gap-1">
                    {quiz.questions.map((_, index) => (
                      <Button
                        key={index}
                        variant={currentQuestionIndex === index ? "default" : 
                          answers[quiz.questions[index].id] ? "outline" : "secondary"}
                        size="sm"
                        className={`h-8 w-8 p-0 ${answers[quiz.questions[index].id] ? "border-green-500" : ""}`}
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
