import { useEffect, useRef } from "react";
import * as THREE from "three";

const CLICK_WORDS = [
  "hello!",
  "hey :)",
  "welcome",
  "✨",
  "👋",
  "creative",
  "code",
  "build",
  "ship it",
  "nice!",
  "🚀",
  "pixels",
  "vibes",
];

const INSTANCES = 50;
const SIZE_MIN = 1.5;
const COLOUR = 0xa855f7;
const POSITION_BOUNDS = {
  x: 60,
  y: 40,
  z: 100,
};

const ROTATION_SPEED = {
  x: 0.0005,
  y: 0.0002,
  z: 0.003,
};

export default function InteractiveBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const mouse = new THREE.Vector2(0, 0);
    const targetGroupRotation = { x: 0, y: 0 };

    const cubes: THREE.Mesh[] = [];
    const count = INSTANCES;

    for (let i = 0; i < count; i++) {
      const size = SIZE_MIN + Math.random() * 0.1;
      const geometry = new THREE.IcosahedronGeometry(size, 0);
      const material = new THREE.MeshBasicMaterial({
        color: COLOUR,
        wireframe: true,
        transparent: true,
        opacity: 1,
      });
      const cube = new THREE.Mesh(geometry, material);

      cube.position.set(
        (Math.random() - 0.5) * POSITION_BOUNDS.x,
        (Math.random() - 0.5) * POSITION_BOUNDS.y,
        (Math.random() - 0.5) * POSITION_BOUNDS.z,
      );
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );

      cube.userData.rotSpeed = {
        x: (Math.random() - 0.5) * ROTATION_SPEED.z,
        y: (Math.random() - 0.5) * ROTATION_SPEED.z,
        z: (Math.random() - 0.5) * ROTATION_SPEED.z,
      };
      cube.userData.basePos = cube.position.clone();

      group.add(cube);
      cubes.push(cube);
    }

    // --- Click text sprites ---
    interface FloatingText {
      sprite: THREE.Sprite;
      velocity: THREE.Vector3;
      life: number;
    }
    const floatingTexts: FloatingText[] = [];

    function createTextSprite(text: string): THREE.Sprite {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = 256;
      canvas.height = 64;

      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = "#a855f7";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 128, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(4, 1, 1);
      return sprite;
    }

    function spawnClickText(clientX: number, clientY: number) {
      const ndcX = (clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(clientY / window.innerHeight) * 2 + 1;

      const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
      vec.unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const dist = 20;
      const pos = camera.position.clone().add(dir.multiplyScalar(dist));

      const word = CLICK_WORDS[Math.floor(Math.random() * CLICK_WORDS.length)];
      const sprite = createTextSprite(`${clientX}, ${clientY}`);
      sprite.position.copy(pos);
      scene.add(sprite);

      floatingTexts.push({
        sprite,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          0.03 + Math.random() * 0.02,
          0,
        ),
        life: 1.0,
      });
    }

    // --- Main Loop ---
    let animationId: number;

    const loop = () => {
      animationId = requestAnimationFrame(loop);

      group.rotation.y += ROTATION_SPEED.y;
      group.rotation.x += ROTATION_SPEED.x;

      for (const cube of cubes) {
        cube.rotation.x += cube.userData.rotSpeed.x;
        cube.rotation.y += cube.userData.rotSpeed.y;
        cube.rotation.z += cube.userData.rotSpeed.z;

        let worldPos = new THREE.Vector3();
        cube.getWorldPosition(worldPos);

        const distance = worldPos.distanceTo(camera.position);

        (cube.material as THREE.MeshBasicMaterial).opacity = Math.max(
          1 - distance / 50,
          0.2,
        );
      }

      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.sprite.position.add(ft.velocity);
        ft.life -= 0.008;
        (ft.sprite.material as THREE.SpriteMaterial).opacity = Math.max(
          ft.life,
          0,
        );
        if (ft.life <= 0) {
          scene.remove(ft.sprite);
          ft.sprite.material.dispose();
          floatingTexts.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    loop();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isBackground =
        target === document.body ||
        target === container ||
        target === renderer.domElement;
      if (!isBackground) return;
      // spawnClickText(e.clientX, e.clientY);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
