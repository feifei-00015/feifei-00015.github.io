import * as THREE from './vendor/three.module.min.js';

function mount(host, word) {
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const categories = [
  { word: 'Movie', slug: 'movie', count: 17 },
  { word: 'TV Show', slug: 'tv-show', count: 12 },
  { word: 'Life', slug: 'life', count: 21 },
  { word: 'Book', slug: 'book', count: 15 },
];

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.z = 5;

const target = new THREE.WebGLRenderTarget(1, 1, { format: THREE.RGBAFormat });
const postScene = new THREE.Scene();
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postMaterial = new THREE.ShaderMaterial({
  uniforms: { image: { value: target.texture }, cylindricalFactor: { value: 0.7 } },
  vertexShader: `varying vec2 vUv;
    void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
  fragmentShader: `uniform sampler2D image;
    uniform float cylindricalFactor;
    varying vec2 vUv;
    void main(){
      float x=abs(0.5-vUv.x)*2.0;
      float edge=x*x;
      float compressedY=vUv.y*cylindricalFactor+(1.0-cylindricalFactor)*0.5;
      vec2 distorted=vec2(vUv.x,mix(vUv.y,compressedY,edge));
      gl_FragColor=texture2D(image,distorted);
    }`,
  transparent: true,
  depthTest: false,
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial));

const alphaCanvas = document.createElement('canvas');
alphaCanvas.width = alphaCanvas.height = 128;
const alphaContext = alphaCanvas.getContext('2d');
alphaContext.fillStyle = '#000';
alphaContext.fillRect(0, 0, 128, 128);
alphaContext.fillStyle = '#fff';
alphaContext.beginPath();
alphaContext.roundRect(0, 0, 128, 128, 3);
alphaContext.fill();
const roundedAlpha = new THREE.CanvasTexture(alphaCanvas);

const cards = [];
let visible = false;
const geometry = new THREE.PlaneGeometry(1, 1);
const loader = new THREE.TextureLoader();
const textureSets = categories.map(({ slug, count }) => Promise.all(
  Array.from({ length: count }, async (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    const texture = await loader.loadAsync(`../assets/taste/personal/${slug}-${number}.webp`);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }),
));
Array.from({ length: 24 }, (_, index) => {
  const material = new THREE.MeshBasicMaterial({
    alphaMap: roundedAlpha,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  scene.add(mesh);
  const card = { mesh, material, direction: index % 2 === 0 ? -1 : 1, index, progress: 0, active: false };
  cards.push(card);
});

let visibleWidth = 1;
function resize() {
  const width = host.clientWidth;
  const height = host.clientHeight;
  renderer.setSize(width, height, false);
  target.setSize(Math.round(width * renderer.getPixelRatio()), Math.round(height * renderer.getPixelRatio()));
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  visibleWidth = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
}
addEventListener('resize', resize);
resize();

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
let started = false;
let lastFrame = 0;
let fireAccumulator = 0;
const nextFireIndex = [0, 0];
function fireNext(side) {
  const pool = cards.filter(card => card.direction === side).sort((a, b) => a.index - b.index);
  const slot = side === -1 ? 0 : 1;
  for (let offset = 0; offset < pool.length; offset++) {
    const index = (nextFireIndex[slot] + offset) % pool.length;
    if (!pool[index].active) {
      pool[index].active = true;
      pool[index].progress = 0;
      nextFireIndex[slot] = (index + 1) % pool.length;
      break;
    }
  }
}
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000 || 0, 0.1);
  lastFrame = now;
  renderer.setRenderTarget(target);
  renderer.clear();
  if (started && !reducedMotion) {
    fireAccumulator += dt;
    while (fireAccumulator >= 1.8) {
      fireAccumulator -= 1.8;
      fireNext(-1);
      fireNext(1);
    }
  }
  for (const card of cards) {
    const p = card.progress;
    const ease = 0.5 * smoothstep(0, 1, p) ** 2 + 0.5 * smoothstep(0, 1, p);
    const scale = 0.125 * smoothstep(0, 0.15, p) + 0.875 * smoothstep(0.2, 1, p);
    card.mesh.position.x = card.direction * visibleWidth * 1.65 * ease * 0.5;
    card.mesh.scale.setScalar((innerWidth > 700 ? 0.75 : 1.2) * visibleWidth * scale * 0.5);
    card.mesh.renderOrder = ease + scale;
    card.mesh.visible = card.active && p < 1;
    if (card.active && !reducedMotion) {
      card.progress += dt / 19.2;
      if (card.progress >= 1) card.active = false;
    }
  }
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(postScene, postCamera);
  if (visible) requestAnimationFrame(frame);
}

const showCategory = (textures) => {
  cards.forEach((card, index) => {
    card.material.map = textures[index % textures.length];
    card.material.needsUpdate = true;
  });
};

textureSets[0].then((textures) => {
  showCategory(textures);
  for (const card of cards) {
    const progress = Math.floor(card.index / 2) * 0.09375;
    card.active = progress < 1;
    card.progress = progress;
  }
  started = true;
});

let categoryIndex = 0;
let categoryTimer;
let isChanging = false;
let scheduleCategory = () => {};
let cycleCategory = () => {};
if (!reducedMotion) {
  function swapWord(current, next) {
    const style = getComputedStyle(word);
    const fontSize = parseFloat(style.fontSize);
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = style.font;
    const width = Math.ceil(Math.max(measure.measureText(current).width, measure.measureText(next).width) + 8);
    const height = Math.ceil(fontSize * 1.2);
    const dpr = devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const context = canvas.getContext('2d');
    const source = document.createElement('canvas');
    source.width = canvas.width;
    source.height = canvas.height;
    const sourceContext = source.getContext('2d');
    const small = document.createElement('canvas');
    word.style.width = `${width}px`;
    word.classList.add('swapping');
    word.append(canvas);
    const start = performance.now();
    function draw(now) {
      const progress = Math.min((now - start) / 650, 1);
      const text = progress < 0.5 ? current : next;
      const block = 1 + Math.round((fontSize / 8 - 1) * Math.sin(Math.PI * progress));
      sourceContext.clearRect(0, 0, source.width, source.height);
      sourceContext.save();
      sourceContext.scale(dpr, dpr);
      sourceContext.font = style.font;
      sourceContext.fillStyle = '#f6f0e8';
      sourceContext.textAlign = 'center';
      sourceContext.fillText(text, width / 2, fontSize * 0.91);
      sourceContext.restore();
      context.clearRect(0, 0, canvas.width, canvas.height);
      const smallWidth = Math.max(1, Math.ceil(width / block));
      const smallHeight = Math.max(1, Math.ceil(height / block));
      small.width = smallWidth;
      small.height = smallHeight;
      small.getContext('2d').drawImage(source, 0, 0, smallWidth, smallHeight);
      context.imageSmoothingEnabled = false;
      context.drawImage(small, 0, 0, canvas.width, canvas.height);
      if (progress < 1) requestAnimationFrame(draw);
      else {
        canvas.remove();
        word.textContent = next;
        word.style.width = '';
        word.classList.remove('swapping');
      }
    }
    requestAnimationFrame(draw);
  }

  cycleCategory = async (direction = 1) => {
    if (isChanging || !visible) return;
    isChanging = true;
    clearTimeout(categoryTimer);
    const nextIndex = (categoryIndex + direction + categories.length) % categories.length;
    const textures = await textureSets[nextIndex];
    if (!visible) {
      isChanging = false;
      return;
    }
    host.style.transition = 'opacity 300ms ease';
    host.style.opacity = '0';
    swapWord(categories[categoryIndex].word, categories[nextIndex].word);
    setTimeout(() => {
      showCategory(textures);
      categoryIndex = nextIndex;
      host.style.opacity = '1';
      isChanging = false;
      if (visible) categoryTimer = setTimeout(cycleCategory, 10000);
    }, 300);
  };

  scheduleCategory = () => {
    clearTimeout(categoryTimer);
    if (visible && !isChanging) categoryTimer = setTimeout(cycleCategory, 10000);
  };
}

return {
  changeCategory(direction) {
    cycleCategory(direction);
  },
  setVisible(next) {
    if (visible === next) return;
    visible = next;
    if (visible) {
      lastFrame = performance.now();
      resize();
      requestAnimationFrame(frame);
    }
    scheduleCategory();
  },
};
}

export { mount };
