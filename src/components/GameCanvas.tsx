import React, { useEffect, useRef } from 'react';
import { ChristmasTreeGame, GameState } from '../game/game';

interface GameCanvasProps {
    targetState: GameState;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ targetState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<ChristmasTreeGame | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Init game
        const game = new ChristmasTreeGame(canvasRef.current);
        gameRef.current = game;

        return () => {
            game.dispose();
            gameRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.setShape(targetState);
        }
    }, [targetState]);

    return (
        <canvas 
            ref={canvasRef} 
            className="w-full h-full block outline-none touch-none"
        />
    );
};
