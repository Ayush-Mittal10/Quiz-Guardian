import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz, QuizQuestion, Warning, JsonWarning } from '@/types';
import { useQuizByTestId } from '@/hooks/useQuizByTestId';
import { saveQuizAttempt, createInitialAttempt, updateQuizAttemptAnswers } from '@/utils/quizUtils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { initFaceDetection, startFaceMonitoring } from '@/utils/faceDetectionUtils';
import { initStudentWebRTC } from '@/utils/webRTCUtils';
import { QuizAttemptUpdate } from '@/types/database';

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
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [facesDetected, setFacesDetected] = useState<number>(0);
  const videoCheckInterval = useRef<number | null>(null);
  const [streamStatus, setStreamStatus] = useState<'inactive' | 'connecting' | 'active' | 'error'>('inactive');
  const webRTCCleanupRef = useRef<(() => void) | null>(null);
  
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
            // Initialize with empty warnings array
            setWarnings(result.warnings || []);
          } else if (result.attemptId) {
            // If there's an existing attempt, use that ID
            console.log("Existing attempt found:", result.attemptId);
            setAttemptId(result.attemptId);
            
            // If there are existing answers, load them
            if (result.answers) {
              console.log("Loading existing answers");
              setAnswers(result.answers);
            }
            
            // If there are existing warnings, load them
            if (result.warnings && Array.isArray(result.warnings)) {
              console.log("Loading existing warnings:", result.warnings);
              setWarnings(result.warnings);
            } else {
              // Initialize with empty warnings array if none exists
              setWarnings([]);
            }
          } else {
            console.error("Failed to create initial attempt:", result.error || result.message);
            toast({
              title: "Error",
              description: result.message || "Failed to initialize quiz attempt",
              variant: "destructive",
            });
            
            // If the message indicates they already submitted, redirect to the dashboard
            if (result.message?.includes("already submitted")) {
              navigate('/dashboard');
            }
          }
        } catch (err) {
          console.error("Error initializing attempt:", err);
        }
      };
      
      initializeAttempt();
    }
  }, [quiz, user]);
  
  // Update answers in the database when user answers a question
  const saveAnswersToDatabase = async (updatedAnswers: Record<string, number[]>) => {
    if (!attemptId || Object.keys(updatedAnswers).length === 0) return;
    
    console.log("Saving answers to database...");
    try {
      await updateQuizAttemptAnswers(attemptId, updatedAnswers);
    } catch (error) {
      console.error("Error updating answers:", error);
    }
  };
  
  // Update answers in the database periodically
  useEffect(() => {
    if (!attemptId || Object.keys(answers).length === 0) return;
    
    // Save immediately when answers change
    saveAnswersToDatabase(answers);
    
    const updateInterval = setInterval(() => {
      console.log("Periodic update of answers...");
      saveAnswersToDatabase(answers);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(updateInterval);
  }, [attemptId, answers]);
  
  // Camera monitoring
  useEffect(() => {
    let stream: MediaStream | null = null;
    let monitoringInterval: number | null = null;
    
    const startCamera = async () => {
      if (!quiz?.settings.monitoringEnabled) return;
      
      try {
        // Request camera and microphone access
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: quiz.settings.monitoringEnabled // Enable audio if monitoring is enabled
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Initialize face detection if monitoring is enabled
          if (quiz.settings.monitoringEnabled) {
            // Initialize face-api.js models
            const modelsLoaded = await initFaceDetection();
            
            if (modelsLoaded) {
              // Start face monitoring once models are loaded
              // Wait a moment for the video to initialize
              setTimeout(() => {
                if (videoRef.current) {
                  monitoringInterval = startFaceMonitoring(
                    videoRef.current,
                    5000, // Check every 5 seconds
                    lastActivity,
                    (type, description) => {
                      console.log(`Face monitoring violation: ${type} - ${description}`);
                      addWarning(type, description);
                      setFacesDetected(type === 'multiple-faces' ? 2 : type === 'no-face' ? 0 : 1);
                    }
                  );
                }
              }, 2000);
            } else {
              console.error('Failed to load face detection models');
              addWarning('no-face', 'Face detection initialization failed');
            }
            
            // Initialize WebRTC for real-time monitoring
            if (user && quiz.id && stream && attemptId) {
              console.log('Initializing WebRTC for student monitoring');
              setStreamStatus('connecting');
              
              try {
                const cleanup = await initStudentWebRTC(
                  quiz.id,
                  user.id,
                  stream,
                  (status) => {
                    console.log('WebRTC status change:', status);
                    setStreamStatus(status === 'connected' ? 'active' : 
                                   status === 'connecting' ? 'connecting' : 
                                   status === 'error' ? 'error' : 'inactive');
                                   
                    // If status is 'connected', update monitoring_available to true
                    if (status === 'connected' && attemptId) {
                      const updateData: QuizAttemptUpdate = { monitoring_available: true };
                      supabase.from('quiz_attempts')
                        .update(updateData)
                        .eq('id', attemptId)
                        .then(({ error }) => {
                          if (error) {
                            console.error('Error updating monitoring_available:', error);
                          } else {
                            console.log('Successfully updated monitoring_available to true');
                          }
                        });
                    }
                  }
                );
                
                webRTCCleanupRef.current = cleanup;
                
                console.log('WebRTC initialized successfully');
              } catch (err) {
                console.error('Error initializing WebRTC:', err);
                setStreamStatus('error');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        addWarning('no-face', 'Camera access failed');
      }
    };
    
    // Only start camera and WebRTC when we have an attemptId
    if (quiz && attemptId) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
      
      // Clean up WebRTC
      if (webRTCCleanupRef.current) {
        console.log('Cleaning up WebRTC connections');
        webRTCCleanupRef.current();
        webRTCCleanupRef.current = null;
        
        // Make sure monitoring_available is set to false on cleanup
        if (attemptId) {
          const updateData: QuizAttemptUpdate = { monitoring_available: false };
          supabase.from('quiz_attempts')
            .update(updateData)
            .eq('id', attemptId)
            .then(({ error }) => {
              if (error) {
                console.error('Error updating monitoring_available on cleanup:', error);
              }
            });
        }
      }
    };
  }, [quiz, attemptId, user]);
  
  // Update last activity timestamp on user interaction
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };
    
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, []);
  
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
  
  // Enhanced tab visibility and focus monitoring
  useEffect(() => {
    if (!quiz?.settings.monitoringEnabled || !attemptId) return;
    
    const handleVisibilityChange = () => {
      console.log("Tab change detected - document hidden");
      addWarning('tab-switch', 'Tab change detected');
    };
    
    const handleFocusLoss = () => {
      console.log("Window focus lost");
      addWarning('focus-loss', 'Window focus lost');
    };
    
    // These are the key event listeners for tab switching/focus loss
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleFocusLoss);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleFocusLoss);
    };
  }, [quiz, attemptId]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Fix the addWarning function to ensure proper warning persistence
  const addWarning = (type: 'tab-switch' | 'focus-loss' | 'multiple-faces' | 'no-face', description: string) => {
    if (!quiz || !attemptId) {
      console.error('Cannot add warning: quiz or attemptId is null');
      return;
    }
    
    // Check if we've already reached the warning limit
    if (warnings.length >= quiz.settings.allowedWarnings) {
      console.log('Warning limit already reached, not adding more warnings');
      return;
    }
    
    // Check if this is a duplicate of the most recent warning
    if (warnings.length > 0) {
      const lastWarning = warnings[warnings.length - 1];
      
      // Don't add duplicate warnings of the same type in rapid succession
      if (lastWarning.type === type) {
        const lastTime = new Date(lastWarning.timestamp).getTime();
        const now = Date.now();
        
        // If the last warning was less than 5 seconds ago, don't add a new one
        if (now - lastTime < 5000) {
          console.log(`Ignoring duplicate ${type} warning (throttled)`);
          return;
        }
      }
    }
    
    console.log(`Adding warning: ${type} - ${description}`);
    
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
      
      // Convert warnings to JSON format for database storage
      const jsonWarnings: JsonWarning[] = updatedWarnings.map(warning => ({
        timestamp: warning.timestamp,
        type: warning.type,
        description: warning.description
      }));
      
      console.log(`Total warnings now: ${updatedWarnings.length}`);
      
      // Update warnings in the database
      if (attemptId) {
        try {
          supabase
            .from('quiz_attempts')
            .update({ warnings: jsonWarnings })
            .eq('id', attemptId)
            .then(({ error }) => {
              if (error) console.error("Error updating warnings:", error);
              else console.log("Warning added and saved to database");
            });
        } catch (error) {
          console.error("Error updating warnings:", error);
        }
      }
      
      // Auto-submit if warning limit reached
      if (updatedWarnings.length >= quiz.settings.allowedWarnings) {
        console.log("Warning limit reached, auto-submitting quiz");
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
    setLastActivity(Date.now()); // Update activity timestamp
    
    // Save answers to the database when the user selects an answer
    if (attemptId) {
      saveAnswersToDatabase(updatedAnswers);
    }
  };
  
  const goToNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setLastActivity(Date.now()); // Update activity timestamp
    }
  };
  
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setLastActivity(Date.now()); // Update activity timestamp
    }
  };
  
  const submitQuiz = async (autoSubmitted: boolean = false) => {
    if (!quiz || !user || submitting || !attemptId) return;
    
    setSubmitting(true);
    
    try {
      console.log(`Submitting quiz with ${warnings.length} warnings, autoSubmitted=${autoSubmitted}`);
      console.log('Warning details being submitted:', JSON.stringify(warnings));
      
      const result = await saveQuizAttempt(
        attemptId,
        quiz.id,
        user.id,
        answers,
        warnings,
        autoSubmitted
      );
      
      if (result.success) {
        console.log(`Quiz submitted successfully. Warnings: ${warnings.length}`);
        
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
  
  const currentQuestion = quiz?.questions?.[currentQuestionIndex];
  
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
          <h1 className="text-xl font-bold text-primary">{quiz?.title}</h1>
          <div className="flex items-center gap-4">
            <div className="text-lg font-bold text-red-600">
              Time Left: {formatTime(timeLeft)}
            </div>
            <div className="text-sm">
              Warnings: {warnings.length}/{Number(quiz?.settings.allowedWarnings)}
            </div>
            {streamStatus === 'active' && (
              <div className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                Monitoring Active
              </div>
            )}
            {streamStatus === 'connecting' && (
              <div className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                Connecting...
              </div>
            )}
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
                    Question {currentQuestionIndex + 1} of {quiz?.questions?.length || 0}
                  </span>
                  <span className="text-sm font-medium">
                    {currentQuestion?.points} {currentQuestion?.points === 1 ? 'point' : 'points'}
                  </span>
                </div>
                
                <h2 className="text-xl font-semibold mb-4">{currentQuestion?.text}</h2>
                
                {currentQuestion?.type === 'single-choice' ? (
                  <RadioGroup
                    value={(answers[currentQuestion.id]?.[0] ?? -1).toString()}
                    onValueChange={(value) => 
                      handleAnswerChange(currentQuestion.id, parseInt(value), true)
                    }
                    className="space-y-3"
                  >
                    {currentQuestion?.options.map((option, index) => (
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
                    {currentQuestion?.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                        <Checkbox
                          id={`option-${index}`}
                          checked={(answers[currentQuestion?.id] || []).includes(index)}
                          onCheckedChange={(checked) => 
                            handleAnswerChange(currentQuestion?.id, index, checked === true)
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
                  
                  {quiz && currentQuestionIndex < quiz.questions.length - 1 ? (
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
                {quiz?.settings.monitoringEnabled && (
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
                    <div className="text-xs text-muted-foreground mb-3">
                      Stay in front of your camera and keep this window active.
                    </div>
                    {warnings.length > 0 && (
                      <div className="bg-red-50 p-2 rounded-md mb-3">
                        <p className="text-xs font-medium text-red-800">
                          Warnings: {warnings.length}/{Number(quiz.settings.allowedWarnings)}
                        </p>
                        <p className="text-xs text-red-700">
                          Exceeding limit will auto-submit your quiz
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Question Navigator</h3>
                  <div className="grid grid-cols-5 gap-1">
                    {quiz?.questions?.map((_, index) => (
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
