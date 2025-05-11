import { supabase } from '@/integrations/supabase/client';
import { QuizAttemptUpdate, QuizAttemptRow } from '@/types/database';

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
  pendingCandidates: RTCIceCandidate[];
  connectionState?: RTCPeerConnectionState;
  retryCount: number;
}

// Connection maps - we store them here so they persist between renders
const peerConnections = new Map<string, PeerConnection>();
const remoteVideoStreams = new Map<string, MediaStream>();
const connectionTimeouts = new Map<string, number>();

// Clear any stale connections that may exist
const clearStaleConnections = () => {
  peerConnections.forEach((peer, connectionId) => {
    if (peer.connection.connectionState === 'failed' || 
        peer.connection.connectionState === 'closed' ||
        peer.connection.iceConnectionState === 'disconnected') {
      console.log(`Clearing stale connection: ${connectionId}`);
      peer.connection.close();
      peerConnections.delete(connectionId);
      
      if (connectionTimeouts.has(connectionId)) {
        clearTimeout(connectionTimeouts.get(connectionId) as unknown as NodeJS.Timeout);
        connectionTimeouts.delete(connectionId);
      }
    }
  });
};

// Periodically clean up stale connections
setInterval(clearStaleConnections, 30000);

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
    const signalChannel = supabase
      .channel(`quiz:${quizId}`)
      .on('broadcast', { event: 'webrtc-signal' }, async (payload) => {
        const signal = payload.payload as SignalingMessage;
        
        // Only process signals intended for this student
        if (signal.receiver !== studentId) return;
        
        console.log(`Student ${studentId} received signal type: ${signal.type} from ${signal.sender}`);
        
        // Handle different types of signals
        await handleIncomingSignal(signal, quizId, studentId, localStream);
        
        // If we received an offer, the professor is trying to connect
        if (signal.type === 'offer') {
          onStatusChange?.('connected');
        }
      })
      .subscribe();
      
    subscriptions.push(signalChannel);
    
    // Notify that student is available (broadcasting presence)
    try {
      const updateData: QuizAttemptUpdate = { 
        monitoring_available: true
      };
      
      const { error: updateError } = await supabase.from('quiz_attempts')
        .update(updateData)
        .eq('quiz_id', quizId)
        .eq('student_id', studentId);
        
      if (updateError) {
        console.error('Error updating monitoring availability:', updateError);
        onStatusChange?.('error');
      } else {
        console.log('Successfully marked monitoring as available');
        // Double-check that the flag was set correctly
        const { data: verifyData, error: verifyError } = await supabase
          .from('quiz_attempts')
          .select('monitoring_available')
          .eq('quiz_id', quizId)
          .eq('student_id', studentId)
          .single();
          
        if (verifyError) {
          console.error('Error verifying monitoring flag:', verifyError);
        } else {
          console.log('Verified monitoring_available flag:', verifyData.monitoring_available);
        }
      }
    } catch (err) {
      console.error('Error updating monitoring_available flag:', err);
      onStatusChange?.('error');
    }
    
    // Return cleanup function that properly handles async operations
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
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
      
      // Update database with monitoring no longer available
      const updateData: QuizAttemptUpdate = { monitoring_available: false };
      // Fix: Use a Promise chain with correct typing for Supabase response
      void supabase.from('quiz_attempts')
        .update(updateData)
        .eq('quiz_id', quizId)
        .eq('student_id', studentId)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to mark monitoring as unavailable:', error);
          } else {
            console.log('Marked monitoring as unavailable');
          }
        });
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
    console.log('Professor initializing WebRTC for monitoring quiz:', quizId);
    
    // Subscribe to the signaling channel
    const signalChannel = supabase
      .channel(`quiz:${quizId}`)
      .on('broadcast', { event: 'webrtc-signal' }, async (payload) => {
        const signal = payload.payload as SignalingMessage;
        
        // Only process signals intended for this professor
        if (signal.receiver !== professorId) return;

        console.log('Professor received signal:', signal.type, 'from student:', signal.sender);
        await handleProfessorSignal(signal, quizId, professorId, onNewStream);
      })
      .subscribe();
      
    subscriptions.push(signalChannel);
    
    // Clear any existing connections
    peerConnections.forEach((peer, studentId) => {
      peer.connection.close();
      onStreamRemoved(studentId);
    });
    
    peerConnections.clear();
    remoteVideoStreams.clear();
    
    // Return cleanup function
    return () => {
      // Close all peer connections
      peerConnections.forEach((peer, studentId) => {
        peer.connection.close();
        onStreamRemoved(studentId);
      });
      
      peerConnections.clear();
      remoteVideoStreams.clear();
      
      // Clear all timeouts
      connectionTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      connectionTimeouts.clear();
      
      // Unsubscribe from channels
      subscriptions.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
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
    console.log(`Professor ${professorId} attempting to monitor student ${studentId} for quiz ${quizId}`);
    
    // Check if we already have a connection to this student
    if (peerConnections.has(studentId)) {
      console.log('Already connected to student:', studentId);
      
      // If we have a connection but no stream, close it and try again
      const existingPeer = peerConnections.get(studentId);
      if (!remoteVideoStreams.has(studentId)) {
        console.log('Connection exists but no stream, trying to reconnect');
        existingPeer?.connection.close();
        peerConnections.delete(studentId);
      } else {
        return true;
      }
    }

    // First check if student has monitoring available
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .single();
      
    if (error) {
      console.error('Error checking student monitoring status:', error);
      return false;
    }

    // Use our custom QuizAttemptRow type to properly type the data
    const attemptData = data as QuizAttemptRow;
    
    if (!attemptData) {
      console.error('No quiz attempt found for student');
      return false;
    }
    
    if (!attemptData.monitoring_available) {
      console.error('Student monitoring not enabled for this attempt');
      
      // Try to update the monitoring_available flag as it might be a data consistency issue
      console.log('Attempting to enable monitoring for student');
      const { error: updateError } = await supabase.from('quiz_attempts')
        .update({ monitoring_available: true })
        .eq('quiz_id', quizId)
        .eq('student_id', studentId);
        
      if (updateError) {
        console.error('Error enabling monitoring:', updateError);
        return false;
      }
      
      console.log('Successfully enabled monitoring, retrying connection');
    }
    
    // Create new peer connection for this student
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.set(studentId, { 
      connection: peerConnection,
      pendingCandidates: [],
      retryCount: 0
    });
    
    // Set up event handlers for the connection
    peerConnection.onconnectionstatechange = () => {
      console.log(`WebRTC connection state with student ${studentId}:`, peerConnection.connectionState);
      
      const peer = peerConnections.get(studentId);
      if (peer) {
        peer.connectionState = peerConnection.connectionState;
      }
      
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
        console.error('Connection failed or closed, may need to retry');
        
        // Set up a retry if we haven't exceeded the limit
        const currentPeer = peerConnections.get(studentId);
        if (currentPeer && currentPeer.retryCount < 3) {
          currentPeer.retryCount++;
          
          // Set up timeout to retry the connection
          const timeoutId = setTimeout(() => {
            console.log(`Auto-retrying connection to student ${studentId}, attempt ${currentPeer.retryCount}`);
            monitorStudent(quizId, professorId, studentId);
          }, 5000);
          
          connectionTimeouts.set(studentId, timeoutId as unknown as number);
        }
      }
    };
    
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with student ${studentId}:`, peerConnection.iceConnectionState);
    };
    
    peerConnection.onicecandidateerror = (event) => {
      console.error('ICE candidate error:', event);
    };
    
    // Listen for ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to student ${studentId}`);
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
    
    // Listen for tracks
    peerConnection.ontrack = (event) => {
      console.log(`Received track from student ${studentId}`);
      if (event.streams && event.streams[0]) {
        console.log('Setting remote stream');
        remoteVideoStreams.set(studentId, event.streams[0]);
      }
    };
    
    // Create and send the offer
    console.log(`Creating offer for student ${studentId}`);
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    
    await peerConnection.setLocalDescription(offer);
    
    console.log(`Sending offer to student ${studentId}`);
    sendSignal({
      type: 'offer',
      sender: professorId,
      receiver: studentId,
      quizId,
      data: offer,
      timestamp: new Date().toISOString()
    });
    
    // Set timeout to check if connection was established
    const timeoutId = setTimeout(() => {
      const peer = peerConnections.get(studentId);
      if (peer && (peer.connectionState === undefined || peer.connectionState === 'new')) {
        console.log(`Connection timeout for student ${studentId}, retrying...`);
        if (peer.retryCount < 3) {
          peer.retryCount++;
          monitorStudent(quizId, professorId, studentId);
        } else {
          console.error(`Failed to connect to student ${studentId} after multiple attempts`);
        }
      }
    }, 15000);
    
    connectionTimeouts.set(studentId, timeoutId as unknown as number);
    
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
  
  // Clear any pending timeouts
  if (connectionTimeouts.has(studentId)) {
    clearTimeout(connectionTimeouts.get(studentId) as unknown as NodeJS.Timeout);
    connectionTimeouts.delete(studentId);
  }
};

/**
 * Send a WebRTC signaling message via Supabase Realtime
 */
const sendSignal = async (signal: SignalingMessage): Promise<void> => {
  try {
    console.log('Sending signal:', signal.type, 'to:', signal.receiver);
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
      console.log(`Student ${studentId} creating new peer connection for professor ${professorId}`);
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      
      // Set up connection state monitoring
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state changed to ${peerConnection.connectionState}`);
      };
      
      peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state changed to ${peerConnection.iceConnectionState}`);
      };
      
      // Add all local tracks to the connection
      console.log('Student adding local tracks to peer connection');
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      // Listen for ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Student sending ICE candidate to professor');
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
      
      peer = { 
        connection: peerConnection, 
        stream: localStream, 
        pendingCandidates: [],
        retryCount: 0 
      };
      peerConnections.set(professorId, peer);
    }
    
    // Handle the specific signal type
    switch (signal.type) {
      case 'offer':
        console.log('Received offer from professor, setting remote description');
        try {
          await peer.connection.setRemoteDescription(new RTCSessionDescription(signal.data));
          
          // Process any pending ICE candidates
          if (peer.pendingCandidates.length > 0) {
            console.log(`Processing ${peer.pendingCandidates.length} pending ICE candidates`);
            for (const candidate of peer.pendingCandidates) {
              await peer.connection.addIceCandidate(candidate);
            }
            peer.pendingCandidates = [];
          }
          
          const answer = await peer.connection.createAnswer();
          await peer.connection.setLocalDescription(answer);
          
          console.log('Student sending answer to professor');
          sendSignal({
            type: 'answer',
            sender: studentId,
            receiver: professorId,
            quizId,
            data: answer,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error handling offer:', err);
        }
        break;
      
      case 'ice-candidate':
        if (peer.connection.remoteDescription) {
          console.log('Student adding ICE candidate from professor');
          await peer.connection.addIceCandidate(new RTCIceCandidate(signal.data))
            .catch(err => {
              console.error('Error adding ICE candidate:', err);
            });
        } else {
          console.log('Received ICE candidate before remote description is set, buffering it for later');
          peer.pendingCandidates.push(new RTCIceCandidate(signal.data));
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
      console.log(`Professor ${professorId} creating new peer connection for student ${studentId}`);
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      
      // Set up event handlers for the connection
      peerConnection.onconnectionstatechange = () => {
        console.log(`WebRTC connection state with student ${studentId}:`, peerConnection.connectionState);
        
        // Store the connection state
        const currentPeer = peerConnections.get(studentId);
        if (currentPeer) {
          currentPeer.connectionState = peerConnection.connectionState;
        }
      };
      
      // Set up event handlers for remote tracks
      peerConnection.ontrack = (event) => {
        console.log(`Professor received track from student ${studentId}`);
        if (event.streams && event.streams[0]) {
          console.log(`Setting up stream from student ${studentId}`);
          remoteVideoStreams.set(studentId, event.streams[0]);
          onNewStream(studentId, event.streams[0]);
        }
      };
      
      // Listen for ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`Professor sending ICE candidate to student ${studentId}`);
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
      
      peer = { 
        connection: peerConnection, 
        pendingCandidates: [],
        retryCount: 0 
      };
      peerConnections.set(studentId, peer);
    }
    
    // Handle the specific signal type
    switch (signal.type) {
      case 'answer':
        console.log(`Professor received answer from student ${studentId}`);
        try {
          const currentState = peer.connection.signalingState;
          console.log(`Current signaling state: ${currentState}`);
          
          if (currentState !== 'have-local-offer') {
            console.warn(`Cannot set remote description in state ${currentState}, ignoring answer`);
            return;
          }
          
          await peer.connection.setRemoteDescription(new RTCSessionDescription(signal.data));
          
          // Process any pending ICE candidates
          if (peer.pendingCandidates.length > 0) {
            console.log(`Processing ${peer.pendingCandidates.length} pending ICE candidates`);
            for (const candidate of peer.pendingCandidates) {
              await peer.connection.addIceCandidate(candidate);
            }
            peer.pendingCandidates = [];
          }
          
          // Clear any connection timeout since we received an answer
          if (connectionTimeouts.has(studentId)) {
            clearTimeout(connectionTimeouts.get(studentId) as unknown as number);
            connectionTimeouts.delete(studentId);
          }
        } catch (error) {
          console.error('Error handling professor signal:', error);
        }
        break;
      
      case 'ice-candidate':
        if (peer.connection.remoteDescription) {
          console.log(`Professor adding ICE candidate from student ${studentId}`);
          await peer.connection.addIceCandidate(new RTCIceCandidate(signal.data))
            .catch(err => {
              console.error('Error adding ICE candidate:', err);
            });
        } else {
          console.log('Received ICE candidate before remote description is set, buffering for later');
          peer.pendingCandidates.push(new RTCIceCandidate(signal.data));
        }
        break;
    }
  } catch (error) {
    console.error('Error handling professor signal:', error);
  }
};
