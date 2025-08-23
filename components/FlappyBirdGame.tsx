"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useSetScore, useMyGameData } from '../smartcontracthooks';
import { useAccount } from 'wagmi';
import { useFrame } from './farcaster-provider';
import RewardInfoPopup from './RewardInfoPopup';
import { APP_URL } from '@/lib/constants';

export function startGame(
    canvasRef: React.RefObject<HTMLCanvasElement>,
    setGameStarted: React.Dispatch<React.SetStateAction<boolean>>,
    setGameOver: React.Dispatch<React.SetStateAction<boolean>>,
    gameOverRef: React.MutableRefObject<boolean>,
    setScore: React.Dispatch<React.SetStateAction<number>>,
    setDifficulty: React.Dispatch<React.SetStateAction<number>>,
    level: string,
    canvasDimensions: { width: number; height: number },
    onGameOver?: (finalScore: number) => void
) {
    startGameLogic(canvasRef, setGameStarted, setGameOver, gameOverRef, setScore, setDifficulty, level, canvasDimensions, onGameOver);
}

function startGameLogic(
    canvasRef: React.RefObject<HTMLCanvasElement>,
    setGameStarted: React.Dispatch<React.SetStateAction<boolean>>,
    setGameOver: React.Dispatch<React.SetStateAction<boolean>>,
    gameOverRef: React.MutableRefObject<boolean>,
    setScore: React.Dispatch<React.SetStateAction<number>>,
    setDifficulty: React.Dispatch<React.SetStateAction<number>>,
    level: string,
    canvasDimensions: { width: number; height: number },
    onGameOver?: (finalScore: number) => void
) {
    const canvas = canvasRef.current;
    if (canvas) {
        const context = canvas.getContext("2d");
        if (!context) return;

        // Set canvas dimensions explicitly
        canvas.width = canvasDimensions.width;
        canvas.height = canvasDimensions.height;
        
        // Use canvas dimensions from state
        const boardWidth = canvasDimensions.width;
        const boardHeight = canvasDimensions.height;
        
        console.log("🔍 Starting game with canvas:", boardWidth, "x", boardHeight);
        
        // Draw immediate background so we see something right away
        context.fillStyle = "#0D2B5E"; // Arbitrum dark blue
        context.fillRect(0, 0, boardWidth, boardHeight);
        
        // Draw a test bird immediately
        context.fillStyle = "#28A0F0"; // Arbitrum blue
        context.fillRect(boardWidth / 8, boardHeight / 2, 34, 24);
        
        console.log("🔍 Drew initial sky and bird");

        // bird
        const birdWidth = 34;
        const birdHeight = 24;
        const birdX = boardWidth / 8;
        const birdY = boardHeight / 2;

        const bird = {
            x: birdX,
            y: birdY,
            width: birdWidth,
            height: birdHeight,
        };

        // pipes
        let pipeArray: any[] = [];
        const pipeWidth = 64;
        const pipeHeight = 512;
        const pipeX = boardWidth;
        const pipeY = 0;

        // coins
        let coinArray: any[] = [];
        const coinSize = 24;

        // Global audio context for better reliability
        let audioContext: AudioContext | null = null;
        let audioInitialized = false;

        // Initialize audio context on first user interaction
        const initializeAudio = () => {
            if (audioInitialized) return;
            
            try {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                
                // Resume context if suspended (required on mobile)
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                
                audioInitialized = true;
                console.log("🔊 Audio initialized successfully");
            } catch (e) {
                console.log("Audio not supported");
            }
        };

        // Reliable sound playing function
        const playSound = (type: 'coin' | 'crash' | 'oops' | 'whoosh' | 'countdown' | 'go') => {
            if (!audioContext || audioContext.state !== 'running') {
                initializeAudio();
                if (!audioContext) return;
            }

            try {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Different sound configurations
                switch (type) {
                    case 'coin':
                        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                        oscillator.type = 'sine';
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.2);
                        break;
                        
                    case 'crash':
                        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
                        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
                        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                        oscillator.type = 'sawtooth';
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.4);
                        break;
                        
                    case 'oops':
                        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                        oscillator.type = 'sine';
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.5);
                        break;
                        
                    case 'whoosh':
                        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.15);
                        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                        oscillator.type = 'triangle';
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.15);
                        break;
                        
                    case 'countdown':
                        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                        oscillator.type = 'sine';
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.2);
                        break;
                        
                    case 'go':
                        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
                        oscillator.frequency.setValueAtTime(1600, audioContext.currentTime + 0.2);
                        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                        oscillator.type = 'sine';
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.3);
                        break;
                }
            } catch (e) {
                console.log("Sound playback failed:", e);
            }
        };

        // Simplified sound functions
        const playCoinSound = () => playSound('coin');
        const playCrashSound = () => playSound('crash');
        const playOopsSound = () => playSound('oops');
        const playWhooshSound = () => playSound('whoosh');
        const playCountdownSound = () => playSound('countdown');
        const playGoSound = () => playSound('go');

        // Draw coin function
        const drawCoin = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            // Draw Arbitrum-themed coin with blue gradient
            const gradient = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size/2);
            gradient.addColorStop(0, '#28A0F0'); // Arbitrum blue center
            gradient.addColorStop(0.7, '#1E4D8C'); // Darker blue middle
            gradient.addColorStop(1, '#0D2B5E'); // Darkest blue edge
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add inner circle for depth
            ctx.fillStyle = '#5BB8FF';
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add Arbitrum "A" symbol
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${size/2}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('A', x + size/2, y + size/2 + size/6);
            
            // Add sparkle effect
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(x + size/4, y + size/4, 1, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 3*size/4, y + size/4, 1, 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;
        };

        const birdImg = new Image();
        birdImg.src = "/images/arbitrum-bird.svg";

        const topPipeImg = new Image();
        topPipeImg.src = "/images/arbitrum-pipe-top.svg";

        const bottomPipeImg = new Image();
        bottomPipeImg.src = "/images/arbitrum-pipe-bottom.svg";

        const bgImg = new Image();
        bgImg.src = "/images/arbitrum-bg.svg";



        // Progressive difficulty system
        let baseVelocityX: number;
        let difficultyMultiplier: number = 1;
        let timeElapsed: number = 0;
        let lastDifficultyIncrease: number = 0;
        
        // Scoring multipliers for different levels
        let pipeScoreMultiplier: number;
        let coinScoreMultiplier: number = 1; // Coin always gives 1 point
        
        switch (level) {
            case "beginner":
                baseVelocityX = -3;
                pipeScoreMultiplier = 1; // 1 point for crossing pipe
                break;
            case "intermediate":
                baseVelocityX = -5;
                pipeScoreMultiplier = 2; // 2 points for crossing pipe
                break;
            case "expert":
                baseVelocityX = -7;
                pipeScoreMultiplier = 3; // 3 points for crossing pipe
                break;
            default:
                baseVelocityX = -3;
                pipeScoreMultiplier = 1;
        }
        
        let velocityX = baseVelocityX;

        let velocityY = 0;
        let gravity = 0.3;

        let score = 0;
        let gameStartTime = Date.now();

        const detectCollision = (bird: any, pipe: any) => {
            return (
                bird.x < pipe.x + pipe.width &&
                bird.x + bird.width > pipe.x &&
                bird.y < pipe.y + pipe.height &&
                bird.y + bird.height > pipe.y
            );
        };

        const update = () => {
            if (gameOverRef.current) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                context.font = "bold 48px serif";
                context.fillStyle = "#28A0F0";
                context.textAlign = "center";
                context.fillText("Game Over", canvas.width / 2, canvas.height / 2);
                context.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
                return;
            }
            
            // Update difficulty over time
            timeElapsed = (Date.now() - gameStartTime) / 1000; // Convert to seconds
            
            // Increase difficulty every 10 seconds
            if (timeElapsed - lastDifficultyIncrease >= 10) {
                difficultyMultiplier += 0.1;
                lastDifficultyIncrease = timeElapsed;
                velocityX = baseVelocityX * difficultyMultiplier;
                
                // Update difficulty state for UI
                setDifficulty(difficultyMultiplier);
                
                // Also increase gravity slightly for more challenge
                gravity = 0.3 + (difficultyMultiplier - 1) * 0.05;
                
                // Visual feedback for difficulty increase
                context.fillStyle = "#28A0F0";
                context.font = "bold 24px serif";
                context.textAlign = "center";
                context.fillText(`Level ${Math.floor(difficultyMultiplier * 10) / 10}!`, canvas.width / 2, canvas.height / 3);
            }
            context.clearRect(0, 0, canvas.width, canvas.height);

            context.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

            velocityY += gravity;
            bird.y = Math.max(bird.y + velocityY, 0);

            if (bird.y >= canvas.height - bird.height || bird.y <= 0) {
                playOopsSound(); // Play funny sound when hitting ground/ceiling
                setGameOver(true);
                gameOverRef.current = true;
                if (onGameOver) onGameOver(score);
                return;
            }

            context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

            // Update and draw coins
            for (let i = coinArray.length - 1; i >= 0; i--) {
                const coin = coinArray[i];
                coin.x += velocityX;
                
                // Draw coin
                drawCoin(context, coin.x, coin.y, coinSize);
                
                // Check collision with bird
                if (bird.x < coin.x + coinSize &&
                    bird.x + bird.width > coin.x &&
                    bird.y < coin.y + coinSize &&
                    bird.y + bird.height > coin.y) {
                    
                    // Coin collected!
                    playCoinSound();
                    score += coinScoreMultiplier; // +1 point for coin (same for all levels)
                    setScore(score);
                    coinArray.splice(i, 1); // Remove coin
                }
                
                // Remove coins that are off screen
                if (coin.x + coinSize < 0) {
                    coinArray.splice(i, 1);
                }
            }

            for (let i = 0; i < pipeArray.length; i++) {
                const pipe = pipeArray[i];
                pipe.x += velocityX;
                context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

                if (!pipe.passed && pipe.x + pipe.width < bird.x) {
                    pipe.passed = true;

                    // Ensure both top and bottom pipes are passed before incrementing score
                    if (pipe.isTopPipe) {
                        const bottomPipeIndex = i + 1;
                        if (pipeArray[bottomPipeIndex] && pipeArray[bottomPipeIndex].passed) {
                            score += pipeScoreMultiplier;
                            setScore(score);
                            playWhooshSound(); // Play whoosh sound for successful pipe pass
                        }
                    } else {
                        const topPipeIndex = i - 1;
                        if (pipeArray[topPipeIndex] && pipeArray[topPipeIndex].passed) {
                            score += pipeScoreMultiplier;
                            setScore(score);
                            playWhooshSound(); // Play whoosh sound for successful pipe pass
                        }
                    }
                }

                if (detectCollision(bird, pipe)) {
                    playCrashSound(); // Play bomb sound when hitting pipe
                    setGameOver(true);
                    gameOverRef.current = true;
                    if (onGameOver) onGameOver(score);
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                    context.font = "bold 48px serif";
                    context.fillStyle = "#28A0F0";
                    context.textAlign = "center";
                    context.fillText("Game Over", canvas.width / 2, canvas.height / 2);
                    context.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
                    return;
                }
            }

            while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
                pipeArray.shift();
            }

            requestAnimationFrame(update);
        };

        const placePipes = () => {
            if (gameOverRef.current) return;

            // Dynamic pipe spacing based on difficulty
            const baseOpeningSpace = boardHeight / 3;
            const minOpeningSpace = boardHeight / 4; // Minimum opening
            const openingSpace = Math.max(minOpeningSpace, baseOpeningSpace - (difficultyMultiplier - 1) * 20);
            
            const randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);

            const topPipe = {
                img: topPipeImg,
                x: pipeX,
                y: randomPipeY,
                width: pipeWidth,
                height: pipeHeight,
                passed: false,
                isTopPipe: true,
            };
            pipeArray.push(topPipe);

            const bottomPipe = {
                img: bottomPipeImg,
                x: pipeX,
                y: randomPipeY + pipeHeight + openingSpace,
                width: pipeWidth,
                height: pipeHeight,
                passed: false,
                isTopPipe: false,
            };
            pipeArray.push(bottomPipe);

            // Add coin between pipes (chance increases with difficulty)
            const coinChance = Math.min(0.8, 0.3 + (difficultyMultiplier - 1) * 0.1); // Max 80% chance
            if (Math.random() < coinChance) {
                const coinX = pipeX + pipeWidth / 2 - coinSize / 2;
                const coinY = randomPipeY + pipeHeight + openingSpace / 2 - coinSize / 2;
                
                coinArray.push({
                    x: coinX,
                    y: coinY,
                    size: coinSize
                });
            }
        };

        const moveBird = (e: KeyboardEvent) => {
            if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
                e.preventDefault();
                
                // Initialize audio on first interaction
                initializeAudio();
                
                velocityY = -7;
                if (gameOverRef.current) {
                    bird.y = birdY;
                    pipeArray = [];
                    coinArray = []; // Reset coins
                    setGameOver(false);
                    gameOverRef.current = false;
                    score = 0;
                    setScore(score);
                }
            }
        };

        const handleTouch = (e: TouchEvent) => {
            e.preventDefault();
            
            // Initialize audio on first interaction
            initializeAudio();
            
            velocityY = -7;
            if (gameOverRef.current) {
                bird.y = birdY;
                pipeArray = [];
                coinArray = []; // Reset coins
                setGameOver(false);
                gameOverRef.current = false;
                score = 0;
                setScore(score);
            }
        };

        const handleClick = (e: MouseEvent) => {
            e.preventDefault();
            
            // Initialize audio on first interaction
            initializeAudio();
            
            velocityY = -7;
            if (gameOverRef.current) {
                bird.y = birdY;
                pipeArray = [];
                coinArray = []; // Reset coins
                setGameOver(false);
                gameOverRef.current = false;
                score = 0;
                setScore(score);
            }
        };

        canvas.height = boardHeight;
        canvas.width = boardWidth;

        bgImg.onload = () => {
            context.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        };

        requestAnimationFrame(update);
        
        // Dynamic pipe spawning interval based on difficulty
        const getPipeInterval = () => {
            const baseInterval = 2000;
            const minInterval = 800; // Minimum 0.8 seconds between pipes
            return Math.max(minInterval, baseInterval - (difficultyMultiplier - 1) * 200);
        };
        
        const spawnPipes = () => {
            if (!gameOverRef.current) {
                placePipes();
                setTimeout(spawnPipes, getPipeInterval());
            }
        };
        
        setTimeout(spawnPipes, getPipeInterval());
        document.addEventListener("keydown", moveBird);
        canvas.addEventListener("touchstart", handleTouch, { passive: false });
        canvas.addEventListener("click", handleClick);

        return () => {
            document.removeEventListener("keydown", moveBird);
            canvas.removeEventListener("touchstart", handleTouch);
            canvas.removeEventListener("click", handleClick);
        };
    }
}

const FlappyBirdGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const gameOverRef = useRef(false);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState("");
    const [mode, setMode] = useState<"single" | "multi" | "">("");
    const [difficulty, setDifficulty] = useState(1);
    const cardRef = useRef<HTMLDivElement>(null);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 400, height: 600 });
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showCountdown, setShowCountdown] = useState(false);
    const [showRewardInfo, setShowRewardInfo] = useState(false);
    
    // Debug reward info popup state
    useEffect(() => {
        console.log("🔍 Home page - showRewardInfo state changed to:", showRewardInfo)
    }, [showRewardInfo]);
    
    // Smart contract hooks
    const { address, isConnected } = useAccount();
    const { setScore: saveScoreToContract, isPending: isSavingScore, isSuccess: scoreSaved } = useSetScore();
    const { myScore: contractScore, myRank, hasScore, username, fid, pfp } = useMyGameData();
    const [isClient, setIsClient] = useState(false);
    const { actions, context } = useFrame();

    useEffect(() => {
        setIsClient(true);
        
        // Check if user has seen the reward info before on home page
        const hasSeenHomeRewardInfo = localStorage.getItem('flapbitrum_home_reward_info_seen')
        console.log("🔍 Home page - hasSeenHomeRewardInfo:", hasSeenHomeRewardInfo)
        
        if (!hasSeenHomeRewardInfo) {
            console.log("🔍 Home page - Will show popup after 1.5 seconds")
            // Show reward info popup for first-time visitors to home page
            setTimeout(() => {
                console.log("🔍 Home page - Setting showRewardInfo to true")
                setShowRewardInfo(true)
            }, 1500) // Show after 1.5 seconds delay
        } else {
            console.log("🔍 Home page - User has already seen the popup")
        }
    }, []);

    // Debug current state
    console.log("🔍 Current state - Mode:", mode, "Game Started:", gameStarted, "Game Over:", gameOver);

    // Set canvas dimensions based on screen size
    useEffect(() => {
        const updateDimensions = () => {
            if (typeof window !== 'undefined') {
                const isMobile = window.innerWidth < 768;
                setCanvasDimensions({
                    width: isMobile ? window.innerWidth : 400,
                    height: isMobile ? window.innerHeight : 600
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Animation: add fade/scale in on card mount or mode change
    useEffect(() => {
        if (cardRef.current) {
            cardRef.current.classList.remove('animate-fadein');
            void cardRef.current.offsetWidth; // trigger reflow
            cardRef.current.classList.add('animate-fadein');
        }
    }, [mode, gameStarted, gameOver]);

    const handleStartGame = (selectedLevel: string) => {
        console.log("🔍 handleStartGame called with level:", selectedLevel);
        
        // Reset game state completely
        setGameOver(false);
        gameOverRef.current = false;
        setScore(0);
        setLevel(selectedLevel);
        setMode("single"); // Set mode to single to show game canvas
        
        // Clear canvas if it exists
        if (canvasRef.current) {
            const context = canvasRef.current.getContext("2d");
            if (context) {
                context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
        
        // Start countdown
        console.log("🔍 Starting countdown...");
        setShowCountdown(true);
        setCountdown(3);
    };

    const handleGameOver = (finalScore: number) => {
        console.log("🔍 Game over with score:", finalScore);
        // Don't automatically save - let user decide
    };

    const handleSaveToChain = () => {
        console.log("🔍 handleSaveToChain called");
        console.log("🔍 isConnected:", isConnected);
        console.log("🔍 address:", address);
        console.log("🔍 score:", score);
        console.log("🔍 Context:", context);
        
        if (isConnected && address && score > 0) {
            // Get Farcaster user data from context
            const farcasterUsername = context?.user?.username || username || "Anonymous";
            const farcasterFid = context?.user?.fid || fid || 0;
            const farcasterPfp = context?.user?.pfpUrl || pfp || "";
            
            console.log("🔍 Farcaster data - Username:", farcasterUsername, "FID:", farcasterFid, "PFP:", farcasterPfp);
            console.log("🔍 User requested to save score to smart contract:", score);
            
            saveScoreToContract(score, farcasterUsername, farcasterFid, farcasterPfp);
        } else {
            console.log("🔍 Cannot save score - conditions not met");
        }
    };

    const handleCastScore = async () => {
        console.log("🔍 handleCastScore called!");
        console.log("🔍 Score:", score);
        console.log("🔍 Actions available:", !!actions);
        
        if (!actions) {
            console.log("🔍 Farcaster actions not available");
            alert("Farcaster actions not available. Make sure you're in a Farcaster environment.");
            return;
        }

        try {
            const castText = `🎮 Just scored ${score} points in Flapbitrum on Arbitrum! 🏆\n\n` +
                           `Level: ${level}\n` +
                           `Difficulty: ${Math.floor(difficulty * 10) / 10}x\n\n` +
                           `Can you beat my score? 🚀\n` +
                           `💰 Top 15 players will share the reward pool! 💰\n\n` +
                           `#Flapbitrum #Arbitrum #Gaming`
                           

            console.log("🔍 Cast text:", castText);

          
            
            
            await actions.composeCast({
                text: castText,
                embeds:[`${APP_URL}`]
            });
            
            console.log("🔍 Opening Farcaster compose page!");
            alert("Opening Farcaster compose page!");
        } catch (error) {
            console.error("🔍 Error opening Farcaster:", error);
            alert("Error opening Farcaster: " + error);
        }
    };

    // Sound functions for countdown
    const playCountdownSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.type = 'sine';
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log("Countdown sound failed:", e);
        }
    };

    const playGoSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(1600, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.type = 'sine';
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log("GO sound failed:", e);
        }
    };

    // Countdown effect
    useEffect(() => {
        console.log("🔍 Countdown effect - showCountdown:", showCountdown, "countdown:", countdown);
        
        if (showCountdown && countdown !== null) {
            if (countdown > 0) {
                console.log("🔍 Showing countdown:", countdown);
                // Play countdown sound
                setTimeout(() => playCountdownSound(), 100);
                
                const timer = setTimeout(() => {
                    setCountdown((prev) => prev !== null ? prev - 1 : null);
                }, 1000);
                
                return () => clearTimeout(timer);
            } else {
                // Countdown finished, start game
                console.log("🔍 Countdown finished, showing GO!");
                playGoSound();
                setShowCountdown(false);
                setCountdown(null);
                setGameStarted(true);
                console.log("🔍 Countdown finished, game starting...");
            }
        }
    }, [showCountdown, countdown, playCountdownSound, playGoSound]);

    // Initialize canvas when game starts (after countdown)
    useEffect(() => {
        if (canvasRef.current && gameStarted && level && !showCountdown) {
            console.log("🔍 Initializing game after countdown...");
            
            // Start the actual game after countdown finishes
            startGame(canvasRef, setGameStarted, setGameOver, gameOverRef, setScore, setDifficulty, level, canvasDimensions, handleGameOver);
        }
    }, [gameStarted, level, canvasDimensions, showCountdown]);

    // Trigger countdown when game canvas is ready
    useEffect(() => {
        console.log("🔍 Countdown trigger effect - Mode:", mode, "Level:", level, "Game Started:", gameStarted, "Show Countdown:", showCountdown, "Canvas:", !!canvasRef.current);
        
        if (mode === "single" && level && !gameStarted && !showCountdown && canvasRef.current) {
            console.log("🔍 Game canvas ready, starting countdown...");
            setShowCountdown(true);
            setCountdown(3);
        }
    }, [mode, level, gameStarted, showCountdown]);

    // Mobile fullscreen styling - desktop gets container
    const cardStyle = "w-full min-h-screen md:max-w-sm md:mx-auto md:h-auto";

    // Countdown Overlay Component
    const CountdownOverlay = () => (
        showCountdown && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
                <div className="text-center">
                    {countdown && countdown > 0 ? (
                        <div className="text-8xl md:text-9xl font-bold text-white animate-pulse drop-shadow-2xl">
                            {countdown}
                        </div>
                    ) : (
                        <div className="text-6xl md:text-7xl font-bold text-green-400 animate-bounce drop-shadow-2xl">
                            GO!
                        </div>
                    )}
                </div>
            </div>
        )
    );

    // Wallet Connection Component
    const WalletConnection = () => (
        <div className="fixed top-4 right-4 z-40">
            {isClient && !isConnected && (
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-3 rounded-2xl font-semibold shadow-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 border border-white/20 flex items-center space-x-2 backdrop-blur-sm"
                >
                    <span className="text-lg">🔗</span>
                    <span>Connect Wallet</span>
                </button>
            )}
        </div>
    );

    if (mode === "") {
        return (
            <>
                <WalletConnection />
                <CountdownOverlay />
                


                {/* Reward Info Popup */}
                <RewardInfoPopup 
                  isOpen={showRewardInfo}
                  onClose={() => setShowRewardInfo(false)}
                  localStorageKey="flapbitrum_home_reward_info_seen"
                />
                <div ref={cardRef} className={`${cardStyle} animate-fadein`}>
                {/* Mobile fullscreen menu */}
                <div className="md:hidden min-h-screen w-full flex flex-col justify-center items-center p-8 bg-gradient-to-br from-blue-900/95 via-indigo-800/95 to-blue-700/95 text-white relative overflow-hidden">
                    {/* Gaming background with particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* Grid pattern */}
                        <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2328A0F0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }}></div>
                        
                        {/* Floating gaming elements */}
                        <div className="absolute top-20 left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
                        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
                        <div className="absolute bottom-1/3 left-1/4 w-28 h-28 bg-cyan-400/10 rounded-full blur-2xl animate-pulse delay-3000"></div>
                        
                        {/* Scanning lines */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/5 to-transparent h-1 animate-pulse"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/5 to-transparent w-1 animate-pulse delay-1000"></div>
                        
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-blue-400/30"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-blue-400/30"></div>
                        <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-blue-400/30"></div>
                        <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-blue-400/30"></div>
                    </div>
                    
                    <div className="relative z-10 text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="relative">
                                {/* <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl"> */}
                                <img src="/images/logo.png" alt="Flapbitrum Logo" className="w-16 h-16 object-contain" />
                                    {/* <span className="text-3xl">🔵</span> */}
                                {/* </div> */}
                               
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                            </div>
                            <div>
                                <h1 className="text-5xl font-extrabold drop-shadow-lg tracking-tight">Flapbitrum</h1>
                            </div>
                        </div>
                        <p className="text-xl opacity-90 font-medium">Navigate the L2 blockchain!</p>
                        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-blue-200">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span>Live</span>
                            </div>
                            <div className="w-px h-4 bg-blue-300/30"></div>
                            <div className="flex items-center gap-1">
                                <span>⚡</span>
                                <span>Low Gas</span>
                            </div>
                            <div className="w-px h-4 bg-blue-300/30"></div>
                            <div className="flex items-center gap-1">
                                <span>🏆</span>
                                <span>Rewards</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative z-10 space-y-6 w-full max-w-xs">
                        <button 
                            className="w-full py-6 px-8 bg-gradient-to-r from-blue-500/80 to-indigo-600/80 backdrop-blur-sm text-white text-xl rounded-3xl font-bold shadow-2xl active:scale-95 border border-white/30 transition-all duration-200 hover:from-blue-600/90 hover:to-indigo-700/90 relative overflow-hidden group" 
                            onClick={() => {
                                console.log("🔍 Single Player clicked");
                                setMode("single");
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                            <span className="relative z-10">🎮 Single Player</span>
                        </button>
                        <button 
                            className="w-full py-6 px-8 bg-gradient-to-r from-purple-500/80 to-pink-600/80 backdrop-blur-sm text-white text-xl rounded-3xl font-bold shadow-2xl active:scale-95 border border-white/30 transition-all duration-200 hover:from-purple-600/90 hover:to-pink-700/90 relative overflow-hidden group" 
                            onClick={() => setMode("multi")}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                            <span className="relative z-10">👥 Multiplayer</span>
                        </button>
                        <button 
                            className="w-full py-6 px-8 bg-gradient-to-r from-yellow-500/80 to-orange-600/80 backdrop-blur-sm text-white text-xl rounded-3xl font-bold shadow-2xl active:scale-95 border border-white/30 transition-all duration-200 hover:from-yellow-600/90 hover:to-orange-700/90 relative overflow-hidden group" 
                            onClick={() => window.location.href = '/score'}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                            <span className="relative z-10">🏆 Leaderboard</span>
                        </button>
                    </div>
                    
                    <div className="relative z-10 mt-8 text-center">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                            <p className="text-sm text-blue-100">
                                💰 Top 15 players share the reward pool<br/>
                                🔗 Connect wallet to save scores<br/>
                                📢 Share achievements on Farcaster
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Desktop menu */}
                <div className="hidden md:block p-8 text-center bg-gradient-to-br from-blue-800/90 via-indigo-700/90 to-blue-600/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden">
                    {/* Gaming background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* Grid pattern */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2328A0F0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }}></div>
                        
                        {/* Animated lines */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent animate-pulse delay-500"></div>
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-blue-400/30 to-transparent animate-pulse delay-1000"></div>
                        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent animate-pulse delay-1500"></div>
                        
                        {/* Floating elements */}
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400/5 rounded-full blur-2xl animate-pulse delay-2000"></div>
                        
                        {/* Corner accents */}
                        <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-blue-400/40"></div>
                        <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-blue-400/40"></div>
                        <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-blue-400/40"></div>
                        <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-blue-400/40"></div>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-2xl">🔵</span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">Flapbitrum</h1>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-400/30">
                                        L2 Gaming
                                    </span>
                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-400/30">
                                        Arbitrum
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-lg text-blue-100 font-semibold mb-8">Navigate the L2 blockchain!</p>
                        
                        <div className="space-y-4 mb-6">
                            <button 
                                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 border border-white/20 relative overflow-hidden group" 
                                onClick={() => setMode("single")}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                                <span className="relative z-10">🎮 Single Player</span>
                            </button>
                            <button 
                                className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-purple-600 hover:to-pink-700 transition-all duration-200 border border-white/20 relative overflow-hidden group" 
                                onClick={() => setMode("multi")}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                                <span className="relative z-10">👥 Multiplayer</span>
                            </button>
                            <button 
                                className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 border border-white/20 relative overflow-hidden group" 
                                onClick={() => window.location.href = '/score'}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                                <span className="relative z-10">🏆 Leaderboard</span>
                            </button>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <p className="text-sm text-blue-100">
                                💰 Top 15 players share the reward pool • 🔗 Connect wallet to save scores • 📢 Share achievements on Farcaster
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
        );
    }

    if (mode === "multi") {
        return (
            <div ref={cardRef} className={`${cardStyle} animate-fadein`}>
                {/* Mobile fullscreen multiplayer */}
                <div className="md:hidden min-h-screen w-full flex flex-col justify-center items-center p-8 bg-gradient-to-br from-purple-900/95 via-pink-800/95 to-purple-700/95 text-white relative overflow-hidden">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 left-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-20 right-10 w-32 h-32 bg-pink-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
                    </div>
                    
                    <div className="relative z-10 text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                                    <span className="text-3xl">🚧</span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-extrabold drop-shadow-lg">Coming Soon!</h1>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full border border-purple-400/30">
                                        Multiplayer
                                    </span>
                                    <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full border border-pink-400/30">
                                        Beta
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-lg opacity-90 font-medium">Multiplayer mode is under development</p>
                        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-purple-200">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                <span>In Development</span>
                            </div>
                            <div className="w-px h-4 bg-purple-300/30"></div>
                            <div className="flex items-center gap-1">
                                <span>👥</span>
                                <span>Real-time</span>
                            </div>
                            <div className="w-px h-4 bg-purple-300/30"></div>
                            <div className="flex items-center gap-1">
                                <span>🏆</span>
                                <span>Competitive</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-purple-200">🚀 Planned Features</h3>
                            <div className="space-y-2 text-sm text-purple-100">
                                <div className="flex items-center gap-2">
                                    <span>⚡</span>
                                    <span>Real-time multiplayer battles</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>🏆</span>
                                    <span>Global leaderboards</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>💰</span>
                                    <span>Prize pools and rewards</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>🎯</span>
                                    <span>Tournament mode</span>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            className="py-4 px-8 bg-gradient-to-r from-blue-500/80 to-indigo-600/80 backdrop-blur-sm text-white text-lg rounded-3xl font-bold shadow-2xl active:scale-95 border border-white/30 transition-all duration-200 hover:from-blue-600/90 hover:to-indigo-700/90" 
                            onClick={() => setMode("")}
                        >
                            ← Back to Menu
                        </button>
                    </div>
                </div>
                
                {/* Desktop multiplayer */}
                <div className="hidden md:block p-8 text-center bg-gradient-to-br from-purple-800/90 via-pink-700/90 to-purple-600/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-2xl">🚧</span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">Coming Soon!</h1>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full border border-purple-400/30">
                                        Multiplayer
                                    </span>
                                    <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full border border-pink-400/30">
                                        Beta
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-lg text-purple-100 font-semibold mb-6">Multiplayer mode is under development</p>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-purple-200">🚀 Planned Features</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm text-purple-100">
                                <div className="flex items-center gap-2">
                                    <span>⚡</span>
                                    <span>Real-time battles</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>🏆</span>
                                    <span>Global leaderboards</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>💰</span>
                                    <span>Prize pools</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>🎯</span>
                                    <span>Tournaments</span>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 border border-white/20" 
                            onClick={() => setMode("")}
                        >
                            ← Back to Menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!gameStarted) {
        return (
            <>
                <WalletConnection />
                <CountdownOverlay />
                <div ref={cardRef} className={`${cardStyle} animate-fadein`}>
                {/* Mobile fullscreen difficulty selection */}
                <div className="md:hidden min-h-screen w-[390px] flex flex-col justify-center items-center p-8 bg-gradient-to-br from-blue-900/95 via-indigo-800/95 to-blue-700/95 text-white relative overflow-hidden">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
                    </div>
                    
                    <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                    <img src="/images/logo.png" alt="Flapbitrum Logo" className="w-8 h-8 object-contain" />
                                </div>
                                <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">Choose Your Challenge</h1>
                            </div>
                            <p className="text-lg opacity-90 font-medium text-blue-100">Select your difficulty level and earn rewards</p>
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <span className="text-xs bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 px-3 py-1 rounded-full border border-yellow-400/30 backdrop-blur-sm">
                                    ⚡ Higher Difficulty = More Rewards
                                </span>
                            </div>
                        </div>

                        {/* Difficulty Cards */}
                        <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
                            {/* Beginner Card */}
                            <div 
                                className="group relative bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl border border-green-400/30 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
                                onClick={() => {
                                    console.log("🔍 Beginner clicked");
                                    handleStartGame("beginner");
                                }}
                            >
                                {/* Card Background Effects */}
                                <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                                
                                <div className="relative z-10 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                                <span className="text-2xl">🌱</span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Beginner</h3>
                                                <p className="text-sm text-green-300">Perfect for new players</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-400">Easy</div>
                                            <div className="text-xs text-green-300">Slow Speed</div>
                                        </div>
                            </div>
                            
                                    <div className="bg-black/20 rounded-xl p-4 mb-4">
                                        <div className="flex items-center justify-center gap-6">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-white">🎯 +1</div>
                                                <div className="text-xs text-gray-300">Pipe Points</div>
                                            </div>
                                            <div className="w-px h-8 bg-white/20"></div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-white">🪙 +1</div>
                                                <div className="text-xs text-gray-300">Coin Points</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-center">
                                        <span className="text-sm font-semibold text-green-300">
                                            👆 Tap to Start
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Intermediate Card */}
                            <div 
                                className="group relative bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm rounded-2xl border border-yellow-400/30 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
                                onClick={() => handleStartGame("intermediate")}
                            >
                                {/* Card Background Effects */}
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                                
                                <div className="relative z-10 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                                <span className="text-2xl">⚡</span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Intermediate</h3>
                                                <p className="text-sm text-yellow-300">For skilled players</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-yellow-400">Medium</div>
                                            <div className="text-xs text-yellow-300">Normal Speed</div>
                                        </div>
                            </div>
                            
                                    <div className="bg-black/20 rounded-xl p-4 mb-4">
                                        <div className="flex items-center justify-center gap-6">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-white">🎯 +2</div>
                                                <div className="text-xs text-gray-300">Pipe Points</div>
                                            </div>
                                            <div className="w-px h-8 bg-white/20"></div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-white">🪙 +1</div>
                                                <div className="text-xs text-gray-300">Coin Points</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-center">
                                        <span className="text-sm font-semibold text-yellow-300">
                                            👆 Tap to Start
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expert Card */}
                            <div 
                                className="group relative bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl border border-red-400/30 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
                                onClick={() => handleStartGame("expert")}
                            >
                                {/* Card Background Effects */}
                                <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-pink-500"></div>
                                
                                <div className="relative z-10 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                                <span className="text-2xl">🔥</span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Expert</h3>
                                                <p className="text-sm text-red-300">Maximum challenge</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-red-400">Hard</div>
                                            <div className="text-xs text-red-300">Fast Speed</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-black/20 rounded-xl p-4 mb-4">
                                        <div className="flex items-center justify-center gap-6">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-white">🎯 +3</div>
                                                <div className="text-xs text-gray-300">Pipe Points</div>
                                            </div>
                                            <div className="w-px h-8 bg-white/20"></div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-white">🪙 +1</div>
                                                <div className="text-xs text-gray-300">Coin Points</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-center">
                                        <span className="text-sm font-semibold text-red-300">
                                            👆 Tap to Start
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pro Tip */}
                        <div className="mt-8 text-center">
                            <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30 max-w-sm">
                                <p className="text-sm text-blue-200">
                                    💡 <strong>Pro Tip:</strong> Higher difficulty levels give more points per pipe, but the game moves faster!
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 w-full flex justify-center">
                        <button 
                            className="py-3 mt-3 px-6 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-bold shadow active:scale-95 border border-white/20 transition-all duration-200" 
                            onClick={() => setMode("")}
                        >
                            ← Back to Menu
                        </button>
                    </div>
                </div>
                
                {/* Desktop difficulty selection */}
                <div className="hidden md:block p-8 text-center bg-gradient-to-br from-blue-800/90 via-indigo-700/90 to-blue-600/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-2xl">🔵</span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                            </div>
                            <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">Flapbitrum</h1>
                        </div>
                        <p className="mb-6 text-lg font-semibold text-blue-100">Select Difficulty Level</p>
                        <div className="space-y-4 mb-6">
                            <div className="text-center">
                                <button 
                                    className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 border border-white/20" 
                                    onClick={() => handleStartGame("beginner")}
                                >
                                    🟢 Beginner
                                </button>
                                <div className="mt-2 text-sm text-blue-100 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                    <p className="font-semibold text-green-300">🎯 Pipe: +1 point | 🪙 Coin: +1 point</p>
                                    <p>Perfect for new players!</p>
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <button 
                                    className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 border border-white/20" 
                                    onClick={() => handleStartGame("intermediate")}
                                >
                                    🟡 Intermediate
                                </button>
                                <div className="mt-2 text-sm text-blue-100 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                    <p className="font-semibold text-yellow-300">🎯 Pipe: +2 points | 🪙 Coin: +1 point</p>
                                    <p>Better rewards for skilled players!</p>
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <button 
                                    className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-red-600 hover:to-pink-700 transition-all duration-200 border border-white/20" 
                                    onClick={() => handleStartGame("expert")}
                                >
                                    🔴 Expert
                                </button>
                                <div className="mt-2 text-sm text-blue-100 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                    <p className="font-semibold text-red-300">🎯 Pipe: +3 points | 🪙 Coin: +1 point</p>
                                    <p>Maximum rewards for pros!</p>
                                </div>
                            </div>
                        </div>
                        <button 
                            className="w-full py-3 px-6 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-2xl font-bold shadow active:scale-95 transition-all duration-200 border border-white/20" 
                            onClick={() => setMode("")}
                        >
                            ← Back to Menu
                        </button>
                    </div>
                </div>
            </div>
        </>
        );
    }

    if (gameOver) {
        return (
            <>
                <WalletConnection />
                <div ref={cardRef} className={`${cardStyle} animate-fadein`}>
                {/* Mobile fullscreen game over */}
                <div className="md:hidden h-full flex flex-col bg-gradient-to-br from-blue-600/90 to-indigo-600/90 text-white relative">
                    <canvas 
                        ref={canvasRef} 
                        width={canvasDimensions.width}
                        height={canvasDimensions.height}
                        className="absolute inset-0 w-full h-full object-cover opacity-30" 
                    />
                    <div className="relative z-10 flex-1 flex flex-col justify-center items-center p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-extrabold drop-shadow-lg mb-4 top-6 ">🔵 Game Over</h2>
                            <h3 className="text-3xl font-bold mb-2">Score: {score}</h3>
                            <h4 className="text-xl font-semibold mb-2 text-blue-200 capitalize">{level} Mode</h4>
                            <h5 className="text-lg font-medium mb-4 text-blue-300">
                                {level === 'beginner' ? '🎯 Pipe: +1 point | 🪙 Coin: +1 point' : 
                                 level === 'intermediate' ? '🎯 Pipe: +2 points | 🪙 Coin: +1 point' : 
                                 '🎯 Pipe: +3 points | 🪙 Coin: +1 point'}
                            </h5>
                            <h6 className="text-lg font-semibold mb-8 text-blue-200">Reached Level: {Math.floor(difficulty * 10) / 10}x</h6>
                            
                            {/* Smart Contract Integration */}
                            {isClient && isConnected ? (
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
                                    <h4 className="text-lg font-semibold mb-3 text-blue-200">🏆 Your Game Stats</h4>
                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex justify-between">
                                            <span>Current Score:</span>
                                            <span className="font-bold">{score}</span>
                                        </div>
                                        {/* <div className="flex justify-between">
                                            <span>Best Score:</span>
                                            <span className="font-bold">{contractScore}</span>
                                        </div> */}
                                        <div className="flex justify-between">
                                            <span>Your Rank:</span>
                                            <span className="font-bold">#{myRank || 'N/A'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Save to Chain Button */}
                                    {score > contractScore && !isSavingScore && !scoreSaved && (
                                        <button
                                            onClick={handleSaveToChain}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg active:scale-95 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 mb-3"
                                        >
                                            🏆 Save Score to Compete on Leaderboard
                                        </button>
                                    )}
                                    
                                    {isSavingScore && (
                                        <div className="text-center text-yellow-300 py-3">
                                            💾 Saving score to blockchain...
                                        </div>
                                    )}
                                    
                                    {scoreSaved && (
                                        <div className="text-center text-green-300 py-3">
                                            ✅ Score saved to blockchain!
                                        </div>
                                    )}
                                    
                                    {score <= contractScore && !isSavingScore && !scoreSaved && (
                                        <div className="text-center text-gray-300 py-3">
                                            💡 Score not higher than your best ({contractScore})
                                        </div>
                                    )}
                                </div>
                            ) : isClient && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
                                    <h4 className="text-lg font-semibold mb-2 text-blue-200">🔗 Connect Wallet</h4>
                                    <p className="text-sm text-blue-300 mb-3">Connect your wallet to save scores to the blockchain!</p>
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow active:scale-95 transition-all duration-200"
                                    >
                                        🔗 Connect Wallet
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4 w-full max-w-xs">
                            {/* Cast Score Button - Show for all scores */}
                            {score >= 1 && (
                                <button 
                                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-purple-600 hover:to-pink-700 transition-all duration-200 border border-white/20" 
                                    onClick={handleCastScore}
                                >
                                    📢 Cast Score on Farcaster
                                </button>
                            )}
                            <button 
                                className="w-full py-5 px-8 bg-white/20 backdrop-blur-sm text-white text-xl rounded-3xl font-bold shadow-lg active:scale-95 border-2 border-white/30 transition-all duration-200" 
                                onClick={() => setGameStarted(false)}
                            >
                                🔄 Play Again
                            </button>
                            <button 
                                className="w-full py-4 px-6 bg-white/10 backdrop-blur-sm text-white text-lg rounded-2xl font-bold shadow active:scale-95 border border-white/20 transition-all duration-200" 
                                onClick={() => setMode("")}
                            >
                                ← Back to Menu
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Desktop game over */}
                <div className="hidden md:block p-6 text-center bg-white/90 rounded-2xl shadow-xl">
                    <div className="mb-4">
                        <h2 className="text-3xl text-blue-500 font-extrabold drop-shadow mb-2">🔵 Game Over</h2>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Score: {score}</h3>
                        <h4 className="text-lg font-semibold text-blue-600 mb-2 capitalize">{level} Mode</h4>
                        <h5 className="text-sm font-medium text-blue-500 mb-4">
                            {level === 'beginner' ? '🎯 Pipe: +1 point | 🪙 Coin: +1 point' : 
                             level === 'intermediate' ? '🎯 Pipe: +2 points | 🪙 Coin: +1 point' : 
                             '🎯 Pipe: +3 points | 🪙 Coin: +1 point'}
                        </h5>
                        <h6 className="text-lg font-semibold text-blue-600 mb-4">Reached Level: {Math.floor(difficulty * 10) / 10}x</h6>
                        
                        {/* Smart Contract Integration */}
                        {isClient && isConnected ? (
                            <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                                <h4 className="text-lg font-semibold mb-3 text-blue-700">🏆 Your Game Stats</h4>
                                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                    <div className="text-center">
                                        <div className="text-gray-600">Current Score</div>
                                        <div className="font-bold text-blue-700">{score}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-600">Best Score</div>
                                        <div className="font-bold text-blue-700">{contractScore}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-600">Your Rank</div>
                                        <div className="font-bold text-blue-700">#{myRank || 'N/A'}</div>
                                    </div>
                                </div>
                                
                                {/* Save to Chain Button */}
                                {score > contractScore && !isSavingScore && !scoreSaved && (
                                    <button
                                        onClick={handleSaveToChain}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg active:scale-95 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 mb-3"
                                    >
                                        🏆 Save Score to Compete on Leaderboard
                                    </button>
                                )}
                                
                                {isSavingScore && (
                                    <div className="text-center text-yellow-600 py-3">
                                        💾 Saving score to blockchain...
                                    </div>
                                )}
                                
                                {scoreSaved && (
                                    <div className="text-center text-green-600 py-3">
                                        ✅ Score saved to blockchain!
                                    </div>
                                )}
                                
                                {score <= contractScore && !isSavingScore && !scoreSaved && (
                                    <div className="text-center text-gray-500 py-3">
                                        💡 Score not higher than your best ({contractScore})
                                    </div>
                                )}
                            </div>
                        ) : isClient && (
                            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                                <h4 className="text-lg font-semibold mb-2 text-gray-700">🔗 Connect Wallet</h4>
                                <p className="text-sm text-gray-600 mb-3">Connect your wallet to save scores to the blockchain!</p>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow active:scale-95 transition-all duration-200"
                                >
                                    🔗 Connect Wallet
                                </button>
                            </div>
                        )}
                        
                        <canvas 
                            ref={canvasRef} 
                            width={canvasDimensions.width}
                            height={canvasDimensions.height}
                            className="w-full h-auto rounded-xl border-2 border-blue-300 shadow mb-4" 
                        />
                        <div className="space-y-3">
                            {/* Cast Score Button - Show for all scores */}
                            {score >= 1 && (
                                <button 
                                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-purple-600 hover:to-pink-700 transition-all duration-200" 
                                    onClick={handleCastScore}
                                >
                                    📢 Cast Score on Farcaster
                                </button>
                            )}
                            <button 
                                className="w-full py-4 px-6 bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-blue-500 hover:to-indigo-600 transition-all duration-200" 
                                onClick={() => setGameStarted(false)}
                            >
                                🔄 Play Again
                            </button>
                            <button 
                                className="w-full py-3 px-6 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-2xl font-bold shadow active:scale-95 transition-all duration-200" 
                                onClick={() => setMode("")}
                            >
                                ← Back to Menu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
        );
    }

    // Main game running view - Mobile fullscreen
    return (
        <>
                <WalletConnection />
            {/* Countdown Overlay - Outside main container */}
            {showCountdown && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
                    <div className="text-center">
                        {countdown && countdown > 0 ? (
                            <div className="text-8xl md:text-9xl font-bold text-white animate-pulse drop-shadow-2xl">
                                {countdown}
                            </div>
                        ) : (
                            <div className="text-6xl md:text-7xl font-bold text-green-400 animate-bounce drop-shadow-2xl">
                                GO!
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <div className="fixed inset-0 bg-black md:relative md:bg-transparent md:inset-auto">
                <canvas 
                    ref={canvasRef} 
                    width={canvasDimensions.width}
                    height={canvasDimensions.height}
                    className="w-full h-full md:w-auto md:h-auto md:max-w-md md:mx-auto md:rounded-xl md:border-2 md:border-blue-300 md:shadow touch-none select-none" 
                    style={{ 
                        touchAction: 'none',
                        display: 'block'
                    }}
                />
            
            {/* Mobile UI overlays */}
            <div className="md:hidden">
                {/* Score, Difficulty, and Menu */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                    <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                        <h2 className="text-xl font-bold text-white drop-shadow">Score: {score}</h2>
                    </div>
                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <h3 className="text-sm font-bold text-white drop-shadow capitalize">{level}</h3>
                        <h4 className="text-xs text-white/80 drop-shadow">
                            {level === 'beginner' ? '🎯+1 🪙+1' : 
                             level === 'intermediate' ? '🎯+2 🪙+1' : '🎯+3 🪙+1'}
                        </h4>
                        <div className="w-full bg-black/30 rounded-full h-1 mt-1">
                            <div 
                                className="bg-gradient-to-r from-blue-400 to-indigo-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (difficulty - 1) * 50)}%` }}
                            ></div>
                        </div>
                    </div>
                    <button 
                        className="bg-black/50 backdrop-blur-sm py-2 px-4 text-white text-sm rounded-full font-bold shadow active:scale-95 transition-all duration-200" 
                        onClick={() => setMode("")}
                    >
                        Menu
                    </button>
                </div>
                
                {/* Instructions and Difficulty Info */}
                <div className="absolute bottom-6 left-4 right-4 text-center z-10 space-y-2">
                    <p className="text-white text-sm bg-black/50 backdrop-blur-sm inline-block px-4 py-2 rounded-full">Tap screen to jump!</p>
                    <p className="text-white text-xs bg-black/30 backdrop-blur-sm inline-block px-3 py-1 rounded-full">Difficulty increases every 10 seconds</p>
                </div>
            </div>
            
            {/* Desktop UI */}
            <div className="hidden md:block p-4 bg-white/90 rounded-2xl shadow-xl max-w-md mx-auto mt-4">
                <div className="mb-3 text-center">
                    <h2 className="text-xl font-bold text-blue-700 drop-shadow">Score: {score}</h2>
                    <h3 className="text-lg font-semibold text-blue-600 drop-shadow capitalize">{level}</h3>
                    <h4 className="text-sm text-blue-500 drop-shadow">
                        {level === 'beginner' ? '🎯 Pipe: +1 point | 🪙 Coin: +1 point' : 
                         level === 'intermediate' ? '🎯 Pipe: +2 points | 🪙 Coin: +1 point' : 
                         '🎯 Pipe: +3 points | 🪙 Coin: +1 point'}
                    </h4>
                    <h5 className="text-xs text-gray-600 drop-shadow">Difficulty: {Math.floor(difficulty * 10) / 10}x</h5>
                </div>
                <div className="mt-3 text-center">
                    <p className="text-sm text-gray-600">Tap screen to jump!</p>
                    <button 
                        className="mt-2 py-2 px-4 bg-gradient-to-r from-gray-400 to-gray-600 text-white text-sm rounded-xl font-bold shadow active:scale-95 transition-all duration-200" 
                        onClick={() => setMode("")}
                    >
                        ← Menu
                    </button>
                </div>
            </div>
        </div>

        {/* Reward Info Popup */}
        <RewardInfoPopup 
          isOpen={showRewardInfo}
          onClose={() => setShowRewardInfo(false)}
          localStorageKey="flapbitrum_home_reward_info_seen"
        />
        </>
    );
};

export default FlappyBirdGame;
