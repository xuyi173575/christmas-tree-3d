import * as Tone from 'tone';

export class AudioManager {
    private isMuted: boolean = false;

    constructor() {
        Tone.Destination.volume.value = -10; // Default slightly lower
    }

    public async start() {
        await Tone.start();
    }

    public playTransition(type: "TREE" | "HEART" | "SCATTERED") {
        if (this.isMuted) return;
        
        try {
            if (type === "TREE") {
                // Magical chime
                const synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 1 }
                }).toDestination();
                
                const now = Tone.now();
                synth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "8n", now);
                synth.triggerAttackRelease(["D5", "F#5", "A5", "D6"], "8n", now + 0.1);
                synth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "2n", now + 0.2);
            } else if (type === "HEART") {
                // Warm chord
                const synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 2 }
                }).toDestination();
                
                const now = Tone.now();
                synth.triggerAttackRelease(["F4", "A4", "C5", "E5"], "1n", now);
            } else {
                // Scattered - Wind/Whoosh
                 const noise = new Tone.NoiseSynth({
                     noise: { type: "pink" },
                     envelope: { attack: 0.1, decay: 0.5, sustain: 0 }
                 }).toDestination();
                 noise.triggerAttackRelease("4n");
            }
        } catch (e) {
            console.error("Audio playback error", e);
        }
    }

    public setVolume(val: number) {
        // val 0 to 100
        // Map 0-100 to -60dB to 0dB
        const normalized = Math.max(0, Math.min(1, val / 100));
        if (normalized === 0) {
            this.isMuted = true;
            Tone.Destination.mute = true;
        } else {
            this.isMuted = false;
            Tone.Destination.mute = false;
            // Linear to Logarithmic roughly
            const db = 20 * Math.log10(normalized);
            Tone.Destination.volume.rampTo(db, 0.1);
        }
    }
}
