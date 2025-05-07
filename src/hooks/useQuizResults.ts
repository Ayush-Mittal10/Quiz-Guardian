
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Quiz, Warning, QuizAttempt, QuizSettings } from '@/types';
import { User } from '@supabase/supabase-js';

export const useQuizResults = (quizId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizAndAttempts = async () => {
      if (!quizId) return;
      
      setLoading(true);
      try {
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('id, title, description, test_id, settings')
          .eq('id', quizId)
          .single();
        
        if (quizError) throw quizError;
        
        // Fetch questions count
        const { count: questionCount, error: countError } = await supabase
          .from('questions')
          .select('id', { count: 'exact' })
          .eq('quiz_id', quizId);
          
        if (countError) throw countError;
        
        // Fetch attempts
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
          
        if (attemptsError) throw attemptsError;
        
        console.log('Fetched attempts raw data:', attemptsData?.map(a => ({
          id: a.id, 
          warnings: a.warnings ? (Array.isArray(a.warnings) ? a.warnings.length : 'not array') : 'none',
          auto_submitted: a.auto_submitted
        })));
        
        // Get student profiles separately
        const studentIds = attemptsData.map(attempt => attempt.student_id);
        
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
          return;
        }
        
        // Use auth.users to get emails
        // Note: This requires admin privileges and may not work in all environments
        type UserData = {
          users: Array<{
            id: string;
            email?: string;
          }>;
        };
        
        const { data: userEmailsData, error: userEmailsError } = await supabase.auth
          .admin.listUsers({
            perPage: 1000 // Adjust based on your expected user count
          }) as { data: UserData | null, error: Error | null };
        
        let emailsMap = new Map<string, string>();
        if (!userEmailsError && userEmailsData?.users) {
          userEmailsData.users.forEach(user => {
            if (user.id && user.email) {
              emailsMap.set(user.id, user.email);
            }
          });
        }
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            name
          `)
          .in('id', studentIds);
          
        if (profilesError) throw profilesError;
        
        // Create a map for easy profile lookup
        const profilesMap = new Map<string, { id: string; name: string; email: string }>();
        
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, {
            id: profile.id,
            name: profile.name,
            // Get email from emailsMap or use empty string
            email: emailsMap.get(profile.id) || ''
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
        
        const formattedAttempts: QuizAttempt[] = attemptsData.map(attempt => {
          const studentProfile = profilesMap.get(attempt.student_id) || {
            id: attempt.student_id,
            name: 'Unknown Student',
            email: ''
          };
          
          // Safely parse warnings from JSON to our Warning type
          let parsedWarnings: Warning[] = [];
          
          // Log what's coming from the database to troubleshoot
          console.log(`Processing warnings for attempt ${attempt.id}:`, 
            attempt.warnings ? 
              (typeof attempt.warnings === 'object' ? 
                (Array.isArray(attempt.warnings) ? `Array of ${attempt.warnings.length}` : 'Object') 
                : typeof attempt.warnings) 
              : 'null/undefined');
          
          if (attempt.warnings) {
            if (Array.isArray(attempt.warnings)) {
              parsedWarnings = attempt.warnings.map((warning: any) => ({
                type: warning?.type || 'focus-loss',
                timestamp: warning?.timestamp || new Date().toISOString(),
                description: warning?.description || ''
              }));
            } else if (typeof attempt.warnings === 'object') {
              // Try to convert object to array if possible
              parsedWarnings = Object.values(attempt.warnings).map((warning: any) => ({
                type: warning?.type || 'focus-loss',
                timestamp: warning?.timestamp || new Date().toISOString(),
                description: warning?.description || ''
              }));
            }
          }
          
          console.log(`Parsed ${parsedWarnings.length} warnings for attempt ${attempt.id}`);
          
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
        });
        
        console.log('Formatted attempts with warning counts:', 
          formattedAttempts.map(a => ({id: a.id, warnings: a.warnings?.length || 0, autoSubmitted: a.autoSubmitted})));
        
        setQuiz(formattedQuiz);
        setAttempts(formattedAttempts);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error fetching results',
          description: error.message || 'Failed to load quiz results',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizAndAttempts();
  }, [quizId, toast]);

  return { loading, quiz, attempts };
};
