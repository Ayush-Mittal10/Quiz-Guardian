
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { generateQuestionsWithAI } from '@/utils/aiUtils';
import { QuizQuestion } from '@/types';
import { toast } from 'sonner';

interface AiQuestionGeneratorProps {
  onQuestionsGenerated: (questions: QuizQuestion[]) => void;
}

export const AiQuestionGenerator = ({ onQuestionsGenerated }: AiQuestionGeneratorProps) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [numQuestionsToGenerate, setNumQuestionsToGenerate] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard' | 'expert'>('moderate');

  const handleGenerate = async () => {
    if (!aiPrompt || numQuestionsToGenerate < 1) {
      toast.error('Please enter a topic and number of questions');
      return;
    }

    setIsGenerating(true);

    try {
      const generatedQuestions = await generateQuestionsWithAI({
        topic: aiPrompt,
        numQuestions: numQuestionsToGenerate,
        difficulty
      });

      onQuestionsGenerated(generatedQuestions);
      setAiPrompt('');
      toast.success(`Generated ${generatedQuestions.length} questions successfully`);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generate Questions with AI</CardTitle>
        <CardDescription>
          Enter a topic or keywords to generate quiz questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={numQuestionsToGenerate}
                onChange={(e) => setNumQuestionsToGenerate(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              />
              <p className="text-sm text-muted-foreground">
                Generate between 1 and 10 questions
              </p>
            </div>
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Topic</Label>
            <Textarea
              placeholder="e.g., Photosynthesis, Chemical reactions, World War II"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Be specific for better results (e.g., "Cellular respiration in plants" instead of just "Biology")
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGenerate} 
          disabled={!aiPrompt || isGenerating || numQuestionsToGenerate < 1}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Questions...
            </>
          ) : (
            'Generate Questions'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
