
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mic, MicOff, Video, VideoOff, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { initFaceDetection, startFaceMonitoring, FaceDetectionResult, detectFaces } from '@/utils/faceDetectionUtils';
import { monitorStudent, stopMonitoringStudent } from '@/utils/webRTCUtils';
import { useAuth } from '@/contexts/AuthContext';
import { QuizAttemptRow } from '@/types/database';

interface StudentVideoMonitorProps {
  studentId: string | null;
  quizId?: string;
}

export const StudentVideoMonitor: React.FC<StudentVideoMonitorProps> = ({ studentId, quizId }) => {
  const { user } = useAuth();
  const [videoFeed, setVideoFeed] = useState<'active' | 'connecting' | 'error' | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectionError, setIsConnectionError] = useState(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [multipleFaces, setMultipleFaces] = useState<boolean>(false);
  const [lookingAway, setLookingAway] = useState<boolean>(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectionInterval = useRef<number | null>(null);
  
  // Set up WebRTC connection to receive student's camera feed
  useEffect(() => {
    if (!studentId || !quizId || !user) {
      setVideoFeed(null);
      return;
    }
    
    const connectToStudent = async () => {
      setIsLoading(true);
      setIsConnectionError(false);
      setVideoFeed('connecting');
      
      try {
        // Check if student has monitoring available
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('student_id', studentId)
          .single();
          
        if (error || !data) {
          console.error('Student monitoring not available:', error || 'Not enabled');
          setIsConnectionError(true);
          setVideoFeed(null);
          setIsLoading(false);
          return;
        }
        
        // Use our custom QuizAttemptRow type to properly type the data
        const attemptData = data as unknown as QuizAttemptRow;
        
        if (!attemptData.monitoring_available) {
          console.error('Student monitoring not enabled for this attempt');
          setIsConnectionError(true);
          setVideoFeed(null);
          setIsLoading(false);
          return;
        }
        
        console.log(`Attempting to monitor student ${studentId} for quiz ${quizId}`);
        
        // Initiate WebRTC connection to student
        const success = await monitorStudent(
          quizId,
          user.id,
          studentId
        );
        
        if (!success) {
          console.error('Failed to establish WebRTC connection with student');
          setIsConnectionError(true);
          setVideoFeed(null);
        } else {
          console.log('Successfully initiated monitoring request');
        }
      } catch (err) {
        console.error('Error connecting to student feed:', err);
        setIsConnectionError(true);
        setVideoFeed(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up stream handling
    const handleStream = (event: MessageEvent) => {
      try {
        if (typeof event.data !== 'string') return;
        
        const parsedData = JSON.parse(event.data);
        const { type, studentId: streamStudentId, stream } = parsedData;
        
        console.log('Received message event:', type, streamStudentId);
        
        if (type === 'student-stream' && streamStudentId === studentId && videoRef.current) {
          console.log('Received student stream via WebRTC');
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => {
              console.error('Error playing video:', err);
            });
          };
          setVideoFeed('active');
          setIsConnectionError(false);
          
          // Initialize face detection
          startRealFaceDetection();
        }
      } catch (error) {
        console.error('Error handling stream message:', error);
      }
    };
    
    // Listen for stream messages from WebRTC util
    window.addEventListener('message', handleStream);
    
    connectToStudent();
    
    return () => {
      window.removeEventListener('message', handleStream);
      
      // Clean up video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Clear face detection interval
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      
      // Stop monitoring this student
      if (studentId) {
        stopMonitoringStudent(studentId);
      }
    };
  }, [studentId, quizId, user]);
  
  // Real face detection using face-api.js
  const startRealFaceDetection = async () => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    
    if (!videoRef.current) return;
    
    // Initialize face detection models if needed
    await initFaceDetection();
    
    // Start periodic face detection
    detectionInterval.current = window.setInterval(async () => {
      if (!videoRef.current) return;
      
      try {
        // Perform face detection
        const result = await detectFaces(videoRef.current);
        
        // Update UI based on detection results
        setFaceDetected(result.faceCount > 0);
        setMultipleFaces(result.faceCount > 1);
        setLookingAway(result.isLookingAway);
      } catch (error) {
        console.error('Error in face detection:', error);
      }
    }, 3000);
  };
  
  // Handle audio toggle
  useEffect(() => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    
    const mediaStream = videoRef.current.srcObject as MediaStream;
    const audioTracks = mediaStream.getAudioTracks();
    
    audioTracks.forEach(track => {
      track.enabled = isAudioEnabled;
    });
    
    videoRef.current.muted = !isAudioEnabled;
  }, [isAudioEnabled]);
  
  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
  };
  
  const retryConnection = () => {
    if (studentId && quizId && user) {
      console.log(`Retrying connection to student ${studentId}`);
      
      // Reset state to trigger reconnection
      setVideoFeed(null);
      setIsConnectionError(false);
      
      // Stop any existing monitoring
      stopMonitoringStudent(studentId);
      
      // Clear the video element
      if (videoRef.current && videoRef.current.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Reconnect with slight delay to ensure clean state
      setTimeout(() => {
        monitorStudent(quizId, user.id, studentId)
          .then(success => {
            if (!success) {
              console.error('Retry connection failed');
              setIsConnectionError(true);
            } else {
              console.log('Retry connection initiated');
              setVideoFeed('connecting');
            }
          })
          .catch(err => {
            console.error('Error retrying connection:', err);
            setIsConnectionError(true);
          });
      }, 500);
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium mb-2">Live Video Feed</h3>
      <div className="rounded-md overflow-hidden bg-black mb-2 aspect-video relative">
        {videoFeed === 'active' ? (
          <>
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              playsInline
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/50 p-2 rounded-md">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 hover:bg-white/20"
                onClick={toggleAudio}
              >
                {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
              </Button>
              <span className="text-xs text-white">
                {isAudioEnabled ? 'Audio on' : 'Audio off'}
              </span>
            </div>
            
            {/* Face detection status indicators */}
            {!faceDetected && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs">
                <AlertTriangle size={12} />
                No face detected
              </div>
            )}
            
            {multipleFaces && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs">
                <AlertTriangle size={12} />
                Multiple faces
              </div>
            )}
            
            {lookingAway && (
              <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs">
                <AlertTriangle size={12} />
                Looking away
              </div>
            )}
          </>
        ) : videoFeed === 'connecting' || isLoading ? (
          <div className="h-full flex items-center justify-center bg-black">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-8 w-8 text-white animate-spin mb-2" />
              <p className="text-white text-sm">Connecting to student's webcam...</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-black">
            {isConnectionError ? (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                <p className="text-white mb-2">Connection error</p>
                <p className="text-gray-400 text-xs mb-4">Student's camera may not be available or connection was lost</p>
                <Button variant="outline" size="sm" onClick={retryConnection}>
                  Retry connection
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                {!studentId ? 'Select a student to view video' : 'Student camera not available'}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch 
            id="audio-toggle" 
            checked={isAudioEnabled}
            onCheckedChange={toggleAudio}
            disabled={videoFeed !== 'active'}
          />
          <label htmlFor="audio-toggle" className="text-sm cursor-pointer">
            {isAudioEnabled ? 'Audio enabled' : 'Audio disabled'}
          </label>
        </div>
        {videoFeed === 'active' && (
          <Button variant="outline" size="sm" onClick={retryConnection}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
};
