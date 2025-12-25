import React, { useEffect, useRef, useState } from "react";
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
  GestureRecognizerResult
} from "@mediapipe/tasks-vision";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GestureControllerProps {
  onGesture: (gesture: string) => void;
  className?: string;
}

export const GestureController: React.FC<GestureControllerProps> = ({
  onGesture,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recognizer, setRecognizer] = useState<GestureRecognizer | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const initRecognizer = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://resource-static.cdn.bcebos.com/common/gesture_recognizer.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      
      setRecognizer(gestureRecognizer);
    };
    
    initRecognizer();
  }, []);

  const startCamera = async () => {
    if (!recognizer) return;
    setLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
           videoRef.current?.play();
           setCameraActive(true);
           setLoading(false);
           predictWebcam();
        };
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
      cancelAnimationFrame(requestRef.current);
    }
  };

  const predictWebcam = () => {
    if (!recognizer || !videoRef.current || !canvasRef.current) return;
    
    // Check if video is playing
    if (videoRef.current.paused || videoRef.current.ended) return;

    const nowInMs = Date.now();
    const results = recognizer.recognizeForVideo(videoRef.current, nowInMs);

    drawResults(results);

    if (results.gestures.length > 0) {
      const categoryName = results.gestures[0][0].categoryName;
      // Map gestures to our actions
      // Open_Palm -> SCATTERED
      // Closed_Fist -> TREE
      // Victory -> HEART
      
      if (categoryName === "Open_Palm") onGesture("SCATTERED");
      else if (categoryName === "Closed_Fist") onGesture("TREE");
      else if (categoryName === "Victory") onGesture("HEART");
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const drawResults = (results: GestureRecognizerResult) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvasCtx = canvasRef.current.getContext("2d");
    if (!canvasCtx) return;

    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    if (results.landmarks) {
      const drawingUtils = new DrawingUtils(canvasCtx);
      for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          GestureRecognizer.HAND_CONNECTIONS,
          { color: "#00FF00", lineWidth: 2 }
        );
        drawingUtils.drawLandmarks(landmarks, {
          color: "#FF0000",
          lineWidth: 1,
          radius: 3
        });
      }
    }
    canvasCtx.restore();
  };

  return (
    <div className={cn("relative rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-xl backdrop-blur-sm transition-all", className)}>
      {!cameraActive && (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] p-6 text-white">
          <Camera className="w-12 h-12 mb-4 opacity-50" />
          <button
            onClick={startCamera}
            disabled={!recognizer || loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Starting..." : (!recognizer ? "Loading Model..." : "开启手势控制")}
          </button>
          <p className="mt-2 text-xs text-gray-400 text-center">
            张开手掌: 散开 | 握拳: 聚合 | V手势: 爱心
          </p>
        </div>
      )}

      <div className={cn("relative w-full", cameraActive ? "block" : "hidden")}>
        <video
          ref={videoRef}
          className="w-full h-auto object-cover transform -scale-x-100"
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
        />
        <button 
            onClick={stopCamera}
            className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full hover:bg-red-600 transition-colors z-10"
        >
            <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};
