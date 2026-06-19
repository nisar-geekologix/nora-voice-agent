// G.711 mu-law and PCM audio transcoding utilities

/**
 * Decodes a Uint8Array of G.711 mu-law bytes into a 16-bit signed integer PCM Int16Array (8kHz).
 */
export function mulawToPcm(mulaw: Uint8Array): Int16Array {
  const pcm = new Int16Array(mulaw.length);
  for (let i = 0; i < mulaw.length; i++) {
    const u = mulaw[i] ^ 0xFF; // Invert all bits
    const sign = u & 0x80;
    const exponent = (u >> 4) & 0x07;
    const mantissa = u & 0x0F;
    let sample = (mantissa << 3) + 33;
    sample <<= exponent;
    sample -= 33;
    pcm[i] = sign ? -sample : sample;
  }
  return pcm;
}

/**
 * Encodes an Int16Array of 16-bit PCM samples (8kHz) into a Uint8Array of G.711 mu-law bytes.
 */
export function pcmToMulaw(pcm: Int16Array): Uint8Array {
  const mulaw = new Uint8Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    let sample = pcm[i];
    const sign = (sample < 0) ? 0x80 : 0x00;
    if (sample < 0) {
      sample = -sample;
    }
    
    // clip sample to max positive 16-bit PCM value allowed by mu-law
    if (sample > 32635) {
      sample = 32635;
    }
    
    sample += 132;
    let exponent = 7;
    if (sample <= 260) exponent = 0;
    else if (sample <= 516) exponent = 1;
    else if (sample <= 1028) exponent = 2;
    else if (sample <= 2052) exponent = 3;
    else if (sample <= 4100) exponent = 4;
    else if (sample <= 8196) exponent = 5;
    else if (sample <= 16388) exponent = 6;
    
    const mantissa = (sample >> (exponent + 3)) & 0x0F;
    const u = ~(sign | (exponent << 4) | mantissa) & 0xFF;
    mulaw[i] = u;
  }
  return mulaw;
}

/**
 * Upsamples an Int16Array from 8000Hz to 16000Hz using linear interpolation.
 */
export function resample8To16(pcm8: Int16Array): Int16Array {
  const pcm16 = new Int16Array(pcm8.length * 2);
  for (let i = 0; i < pcm8.length; i++) {
    const current = pcm8[i];
    const next = (i + 1 < pcm8.length) ? pcm8[i + 1] : current;
    pcm16[i * 2] = current;
    pcm16[i * 2 + 1] = Math.round((current + next) / 2);
  }
  return pcm16;
}

/**
 * Downsamples an Int16Array from 24000Hz to 8000Hz by decimation (taking every 3rd sample).
 */
export function resample24To8(pcm24: Int16Array): Int16Array {
  const pcm8 = new Int16Array(Math.floor(pcm24.length / 3));
  for (let i = 0; i < pcm8.length; i++) {
    pcm8[i] = pcm24[i * 3];
  }
  return pcm8;
}

/**
 * Helper to convert a Base64 string to a Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const buf = Buffer.from(base64, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
}

/**
 * Helper to convert a Uint8Array to a Base64 string.
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
  return Buffer.from(array.buffer, array.byteOffset, array.byteLength).toString("base64");
}

/**
 * Helper to convert a Base64 16-bit PCM little-endian buffer string to an Int16Array.
 */
export function base64ToInt16Array(base64: string): Int16Array {
  const buf = Buffer.from(base64, "base64");
  // Check that byte length is even for 16-bit values
  const length = Math.floor(buf.length / 2);
  const pcm = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    pcm[i] = buf.readInt16LE(i * 2);
  }
  return pcm;
}

/**
 * Helper to convert an Int16Array of PCM samples to a base64 string.
 */
export function int16ArrayToBase64(pcm: Int16Array): string {
  const buf = Buffer.alloc(pcm.length * 2);
  for (let i = 0; i < pcm.length; i++) {
    buf.writeInt16LE(pcm[i], i * 2);
  }
  return buf.toString("base64");
}
