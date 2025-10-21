"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useSetScore, useMyGameData } from '../../smartcontracthooks';
import { useSetScoreWithMongo } from '../../smartcontracthooks/useFlappyContractWithMongo';
import { useCurrentActiveWeek } from '../../smartcontracthooks/useWeeklyEvents';
import { useStartGame } from '../../smartcontracthooks/useStartGame';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { CONTRACT_ADDRESSES, TOKEN_REWARD_ABI } from '../../lib/claimcontract';
import { useFrame } from '../farcaster-provider';
import RewardInfoPopup from './RewardInfoPopup';
import GiftBox from './GiftBox';
import TokenBalanceDisplay from '../ui/TokenBalanceDisplay';
import { APP_URL } from '../../lib/constants';
import { authenticatedFetch } from '../../lib/auth';
import { formatEther } from 'viem';

export function startGame(
    canvasRef: React.RefObject<HTMLCanvasElement>,
    setGameStarted: React.Dispatch<React.SetStateAction<boolean>>,
    setGameOver: React.Dispatch<React.SetStateAction<boolean>>,
    gameOverRef: React.MutableRefObject<boolean>,
    setScore: React.Dispatch<React.SetStateAction<number>>,
    setDifficulty: React.Dispatch<React.SetStateAction<number>>,
    level: string,
    canvasDimensions: { width: number; height: number },
    onGameOver?: (finalScore: number) => void,
    resetSuccess?: () => void
) {
    startGameLogic(canvasRef, setGameStarted, setGameOver, gameOverRef, setScore, setDifficulty, level, canvasDimensions, onGameOver, resetSuccess);
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
    onGameOver?: (finalScore: number) => void,
    resetSuccess?: () => void
) {
    const canvas = canvasRef.current;
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }
    
        const context = canvas.getContext("2d");
    if (!context) {
        console.error("Canvas context not available");
        return;
    }
    
    // Additional check for canvas context validity (important for Farcaster/iframe)
    try {
        context.fillStyle = "#000000";
        context.clearRect(0, 0, 1, 1);
    } catch (error) {
        console.error("Canvas context not working properly:", error);
        return;
    }

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

        // coins and power-ups
        let coinArray: any[] = [];
        let powerUpArray: any[] = [];
        const coinSize = 24;
        const powerUpSize = 28;
        
        // Power-up types with different effects
        const powerUpTypes = [
            { 
                type: 'shield', 
                color: '#FFD700', 
                secondaryColor: '#FFA500',
                chance: 0.08, 
                effect: 'protection',
                duration: 15000, // 15 seconds of protection
                symbol: '🛡️',
                points: 5
            },
            { 
                type: 'speed', 
                color: '#00FF00', 
                secondaryColor: '#32CD32',
                chance: 0.06, 
                effect: 'speedBoost',
                duration: 8000, // 8 seconds
                symbol: '⚡',
                points: 3
            },
            { 
                type: 'multiplier', 
                color: '#FF00FF', 
                secondaryColor: '#DA70D6',
                chance: 0.04, 
                effect: '2xScore',
                duration: 10000, // 10 seconds
                symbol: '✨',
                points: 8
            },
            { 
                type: 'diamond', 
                color: '#00FFFF', 
                secondaryColor: '#87CEEB',
                chance: 0.02, 
                effect: 'bonus',
                duration: 0, // Instant effect
                symbol: '💎',
                points: 15
            }
        ];
        
        // Active power-up effects
        let activePowerUps = {
            shield: { active: false, endTime: 0 },
            speedBoost: { active: false, endTime: 0 },
            scoreMultiplier: { active: false, endTime: 0, multiplier: 2 }
        };

        // Power-up notification system
        let powerUpNotifications: Array<{
            type: any;
            startTime: number;
            duration: number;
            points: number;
        }> = [];

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
        const playSound = (type: 'coin' | 'crash' | 'oops' | 'whoosh' | 'countdown' | 'go' | 'powerup' | 'shield') => {
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
                        
                    case 'powerup':
                        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
                        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3);
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                        oscillator.type = 'sine';
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.4);
                        break;
                        
                    case 'shield':
                        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                        oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.15);
                        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                        oscillator.type = 'triangle';
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
        const playPowerUpSound = () => playSound('powerup');
        const playShieldSound = () => playSound('shield');

        // Function to add power-up notification
        const addPowerUpNotification = (powerUpType: any, points: number) => {
            powerUpNotifications.push({
                type: powerUpType,
                startTime: Date.now(),
                duration: 3000, // 3 seconds
                points: points
            });
        };

        // Function to draw power-up notifications
        const drawPowerUpNotifications = (ctx: CanvasRenderingContext2D, currentTime: number) => {
            // Remove expired notifications
            powerUpNotifications = powerUpNotifications.filter(notification => 
                currentTime - notification.startTime < notification.duration
            );

            // Draw active notifications
            powerUpNotifications.forEach((notification, index) => {
                const elapsed = currentTime - notification.startTime;
                const progress = elapsed / notification.duration;
                const alpha = Math.max(0, 1 - progress); // Fade out over time
                
                // Position notifications stacked vertically
                const notificationX = boardWidth / 2;
                const notificationY = 100 + (index * 80);
                const notificationWidth = 280;
                const notificationHeight = 70;
                
                // Draw notification background with fade
                ctx.globalAlpha = alpha * 0.9;
                const gradient = ctx.createLinearGradient(
                    notificationX - notificationWidth/2, notificationY - notificationHeight/2,
                    notificationX + notificationWidth/2, notificationY + notificationHeight/2
                );
                gradient.addColorStop(0, notification.type.color + '40');
                gradient.addColorStop(0.5, notification.type.secondaryColor + '60');
                gradient.addColorStop(1, notification.type.color + '40');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(
                    notificationX - notificationWidth/2, 
                    notificationY - notificationHeight/2,
                    notificationWidth, 
                    notificationHeight
                );
                
                // Draw border
                ctx.strokeStyle = notification.type.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    notificationX - notificationWidth/2, 
                    notificationY - notificationHeight/2,
                    notificationWidth, 
                    notificationHeight
                );
                
                // Draw power-up icon
                ctx.globalAlpha = alpha;
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(
                    notification.type.symbol, 
                    notificationX - notificationWidth/2 + 30, 
                    notificationY - 5
                );
                
                // Draw power-up name and effect
                ctx.font = 'bold 16px Arial';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'left';
                
                let powerUpName = '';
                let effectText = '';
                
                switch (notification.type.effect) {
                    case 'protection':
                        powerUpName = 'SHIELD ACTIVATED!';
                        effectText = 'Protects from collisions for 15s';
                        break;
                    case 'speedBoost':
                        powerUpName = 'SPEED BOOST!';
                        effectText = 'Reduced gravity for 8 seconds';
                        break;
                    case '2xScore':
                        powerUpName = 'SCORE MULTIPLIER!';
                        effectText = '2X points for 10 seconds';
                        break;
                    case 'bonus':
                        powerUpName = 'RARE DIAMOND!';
                        effectText = 'High value bonus points';
                        break;
                }
                
                ctx.fillText(
                    powerUpName, 
                    notificationX - notificationWidth/2 + 60, 
                    notificationY - 15
                );
                
                // Draw effect description
                ctx.font = '12px Arial';
                ctx.fillStyle = '#E0E0E0';
                ctx.fillText(
                    effectText, 
                    notificationX - notificationWidth/2 + 60, 
                    notificationY + 5
                );
                
                // Draw points gained
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.textAlign = 'right';
                ctx.fillText(
                    `+${notification.points} pts`, 
                    notificationX + notificationWidth/2 - 10, 
                    notificationY
                );
                
                // Reset alpha
                ctx.globalAlpha = 1;
            });
        };

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

        // Draw power-up function
        const drawPowerUp = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, powerUpType: any, animationFrame: number) => {
            // Create animated glow effect
            const glowRadius = size/2 + Math.sin(animationFrame * 0.1) * 3;
            const gradient = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, glowRadius);
            gradient.addColorStop(0, powerUpType.color);
            gradient.addColorStop(0.7, powerUpType.secondaryColor);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            // Draw glow
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, glowRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw main power-up body
            const mainGradient = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size/2);
            mainGradient.addColorStop(0, powerUpType.color);
            mainGradient.addColorStop(0.6, powerUpType.secondaryColor);
            mainGradient.addColorStop(1, powerUpType.color);
            
            ctx.fillStyle = mainGradient;
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add pulsing inner circle
            const pulseSize = size/3 + Math.sin(animationFrame * 0.15) * 2;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, pulseSize, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw symbol
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${size/2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUpType.symbol, x + size/2, y + size/2);
            
            // Add sparkle particles around power-up
            for (let i = 0; i < 3; i++) {
                const angle = (animationFrame * 0.05 + i * Math.PI * 2 / 3);
                const sparkleX = x + size/2 + Math.cos(angle) * (size/2 + 10);
                const sparkleY = y + size/2 + Math.sin(angle) * (size/2 + 10);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 1.5, 0, 2 * Math.PI);
                ctx.fill();
            }
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
                try {
                    // Clear and render game over screen
                context.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw background
                    if (bgImg.complete && bgImg.naturalHeight !== 0) {
                context.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                    } else {
                        // Fallback background color
                        context.fillStyle = "#0D2B5E";
                        context.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    // Draw semi-transparent overlay
                    context.fillStyle = "rgba(0, 0, 0, 0.7)";
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw game over text with better styling
                    context.font = "bold 48px Arial, sans-serif";
                    context.fillStyle = "#FF4444";
                    context.strokeStyle = "#FFFFFF";
                    context.lineWidth = 2;
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    
                    const gameOverText = "Game Over";
                    context.strokeText(gameOverText, canvas.width / 2, canvas.height / 2 - 25);
                    context.fillText(gameOverText, canvas.width / 2, canvas.height / 2 - 25);
                    
                    // Draw score with better styling
                    context.font = "bold 32px Arial, sans-serif";
                context.fillStyle = "#28A0F0";
                    const scoreText = `Score: ${score}`;
                    context.strokeText(scoreText, canvas.width / 2, canvas.height / 2 + 25);
                    context.fillText(scoreText, canvas.width / 2, canvas.height / 2 + 25);
                    
                    // Draw restart instruction
                    context.font = "bold 20px Arial, sans-serif";
                    context.fillStyle = "#FFFFFF";
                    const restartText = "Tap to play again";
                    context.fillText(restartText, canvas.width / 2, canvas.height / 2 + 70);
                    
                } catch (error) {
                    console.error("Error rendering game over screen:", error);
                    // Fallback: just clear the canvas
                    context.fillStyle = "#0D2B5E";
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.fillStyle = "#FFFFFF";
                    context.font = "bold 24px Arial";
                context.textAlign = "center";
                    context.fillText("Game Over - Tap to restart", canvas.width / 2, canvas.height / 2);
                }
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
            try {
                // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

                // Draw background with fallback
                if (bgImg.complete && bgImg.naturalHeight !== 0) {
            context.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                } else {
                    context.fillStyle = "#0D2B5E";
                    context.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Update bird physics
            velocityY += gravity;
            bird.y = Math.max(bird.y + velocityY, 0);

                // Check bounds collision
            if (bird.y >= canvas.height - bird.height || bird.y <= 0) {
                playOopsSound(); // Play funny sound when hitting ground/ceiling
                    console.log("🔍 Game over - bird hit ground/ceiling, setting gameOver to true");
                setGameOver(true);
                gameOverRef.current = true;
                if (onGameOver) onGameOver(score);
                return;
            }

                // Draw bird with fallback
                if (birdImg.complete && birdImg.naturalHeight !== 0) {
            context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
                } else {
                    // Fallback bird drawing
                    context.fillStyle = "#28A0F0";
                    context.fillRect(bird.x, bird.y, bird.width, bird.height);
                }
            } catch (error) {
                console.error("Error in main drawing operations:", error);
                // Continue with simplified rendering
                context.fillStyle = "#0D2B5E";
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.fillStyle = "#28A0F0";
                context.fillRect(bird.x, bird.y, bird.width, bird.height);
            }

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
                    const points = coinScoreMultiplier * (activePowerUps.scoreMultiplier.active ? activePowerUps.scoreMultiplier.multiplier : 1);
                    score += points;
                    setScore(score);
                    coinArray.splice(i, 1); // Remove coin
                }
                
                // Remove coins that are off screen
                if (coin.x + coinSize < 0) {
                    coinArray.splice(i, 1);
                }
            }

            // Update power-up effects
            const currentTime = Date.now();
            
            // Check shield expiration
            if (activePowerUps.shield.active && currentTime > activePowerUps.shield.endTime) {
                activePowerUps.shield.active = false;
            }
            
            // Check speed boost expiration
            if (activePowerUps.speedBoost.active && currentTime > activePowerUps.speedBoost.endTime) {
                activePowerUps.speedBoost.active = false;
                gravity = 0.3 + (difficultyMultiplier - 1) * 0.05; // Reset to normal gravity
            }
            
            // Check score multiplier expiration
            if (activePowerUps.scoreMultiplier.active && currentTime > activePowerUps.scoreMultiplier.endTime) {
                activePowerUps.scoreMultiplier.active = false;
            }

            // Update and draw power-ups
            for (let i = powerUpArray.length - 1; i >= 0; i--) {
                const powerUp = powerUpArray[i];
                powerUp.x += velocityX;
                
                // Draw power-up with animation
                drawPowerUp(context, powerUp.x, powerUp.y, powerUpSize, powerUp.type, currentTime);
                
                // Check collision with bird
                if (bird.x < powerUp.x + powerUpSize &&
                    bird.x + bird.width > powerUp.x &&
                    bird.y < powerUp.y + powerUpSize &&
                    bird.y + bird.height > powerUp.y) {
                    
                    // Power-up collected!
                    const powerUpType = powerUp.type;
                    
                    // Calculate points (before applying new multiplier)
                    const points = powerUpType.points * (activePowerUps.scoreMultiplier.active ? activePowerUps.scoreMultiplier.multiplier : 1);
                    
                    // Apply power-up effect
                    switch (powerUpType.effect) {
                        case 'protection':
                            activePowerUps.shield.active = true;
                            activePowerUps.shield.endTime = currentTime + powerUpType.duration;
                            playShieldSound();
                            break;
                        case 'speedBoost':
                            activePowerUps.speedBoost.active = true;
                            activePowerUps.speedBoost.endTime = currentTime + powerUpType.duration;
                            gravity = 0.15; // Reduced gravity for easier control
                            playPowerUpSound();
                            break;
                        case '2xScore':
                            activePowerUps.scoreMultiplier.active = true;
                            activePowerUps.scoreMultiplier.endTime = currentTime + powerUpType.duration;
                            activePowerUps.scoreMultiplier.multiplier = 2;
                            playPowerUpSound();
                            break;
                        case 'bonus':
                            playPowerUpSound();
                            break;
                    }
                    
                    // Add notification
                    addPowerUpNotification(powerUpType, points);
                    
                    // Add points for collecting power-up
                    score += points;
                    setScore(score);
                    powerUpArray.splice(i, 1); // Remove power-up
                }
                
                // Remove power-ups that are off screen
                if (powerUp.x + powerUpSize < 0) {
                    powerUpArray.splice(i, 1);
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
                            const points = pipeScoreMultiplier * (activePowerUps.scoreMultiplier.active ? activePowerUps.scoreMultiplier.multiplier : 1);
                            score += points;
                            setScore(score);
                            playWhooshSound(); // Play whoosh sound for successful pipe pass
                        }
                    } else {
                        const topPipeIndex = i - 1;
                        if (pipeArray[topPipeIndex] && pipeArray[topPipeIndex].passed) {
                            const points = pipeScoreMultiplier * (activePowerUps.scoreMultiplier.active ? activePowerUps.scoreMultiplier.multiplier : 1);
                            score += points;
                            setScore(score);
                            playWhooshSound(); // Play whoosh sound for successful pipe pass
                        }
                    }
                }

                if (detectCollision(bird, pipe)) {
                    if (activePowerUps.shield.active) {
                        // Shield protects from collision
                        playShieldSound();
                        
                        // Visual feedback for shield activation
                        context.fillStyle = "rgba(255, 215, 0, 0.5)";
                        context.fillRect(0, 0, canvas.width, canvas.height);
                    } else {
                        // Game over - let the main game over logic handle rendering
                    playCrashSound(); // Play bomb sound when hitting pipe
                        console.log("🔍 Game over - bird hit pipe, setting gameOver to true");
                    setGameOver(true);
                    gameOverRef.current = true;
                    if (onGameOver) onGameOver(score);
                        return; // Exit update loop, let game over rendering take over
                    }
                }
            }

            while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
                pipeArray.shift();
            }

            // Draw active power-up indicators in center of screen with transparent design
            const activePowerUpsArray = [];
            
            // Collect active power-ups
            if (activePowerUps.shield.active) {
                const timeLeft = Math.max(0, activePowerUps.shield.endTime - currentTime);
                const progress = timeLeft / 15000;
                const secondsLeft = Math.ceil(timeLeft / 1000);
                activePowerUpsArray.push({
                    type: 'shield',
                    icon: '🛡️',
                    color: '#FFD700',
                    secondaryColor: '#FFA500',
                    progress: progress,
                    secondsLeft: secondsLeft,
                    text: `${secondsLeft}s`
                });
            }
            
            if (activePowerUps.speedBoost.active) {
                const timeLeft = Math.max(0, activePowerUps.speedBoost.endTime - currentTime);
                const progress = timeLeft / 8000;
                const secondsLeft = Math.ceil(timeLeft / 1000);
                activePowerUpsArray.push({
                    type: 'speed',
                    icon: '⚡',
                    color: '#00FF00',
                    secondaryColor: '#32CD32',
                    progress: progress,
                    secondsLeft: secondsLeft,
                    text: `${secondsLeft}s`
                });
            }
            
            if (activePowerUps.scoreMultiplier.active) {
                const timeLeft = Math.max(0, activePowerUps.scoreMultiplier.endTime - currentTime);
                const progress = timeLeft / 10000;
                const secondsLeft = Math.ceil(timeLeft / 1000);
                activePowerUpsArray.push({
                    type: 'multiplier',
                    icon: '✨',
                    color: '#FF00FF',
                    secondaryColor: '#DA70D6',
                    progress: progress,
                    secondsLeft: secondsLeft,
                    text: `2X ${secondsLeft}s`
                });
            }
            
            // Draw power-up indicators in center-top area
            if (activePowerUpsArray.length > 0) {
                const centerX = boardWidth / 2;
                const startY = 60; // Below score area but visible
                const indicatorWidth = 100;
                const indicatorHeight = 20;
                const spacing = 5;
                
                activePowerUpsArray.forEach((powerUp, index) => {
                    const y = startY + index * (indicatorHeight + spacing);
                    
                    // Draw semi-transparent background
                    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    context.fillRect(centerX - indicatorWidth/2, y, indicatorWidth, indicatorHeight);
                    
                    // Draw progress bar background
                    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    context.fillRect(centerX - indicatorWidth/2 + 2, y + 2, indicatorWidth - 4, indicatorHeight - 4);
                    
                    // Draw progress bar fill
                    const fillWidth = (indicatorWidth - 4) * powerUp.progress;
                    const gradient = context.createLinearGradient(
                        centerX - indicatorWidth/2 + 2, y + 2,
                        centerX - indicatorWidth/2 + 2 + fillWidth, y + 2
                    );
                    gradient.addColorStop(0, powerUp.color + '80'); // 50% opacity
                    gradient.addColorStop(1, powerUp.secondaryColor + '80');
                    context.fillStyle = gradient;
                    context.fillRect(centerX - indicatorWidth/2 + 2, y + 2, fillWidth, indicatorHeight - 4);
                    
                    // Draw icon
                    context.font = 'bold 14px Arial';
                    context.textAlign = 'left';
                    context.textBaseline = 'middle';
                    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    context.fillText(powerUp.icon, centerX - indicatorWidth/2 + 6, y + indicatorHeight/2);
                    
                    // Draw countdown text
                    context.font = 'bold 12px Arial';
                    context.textAlign = 'right';
                    context.fillStyle = powerUp.color;
                    context.fillText(powerUp.text, centerX + indicatorWidth/2 - 6, y + indicatorHeight/2);
                    
                    // Add subtle glow effect
                    context.shadowColor = powerUp.color;
                    context.shadowBlur = 3;
                    context.strokeStyle = powerUp.color + '60';
                    context.lineWidth = 1;
                    context.strokeRect(centerX - indicatorWidth/2, y, indicatorWidth, indicatorHeight);
                    context.shadowBlur = 0; // Reset shadow
                });
            }

            // Draw power-up notifications
            drawPowerUpNotifications(context, currentTime);

            try {
            requestAnimationFrame(update);
            } catch (error) {
                console.error("Error in game update loop:", error);
                // Try to recover by stopping the game gracefully
                console.log("🔍 Game over - error in update loop, setting gameOver to true");
                setGameOver(true);
                gameOverRef.current = true;
                if (onGameOver) onGameOver(score);
            }
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

            // Add power-ups (lower chance than coins)
            // Check each power-up type independently
            for (const powerUpType of powerUpTypes) {
                const adjustedChance = powerUpType.chance * (1 + (difficultyMultiplier - 1) * 0.5); // Slightly increase with difficulty
                if (Math.random() < adjustedChance) {
                    // Position power-up randomly in the opening or slightly outside pipes
                    const powerUpX = pipeX + pipeWidth + Math.random() * 100; // Offset from pipe
                    let powerUpY;
                    
                    // 70% chance to spawn in the safe opening, 30% chance near pipes for risk/reward
                    if (Math.random() < 0.7) {
                        powerUpY = randomPipeY + pipeHeight + openingSpace * 0.2 + Math.random() * openingSpace * 0.6;
                    } else {
                        // Risky positions near pipes
                        powerUpY = Math.random() < 0.5 
                            ? randomPipeY + pipeHeight - 30 // Near bottom of top pipe
                            : randomPipeY + pipeHeight + openingSpace + 10; // Near top of bottom pipe
                    }
                    
                    powerUpArray.push({
                        x: powerUpX,
                        y: powerUpY,
                        type: powerUpType
                    });
                    break; // Only spawn one power-up per pipe set to avoid clutter
                }
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
                    powerUpArray = []; // Reset power-ups
                    powerUpNotifications = []; // Reset notifications
                    // Reset power-up effects
                    activePowerUps.shield.active = false;
                    activePowerUps.speedBoost.active = false;
                    activePowerUps.scoreMultiplier.active = false;
                    gravity = 0.3 + (difficultyMultiplier - 1) * 0.05; // Reset gravity
                    setGameOver(false);
                    gameOverRef.current = false;
                    score = 0;
                    setScore(score);
                    // Reset score save success state
                    if (resetSuccess) {
                        resetSuccess();
                    }
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
                powerUpArray = []; // Reset power-ups
                // Reset power-up effects
                activePowerUps.shield.active = false;
                activePowerUps.speedBoost.active = false;
                activePowerUps.scoreMultiplier.active = false;
                gravity = 0.3 + (difficultyMultiplier - 1) * 0.05; // Reset gravity
                setGameOver(false);
                gameOverRef.current = false;
                score = 0;
                setScore(score);
                // Reset score save success state
                if (resetSuccess) {
                    resetSuccess();
                }
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
                powerUpArray = []; // Reset power-ups
                // Reset power-up effects
                activePowerUps.shield.active = false;
                activePowerUps.speedBoost.active = false;
                activePowerUps.scoreMultiplier.active = false;
                gravity = 0.3 + (difficultyMultiplier - 1) * 0.05; // Reset gravity
                setGameOver(false);
                gameOverRef.current = false;
                score = 0;
                setScore(score);
                // Reset score save success state
                if (resetSuccess) {
                    resetSuccess();
                }
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
    const [showPowerUpGuide, setShowPowerUpGuide] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showGiftBox, setShowGiftBox] = useState(false);
    const [pendingGiftBox, setPendingGiftBox] = useState(false);
    const [giftBoxReward, setGiftBoxReward] = useState<any>(null);
    const [isClaimingGiftBox, setIsClaimingGiftBox] = useState(false);
    const [hasClaimedOnChain, setHasClaimedOnChain] = useState(false);
    const { writeContract: writeClaimToken, data: claimTxHash } = useWriteContract();
    const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({ hash: claimTxHash });
    
    // Debug game over state changes
    useEffect(() => {
        console.log("🔍 Game over state changed to:", gameOver);
    }, [gameOver]);
    
    // Debug gift box state changes
    useEffect(() => {
        console.log("🔍 showGiftBox state changed to:", showGiftBox);
    }, [showGiftBox]);
    
    // Debug pending gift box state changes
    useEffect(() => {
        console.log("🔍 pendingGiftBox state changed to:", pendingGiftBox);
    }, [pendingGiftBox]);
    
    // Debug reward info popup state
    useEffect(() => {
        console.log("🔍 Home page - showRewardInfo state changed to:", showRewardInfo)
    }, [showRewardInfo]);
    
    // Smart contract hooks
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { setScore: saveScoreToContract, isPending: isSavingScore, isSuccess: scoreSaved } = useSetScore();
    
    // Get ETH balance
    const { data: ethBalance, isLoading: isLoadingBalance } = useBalance({
        address: address,
    });
    
    // Get current active week
    const { data: currentWeekData } = useCurrentActiveWeek();
    const currentWeek = currentWeekData?.currentWeek;
    const currentEventId = currentWeek?.eventId || 'week-2';
    
    const { setScore: saveScoreToContractWithMongo, isPending: isSavingScoreWithMongo, isConfirming: isConfirmingTransaction, isSuccess: scoreSavedWithMongo, isMongoUpdating, resetSuccess } = useSetScoreWithMongo(currentEventId);
    const { myScore: contractScore, myRank, hasScore, username, fid, pfp } = useMyGameData();
    const { startGame: startGameContract, isPending: isStartingGame, isSuccess: gameStartedOnChain, error: startGameError, reset: resetStartGame } = useStartGame();
    const [isClient, setIsClient] = useState(false);
    const { actions, context, isSDKLoaded } = useFrame();

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

    // Auto-connect wallet when Farcaster SDK is loaded
    useEffect(() => {
        const autoConnect = async () => {
            if (isSDKLoaded && !isConnected && connectors.length > 0) {
                try {
                    console.log("🔗 Auto-connecting wallet via Farcaster...");
                    await connect({ connector: connectors[0] });
                    console.log("✅ Wallet auto-connected successfully");
                } catch (error) {
                    console.error("❌ Auto-connect failed:", error);
                }
            }
        };
        
        autoConnect();
    }, [isSDKLoaded, isConnected, connectors, connect]);

    // Debug current state
    console.log("🔍 Current state - Mode:", mode, "Game Started:", gameStarted, "Game Over:", gameOver, "gameOverRef:", gameOverRef.current);

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

    const handleStartGame = async (selectedLevel: string) => {
        console.log("🔍 handleStartGame called with level:", selectedLevel);
        
        // First, call the startGame contract function if wallet is connected
        if (isConnected && address) {
            try {
                console.log("🔍 Calling startGame contract function...");
                await startGameContract();
                console.log("🔍 startGame contract function completed successfully");
                
                // Only start the game after successful transaction
                startGameAfterTransaction(selectedLevel);
                // Reset the startGame state for next time
                resetStartGame();
            } catch (error) {
                console.error("🔍 Failed to call startGame contract function:", error);
                // Reset the startGame state to clear loading
                resetStartGame();
                // Show error to user and DON'T start the game
                alert(`Failed to register game on blockchain: ${error instanceof Error ? error.message : 'Unknown error'}. Game will not start.`);
                return; // Exit function, don't start the game
            }
        } else {
            // If wallet not connected, show error and don't start game
            alert("Please connect your wallet to start playing!");
            return;
        }
    };

    const startGameAfterTransaction = (selectedLevel: string) => {
        console.log("🔍 Starting game after successful transaction...");
        
        // Reset game state completely
        setGameOver(false);
        gameOverRef.current = false;
        setScore(0);
        setLevel(selectedLevel);
        setMode("single"); // Set mode to single to show game canvas
        setPendingGiftBox(false); // Reset gift box state
        setShowGiftBox(false); // Reset gift box modal
        setGiftBoxReward(null); // Reset gift box reward
        setIsClaimingGiftBox(false); // Reset claiming state
        // Reset score save success state
        if (resetSuccess) {
            resetSuccess();
        }
        
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
        console.log("🔍 Current state - isConnected:", isConnected, "address:", address);
        
        // Auto-save score if conditions are met (allow any positive score)
        if (isConnected && address && finalScore > 0 && !isSavingScoreWithMongo && !isConfirmingTransaction && !scoreSavedWithMongo) {
            console.log("🔍 Auto-saving score to chain ...");
            // Small delay to ensure state is updated
            setTimeout(() => {
                handleSaveToChain();
            }, 100);
        }

        // Check if user can claim gift box - show directly in game over screen
        if (finalScore > 0 && isConnected && address) {
            const farcasterFid = context?.user?.fid || fid || 0;
            const params = new URLSearchParams({ userAddress: address, fid: String(farcasterFid) });
            
            // Check immediately and show gift box directly in game over screen
            console.log("🔍 Checking gift box availability immediately...");
            console.log("🔍 API URL:", `/api/claim-gift-box?${params.toString()}`);
            authenticatedFetch(`/api/claim-gift-box?${params.toString()}`)
              .then(res => {
                console.log("🔍 Gift box API response status:", res.status);
                return res.json();
              })
              .then(data => {
                console.log("🔍 Gift box API response data:", data);
                if (data?.success && data?.canSee) {
                    console.log("🔍 User can see gift box, setting pendingGiftBox to true");
                    setPendingGiftBox(true);
                } else {
                    console.log("🔍 User cannot see gift box:", data);
                }
              })
              .catch((error) => {
                console.log("🔍 Gift box API error:", error);
                // fail-closed: do not show
              });
        }
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
            console.log("🔍 User requested to save score to smart contract and MongoDB:", score);
            
            // Use the enhanced hook that automatically syncs to MongoDB
            saveScoreToContractWithMongo(score, farcasterUsername, farcasterFid, farcasterPfp);
        } else {
            console.log("🔍 Cannot save score - conditions not met");
        }
    };

    const handleDirectGiftBoxClaim = async () => {
        if (!address) {
            console.log("🔍 No wallet connected");
            return;
        }

        setIsClaimingGiftBox(true);
        console.log("🔍 Claiming gift box directly...");

        try {
            const farcasterFid = context?.user?.fid || fid || 0;
            const response = await authenticatedFetch('/api/claim-gift-box', {
                method: 'POST',
                body: JSON.stringify({
                    userAddress: address,
                    fid: farcasterFid
                })
            });

            const result = await response.json();
            console.log("🔍 Gift box claim result:", result);

            if (result.success) {
                setGiftBoxReward(result);
                setPendingGiftBox(false);
                console.log("🔍 Gift box claimed successfully!");
            } else {
                console.log("🔍 Gift box claim failed:", result.error);
            }
        } catch (error) {
            console.error("🔍 Error claiming gift box:", error);
        } finally {
            setIsClaimingGiftBox(false);
        }
    };

    const handleOnChainClaim = async () => {
        if (!giftBoxReward || giftBoxReward.tokenType === 'none') return;
        try {
            console.log("claimimg")
             console.log(giftBoxReward)
            setIsClaimingGiftBox(true);
            const tokenAddress = getTokenAddressFromType(giftBoxReward.tokenType);
            const amountInWei = BigInt(giftBoxReward.amountInWei || '0');
            const nonce = BigInt(giftBoxReward.nonce || '0');
            writeClaimToken({
                address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
                abi: TOKEN_REWARD_ABI,
                functionName: 'claimTokenReward',
                args: [tokenAddress as `0x${string}`, amountInWei, nonce, giftBoxReward.signature as `0x${string}`],
            });
        } catch (e) {
            console.error('On-chain claim failed', e);
            setIsClaimingGiftBox(false);
        }
    };

    useEffect(() => {
        if (isClaimConfirmed && isClaimingGiftBox) {
            setIsClaimingGiftBox(false);
            setHasClaimedOnChain(true);
        }
    }, [isClaimConfirmed, isClaimingGiftBox]);

    const handleShareReward = async () => {
        try {
            if (!giftBoxReward) return;
            const token = String(giftBoxReward.tokenType).toUpperCase();
            const text = `Just claimed ${giftBoxReward.amount.toLocaleString()} ${token} on Flapbitrum! 🎁🔥\n\nThis game is airdropping real tokens. Come try your luck!\n\nPlay now 👉`;
            await actions?.composeCast({
                text: text,
                embeds:[`https://farcaster.xyz/miniapps/rcGxScTRGCs8/flapbitrum`]
            });
            
        } catch (e) {
            console.log('Share failed', e);
        }
    };

    function getTokenAddressFromType(tokenType: 'arb' | 'pepe' | 'boop' | 'bribe' | 'none') {
        switch (tokenType) {
            case 'arb':
                return '0x912CE59144191C1204E64559FE8253a0e49E6548';
            case 'pepe':
                return '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00';
            case 'boop':
                return '0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3';
            case 'bribe':
                return '0x014d482f8403227cf65e1512e94d95606d536b07';
            default:
                return '0x0000000000000000000000000000000000000000';
        }
    }

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
                embeds:[`https://farcaster.xyz/miniapps/rcGxScTRGCs8/flapbitrum`]
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
                // Countdown finished, start loading
                console.log("🔍 Countdown finished, starting loading...");
                playGoSound();
                setShowCountdown(false);
                setCountdown(null);
                setIsLoading(true);
                setLoadingProgress(0);
                
                // Simulate loading progress
                const loadingInterval = setInterval(() => {
                    setLoadingProgress(prev => {
                        if (prev >= 100) {
                            clearInterval(loadingInterval);
                            setIsLoading(false);
                            setGameStarted(true);
                            console.log("🔍 Loading finished, game starting...");
                            return 100;
                        }
                        return prev + 10;
                    });
                }, 100); // 1 second total loading time
            }
        }
    }, [showCountdown, countdown, playCountdownSound, playGoSound]);

    // Initialize canvas when game starts (after loading)
    useEffect(() => {
        if (canvasRef.current && gameStarted && level && !showCountdown && !isLoading) {
            console.log("🔍 Initializing game after loading...");
            
            // Start the actual game after loading finishes
            startGame(canvasRef, setGameStarted, setGameOver, gameOverRef, setScore, setDifficulty, level, canvasDimensions, handleGameOver, resetSuccess);
        }
    }, [gameStarted, level, canvasDimensions, showCountdown, isLoading]);

    // Trigger countdown when game canvas is ready
    useEffect(() => {
        console.log("🔍 Countdown trigger effect - Mode:", mode, "Level:", level, "Game Started:", gameStarted, "Show Countdown:", showCountdown, "Is Loading:", isLoading, "Canvas:", !!canvasRef.current);
        
        if (mode === "single" && level && !gameStarted && !showCountdown && !isLoading && canvasRef.current) {
            console.log("🔍 Game canvas ready, starting countdown...");
            setShowCountdown(true);
            setCountdown(3);
        }
    }, [mode, level, gameStarted, showCountdown, isLoading]);

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

    // Loading Overlay Component
    const LoadingOverlay = () => (
        isLoading && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center animate-pulse">
                            <img src="/images/logo.png" alt="Flapbitrum Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                            Loading Game...
                        </h2>
                        <p className="text-blue-200 text-sm md:text-base">
                            Preparing your {level} challenge
                        </p>
                    </div>
                    
                    {/* Loading Bar */}
                    <div className="w-full bg-white/20 rounded-full h-3 mb-4 overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                            style={{ width: `${loadingProgress}%` }}
                        >
                            {/* Animated shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                        </div>
                    </div>
                    
                    {/* Loading Text */}
                    <div className="text-sm text-blue-300">
                        {loadingProgress < 30 && "🎮 Initializing game engine..."}
                        {loadingProgress >= 30 && loadingProgress < 60 && "🎯 Setting up difficulty..."}
                        {loadingProgress >= 60 && loadingProgress < 90 && "🪙 Loading coins and pipes..."}
                        {loadingProgress >= 90 && "🚀 Almost ready..."}
                    </div>
                    
                    {/* Progress Percentage */}
                    <div className="mt-3 text-lg font-bold text-white">
                        {loadingProgress}%
                    </div>
                </div>
            </div>
        )
    );

    // Wallet Connection Component with ETH Balance Display
    const WalletConnection = () => (
        <div className="fixed top-4 right-4 z-40">
            {isConnected && address ? (
               
                
                    <div>
                    
                  </div>
                
               
            ) : !isSDKLoaded && (
                <button
                    onClick={() => connect({ connector: connectors[0] })}
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
                <LoadingOverlay />
                


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
                    
                    {/* Token Balance Display - Mobile */}
                    <div className="relative z-10 w-full max-w-xs mb-6">
                        <TokenBalanceDisplay compact={true} showTitle={false} />
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
                            <span className="relative z-10">🎮 Play</span>
                        </button>
                       
                        <button 
                            className="w-full py-6 px-8 bg-gradient-to-r from-yellow-500/80 to-orange-600/80 backdrop-blur-sm text-white text-xl rounded-3xl font-bold shadow-2xl active:scale-95 border border-white/30 transition-all duration-200 hover:from-yellow-600/90 hover:to-orange-700/90 relative overflow-hidden group" 
                            onClick={() => window.location.href = '/dual-leaderboard'}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                            <span className="relative z-10">🏆 Leaderboard</span>
                        </button>
                    </div>
                    
                    <div className="relative z-10 mt-8 text-center">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                            <p className="text-sm text-blue-100">
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
                        
                        <p className="text-lg text-blue-100 font-semibold mb-6">Navigate the L2 blockchain!</p>
                        
                        {/* Token Balance Display - Desktop */}
                        <div className="mb-6">
                            <TokenBalanceDisplay showTitle={true} />
                        </div>
                        
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
                                onClick={() => window.location.href = '/dual-leaderboard'}
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
            <>
                <LoadingOverlay />
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
                                    <span>Dual Leaderboard</span>
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
        </>
        );
    }

    if (!gameStarted) {
        return (
            <>
                <WalletConnection />
                <CountdownOverlay />
                <LoadingOverlay />
                <div ref={cardRef} className={`${cardStyle} animate-fadein`}>
                    {/* Mobile fullscreen game start */}
                    <div className="md:hidden min-h-screen w-full flex flex-col justify-center items-center p-6 bg-gradient-to-br from-blue-900/95 via-indigo-800/95 to-blue-700/95 text-white relative overflow-hidden">
                        {/* Animated background elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-20 left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
                        </div>
                        
                        <div className="relative z-10 flex-1 flex flex-col justify-between items-center w-full max-w-md">
                            {/* Back Button */}
                            <div className="w-full flex justify-start pt-[-50px]">
                                <button 
                                    className="py-2 px-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold shadow active:scale-95 border border-white/20 transition-all duration-200 flex items-center gap-2" 
                                    onClick={() => setMode("")}
                                >
                                    <span>←</span>
                                    <span className="text-sm">Back</span>
                                </button>
                            </div>
    
                            {/* Main Content */}
                            <div className="flex flex-col items-center justify-center flex-1 w-full px-4">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <div className="w-16 h-15 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                                            <span className="text-4xl">
                                                <img src='/images/logo.png' alt='Flapbitrum Logo' className='w-16 h-16 object-contain rounded-full' />
                                            </span>
                                        </div>
                                    </div>
                                    <h1 className="text-4xl font-extrabold text-white drop-shadow-lg mb-3">Play Now</h1>
                                    <p className="text-lg text-blue-100 mb-2">Maximum Challenge</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-xs bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 px-4 py-2 rounded-full border border-red-400/30 backdrop-blur-sm font-semibold">
                                            ⚡ GFlappy
                                        </span>
                                    </div>
                                </div>
    
                                {/* Stats Card */}
                                <div className="w-full bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl border border-red-400/30 p-6 mb-6 shadow-2xl">
                                    <h3 className="text-center text-lg font-bold text-white mb-4">Scoring System</h3>
                                    
                                    <div className="bg-black/30 rounded-xl p-4 mb-4">
                                        <div className="flex items-center justify-center gap-8">
                                            <div className="text-center">
                                                <div className="text-3xl mb-2">🎯</div>
                                                <div className="text-2xl font-bold text-white">+3</div>
                                                <div className="text-xs text-gray-300 mt-1">Per Pipe</div>
                                            </div>
                                            <div className="w-px h-16 bg-white/20"></div>
                                            <div className="text-center">
                                                <div className="text-3xl mb-2">🪙</div>
                                                <div className="text-2xl font-bold text-white">+1</div>
                                                <div className="text-xs text-gray-300 mt-1">Per Coin</div>
                                            </div>
                                        </div>
                                    </div>
    
                                    {/* Power-ups */}
                                    <div className="bg-black/20 rounded-xl p-4">
                                        <div className="text-center mb-3">
                                            <span className="text-sm font-bold text-yellow-300">🎁 Power-ups Available</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="text-center">
                                                <div className="text-2xl mb-1">🛡️</div>
                                                <div className="text-xs text-gray-300">Shield</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl mb-1">⚡</div>
                                                <div className="text-xs text-gray-300">Speed</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl mb-1">✨</div>
                                                <div className="text-xs text-gray-300">2X Score</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl mb-1">💎</div>
                                                <div className="text-xs text-gray-300">Bonus</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
    
                                {/* Start Button */}
                                <button
                                    className="w-full py-5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xl rounded-2xl font-bold shadow-2xl active:scale-95 hover:from-red-600 hover:to-pink-700 transition-all duration-200 border-2 border-red-300/50 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleStartGame("expert")}
                                    disabled={isStartingGame}
                                >
                                    {isStartingGame ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Starting Game...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🚀</span>
                                            <span>Time to Flap</span>
                                        </>
                                    )}
                                </button>
    
                                {/* Pro Tip */}
                                <div className="mt-6 bg-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30 w-full">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">💡</span>
                                        <div>
                                            <h4 className="text-sm font-bold text-blue-200 mb-1">Pro Tip</h4>
                                            <p className="text-xs text-gray-300">
                                                Collect power-ups to boost your score and survive longer!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            {/* Footer Space */}
                            <div className="pb-4"></div>
                        </div>
                    </div>
                    
                    {/* Desktop game start */}
                    <div className="hidden md:block p-8 text-center bg-gradient-to-br from-blue-800/90 via-indigo-700/90 to-blue-600/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden max-w-2xl mx-auto">
                        {/* Animated background elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400/30 to-transparent animate-pulse"></div>
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-400/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
                        </div>
                        
                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="relative">
                                    <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                        <img src="/images/logo.png" alt="Flapbitrum Logo" className="w-10 h-10 object-contain" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white animate-pulse"></div>
                                </div>
                                <div className="text-left">
                                    <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">Flapbitrum</h1>
                                    <p className="text-sm text-red-300 font-semibold">Play now</p>
                                </div>
                            </div>
    
                            {/* Main Content */}
                            <div className="bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl border border-red-400/30 p-8 mb-6">
                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                                        <span className="text-5xl">🔥</span>
                                    </div>
                                </div>
                                
                                <h2 className="text-3xl font-bold text-white mb-3">Expert Challenge</h2>
                                <p className="text-lg text-red-200 mb-6">Fast Speed • Maximum Difficulty • Best Rewards</p>
    
                                {/* Stats */}
                                <div className="bg-black/30 rounded-2xl p-6 mb-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Scoring System</h3>
                                    <div className="flex items-center justify-center gap-12">
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">🎯</div>
                                            <div className="text-3xl font-bold text-white">+3</div>
                                            <div className="text-sm text-gray-300 mt-2">Points per Pipe</div>
                                        </div>
                                        <div className="w-px h-24 bg-white/20"></div>
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">🪙</div>
                                            <div className="text-3xl font-bold text-white">+1</div>
                                            <div className="text-sm text-gray-300 mt-2">Points per Coin</div>
                                        </div>
                                    </div>
                                </div>
    
                                {/* Power-ups */}
                                <div className="bg-black/20 rounded-xl p-6">
                                    <div className="text-center mb-4">
                                        <span className="text-lg font-bold text-yellow-300">🎁 Available Power-ups</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-white/5 rounded-lg p-4 text-center hover:bg-white/10 transition-colors">
                                            <div className="text-3xl mb-2">🛡️</div>
                                            <div className="text-sm text-gray-300 font-semibold">Shield</div>
                                            <div className="text-xs text-gray-400 mt-1">Protection</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-4 text-center hover:bg-white/10 transition-colors">
                                            <div className="text-3xl mb-2">⚡</div>
                                            <div className="text-sm text-gray-300 font-semibold">Speed Boost</div>
                                            <div className="text-xs text-gray-400 mt-1">Go faster</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-4 text-center hover:bg-white/10 transition-colors">
                                            <div className="text-3xl mb-2">✨</div>
                                            <div className="text-sm text-gray-300 font-semibold">2X Score</div>
                                            <div className="text-xs text-gray-400 mt-1">Double points</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-4 text-center hover:bg-white/10 transition-colors">
                                            <div className="text-3xl mb-2">💎</div>
                                            <div className="text-sm text-gray-300 font-semibold">Bonus</div>
                                            <div className="text-xs text-gray-400 mt-1">Extra points</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            {/* Buttons */}
                            <div className="space-y-4">
                                <button 
                                    className="w-full py-5 px-6 bg-gradient-to-r from-red-500 to-pink-600 text-white text-2xl rounded-2xl font-bold shadow-2xl active:scale-95 hover:from-red-600 hover:to-pink-700 transition-all duration-200 border-2 border-red-300/50 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed" 
                                    onClick={() => handleStartGame("expert")}
                                    disabled={isStartingGame}
                                >
                                    {isStartingGame ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Starting Game...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🚀</span>
                                            <span>Play  Now</span>
                                            <span>🔥</span>
                                        </>
                                    )}
                                </button>
                                
                                <button 
                                    className="w-full py-3 px-6 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-2xl font-bold shadow active:scale-95 transition-all duration-200 border border-white/20" 
                                    onClick={() => setMode("")}
                                >
                                    ← Back to Menu
                                </button>
                            </div>
    
                            {/* Pro Tip */}
                            <div className="mt-6 bg-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30">
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-2xl">💡</span>
                                    <p className="text-sm text-gray-300">
                                        <span className="font-bold text-blue-200">Pro Tip:</span> Collect power-ups strategically to maximize your score and survival time!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (gameOver) {
        console.log("🔍 Rendering game over screen - gameOver:", gameOver, "pendingGiftBox:", pendingGiftBox);
        console.log("🔍 Game over screen should be visible now!");
        return (
            <>
                <WalletConnection />
                <LoadingOverlay />
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
                                    {score > 0 && !isSavingScoreWithMongo && !isConfirmingTransaction && !scoreSavedWithMongo && (
                                        <button
                                            onClick={handleSaveToChain}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg active:scale-95 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 mb-3"
                                        >
                                            🏆 Save Score to Compete on Leaderboard
                                        </button>
                                    )}
                                    
                                    {isSavingScoreWithMongo && (
                                        <div className="text-center text-yellow-300 py-3">
                                            💾 Sending transaction to blockchain...
                                        </div>
                                    )}

                                    {isConfirmingTransaction && (
                                        <div className="text-center text-orange-300 py-3">
                                            ⏳ Confirming transaction...
                                        </div>
                                    )}

                                    {isMongoUpdating && (
                                        <div className="text-center text-blue-300 py-2">
                                            🗄️ Updating leaderboard...
                                        </div>
                                    )}

                                    {scoreSavedWithMongo && (
                                        <div className="text-center text-green-300 py-3">
                                            ✅ Score saved successfully!
                                        </div>
                                    )}
                                    
                                </div>
                            ) : isClient && !isSDKLoaded && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
                                    <h4 className="text-lg font-semibold mb-2 text-blue-200">🔗 Connect Wallet</h4>
                                    <p className="text-sm text-blue-300 mb-3">Connect your wallet to save scores to the blockchain!</p>
                                    <button
                                        onClick={() => connect({ connector: connectors[0] })}
                                        className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow active:scale-95 transition-all duration-200"
                                    >
                                        🔗 Connect Wallet
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4 w-full max-w-xs">
                            {/* Direct Gift Box Claim - Show when pending */}
                            {pendingGiftBox && !giftBoxReward && (
                                <button 
                                    className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 border border-white/20 animate-pulse" 
                                    onClick={handleDirectGiftBoxClaim}
                                    disabled={isClaimingGiftBox}
                                >
                                    {isClaimingGiftBox ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                            Claiming...
                                        </div>
                                    ) : (
                                        "🎁 Claim Gift Box"
                                    )}
                                </button>
                            )}

                            {/* Gift Box Reward Display */}
                            {giftBoxReward && (
                                <div className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-400/30">
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">🎁</div>
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            {giftBoxReward.tokenType === 'none' ? 'Better Luck Next Time!' : `You Won ${giftBoxReward.amount.toLocaleString()} ${giftBoxReward.tokenType.toUpperCase()}!`}
                                        </h3>
                                        {giftBoxReward.tokenType !== 'none' && (
                                            <p className="text-sm text-purple-200 mb-3">
                                                Claim on blockchain to receive your tokens
                                            </p>
                                        )}
                                        <div className="text-xs text-purple-300">
                                            Claims today: {giftBoxReward.claimsToday}/5 | Remaining: {giftBoxReward.remainingClaims}
                                        </div>
                                        {giftBoxReward.tokenType !== 'none' && (
                                            <div className="mt-3 space-y-2">
                                                <button 
                                                    className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-base rounded-xl font-bold shadow-lg active:scale-95 hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 border border-white/20 disabled:opacity-60"
                                                    onClick={handleOnChainClaim}
                                                    disabled={hasClaimedOnChain || isClaimingGiftBox || isClaimConfirming}
                                                >
                                                    {hasClaimedOnChain ? '✅ Claimed' : (isClaimingGiftBox || isClaimConfirming ? 'Claiming...' : 'Claim on-chain')}
                                                </button>
                                                {hasClaimedOnChain && (
                                                    <button 
                                                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-base rounded-xl font-bold shadow-lg active:scale-95 hover:from-purple-600 hover:to-pink-700 transition-all duration-200 border border-white/20"
                                                        onClick={handleShareReward}
                                                    >
                                                        Share on Farcaster 🚀
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
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
                                {score > 0 && !isSavingScoreWithMongo && !isConfirmingTransaction && !scoreSavedWithMongo && (
                                    <button
                                        onClick={handleSaveToChain}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg active:scale-95 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 mb-3"
                                    >
                                        🏆 Save Score to Compete on Leaderboard
                                    </button>
                                )}
                                
                                {isSavingScoreWithMongo && (
                                    <div className="text-center text-yellow-600 py-3">
                                        💾 Sending transaction to blockchain...
                                    </div>
                                )}

                                {isConfirmingTransaction && (
                                    <div className="text-center text-orange-600 py-3">
                                        ⏳ Confirming transaction...
                                    </div>
                                )}

                                {isMongoUpdating && (
                                    <div className="text-center text-blue-600 py-2">
                                        🗄️ Updating leaderboard...
                                    </div>
                                )}

                                {scoreSavedWithMongo && (
                                    <div className="text-center text-green-600 py-3">
                                        ✅ Score saved successfully!
                                    </div>
                                )}
                                
                            </div>
                        ) : isClient && !isSDKLoaded && (
                            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                                <h4 className="text-lg font-semibold mb-2 text-gray-700">🔗 Connect Wallet</h4>
                                <p className="text-sm text-gray-600 mb-3">Connect your wallet to save scores to the blockchain!</p>
                                <button
                                      onClick={() => connect({ connector: connectors[0] })}
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
                            {/* Direct Gift Box Claim - Show when pending */}
                            {pendingGiftBox && !giftBoxReward && (
                                <button 
                                    className="w-full py-3 px-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-lg rounded-2xl font-bold shadow-lg active:scale-95 hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 animate-pulse" 
                                    onClick={handleDirectGiftBoxClaim}
                                    disabled={isClaimingGiftBox}
                                >
                                    {isClaimingGiftBox ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                            Claiming...
                                        </div>
                                    ) : (
                                        "🎁 Claim Gift Box"
                                    )}
                                </button>
                            )}

                            {/* Gift Box Reward Display */}
                            {giftBoxReward && (
                                <div className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-400/30 mb-3">
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">🎁</div>
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            {giftBoxReward.tokenType === 'none' ? 'Better Luck Next Time!' : `You Won ${giftBoxReward.amount.toLocaleString()} ${giftBoxReward.tokenType.toUpperCase()}!`}
                                        </h3>
                                        {giftBoxReward.tokenType !== 'none' && (
                                            <p className="text-sm text-purple-200 mb-3">
                                                Claim on blockchain to receive your tokens
                                            </p>
                                        )}
                                        <div className="text-xs text-purple-300">
                                            Claims today: {giftBoxReward.claimsToday}/5 | Remaining: {giftBoxReward.remainingClaims}
                                        </div>
                                        {giftBoxReward.tokenType !== 'none' && (
                                            <div className="mt-3 space-y-2">
                                                <button 
                                                    className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-base rounded-xl font-bold shadow-lg active:scale-95 hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-60"
                                                    onClick={handleOnChainClaim}
                                                    disabled={hasClaimedOnChain || isClaimingGiftBox || isClaimConfirming}
                                                >
                                                    {hasClaimedOnChain ? '✅ Claimed' : (isClaimingGiftBox || isClaimConfirming ? 'Claiming...' : 'Claim on-chain')}
                                                </button>
                                                {hasClaimedOnChain && (
                                                    <button 
                                                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-base rounded-xl font-bold shadow-lg active:scale-95 hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
                                                        onClick={handleShareReward}
                                                    >
                                                        Share on Farcaster 🚀
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
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
                <CountdownOverlay />
                <LoadingOverlay />
            
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
                        
                        <div className="w-full bg-black/30 rounded-full h-1 mt-1">
                            <div 
                                className="bg-gradient-to-r from-blue-400 to-indigo-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (difficulty - 1) * 50)}%` }}
                            ></div>
                        </div>
                    </div>
                   
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
                    <div className="flex gap-2 justify-center mt-2">
                    <button 
                            className="py-2 px-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-sm rounded-xl font-bold shadow active:scale-95 transition-all duration-200" 
                            onClick={() => setShowPowerUpGuide(true)}
                            title="Power-ups Guide"
                        >
                            ⚡ Guide
                        </button>
                        <button 
                            className="py-2 px-4 bg-gradient-to-r from-gray-400 to-gray-600 text-white text-sm rounded-xl font-bold shadow active:scale-95 transition-all duration-200" 
                        onClick={() => setMode("")}
                    >
                        ← Menu
                    </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Reward Info Popup */}
        <RewardInfoPopup 
          isOpen={showRewardInfo}
          onClose={() => setShowRewardInfo(false)}
          localStorageKey="flapbitrum_home_reward_info_seen"
        />

        {showGiftBox && (
          <>
            {console.log("🔍 Rendering GiftBox component - showGiftBox is true")}
            {console.log("🔍 Other modal states:", { showPowerUpGuide, showRewardInfo, showCountdown })}
            <GiftBox 
              onClose={() => {
                console.log("🔍 GiftBox onClose called");
                setShowGiftBox(false);
              }}
              onClaimComplete={() => {
                console.log("🔍 GiftBox onClaimComplete called");
                setShowGiftBox(false);
              }}
            />
          </>
        )}

        {/* Power-up Guide Modal */}
        {showPowerUpGuide && (
            <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                onClick={() => setShowPowerUpGuide(false)}
            >
                <div 
                    className="bg-gradient-to-br from-blue-900/95 via-indigo-800/95 to-blue-700/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/20">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚡</span>
                            <h2 className="text-xl font-bold text-white">Power-ups Guide</h2>
                        </div>
                        <button
                            onClick={() => setShowPowerUpGuide(false)}
                            className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all duration-200"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-gray-300 text-sm mb-6">
                            Collect these special items during gameplay to gain powerful advantages!
                        </p>

                        <div className="space-y-4">
                            {/* Shield */}
                            <div className="bg-white/10 rounded-xl p-4 border border-yellow-500/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                        <span className="text-lg">🛡️</span>
                                    </div>
                                    <div>
                                        <h3 className="text-yellow-300 font-bold">Shield</h3>
                                        <p className="text-yellow-200 text-sm">8% spawn rate</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="text-yellow-300 font-bold">+5 pts</span>
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    Protects from all collisions for 15 seconds. Perfect for risky maneuvers!
                                </p>
                            </div>

                            {/* Speed Boost */}
                            <div className="bg-white/10 rounded-xl p-4 border border-green-500/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                        <span className="text-lg">⚡</span>
                                    </div>
                                    <div>
                                        <h3 className="text-green-300 font-bold">Speed Boost</h3>
                                        <p className="text-green-200 text-sm">6% spawn rate</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="text-green-300 font-bold">+3 pts</span>
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    Reduces gravity for 8 seconds, making the bird easier to control.
                                </p>
                            </div>

                            {/* Score Multiplier */}
                            <div className="bg-white/10 rounded-xl p-4 border border-purple-500/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                                        <span className="text-lg">✨</span>
                                    </div>
                                    <div>
                                        <h3 className="text-purple-300 font-bold">Score Multiplier</h3>
                                        <p className="text-purple-200 text-sm">4% spawn rate</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="text-purple-300 font-bold">+8 pts</span>
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    Doubles all points earned for 10 seconds. Affects pipes, coins, and power-ups!
                                </p>
                            </div>

                            {/* Diamond */}
                            <div className="bg-white/10 rounded-xl p-4 border border-cyan-500/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-lg">💎</span>
                                    </div>
                                    <div>
                                        <h3 className="text-cyan-300 font-bold">Rare Diamond</h3>
                                        <p className="text-cyan-200 text-sm">2% spawn rate</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="text-cyan-300 font-bold">+15 pts</span>
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    The rarest power-up! Provides a massive point bonus when collected.
                                </p>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-6">
                            <h4 className="text-white font-bold mb-2">💡 Pro Tips:</h4>
                            <ul className="text-gray-300 text-sm space-y-1">
                                <li>• Power-ups spawn more frequently as difficulty increases</li>
                                <li>• Some power-ups appear near pipes for extra challenge</li>
                                <li>• Active power-ups show as transparent bars in the center-top</li>
                                <li>• Score multiplier affects all point sources when active</li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/20">
                        <button
                            onClick={() => setShowPowerUpGuide(false)}
                            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                        >
                            Got it! 🚀
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default FlappyBirdGame;
