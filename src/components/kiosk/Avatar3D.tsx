import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

interface Avatar3DProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  status?: string;
  onTap?: () => void;
}

function HumanAvatar({ isSpeaking, isListening, isThinking }: { isSpeaking: boolean; isListening: boolean; isThinking: boolean }) {
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftEyebrowRef = useRef<THREE.Mesh>(null);
  const rightEyebrowRef = useRef<THREE.Mesh>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);

  const skinColor = useMemo(() => new THREE.Color("#e8b896"), []);
  const shirtColor = useMemo(() => new THREE.Color("#1a7a8a"), []);
  const accentColor = useMemo(() => new THREE.Color("#00d4ff"), []);
  const hairColor = useMemo(() => new THREE.Color("#1a1a2e"), []);
  const pantsColor = useMemo(() => new THREE.Color("#2a2a3e"), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Idle breathing
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 1.5) * 0.02;
    }

    // Head movement
    if (headRef.current) {
      if (isSpeaking) {
        headRef.current.rotation.y = Math.sin(t * 2) * 0.12;
        headRef.current.rotation.x = Math.sin(t * 3) * 0.06;
        headRef.current.rotation.z = Math.sin(t * 1.5) * 0.03;
      } else if (isListening) {
        headRef.current.rotation.z = Math.sin(t * 1.2) * 0.04;
        headRef.current.rotation.x = -0.08;
        headRef.current.rotation.y = Math.sin(t * 0.8) * 0.06;
      } else if (isThinking) {
        headRef.current.rotation.x = -0.1 + Math.sin(t * 0.6) * 0.05;
        headRef.current.rotation.z = Math.sin(t * 0.4) * 0.06;
        headRef.current.rotation.y = Math.sin(t * 0.3) * 0.08;
      } else {
        headRef.current.rotation.y = Math.sin(t * 0.5) * 0.06;
        headRef.current.rotation.x = Math.sin(t * 0.3) * 0.03;
        headRef.current.rotation.z = Math.sin(t * 0.4) * 0.02;
      }
    }

    // Eye tracking (subtle pupil movement)
    if (leftPupilRef.current && rightPupilRef.current) {
      const px = Math.sin(t * 0.7) * 0.008;
      const py = Math.sin(t * 0.5) * 0.005;
      leftPupilRef.current.position.x = -0.1 + px;
      leftPupilRef.current.position.y = 0.05 + py;
      rightPupilRef.current.position.x = 0.1 + px;
      rightPupilRef.current.position.y = 0.05 + py;
    }

    // Eyebrow expressions
    if (leftEyebrowRef.current && rightEyebrowRef.current) {
      if (isListening) {
        leftEyebrowRef.current.position.y = 0.14;
        rightEyebrowRef.current.position.y = 0.14;
      } else if (isThinking) {
        leftEyebrowRef.current.position.y = 0.13;
        leftEyebrowRef.current.rotation.z = 0.2;
        rightEyebrowRef.current.position.y = 0.11;
        rightEyebrowRef.current.rotation.z = -0.05;
      } else {
        leftEyebrowRef.current.position.y = 0.12;
        leftEyebrowRef.current.rotation.z = 0.1;
        rightEyebrowRef.current.position.y = 0.12;
        rightEyebrowRef.current.rotation.z = -0.1;
      }
    }

    // Mouth animation
    if (mouthRef.current) {
      if (isSpeaking) {
        mouthRef.current.scale.y = 0.5 + Math.abs(Math.sin(t * 8)) * 1.8;
        mouthRef.current.scale.x = 1 + Math.sin(t * 6) * 0.3;
      } else if (isListening) {
        // Slight open mouth (attentive)
        mouthRef.current.scale.y = 0.8;
        mouthRef.current.scale.x = 0.9;
      } else {
        mouthRef.current.scale.y = 0.6;
        mouthRef.current.scale.x = 1;
      }
    }

    // Arm gestures
    if (leftArmRef.current) {
      if (isSpeaking) {
        leftArmRef.current.rotation.z = 0.3 + Math.sin(t * 2.5) * 0.35;
        leftArmRef.current.rotation.x = Math.sin(t * 1.8) * 0.25;
      } else if (isListening) {
        // Hand cupped near ear - listening gesture
        leftArmRef.current.rotation.z = 0.8 + Math.sin(t * 1.5) * 0.05;
        leftArmRef.current.rotation.x = -0.6 + Math.sin(t * 1) * 0.05;
      } else if (isThinking) {
        leftArmRef.current.rotation.z = 0.2;
        leftArmRef.current.rotation.x = -0.3;
      } else {
        leftArmRef.current.rotation.z = 0.1 + Math.sin(t * 0.8) * 0.05;
        leftArmRef.current.rotation.x = 0;
      }
    }
    if (rightArmRef.current) {
      if (isSpeaking) {
        rightArmRef.current.rotation.z = -0.3 + Math.sin(t * 2) * -0.3;
        rightArmRef.current.rotation.x = Math.sin(t * 2.2) * 0.2;
      } else if (isListening) {
        // Other hand cupped near ear too
        rightArmRef.current.rotation.z = -0.8 + Math.sin(t * 1.3) * -0.05;
        rightArmRef.current.rotation.x = -0.6 + Math.sin(t * 0.9) * 0.05;
      } else if (isThinking) {
        rightArmRef.current.rotation.z = -0.6;
        rightArmRef.current.rotation.x = -0.8 + Math.sin(t * 0.5) * 0.1;
      } else {
        rightArmRef.current.rotation.z = -0.1 + Math.sin(t * 0.7) * -0.05;
        rightArmRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Body / Torso */}
      <mesh position={[0, -0.3, 0]}>
        <capsuleGeometry args={[0.35, 0.6, 12, 24]} />
        <meshStandardMaterial color={shirtColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Collar accent stripe */}
      <mesh position={[0, 0.05, 0.2]}>
        <boxGeometry args={[0.25, 0.04, 0.1]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.4} />
      </mesh>

      {/* Shoulder pads */}
      <mesh position={[0.38, 0.05, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={shirtColor} roughness={0.5} />
      </mesh>
      <mesh position={[-0.38, 0.05, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={shirtColor} roughness={0.5} />
      </mesh>

      {/* Belt area */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.36, 0.34, 0.06, 24]} />
        <meshStandardMaterial color={pantsColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 0.65, 0]}>
        {/* Head shape - slightly oval */}
        <mesh>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>

        {/* Jaw */}
        <mesh position={[0, -0.15, 0.05]}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>

        {/* Hair - styled */}
        <mesh position={[0, 0.12, -0.02]}>
          <sphereGeometry args={[0.31, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hairColor} roughness={0.7} />
        </mesh>
        {/* Side hair */}
        <mesh position={[-0.28, 0.02, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.7} />
        </mesh>
        <mesh position={[0.28, 0.02, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.7} />
        </mesh>

        {/* Eyes - white */}
        <mesh position={[-0.1, 0.05, 0.26]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.1, 0.05, 0.26]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>

        {/* Pupils */}
        <mesh ref={leftPupilRef} position={[-0.1, 0.05, 0.295]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh ref={rightPupilRef} position={[0.1, 0.05, 0.295]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>

        {/* Eye glint */}
        <mesh position={[-0.09, 0.06, 0.3]}>
          <sphereGeometry args={[0.006, 8, 8]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0.11, 0.06, 0.3]}>
          <sphereGeometry args={[0.006, 8, 8]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
        </mesh>

        {/* Eyebrows */}
        <mesh ref={leftEyebrowRef} position={[-0.1, 0.12, 0.27]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.09, 0.018, 0.015]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
        <mesh ref={rightEyebrowRef} position={[0.1, 0.12, 0.27]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.09, 0.018, 0.015]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.02, 0.3]}>
          <coneGeometry args={[0.025, 0.07, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        {/* Nose bridge */}
        <mesh position={[0, 0.02, 0.29]}>
          <boxGeometry args={[0.02, 0.06, 0.02]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>

        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.1, 0.28]}>
          <boxGeometry args={[0.08, 0.025, 0.02]} />
          <meshStandardMaterial color="#c46b6b" roughness={0.35} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.3, 0, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        <mesh position={[0.3, 0, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[0.42, 0.05, 0]}>
        {/* Upper arm */}
        <mesh position={[0.06, -0.15, 0]}>
          <capsuleGeometry args={[0.065, 0.25, 8, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.5} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0.08, -0.4, 0]}>
          <capsuleGeometry args={[0.055, 0.2, 8, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        {/* Hand */}
        <mesh position={[0.08, -0.55, 0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        {/* Fingers (simplified) */}
        <mesh position={[0.08, -0.6, 0.02]}>
          <boxGeometry args={[0.06, 0.04, 0.03]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[-0.42, 0.05, 0]}>
        <mesh position={[-0.06, -0.15, 0]}>
          <capsuleGeometry args={[0.065, 0.25, 8, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.5} />
        </mesh>
        <mesh position={[-0.08, -0.4, 0]}>
          <capsuleGeometry args={[0.055, 0.2, 8, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        <mesh position={[-0.08, -0.55, 0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        <mesh position={[-0.08, -0.6, 0.02]}>
          <boxGeometry args={[0.06, 0.04, 0.03]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
      </group>
    </group>
  );
}

function GlowRing({ color, scale, speed }: { color: string; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.scale.setScalar(scale + Math.sin(t * speed) * 0.1);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * speed) * 0.1;
    }
  });
  return (
    <mesh ref={ref} position={[0, -0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.0, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
    </mesh>
  );
}

const Avatar3D = ({ isSpeaking = false, isListening = false, isThinking = false, status = "Ready to help", onTap }: Avatar3DProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-48 h-48 md:w-56 md:h-56 cursor-pointer"
        onClick={onTap}
        title={isListening ? "Tap to stop listening" : "Tap to start listening"}
      >
        {/* Glow backdrop */}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isSpeaking
            ? "shadow-[0_0_80px_hsl(187_100%_50%/0.4),0_0_160px_hsl(187_100%_50%/0.15)]"
            : isListening
            ? "shadow-[0_0_60px_hsl(270_80%_65%/0.35),0_0_120px_hsl(270_80%_65%/0.1)]"
            : "avatar-glow"
        }`} />

        <Canvas
          camera={{ position: [0, 0.2, 2.4], fov: 42 }}
          style={{ borderRadius: "50%", background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} color="#ffffff" />
          <directionalLight position={[-2, 1, -1]} intensity={0.3} color="#00d4ff" />
          <pointLight position={[0, 2, 1]} intensity={0.5} color={isSpeaking ? "#00d4ff" : isListening ? "#a855f7" : "#00d4ff"} />
          <pointLight position={[0, -1, 2]} intensity={0.2} color="#ff9966" />

          <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.25}>
            <HumanAvatar isSpeaking={isSpeaking} isListening={isListening} isThinking={isThinking} />
          </Float>

          <GlowRing color={isSpeaking ? "#00d4ff" : isListening ? "#a855f7" : "#00d4ff"} scale={1} speed={2} />

          <Environment preset="city" />
        </Canvas>

        {/* Tap hint overlay */}
        {!isSpeaking && !isListening && !isThinking && (
          <div className="absolute inset-0 rounded-full flex items-end justify-center pb-1 pointer-events-none">
            <motion.span
              className="text-[9px] text-muted-foreground/60 font-display bg-background/40 px-2 py-0.5 rounded-full backdrop-blur-sm"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Tap to speak
            </motion.span>
          </div>
        )}

        {/* Speaking bars */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div key={i} className="w-1 bg-primary rounded-full" animate={{ height: [4, 12 + Math.random() * 8, 4] }} transition={{ duration: 0.3 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.08 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listening bars */}
        <AnimatePresence>
          {isListening && (
            <motion.div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div key={i} className="w-1 bg-accent rounded-full" animate={{ height: [3, 8 + Math.random() * 10, 3] }} transition={{ duration: 0.2 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status */}
      <motion.div className="flex items-center gap-2" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
        <motion.div
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            isSpeaking ? "bg-primary" : isListening ? "bg-accent" : isThinking ? "bg-primary" : "bg-primary/60"
          }`}
          animate={isSpeaking ? { scale: [1, 1.4, 1] } : isListening ? { scale: [1, 1.3, 1] } : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: isSpeaking ? 0.4 : 1.5, repeat: Infinity }}
        />
        <span className="text-sm text-muted-foreground font-display tracking-wide uppercase">{status}</span>
      </motion.div>
    </div>
  );
};

export default Avatar3D;
