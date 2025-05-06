
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
        .select('title, settings, is_active')
        .eq('id', quizId)
        .single();
      
      if (quizError) {
        console.error('Error fetching quiz:', quizError);
        toast({
          variant: 'destructive',
          title: 'Failed to fetch quiz details',
          description: quizError.message
        });
        throw quizError;
      }
      
      if (!quizData) {
        console.error('Quiz not found');
        toast({
          variant: 'destructive',
          title: 'Quiz not found',
          description: 'The requested quiz could not be found'
        });
        setLoading(false);
        return;
      }
      
      console.log('Fetched quiz data:', quizData);
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
      
      if (countError) {
        console.error('Error counting questions:', countError);
        throw countError;
      }
      
      setTotalQuestions(count || 0);
      console.log('Total questions count:', count);
      
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
      
      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError);
        throw attemptsError;
      }
      
      console.log('Fetched ongoing attempts:', attemptsData?.length || 0);
      
      // Get student profile information
      const studentIds = attemptsData?.map(attempt => attempt.student_id) || [];
      
      if (studentIds.length === 0) {
        console.log('No active students found');
        setStudents([]);
        setLoading(false);
        return;
      }
      
      console.log('Fetching profiles for student IDs:', studentIds);
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', studentIds);
      
      if (studentsError) {
        console.error('Error fetching student profiles:', studentsError);
        throw studentsError;
      }
      
      console.log('Fetched student profiles:', studentsData?.length || 0);
      
      // Map profiles to a lookup object
      const profileLookup = (studentsData || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, { id: string; name: string }>);
      
      // Get student emails from auth
      // Note: This may not work with limited permissions - removed this part
      // since it's not critical and may cause permission issues
      
      // Format student data
      const formattedStudents: MonitoringStudent[] = attemptsData?.map(attempt => {
        const profile = profileLookup[attempt.student_id] || { id: attempt.student_id, name: 'Unknown Student' };
        
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
          email: '', // Email removed due to potential permission issues
          progress,
          timeElapsed,
          warnings,
          attemptId: attempt.id,
          answers: answers
        };
      }) || [];
      
      console.log('Formatted students data:', formattedStudents.length);
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
      console.log(`Ending quiz for student ${studentId}, attempt ${attemptId}`);
      
      // Update the quiz attempt to mark it as submitted
      const { error } = await supabase
        .from('quiz_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          auto_submitted: true
        })
        .eq('id', attemptId);
      
      if (error) {
        console.error('Error updating quiz attempt:', error);
        throw error;
      }
      
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
      console.log(`Ending quiz ${quizId} for all students`);
      
      // Update all ongoing attempts for this quiz
      const { error } = await supabase
        .from('quiz_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          auto_submitted: true
        })
        .eq('quiz_id', quizId)
        .is('submitted_at', null);
      
      if (error) {
        console.error('Error updating quiz attempts:', error);
        throw error;
      }
      
      console.log('Successfully ended all student attempts');
      
      // Also mark the quiz as inactive
      const { error: quizError } = await supabase
        .from('quizzes')
        .update({ is_active: false })
        .eq('id', quizId);
      
      if (quizError) {
        console.error('Error deactivating quiz:', quizError);
        throw quizError;
      }
      
      console.log('Successfully marked quiz as inactive');
      
      toast({
        title: 'Quiz ended for all students',
        description: 'All students\' quizzes have been submitted and the quiz has been deactivated.'
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
    console.log('Setting up monitor for quiz ID:', quizId);
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
