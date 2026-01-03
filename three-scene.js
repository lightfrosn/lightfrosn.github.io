(function(){
  window.addEventListener('load', () => {
    try{
      if (typeof THREE === 'undefined') return;

      const container = document.getElementById('three-container');
      if (!container) return;

      const width = () => Math.max(1, container.clientWidth);
      const height = () => Math.max(1, container.clientHeight);
      const DPR = Math.min(window.devicePixelRatio || 1, 2);

      /* ───────── Renderer ───────── */
      const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
      renderer.setPixelRatio(DPR);
      renderer.setSize(width(), height(), false);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      /* ───────── Scene / Camera ───────── */
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width()/height(), 0.1, 2000);
      camera.position.set(0, 0, 50);
      
      const group = new THREE.Group();
      scene.add(group);

      /* ───────── Geometry ───────── */

      let POINT_COUNT = width() < 700 ? 900 : 1500;

      function buildLissajous(count){
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const color = new THREE.Color();

        const layers = 3;
        const perLayer = Math.floor(count / layers);

        let i3 = 0;

        for (let l = 0; l < layers; l++){
          const a = 3 + l;
          const b = 2 + l;
          const c = 4;
          const delta = Math.PI * 0.5 * l;

          for (let i = 0; i < perLayer; i++){
            const t = i / perLayer;
            const p = t * Math.PI * 2;

            positions[i3]     = Math.sin(a * p + delta) * 22;
            positions[i3 + 1] = Math.sin(b * p) * 14;
            positions[i3 + 2] = Math.sin(c * p + delta) * 18;

            /* EXACT fat-lines rainbow logic */
            color.setHSL(t, 1.0, 0.5);

            colors[i3]     = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            i3 += 3;
          }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        return geometry;
      }

      const geometry = buildLissajous(POINT_COUNT);

      /* ───────── Shaders ───────── */

      const uniforms = {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(9999,9999) },
        pixelRatio: { value: DPR },
        baseSize: { value: 6.0 },
        radius: { value: 0.18 } // pulse reach
      };

      const vertexShader = `
        uniform float time;
        uniform vec2 mouse;
        uniform float pixelRatio;
        uniform float baseSize;
        uniform float radius;

        varying vec3 vColor;

        void main(){
          vColor = color;

          vec3 pos = position;
          pos.x += sin(time + position.y * 0.05) * 0.6;
          pos.z += cos(time + position.x * 0.05) * 0.6;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vec4 clipPos = projectionMatrix * mvPosition;

          vec2 ndc = clipPos.xy / clipPos.w;
          float d = distance(ndc, mouse);
          float influence = 1.0 - smoothstep(0.0, radius, d);

          float wobble = 0.75 + 0.25 * sin(time * 2.0 + position.y * 0.1);
          float size = baseSize * (1.0 + influence * 2.8) * wobble;

          gl_PointSize = size * (1.0 / -mvPosition.z) * 40.0 * pixelRatio;
          gl_Position = clipPos;
        }
      `;

      const fragmentShader = `
        varying vec3 vColor;

        void main(){
          vec2 uv = gl_PointCoord - vec2(0.5);
          float r = length(uv);
          float fall = 1.0 - smoothstep(0.0, 0.5, r);
          if(fall < 0.05) discard;

          /* Solid, bright, no fade */
          gl_FragColor = vec4(vColor * 1.15, 1.0);
        }
      `;

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        vertexColors: true,
        transparent: true,
        depthTest: true
      });

      const points = new THREE.Points(geometry, material);
      group.add(points);

      group.rotation.x = -0.25;

      /* ───────── Interaction ───────── */

      function onPointerMove(e){
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        uniforms.mouse.value.set(x, y);
      }

      function onPointerLeave(){
        uniforms.mouse.value.set(9999,9999);
      }

      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerleave', onPointerLeave);

      /* ───────── Resize ───────── */

      function resize(){
        const w = width();
        const h = height();
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        uniforms.pixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
      }

      window.addEventListener('resize', resize);

      /* ───────── Animate ───────── */

      let last = performance.now();
      function animate(){
        const now = performance.now();
        const delta = (now - last) / 1000;
        last = now;

        uniforms.time.value += delta;
        group.rotation.y += delta * 0.12;
        group.position.y = Math.sin(uniforms.time.value * 0.4) * 0.5;

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }

      resize();
      animate();

    }catch(err){
      console.error(err);
    }
  });
})();
