
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

// Helper functions for audio processing as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveBarista: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState<'Idle' | 'Listening' | 'Speaking'>('Idle');
  
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.debug('Live Session Opened');
            setStatus('Listening');
            
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + ' ' + message.serverContent.outputTranscription.text);
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setStatus('Speaking');
              const outCtx = audioContextOutRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('Listening');
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current) s.stop();
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Live Error:', e),
          onclose: () => {
            console.debug('Live Session Closed');
            setIsActive(false);
            setStatus('Idle');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: "You are the Aura Brew AI Barista. Help the user order coffee via voice. Be energetic, concise, and helpful. Use a friendly coffee shop persona.",
          outputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
      setIsActive(true);
    } catch (err) {
      console.error('Failed to start live session:', err);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
    setStatus('Idle');
  };

  return (
    <div className="bg-stone-900 text-white rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl overflow-hidden relative border border-white/10">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-amber-500 animate-pulse scale-110 shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 'bg-stone-800'}`}>
        <i className={`fa-solid ${isActive ? 'fa-microphone' : 'fa-microphone-slash'} text-3xl`}></i>
      </div>
      
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Voice Barista</h2>
        <p className="text-stone-400 text-sm max-w-xs">
          {isActive ? 'Connected & listening... Tell me what you crave.' : 'Click to start a live conversation with our AI barista.'}
        </p>
      </div>

      {isActive ? (
        <div className="w-full">
           <div className="bg-stone-800/50 rounded-xl p-4 mb-4 min-h-[60px] max-h-[120px] overflow-y-auto text-sm text-amber-100 italic border border-white/5">
            {transcription || "Listening for your order..."}
          </div>
          <button 
            onClick={stopSession}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-2xl font-bold transition-all border border-red-500/20"
          >
            End Conversation
          </button>
        </div>
      ) : (
        <button 
          onClick={startSession}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
        >
          Wake Up Barista
        </button>
      )}

      {status !== 'Idle' && (
        <div className="flex gap-1 absolute top-4 right-4">
          <div className={`w-2 h-2 rounded-full ${status === 'Listening' ? 'bg-green-500' : 'bg-amber-500'} animate-bounce`}></div>
          <span className="text-[10px] uppercase font-bold text-stone-500">{status}</span>
        </div>
      )}
    </div>
  );
};

export default LiveBarista;
