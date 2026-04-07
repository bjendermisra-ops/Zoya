import React, { useEffect, useRef } from 'react';
import { LiveSession } from '../services/LiveSession';

interface Props {
  session: LiveSession | null;
  state: 'idle' | 'connecting' | 'listening' | 'speaking';
}

export function VoiceVisualizer({ session, state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const dataArray = new Uint8Array(128);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (state === 'idle' || state === 'connecting' || !session) {
        // Draw a simple calm circle
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 50, 0, 2 * Math.PI);
        ctx.fillStyle = state === 'connecting' ? 'rgba(251, 146, 60, 0.5)' : 'rgba(251, 146, 60, 0.1)';
        ctx.fill();
        return;
      }

      // @ts-ignore
      const streamer = session.audioStreamer;
      if (!streamer) return;

      const analyser = state === 'speaking' ? streamer.outputAnalyser : streamer.inputAnalyser;
      if (!analyser) return;

      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      // Draw pulsing circle based on volume
      const radius = 50 + (average / 255) * 50;
      
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
      
      const gradient = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, radius);
      gradient.addColorStop(0, 'rgba(251, 146, 60, 0.8)'); // Orange-400
      gradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Inner solid circle
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 50, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(251, 146, 60, 1)';
      ctx.fill();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [session, state]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={300} 
      className="max-w-full"
    />
  );
}
