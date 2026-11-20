// Pembacaan teks dengan Web Speech API bawaan peramban (tanpa layanan luar).
export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function pickVoice(lang: 'id' | 'en'): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const prefix = lang === 'id' ? 'id' : 'en';
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix) && v.localService) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
  );
}

// Teks panjang dipecah per kalimat karena sebagian peramban menghentikan ucapan yang terlalu panjang.
function splitText(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const parts = clean.match(/[^.!?;:]+[.!?;:]*\s*/g) ?? [clean];
  const out: string[] = [];
  let buf = '';
  for (const p of parts) {
    if ((buf + p).length > 220 && buf) {
      out.push(buf.trim());
      buf = p;
    } else {
      buf += p;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export function stopSpeech() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export function speakText(text: string, lang: 'id' | 'en', rate = 1, onEnd?: () => void): void {
  if (!speechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const chunks = splitText(text);
  if (!chunks.length) {
    onEnd?.();
    return;
  }
  const voice = pickVoice(lang);
  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c);
    u.lang = lang === 'id' ? 'id-ID' : 'en-US';
    if (voice) u.voice = voice;
    u.rate = rate;
    if (i === chunks.length - 1) {
      u.onend = () => onEnd?.();
      u.onerror = () => onEnd?.();
    }
    synth.speak(u);
  });
}
