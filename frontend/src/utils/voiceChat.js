// WebRTC Voice Chat Manager for PakadYaar

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

class VoiceChatManager {
  constructor() {
    this.localStream = null;
    this.peerConnections = new Map(); // peerId -> RTCPeerConnection
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

      this.initialized = true;
      return this.localStream;
    } catch (err) {
      console.warn('Microphone access not granted or unavailable:', err);
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
      return this.peerConnections.get(peerId);
    }

    const pc = new RTCPeerConnection(STUN_SERVERS);
    this.peerConnections.set(peerId, pc);

    // Add local audio tracks if stream is active
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

    // Remote Audio Stream handler
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        let audioEl = this.audioElements.get(peerId);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.playsInline = true;
          this.audioElements.set(peerId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeerConnection(peerId);
      }
    };

    // If initiator, create and send WebRTC Offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
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

    if (!pc) {
      pc = await this.createPeerConnection(senderId, socket, false);
    }

    try {
      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        if (signal.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('voice-signal', {
            targetId: senderId,
            signal: { sdp: pc.localDescription }
          });
        }
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
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

    const audioEl = this.audioElements.get(peerId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
      this.audioElements.delete(peerId);
    }
  }

  closeAll() {
    this.peerConnections.forEach((pc, peerId) => {
      pc.close();
    });
    this.peerConnections.clear();

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
