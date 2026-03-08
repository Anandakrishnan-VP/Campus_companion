import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Text } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

interface Avatar3DProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  status?: string;
  onTap?: () => void;
}

/* ─── Stylized Female Character ─── */
function FemaleAvatar({ isSpeaking, isListening, isThinking }: { isSpeaking: boolean; isListening: boolean; isThinking: boolean }) {
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftEyebrowRef = useRef<THREE.Mesh>(null);
  const rightEyebrowRef = useRef<THREE.Mesh>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);
  const upperLipRef = useRef<THREE.Mesh>(null);
  const lowerLipRef = useRef<THREE.Mesh>(null);

  // Softer, warmer skin tones for a female character
  const skinColor = useMemo(() => new THREE.Color("#e8bc9a"), []);
  const skinDarker = useMemo(() => new THREE.Color("#d4a07a"), []);
  const lipColor = useMemo(() => new THREE.Color("#d46b7b"), []);
  const blushColor = useMemo(() => new THREE.Color("#e89a9a"), []);
  const hairColor = useMemo(() => new THREE.Color("#1a0f0a"), []);
  const blazerColor = useMemo(() => new THREE.Color("#1a2744"), []);
  const shirtColor = useMemo(() => new THREE.Color("#f0eff4"), []);
  const tieColor = useMemo(() => new THREE.Color("#0d8a94"), []);
  const eyeColor = useMemo(() => new THREE.Color("#3a2215"), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Idle breathing
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 1.5) * 0.015;
      bodyRef.current.rotation.y = Math.sin(t * 0.3) * 0.02; // subtle body sway
    }

    /* ── Head ── */
    if (headRef.current) {
      if (isSpeaking) {
        // Nodding while speaking
        headRef.current.rotation.x = Math.sin(t * 2.5) * 0.08;
        headRef.current.rotation.y = Math.sin(t * 1.8) * 0.1;
        headRef.current.rotation.z = Math.sin(t * 1.2) * 0.03;
      } else if (isListening) {
        // Slight tilt – attentive
        headRef.current.rotation.x = -0.06 + Math.sin(t * 0.8) * 0.03;
        headRef.current.rotation.z = 0.06 + Math.sin(t * 1.1) * 0.04;
        headRef.current.rotation.y = Math.sin(t * 0.6) * 0.05;
      } else if (isThinking) {
        headRef.current.rotation.x = -0.08 + Math.sin(t * 0.5) * 0.04;
        headRef.current.rotation.z = Math.sin(t * 0.4) * 0.06;
        headRef.current.rotation.y = Math.sin(t * 0.3) * 0.08;
      } else {
        headRef.current.rotation.y = Math.sin(t * 0.5) * 0.06;
        headRef.current.rotation.x = Math.sin(t * 0.3) * 0.025;
        headRef.current.rotation.z = Math.sin(t * 0.4) * 0.015;
      }
    }

    /* ── Eyes ── */
    if (leftPupilRef.current && rightPupilRef.current) {
      const px = Math.sin(t * 0.7) * 0.006;
      const py = Math.sin(t * 0.5) * 0.004;
      leftPupilRef.current.position.x = -0.09 + px;
      leftPupilRef.current.position.y = 0.06 + py;
      rightPupilRef.current.position.x = 0.09 + px;
      rightPupilRef.current.position.y = 0.06 + py;

      // Blink every ~3-5 seconds
      const blink = Math.sin(t * 0.7) > 0.98;
      const sc = blink ? 0.1 : 1;
      leftPupilRef.current.scale.y = sc;
      rightPupilRef.current.scale.y = sc;
    }

    /* ── Eyebrows ── */
    if (leftEyebrowRef.current && rightEyebrowRef.current) {
      if (isListening) {
        leftEyebrowRef.current.position.y = 0.15;
        rightEyebrowRef.current.position.y = 0.15;
        leftEyebrowRef.current.rotation.z = 0.08;
        rightEyebrowRef.current.rotation.z = -0.08;
      } else if (isThinking) {
        leftEyebrowRef.current.position.y = 0.14;
        leftEyebrowRef.current.rotation.z = 0.18;
        rightEyebrowRef.current.position.y = 0.12;
        rightEyebrowRef.current.rotation.z = -0.05;
      } else if (isSpeaking) {
        leftEyebrowRef.current.position.y = 0.13 + Math.sin(t * 3) * 0.01;
        rightEyebrowRef.current.position.y = 0.13 + Math.sin(t * 2.8) * 0.01;
        leftEyebrowRef.current.rotation.z = 0.1;
        rightEyebrowRef.current.rotation.z = -0.1;
      } else {
        leftEyebrowRef.current.position.y = 0.13;
        rightEyebrowRef.current.position.y = 0.13;
        leftEyebrowRef.current.rotation.z = 0.08;
        rightEyebrowRef.current.rotation.z = -0.08;
      }
    }

    /* ── Lips / Mouth ── */
    if (upperLipRef.current && lowerLipRef.current) {
      if (isSpeaking) {
        // Lip-sync simulation
        const open = Math.abs(Math.sin(t * 8)) * 0.03;
        const wide = 1 + Math.sin(t * 6) * 0.15;
        upperLipRef.current.position.y = -0.095 + open * 0.5;
        lowerLipRef.current.position.y = -0.115 - open;
        upperLipRef.current.scale.x = wide;
        lowerLipRef.current.scale.x = wide;
      } else if (isListening) {
        upperLipRef.current.position.y = -0.097;
        lowerLipRef.current.position.y = -0.11;
        upperLipRef.current.scale.x = 0.95;
        lowerLipRef.current.scale.x = 0.95;
      } else {
        // Resting — slight smile
        upperLipRef.current.position.y = -0.098;
        lowerLipRef.current.position.y = -0.108;
        upperLipRef.current.scale.x = 1;
        lowerLipRef.current.scale.x = 1;
      }
    }

    /* ── Arms ── */
    // Left arm
    if (leftArmRef.current && leftForearmRef.current && leftHandRef.current) {
      if (isListening) {
        // Hand to ear gesture
        leftArmRef.current.rotation.z = 0.6 + Math.sin(t * 1.2) * 0.04;
        leftArmRef.current.rotation.x = -0.4 + Math.sin(t * 0.8) * 0.03;
        leftForearmRef.current.rotation.x = -1.6 + Math.sin(t * 1) * 0.05;
      } else if (isSpeaking) {
        // Gesticulating
        leftArmRef.current.rotation.z = 0.25 + Math.sin(t * 2.2) * 0.3;
        leftArmRef.current.rotation.x = Math.sin(t * 1.6) * 0.2;
        leftForearmRef.current.rotation.x = -0.4 + Math.sin(t * 2.5) * 0.35;
      } else if (isThinking) {
        leftArmRef.current.rotation.z = 0.15;
        leftArmRef.current.rotation.x = 0;
        leftForearmRef.current.rotation.x = -0.2;
      } else {
        leftArmRef.current.rotation.z = 0.08 + Math.sin(t * 0.7) * 0.04;
        leftArmRef.current.rotation.x = 0;
        leftForearmRef.current.rotation.x = -0.1 + Math.sin(t * 0.6) * 0.05;
      }
    }

    // Right arm
    if (rightArmRef.current && rightForearmRef.current && rightHandRef.current) {
      if (isListening) {
        // Other hand also raised slightly
        rightArmRef.current.rotation.z = -0.4 + Math.sin(t * 1.1) * -0.03;
        rightArmRef.current.rotation.x = -0.2 + Math.sin(t * 0.9) * 0.03;
        rightForearmRef.current.rotation.x = -0.8 + Math.sin(t * 0.8) * 0.05;
      } else if (isSpeaking) {
        rightArmRef.current.rotation.z = -0.25 + Math.sin(t * 1.8) * -0.25;
        rightArmRef.current.rotation.x = Math.sin(t * 2) * 0.18;
        rightForearmRef.current.rotation.x = -0.3 + Math.sin(t * 2.2) * 0.3;
      } else if (isThinking) {
        // Hand on chin
        rightArmRef.current.rotation.z = -0.5;
        rightArmRef.current.rotation.x = -0.5;
        rightForearmRef.current.rotation.x = -1.8 + Math.sin(t * 0.4) * 0.08;
      } else {
        rightArmRef.current.rotation.z = -0.08 + Math.sin(t * 0.6) * -0.04;
        rightArmRef.current.rotation.x = 0;
        rightForearmRef.current.rotation.x = -0.1 + Math.sin(t * 0.5) * 0.05;
      }
    }
  });

  return (
    <group ref={bodyRef} position={[0, -0.15, 0]}>
      {/* ─── Torso - Professional Uniform ─── */}
      {/* Blazer body */}
      <mesh position={[0, -0.2, 0]}>
        <capsuleGeometry args={[0.28, 0.5, 12, 24]} />
        <meshStandardMaterial color={blazerColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Waist taper */}
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.15, 24]} />
        <meshStandardMaterial color={blazerColor} roughness={0.5} />
      </mesh>
      {/* White shirt collar V */}
      <mesh position={[0, 0.12, 0.18]}>
        <torusGeometry args={[0.12, 0.018, 8, 24, Math.PI]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      {/* Shirt front visible between lapels */}
      <mesh position={[0, 0.0, 0.26]} scale={[0.55, 1.2, 0.1]}>
        <boxGeometry args={[0.2, 0.25, 0.05]} />
        <meshStandardMaterial color={shirtColor} roughness={0.3} />
      </mesh>
      {/* Left lapel */}
      <mesh position={[-0.08, 0.02, 0.27]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.08, 0.2, 0.015]} />
        <meshStandardMaterial color={blazerColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Right lapel */}
      <mesh position={[0.08, 0.02, 0.27]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.08, 0.2, 0.015]} />
        <meshStandardMaterial color={blazerColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Tie */}
      <mesh position={[0, -0.08, 0.275]}>
        <boxGeometry args={[0.04, 0.22, 0.01]} />
        <meshStandardMaterial color={tieColor} roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Tie knot */}
      <mesh position={[0, 0.04, 0.28]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={tieColor} roughness={0.3} />
      </mesh>

      {/* ─── YUKTI Nameplate ─── */}
      {/* Gold plate background */}
      <mesh position={[-0.12, -0.05, 0.285]}>
        <boxGeometry args={[0.1, 0.03, 0.005]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.15} />
      </mesh>
      {/* Nameplate border */}
      <mesh position={[-0.12, -0.05, 0.284]}>
        <boxGeometry args={[0.105, 0.035, 0.003]} />
        <meshStandardMaterial color="#a07830" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* YUKTI text */}
      <Text
        position={[-0.12, -0.05, 0.29]}
        fontSize={0.018}
        color="#1a2744"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        YUKTI
      </Text>

      {/* ─── Neck ─── */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.065, 0.08, 0.16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* ─── Head ─── */}
      <group ref={headRef} position={[0, 0.65, 0]}>
        {/* Head - slightly more oval/feminine */}
        <mesh scale={[1, 1.08, 0.95]}>
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshStandardMaterial color={skinColor} roughness={0.38} />
        </mesh>

        {/* Chin - softer, smaller */}
        <mesh position={[0, -0.16, 0.06]} scale={[0.85, 0.7, 0.8]}>
          <sphereGeometry args={[0.17, 24, 24]} />
          <meshStandardMaterial color={skinColor} roughness={0.38} />
        </mesh>

        {/* Cheeks (blush) */}
        <mesh position={[-0.15, -0.02, 0.2]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color={blushColor} roughness={0.6} transparent opacity={0.35} />
        </mesh>
        <mesh position={[0.15, -0.02, 0.2]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color={blushColor} roughness={0.6} transparent opacity={0.35} />
        </mesh>

        {/* ── Hair ── */}
        {/* Main hair volume */}
        <mesh position={[0, 0.1, -0.03]} scale={[1.08, 1, 1.05]}>
          <sphereGeometry args={[0.28, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        {/* Hair sides - flowing */}
        <mesh position={[-0.24, -0.04, -0.02]} scale={[0.6, 1.3, 0.7]}>
          <capsuleGeometry args={[0.08, 0.18, 8, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.24, -0.04, -0.02]} scale={[0.6, 1.3, 0.7]}>
          <capsuleGeometry args={[0.08, 0.18, 8, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        {/* Hair back */}
        <mesh position={[0, -0.05, -0.18]} scale={[1, 1.2, 0.6]}>
          <capsuleGeometry args={[0.22, 0.15, 12, 24]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        {/* Bangs / fringe */}
        <mesh position={[0, 0.18, 0.16]} rotation={[0.3, 0, 0]} scale={[1.2, 0.3, 0.5]}>
          <sphereGeometry args={[0.18, 24, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        {/* Hair parting highlight */}
        <mesh position={[-0.05, 0.22, 0.08]} rotation={[0.2, 0.3, 0]} scale={[0.15, 0.08, 0.2]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#2a1a12" roughness={0.7} />
        </mesh>

        {/* ── Eyes ── */}
        {/* Eye whites - slightly larger, more expressive */}
        <mesh position={[-0.09, 0.06, 0.23]}>
          <sphereGeometry args={[0.042, 20, 20]} />
          <meshStandardMaterial color="white" roughness={0.2} />
        </mesh>
        <mesh position={[0.09, 0.06, 0.23]}>
          <sphereGeometry args={[0.042, 20, 20]} />
          <meshStandardMaterial color="white" roughness={0.2} />
        </mesh>

        {/* Iris */}
        <mesh ref={leftPupilRef} position={[-0.09, 0.06, 0.265]}>
          <sphereGeometry args={[0.024, 16, 16]} />
          <meshStandardMaterial color={eyeColor} roughness={0.3} />
        </mesh>
        <mesh ref={rightPupilRef} position={[0.09, 0.06, 0.265]}>
          <sphereGeometry args={[0.024, 16, 16]} />
          <meshStandardMaterial color={eyeColor} roughness={0.3} />
        </mesh>

        {/* Pupil center (darker) */}
        <mesh position={[-0.09, 0.06, 0.275]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color="#0a0503" />
        </mesh>
        <mesh position={[0.09, 0.06, 0.275]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color="#0a0503" />
        </mesh>

        {/* Eye glints */}
        <mesh position={[-0.082, 0.068, 0.28]}>
          <sphereGeometry args={[0.005, 8, 8]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0.098, 0.068, 0.28]}>
          <sphereGeometry args={[0.005, 8, 8]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.5} />
        </mesh>

        {/* Eyelashes (upper lids) */}
        <mesh position={[-0.09, 0.095, 0.24]} rotation={[0.15, 0, 0.05]} scale={[1.2, 0.3, 0.4]}>
          <sphereGeometry args={[0.04, 16, 8]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
        <mesh position={[0.09, 0.095, 0.24]} rotation={[0.15, 0, -0.05]} scale={[1.2, 0.3, 0.4]}>
          <sphereGeometry args={[0.04, 16, 8]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>

        {/* ── Eyebrows ── more arched/feminine */}
        <mesh ref={leftEyebrowRef} position={[-0.09, 0.13, 0.24]} rotation={[0, 0, 0.08]}>
          <capsuleGeometry args={[0.007, 0.06, 6, 12]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
        <mesh ref={rightEyebrowRef} position={[0.09, 0.13, 0.24]} rotation={[0, 0, -0.08]}>
          <capsuleGeometry args={[0.007, 0.06, 6, 12]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>

        {/* ── Nose ── smaller, feminine */}
        <mesh position={[0, -0.01, 0.27]} rotation={[0.15, 0, 0]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color={skinDarker} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.02, 0.26]}>
          <boxGeometry args={[0.012, 0.05, 0.01]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>

        {/* ── Lips ── full, feminine */}
        {/* Upper lip */}
        <mesh ref={upperLipRef} position={[0, -0.098, 0.255]} scale={[1, 1, 1]}>
          <capsuleGeometry args={[0.012, 0.05, 8, 12]} />
          <meshStandardMaterial color={lipColor} roughness={0.25} metalness={0.05} />
        </mesh>
        {/* Lower lip - slightly fuller */}
        <mesh ref={lowerLipRef} position={[0, -0.11, 0.252]} scale={[1, 1.1, 1]}>
          <capsuleGeometry args={[0.014, 0.045, 8, 12]} />
          <meshStandardMaterial color={lipColor} roughness={0.25} metalness={0.05} />
        </mesh>

        {/* ── Ears ── */}
        <mesh position={[-0.25, 0, -0.02]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
        <mesh position={[0.25, 0, -0.02]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
        {/* Earrings */}
        <mesh position={[-0.26, -0.05, -0.01]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color={tieColor} emissive={tieColor} emissiveIntensity={0.5} metalness={0.8} roughness={0.1} />
        </mesh>
        <mesh position={[0.26, -0.05, -0.01]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color={tieColor} emissive={tieColor} emissiveIntensity={0.5} metalness={0.8} roughness={0.1} />
        </mesh>
      </group>

      {/* ─── Left Arm ─── */}
      <group ref={leftArmRef} position={[0.32, 0.05, 0]}>
        {/* Upper arm */}
        <mesh position={[0.05, -0.14, 0]}>
          <capsuleGeometry args={[0.055, 0.22, 8, 16]} />
          <meshStandardMaterial color={blazerColor} roughness={0.5} />
        </mesh>
        {/* Forearm */}
        <group ref={leftForearmRef} position={[0.06, -0.3, 0]}>
          <mesh position={[0, -0.08, 0]}>
            <capsuleGeometry args={[0.042, 0.18, 8, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.38} />
          </mesh>
          {/* Hand */}
          <mesh ref={leftHandRef} position={[0, -0.22, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.38} />
          </mesh>
          {/* Fingers hint */}
          <mesh position={[0, -0.26, 0.01]}>
            <boxGeometry args={[0.05, 0.03, 0.02]} />
            <meshStandardMaterial color={skinColor} roughness={0.38} />
          </mesh>
        </group>
      </group>

      {/* ─── Right Arm ─── */}
      <group ref={rightArmRef} position={[-0.32, 0.05, 0]}>
        <mesh position={[-0.05, -0.14, 0]}>
          <capsuleGeometry args={[0.055, 0.22, 8, 16]} />
          <meshStandardMaterial color={blazerColor} roughness={0.5} />
        </mesh>
        <group ref={rightForearmRef} position={[-0.06, -0.3, 0]}>
          <mesh position={[0, -0.08, 0]}>
            <capsuleGeometry args={[0.042, 0.18, 8, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.38} />
          </mesh>
          <mesh ref={rightHandRef} position={[0, -0.22, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.38} />
          </mesh>
          <mesh position={[0, -0.26, 0.01]}>
            <boxGeometry args={[0.05, 0.03, 0.02]} />
            <meshStandardMaterial color={skinColor} roughness={0.38} />
          </mesh>
        </group>
      </group>

      {/* ─── Shoulders (rounded) ─── */}
      <mesh position={[0.3, 0.08, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={blazerColor} roughness={0.5} />
      </mesh>
      <mesh position={[-0.3, 0.08, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={blazerColor} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ─── Glow ring under character ─── */
function GlowRing({ color, speed }: { color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.scale.setScalar(1 + Math.sin(t * speed) * 0.08);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * speed) * 0.08;
    }
  });
  return (
    <mesh ref={ref} position={[0, -0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.7, 0.82, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ─── Main component ─── */
const Avatar3D = ({ isSpeaking = false, isListening = false, isThinking = false, status = "Ready to help", onTap }: Avatar3DProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-52 h-52 md:w-64 md:h-64 cursor-pointer"
        onClick={onTap}
        title={isListening ? "Tap to stop listening" : "Tap to start listening"}
      >
        {/* Glow backdrop */}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isSpeaking
            ? "shadow-[0_0_80px_hsl(var(--primary)/0.4),0_0_160px_hsl(var(--primary)/0.15)]"
            : isListening
            ? "shadow-[0_0_60px_hsl(var(--accent)/0.35),0_0_120px_hsl(var(--accent)/0.1)]"
            : "shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
        }`} />

        <Canvas
          camera={{ position: [0, 0.2, 2.6], fov: 40 }}
          style={{ borderRadius: "50%", background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[2, 3, 2]} intensity={1.3} color="#ffffff" />
          <directionalLight position={[-2, 1, -1]} intensity={0.25} color="#00d4ff" />
          <pointLight position={[0, 2, 1.5]} intensity={0.4} color={isSpeaking ? "#00d4ff" : isListening ? "#a855f7" : "#ffffff"} />
          <pointLight position={[0, -1, 2]} intensity={0.15} color="#ffb088" />

          <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
            <FemaleAvatar isSpeaking={isSpeaking} isListening={isListening} isThinking={isThinking} />
          </Float>

          <GlowRing color={isSpeaking ? "#00d4ff" : isListening ? "#a855f7" : "#00d4ff"} speed={2} />

          <Environment preset="city" />
        </Canvas>

        {/* Tap hint overlay */}
        {!isSpeaking && !isListening && !isThinking && (
          <div className="absolute inset-0 rounded-full flex items-end justify-center pb-2 pointer-events-none">
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
                <motion.div key={i} className="w-1 bg-primary rounded-full" animate={{ height: [4, 14 + Math.random() * 8, 4] }} transition={{ duration: 0.3 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.08 }} />
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
