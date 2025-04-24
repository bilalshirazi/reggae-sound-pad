/**
 * Reggae Beat Patterns
 * Pre-programmed reggae drum patterns for the sound pad
 */
class BeatPatterns {
    constructor(soundEngine) {
        this.soundEngine = soundEngine;
        this.isPlaying = false;
        this.currentPattern = null;
        this.tempo = 80; // Default reggae tempo (BPM)
        this.intervalId = null;
        this.beatCount = 0;
        this.patternLength = 16; // 16th notes in a pattern (4 bars of 4/4)
    }

    /**
     * Initialize the patterns engine
     */
    init() {
        // Set initial tempo
        this.setTempo(this.tempo);
    }

    /**
     * Set tempo in BPM
     * @param {number} bpm - Tempo in beats per minute
     */
    setTempo(bpm) {
        this.tempo = bpm;
        // If currently playing, restart to apply new tempo
        if (this.isPlaying) {
            this.stop();
            this.play(this.currentPattern);
        }
    }

    /**
     * Calculate interval time in ms based on tempo
     * @returns {number} - Interval time in milliseconds
     */
    getIntervalTime() {
        // Convert BPM to milliseconds per 16th note
        // (60000 ms / BPM) / 4 = ms per 16th note
        return (60000 / this.tempo) / 4;
    }

    /**
     * Play a specific pattern
     * @param {string} patternName - Name of the pattern to play
     */
    play(patternName) {
        if (this.isPlaying) {
            this.stop();
        }

        this.currentPattern = patternName;
        this.isPlaying = true;
        this.beatCount = 0;

        // Get pattern definition
        const pattern = this.patterns[patternName];
        if (!pattern) {
            console.error(`Pattern "${patternName}" not found`);
            return;
        }

        // Start the pattern loop
        const intervalTime = this.getIntervalTime();
        this.intervalId = setInterval(() => {
            this.playBeat(pattern, this.beatCount);
            this.beatCount = (this.beatCount + 1) % this.patternLength;
        }, intervalTime);

        return true;
    }

    /**
     * Stop the current pattern
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isPlaying = false;
        this.currentPattern = null;
        this.beatCount = 0;
    }

    /**
     * Play a single beat from a pattern
     * @param {Object} pattern - Pattern definition
     * @param {number} beatIndex - Current beat index (0-15)
     */
    playBeat(pattern, beatIndex) {
        // Play each instrument if it has a hit on this beat
        Object.keys(pattern).forEach(instrument => {
            if (pattern[instrument][beatIndex]) {
                // Extract category and name from instrument string (e.g., "drums.one_drop_kick")
                const [category, name] = instrument.split('.');
                this.soundEngine.playSample(category, name);
            }
        });
    }

    /**
     * Get all available pattern names
     * @returns {Array} - Array of pattern names
     */
    getPatternNames() {
        return Object.keys(this.patterns);
    }

    /**
     * Pattern definitions
     * Each pattern is an object with instruments as keys
     * Each instrument has an array of 16 values (0 or 1) representing 16th notes
     * 1 = play, 0 = don't play
     */
    patterns = {
        // Classic One Drop pattern
        "one_drop": {
            "drums.one_drop_kick":  [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], // Kick on beat 3
            "drums.one_drop_snare": [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], // Snare on beats 2 and 4
            "drums.one_drop_hihat": [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], // Closed hi-hat on downbeats
            "drums.one_drop_open":  [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,0]  // Open hi-hat on upbeats 2 and 4
        },
        
        // Rockers pattern
        "rockers": {
            "drums.rockers_kick":   [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], // Kick on beats 1 and 3
            "drums.rockers_snare":  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], // Snare on beats 2 and 4
            "drums.rockers_hihat":  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], // Closed hi-hat on downbeats
            "drums.rockers_open":   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1]  // Open hi-hat on upbeats
        },
        
        // Steppers pattern
        "steppers": {
            "drums.steppers_kick":  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], // Kick on every beat
            "drums.steppers_snare": [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], // Snare on beats 2 and 4
            "drums.steppers_hihat": [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], // Closed hi-hat on every 16th
            "drums.steppers_open":  [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,0]  // Open hi-hat accents
        },
        
        // Dub pattern
        "dub": {
            "drums.steppers_kick":  [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0], // Sparse kick pattern
            "drums.one_drop_snare": [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1], // Snare with fill
            "drums.rim_shot1":      [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], // Rim accents
            "drums.shaker":         [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1]  // Shaker on upbeats
        },
        
        // Roots pattern
        "roots": {
            "drums.one_drop_kick":  [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], // One drop kick
            "drums.rockers_snare":  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], // Snare on 2 and 4
            "drums.one_drop_hihat": [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], // Closed hi-hat
            "drums.cowbell":        [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0]  // Cowbell accents
        }
    };
}

// Create global instance
const beatPatterns = new BeatPatterns(soundEngine);
