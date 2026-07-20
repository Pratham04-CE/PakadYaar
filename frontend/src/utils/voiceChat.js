// WebRTC Voice Chat Manager for PakadYaar - Robust Multi-Peer Audio Engine

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

class VoiceChatManager {
  constructor() {
    this.localStream = null;
    this.peerConnections = new Map(); // peerId -> RTCPeerConnection
    this.candidateQueues = new Map();  // peerId -> RTCIceCandidate[]
    this.audioElements = new Map();    // peerId -> HTMLAudioElement
    this.muted = false;
    this.initialized = false;
  }

  async startLocalStream() {
    if (this.localStream) return this.localStream;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      // Apply initial mute state
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.muted;
      });

      // Attach new local audio tracks to any pre-existing peer connections
      this.peerConnections.forEach((pc) => {
        this.localStream.getTracks().forEach(track => {
          const senders = pc.getSenders();
          const alreadyAdded = senders.some(s => s.track && s.track.kind === track.kind);
          if (!alreadyAdded) {
            pc.addTrack(track, this.localStream);
          }
        });
      });

      this.initialized = true;
      return this.localStream;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      return null;
    }
  }

  toggleMic() {
    this.muted = !this.muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.muted;
      });
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  isInitialized() {
    return !!this.localStream;
  }

  async createPeerConnection(peerId, socket, isInitiator = false) {
    if (this.peerConnections.has(peerId)) {
      const existingPc = this.peerConnections.get(peerId);
      if (existingPc.connectionState !== 'closed' && existingPc.connectionState !== 'failed') {
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            const senders = existingPc.getSenders();
            const alreadyAdded = senders.some(s => s.track && s.track.kind === track.kind);
            if (!alreadyAdded) {
              existingPc.addTrack(track, this.localStream);
            }
          });
        }
        return existingPc;
      }
      this.closePeerConnection(peerId);
    }

    const pc = new RTCPeerConnection(STUN_SERVERS);
    this.peerConnections.set(peerId, pc);
    this.candidateQueues.set(peerId, []);

    // Add local tracks if stream exists
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice-signal', {
          targetId: peerId,
          signal: { candidate: event.candidate }
        });
      }
    };

    // Remote Audio Track handler
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        let audioEl = this.audioElements.get(peerId);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.id = `remote-audio-${peerId}`;
          audioEl.autoplay = true;
          audioEl.playsInline = true;
          audioEl.style.display = 'none';
          document.body.appendChild(audioEl);
          this.audioElements.set(peerId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.play().catch(() => {
          // Retry playback on user gesture
          const playOnClick = () => {
            audioEl.play().catch(() => {});
            document.removeEventListener('click', playOnClick);
          };
          document.addEventListener('click', playOnClick, { once: true });
        });
      }
    };

    // Auto-restart ICE on failure
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        try {
          pc.restartIce();
        } catch (e) {}
      } else if (pc.iceConnectionState === 'disconnected') {
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            this.closePeerConnection(peerId);
          }
        }, 5000);
      }
    };

    // If initiator, create and transmit SDP Offer
    if (isInitiator) {
      try {
        if (pc.signalingState !== 'stable') {
          return pc;
        }
        const offer = await pc.createOffer({
          offerToReceiveAudio: true
        });
        await pc.setLocalDescription(offer);
        socket.emit('voice-signal', {
          targetId: peerId,
          signal: { sdp: pc.localDescription }
        });
      } catch (err) {
        console.error(`Error creating WebRTC offer for ${peerId}:`, err);
      }
    }

    return pc;
  }

  async handleSignal(senderId, signal, socket) {
    let pc = this.peerConnections.get(senderId);

    if (!pc || pc.connectionState === 'closed') {
      const isInitiator = socket.id < senderId;
      pc = await this.createPeerConnection(senderId, socket, isInitiator);
    }

    try {
      if (signal.sdp) {
        const sdp = signal.sdp;
        const currentState = pc.signalingState;

        // Guard 1: Ignore answer if not expecting an answer
        if (sdp.type === 'answer' && currentState !== 'have-local-offer') {
          return;
        }

        // Guard 2: Rollback if offer received while expecting answer and we are polite peer
        const isPolite = socket.id > senderId;
        if (sdp.type === 'offer' && currentState === 'have-local-offer') {
          if (isPolite) {
            await pc.setLocalDescription({ type: 'rollback' });
          } else {
            return;
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Process queued ICE candidates now that remote description is set
        const queue = this.candidateQueues.get(senderId) || [];
        while (queue.length > 0) {
          const candidate = queue.shift();
          try {
            await pc.addIceCandidate(candidate);
          } catch (e) {}
        }

        if (sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('voice-signal', {
            targetId: senderId,
            signal: { sdp: pc.localDescription }
          });
        }
      } else if (signal.candidate) {
        const candidate = new RTCIceCandidate(signal.candidate);
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(candidate);
          } catch (e) {}
        } else {
          // Queue candidate until remote description is set
          const queue = this.candidateQueues.get(senderId) || [];
          queue.push(candidate);
          this.candidateQueues.set(senderId, queue);
        }
      }
    } catch (err) {
      console.error(`Error handling WebRTC signal from ${senderId}:`, err);
    }
  }

  closePeerConnection(peerId) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    this.candidateQueues.delete(peerId);

    const audioEl = this.audioElements.get(peerId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
      this.audioElements.delete(peerId);
    }
  }

  closeAll() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.candidateQueues.clear();

    this.audioElements.forEach((audioEl) => {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
    });
    this.audioElements.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.initialized = false;
  }
}

const voiceChat = new VoiceChatManager();
export default voiceChat;
