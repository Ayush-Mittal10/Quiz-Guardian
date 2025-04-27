
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Warning, QuizSettings } from '@/types';

export type MonitoringStudent = {
  id: string;
  name: string;
  email: string;
  progress: number;
  timeElapsed: number;
  warnings: Warning[];
  attemptId: string;
  answers: Record<string, number[]>;
};

export const useQuizMonitoring = (quizId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<MonitoringStudent[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [quizTitle, setQuizTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Function to fetch real-time student data
  const fetchStudentData = async () => {
    if (!quizId || !user) return;
    
    try {
      setLoading(true);
      
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('title, settings')
        .eq('id', quizId)
        .single();
      
      if (quizError) throw quizError;
      
      setQuizTitle(quizData.title);
      
      // Type check and safely extract timeLimit from settings
      if (quizData.settings && typeof quizData.settings === 'object') {
        const settings = quizData.settings as unknown as QuizSettings;
        setTimeLimit(settings.timeLimit || 30);
      }
      
      // Count questions
      const { count, error: countError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId);
      
      if (countError) throw countError;
      
      setTotalQuestions(count || 0);
      
      // Fetch ongoing attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          student_id,
          started_at,
          submitted_at,
          answers,
          warnings
        `)
        .eq('quiz_id', quizId)
        .is('submitted_at', null); // Only fetch ongoing attempts
      
      if (attemptsError) throw attemptsError;
      
      // Get student profile information
      const studentIds = attemptsData.map(attempt => attempt.student_id);
      
      if (studentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', studentIds);
      
      if (studentsError) throw studentsError;
      
      // Map profiles to a lookup object
      const profileLookup = studentsData.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, { id: string; name: string }>);
      
      // Get student emails from auth
      // Note: This may not work with limited permissions
      type UserData = {
        users: Array<{
          id: string;
          email?: string;
        }>;
      };
      
      let emailLookup: Record<string, string> = {};
      
      try {
        // Try to get emails, but this may fail with limited permissions
        const { data: usersData, error: usersError } = await supabase.auth
          .admin.listUsers({
            perPage: 1000
          }) as { data: UserData | null, error: Error | null };
          
        if (!usersError && usersData?.users) {
          emailLookup = usersData.users.reduce((acc, user) => {
            if (user.id && user.email) {
              acc[user.id] = user.email;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      } catch (emailError) {
        console.error('Failed to fetch emails:', emailError);
        // Continue without emails
      }
      
      // Format student data
      const formattedStudents: MonitoringStudent[] = attemptsData.map(attempt => {
        const profile = profileLookup[attempt.student_id] || { name: 'Unknown Student' };
        const email = emailLookup[attempt.student_id] || '';
        
        // Calculate time elapsed
        const startTime = new Date(attempt.started_at).getTime();
        const timeElapsed = Math.round((Date.now() - startTime) / 1000);
        
        // Count progress based on number of answers
        const answers = attempt.answers as Record<string, number[]> || {};
        const progress = Object.keys(answers).length;
        
        // Parse warnings
        const warnings = Array.isArray(attempt.warnings) 
          ? attempt.warnings.map((w: any) => ({
              type: w.type || 'unknown',
              timestamp: w.timestamp || '',
              description: w.description || ''
            }))
          : [];
          
        return {
          id: attempt.student_id,
          name: profile.name,
          email,
          progress,
          timeElapsed,
          warnings,
          attemptId: attempt.id,
          answers: answers
        };
      });
      
      setStudents(formattedStudents);
    } catch (error: any) {
      console.error('Error fetching monitoring data:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to fetch monitoring data',
        description: error.message || 'An error occurred'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to end quiz for a specific student
  const endQuizForStudent = async (studentId: string, attemptId: string) => {
    try {
      // Update the quiz attempt to mark it as submitted
      const { error } = await supabase
        .from('quiz_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          auto_submitted: true
        })
        .eq('id', attemptId);
      
      if (error) throw error;
      
      toast({
        title: 'Quiz ended for student',
        description: 'The student\'s quiz has been submitted.'
      });
      
      // Update the local state by removing the student
      setStudents(prev => prev.filter(student => student.id !== studentId));
      
      return true;
    } catch (error: any) {
      console.error('Error ending quiz for student:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to end quiz for student',
        description: error.message || 'An error occurred'
      });
      return false;
    }
  };
  
  // Function to end quiz for all students
  const endQuizForAll = async () => {
    if (!quizId || students.length === 0) return false;
    
    try {
      // Update all ongoing attempts for this quiz
      const attemptIds = students.map(student => student.attemptId);
      
      const { error } = await supabase
        .from('quiz_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          auto_submitted: true
        })
        .eq('quiz_id', quizId)
        .is('submitted_at', null);
      
      if (error) throw error;
      
      // Also mark the quiz as inactive
      await supabase
        .from('quizzes')
        .update({ is_active: false })
        .eq('id', quizId);
      
      toast({
        title: 'Quiz ended for all students',
        description: 'All students\' quizzes have been submitted.'
      });
      
      // Clear the students list
      setStudents([]);
      
      return true;
    } catch (error: any) {
      console.error('Error ending quiz for all:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to end quiz',
        description: error.message || 'An error occurred'
      });
      return false;
    }
  };
  
  // Initial fetch and setup polling
  useEffect(() => {
    fetchStudentData();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchStudentData();
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [quizId]);
  
  return {
    loading,
    students,
    totalQuestions,
    quizTitle,
    timeLimit,
    endQuizForStudent,
    endQuizForAll,
    refreshData: fetchStudentData
  };
};
