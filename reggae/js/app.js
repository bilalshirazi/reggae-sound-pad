/**
 * Main application for Reggae Sound Pad
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const padContainer = document.querySelector('.pad-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingProgress = document.getElementById('loading-progress');
    const loadingStatus = document.getElementById('loading-status');
    const tempoSlider = document.getElementById('tempo');
    const tempoValue = document.getElementById('tempo-value');
    const masterVolumeSlider = document.getElementById('master-volume');
    const reverbSlider = document.getElementById('reverb');
    const delaySlider = document.getElementById('delay');
    const filterSlider = document.getElementById('filter');
    const recordBtn = document.getElementById('record-btn');
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const saveBtn = document.getElementById('save-btn');
    
    // Sample definitions
    const sampleDefinitions = [
        // Drums - One Drop Pattern
        { url: 'samples/drums/one_drop/kick.wav', category: 'drums', name: 'one_drop_kick', label: 'One Drop Kick', key: '1' },
        { url: 'samples/drums/one_drop/snare.wav', category: 'drums', name: 'one_drop_snare', label: 'One Drop Snare', key: '2' },
        { url: 'samples/drums/one_drop/hihat-closed.wav', category: 'drums', name: 'one_drop_hihat', label: 'One Drop Hi-Hat', key: '3' },
        { url: 'samples/drums/one_drop/hihat-open.wav', category: 'drums', name: 'one_drop_open', label: 'One Drop Open', key: '4' },
        
        // Drums - Rockers Pattern
        { url: 'samples/drums/rockers/kick.wav', category: 'drums', name: 'rockers_kick', label: 'Rockers Kick', key: 'q' },
        { url: 'samples/drums/rockers/snare.wav', category: 'drums', name: 'rockers_snare', label: 'Rockers Snare', key: 'w' },
        { url: 'samples/drums/rockers/hihat-closed.wav', category: 'drums', name: 'rockers_hihat', label: 'Rockers Hi-Hat', key: 'e' },
        { url: 'samples/drums/rockers/hihat-open.wav', category: 'drums', name: 'rockers_open', label: 'Rockers Open', key: 'r' },
        
        // Drums - Steppers Pattern
        { url: 'samples/drums/steppers/kick.wav', category: 'drums', name: 'steppers_kick', label: 'Steppers Kick', key: 'a' },
        { url: 'samples/drums/steppers/snare.wav', category: 'drums', name: 'steppers_snare', label: 'Steppers Snare', key: 's' },
        { url: 'samples/drums/steppers/hihat-closed.wav', category: 'drums', name: 'steppers_hihat', label: 'Steppers Hi-Hat', key: 'd' },
        { url: 'samples/drums/steppers/hihat-open.wav', category: 'drums', name: 'steppers_open', label: 'Steppers Open', key: 'f' },
        
        // Percussion and Rim Shots
        { url: 'samples/drums/rim_shot/rim1.wav', category: 'drums', name: 'rim_shot1', label: 'Rim Shot 1', key: 'z' },
        { url: 'samples/drums/rim_shot/rim2.wav', category: 'drums', name: 'rim_shot2', label: 'Rim Shot 2', key: 'x' },
        { url: 'samples/drums/percussion/shaker.wav', category: 'drums', name: 'shaker', label: 'Shaker', key: 'c' },
        { url: 'samples/drums/percussion/cowbell.wav', category: 'drums', name: 'cowbell', label: 'Cowbell', key: 'v' }
    ];
    
    // App state
    let currentRecording = [];
    let isRecording = false;
    let isPlaying = false;
    let keyMap = {};
    
    /**
     * Initialize the application
     */
    async function init() {
        showLoading('Initializing audio engine...');
        
        // Initialize sound engine
        const engineInitialized = await soundEngine.init();
        if (!engineInitialized) {
            showError('Failed to initialize audio engine. Please check your browser compatibility.');
            return;
        }
        
        // Load and verify samples
        await loadSamples();
        
        // Create pads
        createPads();
        
        // Initialize beat patterns
        beatPatterns.init();
        
        // Set up event listeners
        setupEventListeners();
        
        // Set initial tempo
        const tempo = parseInt(tempoSlider.value);
        tempoValue.textContent = tempo;
        soundEngine.setTempo(tempo);
        beatPatterns.setTempo(tempo);
        
        // Hide loading overlay
        hideLoading();
    }
    
    /**
     * Load and verify audio samples
     */
    async function loadSamples() {
        showLoading('Loading and verifying audio samples...');
        
        try {
            // Use the AudioVerifier to load and verify samples
            const verifiedSamples = await audioVerifier.verifyFiles(sampleDefinitions, updateLoadingProgress);
            
            // Load verified samples into sound engine
            soundEngine.loadSamples(verifiedSamples);
            
            return true;
        } catch (error) {
            showError(`Failed to load samples: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Create pad elements
     */
    function createPads() {
        sampleDefinitions.forEach(sample => {
            // Create pad element
            const pad = document.createElement('div');
            pad.className = `pad ${sample.category}`;
            pad.dataset.category = sample.category;
            pad.dataset.name = sample.name;
            pad.dataset.key = sample.key;
            pad.textContent = `${sample.label} (${sample.key.toUpperCase()})`;
            
            // Add to key map
            keyMap[sample.key.toLowerCase()] = {
                element: pad,
                category: sample.category,
                name: sample.name
            };
            
            // Add event listeners
            pad.addEventListener('mousedown', () => triggerPad(pad, sample.category, sample.name));
            pad.addEventListener('touchstart', (e) => {
                e.preventDefault();
                triggerPad(pad, sample.category, sample.name);
            });
            
            // Add to container
            padContainer.appendChild(pad);
        });
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Control sliders
        tempoSlider.addEventListener('input', () => {
            const tempo = parseInt(tempoSlider.value);
            tempoValue.textContent = tempo;
            soundEngine.setTempo(tempo);
            beatPatterns.setTempo(tempo);
        });
        
        masterVolumeSlider.addEventListener('input', () => {
            const volume = parseInt(masterVolumeSlider.value) / 100;
            soundEngine.setMasterVolume(volume);
        });
        
        reverbSlider.addEventListener('input', () => {
            const reverbLevel = parseInt(reverbSlider.value) / 100;
            soundEngine.setReverbLevel(reverbLevel);
        });
        
        delaySlider.addEventListener('input', () => {
            const delayLevel = parseInt(delaySlider.value) / 100;
            soundEngine.setDelayLevel(delayLevel);
        });
        
        filterSlider.addEventListener('input', () => {
            const filterLevel = parseInt(filterSlider.value) / 100;
            soundEngine.setFilterCutoff(filterLevel);
        });
        
        // Transport controls
        recordBtn.addEventListener('click', toggleRecording);
        playBtn.addEventListener('click', playRecording);
        stopBtn.addEventListener('click', stopPlayback);
        saveBtn.addEventListener('click', saveRecording);
        
        // Pattern buttons
        document.getElementById('pattern-one-drop').addEventListener('click', () => playPattern('one_drop'));
        document.getElementById('pattern-rockers').addEventListener('click', () => playPattern('rockers'));
        document.getElementById('pattern-steppers').addEventListener('click', () => playPattern('steppers'));
        document.getElementById('pattern-dub').addEventListener('click', () => playPattern('dub'));
        document.getElementById('pattern-roots').addEventListener('click', () => playPattern('roots'));
        document.getElementById('pattern-stop').addEventListener('click', stopPattern);
    }
    
    /**
     * Handle keyboard down events
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyDown(e) {
        const key = e.key.toLowerCase();
        
        // Check if key is mapped to a pad
        if (keyMap[key] && !e.repeat) {
            const { element, category, name } = keyMap[key];
            triggerPad(element, category, name);
        }
    }
    
    /**
     * Handle keyboard up events
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyUp(e) {
        const key = e.key.toLowerCase();
        
        // Check if key is mapped to a pad
        if (keyMap[key]) {
            const { element } = keyMap[key];
            element.classList.remove('active');
        }
    }
    
    /**
     * Trigger a pad sound
     * @param {HTMLElement} padElement - Pad element
     * @param {string} category - Sample category
     * @param {string} name - Sample name
     */
    function triggerPad(padElement, category, name) {
        // Add active class
        padElement.classList.add('active');
        
        // Play the sample
        soundEngine.playSample(category, name);
        
        // Remove active class after a short delay
        setTimeout(() => {
            padElement.classList.remove('active');
        }, 200);
    }
    
    /**
     * Toggle recording state
     */
    function toggleRecording() {
        if (isRecording) {
            // Stop recording
            currentRecording = soundEngine.stopRecording();
            recordBtn.textContent = 'Record';
            recordBtn.classList.remove('active');
        } else {
            // Start recording
            soundEngine.startRecording();
            recordBtn.textContent = 'Stop Recording';
            recordBtn.classList.add('active');
            
            // Stop playback if it's active
            if (isPlaying) {
                stopPlayback();
            }
        }
        
        isRecording = !isRecording;
    }
    
    /**
     * Play back the current recording
     */
    function playRecording() {
        if (currentRecording.length === 0) {
            alert('No recording to play back.');
            return;
        }
        
        // Stop recording if active
        if (isRecording) {
            toggleRecording();
        }
        
        // Play the recording
        soundEngine.playRecording(currentRecording);
        isPlaying = true;
        
        // Update UI
        playBtn.classList.add('active');
        stopBtn.classList.remove('active');
    }
    
    /**
     * Stop playback
     */
    function stopPlayback() {
        soundEngine.stopPlayback();
        isPlaying = false;
        
        // Update UI
        playBtn.classList.remove('active');
        stopBtn.classList.add('active');
        
        // Reset after a short delay
        setTimeout(() => {
            stopBtn.classList.remove('active');
        }, 200);
    }
    
    /**
     * Save the current recording
     */
    function saveRecording() {
        if (currentRecording.length === 0) {
            alert('No recording to save.');
            return;
        }
        
        const name = prompt('Enter a name for this recording:');
        if (name) {
            const saved = soundEngine.saveRecording(name, currentRecording);
            if (saved) {
                alert(`Recording "${name}" saved successfully.`);
            } else {
                alert('Failed to save recording.');
            }
        }
    }
    
    /**
     * Show loading overlay with message
     * @param {string} message - Loading message
     */
    function showLoading(message) {
        loadingStatus.textContent = message;
        loadingProgress.style.width = '0%';
        loadingOverlay.style.display = 'flex';
    }
    
    /**
     * Update loading progress
     * @param {number} percent - Loading progress percentage
     */
    function updateLoadingProgress(percent) {
        loadingProgress.style.width = `${percent}%`;
        
        if (percent >= 100) {
            loadingStatus.textContent = 'Almost ready...';
        }
    }
    
    /**
     * Hide loading overlay
     */
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }
    
    /**
     * Play a pattern
     * @param {string} patternName - Name of the pattern to play
     */
    function playPattern(patternName) {
        // Stop any current recording or playback
        if (isRecording) {
            toggleRecording();
        }
        if (isPlaying) {
            stopPlayback();
        }
        
        // Stop any currently playing pattern
        stopPattern();
        
        // Play the new pattern
        beatPatterns.play(patternName);
        
        // Update UI
        const patternButtons = document.querySelectorAll('.pattern-btn');
        patternButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === `pattern-${patternName}`) {
                btn.classList.add('active');
            }
        });
    }
    
    /**
     * Stop the current pattern
     */
    function stopPattern() {
        beatPatterns.stop();
        
        // Update UI
        const patternButtons = document.querySelectorAll('.pattern-btn');
        patternButtons.forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    function showError(message) {
        audioVerifier.showError(message);
    }
    
    // Initialize the application
    init();
});
