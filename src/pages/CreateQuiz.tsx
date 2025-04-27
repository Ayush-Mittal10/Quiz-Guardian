import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { QuizQuestion, QuestionType } from '@/types';
import { saveQuiz } from '@/utils/quizUtils';
import { useToast } from '@/hooks/use-toast';
import { QuizPublishedModal } from '@/components/quiz/QuizPublishedModal';
import { AiQuestionGenerator } from '@/components/quiz/AiQuestionGenerator';

const quizSettingsSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  timeLimit: z.coerce.number().min(5, 'Time limit must be at least 5 minutes'),
  shuffleQuestions: z.boolean().default(true),
  showResults: z.boolean().default(true),
  monitoringEnabled: z.boolean().default(true),
  allowedWarnings: z.coerce.number().min(1, 'Must allow at least 1 warning').max(5, 'Maximum 5 warnings allowed')
});

type QuizSettingsFormValues = z.infer<typeof quizSettingsSchema>;

const CreateQuiz = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('manual');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<QuizQuestion>>({
    text: '',
    type: 'single-choice',
    options: ['', ''],
    correctAnswers: [],
    points: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [publishedQuizId, setPublishedQuizId] = useState('');
  const [publishedTestId, setPublishedTestId] = useState('');

  const form = useForm<QuizSettingsFormValues>({
    resolver: zodResolver(quizSettingsSchema),
    defaultValues: {
      title: '',
      description: '',
      timeLimit: 30,
      shuffleQuestions: true,
      showResults: true,
      monitoringEnabled: true,
      allowedWarnings: 3
    },
  });

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...(currentQuestion.options || []), '']
    });
  };

  const removeOption = (index: number) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions.splice(index, 1);
    
    let newCorrectAnswers = [...(currentQuestion.correctAnswers || [])];
    newCorrectAnswers = newCorrectAnswers.filter(ansIndex => ansIndex !== index)
      .map(ansIndex => ansIndex > index ? ansIndex - 1 : ansIndex);
    
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
      correctAnswers: newCorrectAnswers
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    });
  };

  const toggleCorrectAnswer = (index: number) => {
    const correctAnswers = [...(currentQuestion.correctAnswers || [])];
    const existingIndex = correctAnswers.indexOf(index);
    
    if (currentQuestion.type === 'single-choice') {
      setCurrentQuestion({
        ...currentQuestion,
        correctAnswers: [index]
      });
    } else {
      if (existingIndex >= 0) {
        correctAnswers.splice(existingIndex, 1);
      } else {
        correctAnswers.push(index);
      }
      setCurrentQuestion({
        ...currentQuestion,
        correctAnswers
      });
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.text || (currentQuestion.options?.length || 0) < 2 || 
        !(currentQuestion.correctAnswers?.length || 0)) {
      return; // Basic validation
    }
    
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      text: currentQuestion.text || '',
      type: currentQuestion.type as QuestionType,
      options: currentQuestion.options || [],
      correctAnswers: currentQuestion.correctAnswers || [],
      points: currentQuestion.points || 1
    };
    
    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      text: '',
      type: 'single-choice',
      options: ['', ''],
      correctAnswers: [],
      points: 1
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestionPoints = (questionId: string, points: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, points: Math.max(1, points) } 
        : q
    ));
  };

  const handleAIQuestionsGenerated = (generatedQuestions: QuizQuestion[]) => {
    setQuestions([...questions, ...generatedQuestions]);
  };

  const publishQuiz = async (data: QuizSettingsFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to publish a quiz",
        variant: "destructive",
      });
      return;
    }
    
    if (questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "You must add at least one question to publish a quiz",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await saveQuiz(
        data.title,
        data.description,
        {
          timeLimit: data.timeLimit,
          shuffleQuestions: data.shuffleQuestions,
          showResults: data.showResults,
          monitoringEnabled: data.monitoringEnabled,
          allowedWarnings: data.allowedWarnings
        },
        questions,
        user.id
      );
      
      if (result.success) {
        setPublishedQuizId(result.id);
        setPublishedTestId(result.testId);
        setShowSuccessModal(true);
      } else {
        const errorMessage = result.error?.message || "Failed to publish quiz. Please try again later.";
        const errorCode = result.error?.code ? ` (Error code: ${result.error.code})` : "";
        
        toast({
          title: "Error",
          description: `${errorMessage}${errorCode}`,
          variant: "destructive",
        });
        
        console.error('Quiz publishing failed:', result.error);
      }
    } catch (error) {
      console.error('Error publishing quiz:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Create New Quiz</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
              <CardDescription>Configure the basic settings for your quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiz Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Midterm Exam: Computer Science 101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a description of the quiz for your students" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Limit (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" min={5} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allowedWarnings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allowed Warnings</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={5} 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Number of integrity violations before auto-submission
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="shuffleQuestions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Shuffle Questions</FormLabel>
                            <FormDescription>
                              Randomize question order
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="showResults"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Show Results</FormLabel>
                            <FormDescription>
                              Display score after completion
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="monitoringEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Enable Monitoring</FormLabel>
                            <FormDescription>
                              Track student actions
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>Add questions to your quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="ai">AI Generation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Add New Question</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <FormLabel>Question Text</FormLabel>
                        <Textarea
                          placeholder="Enter your question here"
                          value={currentQuestion.text}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                          className="mb-2"
                        />
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div>
                          <FormLabel>Question Type</FormLabel>
                          <select
                            value={currentQuestion.type}
                            onChange={(e) => setCurrentQuestion({
                              ...currentQuestion, 
                              type: e.target.value as QuestionType,
                              correctAnswers: []
                            })}
                            className="w-full p-2 border rounded"
                          >
                            <option value="single-choice">Single Choice</option>
                            <option value="multiple-choice">Multiple Choice</option>
                          </select>
                        </div>
                        
                        <div>
                          <FormLabel>Points</FormLabel>
                          <Input
                            type="number"
                            min={1}
                            value={currentQuestion.points}
                            onChange={(e) => setCurrentQuestion({
                              ...currentQuestion,
                              points: parseInt(e.target.value) || 1
                            })}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel>Options</FormLabel>
                          <Button type="button" variant="outline" size="sm" onClick={addOption}>
                            Add Option
                          </Button>
                        </div>
                        
                        {currentQuestion.options?.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <input
                              type={currentQuestion.type === 'single-choice' ? 'radio' : 'checkbox'}
                              checked={(currentQuestion.correctAnswers || []).includes(index)}
                              onChange={() => toggleCorrectAnswer(index)}
                              className="h-4 w-4"
                            />
                            <Input
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1"
                            />
                            {(currentQuestion.options?.length || 0) > 2 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeOption(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button type="button" onClick={addQuestion}>Add Question</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="ai" className="space-y-4">
                  <AiQuestionGenerator onQuestionsGenerated={handleAIQuestionsGenerated} />
                </TabsContent>
              </Tabs>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">
                  Questions Added ({questions.length})
                </h3>
                
                {questions.length === 0 ? (
                  <div className="text-center p-4 border rounded bg-muted">
                    <p className="text-muted-foreground">No questions added yet. Use the form above to add questions.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, qIndex) => (
                      <Card key={question.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-base">
                              {qIndex + 1}. {question.text}
                            </CardTitle>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Label>Points:</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={question.points}
                                  onChange={(e) => updateQuestionPoints(question.id, parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeQuestion(question.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                          <CardDescription>
                            {question.type === 'single-choice' ? 'Single choice' : 'Multiple choice'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option, oIndex) => (
                              <div 
                                key={oIndex} 
                                className={`p-2 border rounded ${
                                  question.correctAnswers.includes(oIndex) 
                                    ? 'bg-green-50 border-green-200' 
                                    : ''
                                }`}
                              >
                                {option}
                                {question.correctAnswers.includes(oIndex) && (
                                  <span className="ml-2 text-green-600 text-sm">(Correct)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(publishQuiz)}
              disabled={questions.length === 0 || !form.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Publishing..." : "Publish Quiz"}
            </Button>
          </div>
          
          <QuizPublishedModal
            open={showSuccessModal}
            onOpenChange={setShowSuccessModal}
            testId={publishedTestId}
            quizId={publishedQuizId}
          />
        </div>
      </main>
    </div>
  );
};

export default CreateQuiz;
