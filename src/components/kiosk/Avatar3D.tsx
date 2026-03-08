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
}

// Human-like avatar mesh
function HumanAvatar({ isSpeaking, isListening, isThinking }: { isSpeaking: boolean; isListening: boolean; isThinking: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  const skinColor = useMemo(() => new THREE.Color("#e8b896"), []);
  const shirtColor = useMemo(() => new THREE.Color("#1a7a8a"), []);
  const accentColor = useMemo(() => new THREE.Color("#00d4ff"), []);
  const hairColor = useMemo(() => new THREE.Color("#1a1a2e"), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Idle breathing
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 1.5) * 0.02;
    }

    // Head movement
    if (headRef.current) {
      if (isSpeaking) {
        headRef.current.rotation.y = Math.sin(t * 2) * 0.1;
        headRef.current.rotation.x = Math.sin(t * 3) * 0.05;
      } else if (isListening) {
        headRef.current.rotation.z = Math.sin(t * 1.5) * 0.05;
        headRef.current.rotation.x = -0.1; // Slight tilt forward (attentive)
      } else if (isThinking) {
        headRef.current.rotation.x = Math.sin(t * 0.8) * 0.1 - 0.05;
        headRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
      } else {
        headRef.current.rotation.y = Math.sin(t * 0.5) * 0.05;
        headRef.current.rotation.x = Math.sin(t * 0.3) * 0.02;
      }
    }

    // Mouth animation
    if (mouthRef.current) {
      if (isSpeaking) {
        mouthRef.current.scale.y = 0.5 + Math.abs(Math.sin(t * 8)) * 1.5;
        mouthRef.current.scale.x = 1 + Math.sin(t * 6) * 0.3;
      } else {
        mouthRef.current.scale.y = 0.6;
        mouthRef.current.scale.x = 1;
      }
    }

    // Arm gestures
    if (leftArmRef.current) {
      if (isSpeaking) {
        leftArmRef.current.rotation.z = 0.3 + Math.sin(t * 2.5) * 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 1.8) * 0.2;
      } else if (isListening) {
        leftArmRef.current.rotation.z = 0.15;
        leftArmRef.current.rotation.x = -0.2;
      } else {
        leftArmRef.current.rotation.z = 0.1 + Math.sin(t * 0.8) * 0.05;
        leftArmRef.current.rotation.x = 0;
      }
    }
    if (rightArmRef.current) {
      if (isSpeaking) {
        rightArmRef.current.rotation.z = -0.3 + Math.sin(t * 2) * -0.25;
        rightArmRef.current.rotation.x = Math.sin(t * 2.2) * 0.15;
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
        <capsuleGeometry args={[0.35, 0.6, 8, 16]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>

      {/* Collar accent */}
      <mesh position={[0, 0.05, 0.15]}>
        <boxGeometry args={[0.3, 0.06, 0.15]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.3} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 0.65, 0]}>
        <mesh ref={headRef}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 0.12, -0.02]}>
          <sphereGeometry args={[0.31, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.1, 0.05, 0.26]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[-0.1, 0.05, 0.29]}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.1, 0.05, 0.26]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.1, 0.05, 0.29]}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>

        {/* Eyebrows */}
        <mesh position={[-0.1, 0.12, 0.27]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.08, 0.015, 0.01]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
        <mesh position={[0.1, 0.12, 0.27]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.08, 0.015, 0.01]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.02, 0.3]}>
          <coneGeometry args={[0.025, 0.06, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>

        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.1, 0.28]}>
          <boxGeometry args={[0.08, 0.025, 0.02]} />
          <meshStandardMaterial color="#c46b6b" roughness={0.4} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.3, 0, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>
        <mesh position={[0.3, 0, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[0.4, 0.05, 0]}>
        <mesh position={[0.08, -0.2, 0]}>
          <capsuleGeometry args={[0.07, 0.35, 8, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.6} />
        </mesh>
        {/* Hand */}
        <mesh position={[0.08, -0.48, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[-0.4, 0.05, 0]}>
        <mesh position={[-0.08, -0.2, 0]}>
          <capsuleGeometry args={[0.07, 0.35, 8, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.6} />
        </mesh>
        {/* Hand */}
        <mesh position={[-0.08, -0.48, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// Glow ring effect
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
    <mesh ref={ref} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.0, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
    </mesh>
  );
}

const Avatar3D = ({ isSpeaking = false, isListening = false, isThinking = false, status = "Ready to help" }: Avatar3DProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        {/* Glow backdrop */}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isSpeaking
            ? "shadow-[0_0_80px_hsl(187_100%_50%/0.4),0_0_160px_hsl(187_100%_50%/0.15)]"
            : isListening
            ? "shadow-[0_0_60px_hsl(270_80%_65%/0.35),0_0_120px_hsl(270_80%_65%/0.1)]"
            : "avatar-glow"
        }`} />

        <Canvas
          camera={{ position: [0, 0.2, 2.2], fov: 45 }}
          style={{ borderRadius: "50%", background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 2]} intensity={1} color="#ffffff" />
          <directionalLight position={[-1, 1, -1]} intensity={0.3} color="#00d4ff" />
          <pointLight position={[0, 2, 1]} intensity={0.5} color={isSpeaking ? "#00d4ff" : isListening ? "#a855f7" : "#00d4ff"} />

          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
            <HumanAvatar isSpeaking={isSpeaking} isListening={isListening} isThinking={isThinking} />
          </Float>

          <GlowRing color={isSpeaking ? "#00d4ff" : isListening ? "#a855f7" : "#00d4ff"} scale={1} speed={2} />

          <Environment preset="city" />
        </Canvas>

        {/* Speaking sound bars */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: [4, 12 + Math.random() * 8, 4] }}
                  transition={{ duration: 0.3 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.08 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listening bars */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-accent rounded-full"
                  animate={{ height: [3, 8 + Math.random() * 10, 3] }}
                  transition={{ duration: 0.2 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status */}
      <motion.div
        className="flex items-center gap-2"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            isSpeaking ? "bg-primary" : isListening ? "bg-accent" : isThinking ? "bg-primary" : "bg-primary/60"
          }`}
          animate={
            isSpeaking ? { scale: [1, 1.4, 1] } : isListening ? { scale: [1, 1.3, 1] } : { opacity: [0.5, 1, 0.5] }
          }
          transition={{ duration: isSpeaking ? 0.4 : 1.5, repeat: Infinity }}
        />
        <span className="text-sm text-muted-foreground font-display tracking-wide uppercase">{status}</span>
      </motion.div>
    </div>
  );
};

export default Avatar3D;
