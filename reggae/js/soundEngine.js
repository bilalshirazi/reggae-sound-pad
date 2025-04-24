/**
 * Sound Engine for Reggae Sound Pad
 * Handles audio processing, effects, and playback
 */
class SoundEngine {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
        this.samples = {};
        this.effects = {
            reverb: null,
            delay: null,
            filter: null
        };
        this.recording = {
            isRecording: false,
            startTime: 0,
            events: []
        };
        this.playback = {
            isPlaying: false,
            startTime: 0,
            timeouts: []
        };
        this.tempo = 100; // BPM
    }

    /**
     * Initialize the audio engine
     */
    async init() {
        try {
            // Use the AudioVerifier's context if available
            if (audioVerifier && audioVerifier.audioContext) {
                this.audioContext = audioVerifier.audioContext;
            } else {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            }
            
            // Create master gain node
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = 0.8; // Default volume at 80%
            this.masterGainNode.connect(this.audioContext.destination);
            
            // Initialize effects
            await this.initEffects();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio engine:', error);
            return false;
        }
    }
    
    /**
     * Initialize audio effects
     */
    async initEffects() {
        // Create reverb
        this.effects.reverb = this.audioContext.createConvolver();
        
        // Create impulse response for reverb
        const impulseResponse = await this.createReverbImpulse(2, 2.5);
        this.effects.reverb.buffer = impulseResponse;
        
        // Create delay (dub echo)
        this.effects.delay = this.audioContext.createDelay(4.0);
        this.effects.delay.delayTime.value = 0.5;
        
        // Create feedback for delay
        this.delayFeedback = this.audioContext.createGain();
        this.delayFeedback.gain.value = 0.3;
        
        // Connect delay feedback loop
        this.effects.delay.connect(this.delayFeedback);
        this.delayFeedback.connect(this.effects.delay);
        
        // Create filter
        this.effects.filter = this.audioContext.createBiquadFilter();
        this.effects.filter.type = 'lowpass';
        this.effects.filter.frequency.value = 20000;
        this.effects.filter.Q.value = 1;
        
        // Connect effects chain
        this.effects.filter.connect(this.masterGainNode);
        this.effects.delay.connect(this.effects.filter);
        this.effects.reverb.connect(this.effects.filter);
        
        // Create dry/wet nodes for effects
        this.effectsGain = {
            reverb: this.audioContext.createGain(),
            delay: this.audioContext.createGain(),
            dry: this.audioContext.createGain()
        };
        
        this.effectsGain.reverb.gain.value = 0.2; // 20% wet reverb by default
        this.effectsGain.delay.gain.value = 0.0;  // 0% delay by default
        this.effectsGain.dry.gain.value = 0.8;    // 80% dry signal by default
        
        // Connect effect gain nodes
        this.effectsGain.reverb.connect(this.effects.reverb);
        this.effectsGain.delay.connect(this.effects.delay);
        this.effectsGain.dry.connect(this.effects.filter);
    }
    
    /**
     * Create a reverb impulse response
     * @param {number} duration - Duration in seconds
     * @param {number} decay - Decay rate
     * @returns {AudioBuffer} - Impulse response buffer
     */
    async createReverbImpulse(duration, decay) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        const leftChannel = impulse.getChannelData(0);
        const rightChannel = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            const n = i / length;
            // Exponential decay
            const value = (1 - n) * Math.random() * Math.exp(-decay * n);
            
            leftChannel[i] = value;
            // Slightly different for right channel for stereo effect
            rightChannel[i] = (1 - n) * Math.random() * Math.exp(-decay * (n + 0.1));
        }
        
        return impulse;
    }
    
    /**
     * Load verified audio samples
     * @param {Array} verifiedSamples - Array of verified audio samples
     */
    loadSamples(verifiedSamples) {
        verifiedSamples.forEach(sample => {
            if (!this.samples[sample.category]) {
                this.samples[sample.category] = {};
            }
            
            this.samples[sample.category][sample.name] = {
                buffer: sample.buffer,
                url: sample.url
            };
        });
        
        console.log('Loaded samples:', this.samples);
    }
    
    /**
     * Play a sample
     * @param {string} category - Sample category
     * @param {string} name - Sample name
     * @param {Object} options - Playback options (volume, pitch, etc.)
     * @returns {Object|null} - Source node and gain node or null if failed
     */
    playSample(category, name, options = {}) {
        if (!this.audioContext) {
            console.error('Audio context not initialized');
            return null;
        }
        
        // Resume audio context if it's suspended (autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Check if sample exists
        if (!this.samples[category] || !this.samples[category][name]) {
            console.error(`Sample not found: ${category}/${name}`);
            return null;
        }
        
        const sample = this.samples[category][name];
        const source = this.audioContext.createBufferSource();
        source.buffer = sample.buffer;
        
        // Apply pitch shift if specified
        if (options.pitch) {
            source.playbackRate.value = options.pitch;
        }
        
        // Create gain node for this sample
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = options.volume !== undefined ? options.volume : 1.0;
        
        // Connect to effects
        source.connect(gainNode);
        gainNode.connect(this.effectsGain.dry);
        gainNode.connect(this.effectsGain.reverb);
        gainNode.connect(this.effectsGain.delay);
        
        // Start playback
        source.start(0);
        
        // Record this event if recording
        if (this.recording.isRecording) {
            const time = this.audioContext.currentTime - this.recording.startTime;
            this.recording.events.push({
                time,
                category,
                name,
                options
            });
        }
        
        return { source, gainNode };
    }
    
    /**
     * Set master volume
     * @param {number} value - Volume value (0-1)
     */
    setMasterVolume(value) {
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = value;
        }
    }
    
    /**
     * Set reverb level
     * @param {number} value - Reverb wet level (0-1)
     */
    setReverbLevel(value) {
        if (this.effectsGain && this.effectsGain.reverb) {
            this.effectsGain.reverb.gain.value = value;
            this.effectsGain.dry.gain.value = 1 - (value * 0.5); // Adjust dry signal but don't remove it completely
        }
    }
    
    /**
     * Set delay (dub echo) level
     * @param {number} value - Delay wet level (0-1)
     */
    setDelayLevel(value) {
        if (this.effectsGain && this.effectsGain.delay) {
            this.effectsGain.delay.gain.value = value;
            
            // Adjust feedback based on level
            if (this.delayFeedback) {
                this.delayFeedback.gain.value = value * 0.6; // Max 60% feedback to avoid runaway
            }
        }
    }
    
    /**
     * Set filter cutoff
     * @param {number} value - Filter cutoff frequency (0-1, mapped to frequency range)
     */
    setFilterCutoff(value) {
        if (this.effects && this.effects.filter) {
            // Map 0-1 to frequency range (200Hz - 20000Hz)
            const minFreq = 200;
            const maxFreq = 20000;
            const frequency = minFreq + (value * (maxFreq - minFreq));
            
            this.effects.filter.frequency.value = frequency;
        }
    }
    
    /**
     * Start recording
     */
    startRecording() {
        this.recording.isRecording = true;
        this.recording.startTime = this.audioContext.currentTime;
        this.recording.events = [];
    }
    
    /**
     * Stop recording
     * @returns {Array} - Recorded events
     */
    stopRecording() {
        this.recording.isRecording = false;
        return this.recording.events;
    }
    
    /**
     * Play back recorded sequence
     * @param {Array} events - Recorded events to play back
     */
    playRecording(events) {
        if (this.playback.isPlaying) {
            this.stopPlayback();
        }
        
        this.playback.isPlaying = true;
        this.playback.startTime = this.audioContext.currentTime;
        
        // Clear any existing timeouts
        this.playback.timeouts.forEach(timeout => clearTimeout(timeout));
        this.playback.timeouts = [];
        
        // Schedule all events
        events.forEach(event => {
            const timeoutId = setTimeout(() => {
                this.playSample(event.category, event.name, event.options);
            }, event.time * 1000);
            
            this.playback.timeouts.push(timeoutId);
        });
        
        // Set timeout to mark playback as complete
        if (events.length > 0) {
            const lastEvent = events[events.length - 1];
            const playbackDuration = lastEvent.time * 1000 + 500; // Add 500ms buffer
            
            const endTimeoutId = setTimeout(() => {
                this.playback.isPlaying = false;
            }, playbackDuration);
            
            this.playback.timeouts.push(endTimeoutId);
        }
    }
    
    /**
     * Stop playback
     */
    stopPlayback() {
        this.playback.isPlaying = false;
        
        // Clear all scheduled timeouts
        this.playback.timeouts.forEach(timeout => clearTimeout(timeout));
        this.playback.timeouts = [];
    }
    
    /**
     * Set tempo in BPM
     * @param {number} bpm - Tempo in beats per minute
     */
    setTempo(bpm) {
        this.tempo = bpm;
    }
    
    /**
     * Save recording to local storage
     * @param {string} name - Name for the saved recording
     * @param {Array} events - Recorded events
     */
    saveRecording(name, events) {
        try {
            const savedRecordings = JSON.parse(localStorage.getItem('reggaePadRecordings') || '{}');
            savedRecordings[name] = {
                events,
                date: new Date().toISOString(),
                tempo: this.tempo
            };
            
            localStorage.setItem('reggaePadRecordings', JSON.stringify(savedRecordings));
            return true;
        } catch (error) {
            console.error('Failed to save recording:', error);
            return false;
        }
    }
    
    /**
     * Load recording from local storage
     * @param {string} name - Name of the saved recording
     * @returns {Object|null} - Recording data or null if not found
     */
    loadRecording(name) {
        try {
            const savedRecordings = JSON.parse(localStorage.getItem('reggaePadRecordings') || '{}');
            return savedRecordings[name] || null;
        } catch (error) {
            console.error('Failed to load recording:', error);
            return null;
        }
    }
}

// Create global instance
const soundEngine = new SoundEngine();
