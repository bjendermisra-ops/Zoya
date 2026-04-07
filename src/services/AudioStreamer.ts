export class AudioStreamer {
  public audioContext: AudioContext;
  private mediaStream?: MediaStream;
  private sourceNode?: MediaStreamAudioSourceNode;
  private processorNode?: ScriptProcessorNode;
  private isRecording = false;
  
  private activeSources: AudioBufferSourceNode[] = [];
  private nextPlayTime = 0;

  public inputAnalyser?: AnalyserNode;
  public outputAnalyser: AnalyserNode;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
    this.outputAnalyser = this.audioContext.createAnalyser();
    this.outputAnalyser.fftSize = 256;
    this.outputAnalyser.connect(this.audioContext.destination);
  }

  async initialize(onAudioData: (base64: string) => void) {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true,
      }
    });

    const recordContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000,
    });

    this.inputAnalyser = recordContext.createAnalyser();
    this.inputAnalyser.fftSize = 256;

    this.sourceNode = recordContext.createMediaStreamSource(this.mediaStream);
    this.sourceNode.connect(this.inputAnalyser);
    
    this.processorNode = recordContext.createScriptProcessor(4096, 1, 1);
    
    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        let s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      const buffer = new Uint8Array(pcm16.buffer);
      let binary = '';
      for (let i = 0; i < buffer.byteLength; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      const base64 = btoa(binary);
      onAudioData(base64);
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(recordContext.destination);
  }

  startRecording() {
    this.isRecording = true;
  }

  stopRecording() {
    this.isRecording = false;
  }

  playAudio(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 0x8000;
    }
    
    const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputAnalyser);
    
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };
    this.activeSources.push(source);

    const currentTime = this.audioContext.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }
    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
  }

  stopPlayback() {
    this.activeSources.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    this.activeSources = [];
    this.nextPlayTime = this.audioContext.currentTime;
  }

  close() {
    this.stopRecording();
    this.stopPlayback();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
  }
}
