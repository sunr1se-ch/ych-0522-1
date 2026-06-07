import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateWav(durationMs, breathPoints) {
  const sampleRate = 44100;
  const totalSamples = Math.floor((durationMs / 1000) * sampleRate);
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const breathSet = new Set(breathPoints);

  for (let i = 0; i < totalSamples; i++) {
    const timeMs = (i / sampleRate) * 1000;
    let sample = 0;

    const freq = 440 + Math.sin(timeMs * 0.002) * 100;
    sample += Math.sin(2 * Math.PI * freq * (i / sampleRate)) * 0.15;

    sample += Math.sin(2 * Math.PI * (freq * 2) * (i / sampleRate)) * 0.05;

    for (const bp of breathPoints) {
      const dist = Math.abs(timeMs - bp);
      if (dist < 200) {
        const beepFreq = 880;
        const envelope = Math.exp(-dist * 0.01);
        sample += Math.sin(2 * Math.PI * beepFreq * (i / sampleRate)) * 0.3 * envelope;
      }
    }

    const beatMs = 500;
    const beatPhase = timeMs % beatMs;
    if (beatPhase < 50) {
      const envelope = Math.exp(-beatPhase * 0.05);
      sample += Math.sin(2 * Math.PI * 220 * (i / sampleRate)) * 0.1 * envelope;
    }

    sample = Math.max(-1, Math.min(1, sample));
    const intSample = Math.round(sample * 32767);
    const offset = 44 + i * blockAlign;
    buffer.writeInt16LE(intSample, offset);
    buffer.writeInt16LE(intSample, offset + 2);
  }

  return buffer;
}

const breathPoints = [
  2000, 4500, 7000,
  9500, 12000, 14500,
  17000, 19500, 22000,
  24500, 27000, 29500,
];
const duration = 32000;

console.log('正在生成示例音频...');
const wavBuffer = generateWav(duration, breathPoints);

const publicAudioDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(publicAudioDir)) {
  fs.mkdirSync(publicAudioDir, { recursive: true });
}

const outputPath = path.join(publicAudioDir, 'sample.wav');
fs.writeFileSync(outputPath, wavBuffer);
console.log(`示例音频已生成: ${outputPath}`);
console.log(`时长: ${duration / 1000}秒`);
console.log(`换气点数量: ${breathPoints.length}`);
