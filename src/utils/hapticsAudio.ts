// Haptic Web Audio API and Device Vibration Synthesizer for NFC simulation

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Triggers physical haptic vibration if the browser/device supports navigator.vibrate
 */
export function triggerHaptic(pattern: number | number[] = [30, 40, 50]): void {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }
}

/**
 * Plays a subtle, gentle tick/tone when approaching the NFC field
 */
export function playNfcApproachSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Soft high-frequency electromagnetic approach tick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // Graceful fallback
  }
}

/**
 * Plays an authentic, crisp, haptic-like dual-tone NFC success detection sound.
 * Combines a subtle low-frequency tactile thump (sub-bass haptic feel) with an Apple/Android-style chime.
 */
export function playNfcSuccessSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Tactile Sub-Bass Thump (Simulates physical haptic punch)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(85, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.09);

    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.14);

    // 2. High-Chime Harmonic 1 (Primary Tone ~ 880Hz / A5)
    const tone1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    tone1.type = 'sine';
    tone1.frequency.setValueAtTime(880, now);
    tone1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08); // High C6 ramp

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    tone1.connect(gain1);
    gain1.connect(ctx.destination);

    tone1.start(now);
    tone1.stop(now + 0.3);

    // 3. High-Chime Harmonic 2 (Bright Shimmer ~ 1760Hz / A6)
    const tone2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    tone2.type = 'sine';
    tone2.frequency.setValueAtTime(1318.5, now + 0.04); // E6
    tone2.frequency.exponentialRampToValueAtTime(1760, now + 0.12); // A6

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.001, now + 0.04);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    tone2.connect(gain2);
    gain2.connect(ctx.destination);

    tone2.start(now + 0.04);
    tone2.stop(now + 0.38);

  } catch {
    // Graceful fallback
  }
}
