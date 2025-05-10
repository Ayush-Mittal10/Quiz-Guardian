
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { QuizAttempt, QuizQuestion, QuestionType, Warning } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface StudentDetailsPanelProps {
  attempt: QuizAttempt;
  onClose: () => void;
}

export const StudentDetailsPanel = ({ attempt, onClose }: StudentDetailsPanelProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Ensure warnings is an array, not undefined or null
  const warnings = Array.isArray(attempt.warnings) ? attempt.warnings : [];
  const warningsCount = warnings.length;

  console.log('StudentDetailsPanel - Attempt warnings:', 
    Array.isArray(attempt.warnings) ? 
      `Array with ${attempt.warnings.length} items` : 
      `Not an array: ${typeof attempt.warnings}`);
  
  if (Array.isArray(attempt.warnings) && attempt.warnings.length > 0) {
    console.log('Sample warning:', attempt.warnings[0]);
  }

  // Fetch questions for this quiz
  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', attempt.quizId);
          
        if (error) throw error;
        
        const formattedQuestions: QuizQuestion[] = data.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type as QuestionType, // Cast to QuestionType
          options: Array.isArray(q.options) ? q.options.map(opt => String(opt)) : [], // Convert each option to string
          correctAnswers: q.correct_answers,
          points: q.points
        }));
        
        setQuestions(formattedQuestions);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizQuestions();
  }, [attempt.quizId]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Student Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Student Information */}
          <div className="p-4 border rounded-md">
            <h3 className="font-medium text-lg mb-2">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{attempt.student?.name || 'Unknown Student'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{attempt.student?.email || 'No email available'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Score</div>
                <div className={`font-medium ${
                  (attempt.score || 0) >= 70 ? 'text-green-600' :
                  (attempt.score || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {attempt.score || 0}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Submission Status</div>
                <div className="font-medium">
                  {attempt.autoSubmitted ? (
                    <span className="text-red-600">Auto-submitted</span>
                  ) : attempt.submittedAt ? (
                    'Submitted'
                  ) : (
                    'Not submitted'
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Warnings</div>
                <div className={`font-medium ${warningsCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {warningsCount} {warningsCount === 1 ? 'warning' : 'warnings'}
                </div>
              </div>
            </div>
          </div>

          {/* Warning Logs */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button 
                variant={warningsCount > 0 ? "destructive" : "outline"} 
                className="flex w-full justify-between"
              >
                <span>Warning Logs ({warningsCount})</span>
                <span className="text-xs">
                  {warningsCount 
                    ? `${attempt.autoSubmitted ? 'Auto-submitted due to warnings' : 'Click to view'}` 
                    : 'No warnings'}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="border rounded-md p-3">
                {warningsCount > 0 ? (
                  <div className="space-y-2">
                    {warnings.map((warning, index) => (
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
            </CollapsibleContent>
          </Collapsible>

          {/* Student Answers */}
          <div>
            <h3 className="font-medium mb-2">Student Answers</h3>
            {loading ? (
              <div className="text-center p-4">Loading questions...</div>
            ) : questions.length > 0 ? (
              <Accordion type="single" collapsible className="border rounded-md">
                {questions.map((question, index) => {
                  const studentAnswers = attempt.answers[question.id] || [];
                  const isCorrect = 
                    studentAnswers.length === question.correctAnswers.length && 
                    studentAnswers.every(answer => question.correctAnswers.includes(answer));

                  return (
                    <AccordionItem key={question.id} value={`q-${index}`}>
                      <AccordionTrigger className="px-4">
                        <div className="flex items-center gap-2">
                          <span>Question {index + 1}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          <div className="font-medium">{question.text}</div>
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => {
                              const isSelected = studentAnswers.includes(optIndex);
                              const isCorrectOption = question.correctAnswers.includes(optIndex);
                              
                              return (
                                <div 
                                  key={optIndex} 
                                  className={`p-2 rounded border ${
                                    isSelected && isCorrectOption ? 'border-green-500 bg-green-50' : 
                                    isSelected && !isCorrectOption ? 'border-red-500 bg-red-50' :
                                    !isSelected && isCorrectOption ? 'border-green-500 bg-white' :
                                    'border-gray-200'
                                  }`}
                                >
                                  <div className="flex gap-2">
                                    <div className={`text-sm ${
                                      isSelected ? 'font-medium' : ''
                                    }`}>
                                      {option}
                                    </div>
                                    {isSelected && isCorrectOption && (
                                      <div className="text-xs text-green-600">(Correct choice)</div>
                                    )}
                                    {isSelected && !isCorrectOption && (
                                      <div className="text-xs text-red-600">(Incorrect choice)</div>
                                    )}
                                    {!isSelected && isCorrectOption && (
                                      <div className="text-xs text-green-600">(Correct answer - not selected)</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="text-sm border rounded-md p-4 text-muted-foreground">
                No questions available for this quiz
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
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
  );
};
