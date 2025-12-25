import { useState, useEffect, useRef } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { GestureController } from "./components/GestureController";
import { AudioManager } from "./game/audio";
import { GameState } from "./game/game";
import { Slider } from "@/components/ui/slider";
import { 
  Heart, 
  Trees, 
  Wind, 
  Volume2, 
  VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";

function App() {
  const [gameState, setGameState] = useState<GameState>("TREE");
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const audioManager = useRef<AudioManager | null>(null);

  useEffect(() => {
    audioManager.current = new AudioManager();
    audioManager.current.start();
    audioManager.current.setVolume(80);
    
    const unlockAudio = () => {
      audioManager.current?.start();
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);

    return () => {
    };
  }, []);

  const handleStateChange = (newState: GameState) => {
    if (gameState === newState) return;
    setGameState(newState);
    audioManager.current?.playTransition(newState);
  };

  const handleVolumeChange = (v: number[]) => {
    const newVol = v[0];
    setVolume(newVol);
    if (newVol > 0) setIsMuted(false);
    audioManager.current?.setVolume(newVol);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioManager.current?.setVolume(volume);
    } else {
      setIsMuted(true);
      audioManager.current?.setVolume(0);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <GameCanvas targetState={gameState} />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="space-y-1">
            <h1 className="text-3xl font-light text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
              MERRY <span className="text-amber-400 font-normal">CHRISTMAS</span>
            </h1>
            <p className="text-white/60 text-sm tracking-wider">3D 粒子特效互动体验</p>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-3 rounded-full border border-white/10">
            <button 
              onClick={toggleMute}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <Slider 
              value={[isMuted ? 0 : volume]} 
              max={100} 
              step={1} 
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </header>

        {/* Bottom Area */}
        <div className="flex flex-col-reverse md:flex-row items-end justify-between gap-6 pointer-events-auto">
          
          {/* Controls */}
          <div className="w-full md:w-auto flex flex-col items-center md:items-start gap-4">
             <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
               
               <ControlButton 
                 active={gameState === "SCATTERED"} 
                 onClick={() => handleStateChange("SCATTERED")}
                 icon={<Wind className="w-6 h-6" />}
                 label="散开"
               />
               
               <ControlButton 
                 active={gameState === "TREE"} 
                 onClick={() => handleStateChange("TREE")}
                 icon={<Trees className="w-6 h-6" />}
                 label="圣诞树"
               />
               
               <ControlButton 
                 active={gameState === "HEART"} 
                 onClick={() => handleStateChange("HEART")}
                 icon={<Heart className="w-6 h-6" />}
                 label="爱心"
               />

             </div>
             <p className="text-white/40 text-xs hidden md:block pl-2">
               提示: 支持手势控制 (张开手掌 / 握拳 / V字手势)
             </p>
          </div>

          {/* Gesture Camera View */}
          <div className="w-48 md:w-64">
             <GestureController 
               onGesture={(g) => {
                 if (g === "SCATTERED" || g === "TREE" || g === "HEART") {
                   handleStateChange(g as GameState);
                 }
               }} 
             />
          </div>

        </div>
      </div>
    </div>
  );
}

function ControlButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center w-20 h-20 rounded-xl transition-all duration-300",
        active 
          ? "bg-gradient-to-br from-emerald-600 to-emerald-900 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-110" 
          : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white hover:scale-105"
      )}
    >
      <div className={cn("mb-1 transition-transform duration-300", active && "scale-110")}>
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
      
      {active && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-emerald-400/50 animate-pulse" />
      )}
    </button>
  );
}

export default App;
