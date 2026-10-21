/**
 * =============================================================================
 * SYNTHETIC AUDIO GENERATOR FOR E2E TESTING (OPAQUE-BOX QUALITY GATES)
 * File: tests/e2e/utils/audio-generator.mjs
 *
 * Provides deterministic 16-bit PCM WAV buffers to test:
 * - Silence Quality Gate (RMS < 0.006)
 * - Clipping Quality Gate (>2% clipped samples)
 * - Duration Quality Gate (<0.35s)
 * - Background Noise Quality Gate (High Zero-Crossing Rate > 0.25 & low SNR)
 * - Standard Valid Speech Audio
 * =============================================================================
 */

/**
 * Creates a standard 44-byte RIFF WAV header for 16-bit mono PCM.
 * @param {number} sampleRate 
 * @param {number} numSamples 
 * @returns {Buffer}
 */
export function createWavHeader(sampleRate, numSamples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return header;
}

/**
 * Generates a WAV Buffer based on specified quality condition.
 *
 * @param {Object} options
 * @param {string} options.type - 'silence' | 'tone' | 'noise' | 'clipping' | 'short' | 'speech'
 * @param {number} [options.durationSec=1.0] - duration in seconds
 * @param {number} [options.sampleRate=44100] - sample rate (Hz)
 * @param {number} [options.frequency=440] - frequency for tone (Hz)
 * @param {number} [options.clippingRatio=0.08] - fraction of clipped samples for 'clipping' type
 * @returns {Buffer} complete WAV binary buffer
 */
export function generateSyntheticWav({
  type = 'speech',
  durationSec = 1.0,
  sampleRate = 44100,
  frequency = 440,
  clippingRatio = 0.08
} = {}) {
  const duration = type === 'short' ? 0.20 : durationSec;
  const numSamples = Math.floor(sampleRate * duration);
  const dataBuffer = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    switch (type) {
      case 'silence': {
        sample = 0;
        break;
      }

      case 'tone': {
        const amp = 0.5;
        sample = Math.sin(2 * Math.PI * frequency * t) * amp * 32767;
        break;
      }

      case 'noise': {
        const rand = (Math.random() * 2 - 1);
        sample = rand * 0.5 * 32767;
        break;
      }

      case 'clipping': {
        const isClipped = Math.random() < clippingRatio;
        if (isClipped) {
          sample = Math.random() > 0.5 ? 32767 : -32768;
        } else {
          sample = Math.sin(2 * Math.PI * 300 * t) * 0.9 * 32767;
        }
        break;
      }

      case 'short': {
        sample = Math.sin(2 * Math.PI * 350 * t) * 0.6 * 32767;
        break;
      }

      case 'speech':
      default: {
        const envelope = Math.sin(Math.PI * (i / numSamples));
        const f0 = Math.sin(2 * Math.PI * 180 * t);
        const f1 = 0.4 * Math.sin(2 * Math.PI * 600 * t);
        const f2 = 0.2 * Math.sin(2 * Math.PI * 1200 * t);
        const composite = (f0 + f1 + f2) * 0.5;
        sample = composite * envelope * 0.7 * 32767;
        break;
      }
    }

    sample = Math.max(-32768, Math.min(32767, Math.round(sample)));
    dataBuffer.writeInt16LE(sample, i * 2);
  }

  const header = createWavHeader(sampleRate, numSamples);
  return Buffer.concat([header, dataBuffer]);
}

/**
 * Computes observable physical audio metrics from a 16-bit mono WAV buffer.
 * Used for independent test assertions on audio quality.
 *
 * @param {Buffer} wavBuffer 
 * @returns {{
 *   durationSec: number,
 *   numSamples: number,
 *   sampleRate: number,
 *   rms: number,
 *   peakAmplitude: number,
 *   clippingRatio: number,
 *   zeroCrossingRate: number,
 *   isSilence: boolean,
 *   isTooShort: boolean,
 *   isClipped: boolean,
 *   isNoise: boolean
 * }}
 */
export function computeAudioMetrics(wavBuffer) {
  if (wavBuffer.length < 44) {
    throw new Error('Invalid WAV buffer: size smaller than 44-byte header');
  }

  const sampleRate = wavBuffer.readUInt32LE(24);
  const dataSize = wavBuffer.readUInt32LE(40);
  const numSamples = dataSize / 2;
  const durationSec = numSamples / sampleRate;

  let sumSquares = 0;
  let peak = 0;
  let clippedCount = 0;
  let zeroCrossings = 0;
  let prevSign = 0;

  for (let i = 0; i < numSamples; i++) {
    const offset = 44 + i * 2;
    if (offset + 1 >= wavBuffer.length) break;
    const sample = wavBuffer.readInt16LE(offset);
    const normalized = Math.abs(sample) / 32768;

    sumSquares += normalized * normalized;
    if (normalized > peak) {
      peak = normalized;
    }
    if (Math.abs(sample) >= 32760) {
      clippedCount++;
    }

    const sign = sample >= 0 ? 1 : -1;
    if (i > 0 && sign !== prevSign) {
      zeroCrossings++;
    }
    prevSign = sign;
  }

  const rms = Math.sqrt(sumSquares / numSamples);
  const clippingRatio = clippedCount / numSamples;
  const zeroCrossingRate = zeroCrossings / numSamples;

  const isSilence = rms < 0.006;
  const isTooShort = durationSec < 0.35;
  const isClipped = clippingRatio > 0.02;
  // White noise has extremely high zero crossing rate (> 0.25) and significant RMS (> 0.05)
  const isNoise = !isSilence && !isTooShort && !isClipped && zeroCrossingRate > 0.25 && rms > 0.05;

  return {
    durationSec,
    numSamples,
    sampleRate,
    rms,
    peakAmplitude: peak,
    clippingRatio,
    zeroCrossingRate,
    isSilence,
    isTooShort,
    isClipped,
    isNoise
  };
}
