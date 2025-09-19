// CollabConnect - Real-Time Communication App
// This app demonstrates WebRTC, Socket.io, and modern web technologies

class CollabConnect {
    constructor() {
        // Core properties
        this.socket = null;
        this.localStream = null;
        this.peers = new Map();
        this.roomId = null;
        this.displayName = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isScreenSharing = false;
        
        // Whiteboard properties
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.currentBrushSize = 3;
        
        // File sharing
        this.sharedFiles = new Map();
        
        // WebRTC configuration
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeWhiteboard();
        this.showAuthModal();
        this.simulateBackend();
    }
    
    // Simulate backend functionality (in real app, this would be actual server)
    simulateBackend() {
        // Simulate Socket.io connection
        this.socket = {
            emit: (event, data) => {
                console.log(Socket emit: ${event}, data);
                this.handleSocketMessage(event, data);
            },
            on: (event, callback) => {
                console.log(Socket listener registered: ${event});
            },
            connected: true
        };
        
        // Simulate connection status
        this.updateConnectionStatus('connected');
    }
    
    setupEventListeners() {
        // Authentication
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinMeeting();
        });
        
        // Meeting controls
        document.getElementById('toggleVideo').addEventListener('click', () => this.toggleVideo());
        document.getElementById('toggleAudio').addEventListener('click', () => this.toggleAudio());
        document.getElementById('screenShare').addEventListener('click', () => this.toggleScreenShare());
        document.getElementById('endCall').addEventListener('click', () => this.endCall());
        
        // Sidebar tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Chat
        document.getElementById('sendMessage').addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Whiteboard
        this.setupWhiteboardEvents();
        
        // File sharing
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
    }
    
    async joinMeeting() {
        this.displayName = document.getElementById('displayName').value.trim();
        this.roomId = document.getElementById('roomId').value.trim() || this.generateRoomId();
        
        if (!this.displayName) {
            this.showToast('Please enter your name', 'error');
            return;
        }
        
        try {
            // Get user media
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            // Setup local video
            const localVideo = document.getElementById('localVideo');
            localVideo.srcObject = this.localStream;
            
            // Hide auth modal and show main app
            document.getElementById('authModal').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            
            // Update UI
            document.getElementById('currentRoomId').textContent = this.roomId;
            this.addParticipant('local', this.displayName, true);
            
            // Simulate joining room
            this.socket.emit('join-room', { roomId: this.roomId, displayName: this.displayName });
            
            this.showToast(Joined room: ${this.roomId}, 'success');
            
            // Simulate other participants joining (for demo)
            setTimeout(() => this.simulateParticipants(), 2000);
            
        } catch (error) {
            console.error('Error accessing media devices:', error);
            this.showToast('Camera/microphone access denied', 'error');
        }
    }
    
    // Simulate participants for demo purposes
    simulateParticipants() {
        const demoUsers = ['Alice Johnson', 'Bob Smith', 'Carol Williams'];
        demoUsers.forEach((name, index) => {
            setTimeout(() => {
                this.addRemoteVideo(index.toString(), name);
                this.addParticipant(index.toString(), name, false);
                this.updateParticipantCount();
            }, index * 1000);
        });
    }
    
    addRemoteVideo(peerId, displayName) {
        const videoGrid = document.getElementById('videoGrid');
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        videoContainer.id = video-${peerId};
        
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        
        // Create a demo video stream (colored rectangle)
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        
        // Generate random color for demo participant
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        const color = colors[parseInt(peerId) % colors.length];
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 320, 240);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(displayName, 160, 120);
        
        const stream = canvas.captureStream(30);
        video.srcObject = stream;
        
        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        overlay.innerHTML = `
            <span class="participant-name">${displayName}</span>
            <div class="video-controls">
                <span class="audio-indicator active">
                    <i class="fas fa-microphone"></i>
                </span>
            </div>
        `;
        
        videoContainer.appendChild(video);
        videoContainer.appendChild(overlay);
        videoGrid.appendChild(videoContainer);
    }
    
    toggleVideo() {
        if (!this.localStream) return;
        
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            this.isVideoEnabled = videoTrack.enabled;
            
            const btn = document.getElementById('toggleVideo');
            btn.classList.toggle('active', this.isVideoEnabled);
            btn.querySelector('i').className = this.isVideoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
            
            // Update local video display
            const localVideo = document.getElementById('localVideo');
            localVideo.style.opacity = this.isVideoEnabled ? '1' : '0.3';
            
            this.showToast(Video ${this.isVideoEnabled ? 'enabled' : 'disabled'}, 'info');
        }
    }
    
    toggleAudio() {
        if (!this.localStream) return;
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            this.isAudioEnabled = audioTrack.enabled;
            
            const btn = document.getElementById('toggleAudio');
            btn.classList.toggle('active', this.isAudioEnabled);
            btn.querySelector('i').className = this.isAudioEnabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
            
            // Update audio indicator
            const indicator = document.querySelector('.video-container.local .audio-indicator');
            indicator.classList.toggle('muted', !this.isAudioEnabled);
            
            this.showToast(Audio ${this.isAudioEnabled ? 'enabled' : 'disabled'}, 'info');
        }
    }
    
    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                // Start screen sharing
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                
                // Replace video track
                const videoTrack = screenStream.getVideoTracks()[0];
                const localVideo = document.getElementById('localVideo');
                localVideo.srcObject = screenStream;
                
                // Handle screen share end
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };
                
                this.isScreenSharing = true;
                const btn = document.getElementById('screenShare');
                btn.classList.add('active');
                btn.querySelector('i').className = 'fas fa-stop';
                
                this.showToast('Screen sharing started', 'success');
                
            } else {
                this.stopScreenShare();
            }
        } catch (error) {
            console.error('Error sharing screen:', error);
            this.showToast('Screen sharing failed', 'error');
        }
    }
    
    stopScreenShare() {
        if (this.localStream) {
            const localVideo = document.getElementById('localVideo');
            localVideo.srcObject = this.localStream;
        }
        
        this.isScreenSharing = false;
        const btn = document.getElementById('screenShare');
        btn.classList.remove('active');
        btn.querySelector('i').className = 'fas fa-desktop';
        
        this.showToast('Screen sharing stopped', 'info');
    }
    
    endCall() {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Close peer connections
        this.peers.forEach(peer => peer.close());
        this.peers.clear();
        
        // Reset UI
        this.showAuthModal();
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('videoGrid').innerHTML = `
            <div class="video-container local">
                <video id="localVideo" autoplay muted playsinline></video>
                <div class="video-overlay">
                    <span class="participant-name">You</span>
                    <div class="video-controls">
                        <span class="audio-indicator">
                            <i class="fas fa-microphone"></i>
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        this.clearChat();
        this.clearWhiteboard();
        this.clearFiles();
        this.clearParticipants();
        
        this.showToast('Call ended', 'info');
    }
    
    // Chat functionality
    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const messageData = {
            id: Date.now(),
            sender: this.displayName,
            text: message,
            timestamp: new Date(),
            isOwn: true
        };
        
        this.addChatMessage(messageData);
        
        // Emit to other participants
        this.socket.emit('chat-message', messageData);
        
        input.value = '';
        
        // Simulate responses for demo
        setTimeout(() => this.simulateChatResponse(message), 1000 + Math.random() * 2000);
    }
    
    simulateChatResponse(originalMessage) {
        const responses = [
            "That's interesting!",
            "I agree with that point.",
            "Could you elaborate on that?",
            "Great observation!",
            "Let me think about that...",
            "Thanks for sharing!",
        ];
        
        const names = ['Alice Johnson', 'Bob Smith', 'Carol Williams'];
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const responseData = {
            id: Date.now(),
            sender: randomName,
            text: randomResponse,
            timestamp: new Date(),
            isOwn: false
        };
        
        this.addChatMessage(responseData);
    }
    
    addChatMessage(messageData) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = chat-message ${messageData.isOwn ? 'own' : ''};
        
        const timeStr = messageData.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.innerHTML = `
            <div class="message-sender">${messageData.sender}</div>
            <div class="message-text">${this.escapeHtml(messageData.text)}</div>
            <div class="message-time">${timeStr}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Whiteboard functionality
    initializeWhiteboard() {
        const canvas = document.getElementById('whiteboard');
        this.ctx = canvas.getContext('2d');
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }
    
    setupWhiteboardEvents() {
        const canvas = document.getElementById('whiteboard');
        
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.id === 'clearBoard') {
                    this.clearWhiteboard();
                    return;
                }
                
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });
        
        // Color and brush size
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
        });
        
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.currentBrushSize = e.target.value;
        });
        
        // Drawing events
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mousemove', (e) => this.draw(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            canvas.dispatchEvent(mouseEvent);
        });
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.currentBrushSize * 3;
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentBrushSize;
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        // Emit drawing data to other participants
        this.socket.emit('whiteboard-draw', {
            x, y,
            tool: this.currentTool,
            color: this.currentColor,
            size: this.currentBrushSize,
            isDrawing: true
        });
    }
    
    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.ctx.beginPath();
    }
    
    clearWhiteboard() {
        const canvas = document.getElementById('whiteboard');
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.socket.emit('whiteboard-clear');
        this.showToast('Whiteboard cleared', 'info');
    }
    
    // File sharing functionality
    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                this.showToast('File too large (max 10MB)', 'error');
                return;
            }
            
            const fileData = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file),
                uploader: this.displayName
            };
            
            this.addFileToList(fileData);
            this.socket.emit('file-share', fileData);
            this.showToast(File "${file.name}" uploaded, 'success');
        });
    }
    
    addFileToList(fileData) {
        const fileList = document.getElementById('fileList');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-name">
                    <i class="fas fa-file"></i> ${fileData.name}
                </div>
                <div class="file-size">${this.formatFileSize(fileData.size)} • ${fileData.uploader}</div>
            </div>
            <button class="file-download" onclick="window.open('${fileData.url}', '_blank')">
                <i class="fas fa-download"></i>
            </button>
        `;
        
        fileList.appendChild(fileItem);
        this.sharedFiles.set(fileData.id, fileData);
    }
    
    // Participants management
    addParticipant(id, name, isLocal) {
        const participantsList = document.getElementById('participantsList');
        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';
        participantItem.id = participant-${id};
        
        const avatar = name.charAt(0).toUpperCase();
        
        participantItem.innerHTML = `
            <div class="participant-avatar">${avatar}</div>
            <div class="participant-info">
                <div class="participant-name">${name} ${isLocal ? '(You)' : ''}</div>
                <div class="participant-status">
                    <i class="fas fa-microphone status-icon active"></i>
                    <i class="fas fa-video status-icon active"></i>
                </div>
            </div>
        `;
        
        participantsList.appendChild(participantItem);
    }
    
    updateParticipantCount() {
        const count = document.querySelectorAll('.participant-item').length;
        document.getElementById('participantCount').textContent = count;
    }
    
    // Tab switching
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector([data-tab="${tabName}"]).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(${tabName}Tab).classList.add('active');
    }
    
    // Utility functions
    generateRoomId() {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast-icon');
        const messageSpan = toast.querySelector('.toast-message');
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        icon.className = toast-icon ${icons[type]};
        messageSpan.textContent = message;
        toast.className = toast ${type};
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
    
    showAuthModal() {
        document.getElementById('authModal').classList.remove('hidden');
        document.getElementById('displayName').focus();
    }
    
    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connectionStatus');
        statusEl.className = connection-status ${status};
        
        const statusText = {
            connected: 'Connected',
            connecting: 'Connecting...',
            disconnected: 'Disconnected'
        };
        
        statusEl.querySelector('span').textContent = statusText[status];
    }
    
    // Socket message handler (simulated)
    handleSocketMessage(event, data) {
        switch (event) {
            case 'join-room':
                console.log('Joined room:', data);
                break;
            case 'chat-message':
                if (data.sender !== this.displayName) {
                    this.addChatMessage(data);
                }
                break;
            case 'whiteboard-draw':
                // Handle remote drawing
                break;
            case 'file-share':
                if (data.uploader !== this.displayName) {
                    this.addFileToList(data);
                }
                break;
        }
    }
    
    // Cleanup functions
    clearChat() {
        document.getElementById('chatMessages').innerHTML = '';
    }
    
    clearFiles() {
        document.getElementById('fileList').innerHTML = '';
        this.sharedFiles.clear();
    }
    
    clearParticipants() {
        document.getElementById('participantsList').innerHTML = '';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.collabConnect = new CollabConnect();
});

// Handle page visibility for connection management
document.addEventListener('visibilitychange', () => {
    if (window.collabConnect) {
        if (document.hidden) {
            console.log('Page hidden - maintaining connection');
        } else {
            console.log('Page visible - refreshing connection');
        }
    }
});

// Handle beforeunload for cleanup
window.addEventListener('beforeunload', (e) => {
    if (window.collabConnect && window.collabConnect.localStream) {
        window.collabConnect.localStream.getTracks().forEach(track => track.stop());
    }
});