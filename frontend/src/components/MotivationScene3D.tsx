import { useEffect, useRef } from "react";
import * as THREE from "three";

function makeGlowTexture(colorInner: string, colorOuter: string) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, colorInner);
  gradient.addColorStop(1, colorOuter);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * A large, abstract geometric scene: a faceted core with two orbiting solids
 * inside a slowly counter-rotating wireframe shell, with sparks drifting
 * upward through the frame. Deliberately abstract rather than illustrative —
 * meant to read as a premium, technical product visual rather than a toy.
 * Purely ambient (pointer-events-none, no interaction).
 */
export function MotivationScene3D({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.3, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const sky = new THREE.Color("#38BDF8");
    const gold = new THREE.Color("#F5C542");
    const charcoal = new THREE.Color("#334155");

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(4, 5, 5);
    scene.add(key);
    const fillLight = new THREE.DirectionalLight(sky, 0.9);
    fillLight.position.set(-5, 1, 3);
    scene.add(fillLight);
    const rim = new THREE.PointLight(gold, 10, 24);
    rim.position.set(-2, -2, -3);
    scene.add(rim);
    const rim2 = new THREE.PointLight(sky, 8, 20);
    rim2.position.set(3, 3, -4);
    scene.add(rim2);

    // Faceted core — the visual anchor.
    const core = new THREE.Group();
    const coreMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.35, 1),
      new THREE.MeshPhysicalMaterial({
        color: sky,
        metalness: 0.85,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
        flatShading: true,
      })
    );
    core.add(coreMesh);

    // Outer wireframe shell — slow counter-rotation reads as "technical", not toy-like.
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.35, 1),
      new THREE.MeshBasicMaterial({ color: sky, wireframe: true, transparent: true, opacity: 0.22 })
    );
    scene.add(shell);

    // Two orbiting solids — abstract "goals" without literal iconography.
    const satelliteGeoA = new THREE.OctahedronGeometry(0.42, 0);
    const satelliteMatA = new THREE.MeshPhysicalMaterial({
      color: gold,
      metalness: 0.8,
      roughness: 0.25,
      clearcoat: 0.8,
      emissive: gold,
      emissiveIntensity: 0.15,
      flatShading: true,
    });
    const satelliteA = new THREE.Mesh(satelliteGeoA, satelliteMatA);

    const satelliteGeoB = new THREE.DodecahedronGeometry(0.32, 0);
    const satelliteMatB = new THREE.MeshPhysicalMaterial({
      color: charcoal,
      metalness: 0.7,
      roughness: 0.3,
      clearcoat: 0.6,
      flatShading: true,
    });
    const satelliteB = new THREE.Mesh(satelliteGeoB, satelliteMatB);

    const orbitA = new THREE.Group();
    orbitA.add(satelliteA);
    orbitA.rotation.x = 0.5;
    const orbitB = new THREE.Group();
    orbitB.add(satelliteB);
    orbitB.rotation.x = -0.35;
    orbitB.rotation.z = 0.6;
    scene.add(orbitA, orbitB);

    // A quiet starfield for depth.
    const starCount = 200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 6 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      starPositions[i * 3 + 2] = radius * Math.cos(phi) - 4;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.4 })
    );
    scene.add(stars);

    // Sparks drifting upward through the frame — the one "motivational" motion cue,
    // abstract rather than illustrative (rising, not literally a rocket exhaust).
    const sparkCount = 40;
    const sparks = new THREE.Group();
    const sparkData: { mesh: THREE.Mesh; speed: number; offset: number }[] = [];
    const sparkColors = [sky, gold];
    for (let i = 0; i < sparkCount; i++) {
      const color = sparkColors[i % sparkColors.length];
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true })
      );
      const offset = Math.random() * 6 - 3;
      mesh.position.set((Math.random() - 0.5) * 5, offset, (Math.random() - 0.5) * 3 - 1);
      sparks.add(mesh);
      sparkData.push({ mesh, speed: 0.15 + Math.random() * 0.25, offset });
    }
    scene.add(sparks);

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture("rgba(56,189,248,0.35)", "rgba(56,189,248,0)"),
        transparent: true,
        depthWrite: false,
      })
    );
    glow.scale.set(7, 7, 1);
    glow.position.set(0, 0, -3);
    scene.add(glow);

    let frameId = 0;
    let time = 0;
    let visible = true;

    const animate = () => {
      if (visible) {
        time += 0.01;

        core.rotation.y += 0.0035;
        core.rotation.x += 0.0012;
        shell.rotation.y -= 0.0015;
        shell.rotation.x += 0.0008;

        orbitA.rotation.y += 0.012;
        satelliteA.rotation.y += 0.02;
        orbitB.rotation.y -= 0.008;
        satelliteB.rotation.x += 0.018;

        sparkData.forEach(({ mesh, speed, offset }) => {
          const y = ((offset + time * speed * 4) % 6) - 3;
          mesh.position.y = y;
          const fade = 1 - Math.abs(y) / 3;
          (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, fade) * 0.8;
        });

        stars.rotation.y += 0.0003;

        camera.position.x = Math.sin(time * 0.15) * 0.5;
        camera.position.y = 0.3 + Math.sin(time * 0.1) * 0.15;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }
      frameId = requestAnimationFrame(animate);
    };

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      if (!clientWidth || !clientHeight) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    resize();
    animate();

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
        if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    />
  );
}
