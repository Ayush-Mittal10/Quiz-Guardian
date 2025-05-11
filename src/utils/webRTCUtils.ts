import { supabase } from '@/integrations/supabase/client';

// Constants
const ICE_SERVERS = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
};

// Types
export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  sender: string;
  receiver: string;
  quizId: string;
  data: any;
  timestamp: string;
}

interface PeerConnection {
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

// Connection maps - we store them here so they persist between renders
const peerConnections = new Map<string, PeerConnection>();
const remoteVideoStreams = new Map<string, MediaStream>();

/**
 * Initialize and set up WebRTC for a student taking a quiz
 * This should be called on the student side
 */
export const initStudentWebRTC = async (
  quizId: string,
  studentId: string,
  localStream: MediaStream,
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void
): Promise<() => void> => {
  let subscriptions: any[] = [];
  if (!quizId || !studentId || !localStream) {
    console.error('Missing required parameters for WebRTC initialization');
    onStatusChange?.('error');
    return () => {};
  }

  try {
    onStatusChange?.('connecting');
    
    // Add the signaling channel subscription
    const { data: signalChannel, error } = await supabase
      .channel(`quiz:${quizId}`)
      .on('broadcast', { event: 'webrtc-signal' }, async (payload) => {
        const signal = payload.payload as SignalingMessage;
        
        // Only process signals intended for this student
        if (signal.receiver !== studentId) return;
        
        // Handle different types of signals
        await handleIncomingSignal(signal, quizId, studentId, localStream);
        
        // If we received an offer, the professor is trying to connect
        if (signal.type === 'offer') {
          onStatusChange?.('connected');
        }
      })
      .subscribe();
      
    if (error) {
      console.error('Error subscribing to signaling channel:', error);
      onStatusChange?.('error');
      return () => {};
    }
    
    subscriptions.push(signalChannel);
    
    // Notify that student is available (broadcasting presence)
    try {
      const { error: updateError } = await supabase.from('quiz_attempts')
        .update({ monitoring_available: true })
        .eq('quiz_id', quizId)
        .eq('student_id', studentId);
        
      if (updateError) {
        console.error('Error updating monitoring availability:', updateError);
      } else {
        console.log('Successfully marked monitoring as available');
      }
    } catch (err) {
      console.error('Error updating monitoring_available flag:', err);
    }
    
    // Return cleanup function
    return () => {
      // Clean up local stream
      localStream.getTracks().forEach(track => track.stop());
      
      // Close any peer connections
      peerConnections.forEach((peer, connectionId) => {
        peer.connection.close();
      });
      
      peerConnections.clear();
      
      // Unsubscribe from channels
      subscriptions.forEach(subscription => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      });
      
      // Update database with monitoring no longer available
      supabase.from('quiz_attempts')
        .update({ monitoring_available: false })
        .eq('quiz_id', quizId)
        .eq('student_id', studentId)
        .then(() => console.log('Marked monitoring as unavailable'));
    };
  } catch (error) {
    console.error('Error in WebRTC initialization:', error);
    onStatusChange?.('error');
    return () => {};
  }
};

/**
 * Initialize WebRTC for a professor monitoring a quiz
 * This should be called on the professor side
 */
export const initProfessorWebRTC = async (
  quizId: string,
  professorId: string,
  onNewStream: (studentId: string, stream: MediaStream) => void,
  onStreamRemoved: (studentId: string) => void
): Promise<() => void> => {
  let subscriptions: any[] = [];
  
  try {
    // Subscribe to the signaling channel
    const { data: signalChannel, error } = await supabase
      .channel(`quiz:${quizId}`)
      .on('broadcast', { event: 'webrtc-signal' }, async (payload) => {
        const signal = payload.payload as SignalingMessage;
        
        // Only process signals intended for this professor
        if (signal.receiver !== professorId) return;

        await handleProfessorSignal(signal, quizId, professorId, onNewStream);
      })
      .subscribe();
      
    if (error) {
      console.error('Error subscribing to signaling channel:', error);
      return () => {};
    }
    
    subscriptions.push(signalChannel);
    
    // Return cleanup function
    return () => {
      // Close all peer connections
      peerConnections.forEach((peer, studentId) => {
        peer.connection.close();
        onStreamRemoved(studentId);
      });
      
      peerConnections.clear();
      remoteVideoStreams.clear();
      
      // Unsubscribe from channels
      subscriptions.forEach(subscription => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      });
    };
  } catch (error) {
    console.error('Error in professor WebRTC initialization:', error);
    return () => {};
  }
};

/**
 * Start monitoring a specific student as a professor
 */
export const monitorStudent = async (
  quizId: string,
  professorId: string,
  studentId: string
): Promise<boolean> => {
  try {
    // Check if we already have a connection to this student
    if (peerConnections.has(studentId)) {
      console.log('Already connected to student:', studentId);
      return true;
    }
    
    // Create new peer connection for this student
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.set(studentId, { connection: peerConnection });
    
    // Listen for ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ice-candidate',
          sender: professorId,
          receiver: studentId,
          quizId,
          data: event.candidate,
          timestamp: new Date().toISOString()
        });
      }
    };
    
    // Create and send the offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    sendSignal({
      type: 'offer',
      sender: professorId,
      receiver: studentId,
      quizId,
      data: offer,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error monitoring student:', error);
    return false;
  }
};

/**
 * Stop monitoring a specific student
 */
export const stopMonitoringStudent = (studentId: string): void => {
  const peer = peerConnections.get(studentId);
  if (peer) {
    peer.connection.close();
    peerConnections.delete(studentId);
  }
  
  const stream = remoteVideoStreams.get(studentId);
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    remoteVideoStreams.delete(studentId);
  }
};

/**
 * Send a WebRTC signaling message via Supabase Realtime
 */
const sendSignal = async (signal: SignalingMessage): Promise<void> => {
  try {
    await supabase
      .channel(`quiz:${signal.quizId}`)
      .send({
        type: 'broadcast',
        event: 'webrtc-signal',
        payload: signal
      });
  } catch (error) {
    console.error('Error sending signal:', error);
  }
};

/**
 * Handle incoming signals for the student side
 */
const handleIncomingSignal = async (
  signal: SignalingMessage,
  quizId: string,
  studentId: string,
  localStream: MediaStream
): Promise<void> => {
  try {
    const professorId = signal.sender;
    
    // Get or create peer connection for this professor
    let peer = peerConnections.get(professorId);
    
    if (!peer) {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      
      // Add all local tracks to the connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      // Listen for ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: 'ice-candidate',
            sender: studentId,
            receiver: professorId,
            quizId,
            data: event.candidate,
            timestamp: new Date().toISOString()
          });
        }
      };
      
      // Set connection state handling
      peerConnection.onconnectionstatechange = () => {
        console.log(`WebRTC connection state: ${peerConnection.connectionState}`);
      };
      
      peer = { connection: peerConnection, stream: localStream };
      peerConnections.set(professorId, peer);
    }
    
    // Handle the specific signal type
    switch (signal.type) {
      case 'offer':
        console.log('Received offer from professor, setting remote description');
        await peer.connection.setRemoteDescription(new RTCSessionDescription(signal.data));
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
        
        sendSignal({
          type: 'answer',
          sender: studentId,
          receiver: professorId,
          quizId,
          data: answer,
          timestamp: new Date().toISOString()
        });
        break;
      
      case 'ice-candidate':
        if (peer.connection.remoteDescription) {
          console.log('Adding ICE candidate from professor');
          await peer.connection.addIceCandidate(new RTCIceCandidate(signal.data));
        } else {
          console.warn('Received ICE candidate before remote description is set');
        }
        break;
    }
  } catch (error) {
    console.error('Error handling incoming signal:', error);
  }
};

/**
 * Handle incoming signals for the professor side
 */
const handleProfessorSignal = async (
  signal: SignalingMessage,
  quizId: string,
  professorId: string,
  onNewStream: (studentId: string, stream: MediaStream) => void
): Promise<void> => {
  try {
    const studentId = signal.sender;
    
    // Get or create peer connection for this student
    let peer = peerConnections.get(studentId);
    
    if (!peer) {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      
      // Set up event handlers for remote tracks
      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteVideoStreams.set(studentId, event.streams[0]);
          onNewStream(studentId, event.streams[0]);
        }
      };
      
      // Listen for ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: 'ice-candidate',
            sender: professorId,
            receiver: studentId,
            quizId,
            data: event.candidate,
            timestamp: new Date().toISOString()
          });
        }
      };
      
      peer = { connection: peerConnection };
      peerConnections.set(studentId, peer);
    }
    
    // Handle the specific signal type
    switch (signal.type) {
      case 'answer':
        await peer.connection.setRemoteDescription(new RTCSessionDescription(signal.data));
        break;
      
      case 'ice-candidate':
        if (peer.connection.remoteDescription) {
          await peer.connection.addIceCandidate(new RTCIceCandidate(signal.data));
        }
        break;
    }
  } catch (error) {
    console.error('Error handling professor signal:', error);
  }
};
