
import React from 'react';
import { X, Image as ImageIcon, Music, MessageSquare, Zap, Bot, Radio, Palette, Languages, Speaker, Box, Move3d, Send, Camera, BookOpen, User, CheckCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { MOCK_AVATARS, MOCK_ENVIRONMENTS, MOCK_OUTFITS } from '../../data';
import { GoogleGenAI, Type } from "@google/genai";
import { Product, AvatarCustomization, AvatarOutfit, AvatarEnvironment } from '../../types';
import { generateSpeech } from '../../services/geminiService';
import { refineAvatarRealism } from '../../services/avatarCreativeService';
import { processAvatarInteraction } from '../../services/avatarSkillService';

// --- 3D IMPORTS ---
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, useTexture, MeshReflectorMaterial, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import Avatar3DModel from './Avatar3DModel';
import VRMAvatarModel from './VRMAvatarModel';

interface VirtualAvatarStudioProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

type AvatarState = 'IDLE' | 'TALKING' | 'SINGING';
type CameraView = 'WIDE' | 'CLOSEUP' | 'PRODUCT' | 'AUDIENCE';

// --- 3D COMPONENT: SCENE CONTROLLER ---
const SceneController = ({ environment, runwayMode, cameraView }: { environment: AvatarEnvironment, runwayMode: boolean, cameraView: CameraView }) => {
  const { camera } = useThree();
  
  React.useEffect(() => {
    if (runwayMode) {
      if (cameraView === 'WIDE') {
        camera.position.set(0, 5, 195);
        camera.lookAt(0, 0, 0);
      } else if (cameraView === 'CLOSEUP') {
        camera.position.set(0, 2, 10);
        camera.lookAt(0, 0, 0);
      } else if (cameraView === 'PRODUCT') {
        camera.position.set(15, 5, 20);
        camera.lookAt(0, 0, 0);
      } else if (cameraView === 'AUDIENCE') {
        camera.position.set(-20, 10, 100);
        camera.lookAt(0, 0, 0);
      }
    } else if (environment.cameraPosition) {
      if (cameraView === 'WIDE') {
        camera.position.set(environment.cameraPosition[0], environment.cameraPosition[1], environment.cameraPosition[2]);
        camera.lookAt(0, 0, 0);
      } else if (cameraView === 'CLOSEUP') {
        camera.position.set(environment.cameraPosition[0], environment.cameraPosition[1] - 0.5, environment.cameraPosition[2] - 2);
        camera.lookAt(0, 0, 0);
      } else if (cameraView === 'PRODUCT') {
        camera.position.set(environment.cameraPosition[0] + 2, environment.cameraPosition[1], environment.cameraPosition[2] - 1);
        camera.lookAt(0, 0, 0);
      } else if (cameraView === 'AUDIENCE') {
        camera.position.set(environment.cameraPosition[0] - 3, environment.cameraPosition[1] + 2, environment.cameraPosition[2] + 5);
        camera.lookAt(0, 0, 0);
      }
    }
  }, [environment, camera, runwayMode, cameraView]);

  return null;
};

// --- 3D COMPONENT: CATWALK STAGE ---
const Catwalk = ({ environment, runwayMode, videoUrl }: { environment: AvatarEnvironment, runwayMode: boolean, videoUrl?: string | null }) => {
  const texture = useTexture(environment.image);
  
  // Conditionally load video texture
  // We use a fallback because useVideoTexture must be called at top level or handled carefully
  // Actually, useVideoTexture can take a URL or a video element.
  // If videoUrl is null, we can pass a dummy or handle it.
  // A better way is to have a sub-component or just use a ref and create the texture manually if we want to be safe with hooks.
  // But let's try useVideoTexture with a conditional check inside if possible, or just pass it.
  
  return (
    <group position={[0, -1.5, 0]}>
      {/* Main Runway Platform - Expanded to wings with monumental height */}
      <mesh receiveShadow position={[0, -5.25, 0]}>
        <boxGeometry args={[60, 10.5, 30]} />
        {runwayMode ? (
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={40}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#050505"
            metalness={0.5}
            mirror={1}
          />
        ) : (
          <meshStandardMaterial 
            color="#050505" 
            roughness={0.02} 
            metalness={1} 
            envMapIntensity={2}
          />
        )}
      </mesh>

      {/* Grand Stairs leading up to the stage (Front) - 15 steps, runway-like depth with side lighting */}
      {[...Array(15)].map((_, i) => (
        <group key={`step-group-${i}`} position={[0, -10.5 + (i * 0.7) + 0.35, 15 + (15 - i) * 12.0 - 6.0]}>
          <mesh receiveShadow>
            <boxGeometry args={[40, 0.7, 12.0]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          
          {/* Step LED Front */}
          <mesh position={[0, 0.351, 5.95]}>
            <boxGeometry args={[40, 0.02, 0.05]} />
            <meshStandardMaterial 
              color={runwayMode ? "#00ffff" : "#fbbf24"} 
              emissive={runwayMode ? "#00ffff" : "#fbbf24"} 
              emissiveIntensity={runwayMode ? 8 : 5} 
            />
          </mesh>

          {/* Side Lights for each step */}
          <group position={[-19.5, 0.35, 0]}>
            <mesh>
              <cylinderGeometry args={[0.2, 0.3, 0.2, 16]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <pointLight intensity={runwayMode ? 1.5 : 3} distance={15} color={runwayMode ? "#00ffff" : "#fbbf24"} position={[0, 0.5, 0]} />
            {/* Volumetric light beam effect */}
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.01, 0.5, 3, 16, 1, true]} />
              <meshStandardMaterial color={runwayMode ? "#00ffff" : "#fbbf24"} transparent opacity={0.03} />
            </mesh>
          </group>

          <group position={[19.5, 0.35, 0]}>
            <mesh>
              <cylinderGeometry args={[0.2, 0.3, 0.2, 16]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <pointLight intensity={runwayMode ? 1.5 : 3} distance={15} color={runwayMode ? "#00ffff" : "#fbbf24"} position={[0, 0.5, 0]} />
            {/* Volumetric light beam effect */}
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.01, 0.5, 3, 16, 1, true]} />
              <meshStandardMaterial color={runwayMode ? "#00ffff" : "#fbbf24"} transparent opacity={0.03} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Front LED Strips - Double line effect */}
      <mesh position={[0, 0.01, 14.95]}>
        <boxGeometry args={[60, 0.05, 0.1]} />
        <meshStandardMaterial 
          color={runwayMode ? "#00ffff" : "#fbbf24"} 
          emissive={runwayMode ? "#00ffff" : "#fbbf24"} 
          emissiveIntensity={runwayMode ? 12 : 8} 
        />
      </mesh>
      <mesh position={[0, 0.01, 14.75]}>
        <boxGeometry args={[60, 0.02, 0.05]} />
        <meshStandardMaterial 
          color={runwayMode ? "#00ffff" : "#fbbf24"} 
          emissive={runwayMode ? "#00ffff" : "#fbbf24"} 
          emissiveIntensity={runwayMode ? 8 : 4} 
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Floor LED Strips - Decorative */}
      {[...Array(5)].map((_, i) => (
        <mesh key={`led-${i}`} position={[0, 0.01, -10 + i * 5]}>
          <boxGeometry args={[60, 0.02, 0.05]} />
          <meshStandardMaterial 
            color={runwayMode ? "#00ffff" : "#fbbf24"} 
            emissive={runwayMode ? "#00ffff" : "#fbbf24"} 
            emissiveIntensity={runwayMode ? 4 : 2} 
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}

      {/* Backdrop Stage Wall */}
      <Suspense fallback={
        <mesh position={[0, 10, -15]}>
          <planeGeometry args={[60, 30]} />
          <meshStandardMaterial map={texture} emissive={environment.lightingColor} emissiveIntensity={0.05} />
        </mesh>
      }>
        <BackdropWall texture={texture} videoUrl={videoUrl} environment={environment} runwayMode={runwayMode} />
      </Suspense>
      
      {/* Side Curtains/Walls */}
      <mesh position={[-30, 10, -5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 50]} />
        <meshStandardMaterial color="#020202" />
      </mesh>
      <mesh position={[30, 10, -5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 50]} />
        <meshStandardMaterial color="#020202" />
      </mesh>

      {/* Floor around the catwalk - Lowered to monumental level and expanded */}
      <mesh position={[0, -10.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#000000" roughness={1} />
      </mesh>

      {/* Glowing Edges - Moved to far sides */}
      <mesh position={[-29.95, 0.01, 0]}>
        <boxGeometry args={[0.1, 0.05, 30]} />
        <meshStandardMaterial color={runwayMode ? "#00ffff" : "#fbbf24"} emissive={runwayMode ? "#00ffff" : "#fbbf24"} emissiveIntensity={runwayMode ? 10 : 6} />
      </mesh>
      <mesh position={[29.95, 0.01, 0]}>
        <boxGeometry args={[0.1, 0.05, 30]} />
        <meshStandardMaterial color={runwayMode ? "#00ffff" : "#fbbf24"} emissive={runwayMode ? "#00ffff" : "#fbbf24"} emissiveIntensity={runwayMode ? 10 : 6} />
      </mesh>

      {/* Stage Lights - Spread to wings */}
      {[...Array(14)].map((_, i) => (
        <group key={i} position={[i % 2 === 0 ? -28 : 28, 0.05, -12 + i * 2]}>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 0.3, 16]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <pointLight intensity={runwayMode ? 2 : 4} distance={12} color={runwayMode ? "#00ffff" : "#fbbf24"} position={[0, 0.5, 0]} />
          <mesh position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.8, 4, 32, 1, true]} />
            <meshStandardMaterial color={runwayMode ? "#00ffff" : "#fbbf24"} transparent opacity={0.05} />
          </mesh>
        </group>
      ))}
      
      {/* Rim Light for Runway Mode */}
      {runwayMode && (
        <spotLight 
          position={[0, 5, -5]} 
          angle={0.5} 
          penumbra={1} 
          intensity={10} 
          color="#ffffff" 
          target-position={[0, 0, 0]}
          castShadow
        />
      )}

      {/* Backdrop Spotlights */}
      <spotLight position={[0, 20, -5]} angle={0.6} penumbra={0.5} intensity={runwayMode ? 1 : 3} color={environment.lightingColor} target-position={[0, 0, -15]} />
      
      {runwayMode && <fog attach="fog" args={['#000', 5, 15]} />}

      <ContactShadows 
        opacity={0.9} 
        scale={30} 
        blur={1.5} 
        far={5} 
        resolution={1024} 
        color="#000000" 
      />
    </group>
  );
};

const BackdropWall = ({ texture, videoUrl, environment, runwayMode }: { texture: THREE.Texture, videoUrl?: string | null, environment: AvatarEnvironment, runwayMode: boolean }) => {
  if (videoUrl) {
    return <VideoBackdrop videoUrl={videoUrl} environment={environment} runwayMode={runwayMode} />;
  }
  
  return (
    <mesh position={[0, 10, -15]}>
      <planeGeometry args={[60, 30]} />
      <meshStandardMaterial 
        map={texture} 
        emissive={environment.lightingColor} 
        emissiveIntensity={runwayMode ? 0.02 : 0.05} 
        roughness={1}
        color={runwayMode ? "#444" : "#fff"}
      />
    </mesh>
  );
};

const VideoBackdrop = ({ videoUrl, environment, runwayMode }: { videoUrl: string, environment: AvatarEnvironment, runwayMode: boolean }) => {
  const videoTexture = useVideoTexture(videoUrl, { muted: true, loop: true, start: true });
  
  return (
    <mesh position={[0, 10, -15]}>
      <planeGeometry args={[60, 30]} />
      <meshStandardMaterial 
        map={videoTexture} 
        emissive={environment.lightingColor} 
        emissiveIntensity={runwayMode ? 0.02 : 0.05} 
        roughness={1}
        color={runwayMode ? "#444" : "#fff"}
      />
    </mesh>
  );
};

const VirtualAvatarStudio: React.FC<VirtualAvatarStudioProps> = ({ isOpen, onClose, products }) => {
  const [activeTab, setActiveTab] = React.useState<'SETUP' | 'CUSTOMIZE' | 'STUDIO' | 'LIVE' | 'AI_CREATIVE'>('SETUP');
  
  const [selectedAvatar, setSelectedAvatar] = React.useState(MOCK_AVATARS[0]);
  const [selectedEnv, setSelectedEnv] = React.useState(MOCK_ENVIRONMENTS[0]);
  const [selectedOutfit, setSelectedOutfit] = React.useState<AvatarOutfit>(MOCK_OUTFITS[0]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(products[0] || null);

  const [use3DMode, setUse3DMode] = React.useState(false);
  const [customVrmUrl, setCustomVrmUrl] = React.useState<string | null>(null);
  const [customVrmOutfitUrl, setCustomVrmOutfitUrl] = React.useState<string | null>(null);
  const [isMotionCapture, setIsMotionCapture] = React.useState(false);
  const [motionCaptureError, setMotionCaptureError] = React.useState(false);
  
  const webcamRef = React.useRef<HTMLVideoElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const autoRoutineRef = React.useRef(false);
  const aiRoutineRef = React.useRef(false);

  const [customization, setCustomization] = React.useState<AvatarCustomization & { voiceName: string, outfitColor: string, eyeColor: string, bodyType: 'SLIM' | 'ATHLETIC' | 'CURVY' }>({
      heightScale: 1.0,
      skinToneHash: '#ffffff',
      hairStyle: 'LONG',
      language: 'vi-VN',
      voiceSpeed: 1.1,
      voicePitch: 1.0,
      voiceName: 'Kore',
      outfitColor: '#ffffff',
      eyeColor: '#3b82f6',
      bodyType: 'ATHLETIC'
  });

  const [outfitCategory, setOutfitCategory] = React.useState<string>('ALL');
  const [isSuggestingOutfit, setIsSuggestingOutfit] = React.useState(false);
  const [isLive, setIsLive] = React.useState(false);
  const [currentAnimation, setCurrentAnimation] = React.useState<string>('Idle');
  const [isGeneratingScript, setIsGeneratingScript] = React.useState(false);
  const [runwayMode, setRunwayMode] = React.useState(false);
  const [moveCommand, setMoveCommand] = React.useState<{dir: string, ts: number}>({dir: 'NONE', ts: 0});
  const [resetPosTrigger, setResetPosTrigger] = React.useState(0);
  const [isAutoRoutine, setIsAutoRoutine] = React.useState(false);
  const [isAIChoreographing, setIsAIChoreographing] = React.useState(false);
  const [isAIRoutineRunning, setIsAIRoutineRunning] = React.useState(false);
  const [avatarState, setAvatarState] = React.useState<AvatarState>('IDLE');
  const [chatHistory, setChatHistory] = React.useState<{user: string, text: string}[]>([]);
  const [lyrics, setLyrics] = React.useState<string[]>([]);
  const [hostInput, setHostInput] = React.useState('');
  
  const [restreamTikTok, setRestreamTikTok] = React.useState(false);
  const [restreamFacebook, setRestreamFacebook] = React.useState(false);
  const [activeVoucher, setActiveVoucher] = React.useState<string | null>(null);
  const [pinnedProduct, setPinnedProduct] = React.useState<Product | null>(null);
  const [showVideoOverlay, setShowVideoOverlay] = React.useState<string | null>(null);
  const [cameraView, setCameraView] = React.useState<CameraView>('WIDE');
  const [showBridgeGuide, setShowBridgeGuide] = React.useState(false);
  
  const [kolAssets, setKolAssets] = React.useState<any[]>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const saved = localStorage.getItem('kol_assets');
      const parsed = saved ? JSON.parse(saved) : [];
      // Filter out blob URLs from previous sessions as they are no longer valid
      return parsed.filter((asset: any) => !asset.url.startsWith('blob:'));
    } catch {
      return [];
    }
  });

  const [savedStyles, setSavedStyles] = React.useState<any[]>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const saved = localStorage.getItem('avatar_saved_styles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [audioLevel, setAudioLevel] = React.useState<number[]>(new Array(10).fill(10));
  const [aiCreativePrompt, setAiCreativePrompt] = React.useState('');
  const [isGeneratingCreative, setIsGeneratingCreative] = React.useState(false);
  const [creativeStory, setCreativeStory] = React.useState<string | null>(null);

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: NodeJS.Timeout;

    if (isMotionCapture) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
          }
          setMotionCaptureError(false);
        })
        .catch(err => {
          console.error("Webcam error:", err);
          setMotionCaptureError(true);
          setIsMotionCapture(false);
        });
        
      interval = setInterval(() => {
        if (!isLive) {
            setAvatarState(Math.random() > 0.5 ? 'TALKING' : 'IDLE');
        }
      }, 2000);
    } else {
      if (webcamRef.current && webcamRef.current.srcObject) {
        const s = webcamRef.current.srcObject as MediaStream;
        s.getTracks().forEach(track => track.stop());
      }
      setTimeout(() => {
        if (!isLive) setAvatarState('IDLE');
      }, 0);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isMotionCapture, isLive]);

  React.useEffect(() => {
      autoRoutineRef.current = isAutoRoutine;
      if (isAutoRoutine) {
          runAutoRoutine();
      }
  }, [isAutoRoutine]);

  React.useEffect(() => {
    if (videoRef.current && !use3DMode) {
      let nextSrc = selectedAvatar.idleVideo;
      if (avatarState === 'TALKING') nextSrc = selectedAvatar.talkingVideo;
      if (avatarState === 'SINGING') nextSrc = selectedAvatar.singingVideo || selectedAvatar.talkingVideo;
      
      if (!videoRef.current.src.includes(nextSrc)) {
          videoRef.current.src = nextSrc;
          videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
      }
    }
  }, [avatarState, selectedAvatar, use3DMode]);

  React.useEffect(() => {
      if (avatarState !== 'IDLE') {
          const interval = setInterval(() => {
              setAudioLevel(prev => prev.map(() => Math.random() * 100));
          }, 100);
          return () => clearInterval(interval);
      } else {
          const timeout = setTimeout(() => {
              setAudioLevel(new Array(10).fill(5));
          }, 0);
          return () => clearTimeout(timeout);
      }
  }, [avatarState]);

  React.useEffect(() => {
      const timeout = setTimeout(() => {
          setCustomization(prev => ({
              ...prev,
              voicePitch: selectedAvatar.gender === 'FEMALE' ? 1.2 : 0.9,
              voiceName: selectedAvatar.gender === 'FEMALE' ? 'Kore' : 'Zephyr'
          }));
      }, 0);
      return () => clearTimeout(timeout);
  }, [selectedAvatar]);

  const generateResponse = React.useCallback(async (userMessage: string) => {
    setAvatarState('TALKING');
    
    try {
        const hasVideo = !!selectedProduct?.videoUrl || kolAssets.some(a => a.type === 'VIDEO');
        
        const { replyText, action } = await processAvatarInteraction(userMessage, {
            avatarName: selectedAvatar.name,
            product: selectedProduct,
            hasVideoAvailable: hasVideo
        });

        let finalReply = replyText;

        // Handle Actions
        if (action.type === 'VOUCHER') {
            setActiveVoucher(`${action.payload.code} - Giảm ${action.payload.discount}`);
            setTimeout(() => setActiveVoucher(null), 10000);
        } else if (action.type === 'PIN') {
            setPinnedProduct(action.payload.product);
            setTimeout(() => setPinnedProduct(null), 15000);
        } else if (action.type === 'VIDEO') {
            if (selectedProduct) {
                let videoToPlay = selectedProduct.videoUrl;
                if (!videoToPlay) {
                    const matchingKolVideo = kolAssets.find(asset => 
                        asset.type === 'VIDEO' && asset.name.toLowerCase().includes(selectedProduct.title.toLowerCase())
                    );
                    if (matchingKolVideo) videoToPlay = matchingKolVideo.url;
                }
                if (!videoToPlay) {
                    const anyKolVideo = kolAssets.find(asset => asset.type === 'VIDEO');
                    if (anyKolVideo) videoToPlay = anyKolVideo.url;
                }

                if (videoToPlay) {
                    setShowVideoOverlay(videoToPlay);
                    // Automatically move avatar to the side when video plays
                    setCurrentAnimation('Walking');
                    // Simulate moving to the side
                    setTimeout(() => {
                        setCurrentAnimation('Idle');
                    }, 2000);
                    
                    setTimeout(() => {
                        setShowVideoOverlay(null);
                        // Move back
                        setCurrentAnimation('Walking');
                        setTimeout(() => {
                            setCurrentAnimation('Idle');
                        }, 2000);
                    }, 15000);
                } else {
                    finalReply = `Dạ hiện tại sản phẩm này chưa có video chi tiết, bạn xem tạm hình ảnh giúp mình nhé!`;
                }
            }
        } else if (action.type === 'SING') {
            setAvatarState('SINGING');
            setCurrentAnimation('Dance');
            setLyrics([`🎵 Một bài hát về ${action.payload.topic || 'sản phẩm'}...`, "La la la..."]);
            setTimeout(() => {
                setAvatarState('IDLE');
                setCurrentAnimation('Idle');
                setLyrics([]);
            }, 8000);
        } else if (action.type === 'JOKE') {
            setCurrentAnimation('Wave');
            setTimeout(() => setCurrentAnimation('Idle'), 3000);
        } else if (action.type === 'CHANGE_OUTFIT') {
            const style = action.payload.style;
            const newOutfit = MOCK_OUTFITS.find(o => o.style === style) || MOCK_OUTFITS[0];
            setSelectedOutfit(newOutfit);
        } else if (action.type === 'CHANGE_ENV') {
            const envType = action.payload.envType;
            const newEnv = MOCK_ENVIRONMENTS.find(e => e.type === envType) || MOCK_ENVIRONMENTS[0];
            setSelectedEnv(newEnv);
        } else if (action.type === 'REFINE_MODEL') {
            const prompt = action.payload.prompt;
            refineAvatarRealism(prompt, customization).then(result => {
                if (result.customization) {
                    setCustomization(prev => ({ ...prev, ...result.customization }));
                }
                if (result.creativeStory) {
                    setCreativeStory(result.creativeStory);
                }
            });
        }

        setChatHistory(prev => [...prev, { user: selectedAvatar.name, text: finalReply }]);
        
        // Use Gemini TTS
        const audioData = await generateSpeech(finalReply, customization.voiceName);
        if (audioData) {
            playAudio(audioData);
        } else {
            // Fallback
            const utterance = new SpeechSynthesisUtterance(finalReply);
            utterance.lang = customization.language;
            window.speechSynthesis.speak(utterance);
            utterance.onend = () => setAvatarState('IDLE');
        }

    } catch (e) {
        console.error(e);
        setAvatarState('IDLE');
    }
  }, [selectedAvatar.name, customization, selectedProduct, kolAssets]);

  React.useEffect(() => {
      if (isLive) {
          const interval = setInterval(() => {
              const msgs = ['Sản phẩm đẹp quá!', 'Review chi tiết đi ạ', 'Có size M không?', 'Hát bài gì đi idol ơi'];
              const m = msgs[Math.floor(Math.random() * msgs.length)];
              setChatHistory(prev => [...prev.slice(-5), { user: 'KhachHang', text: m }]);
              
              if (Math.random() > 0.7 && avatarState === 'IDLE') {
                  generateResponse(m);
              }
          }, 4000);
          return () => clearInterval(interval);
      }
  }, [isLive, avatarState, generateResponse]);

  const generateAIChoreography = async () => {
      if (isAIRoutineRunning) {
          aiRoutineRef.current = false;
          setIsAIRoutineRunning(false);
          setCurrentAnimation('Idle');
          return;
      }

      setIsAIChoreographing(true);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Bạn là một đạo diễn sân khấu AI. Hãy tạo một chuỗi hành động trình diễn (choreography) cho một avatar 3D.
      Các hành động (animation) có sẵn: Idle, Dance, Wave, Walking, Running.
      Các hướng di chuyển (dir) có sẵn: FORWARD, BACKWARD, LEFT, RIGHT, NONE.
      Hãy trả về MỘT MẢNG JSON hợp lệ chứa các bước. Mỗi bước là một object có định dạng:
      {
        "animation": "Tên hành động",
        "dir": "Hướng di chuyển",
        "duration": Thời_gian_thực_hiện_bằng_mili_giây_từ_2000_đến_8000
      }
      Tạo khoảng 5-7 bước. Bước cuối cùng nên là Idle và NONE. Chỉ trả về mảng JSON, không có markdown hay text nào khác.`;
      
      try {
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              animation: { type: Type.STRING },
                              dir: { type: Type.STRING },
                              duration: { type: Type.NUMBER }
                          }
                      }
                  }
              }
          });
          
          const routine = JSON.parse(response.text.trim());
          executeRoutine(routine);
      } catch (e) {
          console.error("AI Choreography failed", e);
      } finally {
          setIsAIChoreographing(false);
      }
  };

  const executeRoutine = async (routine: any[]) => {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      setIsAutoRoutine(false); // Stop auto routine if running
      setIsAIRoutineRunning(true);
      aiRoutineRef.current = true;
      
      for (const step of routine) {
          if (!aiRoutineRef.current) break;
          setCurrentAnimation(step.animation);
          if (step.dir !== 'NONE') {
              setMoveCommand({ dir: step.dir, ts: Date.now() });
          }
          await wait(step.duration);
      }
      
      setIsAIRoutineRunning(false);
      aiRoutineRef.current = false;
  };

  const animations = [
      { id: 'Idle', name: 'Nghỉ', icon: <User size={14} /> },
      { id: 'Dance', name: 'Nhảy', icon: <Music size={14} /> },
      { id: 'Wave', name: 'Vẫy tay', icon: <Send size={14} /> },
      { id: 'Death', name: 'Ngất', icon: <Zap size={14} /> },
      { id: 'Sitting', name: 'Ngồi', icon: <Box size={14} /> },
      { id: 'Walking', name: 'Đi bộ', icon: <Move3d size={14} /> },
      { id: 'Running', name: 'Chạy', icon: <Zap size={14} /> },
  ];
  const runAutoRoutine = async () => {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      while (autoRoutineRef.current) {
          // 1. Move to left side
          setCurrentAnimation('Walking');
          setMoveCommand({ dir: 'LEFT', ts: Date.now() });
          await wait(1500);
          setMoveCommand({ dir: 'LEFT', ts: Date.now() });
          await wait(2000);
          if (!autoRoutineRef.current) break;
          
          // 2. Wave to audience
          setCurrentAnimation('Wave');
          await wait(3000);
          if (!autoRoutineRef.current) break;
          
          // 3. Move to right side
          setCurrentAnimation('Walking');
          setMoveCommand({ dir: 'RIGHT', ts: Date.now() });
          await wait(1500);
          setMoveCommand({ dir: 'RIGHT', ts: Date.now() });
          await wait(1500);
          setMoveCommand({ dir: 'RIGHT', ts: Date.now() });
          await wait(1500);
          setMoveCommand({ dir: 'RIGHT', ts: Date.now() });
          await wait(2000);
          if (!autoRoutineRef.current) break;
          
          // 4. Wave
          setCurrentAnimation('Wave');
          await wait(3000);
          if (!autoRoutineRef.current) break;
          
          // 5. Move to center
          setCurrentAnimation('Walking');
          setMoveCommand({ dir: 'LEFT', ts: Date.now() });
          await wait(1500);
          setMoveCommand({ dir: 'LEFT', ts: Date.now() });
          await wait(2000);
          if (!autoRoutineRef.current) break;
          
          // 6. Move down stairs step by step (more steps, slower)
          for (let i = 1; i <= 8; i++) {
              setCurrentAnimation('Walking');
              setMoveCommand({ dir: 'FORWARD', ts: Date.now() });
              await wait(3500); // 3.5s to walk one step (12 units at speed 4)
              if (!autoRoutineRef.current) break;
              
              // Pause and Dance/Wave/Idle
              setCurrentAnimation(i % 3 === 0 ? 'Dance' : (i % 2 === 0 ? 'Wave' : 'Idle'));
              await wait(3000);
              if (!autoRoutineRef.current) break;
          }
          
          if (!autoRoutineRef.current) break;
          
          // 7. Move back up to stage
          setCurrentAnimation('Walking');
          for (let i = 1; i <= 8; i++) {
              setMoveCommand({ dir: 'BACKWARD', ts: Date.now() });
              await wait(3500);
              if (!autoRoutineRef.current) break;
          }
          
          // 8. Final pose
          setCurrentAnimation('Idle');
          await wait(3000);
      }
  };

  const handleMove = (dir: string) => {
      setMoveCommand({ dir, ts: Date.now() });
  };

  const suggestOutfit = async () => {
      if (!selectedProduct) return;
      setIsSuggestingOutfit(true);
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Bạn là một chuyên gia thời trang AI. Hãy gợi ý một phong cách trang phục phù hợp nhất để quảng bá sản phẩm "${selectedProduct.title}" trong bối cảnh "${selectedEnv.name}". 
      Các phong cách có sẵn: ${[...new Set(MOCK_OUTFITS.map(o => o.style))].join(', ')}.
      Hãy trả về CHỈ MỘT TỪ khóa phong cách phù hợp nhất từ danh sách trên.`;
      
      try {
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt,
          });
          const style = response.text.trim().toUpperCase();
          const found = MOCK_OUTFITS.find(o => style.includes(o.style));
          if (found) setSelectedOutfit(found);
      } catch (e) {
          console.error("AI Suggestion failed", e);
      } finally {
          setIsSuggestingOutfit(false);
      }
  };

  const filteredOutfits = outfitCategory === 'ALL' 
    ? MOCK_OUTFITS 
    : MOCK_OUTFITS.filter(o => o.style === outfitCategory);

  const outfitCategories = ['ALL', ...new Set(MOCK_OUTFITS.map(o => o.style))];
  const generateAIScript = async () => {
      if (!selectedProduct) return;
      setIsGeneratingScript(true);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Bạn là một chuyên gia bán hàng livestream. Hãy viết một kịch bản ngắn (khoảng 3-4 câu) để chào hàng sản phẩm "${selectedProduct.title}" với giá ${selectedProduct.price}$. Kịch bản nên lôi cuốn, có lời chào và lời kêu gọi hành động.`;
      
      try {
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt,
          });
          setHostInput(response.text);
      } catch (e) {
          console.error("Script generation failed", e);
      } finally {
          setIsGeneratingScript(false);
      }
  };

  const saveCurrentStyle = (name: string) => {
    const newStyle = {
      id: Date.now().toString(),
      name,
      customization,
      selectedAvatarId: selectedAvatar.id,
      creativeStory
    };
    const updated = [...savedStyles, newStyle];
    setSavedStyles(updated);
    localStorage.setItem('avatar_saved_styles', JSON.stringify(updated));
  };

  const saveCustomModel = (url: string, name: string) => {
    const newAsset = {
      id: Date.now().toString(),
      name,
      url,
      type: 'VRM'
    };
    const updated = [...kolAssets, newAsset];
    setKolAssets(updated);
    localStorage.setItem('kol_assets', JSON.stringify(updated));
  };

  const handleAICreative = async () => {
    if (!aiCreativePrompt.trim()) return;
    setIsGeneratingCreative(true);
    try {
      const result = await refineAvatarRealism(aiCreativePrompt, customization);
      if (result.customization) {
        setCustomization(prev => ({ ...prev, ...result.customization }));
      }
      setCreativeStory(result.creativeStory);
    } catch (error) {
      console.error("AI Creative Error:", error);
    } finally {
      setIsGeneratingCreative(false);
    }
  };

  const playAudio = (base64Audio: string) => {
      if (audioRef.current) {
          audioRef.current.src = base64Audio;
          audioRef.current.play();
          audioRef.current.onended = () => {
              setAvatarState('IDLE');
          };
      }
  };

  const handleHostSpeak = async () => {
      if (!hostInput.trim()) return;
      
      setAvatarState('TALKING');
      setChatHistory(prev => [...prev, { user: selectedAvatar.name, text: hostInput }]);
      
      const audioData = await generateSpeech(hostInput, customization.voiceName);
      if (audioData) {
          playAudio(audioData);
      } else {
          const utterance = new SpeechSynthesisUtterance(hostInput);
          utterance.lang = customization.language;
          window.speechSynthesis.speak(utterance);
          utterance.onend = () => setAvatarState('IDLE');
      }
      setHostInput('');
  };

  const generateSong = async () => {
      setAvatarState('SINGING');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      try {
          const prompt = `Viết lời bài hát ngắn (4 dòng) quảng cáo sản phẩm: "${selectedProduct?.title}".`;
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt
          });
          const songText = response.text || "Sản phẩm tuyệt vời...";
          setLyrics(songText.split('\n').filter(l => l.trim()));
          
          setTimeout(() => {
              setAvatarState('IDLE');
              setLyrics([]);
          }, 8000);
      } catch {
          setAvatarState('IDLE');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10003] bg-[#0f172a] text-white flex flex-col h-screen w-screen overflow-hidden animate-in zoom-in-95">
      
      {/* Header */}
      <div className="bg-[#1e293b] p-4 flex justify-between items-center border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                  <Bot size={24} />
              </div>
              <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                      AmazeAvatar <span className="text-purple-400">Studio Pro</span>
                  </h2>
                  <p className="text-xs text-gray-400">Tạo nhân vật ảo & Livestream tự động</p>
              </div>
          </div>
          
          <div className="flex bg-gray-800 p-1 rounded-lg overflow-x-auto">
              {['SETUP', 'CUSTOMIZE', 'STUDIO', 'LIVE', 'AI_CREATIVE'].map((tab, idx) => (
                   <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)} 
                    className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                   >
                       {idx + 1}. {tab === 'SETUP' ? 'Model Gốc' : tab === 'CUSTOMIZE' ? 'Tùy chỉnh' : tab === 'STUDIO' ? 'Trang phục' : tab === 'LIVE' ? 'Phát sóng' : 'AI Sáng Tạo'}
                   </button>
              ))}
          </div>

          <button onClick={onClose} className="hover:bg-gray-700 p-2 rounded-full transition-colors"><X size={24}/></button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
          
          {/* LEFT SIDEBAR: Controls */}
          <div className="w-full md:w-96 bg-[#1e293b] border-r border-gray-700 p-4 overflow-y-auto custom-scrollbar shrink-0 pb-32">
              {activeTab === 'SETUP' && (
                  <div className="space-y-6 animate-in slide-in-from-left">
                      {/* 3D Mode Toggle */}
                      <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between">
                          <div>
                              <h3 className="font-bold text-sm text-blue-300 flex items-center gap-2"><Move3d size={16}/> Chế độ 3D Real-time</h3>
                              <p className="text-[10px] text-gray-400">Dùng mô hình 3D thay vì Video 2D</p>
                          </div>
                          <button 
                            onClick={() => setUse3DMode(!use3DMode)}
                            className={`w-12 h-6 rounded-full p-1 transition-all ${use3DMode ? 'bg-blue-500' : 'bg-gray-600'}`}
                          >
                              <div className={`w-4 h-4 rounded-full bg-white transition-all ${use3DMode ? 'translate-x-6' : 'translate-x-0'}`}/>
                          </button>
                      </div>

                      {/* Motion Capture Toggle */}
                      <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-xl flex items-center justify-between">
                          <div>
                              <h3 className="font-bold text-sm text-purple-300 flex items-center gap-2"><Camera size={16}/> Motion Capture</h3>
                              <p className="text-[10px] text-gray-400">Đồng bộ cử động khuôn mặt qua Camera</p>
                          </div>
                          <button 
                            onClick={() => setIsMotionCapture(!isMotionCapture)}
                            className={`w-12 h-6 rounded-full p-1 transition-all ${isMotionCapture ? 'bg-purple-500' : 'bg-gray-600'}`}
                          >
                              <div className={`w-4 h-4 rounded-full bg-white transition-all ${isMotionCapture ? 'translate-x-6' : 'translate-x-0'}`}/>
                          </button>
                      </div>

                      {/* Camera Views - Refinement for 3D Mode */}
                      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                              <Camera size={14}/> Góc quay Camera
                          </h3>
                          <div className="grid grid-cols-3 gap-2">
                              {(['WIDE', 'CLOSEUP', 'SIDE'] as CameraView[]).map(view => (
                                  <button 
                                    key={view}
                                    onClick={() => setCameraView(view)}
                                    className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${cameraView === view ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'}`}
                                  >
                                      {view === 'WIDE' ? 'Toàn cảnh' : view === 'CLOSEUP' ? 'Cận cảnh' : 'Góc nghiêng'}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                          <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-3"><User size={16}/> Tải lên mô hình .VRM</h3>
                          <input 
                            type="file" 
                            accept=".vrm"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const url = URL.createObjectURL(file);
                                    setCustomVrmUrl(url);
                                    setUse3DMode(true);
                                    // Automatically ask to save
                                    const name = prompt("Đặt tên cho mô hình này để lưu lại:");
                                    if (name) {
                                        saveCustomModel(url, name);
                                    }
                                }
                            }}
                            className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 cursor-pointer"
                          />
                          {customVrmUrl && (
                              <button 
                                onClick={() => setCustomVrmUrl(null)}
                                className="mt-2 text-xs text-red-400 hover:text-red-300"
                              >
                                  Xóa mô hình tùy chỉnh
                              </button>
                          )}
                      </div>

                      {kolAssets.length > 0 && (
                          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Mô hình đã lưu</h3>
                              <div className="grid grid-cols-2 gap-2">
                                  {kolAssets.map(asset => (
                                      <button 
                                        key={asset.id}
                                        onClick={() => {
                                            setCustomVrmUrl(asset.url);
                                            setUse3DMode(true);
                                        }}
                                        className={`p-2 rounded-lg border text-xs transition-all ${customVrmUrl === asset.url ? 'border-purple-500 bg-purple-500/20' : 'border-gray-700 hover:border-gray-600'}`}
                                      >
                                          {asset.name}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Chọn Nhân vật gốc</label>
                          <div className="grid grid-cols-2 gap-3">
                              {MOCK_AVATARS.map(av => (
                                  <div 
                                    key={av.id} 
                                    onClick={() => setSelectedAvatar(av)}
                                    className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all group ${selectedAvatar.id === av.id ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-gray-600 hover:border-gray-400'}`}
                                  >
                                      <img src={av.image} className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                      <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2">
                                          <p className="text-xs font-bold truncate">{av.name}</p>
                                          <p className="text-[10px] text-gray-300">{av.role}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'CUSTOMIZE' && (
                  <div className="space-y-6 animate-in slide-in-from-left">
                      {/* 1. Body & Skin */}
                      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                          <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 mb-4">
                              <Palette size={16}/> Ngoại hình (Tác động lên 3D)
                          </h3>
                          
                          <div className="space-y-4">
                              <div>
                                  <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-400">Chiều cao</span>
                                      <span>{Math.round(customization.heightScale * 170)} cm</span>
                                  </div>
                                  <input 
                                      type="range" min="0.9" max="1.1" step="0.01"
                                      value={customization.heightScale}
                                      onChange={(e) => setCustomization({...customization, heightScale: parseFloat(e.target.value)})}
                                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                  />
                              </div>

                              <div>
                                  <div className="flex justify-between text-xs mb-2">
                                      <span className="text-gray-400">Màu da (Đổi vật liệu Mesh)</span>
                                  </div>
                                  <div className="flex gap-2">
                                      {['#ffffff', '#fcece0', '#eac086', '#a16e4b', '#593b2b', '#22c55e', '#3b82f6'].map(color => (
                                          <button 
                                            key={color}
                                            onClick={() => setCustomization({...customization, skinToneHash: color})}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${customization.skinToneHash === color ? 'border-purple-500 scale-110' : 'border-gray-500'}`}
                                            style={{ backgroundColor: color }}
                                          />
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* 3. Voice & Language */}
                      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                          <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 mb-4">
                              <Speaker size={16}/> Giọng nói & Ngôn ngữ
                          </h3>
                          <div className="space-y-4">
                               <div>
                                  <label className="block text-xs text-gray-400 mb-2 flex items-center gap-1"><Languages size={12}/> Ngôn ngữ</label>
                                  <select 
                                    value={customization.language}
                                    onChange={(e) => setCustomization({...customization, language: e.target.value as any})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs outline-none"
                                  >
                                      <option value="vi-VN">Tiếng Việt</option>
                                      <option value="en-US">English (US)</option>
                                      <option value="ja-JP">Japanese</option>
                                  </select>
                               </div>
                               <div>
                                  <label className="block text-xs text-gray-400 mb-2 flex items-center gap-1"><Speaker size={12}/> Giọng nói (Gemini TTS)</label>
                                  <select 
                                    value={customization.voiceName}
                                    onChange={(e) => setCustomization({...customization, voiceName: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs outline-none"
                                  >
                                      <option value="Kore">Kore (Nữ)</option>
                                      <option value="Aoede">Aoede (Nữ)</option>
                                      <option value="Puck">Puck (Nam)</option>
                                      <option value="Charon">Charon (Nam)</option>
                                      <option value="Zephyr">Zephyr (Nam)</option>
                                      <option value="Fenrir">Fenrir (Nam)</option>
                                  </select>
                               </div>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'STUDIO' && (
                  <div className="space-y-6 animate-in slide-in-from-left">
                      <div>
                          <div className="flex justify-between items-center mb-3">
                              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                  <Palette size={14}/> Trang phục (Outfit)
                              </label>
                              <button 
                                onClick={suggestOutfit}
                                disabled={isSuggestingOutfit}
                                className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-colors flex items-center gap-1"
                              >
                                  <Bot size={12} className={isSuggestingOutfit ? 'animate-spin' : ''} />
                                  {isSuggestingOutfit ? 'Đang gợi ý...' : 'AI Gợi ý'}
                              </button>
                          </div>

                          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 mb-4">
                              <div className="flex justify-between items-center mb-2">
                                  <h3 className="text-[10px] font-bold text-gray-400 uppercase">Tùy chỉnh màu sắc</h3>
                                  <input 
                                    type="color" 
                                    value={customization.outfitColor}
                                    onChange={(e) => setCustomization(prev => ({ ...prev, outfitColor: e.target.value }))}
                                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                                  />
                              </div>
                              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                                  {outfitCategories.map(cat => (
                                      <button
                                        key={cat}
                                        onClick={() => setOutfitCategory(cat)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${outfitCategory === cat ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                      >
                                          {cat}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 mb-4">
                              <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Tải lên trang phục 3D (.VRM)</h3>
                              <input 
                                type="file" 
                                accept=".vrm"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        setCustomVrmOutfitUrl(url);
                                        setUse3DMode(true);
                                    }
                                }}
                                className="block w-full text-[10px] text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 cursor-pointer"
                              />
                              {customVrmOutfitUrl && (
                                  <button 
                                    onClick={() => setCustomVrmOutfitUrl(null)}
                                    className="mt-2 text-[10px] text-red-400 hover:text-red-300"
                                  >
                                      Xóa trang phục tùy chỉnh
                                  </button>
                              )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                              {filteredOutfits.map(outfit => (
                                  <div 
                                    key={outfit.id} 
                                    onClick={() => setSelectedOutfit(outfit)}
                                    className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all group ${selectedOutfit.id === outfit.id ? 'border-purple-500 ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-gray-600 hover:border-gray-400'}`}
                                  >
                                      <img src={outfit.image} className="w-full h-24 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                                          <p className="text-[10px] font-bold truncate">{outfit.name}</p>
                                          <p className="text-[8px] text-gray-400">{outfit.style}</p>
                                      </div>
                                      {selectedOutfit.id === outfit.id && (
                                          <div className="absolute top-1 right-1 bg-purple-500 rounded-full p-0.5">
                                              <CheckCircle size={10} className="text-white" />
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-3 rounded-xl border border-purple-500/30">
                          <div className="flex items-center justify-between">
                              <div>
                                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                      <Bot size={14} className="text-purple-400" /> Trình diễn Tự động
                                  </h4>
                                  <p className="text-[10px] text-gray-400">Avatar tự động di chuyển và tạo dáng</p>
                              </div>
                              <button 
                                onClick={() => setIsAutoRoutine(!isAutoRoutine)} 
                                className={`w-12 h-6 rounded-full p-1 transition-all ${isAutoRoutine ? 'bg-purple-500' : 'bg-gray-700'}`}
                              >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${isAutoRoutine ? 'translate-x-6' : 'translate-x-0'}`}/>
                              </button>
                          </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 p-3 rounded-xl border border-blue-500/30">
                          <div className="flex items-center justify-between">
                              <div>
                                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                      <Music size={14} className="text-blue-400" /> Đạo diễn AI
                                  </h4>
                                  <p className="text-[10px] text-gray-400">AI tự sáng tạo một điệu nhảy ngẫu nhiên</p>
                              </div>
                              <button 
                                onClick={generateAIChoreography} 
                                disabled={isAIChoreographing}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${isAIChoreographing ? 'bg-gray-600 text-gray-400' : (isAIRoutineRunning ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}`}
                              >
                                  {isAIChoreographing ? 'Đang soạn...' : (isAIRoutineRunning ? 'Dừng lại' : 'Bắt đầu')}
                              </button>
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                              <Box size={14}/> Thư viện Động tác (Animations)
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                              {animations.map(anim => (
                                  <button
                                    key={anim.id}
                                    onClick={() => setCurrentAnimation(anim.id)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${currentAnimation === anim.id ? 'bg-purple-600 border-purple-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                  >
                                      {anim.icon}
                                      <span className="text-[10px] mt-1 font-bold">{anim.name}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 text-center">
                              Điều hướng Di chuyển (Click để đi)
                          </label>
                          <div className="grid grid-cols-3 gap-1 max-w-[120px] mx-auto">
                              <div />
                              <button onClick={() => handleMove('FORWARD')} className="p-2 bg-gray-700 rounded hover:bg-gray-600 flex justify-center"><ArrowUp size={14}/></button>
                              <div />
                              <button onClick={() => handleMove('LEFT')} className="p-2 bg-gray-700 rounded hover:bg-gray-600 flex justify-center"><ArrowLeft size={14}/></button>
                              <button onClick={() => setResetPosTrigger(prev => prev + 1)} className="p-2 bg-purple-600 rounded hover:bg-purple-500 flex justify-center"><RefreshCw size={14}/></button>
                              <button onClick={() => handleMove('RIGHT')} className="p-2 bg-gray-700 rounded hover:bg-gray-600 flex justify-center"><ArrowRight size={14}/></button>
                              <div />
                              <button onClick={() => handleMove('BACKWARD')} className="p-2 bg-gray-700 rounded hover:bg-gray-600 flex justify-center"><ArrowDown size={14}/></button>
                              <div />
                          </div>
                          <p className="text-[8px] text-gray-500 text-center mt-2">Mỗi lần bấm tiến/lùi sẽ đi 1 bậc thang.</p>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                              <ImageIcon size={14}/> Bối cảnh (Background)
                          </label>
                          <div className="space-y-3">
                              {MOCK_ENVIRONMENTS.map(env => (
                                  <div 
                                    key={env.id} 
                                    onClick={() => setSelectedEnv(env)}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${selectedEnv.id === env.id ? 'bg-purple-900/30 border-purple-500' : 'bg-gray-800 border-transparent hover:bg-gray-700'}`}
                                  >
                                      <img src={env.image} className="w-16 h-10 object-cover rounded" />
                                      <div>
                                          <p className="text-xs font-bold">{env.name}</p>
                                          <p className="text-[10px] text-gray-400">{env.type}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'LIVE' && (
                  <div className="space-y-6 animate-in slide-in-from-left flex flex-col">
                      <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-gray-400 uppercase">Trạng thái</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isLive ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                  {isLive ? 'ON AIR' : 'OFFLINE'}
                              </span>
                          </div>
                          <div className="flex items-end gap-1 h-8 justify-center">
                              {audioLevel.map((level, i) => (
                                  <div key={i} className="w-1.5 bg-purple-500 rounded-t-sm transition-all duration-75" style={{ height: `${level}%` }}/>
                              ))}
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <label className="block text-xs font-bold text-gray-400 uppercase">Sản phẩm đang bán</label>
                              <button 
                                onClick={generateAIScript}
                                disabled={isGeneratingScript || !selectedProduct}
                                className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                              >
                                  <Bot size={12} className={isGeneratingScript ? 'animate-spin' : ''} />
                                  {isGeneratingScript ? 'Đang soạn...' : 'Soạn kịch bản AI'}
                              </button>
                          </div>
                          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-purple-500" onChange={(e) => {
                                const prod = products.find(p => p.id === e.target.value);
                                if(prod) setSelectedProduct(prod);
                            }}>
                              {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                          </select>
                      </div>

                      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-3 rounded-xl border border-purple-500/30">
                          <div className="flex items-center justify-between">
                              <div>
                                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                      <Zap size={14} className="text-yellow-400" /> Chế độ Runway Pro
                                  </h4>
                                  <p className="text-[10px] text-gray-400">Ánh sáng sân khấu & hiệu ứng nổi bật</p>
                              </div>
                              <button 
                                onClick={() => {
                                    setRunwayMode(!runwayMode);
                                    if (!runwayMode) setUse3DMode(true);
                                }} 
                                className={`w-12 h-6 rounded-full p-1 transition-all ${runwayMode ? 'bg-purple-500' : 'bg-gray-700'}`}
                              >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${runwayMode ? 'translate-x-6' : 'translate-x-0'}`}/>
                              </button>
                          </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-3 rounded-xl border border-purple-500/30">
                          <div className="flex items-center justify-between">
                              <div>
                                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                      <Bot size={14} className="text-purple-400" /> Trình diễn Tự động
                                  </h4>
                                  <p className="text-[10px] text-gray-400">Avatar tự động di chuyển và tạo dáng</p>
                              </div>
                              <button 
                                onClick={() => setIsAutoRoutine(!isAutoRoutine)} 
                                className={`w-12 h-6 rounded-full p-1 transition-all ${isAutoRoutine ? 'bg-purple-500' : 'bg-gray-700'}`}
                              >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${isAutoRoutine ? 'translate-x-6' : 'translate-x-0'}`}/>
                              </button>
                          </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 p-3 rounded-xl border border-blue-500/30">
                          <div className="flex items-center justify-between">
                              <div>
                                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                      <Music size={14} className="text-blue-400" /> Đạo diễn AI
                                  </h4>
                                  <p className="text-[10px] text-gray-400">AI tự sáng tạo một điệu nhảy ngẫu nhiên</p>
                              </div>
                              <button 
                                onClick={generateAIChoreography} 
                                disabled={isAIChoreographing}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${isAIChoreographing ? 'bg-gray-600 text-gray-400' : (isAIRoutineRunning ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}`}
                              >
                                  {isAIChoreographing ? 'Đang soạn...' : (isAIRoutineRunning ? 'Dừng lại' : 'Bắt đầu')}
                              </button>
                          </div>
                      </div>

                      <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 text-center">
                              Điều hướng Di chuyển (Click để đi)
                          </label>
                          <div className="grid grid-cols-3 gap-1 max-w-[120px] mx-auto">
                              <div />
                              <button onClick={() => handleMove('FORWARD')} className="p-2 bg-gray-700 rounded hover:bg-gray-600 flex justify-center"><ArrowUp size={14}/></button>
                              <div />
                              <button onClick={() => handleMove('LEFT')} className="p-2 bg-gray-700 rounded hover:bg-gray-600 flex justify-center"><ArrowLeft size={14}/></button>
                              <button onClick={() => setResetPosTrigger(prev => prev + 1)} className="p-2 bg-purple-600 rounded hover:bg-purple-500 flex justify-center"><RefreshCw size={14}/></button>
                              <button onClick={() => handleMove('RIGHT')} className="p-2 bg-gray-700 rounded hover:bg-gray-600 flex justify-center"><ArrowRight size={14}/></button>
                              <div />
                              <button onClick={() => handleMove('BACKWARD')} className="p-2 bg-gray-700 rounded hover:bg-gray-600 flex justify-center"><ArrowDown size={14}/></button>
                              <div />
                          </div>
                      </div>

                      <div className="h-40 bg-black/30 rounded-xl border border-gray-700 p-3 overflow-y-auto space-y-2">
                          {chatHistory.map((msg, idx) => (
                              <div key={idx} className="text-xs animate-in slide-in-from-left-2 fade-in">
                                  <span className={`font-bold ${msg.user === selectedAvatar.name ? 'text-purple-400' : 'text-blue-400'}`}>{msg.user}:</span> <span className="text-gray-300">{msg.text}</span>
                              </div>
                          ))}
                      </div>

                      {/* Host Input for Avatar to Speak */}
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              placeholder="Nhập câu thoại cho Avatar..."
                              value={hostInput}
                              onChange={(e) => setHostInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleHostSpeak()}
                              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs outline-none focus:border-purple-500"
                          />
                          <button 
                              onClick={handleHostSpeak}
                              disabled={avatarState !== 'IDLE' || !hostInput.trim()}
                              className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg disabled:opacity-50"
                          >
                              <Send size={16} />
                          </button>
                      </div>

                      <div className="space-y-2">
                          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 mb-2">
                              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Phát sóng đa nền tảng (Restream)</h4>
                              <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm flex items-center gap-2"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" className="w-4 h-4 filter invert" /> TikTok Live</span>
                                  <button onClick={() => setRestreamTikTok(!restreamTikTok)} className={`w-10 h-5 rounded-full p-1 transition-all ${restreamTikTok ? 'bg-green-500' : 'bg-gray-600'}`}>
                                      <div className={`w-3 h-3 rounded-full bg-white transition-all ${restreamTikTok ? 'translate-x-5' : 'translate-x-0'}`}/>
                                  </button>
                              </div>
                              <div className="flex items-center justify-between">
                                  <span className="text-sm flex items-center gap-2"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" className="w-4 h-4 filter invert" /> Facebook Live</span>
                                  <button onClick={() => setRestreamFacebook(!restreamFacebook)} className={`w-10 h-5 rounded-full p-1 transition-all ${restreamFacebook ? 'bg-green-500' : 'bg-gray-600'}`}>
                                      <div className={`w-3 h-3 rounded-full bg-white transition-all ${restreamFacebook ? 'translate-x-5' : 'translate-x-0'}`}/>
                                  </button>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                              <button onClick={generateSong} disabled={avatarState !== 'IDLE' || !isLive} className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"><Music size={14} /> Hát</button>
                              <button onClick={() => generateResponse("Hãy giới thiệu sản phẩm này")} disabled={!isLive || avatarState !== 'IDLE'} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"><MessageSquare size={14} /> Tự giới thiệu</button>
                          </div>
                          
                          <button onClick={() => setShowBridgeGuide(true)} className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                              <BookOpen size={14} /> Hướng dẫn kết nối OBS/VSeeFace
                          </button>

                          <button onClick={() => setIsLive(!isLive)} className={`w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                              {isLive ? <Radio size={18} /> : <Zap size={18} />} {isLive ? 'Dừng phát sóng' : 'Bắt đầu Livestream'}
                          </button>
                      </div>
                  </div>
              )}

              {activeTab === 'AI_CREATIVE' && (
                  <div className="space-y-6 animate-in slide-in-from-left">
                      <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl">
                          <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 mb-2">
                              <Zap size={16}/> AI Sáng Tạo Phong Cách
                          </h3>
                          <p className="text-xs text-gray-400 mb-4">Nhập ý tưởng của bạn, AI sẽ tự động tinh chỉnh các thông số 3D và giọng nói để phù hợp.</p>
                          
                          <textarea 
                            value={aiCreativePrompt}
                            onChange={(e) => setAiCreativePrompt(e.target.value)}
                            placeholder="Ví dụ: Biến nhân vật thành một chiến binh Cyberpunk lạnh lùng, giọng nói trầm ấm..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 outline-none transition-all h-32 resize-none mb-4"
                          />
                          
                          <button 
                            onClick={handleAICreative}
                            disabled={isGeneratingCreative || !aiCreativePrompt.trim()}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                          >
                              {isGeneratingCreative ? (
                                  <>
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      Đang sáng tạo...
                                  </>
                              ) : (
                                  <>
                                      <Zap size={16} /> Áp dụng phong cách AI
                                  </>
                              )}
                          </button>

                          {!isGeneratingCreative && creativeStory && (
                              <button 
                                onClick={() => {
                                    const name = prompt("Đặt tên cho phong cách này để lưu lại:");
                                    if (name) saveCurrentStyle(name);
                                }}
                                className="w-full mt-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold py-2 rounded-lg border border-gray-700 transition-all"
                              >
                                  Lưu phong cách này
                              </button>
                          )}
                      </div>

                      {savedStyles.length > 0 && (
                          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Phong cách đã lưu</h4>
                              <div className="space-y-2">
                                  {savedStyles.map(style => (
                                      <button 
                                        key={style.id}
                                        onClick={() => {
                                            setCustomization(style.customization);
                                            setCreativeStory(style.creativeStory);
                                            const avatar = MOCK_AVATARS.find(a => a.id === style.selectedAvatarId);
                                            if (avatar) setSelectedAvatar(avatar);
                                        }}
                                        className="w-full p-2 rounded-lg border border-gray-700 hover:border-purple-500 text-left transition-all"
                                      >
                                          <p className="text-xs font-bold text-purple-400">{style.name}</p>
                                          <p className="text-[10px] text-gray-500 truncate">{style.creativeStory}</p>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}

                      {creativeStory && (
                          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 animate-in fade-in slide-in-from-bottom-4">
                              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Câu chuyện phong cách</h4>
                              <p className="text-sm text-gray-300 italic leading-relaxed">"{creativeStory}"</p>
                          </div>
                      )}

                      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                          <h4 className="text-xs font-bold text-blue-400 uppercase mb-3">Thông số đã tinh chỉnh</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-black/30 p-2 rounded">
                                  <p className="text-[10px] text-gray-500">Màu da/Tint</p>
                                  <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: customization.skinToneHash }} />
                                      <p className="text-xs font-mono uppercase">{customization.skinToneHash}</p>
                                  </div>
                              </div>
                              <div className="bg-black/30 p-2 rounded">
                                  <p className="text-[10px] text-gray-500">Tỉ lệ chiều cao</p>
                                  <p className="text-xs font-bold">{customization.heightScale.toFixed(2)}x</p>
                              </div>
                              <div className="bg-black/30 p-2 rounded">
                                  <p className="text-[10px] text-gray-500">Tốc độ giọng</p>
                                  <p className="text-xs font-bold">{customization.voiceSpeed.toFixed(1)}x</p>
                              </div>
                              <div className="bg-black/30 p-2 rounded">
                                  <p className="text-[10px] text-gray-500">Cao độ giọng</p>
                                  <p className="text-xs font-bold">{customization.voicePitch.toFixed(1)}x</p>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
              {/* Bottom Spacer for Toolbar */}
              <div className="h-24" />
          </div>

          {/* CENTER STAGE: Preview */}
          <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
              
              {/* Webcam Preview for Motion Capture */}
              {isMotionCapture && !motionCaptureError && (
                <div className="absolute top-4 right-4 z-50 w-32 h-40 bg-black rounded-xl overflow-hidden border-2 border-purple-500 shadow-2xl">
                  <video 
                    ref={webcamRef} 
                    autoPlay 
                    muted 
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  <div className="absolute bottom-1 left-0 right-0 text-center">
                    <span className="bg-black/50 text-white text-[8px] px-2 py-0.5 rounded-full">Tracking Active</span>
                  </div>
                  {/* Simulated Face Mesh Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                    <div className="w-16 h-20 border border-green-400 rounded-[40%] animate-pulse" />
                  </div>
                </div>
              )}

              {motionCaptureError && (
                <div className="absolute top-4 right-4 z-50 w-32 h-12 bg-red-900/80 rounded-xl overflow-hidden border border-red-500 shadow-2xl flex items-center justify-center">
                  <span className="text-white text-[10px] px-2 text-center">Lỗi Camera</span>
                </div>
              )}

              {/* Background Layer */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                style={{ 
                    backgroundImage: `url(${selectedEnv.image})`, 
                    opacity: use3DMode ? 0 : 0.8 
                }}
              />
              <div 
                className="absolute inset-0 transition-colors duration-700 pointer-events-none mix-blend-overlay"
                style={{ backgroundColor: selectedEnv.lightingColor, opacity: use3DMode ? 0 : 0.3 }}
              />
              
              {/* Avatar Layer */}
              <div className="relative z-10 w-full h-full flex items-end justify-center">
                  
                  {/* Audio Element for TTS */}
                  <audio ref={audioRef} className="hidden" />

                  {/* Conditional Rendering: 2D Video vs 3D Canvas */}
                  {!use3DMode ? (
                      <div className="relative w-full h-full max-h-[800px] aspect-[9/16] flex items-end justify-center transition-transform duration-300" style={{ transform: `scale(${customization.heightScale})`, transformOrigin: 'bottom center' }}>
                        <video 
                            ref={videoRef}
                            src={selectedAvatar.idleVideo}
                            autoPlay loop muted 
                            className="h-full w-full object-cover transition-opacity duration-300"
                            style={{ 
                                filter: customization.skinToneHash !== '#ffffff' 
                                    ? `sepia(0.3) hue-rotate(-10deg) drop-shadow(0 0 10px ${selectedEnv.lightingColor}50)` 
                                    : `drop-shadow(0 0 10px ${selectedEnv.lightingColor}50)`
                            }}
                        />
                         {customization.skinToneHash !== '#ffffff' && (
                             <div className="absolute inset-0 bg-cover mix-blend-color pointer-events-none opacity-20" style={{ backgroundColor: customization.skinToneHash }}></div>
                        )}
                        {/* Outfit Overlay (Simulated for 2D) */}
                        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-cover bg-top mix-blend-overlay pointer-events-none opacity-40 transition-all duration-500" style={{ backgroundImage: `url(${selectedOutfit.image})` }} />
                      </div>
                  ) : (
                      // --- 3D CANVAS IMPLEMENTATION ---
                      <div className="w-full h-full bg-black overflow-hidden">
                          <Canvas shadows camera={{ position: [0, runwayMode ? 0.1 : 0.2, runwayMode ? 4 : 4.5], fov: runwayMode ? 35 : 40 }}>
                              <color attach="background" args={['#000000']} />
                              {/* Camera is fixed to prevent "breaking" the stage layout */}
                              <OrbitControls 
                                makeDefault 
                                enableZoom={false}
                                enablePan={false}
                                enableRotate={false}
                                target={[0, runwayMode ? 0.3 : 0.2, 0]}
                              />
                              <SceneController environment={selectedEnv} runwayMode={runwayMode} cameraView={cameraView} />
                              <ambientLight intensity={runwayMode ? 0.4 : 0.8} />
                              <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} intensity={runwayMode ? 3 : 1.5} castShadow />
                              <pointLight position={[-5, 5, 5]} intensity={runwayMode ? 1 : 0.5} />
                              
                              <Suspense fallback={null}>
                                  <Catwalk environment={selectedEnv} runwayMode={runwayMode} videoUrl={showVideoOverlay || selectedProduct?.videoUrl} />
                                  <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
                                      <group 
                                        position={selectedEnv.modelPosition || [0, -1.45, 0]} 
                                        scale={selectedEnv.modelScale || 1}
                                      >
                                          {customVrmUrl ? (
                                              <VRMAvatarModel 
                                                url={customVrmUrl} 
                                                customization={customization}
                                                isTalking={avatarState === 'TALKING' || avatarState === 'SINGING'}
                                                animation={currentAnimation}
                                                moveCommand={moveCommand}
                                                resetPosTrigger={resetPosTrigger}
                                              />
                                          ) : (
                                              <Avatar3DModel 
                                                url="https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb" 
                                                customization={customization}
                                                isTalking={avatarState === 'TALKING' || avatarState === 'SINGING'}
                                                animation={currentAnimation}
                                                moveCommand={moveCommand}
                                                resetPosTrigger={resetPosTrigger}
                                              />
                                          )}
                                          {customVrmOutfitUrl && (
                                              <VRMAvatarModel 
                                                url={customVrmOutfitUrl} 
                                                customization={customization}
                                                isTalking={avatarState === 'TALKING' || avatarState === 'SINGING'}
                                                animation={currentAnimation}
                                                moveCommand={moveCommand}
                                                resetPosTrigger={resetPosTrigger}
                                              />
                                          )}
                                      </group>
                                  </Float>
                                  <Environment preset="city" />
                                  <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                              </Suspense>
                              
                              <OrbitControls enablePan={false} enableZoom={true} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2} />
                          </Canvas>
                          
                          {/* 3D Mode Badge & Camera Controls */}
                          <div className="absolute bottom-16 left-4 flex flex-col gap-2 z-50">
                              <div className="bg-blue-600/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-white flex items-center gap-1 w-fit">
                                  <Box size={12}/> 3D Render Mode
                              </div>
                              <div className="flex gap-1 bg-black/50 backdrop-blur p-1 rounded-lg border border-white/10">
                                  <button 
                                    onClick={() => setCameraView('WIDE')}
                                    className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${cameraView === 'WIDE' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                  >
                                    Toàn cảnh
                                  </button>
                                  <button 
                                    onClick={() => setCameraView('CLOSEUP')}
                                    className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${cameraView === 'CLOSEUP' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                  >
                                    Cận cảnh
                                  </button>
                                  <button 
                                    onClick={() => setCameraView('PRODUCT')}
                                    className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${cameraView === 'PRODUCT' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                  >
                                    Góc sản phẩm
                                  </button>
                                  <button 
                                    onClick={() => setCameraView('AUDIENCE')}
                                    className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${cameraView === 'AUDIENCE' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                  >
                                    Góc khán giả
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Effects Layer (Singing, Speaking) - Shared between 2D/3D */}
                  {avatarState === 'SINGING' && (
                      <div className="absolute top-1/3 inset-x-0 text-center space-y-2 animate-bounce-slow pointer-events-none">
                          <Music size={48} className="text-pink-500 mx-auto animate-pulse" />
                          <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-xl inline-block max-w-xs">
                              {lyrics.map((line, i) => (
                                  <p key={i} className="text-pink-300 font-bold italic text-sm">{line}</p>
                              ))}
                          </div>
                      </div>
                  )}

                  {avatarState === 'TALKING' && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].user === selectedAvatar.name && (
                      <div className="absolute bottom-32 max-w-xs bg-black/70 backdrop-blur border border-purple-500/30 px-4 py-2 rounded-xl text-center animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
                          <p className="text-white text-sm font-medium">"{chatHistory[chatHistory.length - 1].text}"</p>
                      </div>
                  )}

                  {/* Active Voucher Overlay */}
                  {activeVoucher && (
                      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-xl shadow-2xl border-2 border-yellow-300 animate-in zoom-in spin-in-12 duration-500 z-50 text-center">
                          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-yellow-100 mb-2 inline-block">MÃ GIẢM GIÁ ĐỘC QUYỀN</div>
                          <h3 className="text-2xl font-black text-white drop-shadow-md">{activeVoucher}</h3>
                          <p className="text-xs text-white/80 mt-1">Lưu ngay kẻo lỡ!</p>
                      </div>
                  )}

                  {/* Pinned Product Overlay */}
                  {pinnedProduct && (
                      <div className="absolute bottom-16 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 z-50 cursor-pointer hover:bg-white/20 transition-all">
                          <img src={pinnedProduct.images[0]} className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">ĐANG GHIM</span>
                                  <span className="text-white/80 text-xs truncate">{pinnedProduct.title}</span>
                              </div>
                              <div className="flex items-end gap-2">
                                  <span className="text-lg font-bold text-white">${pinnedProduct.price || pinnedProduct.currentBid}</span>
                                  {pinnedProduct.type === 'AUCTION' && <span className="text-xs text-purple-300 mb-1">Đấu giá</span>}
                              </div>
                          </div>
                          <button className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                              Mua ngay
                          </button>
                      </div>
                  )}

                  {/* Product Video Overlay */}
                  {showVideoOverlay && (
                      <div className="absolute top-1/4 right-4 w-48 aspect-[9/16] bg-black rounded-xl overflow-hidden border-2 border-purple-500 shadow-2xl animate-in slide-in-from-right z-40">
                          <video 
                              src={showVideoOverlay} 
                              autoPlay 
                              loop 
                              muted 
                              className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <Radio size={10} /> LIVE DEMO
                          </div>
                      </div>
                  )}
              </div>

              {/* Status Overlay */}
              <div className="absolute top-4 right-4 flex gap-2 z-20">
                  <div className="bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-2">
                      {isLive ? <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/> : <div className="w-2 h-2 bg-gray-500 rounded-full"/>}
                      {isLive ? 'ON AIR' : 'OFFLINE'}
                  </div>
              </div>
          </div>
      </div>

      {/* Bridge Guide Modal */}
      {showBridgeGuide && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-2xl">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <BookOpen className="text-purple-400" size={20} />
                          Hướng dẫn Cài đặt Local Bridge (AmazeAvatar Pro)
                      </h2>
                      <button onClick={() => setShowBridgeGuide(false)} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-300 space-y-6">
                      <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl text-purple-200">
                          <p>Tính năng <strong>Local Bridge</strong> cho phép bạn kết nối bảng điều khiển AmazeAvatar Studio Pro trên nền web với các phần mềm Livestream chuyên nghiệp trên máy tính của bạn (OBS Studio và VSeeFace).</p>
                          <p className="mt-2">Điều này giúp bạn tạo ra một cỗ máy Livestream hoàn toàn tự động: AI (Gemini) suy nghĩ trên Web ➔ Ra lệnh cho VSeeFace nhép môi/biểu cảm ➔ OBS đổi cảnh/hiện sản phẩm.</p>
                      </div>

                      <div>
                          <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">1</div> Yêu cầu chuẩn bị</h3>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>Máy tính đã cài đặt <strong>Node.js</strong>.</li>
                              <li>Phần mềm <strong>OBS Studio</strong> (phiên bản mới nhất có sẵn WebSocket).</li>
                              <li>Phần mềm <strong>VSeeFace</strong> (dành cho Avatar 3D VRM).</li>
                          </ul>
                      </div>

                      <div>
                          <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">2</div> Khởi chạy Local Bridge Script</h3>
                          <ol className="list-decimal list-inside space-y-2 ml-2">
                              <li>Tạo một thư mục mới trên máy tính của bạn (ví dụ: <code className="bg-gray-800 px-1 rounded text-pink-400">amaze-bridge</code>).</li>
                              <li>Tải file <code className="bg-gray-800 px-1 rounded text-pink-400">local-bridge.js</code> từ mã nguồn hệ thống và lưu vào thư mục này.</li>
                              <li>Mở Terminal (hoặc Command Prompt) tại thư mục đó và chạy các lệnh sau:
                                  <pre className="bg-black p-3 rounded-lg mt-2 text-green-400 font-mono text-xs border border-gray-800">
                                      npm init -y<br/>
                                      npm install express cors obs-websocket-js
                                  </pre>
                              </li>
                              <li>Mở file <code className="bg-gray-800 px-1 rounded text-pink-400">local-bridge.js</code> bằng Notepad hoặc VS Code, tìm dòng <code className="bg-gray-800 px-1 rounded text-pink-400">const OBS_PASSWORD = 'your_obs_password_here';</code> và thay bằng mật khẩu OBS của bạn.</li>
                              <li>Khởi chạy script:
                                  <pre className="bg-black p-3 rounded-lg mt-2 text-green-400 font-mono text-xs border border-gray-800">
                                      node local-bridge.js
                                  </pre>
                              </li>
                          </ol>
                      </div>

                      <div>
                          <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">3</div> Cấu hình OBS Studio & VSeeFace</h3>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                  <h4 className="font-bold text-white mb-2">OBS Studio</h4>
                                  <ul className="list-disc list-inside space-y-1 text-xs">
                                      <li>Vào <strong>Tools</strong> ➔ <strong>WebSocket Server Settings</strong>.</li>
                                      <li>Tích chọn <strong>Enable WebSocket server</strong>.</li>
                                      <li>Đảm bảo <strong>Server Port</strong> là <code className="bg-gray-900 px-1 rounded">4455</code>.</li>
                                      <li>Tích chọn <strong>Enable Authentication</strong> và đặt mật khẩu.</li>
                                  </ul>
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                  <h4 className="font-bold text-white mb-2">VSeeFace</h4>
                                  <ul className="list-disc list-inside space-y-1 text-xs">
                                      <li>Vào <strong>Settings</strong> ➔ <strong>General Settings</strong>.</li>
                                      <li>Cuộn xuống phần <strong>OSC/VMC receiver</strong>.</li>
                                      <li>Tích chọn <strong>Enable OSC/VMC receiver</strong>.</li>
                                      <li>Đảm bảo <strong>Port</strong> là <code className="bg-gray-900 px-1 rounded">3333</code>.</li>
                                  </ul>
                              </div>
                          </div>
                      </div>

                      <div>
                          <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">4</div> Trải nghiệm</h3>
                          <p className="mb-2">Quay lại tab <strong>Phát sóng</strong>, nhấn <strong>Bắt đầu Livestream</strong> và thử chat với Avatar các câu lệnh như:</p>
                          <ul className="space-y-2 ml-2">
                              <li className="bg-gray-800 p-2 rounded border border-gray-700"><em>"Ghim sản phẩm này lên màn hình đi"</em> ➔ OBS tự động hiện hình ảnh sản phẩm.</li>
                              <li className="bg-gray-800 p-2 rounded border border-gray-700"><em>"Đổi sang cảnh ngoài trời đi"</em> ➔ OBS sẽ chuyển Scene.</li>
                              <li className="bg-gray-800 p-2 rounded border border-gray-700"><em>"Kể chuyện cười đi"</em> ➔ VSeeFace kích hoạt biểu cảm "Fun" (Vui vẻ).</li>
                          </ul>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-800 flex justify-end bg-gray-800/50 rounded-b-2xl">
                      <button onClick={() => setShowBridgeGuide(false)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                          Đã hiểu
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default VirtualAvatarStudio;
