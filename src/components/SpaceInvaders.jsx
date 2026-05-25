import React, { useRef, useEffect, useState } from 'react';
import { Play, RotateCcw, AlertTriangle, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export default function SpaceInvaders({ onScoreChange, onGameOver }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, LEVEL_UP, GAMEOVER, PAUSED
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('vapor_invaders_highscore') || '0', 10);
  });
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  // Keyboard controls state
  const keysPressed = useRef({});
  const gameLoopRef = useRef(null);

  // Game Entities Refs to avoid React rerender delays in standard canvas loops
  const playerRef = useRef({
    x: CANVAS_WIDTH / 2 - 25,
    y: CANVAS_HEIGHT - 60,
    width: 50,
    height: 35,
    speed: 7,
    cooldown: 0,
    maxCooldown: 12
  });

  const lasersRef = useRef([]); // {x, y, width, height, dy, isPlayer}
  const invadersRef = useRef([]); // {x, y, width, height, type, points, row, col, color}
  const particlesRef = useRef([]); // {x, y, dx, dy, color, size, alpha, decay}
  const textPopupsRef = useRef([]); // {x, y, text, color, alpha, dy}
  const screenShakeRef = useRef(0); // number of frames to shake
  const invaderDirectionRef = useRef(1); // 1 = right, -1 = left
  const invaderSpeedRef = useRef(1.0);
  const starsRef = useRef([]); // scrolling background stars

  // Mobile/touch support controls
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Load stars
    const stars = [];
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1 + 0.2,
        color: Math.random() > 0.5 ? '#ff007f' : '#00f0ff'
      });
    }
    starsRef.current = stars;

    // Listen to keys
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current[e.key] = true;
      if (e.key === ' ' || e.key === 'Spacebar') {
        keysPressed.current['Space'] = true;
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
      if (e.key === ' ' || e.key === 'Spacebar') {
        keysPressed.current['Space'] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', checkMobile);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  // Update High Score helper
  const saveHighScore = (newScore) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('vapor_invaders_highscore', newScore.toString());
    }
  };

  // Build Invader Grid
  const initInvaders = (currentLevel) => {
    const rows = 4;
    const cols = 8;
    const padding = 20;
    const width = 40;
    const height = 30;
    const offsetTop = 80;
    const offsetLeft = 80;
    const invaders = [];

    // Invader speed increases with levels
    invaderSpeedRef.current = 0.8 + (currentLevel - 1) * 0.4;
    invaderDirectionRef.current = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = 'crab';
        let points = 100;
        let color = '#00f0ff'; // Cyan

        if (r === 0) {
          type = 'skull';
          points = 300;
          color = '#ff007f'; // Hot Pink
        } else if (r === 1) {
          type = 'shades';
          points = 200;
          color = '#b026ff'; // Neon Purple
        } else {
          type = 'crab';
          points = 100;
          color = '#00f0ff'; // Neon Cyan
        }

        invaders.push({
          x: offsetLeft + c * (width + padding),
          y: offsetTop + r * (height + padding),
          width,
          height,
          type,
          points,
          row: r,
          col: c,
          color,
          alive: true
        });
      }
    }
    invadersRef.current = invaders;
  };

  // Trigger Particle Explosion
  const createExplosion = (x, y, color) => {
    const count = 18;
    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particles.push({
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 1,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.015
      });
    }
    particlesRef.current = [...particlesRef.current, ...particles];
  };

  // Add floating text popup
  const addTextPopup = (x, y, text, color) => {
    textPopupsRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      dy: -1.2
    });
  };

  // Fire Player Laser
  const firePlayerLaser = () => {
    const player = playerRef.current;
    if (player.cooldown <= 0) {
      lasersRef.current.push({
        x: player.x + player.width / 2 - 2,
        y: player.y - 10,
        width: 4,
        height: 15,
        dy: -9,
        isPlayer: true,
        color: '#ff007f'
      });
      player.cooldown = player.maxCooldown;
    }
  };

  // Start the Game
  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    onScoreChange?.(0);
    setLives(3);
    setLevel(1);
    lasersRef.current = [];
    particlesRef.current = [];
    textPopupsRef.current = [];
    playerRef.current.x = CANVAS_WIDTH / 2 - playerRef.current.width / 2;
    playerRef.current.cooldown = 0;
    initInvaders(1);
  };

  // Go to Next Level
  const startNextLevel = () => {
    setLevel(prev => {
      const nextLvl = prev + 1;
      initInvaders(nextLvl);
      return nextLvl;
    });
    setGameState('PLAYING');
    lasersRef.current = [];
    particlesRef.current = [];
    textPopupsRef.current = [];
    playerRef.current.x = CANVAS_WIDTH / 2 - playerRef.current.width / 2;
    playerRef.current.cooldown = 0;
  };

  // Game loop trigger
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateAndDraw = () => {
      // 1. CLEAR CANVAS
      ctx.fillStyle = '#090214';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Handle screen shake transformation
      ctx.save();
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * 8;
        const shakeY = (Math.random() - 0.5) * 8;
        ctx.translate(shakeX, shakeY);
        screenShakeRef.current--;
      }

      // 2. DRAW DECORATIVE STARS (Scrolling background)
      starsRef.current.forEach(star => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * CANVAS_WIDTH;
        }
        ctx.fillStyle = star.color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0;

      // 3. UPDATE PLAYER POSITION
      const player = playerRef.current;
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
        player.x = Math.max(10, player.x - player.speed);
      }
      if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
        player.x = Math.min(CANVAS_WIDTH - player.width - 10, player.x + player.speed);
      }
      if (keysPressed.current['Space'] || keysPressed.current['w'] || keysPressed.current['ArrowUp']) {
        firePlayerLaser();
      }

      if (player.cooldown > 0) player.cooldown--;

      // Draw Player Ship (Glowing wireframe triangle with wings)
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00f0ff';
      ctx.strokeStyle = '#00f0ff';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, player.y); // Nose
      ctx.lineTo(player.x + player.width, player.y + player.height); // Bottom-right wing tip
      ctx.lineTo(player.x + player.width - 12, player.y + player.height - 8); // Inner notch
      ctx.lineTo(player.x + 12, player.y + player.height - 8); // Inner notch
      ctx.lineTo(player.x, player.y + player.height); // Bottom-left wing tip
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Add a core grid cabin to ship
      ctx.strokeStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, player.y + 5);
      ctx.lineTo(player.x + player.width / 2 - 6, player.y + player.height - 12);
      ctx.lineTo(player.x + player.width / 2 + 6, player.y + player.height - 12);
      ctx.closePath();
      ctx.stroke();

      ctx.shadowBlur = 0; // Reset shadow

      // 4. UPDATE LASERS
      const lasers = lasersRef.current;
      lasersRef.current = lasers.filter(laser => {
        laser.y += laser.dy;

        // Draw laser as neon rect with color matching alignment
        ctx.shadowBlur = 10;
        ctx.shadowColor = laser.color;
        ctx.fillStyle = laser.color;
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        ctx.shadowBlur = 0;

        // Keep inside bounds
        return laser.y > 0 && laser.y < CANVAS_HEIGHT;
      });

      // 5. UPDATE AND DRAW INVADERS
      let invaders = invadersRef.current;
      let reachWall = false;

      // Check if grid hits walls
      invaders.forEach(inv => {
        if (!inv.alive) return;
        const nextX = inv.x + invaderSpeedRef.current * invaderDirectionRef.current;
        if (nextX + inv.width >= CANVAS_WIDTH - 20 || nextX <= 20) {
          reachWall = true;
        }
      });

      if (reachWall) {
        invaderDirectionRef.current *= -1;
        // Shift invaders down
        invaders.forEach(inv => {
          inv.y += 20;
        });
      }

      // Draw Invaders (Wireframe synthwave graphics)
      let activeInvaderCount = 0;
      invaders.forEach(inv => {
        if (!inv.alive) return;
        activeInvaderCount++;

        inv.x += invaderSpeedRef.current * invaderDirectionRef.current;

        // Draw individual retro icons based on tier
        ctx.shadowBlur = 8;
        ctx.shadowColor = inv.color;
        ctx.strokeStyle = inv.color;
        ctx.fillStyle = 'rgba(255, 0, 127, 0.05)';
        ctx.lineWidth = 1.5;

        const x = inv.x;
        const y = inv.y;
        const w = inv.width;
        const h = inv.height;

        ctx.beginPath();
        if (inv.type === 'skull') {
          // Glow skull wireframe
          ctx.moveTo(x + w / 2, y);
          ctx.lineTo(x + w, y + h * 0.4);
          ctx.lineTo(x + w * 0.8, y + h);
          ctx.lineTo(x + w * 0.6, y + h);
          ctx.lineTo(x + w * 0.5, y + h * 0.7);
          ctx.lineTo(x + w * 0.4, y + h);
          ctx.lineTo(x + w * 0.2, y + h);
          ctx.lineTo(x, y + h * 0.4);
          ctx.closePath();
          ctx.stroke();

          // draw glowing eyes
          ctx.fillStyle = '#ff007f';
          ctx.fillRect(x + w * 0.28, y + h * 0.35, 4, 4);
          ctx.fillRect(x + w * 0.62, y + h * 0.35, 4, 4);
        } else if (inv.type === 'shades') {
          // Retro sunglasses invader
          ctx.moveTo(x, y + h * 0.3);
          ctx.lineTo(x + w, y + h * 0.3);
          ctx.lineTo(x + w * 0.9, y + h * 0.7);
          ctx.lineTo(x + w * 0.55, y + h * 0.7);
          ctx.lineTo(x + w * 0.5, y + h * 0.5);
          ctx.lineTo(x + w * 0.45, y + h * 0.7);
          ctx.lineTo(x + w * 0.1, y + h * 0.7);
          ctx.closePath();
          ctx.stroke();
          // Draw glasses lens grid lines
          ctx.strokeStyle = 'rgba(176, 38, 255, 0.4)';
          ctx.strokeRect(x + 2, y + h * 0.35, w / 2 - 4, h * 0.3);
          ctx.strokeRect(x + w / 2 + 2, y + h * 0.35, w / 2 - 4, h * 0.3);
        } else {
          // Crab / squid neon wireframe
          ctx.moveTo(x + w * 0.2, y);
          ctx.lineTo(x + w * 0.8, y);
          ctx.lineTo(x + w, y + h * 0.4);
          ctx.lineTo(x + w * 0.8, y + h);
          ctx.lineTo(x + w * 0.6, y + h * 0.7);
          ctx.lineTo(x + w * 0.4, y + h * 0.7);
          ctx.lineTo(x + w * 0.2, y + h);
          ctx.lineTo(x, y + h * 0.4);
          ctx.closePath();
          ctx.stroke();
        }

        ctx.shadowBlur = 0;

        // Check if invader reached bottom boundary (Game Over trigger)
        if (inv.y + inv.height >= player.y) {
          setGameState('GAMEOVER');
          saveHighScore(score);
          onGameOver?.();
        }

        // Random chance for invader to shoot
        if (Math.random() < 0.0006 + (level * 0.0003)) {
          lasersRef.current.push({
            x: inv.x + inv.width / 2 - 1.5,
            y: inv.y + inv.height,
            width: 3,
            height: 12,
            dy: 4 + (level * 0.5),
            isPlayer: false,
            color: '#00f0ff'
          });
        }
      });

      // LEVEL COMPLETE TRIGGER
      if (activeInvaderCount === 0 && invaders.length > 0) {
        setGameState('LEVEL_UP');
        return;
      }

      // 6. COLLISION DETECTION
      const currentLasers = lasersRef.current;
      const currentInvaders = invadersRef.current;

      for (let l = currentLasers.length - 1; l >= 0; l--) {
        const laser = currentLasers[l];

        if (laser.isPlayer) {
          // PLAYER LASER VS INVADERS
          for (let i = 0; i < currentInvaders.length; i++) {
            const inv = currentInvaders[i];
            if (!inv.alive) continue;

            if (laser.x + laser.width > inv.x &&
                laser.x < inv.x + inv.width &&
                laser.y < inv.y + inv.height &&
                laser.y + laser.height > inv.y) {
              
              // Hit!
              inv.alive = false;
              currentLasers.splice(l, 1); // remove laser
              createExplosion(inv.x + inv.width / 2, inv.y + inv.height / 2, inv.color);
              
              const pointsGained = inv.points * level;
              setScore(prev => {
                const newScore = prev + pointsGained;
                onScoreChange?.(newScore);
                saveHighScore(newScore);
                return newScore;
              });

              addTextPopup(inv.x, inv.y, `+${pointsGained}`, inv.color);
              screenShakeRef.current = Math.max(screenShakeRef.current, 3);
              break;
            }
          }
        } else {
          // INVADER LASER VS PLAYER
          if (laser.x + laser.width > player.x &&
              laser.x < player.x + player.width &&
              laser.y < player.y + player.height &&
              laser.y + laser.height > player.y) {
            
            // Player hit!
            currentLasers.splice(l, 1);
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00f0ff');
            screenShakeRef.current = 15; // heavy shake
            addTextPopup(player.x, player.y - 20, "GLITCH INTRUSION", '#ff007f');

            setLives(prevLives => {
              const nextLives = prevLives - 1;
              if (nextLives <= 0) {
                setGameState('GAMEOVER');
                saveHighScore(score);
                onGameOver?.();
              }
              return nextLives;
            });
          }
        }
      }

      // 7. PARTICLES DRAW & UPDATE
      const particles = particlesRef.current;
      particlesRef.current = particles.filter(part => {
        part.x += part.dx;
        part.y += part.dy;
        part.alpha -= part.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, part.alpha);
        ctx.fillStyle = part.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = part.color;
        ctx.fillRect(part.x, part.y, part.size, part.size);
        ctx.restore();

        return part.alpha > 0;
      });

      // 8. TEXT POPUPS
      const popups = textPopupsRef.current;
      textPopupsRef.current = popups.filter(pop => {
        pop.y += pop.dy;
        pop.alpha -= 0.02;

        ctx.save();
        ctx.globalAlpha = Math.max(0, pop.alpha);
        ctx.fillStyle = pop.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = pop.color;
        ctx.font = '9px "Press Start 2P"';
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();

        return pop.alpha > 0;
      });

      ctx.restore(); // Restore shake matrix

      // Request next frame
      gameLoopRef.current = requestAnimationFrame(updateAndDraw);
    };

    // Run first frame
    gameLoopRef.current = requestAnimationFrame(updateAndDraw);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, level]);

  // Mobile virtual joystick fire triggers
  const triggerMobileLeft = (val) => {
    keysPressed.current['ArrowLeft'] = val;
  };
  
  const triggerMobileRight = (val) => {
    keysPressed.current['ArrowRight'] = val;
  };

  const triggerMobileFire = () => {
    firePlayerLaser();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-full">
      {/* Game Window Controls Bar (Mac/Win95 retro titlebar) */}
      <div className="w-full flex items-center justify-between bg-gradient-to-r from-vapor-pink to-vapor-neonPurple px-3 py-1.5 rounded-t text-vapor-dark font-semibold select-none border-b-2 border-vapor-dark shadow">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-vapor-dark opacity-80 cursor-pointer hover:bg-red-500 duration-150 flex items-center justify-center text-[7px]" onClick={() => setGameState('START')}>×</span>
          <span className="w-3 h-3 rounded-full bg-vapor-dark opacity-80 cursor-pointer hover:bg-yellow-400 duration-150"></span>
          <span className="w-3 h-3 rounded-full bg-vapor-dark opacity-80 cursor-pointer hover:bg-green-400 duration-150"></span>
          <span className="ml-2 font-arcade text-[10px] tracking-wider text-white select-none glow-text-pink">VAPOR_STRIKE_198X.EXE</span>
        </div>
        <div className="flex items-center gap-4 text-white text-[10px] font-arcade">
          <span className="glow-text-cyan text-vapor-neonBlue">SCORE: {score.toString().padStart(6, '0')}</span>
          <span className="hidden sm:inline text-vapor-yellow">HI-SCORE: {highScore.toString().padStart(6, '0')}</span>
        </div>
      </div>

      {/* Screen Frame containing Canvas and CRT effects */}
      <div ref={containerRef} className="relative w-full aspect-[4/3] bg-vapor-dark border-x-2 border-b-2 border-vapor-pink overflow-hidden select-none flex items-center justify-center">
        
        {/* Core Game Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain"
        />

        {/* START SCREEN OVERLAY */}
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-vapor-dark/90 flex flex-col items-center justify-center text-center p-4 border border-vapor-pink/20 z-10 crt-flicker">
            <h1 className="font-arcade text-3xl sm:text-4xl text-vapor-pink glow-text-pink mb-2 animate-bounce-light select-none">
              SPACE INVADERS
            </h1>
            <p className="font-orbitron font-extrabold text-vapor-neonBlue tracking-widest text-sm mb-6 glow-text-cyan select-none">
              RETRO_FUTURE_VAPORWAVE
            </p>

            <button
              onClick={startGame}
              className="px-6 py-3 font-arcade text-xs text-white bg-transparent border-2 border-vapor-neonBlue hover:bg-vapor-neonBlue hover:text-vapor-dark rounded shadow-lg hover:shadow-vapor-glowBlue select-none hover:scale-105 duration-200 flex items-center gap-2 group cursor-pointer"
            >
              <Play size={12} className="group-hover:fill-vapor-dark" />
              BOOT_SYS()
            </button>

            <div className="mt-8 font-arcade text-[9px] text-vapor-neonPurple/80 max-w-sm leading-relaxed border-t border-vapor-neonPurple/20 pt-4">
              CONTROLS: A/D OR ARROW KEYS TO MOVE<br />
              SPACEBAR TO FIRE RETRO LASERS
            </div>
          </div>
        )}

        {/* LEVEL UP SCREEN OVERLAY */}
        {gameState === 'LEVEL_UP' && (
          <div className="absolute inset-0 bg-vapor-dark/85 flex flex-col items-center justify-center text-center p-4 z-10 crt-flicker">
            <h2 className="font-arcade text-2xl text-vapor-yellow glow-text-cyan mb-2">
              LEVEL {level} CLEAR!
            </h2>
            <p className="font-orbitron text-xs text-vapor-neonBlue tracking-widest mb-6">
              GRID INTEGRITY FULLY OPTIMIZED
            </p>

            <button
              onClick={startNextLevel}
              className="px-6 py-2.5 font-arcade text-xs text-white border-2 border-vapor-pink hover:bg-vapor-pink hover:text-vapor-dark rounded hover:shadow-vapor-glowPink select-none hover:scale-105 duration-200 cursor-pointer"
            >
              WARP_TO_LEVEL_{level + 1}()
            </button>
          </div>
        )}

        {/* GAMEOVER SCREEN OVERLAY */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-vapor-dark/95 flex flex-col items-center justify-center text-center p-4 z-10 crt-flicker border border-red-500/20">
            <AlertTriangle className="text-vapor-pink w-12 h-12 mb-3 animate-pulse" />
            <h1 className="font-arcade text-2xl sm:text-3xl text-vapor-pink glow-text-pink mb-2">
              GRID BREAKDOWN
            </h1>
            <p className="font-orbitron text-xs text-vapor-neonPurple tracking-widest mb-6">
              SYSTEM REBOOT REQUIRED / FINAL SCORE: {score}
            </p>

            <button
              onClick={startGame}
              className="px-6 py-3 font-arcade text-xs text-white border-2 border-vapor-neonBlue hover:bg-vapor-neonBlue hover:text-vapor-dark rounded hover:shadow-vapor-glowBlue select-none hover:scale-105 duration-200 cursor-pointer flex items-center gap-2"
            >
              <RotateCcw size={12} />
              RELOAD_GRID()
            </button>
          </div>
        )}

        {/* LIVE / STATS HEADER (DURING PLAYING) */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-4 left-4 flex gap-4 items-center z-10 pointer-events-none">
            {/* Lives counter */}
            <div className="flex items-center gap-1.5 bg-vapor-dark/65 border border-vapor-neonBlue/30 px-2.5 py-1 rounded">
              <span className="font-arcade text-[9px] text-vapor-neonBlue select-none">SHIELDS:</span>
              <div className="flex gap-1.5">
                {[...Array(3)].map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-3 border border-vapor-pink ${
                      i < lives ? 'bg-vapor-pink shadow-[0_0_5px_#ff007f]' : 'bg-transparent border-dashed'
                    } duration-300 rounded-sm`}
                  />
                ))}
              </div>
            </div>

            {/* Level indicator */}
            <div className="bg-vapor-dark/65 border border-vapor-neonPurple/30 px-2.5 py-1 rounded">
              <span className="font-arcade text-[9px] text-vapor-neonPurple select-none">SECTOR: 0{level}</span>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE CONTROLS BOARD (ONLY DISPLAYED ON TOUCH OR PORTABLE RESOLUTION) */}
      {isMobile && gameState === 'PLAYING' && (
        <div className="w-full flex items-center justify-between p-4 bg-vapor-deep border-x-2 border-b-2 border-vapor-pink rounded-b gap-3 select-none">
          {/* Movement Joysticks */}
          <div className="flex gap-2">
            <button
              onTouchStart={() => triggerMobileLeft(true)}
              onTouchEnd={() => triggerMobileLeft(false)}
              onMouseDown={() => triggerMobileLeft(true)}
              onMouseUp={() => triggerMobileLeft(false)}
              className="w-14 h-14 bg-vapor-purple hover:bg-vapor-neonBlue border-2 border-vapor-pink active:scale-95 rounded flex items-center justify-center text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              onTouchStart={() => triggerMobileRight(true)}
              onTouchEnd={() => triggerMobileRight(false)}
              onMouseDown={() => triggerMobileRight(true)}
              onMouseUp={() => triggerMobileRight(false)}
              className="w-14 h-14 bg-vapor-purple hover:bg-vapor-neonBlue border-2 border-vapor-pink active:scale-95 rounded flex items-center justify-center text-white"
            >
              <ArrowRight size={24} />
            </button>
          </div>

          {/* Fire button */}
          <button
            onTouchStart={triggerMobileFire}
            onMouseDown={triggerMobileFire}
            className="flex-1 max-w-[120px] h-14 bg-gradient-to-r from-vapor-pink to-vapor-magenta border-2 border-vapor-yellow rounded-lg active:scale-95 flex items-center justify-center gap-1 shadow-lg shadow-vapor-glowPink font-arcade text-xs text-white"
          >
            <Zap size={14} className="fill-white" />
            FIRE
          </button>
        </div>
      )}
    </div>
  );
}
