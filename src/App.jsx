import React, { useState } from 'react';
import SpaceInvaders from './components/SpaceInvaders';
import MusicPlayer from './components/MusicPlayer';
import { Monitor, HelpCircle, Volume2, Shield, Eye, Settings, Heart, Gamepad2, Info } from 'lucide-react';

export default function App() {
  const [sessionScore, setSessionScore] = useState(0);
  const [gameOverCount, setGameOverCount] = useState(0);
  
  // Custom interactive video toggles
  const [scanlinesActive, setScanlinesActive] = useState(true);
  const [crtFlickerActive, setCrtFlickerActive] = useState(true);
  const [gridAnimated, setGridAnimated] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleScoreChange = (score) => {
    setSessionScore(score);
  };

  const handleGameOver = () => {
    setGameOverCount(prev => prev + 1);
  };

  return (
    <div className={`relative min-h-screen w-full bg-vapor-dark flex flex-col justify-between overflow-x-hidden ${
      crtFlickerActive ? 'crt-flicker' : ''
    }`}>
      
      {/* CRT SCANLINE OVERLAY */}
      {scanlinesActive && <div className="scanlines"></div>}

      {/* BACKGROUND AESTHETICS: SYNTHWAVE GLOW SUN & GRID HORIZON */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-b from-[#ff007f] via-[#ff00aa] to-[#ffeb3b] z-0 select-none pointer-events-none opacity-85 animate-sun-glow"
           style={{
             backgroundImage: 'repeating-linear-gradient(to bottom, #ff007f 0px, #ff007f 16px, transparent 16px, transparent 24px, #ffeb3b 24px, #ffeb3b 26px)',
             maskImage: 'radial-gradient(circle, black 40%, transparent 100%)',
             WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 100%)'
           }}
      />
      
      {/* Neon Purple grid horizon */}
      <div className="horizon-glow"></div>

      {/* Perspective Grid Floor */}
      <div className="grid-container select-none pointer-events-none">
        <div className={`grid-floor ${gridAnimated ? 'animated' : ''}`}></div>
      </div>

      {/* TOP GLOWING RETRO BAR */}
      <header className="relative z-10 w-full bg-vapor-deep/80 border-b border-vapor-pink/40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-vapor-pink rounded-lg bg-vapor-pink/15 shadow-[0_0_10px_#ff007f]">
            <Gamepad2 size={24} className="text-vapor-pink animate-pulse" />
          </div>
          <div>
            <h1 className="font-arcade text-lg sm:text-xl text-white glow-text-pink leading-none tracking-wider m-0 select-none">
              NEON_SUNSET
            </h1>
            <span className="font-orbitron font-extrabold text-[9px] text-vapor-neonBlue uppercase tracking-widest leading-none block mt-1 glow-text-cyan select-none">
              CYBER_ARCADE_SYSTEM_v1.98
            </span>
          </div>
        </div>

        {/* Dynamic header score indicator */}
        <div className="flex gap-4 items-center">
          <div className="border-2 border-vapor-neonBlue bg-black/60 rounded px-4 py-2 text-center shadow-lg shadow-vapor-glowBlue/40">
            <span className="font-arcade text-[8px] text-vapor-neonBlue uppercase tracking-wider block mb-1">SESSION SCORE</span>
            <span className="font-arcade text-sm text-white glow-text-cyan">{sessionScore.toString().padStart(6, '0')}</span>
          </div>

          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-2.5 border border-vapor-neonPurple rounded-lg text-vapor-neonPurple hover:bg-vapor-neonPurple/20 hover:text-white duration-200 select-none cursor-pointer"
            title="Help / Instructions"
          >
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT WINDOWS SECTION */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start justify-center">
        
        {/* INSTRUCTIONS POPUP OVERLAY */}
        {showInstructions && (
          <div className="w-full vapor-window p-5 rounded-lg mb-6 flex flex-col gap-3 crt-flicker relative">
            <button 
              onClick={() => setShowInstructions(false)}
              className="absolute top-3 right-3 text-vapor-pink font-bold hover:text-white font-arcade text-xs select-none cursor-pointer"
            >
              [X]
            </button>
            <h3 className="font-arcade text-xs text-vapor-pink glow-text-pink flex items-center gap-1.5 border-b border-vapor-pink/30 pb-2">
              <Gamepad2 size={12} />
              SYSTEM OPERATIONS BRIEFING
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold leading-relaxed">
              <div className="flex flex-col gap-2">
                <span className="text-vapor-neonBlue border-b border-vapor-neonBlue/20 pb-0.5 uppercase tracking-wide">Arcade controls:</span>
                <ul className="list-disc pl-4 text-gray-300 flex flex-col gap-1">
                  <li>Use <code className="bg-vapor-dark px-1 text-vapor-pink">ArrowLeft / A</code> to steer ship left.</li>
                  <li>Use <code className="bg-vapor-dark px-1 text-vapor-pink">ArrowRight / D</code> to steer ship right.</li>
                  <li>Use <code className="bg-vapor-dark px-1 text-vapor-pink">Spacebar / ArrowUp</code> to discharge neon grid laser.</li>
                  <li>Sectors get faster and invaders shoot increasingly deadly projectiles!</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-vapor-neonBlue border-b border-vapor-neonBlue/20 pb-0.5 uppercase tracking-wide">Tape deck controls:</span>
                <ul className="list-disc pl-4 text-gray-300 flex flex-col gap-1">
                  <li>Play 3 beautiful synthwave tracks or choose the <code className="bg-vapor-dark px-1 text-vapor-yellow">Synth Mode</code> to procedurally generate chiptunes via Web Audio API.</li>
                  <li>Adjust timeline and volume mixers directly.</li>
                  <li>Mix is looped automatically for continuous outrun gaming sessions.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* LEFT COLUMN: THE ARCADE CABINET WINDOW */}
        <section className="flex-1 w-full flex flex-col gap-3">
          <div className="vapor-window-cyan rounded-lg overflow-hidden flex flex-col">
            {/* Title bracket top */}
            <div className="bg-vapor-dark/95 border-b-2 border-vapor-neonBlue px-3 py-1.5 flex items-center gap-2 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-vapor-neonBlue shadow-[0_0_5px_#00f0ff]"></span>
              <span className="font-arcade text-[8px] text-vapor-neonBlue tracking-widest uppercase">ARCADE_DISPLAY_FEED.EXE</span>
            </div>

            {/* Mounted Space Invaders HTML5 Canvas */}
            <div className="p-3 bg-black/40">
              <SpaceInvaders onScoreChange={handleScoreChange} onGameOver={handleGameOver} />
            </div>
          </div>

          {/* Quick aesthetic diagnostic metrics */}
          <div className="grid grid-cols-3 gap-3 bg-vapor-deep/60 border border-vapor-neonBlue/30 rounded-lg p-2.5 text-[9px] font-arcade text-vapor-neonBlue/80 select-none">
            <div className="flex flex-col items-center justify-center border-r border-vapor-neonBlue/20 py-1">
              <span className="text-gray-400">SIGNAL FEED</span>
              <span className="text-vapor-neonBlue glow-text-cyan mt-1 select-none">CRT_NTSC_OK</span>
            </div>
            <div className="flex flex-col items-center justify-center border-r border-vapor-neonBlue/20 py-1">
              <span className="text-gray-400">GRID PERSPECTIVE</span>
              <span className="text-vapor-pink glow-text-pink mt-1 select-none">tilt_75deg</span>
            </div>
            <div className="flex flex-col items-center justify-center py-1">
              <span className="text-gray-400">ARCADE REBOOTS</span>
              <span className="text-vapor-yellow mt-1 select-none">{gameOverCount}</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: THE SYNTHWAVE CASSETE PLAYER & VISUAL DIAGNOSTICS */}
        <section className="w-full lg:w-[380px] flex flex-col gap-5">
          {/* Music player container */}
          <MusicPlayer />

          {/* SYSTEM CONSOLE AND CONTROL SWITCHBOARD */}
          <div className="vapor-window-purple rounded-lg p-4 flex flex-col gap-3.5 select-none">
            <h3 className="font-arcade text-[9px] text-vapor-neonPurple glow-text-purple border-b border-vapor-neonPurple/30 pb-2 flex items-center gap-1.5">
              <Settings size={12} />
              HARDWARE_SWITCHBOARD.CFG
            </h3>

            {/* Diagnostics toggles */}
            <div className="flex flex-col gap-2.5 font-semibold text-xs text-gray-300">
              <div className="flex justify-between items-center bg-vapor-dark/50 p-2 rounded border border-vapor-neonPurple/20">
                <span className="flex items-center gap-1.5"><Eye size={12} className="text-vapor-pink" /> CRT SCANLINE SHADER</span>
                <button
                  onClick={() => setScanlinesActive(!scanlinesActive)}
                  className={`w-12 h-6 rounded-full border border-vapor-pink transition-all duration-300 p-0.5 cursor-pointer ${
                    scanlinesActive ? 'bg-vapor-pink/35 flex justify-end' : 'bg-transparent flex justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-vapor-pink shadow-[0_0_5px_#ff007f]" />
                </button>
              </div>

              <div className="flex justify-between items-center bg-vapor-dark/50 p-2 rounded border border-vapor-neonPurple/20">
                <span className="flex items-center gap-1.5"><Monitor size={12} className="text-vapor-neonBlue" /> SCREEN FLICKER SIM</span>
                <button
                  onClick={() => setCrtFlickerActive(!crtFlickerActive)}
                  className={`w-12 h-6 rounded-full border border-vapor-neonBlue transition-all duration-300 p-0.5 cursor-pointer ${
                    crtFlickerActive ? 'bg-vapor-neonBlue/35 flex justify-end' : 'bg-transparent flex justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-vapor-neonBlue shadow-[0_0_5px_#00f0ff]" />
                </button>
              </div>

              <div className="flex justify-between items-center bg-vapor-dark/50 p-2 rounded border border-vapor-neonPurple/20">
                <span className="flex items-center gap-1.5"><Shield size={12} className="text-vapor-neonPurple" /> VECTOR GRID MOTION</span>
                <button
                  onClick={() => setGridAnimated(!gridAnimated)}
                  className={`w-12 h-6 rounded-full border border-vapor-neonPurple transition-all duration-300 p-0.5 cursor-pointer ${
                    gridAnimated ? 'bg-vapor-neonPurple/35 flex justify-end' : 'bg-transparent flex justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-vapor-neonPurple shadow-[0_0_5px_#b026ff]" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER METADATA BRAND */}
      <footer className="relative z-10 w-full border-t border-vapor-purple/30 bg-vapor-deep/60 px-6 py-3 mt-8 select-none flex items-center justify-between text-[8px] font-arcade text-vapor-neonPurple/80">
        <span>RUNNING ON VAPORWAVE RETROSYSTEM // ALL SYSTEMS STABLE</span>
        <span className="flex items-center gap-1">
          MADE WITH <Heart size={10} className="text-vapor-pink fill-vapor-pink animate-pulse" /> IN 1988
        </span>
      </footer>
    </div>
  );
}
