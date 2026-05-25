import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Radio, Disc } from 'lucide-react';

const TRACKS = [
  {
    id: 0,
    title: 'Neon Sunset Cruise',
    artist: 'Vektroid Sunset',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '6:12',
    color: '#ff007f'
  },
  {
    id: 1,
    title: 'Vapor Dreamscape',
    artist: 'Outrun Dynamics',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: '5:44',
    color: '#b026ff'
  },
  {
    id: 2,
    title: 'Hyperdrive Drift',
    artist: 'Laserhawk 198X',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: '5:18',
    color: '#00f0ff'
  }
];

export default function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSynthMode, setIsSynthMode] = useState(false);
  const [ledLevels, setLedLevels] = useState([10, 20, 10, 15, 30, 40, 20]);

  const audioRef = useRef(null);
  const synthIntervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  const activeTrack = TRACKS[currentTrackIndex];

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(activeTrack.url);
    audioRef.current.volume = volume;
    audioRef.current.loop = true;

    const onTimeUpdate = () => {
      setCurrentTime(audioRef.current.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audioRef.current.duration || 300);
    };

    audioRef.current.addEventListener('timeupdate', onTimeUpdate);
    audioRef.current.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
      }
      stopProceduralSynth();
    };
  }, []);

  // Update track when index changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    const wasPlaying = isPlaying;
    audioRef.current.pause();
    
    // Create new audio element to swap track without browser caching bugs
    audioRef.current.src = activeTrack.url;
    audioRef.current.volume = isMuted ? 0 : volume;
    
    if (wasPlaying && !isSynthMode) {
      audioRef.current.play().catch(err => console.log('Audio playback error:', err));
    }
  }, [currentTrackIndex]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // LED Level animation loop when playing
  useEffect(() => {
    let animId;
    const animateLED = () => {
      if (isPlaying) {
        setLedLevels(prev => prev.map(() => Math.floor(Math.random() * 85) + 15));
      } else {
        setLedLevels([5, 5, 5, 5, 5, 5, 5]);
      }
      animId = setTimeout(animateLED, 100);
    };
    animateLED();
    return () => clearTimeout(animId);
  }, [isPlaying]);

  // Play/Pause Action
  const togglePlay = () => {
    if (isPlaying) {
      if (isSynthMode) {
        stopProceduralSynth();
      } else {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (isSynthMode) {
        startProceduralSynth();
      } else {
        audioRef.current.play().catch(err => {
          console.log('Audio autoplay prevented, starting procedural synth mode instead!');
          toggleSynthMode();
        });
      }
    }
  };

  // Next Track
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  // Prev Track
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  // Toggle procedural chiptune synthwave generator!
  const toggleSynthMode = () => {
    const nextMode = !isSynthMode;
    setIsSynthMode(nextMode);

    if (isPlaying) {
      if (nextMode) {
        audioRef.current.pause();
        startProceduralSynth();
      } else {
        stopProceduralSynth();
        audioRef.current.play().catch(err => console.log(err));
      }
    }
  };

  // WEB AUDIO PROCEDURAL SYNTHESIZER
  const startProceduralSynth = () => {
    stopProceduralSynth();
    
    // Set up Web Audio context
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Melodic notes sequence (Pentatonic Minor Scale in F# / Retro Outrun vibe)
    const baseFreqs = [185.00, 220.00, 246.94, 277.18, 329.63, 369.99]; // F#3, A3, B3, C#4, E4, F#4
    const bassFreqs = [92.50, 110.00, 123.47, 138.59]; // F#2, A2, B2, C#2
    let step = 0;

    const playStep = () => {
      const time = ctx.currentTime;
      
      // BASSLINE (Retro 8th note arpeggiator)
      if (step % 2 === 0) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sawtooth';
        
        // simple chord progression base
        const progressionIdx = Math.floor(step / 8) % bassFreqs.length;
        bassOsc.frequency.setValueAtTime(bassFreqs[progressionIdx], time);
        
        // lowpass filter for sub bass
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, time);

        bassGain.gain.setValueAtTime(0.12 * volume, time);
        bassGain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(ctx.destination);
        
        bassOsc.start(time);
        bassOsc.stop(time + 0.28);
      }

      // CHIPTUNE LEAD ARPEGGIATOR (Fast 80s synthesizer theme)
      if (step % 4 === 1 || step % 4 === 3 || Math.random() > 0.6) {
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = 'triangle'; // classic retro chiptune sound

        const noteIndex = (step * 3) % baseFreqs.length;
        leadOsc.frequency.setValueAtTime(baseFreqs[noteIndex], time);

        // Add a bit of glide/vibrato
        leadOsc.frequency.setValueAtTime(baseFreqs[noteIndex] + 5, time + 0.05);

        leadGain.gain.setValueAtTime(0.08 * volume, time);
        leadGain.gain.exponentialRampToValueAtTime(0.005, time + 0.15);

        leadOsc.connect(leadGain);
        leadGain.connect(ctx.destination);

        leadOsc.start(time);
        leadOsc.stop(time + 0.18);
      }

      // NOISE DRUM GENERATOR (Retro hi-hat/snare)
      if (step % 4 === 2) {
        // Snare synthesis using a triangle pop
        const snareOsc = ctx.createOscillator();
        const snareGain = ctx.createGain();
        snareOsc.type = 'sine';
        snareOsc.frequency.setValueAtTime(150, time);
        snareOsc.frequency.exponentialRampToValueAtTime(80, time + 0.1);

        snareGain.gain.setValueAtTime(0.15 * volume, time);
        snareGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

        snareOsc.connect(snareGain);
        snareGain.connect(ctx.destination);

        snareOsc.start(time);
        snareOsc.stop(time + 0.15);
      }

      step = (step + 1) % 32;
      setCurrentTime(prev => {
        const nextTime = prev + 0.15;
        if (nextTime > 60) return 0; // wrap procedural playtime
        return nextTime;
      });
      setDuration(60);
    };

    // run loop at 150 BPM (100ms per 16th note, 150ms per 8th note)
    synthIntervalRef.current = setInterval(playStep, 150);
  };

  const stopProceduralSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // Helper for progress slider drag
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (!isSynthMode && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Formats time strings
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col gap-5 p-5 bg-vapor-deep border-2 border-vapor-neonPurple rounded-lg shadow-lg hover:shadow-vapor-glowPink select-none crt-flicker">
      
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-vapor-neonPurple/30 pb-2">
        <div className="flex items-center gap-2">
          <Music className="text-vapor-pink animate-pulse" size={16} />
          <span className="font-arcade text-[10px] tracking-wide text-vapor-pink glow-text-pink">SYNTH_PLAYER.SYS</span>
        </div>
        <button
          onClick={toggleSynthMode}
          className={`px-3 py-1 border font-arcade text-[8px] rounded select-none cursor-pointer duration-200 flex items-center gap-1.5 ${
            isSynthMode 
              ? 'bg-vapor-neonBlue border-vapor-neonBlue text-vapor-dark shadow-[0_0_8px_#00f0ff]' 
              : 'border-vapor-neonPurple text-vapor-neonPurple hover:bg-vapor-neonPurple/20'
          }`}
          title="Procedural Retro Synth Chiptunes generated entirely offline via Web Audio oscillators!"
        >
          <Radio size={10} className={isSynthMode ? 'animate-spin' : ''} />
          {isSynthMode ? 'CHIPTUNE: ON' : 'SYNTH MODE'}
        </button>
      </div>

      {/* CASSETTE DECK CSS RETRO WRAPPER */}
      <div className="relative w-full aspect-[1.6/1] bg-vapor-dark border-4 border-vapor-purple rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between z-10">
        
        {/* Cassette cassette details lines */}
        <div className="absolute inset-0 border border-vapor-pink/20 rounded-lg pointer-events-none margin-[3px]"></div>
        
        {/* Cassette label area */}
        <div className="relative bg-gradient-to-r from-vapor-purple to-vapor-dark border-2 border-vapor-pink rounded p-2.5 flex items-center justify-between shadow-inner">
          <div className="flex flex-col gap-0.5">
            <span className="font-arcade text-[7px] text-vapor-pink/80 select-none">STEREO RETRO MIX VOL. 1</span>
            <span className="font-orbitron font-extrabold text-sm text-vapor-neonBlue glow-text-cyan tracking-wide max-w-[170px] truncate">
              {isSynthMode ? 'PROCEDURAL_SYNTH_WAVE.PRG' : activeTrack.title}
            </span>
            <span className="font-orbitron font-semibold text-[9px] text-vapor-neonPurple/85 uppercase">
              {isSynthMode ? 'COGNITIVE OSCILLATORS' : activeTrack.artist}
            </span>
          </div>

          <div className="flex items-center bg-black/60 border border-vapor-pink/30 px-2 py-1 rounded text-[10px] font-arcade text-vapor-pink">
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Cassette Reels Windows with wheels inside */}
        <div className="relative flex justify-center gap-16 my-1 select-none">
          {/* Reel 1 (Left) */}
          <div className="relative w-16 h-16 rounded-full border-4 border-vapor-purple bg-vapor-dark flex items-center justify-center shadow-inner overflow-hidden select-none">
            {/* Spinning inner spokes */}
            <div 
              className={`absolute inset-0 border-4 border-vapor-pink border-dashed rounded-full duration-1000 ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
              style={{
                borderWidth: '5px',
                animationPlayState: isPlaying ? 'running' : 'paused'
              }}
            ></div>
            <div className="w-6 h-6 rounded-full bg-vapor-deep border-2 border-vapor-purple z-10"></div>
          </div>

          {/* Reel 2 (Right) */}
          <div className="relative w-16 h-16 rounded-full border-4 border-vapor-purple bg-vapor-dark flex items-center justify-center shadow-inner overflow-hidden select-none">
            {/* Spinning inner spokes */}
            <div 
              className={`absolute inset-0 border-4 border-vapor-pink border-dashed rounded-full duration-1000 ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
              style={{
                borderWidth: '5px',
                animationPlayState: isPlaying ? 'running' : 'paused'
              }}
            ></div>
            <div className="w-6 h-6 rounded-full bg-vapor-deep border-2 border-vapor-purple z-10"></div>
          </div>

          {/* Center Cassette tape viewer window overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-6 bg-black/40 border border-vapor-pink/30 rounded flex justify-between px-3 items-center z-20 pointer-events-none select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-vapor-neonPurple opacity-30 animate-pulse"></span>
            <span className="font-arcade text-[6px] text-vapor-pink/40">TAPE PLAY</span>
            <span className="w-2.5 h-2.5 rounded-full bg-vapor-pink opacity-30 animate-pulse"></span>
          </div>
        </div>

        {/* LED audio level bounce visualizer bar */}
        <div className="flex justify-between items-center gap-1 bg-black/60 border border-vapor-neonPurple/30 rounded px-3 py-1.5 h-6 select-none">
          <span className="font-arcade text-[6px] text-vapor-neonBlue/80 mr-1.5 uppercase select-none">LED LEVEL</span>
          <div className="flex-1 flex gap-1 h-full items-center">
            {ledLevels.map((lvl, i) => (
              <div key={i} className="flex-1 bg-vapor-purple h-full rounded-sm overflow-hidden flex flex-col justify-end">
                <div 
                  className={`w-full transition-all duration-100 ${
                    i < 3 ? 'bg-vapor-neonBlue' : i < 5 ? 'bg-vapor-neonPurple' : 'bg-vapor-pink'
                  }`}
                  style={{ height: `${lvl}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TIMELINE PROGRESS CONTROLS */}
      <div className="flex flex-col gap-1 w-full mt-1">
        <div className="flex justify-between text-[9px] font-arcade text-vapor-neonPurple/70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleProgressChange}
          className="w-full h-1 bg-vapor-purple rounded-lg appearance-none cursor-pointer accent-vapor-pink"
        />
      </div>

      {/* CORE BUTTON CONTROL DECKS */}
      <div className="flex flex-col gap-4">
        {/* Playback Button bar */}
        <div className="flex justify-between gap-2.5">
          <button
            onClick={prevTrack}
            disabled={isSynthMode}
            className="flex-1 py-2.5 border border-vapor-pink/40 bg-vapor-dark rounded hover:bg-vapor-pink/15 duration-200 flex items-center justify-center text-vapor-pink disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          >
            <SkipBack size={14} />
          </button>
          
          <button
            onClick={togglePlay}
            className="flex-[2.5] py-2.5 bg-gradient-to-r from-vapor-pink to-vapor-magenta hover:from-vapor-magenta hover:to-vapor-pink text-white rounded font-arcade text-xs select-none duration-200 flex items-center justify-center gap-2 shadow-lg shadow-vapor-glowPink hover:scale-[1.02] cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause size={12} className="fill-white" />
                PAUSE_MIX()
              </>
            ) : (
              <>
                <Play size={12} className="fill-white" />
                PLAY_MIX()
              </>
            )}
          </button>

          <button
            onClick={nextTrack}
            disabled={isSynthMode}
            className="flex-1 py-2.5 border border-vapor-pink/40 bg-vapor-dark rounded hover:bg-vapor-pink/15 duration-200 flex items-center justify-center text-vapor-pink disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          >
            <SkipForward size={14} />
          </button>
        </div>

        {/* Volume & Mixer dials */}
        <div className="flex items-center gap-3 bg-vapor-dark/40 border border-vapor-neonPurple/30 rounded p-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-vapor-neonBlue p-1 cursor-pointer"
          >
            {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="flex-1 h-1 bg-vapor-purple rounded-lg appearance-none cursor-pointer accent-vapor-neonBlue"
          />
        </div>

        {/* TRACK LISTING TAB */}
        <div className="bg-vapor-dark/80 border border-vapor-neonPurple/40 rounded p-2.5 flex flex-col gap-1.5 select-none">
          <span className="font-arcade text-[8px] text-vapor-neonBlue/80 mb-1 border-b border-vapor-neonPurple/20 pb-1 select-none">MIX_PLAYLIST:</span>
          {TRACKS.map((track) => (
            <button
              key={track.id}
              disabled={isSynthMode}
              onClick={() => {
                setCurrentTrackIndex(track.id);
                if (!isPlaying) togglePlay();
              }}
              className={`flex items-center justify-between text-left p-1.5 rounded transition-all duration-200 select-none text-[10px] font-semibold border ${
                currentTrackIndex === track.id && !isSynthMode
                  ? 'bg-vapor-purple/40 border-vapor-neonBlue text-vapor-neonBlue glow-text-cyan' 
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white disabled:opacity-40 hover:bg-vapor-purple/10'
              }`}
            >
              <div className="flex items-center gap-2 max-w-[160px] truncate select-none">
                <Disc size={11} className={currentTrackIndex === track.id && isPlaying && !isSynthMode ? 'animate-spin' : ''} />
                <span>0{track.id + 1}. {track.title}</span>
              </div>
              <span className="font-arcade text-[7px] opacity-75">{track.duration}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
