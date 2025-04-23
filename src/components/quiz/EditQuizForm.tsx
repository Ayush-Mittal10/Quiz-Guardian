
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Quiz, QuizSettings } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface EditQuizFormProps {
  quiz: Quiz;
}

interface FormValues {
  title: string;
  description: string;
  timeLimit: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  monitoringEnabled: boolean;
  allowedWarnings: number;
}

export const EditQuizForm = ({ quiz }: EditQuizFormProps) => {
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    defaultValues: {
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.settings.timeLimit,
      shuffleQuestions: quiz.settings.shuffleQuestions,
      showResults: quiz.settings.showResults,
      monitoringEnabled: quiz.settings.monitoringEnabled,
      allowedWarnings: quiz.settings.allowedWarnings,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const settings: QuizSettings = {
        timeLimit: data.timeLimit,
        shuffleQuestions: data.shuffleQuestions,
        showResults: data.showResults,
        monitoringEnabled: data.monitoringEnabled,
        allowedWarnings: data.allowedWarnings,
      };

      const { error } = await supabase
        .from('quizzes')
        .update({
          title: data.title,
          description: data.description,
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quiz.id);

      if (error) throw error;

      toast.success('Quiz updated successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error('Failed to update quiz');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quiz Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Give your quiz a descriptive title
              </FormDescription>
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
                <Textarea {...field} />
              </FormControl>
              <FormDescription>
                Provide additional details about the quiz
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Limit (minutes)</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormDescription>
                Set the time limit for completing the quiz
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="shuffleQuestions"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Shuffle Questions</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showResults"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Show Results After Submission</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monitoringEnabled"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Enable Monitoring</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="allowedWarnings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allowed Warnings</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormDescription>
                Number of warnings before auto-submission
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};
