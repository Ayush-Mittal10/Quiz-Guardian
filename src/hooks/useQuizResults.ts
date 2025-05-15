import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Quiz, Warning, QuizAttempt, QuizSettings } from '@/types';
import { User } from '@supabase/supabase-js';

export const useQuizResults = (quizId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const { toast } = useToast();
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Define fetchQuizAndAttempts as a useCallback function so it can be returned and reused
  const fetchQuizAndAttempts = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping');
      return;
    }
    
    // Add throttling to prevent excessive API calls
    const now = Date.now();
    const THROTTLE_MS = 2000; // 2 seconds between fetches
    if (now - lastFetchTimeRef.current < THROTTLE_MS) {
      console.log('Throttling fetch, too soon since last fetch');
      return;
    }
    
    if (!quizId) return;
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    
    setLoading(true);
    try {
      console.log('Fetching quiz and attempts for quiz ID:', quizId);
      
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id, title, description, test_id, settings')
        .eq('id', quizId)
        .single();
      
      if (quizError) {
        console.error('Error fetching quiz data:', quizError);
        throw quizError;
      }
      
      console.log('Quiz data fetched successfully:', quizData?.id);
      
      // Fetch questions count
      const { count: questionCount, error: countError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('quiz_id', quizId);
        
      if (countError) throw countError;
      
      // Fetch attempts with fresh data
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
        
      if (attemptsError) {
        console.error('Error fetching attempts data:', attemptsError);
        throw attemptsError;
      }
      
      console.log(`Fetched ${attemptsData?.length || 0} attempts for quiz ID:`, quizId);
      
      // Get student profiles separately
      const studentIds = attemptsData?.map(attempt => attempt.student_id) || [];
      
      // Safely parse settings from JSON to our QuizSettings type
      const rawSettings = quizData.settings as Record<string, any>;
      const settings: QuizSettings = {
        timeLimit: typeof rawSettings?.timeLimit === 'number' ? rawSettings.timeLimit : 30,
        shuffleQuestions: typeof rawSettings?.shuffleQuestions === 'boolean' ? rawSettings.shuffleQuestions : true,
        showResults: typeof rawSettings?.showResults === 'boolean' ? rawSettings.showResults : true,
        monitoringEnabled: typeof rawSettings?.monitoringEnabled === 'boolean' ? rawSettings.monitoringEnabled : true,
        allowedWarnings: typeof rawSettings?.allowedWarnings === 'number' ? rawSettings.allowedWarnings : 3
      };
      
      if (studentIds.length === 0) {
        // Handle case with no attempts
        setQuiz({
          id: quizData.id,
          title: quizData.title,
          description: quizData.description || '',
          testId: quizData.test_id,
          createdBy: '',
          createdAt: '',
          settings: settings,
          questions: []
        });
        setAttempts([]);
        setLoading(false);
        return;
      }
      
      // Use profiles table to get student information
      // Check the available columns in the profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name
        `)
        .in('id', studentIds);
        
      if (profilesError) {
        console.error('Error fetching profiles data:', profilesError);
        throw profilesError;
      }
      
      // Create a map for easy profile lookup
      const profilesMap = new Map<string, { id: string; name: string; email?: string }>();
      
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, {
          id: profile.id,
          name: profile.name || 'Unknown Student',
          // Since 'email' is not in the profiles table, we'll omit it or set a default
          email: ''
        });
      });
      
      // Transform data
      const formattedQuiz: Quiz = {
        id: quizData.id,
        title: quizData.title,
        description: quizData.description || '',
        testId: quizData.test_id,
        createdBy: '',
        createdAt: '',
        settings: settings,
        questions: []
      };
      
      const formattedAttempts: QuizAttempt[] = attemptsData?.map(attempt => {
        const studentProfile = profilesMap.get(attempt.student_id) || {
          id: attempt.student_id,
          name: 'Unknown Student',
          email: ''
        };
        
        // Improved warning parsing
        let parsedWarnings: Warning[] = [];
        
        // Better warning parsing
        if (attempt.warnings) {
          if (Array.isArray(attempt.warnings)) {
            parsedWarnings = attempt.warnings.map((warning: any) => ({
              type: warning?.type || 'focus-loss',
              timestamp: warning?.timestamp || new Date().toISOString(),
              description: warning?.description || ''
            }));
          } else if (typeof attempt.warnings === 'object') {
            // Try to handle non-array objects
            try {
              // Convert object to array if possible
              const warningValues = Object.values(attempt.warnings);
              if (Array.isArray(warningValues)) {
                parsedWarnings = warningValues.map((warning: any) => ({
                  type: warning?.type || 'focus-loss',
                  timestamp: warning?.timestamp || new Date().toISOString(),
                  description: warning?.description || ''
                }));
              }
            } catch (e) {
              console.error('Error parsing warnings object:', e);
              // Fallback to empty array
              parsedWarnings = [];
            }
          } else if (typeof attempt.warnings === 'string') {
            // Try to parse from string if it might be JSON
            try {
              const parsed = JSON.parse(attempt.warnings);
              if (Array.isArray(parsed)) {
                parsedWarnings = parsed.map((warning: any) => ({
                  type: warning?.type || 'focus-loss',
                  timestamp: warning?.timestamp || new Date().toISOString(),
                  description: warning?.description || ''
                }));
              }
            } catch (e) {
              console.error('Error parsing warnings string:', e);
              // Fallback to empty array
              parsedWarnings = [];
            }
          }
        }
        
        // Calculate time spent between start and submission time
        const startTime = new Date(attempt.started_at).getTime();
        const endTime = attempt.submitted_at ? new Date(attempt.submitted_at).getTime() : Date.now();
        const timeSpent = Math.round((endTime - startTime) / 1000);
        
        return {
          id: attempt.id,
          quizId: attempt.quiz_id,
          studentId: attempt.student_id,
          startedAt: attempt.started_at,
          submittedAt: attempt.submitted_at || undefined,
          answers: attempt.answers as Record<string, number[]> || {},
          warnings: parsedWarnings,
          autoSubmitted: attempt.auto_submitted || false,
          score: attempt.score || 0,
          // Additional properties for UI rendering
          student: studentProfile,
          timeSpent: timeSpent
        };
      }) || [];
      
      console.log(`Successfully formatted ${formattedAttempts.length} attempts for UI`);
      
      setQuiz(formattedQuiz);
      setAttempts(formattedAttempts);
    } catch (error: any) {
      console.error('Error fetching quiz results data:', error);
      toast({
        title: 'Error fetching results',
        description: error.message || 'Failed to load quiz results',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [quizId, toast]);
  
  // Call the function on mount
  useEffect(() => {
    fetchQuizAndAttempts();
    
    // Here's the cleanup
    return () => {
      // Reset the fetching state on unmount
      isFetchingRef.current = false;
    };
  }, [fetchQuizAndAttempts]);

  // Return the refreshResults function along with the other values
  return { loading, quiz, attempts, refreshResults: fetchQuizAndAttempts };
};
