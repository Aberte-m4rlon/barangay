// WebRTC Video/Audio Call Implementation
// This file handles peer-to-peer video and audio calls using WebRTC

class WebRTCCall {
  constructor(socket, username, role) {
    this.socket = socket;
    this.username = username;
    this.role = role;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isMicOn = true;
    this.isVideoOn = true;
    this.isScreenSharing = false;
    this.callStartTime = null;
    this.callTimer = null;
    this.callType = null; // 'video' or 'audio'
    
    // ICE servers for NAT traversal (using free STUN servers)
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    };
    
    this.setupSocketListeners();
  }
  
  setupSocketListeners() {
    // Listen for WebRTC signaling messages
    this.socket.on('offer', async (data) => {
      console.log('Received offer from:', data.from);
      await this.handleOffer(data.offer, data.from);
    });
    
    this.socket.on('answer', async (data) => {
      console.log('Received answer from:', data.from);
      await this.handleAnswer(data.answer);
    });
    
    this.socket.on('ice-candidate', async (data) => {
      console.log('Received ICE candidate from:', data.from);
      await this.handleIceCandidate(data.candidate);
    });
    
    this.socket.on('user-left', (userId) => {
      console.log('User left:', userId);
      this.handleUserLeft();
    });
  }
  
  async startCall(type = 'video') {
    try {
      this.callType = type;
      
      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera/microphone access');
      }
      
      // Check HTTPS (required for getUserMedia except on localhost)
      if (location.protocol !== 'https:' && 
          location.hostname !== 'localhost' && 
          location.hostname !== '127.0.0.1') {
        throw new Error('Camera/microphone access requires HTTPS');
      }
      
      // Get user media
      const constraints = type === 'video' 
        ? { 
            video: { 
              width: { ideal: 1280 }, 
              height: { ideal: 720 },
              facingMode: 'user'
            }, 
            audio: { 
              echoCancellation: true, 
              noiseSuppression: true,
              autoGainControl: true
            }
          }
        : { 
            video: false, 
            audio: { 
              echoCancellation: true, 
              noiseSuppression: true,
              autoGainControl: true
            }
          };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Display local stream
      if (type === 'video') {
        document.getElementById('localVideo').srcObject = this.localStream;
      }
      
      // Create peer connection
      this.createPeerConnection();
      
      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
      
      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      this.socket.emit('offer', {
        offer: offer,
        from: this.socket.id
      });
      
      // Start call timer
      this.callStartTime = Date.now();
      this.startCallTimer();
      
      return true;
    } catch (error) {
      console.error('Error starting call:', error);
      this.handleCallError(error);
      return false;
    }
  }
  
  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.iceServers);
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          from: this.socket.id
        });
      }
    };
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track');
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        if (this.callType === 'video') {
          document.getElementById('remoteVideo').srcObject = this.remoteStream;
          document.getElementById('remoteUserName').textContent = 'Connected';
        } else {
          document.getElementById('remoteAudio').srcObject = this.remoteStream;
          document.getElementById('audioCallStatus').textContent = 'Connected';
        }
      }
      this.remoteStream.addTrack(event.track);
    });
    
    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'disconnected' ||
          this.peerConnection.connectionState === 'failed' ||
          this.peerConnection.connectionState === 'closed') {
        this.handleUserLeft();
      }
    };
  }
  
  async handleOffer(offer, from) {
    try {
      if (!this.peerConnection) {
        this.createPeerConnection();
      }
      
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Add local stream if we have it
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      }
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      this.socket.emit('answer', {
        answer: answer,
        to: from,
        from: this.socket.id
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }
  
  async handleAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }
  
  async handleIceCandidate(candidate) {
    try {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }
  
  handleUserLeft() {
    if (this.callType === 'video') {
      document.getElementById('remoteUserName').textContent = 'User disconnected';
    } else {
      document.getElementById('audioCallStatus').textContent = 'User disconnected';
    }
  }
  
  toggleMicrophone() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        this.isMicOn = !this.isMicOn;
        audioTrack.enabled = this.isMicOn;
        return this.isMicOn;
      }
    }
    return false;
  }
  
  toggleVideo() {
    if (this.localStream && this.callType === 'video') {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        this.isVideoOn = !this.isVideoOn;
        videoTrack.enabled = this.isVideoOn;
        return this.isVideoOn;
      }
    }
    return false;
  }
  
  async toggleScreenShare() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in your browser');
      }
      
      if (!this.isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: 'always' },
          audio: false
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track in peer connection
        const sender = this.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
        
        // Update local video display
        document.getElementById('localVideo').srcObject = screenStream;
        this.isScreenSharing = true;
        
        // Handle screen share stop
        screenTrack.onended = () => {
          this.stopScreenShare();
        };
        
        return true;
      } else {
        this.stopScreenShare();
        return false;
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      if (error.name === 'NotAllowedError') {
        alert('Screen sharing permission was denied');
      } else {
        alert('Could not share screen: ' + error.message);
      }
      return false;
    }
  }
  
  stopScreenShare() {
    if (this.localStream && this.callType === 'video') {
      const videoTrack = this.localStream.getVideoTracks()[0];
      
      // Replace screen track with camera track
      const sender = this.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
      
      // Update local video display
      document.getElementById('localVideo').srcObject = this.localStream;
      this.isScreenSharing = false;
    }
  }
  
  endCall() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Emit leave event
    this.socket.emit('leave-call');
    
    // Stop timer
    this.stopCallTimer();
    
    // Reset states
    this.isMicOn = true;
    this.isVideoOn = true;
    this.isScreenSharing = false;
    this.remoteStream = null;
  }
  
  startCallTimer() {
    const elementId = this.callType === 'video' ? 'callDuration' : 'audioDuration';
    this.callTimer = setInterval(() => {
      const elapsed = Date.now() - this.callStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
    }, 1000);
  }
  
  stopCallTimer() {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }
  
  handleCallError(error) {
    let message = 'Could not start call: ';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      message += 'Camera/microphone access was denied. Please allow access in your browser settings.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      message += 'No camera or microphone found. Please connect a device and try again.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      message += 'Camera/microphone is already in use by another application.';
    } else if (error.name === 'OverconstrainedError') {
      message += 'Camera does not meet the required specifications.';
    } else {
      message += error.message;
    }
    
    alert(message);
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebRTCCall;
}
