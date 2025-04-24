/**
 * Audio File Verification System
 * Handles verification, validation and error handling for audio files
 */
class AudioVerifier {
    constructor() {
        this.audioContext = null;
        this.supportedFormats = ['mp3', 'wav', 'ogg'];
        this.fallbackSamples = {
            drums: 'samples/drums/fallback/fallback_drums.wav',
            bass: 'samples/bass/fallback_bass.mp3',
            guitar: 'samples/guitar/fallback_guitar.mp3',
            horns: 'samples/horns/fallback_horns.mp3',
            vocals: 'samples/vocals/fallback_vocals.mp3',
            percussion: 'samples/percussion/fallback_percussion.mp3',
            effects: 'samples/effects/fallback_effects.mp3'
        };
        this.errorOverlay = document.getElementById('error-overlay');
        this.errorMessage = document.getElementById('error-message');
        this.errorRetryBtn = document.getElementById('error-retry');
        this.errorContinueBtn = document.getElementById('error-continue');
        
        // Set up event listeners for error buttons
        this.errorRetryBtn.addEventListener('click', () => this.retryFailedFiles());
        this.errorContinueBtn.addEventListener('click', () => this.continueWithFallbacks());
        
        this.failedFiles = [];
        this.retryCallback = null;
        this.continueCallback = null;
    }
    
    /**
     * Initialize the audio context
     */
    initAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            return true;
        } catch (e) {
            this.showError('Your browser does not support the Web Audio API. Please try a different browser.');
            return false;
        }
    }
    
    /**
     * Verify a single audio file
     * @param {string} url - URL of the audio file
     * @param {string} category - Category of the sample (drums, bass, etc.)
     * @param {string} name - Name of the sample
     * @returns {Promise} - Promise that resolves with the decoded audio data or rejects with an error
     */
    async verifyFile(url, category, name) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to load audio file: ${url} (${response.status} ${response.statusText})`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            try {
                // Try to decode the audio data
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                
                // Additional validation
                if (audioBuffer.duration === 0) {
                    throw new Error('Audio file has zero duration');
                }
                
                return {
                    buffer: audioBuffer,
                    url,
                    category,
                    name
                };
            } catch (decodeError) {
                throw new Error(`Failed to decode audio file: ${url} - ${decodeError.message}`);
            }
        } catch (error) {
            // Add to failed files list
            this.failedFiles.push({
                url,
                category,
                name,
                error: error.message
            });
            
            // Return fallback if available
            if (this.fallbackSamples[category]) {
                console.warn(`Using fallback for ${url}: ${this.fallbackSamples[category]}`);
                return this.verifyFile(this.fallbackSamples[category], category, `fallback_${name}`);
            }
            
            throw error;
        }
    }
    
    /**
     * Batch verify multiple audio files
     * @param {Array} files - Array of file objects with url, category, and name
     * @param {Function} progressCallback - Callback for progress updates
     * @returns {Promise} - Promise that resolves with array of verified audio data
     */
    async verifyFiles(files, progressCallback) {
        if (!this.audioContext && !this.initAudioContext()) {
            return Promise.reject(new Error('Audio context initialization failed'));
        }
        
        this.failedFiles = [];
        let loadedFiles = [];
        let totalFiles = files.length;
        let loadedCount = 0;
        
        for (const file of files) {
            try {
                const audioData = await this.verifyFile(file.url, file.category, file.name);
                loadedFiles.push({
                    buffer: audioData.buffer,
                    url: file.url,
                    category: file.category,
                    name: file.name,
                    label: file.label,
                    key: file.key
                });
            } catch (error) {
                console.error(`Error loading ${file.url}:`, error);
                // Try to load fallback immediately
                if (this.fallbackSamples[file.category]) {
                    try {
                        console.log(`Using fallback for ${file.url}`);
                        const fallbackData = await this.verifyFile(
                            this.fallbackSamples[file.category], 
                            file.category, 
                            file.name
                        );
                        loadedFiles.push({
                            buffer: fallbackData.buffer,
                            url: this.fallbackSamples[file.category],
                            category: file.category,
                            name: file.name,
                            label: file.label + ' (Fallback)',
                            key: file.key
                        });
                    } catch (fallbackError) {
                        console.error(`Failed to load fallback for ${file.url}:`, fallbackError);
                    }
                }
            }
            
            loadedCount++;
            if (progressCallback) {
                progressCallback(loadedCount / totalFiles * 100);
            }
        }
        
        // If there are failed files, show the error overlay
        if (this.failedFiles.length > 0) {
            return new Promise((resolve, reject) => {
                this.retryCallback = () => {
                    this.verifyFiles(this.failedFiles, progressCallback)
                        .then(retryFiles => {
                            resolve([...loadedFiles, ...retryFiles]);
                        })
                        .catch(reject);
                };
                
                this.continueCallback = () => {
                    resolve(loadedFiles);
                };
                
                this.showFileErrors();
            });
        }
        
        return loadedFiles;
    }
    
    /**
     * Show error overlay with failed files information
     */
    showFileErrors() {
        const failedCount = this.failedFiles.length;
        this.errorMessage.innerHTML = `
            <p>${failedCount} audio file${failedCount > 1 ? 's' : ''} failed to load:</p>
            <ul>
                ${this.failedFiles.slice(0, 5).map(file => 
                    `<li>${file.name} (${file.category}): ${file.error || 'Unknown error'}</li>`
                ).join('')}
                ${failedCount > 5 ? `<li>...and ${failedCount - 5} more</li>` : ''}
            </ul>
            <p>You can retry loading these files or continue with fallbacks.</p>
        `;
        
        this.errorRetryBtn.style.display = 'inline-block';
        this.errorContinueBtn.textContent = 'Continue with Fallbacks';
        this.errorOverlay.classList.remove('hidden');
        this.errorOverlay.style.display = 'flex';
    }
    
    /**
     * Hide error overlay
     */
    hideError() {
        this.errorOverlay.classList.add('hidden');
        this.errorOverlay.style.display = 'none';
    }
    
    /**
     * Show a general error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.errorMessage.innerHTML = `<p>${message}</p>`;
        this.errorRetryBtn.style.display = 'none';
        this.errorContinueBtn.textContent = 'OK';
        this.errorOverlay.classList.remove('hidden');
        this.errorOverlay.style.display = 'flex';
    }
    
    /**
     * Retry loading failed files
     */
    retryFailedFiles() {
        this.hideError();
        if (this.retryCallback) {
            this.retryCallback();
        }
    }
    
    /**
     * Continue with successfully loaded files and fallbacks
     */
    continueWithFallbacks() {
        this.hideError();
        if (this.continueCallback) {
            this.continueCallback();
        }
    }
    
    /**
     * Check if a file format is supported
     * @param {string} url - URL of the audio file
     * @returns {boolean} - Whether the format is supported
     */
    isFormatSupported(url) {
        const extension = url.split('.').pop().toLowerCase();
        return this.supportedFormats.includes(extension);
    }
}

// Create global instance
const audioVerifier = new AudioVerifier();
