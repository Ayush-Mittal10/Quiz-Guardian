
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

interface StudentVideoMonitorProps {
  studentId: string | null;
}

export const StudentVideoMonitor: React.FC<StudentVideoMonitorProps> = ({ studentId }) => {
  const [videoFeed, setVideoFeed] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectionError, setIsConnectionError] = useState(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [multipleFaces, setMultipleFaces] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectionInterval = useRef<number | null>(null);
  
  // For demo purposes, we'll simulate getting a stream from the remote student
  useEffect(() => {
    if (!studentId) {
      setVideoFeed(null);
      return;
    }
    
    const simulateVideoFeed = async () => {
      setIsLoading(true);
      setIsConnectionError(false);
      
      try {
        // In a real implementation, we would use WebRTC or similar technology to get the student's camera feed
        // Here we'll use the local camera for demonstration purposes
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const constraints = {
            video: true,
            audio: isAudioEnabled,
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.muted = !isAudioEnabled; // Mute if audio not enabled
          }
          
          setVideoFeed('active');
          
          // Start simulated face detection
          startFaceDetection();
        } else {
          console.error('Media devices not available');
          setIsConnectionError(true);
          setVideoFeed('/placeholder.svg'); // Fallback to placeholder
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setIsConnectionError(true);
        setVideoFeed('/placeholder.svg'); // Fallback to placeholder
      } finally {
        setIsLoading(false);
      }
    };
    
    simulateVideoFeed();
    
    return () => {
      // Clean up video stream when component unmounts or student changes
      if (videoRef.current && videoRef.current.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Clear face detection interval
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [studentId]);
  
  // Simulate face detection (in a real app, use face-api.js or TensorFlow.js)
  const startFaceDetection = () => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    
    // Simulate face detection - randomize results for demo purposes
    detectionInterval.current = window.setInterval(() => {
      // Simulate detection results:
      // 80% chance of face detected
      // 10% chance of no face
      // 10% chance of multiple faces
      const random = Math.random();
      
      if (random < 0.1) {
        setFaceDetected(false);
        setMultipleFaces(false);
      } else if (random < 0.2) {
        setFaceDetected(true);
        setMultipleFaces(true);
      } else {
        setFaceDetected(true);
        setMultipleFaces(false);
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
    if (studentId) {
      setVideoFeed(null); // Reset state to trigger reconnection
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium mb-2">Video Feed</h3>
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
          </>
        ) : videoFeed ? (
          <div className="h-full flex flex-col items-center justify-center">
            <img 
              src={videoFeed} 
              alt="Student video feed" 
              className="w-full h-full object-cover"
            />
            {isConnectionError && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                <p className="text-white mb-2">Connection error</p>
                <Button variant="outline" size="sm" onClick={retryConnection}>
                  Retry connection
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            {isLoading ? 'Loading video...' : 'Select a student to view video'}
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
      </div>
    </div>
  );
};
