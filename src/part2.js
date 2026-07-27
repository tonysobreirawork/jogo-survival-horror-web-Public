import './part2.css';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import finalPhotoSrc from './assets/foto-final-sydney.png';

const PLAYER_HEIGHT = 1.68;
const PLAYER_RADIUS = 0.36;
const INTERACT_DISTANCE = 3.0;
const MAP_LIMIT = 52;

const ui = {
  game: document.querySelector('#part2-game'),
  hud: document.querySelector('#part2-hud'),
  start: document.querySelector('#p2-start'),
  startButton: document.querySelector('#p2-start-button'),
  noteScreen: document.querySelector('#p2-note-screen'),
  closeNote: document.querySelector('#p2-close-note'),
  noteTitle: document.querySelector('#p2-note-title'),
  noteBody: document.querySelector('#p2-note-body'),
  endScreen: document.querySelector('#p2-end-screen'),
  restart: document.querySelector('#p2-restart'),
  endTitle: document.querySelector('#p2-end-title'),
  endText: document.querySelector('#p2-end-text'),
  objective: document.querySelector('#p2-objective'),
  frequency: document.querySelector('#p2-frequency'),
  radioStatus: document.querySelector('#p2-radio-status'),
  recordings: document.querySelector('#p2-recordings'),
  status: document.querySelector('#p2-status'),
  message: document.querySelector('#p2-message'),
  prompt: document.querySelector('#p2-prompt'),
  danger: document.querySelector('#p2-danger'),
  loading: document.querySelector('#p2-loading')
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createTextTexture(title, subtitle = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const context = canvas.getContext('2d');
  context.fillStyle = '#101619';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#d8e5e8';
  context.lineWidth = 22;
  context.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);
  context.fillStyle = '#e7eff2';
  context.font = '800 88px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(title, canvas.width / 2, 160);
  if (subtitle) {
    context.fillStyle = '#95aab2';
    context.font = '500 42px Arial';
    context.fillText(subtitle, canvas.width / 2, 245);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makePhotoTexture() {
  const texture = new THREE.TextureLoader().load(finalPhotoSrc);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

class AudioSystem {
  constructor() {
    this.context = null;
    this.master = null;
  }

  async start() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.context.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.context.destination);
      this.createRadioNoise();
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }

  createRadioNoise() {
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.13;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.context.createGain();
    gain.gain.value = 0.035;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
  }

  tone(freq = 220, duration = 0.12, volume = 0.04, type = 'sine') {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, this.context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration + 0.02);
  }

  noise(duration = 0.12, volume = 0.04) {
    if (!this.context) return;
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.master);
    source.start();
  }
}

class Part2Game {
  constructor() {
    this.audio = new AudioSystem();
    this.clock = new THREE.Clock();
    this.keys = new Set();
    this.interactables = [];
    this.raycastTargets = [];
    this.colliders = [];
    this.recordingPickups = [];
    this.started = false;
    this.paused = true;
    this.modalOpen = false;
    this.ended = false;
    this.messageTimer = 0;
    this.frequencies = ['87.3', '91.6', '101.1', '66.6'];
    this.frequencyIndex = 0;
    this.recordings = 0;
    this.towerUnlocked = false;
    this.inStation = false;
    this.elapsed = 0;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05090c);
    this.scene.fog = new THREE.FogExp2(0x091017, 0.042);

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 220);
    this.camera.position.set(-33, PLAYER_HEIGHT, 28);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    ui.game.appendChild(this.renderer.domElement);

    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.controls.pointerSpeed = 0.78;
    this.raycaster = new THREE.Raycaster();
    this.center = new THREE.Vector2(0, 0);

    this.createMaterials();
    this.createWorld();
    this.createPlayerLight();
    this.createImitator();
    this.bindEvents();
    this.reset();
    ui.loading.classList.remove('visible');
    this.animate();
  }

  createMaterials() {
    this.asphalt = new THREE.MeshStandardMaterial({ color: 0x222829, roughness: 0.78, metalness: 0.08 });
    this.sidewalk = new THREE.MeshStandardMaterial({ color: 0x5e6667, roughness: 0.9 });
    this.wall = new THREE.MeshStandardMaterial({ color: 0x313d40, roughness: 0.82 });
    this.darkWall = new THREE.MeshStandardMaterial({ color: 0x1c2427, roughness: 0.9 });
    this.metal = new THREE.MeshStandardMaterial({ color: 0x2d3437, roughness: 0.42, metalness: 0.6 });
    this.redLight = new THREE.MeshStandardMaterial({ color: 0x5a1212, emissive: 0xff2222, emissiveIntensity: 2.6 });
    this.paper = new THREE.MeshStandardMaterial({ color: 0xd8d1b0, roughness: 0.9 });
    this.glass = new THREE.MeshPhysicalMaterial({ color: 0x5f7d88, transparent: true, opacity: 0.3, roughness: 0.18, metalness: 0.05 });
  }

  addCollider(mesh, width, depth) {
    this.colliders.push({ mesh, width, depth });
  }

  createWorld() {
    const hemi = new THREE.HemisphereLight(0x9bb8c2, 0x101313, 0.55);
    this.scene.add(hemi);
    const moon = new THREE.DirectionalLight(0x8aaec2, 1.2);
    moon.position.set(-18, 30, 12);
    moon.castShadow = true;
    this.scene.add(moon);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 110), new THREE.MeshStandardMaterial({ color: 0x0c1112, roughness: 0.98 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const road1 = new THREE.Mesh(new THREE.BoxGeometry(82, 0.035, 7.5), this.asphalt);
    road1.position.set(0, 0.02, 10);
    this.scene.add(road1);
    const road2 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.035, 78), this.asphalt);
    road2.position.set(-6, 0.025, 0);
    this.scene.add(road2);

    this.addBuilding(-31, 8, 11, 8, 4.8, 'CLÍNICA', 'MUNICIPAL');
    this.addBuilding(12, 12, 15, 9, 5.6, 'RÁDIO', '87.3 FM');
    this.addBuilding(26, -18, 12, 12, 5.2, 'CASAS', 'SETOR 4');
    this.addBuilding(-25, -23, 14, 10, 5.8, 'ARQUIVO', 'MUNICIPAL');
    this.addRadioTower(26, 18);
    this.addTunnelEntrance(19, 25);

    const sign = this.createSign('TORRE MUNICIPAL', 'acesso restrito');
    sign.position.set(20.5, 3, 12);
    sign.rotation.y = -Math.PI / 4;
    this.scene.add(sign);

    this.addStreetDetails();
    this.addRecordings();
    this.addChoices();
    this.createRain();
  }

  createSign(title, subtitle) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.35), new THREE.MeshStandardMaterial({
      map: createTextTexture(title, subtitle), roughness: 0.8, emissive: 0x101414, emissiveIntensity: 0.16
    }));
    return mesh;
  }

  addBuilding(x, z, w, d, h, title, subtitle) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), title === 'RÁDIO' ? this.darkWall : this.wall);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    for (let i = -1; i <= 1; i += 1) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), this.glass);
      win.position.set(i * (w / 4), h * 0.55, d / 2 + 0.03);
      group.add(win);
      if (Math.random() > 0.35) {
        const eyes = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), this.redLight);
        eyes.position.set(i * (w / 4) - 0.12, h * 0.57, d / 2 + 0.07);
        const eyes2 = eyes.clone();
        eyes2.position.x += 0.24;
        group.add(eyes, eyes2);
      }
    }
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 0.12), this.metal);
    door.position.set(-w * 0.28, 1.1, d / 2 + 0.04);
    group.add(door);
    const sign = this.createSign(title, subtitle);
    sign.scale.setScalar(0.58);
    sign.position.set(0, h + 0.3, d / 2 + 0.07);
    group.add(sign);
    this.scene.add(group);
    this.addCollider(group, w, d);
    return group;
  }

  addRadioTower(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const mat = this.metal;
    for (let i = 0; i < 4; i += 1) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 15, 8), mat);
      leg.position.set((i % 2 ? 1 : -1) * 0.9, 7.5, (i > 1 ? 1 : -1) * 0.9);
      leg.rotation.x = (i % 2 ? 0.05 : -0.05);
      group.add(leg);
    }
    for (let y = 1; y < 14; y += 2.2) {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), mat);
      cross.position.set(0, y, 0.9);
      group.add(cross);
      const cross2 = cross.clone();
      cross2.rotation.y = Math.PI / 2;
      cross2.position.set(0.9, y, 0);
      group.add(cross2);
    }
    const antennaLight = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10), this.redLight);
    antennaLight.position.set(0, 15.5, 0);
    group.add(antennaLight);
    const light = new THREE.PointLight(0xff2222, 1.7, 28, 2);
    light.position.copy(antennaLight.position);
    group.add(light);
    this.scene.add(group);
    this.addCollider(group, 2.8, 2.8);
    return group;
  }

  addTunnelEntrance(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.8, 0.5), this.metal);
    frame.position.y = 1.4;
    group.add(frame);
    const door = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 0.18), this.darkWall);
    door.position.set(0, 1.1, -0.16);
    group.add(door);
    const interaction = this.createInteraction('tunnel', 'Entrar na estação subterrânea', new THREE.Vector3(0, 1.2, 1.1), new THREE.Vector3(4.8, 2.5, 2.0));
    group.add(interaction);
    this.scene.add(group);
    this.interactables.push(interaction);
    this.raycastTargets.push(interaction);
    this.addCollider(group, 4.6, 1.2);
  }

  addStreetDetails() {
    const binMaterial = new THREE.MeshStandardMaterial({ color: 0x3c4647, roughness: 0.82, metalness: 0.25 });
    const positions = [[-38, 14], [-15, 6], [4, 16], [31, 5], [-24, -10], [13, -19], [33, -28]];
    positions.forEach(([x, z], i) => {
      const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.8, 16), binMaterial);
      bin.position.set(x, 0.4, z);
      bin.castShadow = true;
      this.scene.add(bin);
      this.addCollider(bin, 0.9, 0.9);
      const lamp = new THREE.PointLight(i % 2 ? 0xb6ccd2 : 0x6f9fa8, 0.35, 7, 2);
      lamp.position.set(x + 0.8, 2.5, z - 0.6);
      this.scene.add(lamp);
    });

    for (let i = 0; i < 12; i += 1) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, 4 + (i % 4), 8), new THREE.MeshStandardMaterial({ color: 0x15100d, roughness: 0.92 }));
      trunk.position.set(-42 + (i % 6) * 15, 2, -34 + Math.floor(i / 6) * 67);
      trunk.castShadow = true;
      this.scene.add(trunk);
    }

    const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.9), new THREE.MeshStandardMaterial({ map: makePhotoTexture(), roughness: 0.9, side: THREE.DoubleSide }));
    photo.position.set(-34, 1.35, 24);
    photo.rotation.x = -0.45;
    photo.rotation.y = 0.35;
    this.scene.add(photo);
  }

  addRecordings() {
    const data = [
      { x: -30, z: 14, title: 'Gravação 1 — Clínica municipal', body: 'Sydney: “Se você achou a escola, então o sinal já percebeu você. A clínica guarda o primeiro registro da frequência.”' },
      { x: 27, z: -12, title: 'Gravação 2 — Casa alagada', body: 'Sydney: “Ele imita a minha voz quando quer que você abra uma porta. Não obedeça a rádio quando ela chamar pelo seu nome.”' },
      { x: 12, z: 18, title: 'Gravação 3 — Estação 87.3', body: 'Sydney: “A torre não transmite para a cidade. Ela transmite para baixo. A entrada subterrânea fica atrás da estação.”' }
    ];
    data.forEach((item, index) => {
      const group = new THREE.Group();
      group.position.set(item.x, 0.12, item.z);
      const tape = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.35), new THREE.MeshStandardMaterial({ color: 0x1d2326, roughness: 0.7 }));
      tape.castShadow = true;
      group.add(tape);
      const label = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.085, 0.18), this.paper);
      label.position.y = 0.01;
      group.add(label);
      const interaction = this.createInteraction('recording', 'Ouvir gravação', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(1.2, 1.3, 1.2));
      interaction.userData.recording = item;
      interaction.userData.index = index;
      interaction.userData.parentGroup = group;
      group.add(interaction);
      this.scene.add(group);
      this.interactables.push(interaction);
      this.raycastTargets.push(interaction);
      this.recordingPickups.push(interaction);
    });

    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(17.2, 0, 14.8);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.75), this.metal);
    desk.position.y = 0.45;
    consoleGroup.add(desk);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.45), new THREE.MeshStandardMaterial({ color: 0x182025, emissive: 0x0f3940, emissiveIntensity: 0.8 }));
    panel.position.set(0, 0.98, -0.1);
    panel.rotation.x = -0.55;
    consoleGroup.add(panel);
    const interaction = this.createInteraction('radioConsole', 'Sintonizar 87.3 na estação', new THREE.Vector3(0, 1.0, 0), new THREE.Vector3(2, 1.8, 1.4));
    consoleGroup.add(interaction);
    this.scene.add(consoleGroup);
    this.interactables.push(interaction);
    this.raycastTargets.push(interaction);
    this.addCollider(consoleGroup, 1.8, 0.9);
  }

  addChoices() {
    const left = this.createChoiceConsole(-2.5, 'freeSydney', 'Libertar Sydney');
    const right = this.createChoiceConsole(2.5, 'shutdownSignal', 'Desligar transmissão');
    const group = new THREE.Group();
    group.position.set(19, 0, 30);
    group.add(left, right);
    const chamber = new THREE.Mesh(new THREE.BoxGeometry(8, 0.05, 8), new THREE.MeshStandardMaterial({ color: 0x151d20, roughness: 0.9 }));
    chamber.position.y = 0.03;
    group.add(chamber);
    this.scene.add(group);
  }

  createChoiceConsole(x, type, label) {
    const group = new THREE.Group();
    group.position.x = x;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.0), this.metal);
    base.position.y = 0.5;
    group.add(base);
    const glow = new THREE.PointLight(type === 'freeSydney' ? 0x72d0ff : 0xff675f, 1.2, 8, 2);
    glow.position.set(0, 1.3, 0);
    group.add(glow);
    const interaction = this.createInteraction(type, label, new THREE.Vector3(0, 1.0, 0), new THREE.Vector3(1.8, 1.8, 1.6));
    group.add(interaction);
    this.interactables.push(interaction);
    this.raycastTargets.push(interaction);
    return group;
  }

  createRain() {
    const geometry = new THREE.BufferGeometry();
    const count = 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 95;
      positions[i * 3 + 1] = Math.random() * 20 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 88;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rain = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x8aa7b0, size: 0.055, transparent: true, opacity: 0.55 }));
    this.scene.add(this.rain);
  }

  createPlayerLight() {
    this.flashlight = new THREE.SpotLight(0xd9f2ff, 3.1, 28, Math.PI / 9, 0.58, 1.1);
    this.flashlight.position.set(0.18, -0.1, 0.08);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, -0.05, -1);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.cameraFill = new THREE.PointLight(0x8daeb8, 0.36, 5, 2);
    this.camera.add(this.cameraFill);
    this.scene.add(this.camera);
  }

  createImitator() {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x111617, roughness: 0.8, emissive: 0x160000, emissiveIntensity: 0.2 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 2.4, 12), material);
    body.position.y = 1.2;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), material);
    head.position.y = 2.55;
    group.add(head);
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), this.redLight);
    eye1.position.set(-0.11, 2.6, -0.26);
    const eye2 = eye1.clone();
    eye2.position.x = 0.11;
    group.add(eye1, eye2);
    group.position.set(36, 0, -24);
    this.scene.add(group);
    this.imitator = { group, speed: 1.75, alert: 0 };
  }

  createInteraction(type, label, center, size) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial({ visible: false }));
    mesh.position.copy(center);
    mesh.userData.type = type;
    mesh.userData.label = label;
    mesh.userData.active = true;
    return mesh;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('keydown', (event) => {
      this.keys.add(event.code);
      if (event.code === 'KeyE' && !event.repeat) this.interact();
      if (event.code === 'KeyF' && !event.repeat) this.flashlight.visible = !this.flashlight.visible;
      if (event.code === 'KeyR' && !event.repeat) this.cycleFrequency();
    });
    document.addEventListener('keyup', (event) => this.keys.delete(event.code));

    ui.startButton.addEventListener('click', async () => {
      await this.audio.start();
      this.started = true;
      this.paused = false;
      ui.start.classList.remove('visible');
      ui.hud.classList.remove('hidden');
      this.controls.lock(true);
      this.showMessage('A cidade ainda está presa na chuva. O rádio acordou em 87.3 FM.', 3.5);
    });

    ui.closeNote.addEventListener('click', () => {
      this.modalOpen = false;
      ui.noteScreen.classList.remove('visible');
      this.controls.lock(true);
    });

    ui.restart.addEventListener('click', async () => {
      await this.audio.start();
      this.reset();
      ui.endScreen.classList.remove('visible');
      ui.hud.classList.remove('hidden');
      this.started = true;
      this.paused = false;
      this.controls.lock(true);
    });

    this.controls.addEventListener('unlock', () => {
      if (!this.started || this.modalOpen || this.ended) return;
      this.paused = true;
    });
    this.controls.addEventListener('lock', () => {
      if (!this.started || this.modalOpen || this.ended) return;
      this.paused = false;
    });

    this.renderer.domElement.addEventListener('click', () => {
      if (this.started && !this.modalOpen && !this.ended && !this.controls.isLocked) this.controls.lock(true);
    });
  }

  reset() {
    this.ended = false;
    this.modalOpen = false;
    this.paused = !this.started;
    this.recordings = 0;
    this.frequencyIndex = 0;
    this.towerUnlocked = false;
    this.inStation = false;
    this.messageTimer = 0;
    this.camera.position.set(-33, PLAYER_HEIGHT, 28);
    this.camera.rotation.set(0, -Math.PI / 2, 0);
    this.imitator.group.position.set(36, 0, -24);
    this.recordingPickups.forEach((pickup) => {
      pickup.userData.active = true;
      pickup.userData.parentGroup.visible = true;
    });
    this.updateHud();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  cycleFrequency() {
    this.frequencyIndex = (this.frequencyIndex + 1) % this.frequencies.length;
    this.audio.tone(280 + this.frequencyIndex * 55, 0.08, 0.035, 'square');
    this.updateHud();
    const freq = this.frequencies[this.frequencyIndex];
    if (freq === '66.6') this.showMessage('Uma voz que parece Sydney sussurra: “Vire à esquerda.”', 2.3);
    if (freq === '87.3') this.showMessage('A frequência de Sydney fica mais limpa perto da torre.', 2.2);
  }

  isBlocked(x, z, radius = PLAYER_RADIUS) {
    if (Math.abs(x) > MAP_LIMIT || Math.abs(z) > MAP_LIMIT) return true;
    return this.colliders.some(({ mesh, width, depth }) => {
      const dx = Math.abs(x - mesh.position.x);
      const dz = Math.abs(z - mesh.position.z);
      return dx < width * 0.5 + radius && dz < depth * 0.5 + radius;
    });
  }

  updatePlayer(delta) {
    const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 6.1 : 3.65;
    const direction = new THREE.Vector3();
    if (this.keys.has('KeyW')) direction.z -= 1;
    if (this.keys.has('KeyS')) direction.z += 1;
    if (this.keys.has('KeyA')) direction.x -= 1;
    if (this.keys.has('KeyD')) direction.x += 1;
    if (direction.lengthSq() > 0) direction.normalize();
    direction.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
    const dx = direction.x * speed * delta;
    const dz = direction.z * speed * delta;
    if (!this.isBlocked(this.camera.position.x + dx, this.camera.position.z)) this.camera.position.x += dx;
    if (!this.isBlocked(this.camera.position.x, this.camera.position.z + dz)) this.camera.position.z += dz;
    this.camera.position.y = PLAYER_HEIGHT;
  }

  updateImitator(delta) {
    const playerFlat = this.camera.position.clone();
    playerFlat.y = 0;
    const enemy = this.imitator.group.position;
    const distance = enemy.distanceTo(playerFlat);
    const badFrequency = this.frequencies[this.frequencyIndex] === '66.6';
    const active = distance < (badFrequency ? 22 : 14) || this.recordings >= 2;
    if (active) {
      const direction = playerFlat.clone().sub(enemy).normalize();
      const distanceToMove = this.imitator.speed * (badFrequency ? 1.25 : 1) * delta;
      const nextX = enemy.x + direction.x * distanceToMove;
      const nextZ = enemy.z + direction.z * distanceToMove;
      if (!this.isBlocked(nextX, enemy.z, 0.34)) enemy.x = nextX;
      if (!this.isBlocked(enemy.x, nextZ, 0.34)) enemy.z = nextZ;
      this.imitator.group.lookAt(playerFlat.x, 1.2, playerFlat.z);
      this.imitator.alert = clamp(this.imitator.alert + delta * 24, 0, 100);
    } else {
      enemy.x += Math.sin(this.elapsed * 0.3) * delta * 0.3;
      enemy.z += Math.cos(this.elapsed * 0.22) * delta * 0.25;
      this.imitator.alert = clamp(this.imitator.alert - delta * 10, 0, 100);
    }
    if (distance < 1.4) this.lose('A voz de Sydney chamou seu nome de perto demais.');
  }

  updateRain(delta) {
    const positions = this.rain.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= delta * 18;
      positions[i] -= delta * 1.5;
      if (positions[i + 1] < 0) {
        positions[i] = (Math.random() - 0.5) * 95;
        positions[i + 1] = Math.random() * 20 + 6;
        positions[i + 2] = (Math.random() - 0.5) * 88;
      }
    }
    this.rain.geometry.attributes.position.needsUpdate = true;
  }

  updateInteraction() {
    this.raycaster.setFromCamera(this.center, this.camera);
    this.raycaster.far = INTERACT_DISTANCE;
    const hit = this.raycaster.intersectObjects(this.raycastTargets, false).find((item) => item.object.userData.active && item.object.visible);
    let target = hit?.object ?? null;
    if (!target) {
      let best = INTERACT_DISTANCE * 0.95;
      for (const item of this.interactables) {
        if (!item.userData.active || !item.visible) continue;
        const world = new THREE.Vector3();
        item.getWorldPosition(world);
        const dist = world.distanceTo(this.camera.position);
        if (dist < best) {
          target = item;
          best = dist;
        }
      }
    }
    this.nearInteractable = target;
    ui.prompt.textContent = target ? `[E] ${target.userData.label}` : '';
    ui.prompt.classList.toggle('visible', Boolean(target));
  }

  interact() {
    if (!this.started || this.paused || this.modalOpen || this.ended) return;
    const target = this.nearInteractable;
    if (!target || !target.userData.active) return;
    switch (target.userData.type) {
      case 'recording':
        this.collectRecording(target);
        break;
      case 'radioConsole':
        this.useRadioConsole();
        break;
      case 'tunnel':
        this.enterTunnel();
        break;
      case 'freeSydney':
        this.choice('free');
        break;
      case 'shutdownSignal':
        this.choice('shutdown');
        break;
      default:
        break;
    }
  }

  collectRecording(target) {
    target.userData.active = false;
    target.userData.parentGroup.visible = false;
    this.recordings += 1;
    this.audio.tone(420, 0.12, 0.04, 'triangle');
    this.modalOpen = true;
    this.paused = true;
    this.controls.unlock();
    ui.noteTitle.textContent = target.userData.recording.title;
    ui.noteBody.textContent = target.userData.recording.body;
    ui.noteScreen.classList.add('visible');
    this.updateHud();
  }

  useRadioConsole() {
    if (this.recordings < 3) {
      this.showMessage('O console pede três registros de voz para alinhar a frequência.', 2.6);
      this.audio.noise(0.12, 0.035);
      return;
    }
    if (this.frequencies[this.frequencyIndex] !== '87.3') {
      this.showMessage('A torre rejeita a sintonia. Use R até encontrar 87.3 FM.', 2.4);
      this.audio.tone(82, 0.16, 0.045, 'square');
      return;
    }
    this.towerUnlocked = true;
    this.audio.tone(320, 0.18, 0.05, 'sine');
    this.showMessage('A entrada subterrânea destravou atrás da torre.', 3.0);
    this.updateHud();
  }

  enterTunnel() {
    if (!this.towerUnlocked) {
      this.showMessage('A porta subterrânea está travada. A estação de rádio precisa abrir a frequência.', 2.5);
      return;
    }
    this.inStation = true;
    this.camera.position.set(19, PLAYER_HEIGHT, 31);
    this.imitator.group.position.set(19, 0, 24);
    this.showMessage('Você desce até a estação meteorológica sob a torre. Dois painéis aguardam sua escolha.', 3.6);
    this.updateHud();
  }

  choice(kind) {
    if (!this.inStation) {
      this.showMessage('Os painéis estão desligados. A estação subterrânea ainda não foi alcançada.', 2.2);
      return;
    }
    if (kind === 'free') {
      this.win('LIBERTOU SYDNEY', 'Você arrancou os cabos da antena humana. Sydney respirou, mas a voz dentro das paredes riu pela primeira vez sem ruído. A entidade saiu da estação junto com a tempestade.');
    } else {
      this.win('DESLIGOU A TRANSMISSÃO', 'A frequência morreu de uma vez. Sydney abriu os olhos por um segundo, tempo suficiente para dizer “obrigada”. Então a estação inteira mergulhou no silêncio.');
    }
  }

  updateHud() {
    const freq = this.frequencies[this.frequencyIndex];
    ui.frequency.textContent = `${freq} FM`;
    ui.radioStatus.textContent = freq === '87.3'
      ? 'voz fraca de Sydney'
      : freq === '66.6'
        ? 'imitação hostil'
        : 'estática e ruído';
    ui.recordings.textContent = `${this.recordings}/3`;
    ui.status.textContent = this.towerUnlocked ? 'Entrada subterrânea aberta.' : this.recordings >= 3 ? 'Sintonize 87.3 na estação.' : 'Procure mensagens de Sydney.';
    if (this.inStation) ui.objective.textContent = 'Escolha entre libertar Sydney ou desligar a transmissão.';
    else if (this.towerUnlocked) ui.objective.textContent = 'Entre na estação subterrânea atrás da torre.';
    else if (this.recordings >= 3) ui.objective.textContent = 'Volte à estação de rádio e sintonize 87.3 FM.';
    else ui.objective.textContent = `Encontre as gravações deixadas por Sydney. (${this.recordings}/3)`;
    ui.danger.style.opacity = String(clamp(this.imitator.alert / 160, 0, 0.48));
  }

  showMessage(text, duration = 2.4) {
    ui.message.textContent = text;
    ui.message.classList.add('visible');
    this.messageTimer = duration;
  }

  lose(reason) {
    if (this.ended) return;
    this.ended = true;
    this.paused = true;
    this.controls.unlock();
    ui.endTitle.textContent = 'A VOZ TE ENCONTROU';
    ui.endText.textContent = `${reason} A frequência continua aberta.`;
    ui.endScreen.classList.add('visible');
  }

  win(title, text) {
    if (this.ended) return;
    this.ended = true;
    this.paused = true;
    this.controls.unlock();
    this.audio.tone(220, 0.6, 0.08, 'triangle', 440);
    ui.endTitle.textContent = title;
    ui.endText.textContent = `${text}\n\nNo verso da fotografia surge uma frase nova: “Você já tentou salvá-la antes.”`;
    ui.endScreen.classList.add('visible');
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    if (this.started && !this.paused && !this.modalOpen && !this.ended) {
      this.elapsed += delta;
      this.updatePlayer(delta);
      this.updateRain(delta);
      this.updateImitator(delta);
      this.updateInteraction();
      this.updateHud();
      if (this.messageTimer > 0) {
        this.messageTimer -= delta;
        if (this.messageTimer <= 0) ui.message.classList.remove('visible');
      }
    } else {
      this.updateRain(delta * 0.35);
    }
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }
}

try {
  new Part2Game();
} catch (error) {
  console.error(error);
  ui.loading.textContent = error instanceof Error ? error.message : 'Não foi possível iniciar a Parte 2.';
  ui.loading.classList.add('visible');
}
