# Sample Files for Reggae Sound Pad

This directory contains the audio samples used by the Reggae Sound Pad application.

## Directory Structure

- `/drums` - Drum patterns (one drop, rockers, steppers, rim shots)
- `/bass` - Bass lines in different keys
- `/guitar` - Guitar skank and upstrokes
- `/horns` - Horn section hits and melodies
- `/vocals` - Vocal samples and dub effects
- `/percussion` - Additional percussion elements
- `/effects` - Sound effects and dub elements

## Sample Requirements

All audio samples should meet the following requirements:

1. Format: MP3, WAV, or OGG (browser-compatible)
2. Sample Rate: 44.1kHz recommended
3. Bit Depth: 16-bit or higher
4. Channels: Stereo preferred
5. Duration: Typically 1-4 seconds for one-shots, 1-8 bars for loops
6. Tempo: Aligned to common reggae tempos (60-90 BPM)

## Fallback Samples

Each category includes a fallback sample that will be used if the primary samples fail to load. These are:

- `drums/fallback_drums.mp3`
- `bass/fallback_bass.mp3`
- `guitar/fallback_guitar.mp3`
- `horns/fallback_horns.mp3`
- `vocals/fallback_vocals.mp3`
- `percussion/fallback_percussion.mp3`
- `effects/fallback_effects.mp3`

## Adding Your Own Samples

To add your own samples:

1. Place the audio files in the appropriate category folder
2. Update the sample definitions in `js/app.js`
3. Ensure your samples meet the format requirements above
4. Test thoroughly to ensure compatibility

## Sample Credits

When using third-party samples, ensure you have the appropriate rights and provide attribution as required.
