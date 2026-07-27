import './style.css';
import finalPhotoSrc from './assets/foto-final-sydney.png';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TILE = 2.6;
const WALL_HEIGHT = 3.9;
const PLAYER_HEIGHT = 1.68;
const PLAYER_RADIUS = 0.34;
const MONSTER_RADIUS = 0.36;
const INTERACT_DISTANCE = 2.45;

const LEVEL = [
  '11111111111111111111111111',
  '10000000100000000010000021',
  '10000000100000000010000001',
  '10000000000000000010000001',
  '10000000100000000000000001',
  '11110111111101111111101111',
  '10000000100000000010000001',
  '10000000100000000000001001',
  '10000000000000000010000001',
  '10000000100000000010000001',
  '11101111101111110111111101',
  '10001000100001000010000001',
  '10000000100000000010000001',
  '11011111100000000010000001',
  '10000000000001000010000001',
  '10001000100001000010000001',
  '11111011111110111111011111',
  '10000000100000000010000001',
  '10000000000000000010010001',
  '10000000111101111110010001',
  '10000000000000000000000001',
  '11111111111111111111111111'
];

const MAP_H = LEVEL.length;
const MAP_W = LEVEL[0].length;

const START = { cellX: 3, cellZ: 3, yaw: -Math.PI / 2 };
const ENTRANCE_CELL = { x: 1, z: 3, side: 'west' };
const EXIT_CELL = { x: 24, z: 1 };
const STAIRS_UP_CELL = { x: 13, z: 20 };
const STAIRS_DOWN_CELL = { x: 20, z: 20 };
const OPERATIONS_ROOM_CELL = { x: 24, z: 19 };
const BASEMENT_FLOOR_Y = -2.35;

const WINDOW_CELLS = [
  { x: 3, z: 0, side: 'north' }, { x: 7, z: 0, side: 'north' },
  { x: 11, z: 0, side: 'north' }, { x: 16, z: 0, side: 'north' },
  { x: 20, z: 0, side: 'north' }, { x: 23, z: 0, side: 'north' },
  { x: 3, z: MAP_H - 1, side: 'south' }, { x: 7, z: MAP_H - 1, side: 'south' },
  { x: 12, z: MAP_H - 1, side: 'south' }, { x: 17, z: MAP_H - 1, side: 'south' },
  { x: 22, z: MAP_H - 1, side: 'south' },
  { x: 0, z: 3, side: 'west' }, { x: 0, z: 8, side: 'west' },
  { x: 0, z: 14, side: 'west' }, { x: 0, z: 18, side: 'west' },
  { x: MAP_W - 1, z: 3, side: 'east' }, { x: MAP_W - 1, z: 8, side: 'east' },
  { x: MAP_W - 1, z: 14, side: 'east' }, { x: MAP_W - 1, z: 18, side: 'east' }
];
const WINDOW_CELL_KEYS = new Set(WINDOW_CELLS.map(({ x, z }) => `${x},${z}`));
const SCHOOL_HALF_WIDTH = MAP_W * TILE * 0.5;
const SCHOOL_HALF_DEPTH = MAP_H * TILE * 0.5;

const CLUES = [
  {
    cellX: 6,
    cellZ: 2,
    title: 'Pista 1 — Diário da diretora',
    body: `14 de agosto, 23h40.\n\nA chuva começou quando o rádio da escola recebeu uma transmissão sem origem. As crianças repetiam a mesma frase: “A sala vazia está chamando”.\n\nMandei todos para casa. Mesmo assim, ouvi passos no segundo andar.`
  },
  {
    cellX: 14,
    cellZ: 7,
    title: 'Pista 2 — Fotografia da turma 31',
    body: `Na foto, vinte e seis alunos encaram a câmera.\n\nNo fundo, perto da porta, há uma figura muito alta. A legenda escrita à mão diz: “Não havia ninguém ali quando a foto foi tirada”.\n\nO rosto da figura foi riscado até o papel rasgar.`
  },
  {
    cellX: 3,
    cellZ: 18,
    title: 'Pista 3 — Fita do zelador',
    body: `“Ele aprende os nossos caminhos. Não corra em linha reta. Não deixe a luz apontada para ele.\n\nOs armários ainda enganam a coisa, mas apenas quando ela não vê você entrando. O quadro elétrico mantém a porta magnética fechada.”`
  },
  {
    cellX: 20,
    cellZ: 14,
    title: 'Pista 4 — Relatório lacrado',
    body: `PROJETO ÚLTIMO SINAL — INCIDENTE FINAL\n\nA transmissão não veio de fora da cidade. Ela veio da sala 13, construída sobre uma antiga estação meteorológica. O “ser” é uma resposta física ao medo coletivo.\n\nInterromper o sinal não o destrói. Apenas abre a saída antes que ele encontre um novo hospedeiro.`
  }
];

const BATTERIES = [
  { cellX: 11, cellZ: 2 },
  { cellX: 21, cellZ: 6 },
  { cellX: 6, cellZ: 12 },
  { cellX: 15, cellZ: 18 },
  { cellX: 24, cellZ: 12 }
];

const HIDE_SPOTS = [
  { cellX: 6, cellZ: 4, kind: 'locker', label: 'armário', side: 'south' },
  { cellX: 10, cellZ: 7, kind: 'table', label: 'mesa', rotation: 0 },
  { cellX: 21, cellZ: 7, kind: 'locker', label: 'armário', side: 'east' },
  { cellX: 2, cellZ: 12, kind: 'table', label: 'mesa', rotation: Math.PI / 2 },
  { cellX: 17, cellZ: 12, kind: 'locker', label: 'armário', side: 'east' },
  { cellX: 7, cellZ: 18, kind: 'table', label: 'mesa', rotation: 0 },
  { cellX: 24, cellZ: 15, kind: 'locker', label: 'armário', side: 'east' },
  { cellX: 3, cellZ: 4, kind: 'locker', label: 'armário', side: 'south' },
  { cellX: 19, cellZ: 3, kind: 'table', label: 'mesa', rotation: Math.PI / 2 },
  { cellX: 22, cellZ: 4, kind: 'locker', label: 'armário', side: 'south' },
  { cellX: 12, cellZ: 14, kind: 'table', label: 'mesa', rotation: 0 },
  { cellX: 3, cellZ: 17, kind: 'locker', label: 'armário', side: 'north' },
  { cellX: 19, cellZ: 18, kind: 'table', label: 'mesa', rotation: Math.PI / 2 },
  { cellX: 22, cellZ: 20, kind: 'locker', label: 'armário', side: 'south' }
];

const CLASSROOM_DOOR_CELLS = [
  [4, 5], [12, 5], [21, 5],
  [3, 10], [9, 10], [16, 10], [24, 10],
  [5, 16], [13, 16], [20, 16]
];

const DOOR_CELL_KEYS = new Set(CLASSROOM_DOOR_CELLS.map(([x, z]) => `${x},${z}`));
const RESERVED_LAYOUT_KEYS = new Set([
  `${START.cellX},${START.cellZ}`,
  `${ENTRANCE_CELL.x},${ENTRANCE_CELL.z}`,
  `${EXIT_CELL.x},${EXIT_CELL.z}`,
  `${OPERATIONS_ROOM_CELL.x},${OPERATIONS_ROOM_CELL.z}`,
  `${STAIRS_UP_CELL.x},${STAIRS_UP_CELL.z}`,
  `${STAIRS_DOWN_CELL.x},${STAIRS_DOWN_CELL.z}`,
  ...CLASSROOM_DOOR_CELLS.map(([x, z]) => `${x},${z}`),
  ...CLUES.map(({ cellX, cellZ }) => `${cellX},${cellZ}`),
  ...BATTERIES.map(({ cellX, cellZ }) => `${cellX},${cellZ}`),
  ...HIDE_SPOTS.map(({ cellX, cellZ }) => `${cellX},${cellZ}`)
]);

function isLayoutSafeCell(cellX, cellZ, doorClearance = 1) {
  if (cellX < 1 || cellZ < 1 || cellX >= MAP_W - 1 || cellZ >= MAP_H - 1) return false;
  if (LEVEL[cellZ]?.[cellX] !== '0') return false;
  if (RESERVED_LAYOUT_KEYS.has(`${cellX},${cellZ}`)) return false;
  return CLASSROOM_DOOR_CELLS.every(([doorX, doorZ]) => Math.abs(doorX - cellX) + Math.abs(doorZ - cellZ) > doorClearance);
}


const ui = {
  game: document.querySelector('#game'),
  hud: document.querySelector('#hud'),
  startScreen: document.querySelector('#start-screen'),
  pauseScreen: document.querySelector('#pause-screen'),
  clueScreen: document.querySelector('#clue-screen'),
  mapScreen: document.querySelector('#map-screen'),
  endScreen: document.querySelector('#end-screen'),
  loading: document.querySelector('#loading'),
  startButton: document.querySelector('#start-button'),
  debugToggle: document.querySelector('#debug-mode'),
  resumeButton: document.querySelector('#resume-button'),
  closeClue: document.querySelector('#close-clue'),
  closeMap: document.querySelector('#close-map'),
  restartButton: document.querySelector('#restart-button'),
  objective: document.querySelector('#objective'),
  batteryBar: document.querySelector('#battery-bar'),
  batteryValue: document.querySelector('#battery-value'),
  staminaBar: document.querySelector('#stamina-bar'),
  staminaValue: document.querySelector('#stamina-value'),
  noiseBar: document.querySelector('#noise-bar'),
  noiseValue: document.querySelector('#noise-value'),
  status: document.querySelector('#status'),
  message: document.querySelector('#message'),
  prompt: document.querySelector('#prompt'),
  hiddenState: document.querySelector('#hidden-state'),
  danger: document.querySelector('#danger-vignette'),
  flashlightVignette: document.querySelector('#flashlight-vignette'),
  clueTitle: document.querySelector('#clue-title'),
  clueBody: document.querySelector('#clue-body'),
  minimap: document.querySelector('#minimap'),
  mapCanvas: document.querySelector('#map-canvas'),
  mapHint: document.querySelector('#map-hint'),
  mapLegend: document.querySelector('#map-legend'),
  endKicker: document.querySelector('#end-kicker'),
  endTitle: document.querySelector('#end-title'),
  endPhoto: document.querySelector('#end-photo'),
  endText: document.querySelector('#end-text'),
  endSequel: document.querySelector('#end-sequel'),
  part2Button: document.querySelector('#part2-button'),
  pursuit: document.querySelector('#pursuit-indicator'),
  pursuitBar: document.querySelector('#pursuit-bar'),
  pursuitStatus: document.querySelector('#pursuit-status')
};

class AudioSystem {
  constructor() {
    this.context = null;
    this.master = null;
    this.rainGain = null;
    this.heartbeatCooldown = 0;
    this.stepCooldown = 0;
  }

  async start() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.context.createGain();
      this.master.gain.value = 0.62;
      this.master.connect(this.context.destination);
      this.createRain();
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }

  createRain() {
    const duration = 2;
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      brown = brown * 0.984 + white * 0.016;
      data[i] = brown * 2.2;
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const highPass = this.context.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 180;

    const lowPass = this.context.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 1850;

    this.rainGain = this.context.createGain();
    this.rainGain.gain.value = 0.085;
    source.connect(highPass).connect(lowPass).connect(this.rainGain).connect(this.master);
    source.start();
  }

  tone(frequency, duration, volume = 0.1, type = 'sine', targetFrequency = null) {
    if (!this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (targetFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, targetFrequency), now + duration);
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  noise(duration = 0.2, volume = 0.08, cutoff = 900) {
    if (!this.context) return;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
  }

  pickup() {
    this.tone(480, 0.09, 0.08, 'triangle', 660);
    window.setTimeout(() => this.tone(760, 0.13, 0.06, 'triangle'), 80);
  }

  switchClick(on) {
    this.tone(on ? 190 : 95, 0.08, 0.045, 'square');
  }

  alert() {
    this.tone(88, 0.95, 0.2, 'sawtooth', 39);
    this.noise(0.5, 0.07, 420);
  }

  thunder() {
    this.noise(1.8, 0.19, 280);
    this.tone(37, 2.1, 0.16, 'sine', 22);
  }

  footstep(running) {
    this.noise(0.055, running ? 0.06 : 0.032, 190);
    this.tone(running ? 72 : 62, 0.06, running ? 0.045 : 0.025, 'sine', 45);
  }

  heartbeat(intensity) {
    const volume = 0.04 + intensity * 0.09;
    this.tone(56, 0.11, volume, 'sine', 46);
    window.setTimeout(() => this.tone(47, 0.12, volume * 0.78, 'sine', 39), 125);
  }
}

function seededRandom(seed) {
  const x = Math.sin(seed * 999.913) * 43758.5453;
  return x - Math.floor(x);
}

function createConcreteTexture(size = 512, base = '#737d7e') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.fillStyle = base;
  context.fillRect(0, 0, size, size);

  const image = context.getImageData(0, 0, size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 32;
    image.data[i] = Math.max(0, Math.min(255, image.data[i] + noise));
    image.data[i + 1] = Math.max(0, Math.min(255, image.data[i + 1] + noise));
    image.data[i + 2] = Math.max(0, Math.min(255, image.data[i + 2] + noise));
  }
  context.putImageData(image, 0, 0);

  context.globalAlpha = 0.22;
  for (let i = 0; i < 45; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 8 + Math.random() * 45;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, i % 3 === 0 ? '#111719' : '#a4adae');
    gradient.addColorStop(1, 'transparent');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 0.18;
  context.strokeStyle = '#1a2022';
  context.lineWidth = 2;
  for (let i = 0; i < 13; i += 1) {
    let x = Math.random() * size;
    let y = Math.random() * size;
    context.beginPath();
    context.moveTo(x, y);
    for (let j = 0; j < 5; j += 1) {
      x += (Math.random() - 0.5) * 45;
      y += 15 + Math.random() * 35;
      context.lineTo(x, y);
    }
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createFloorTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const tile = 64;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      const parity = ((x / tile) + (y / tile)) % 2;
      const shade = parity ? 42 : 48;
      context.fillStyle = `rgb(${shade}, ${shade + 3}, ${shade + 4})`;
      context.fillRect(x, y, tile, tile);
      context.strokeStyle = 'rgba(8, 11, 12, .65)';
      context.strokeRect(x, y, tile, tile);
      for (let i = 0; i < 150; i += 1) {
        const v = Math.floor(Math.random() * 20);
        context.fillStyle = `rgba(${v}, ${v}, ${v}, ${Math.random() * 0.16})`;
        context.fillRect(x + Math.random() * tile, y + Math.random() * tile, 1, 1);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(MAP_W / 4, MAP_H / 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createSignTexture(text, subtitle = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#d7d3bd';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#111718';
  context.fillRect(18, 18, canvas.width - 36, canvas.height - 36);
  context.fillStyle = '#d7d3bd';
  context.font = 'bold 80px Arial';
  context.textAlign = 'center';
  context.fillText(text, canvas.width / 2, 118);
  if (subtitle) {
    context.fillStyle = '#929b99';
    context.font = '32px Arial';
    context.fillText(subtitle, canvas.width / 2, 178);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function cellToWorld(cellX, cellZ, y = 0) {
  return new THREE.Vector3(
    (cellX - MAP_W / 2 + 0.5) * TILE,
    y,
    (cellZ - MAP_H / 2 + 0.5) * TILE
  );
}

function worldToCell(x, z) {
  return {
    x: Math.floor(x / TILE + MAP_W / 2),
    z: Math.floor(z / TILE + MAP_H / 2)
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isWallCell(cellX, cellZ) {
  if (cellX < 0 || cellZ < 0 || cellX >= MAP_W || cellZ >= MAP_H) return true;
  return LEVEL[cellZ][cellX] === '1';
}

function resolveWallMountSide(cellX, cellZ, preferredSide = 'south') {
  const candidates = [
    { side: 'north', cellX, cellZ: cellZ - 1 },
    { side: 'south', cellX, cellZ: cellZ + 1 },
    { side: 'east', cellX: cellX + 1, cellZ },
    { side: 'west', cellX: cellX - 1, cellZ }
  ].filter((entry) => isWallCell(entry.cellX, entry.cellZ));

  if (candidates.some((entry) => entry.side === preferredSide)) return preferredSide;
  if (candidates.length > 0) return candidates[0].side;
  return preferredSide;
}

function angleDifference(a, b) {
  let difference = a - b;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  return difference;
}

function isInsideSchoolFootprint(x, z, margin = 0.5) {
  return Math.abs(x) < SCHOOL_HALF_WIDTH + margin && Math.abs(z) < SCHOOL_HALF_DEPTH + margin;
}

function randomExteriorRainPoint(y = Math.random() * 14) {
  const outerWidth = SCHOOL_HALF_WIDTH + 18;
  const outerDepth = SCHOOL_HALF_DEPTH + 18;
  const clearance = 1.1;
  const side = Math.floor(Math.random() * 4);
  let x;
  let z;

  if (side === 0) {
    x = THREE.MathUtils.randFloatSpread(outerWidth * 2);
    z = THREE.MathUtils.randFloat(-outerDepth, -SCHOOL_HALF_DEPTH - clearance);
  } else if (side === 1) {
    x = THREE.MathUtils.randFloatSpread(outerWidth * 2);
    z = THREE.MathUtils.randFloat(SCHOOL_HALF_DEPTH + clearance, outerDepth);
  } else if (side === 2) {
    x = THREE.MathUtils.randFloat(-outerWidth, -SCHOOL_HALF_WIDTH - clearance);
    z = THREE.MathUtils.randFloatSpread(outerDepth * 2);
  } else {
    x = THREE.MathUtils.randFloat(SCHOOL_HALF_WIDTH + clearance, outerWidth);
    z = THREE.MathUtils.randFloatSpread(outerDepth * 2);
  }

  return { x, y, z };
}

class Game {
  constructor() {
    this.audio = new AudioSystem();
    this.clock = new THREE.Clock();
    this.keys = new Set();
    this.interactables = [];
    this.staticRaycastObjects = [];
    this.schoolProps = [];
    this.propColliders = [];
    this.hideMarkers = [];
    this.windowGlassMaterials = [];
    this.windowBackdropMaterials = [];
    this.windowEyeMaterials = [];
    this.outdoorLightningMaterials = [];
    this.emergencyLights = this.emergencyLights ?? [];
    this.powerLights = this.powerLights ?? [];
    this.classroomDoors = [];
    this.raycastTargets = [];
    this.animatedObjects = [];
    this.activeClues = [];
    this.activeBatteries = [];
    this.hideSpots = [];
    this.started = false;
    this.paused = true;
    this.modalOpen = false;
    this.ended = false;
    this.messageTimer = 0;
    this.thunderTimer = 5 + Math.random() * 8;
    this.lightning = 0;
    this.powerLightLevel = 0;
    this.elapsed = 0;
    this.frameSamples = [];
    this.adaptiveTimer = 0;
    this.pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    this.nearInteractable = null;
    this.debugMode = new URLSearchParams(window.location.search).get('debug') === '1';
    this.mapOpen = false;
    this.basementHintShown = false;
    this.playerInBasement = false;
    this.descentSequenceTimer = 0;
    this.basementFogPlanes = [];
    this.mapState = {
      unlocked: true,
      discoveredCells: new Set(),
      discoveredPois: new Set(['entrada'])
    };
    this.mapPoiDefinitions = [
      { id: 'entrada', label: 'Entrada principal', cellX: ENTRANCE_CELL.x, cellZ: ENTRANCE_CELL.z, color: '#6abcc8' },
      { id: 'saida', label: 'Saída liberada', cellX: EXIT_CELL.x, cellZ: EXIT_CELL.z, color: '#d97070' },
      { id: 'quadro', label: 'Sala de operações / quadro', cellX: OPERATIONS_ROOM_CELL.x, cellZ: OPERATIONS_ROOM_CELL.z, color: '#f0c96b' },
      ...CLUES.map((clue, index) => ({
        id: `pista-${index + 1}`,
        label: `Pista ${index + 1}`,
        cellX: clue.cellX,
        cellZ: clue.cellZ,
        color: '#b68fe7'
      }))
    ];
    ui.endPhoto.src = finalPhotoSrc;

    this.player = {
      battery: 100,
      batteryReserves: 0,
      stamina: 100,
      noise: 0,
      clues: 0,
      hasMap: true,
      flashlightOn: true,
      hidden: false,
      hideSpot: null,
      powerOn: false,
      velocity: new THREE.Vector3(),
      bobTime: 0,
      baseY: PLAYER_HEIGHT
    };

    this.monster = {
      state: 'patrol',
      alert: 0,
      target: null,
      lastSeen: null,
      path: [],
      pathTimer: 0,
      wanderTimer: 0,
      stepTimer: 0,
      animationTime: 0,
      seenLastFrame: false,
      pursuitActive: false
    };

    this.initializeRenderer();
    this.initializeScene();
    this.initializeControls();
    this.createMaterials();
    this.buildLevel();
    this.createProps();
    this.runAntiBlockageCheck();
    this.createRain();
    this.createMonster();
    this.createLighting();
    this.bindEvents();
    this.resize();
    this.reset();
    if (ui.debugToggle) ui.debugToggle.checked = this.debugMode;
    this.applyDebugMode();

    ui.loading.classList.remove('visible');
    this.renderer.setAnimationLoop(() => this.animate());
  }

  initializeRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    ui.game.appendChild(this.renderer.domElement);
  }

  initializeScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x081116);
    this.scene.fog = new THREE.FogExp2(0x0a171d, 0.027);

    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.06, 110);
    this.camera.rotation.order = 'YXZ';

    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.22,
      0.42,
      0.9
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    this.raycaster = new THREE.Raycaster();
    this.centerNdc = new THREE.Vector2(0, 0);
  }

  initializeControls() {
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.controls.pointerSpeed = 0.78;
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(28);
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(152);
    this.controls.addEventListener('lock', () => {
      if (!this.started || this.modalOpen || this.ended) return;
      this.paused = false;
      ui.pauseScreen.classList.remove('visible');
    });
    this.controls.addEventListener('unlock', () => {
      if (!this.started || this.modalOpen || this.ended) return;
      this.paused = true;
      ui.pauseScreen.classList.add('visible');
      this.clearMovementKeys();
    });
  }

  createMaterials() {
    const wallTexture = createConcreteTexture();
    wallTexture.repeat.set(1.6, 1.1);
    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.88,
      metalness: 0.02,
      color: 0xa3adae
    });

    this.wallDarkMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.94,
      color: 0x788284
    });

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: createFloorTexture(),
      roughness: 0.63,
      metalness: 0.05,
      color: 0xa2aaaa
    });

    this.ceilingMaterial = new THREE.MeshStandardMaterial({
      map: createConcreteTexture(256, '#626b6c'),
      roughness: 0.95,
      color: 0x747e7f,
      side: THREE.DoubleSide
    });

    this.woodMaterial = new THREE.MeshStandardMaterial({ color: 0x594034, roughness: 0.82 });
    this.metalMaterial = new THREE.MeshStandardMaterial({ color: 0x334147, roughness: 0.58, metalness: 0.5 });
    this.paperMaterial = new THREE.MeshStandardMaterial({ color: 0xc7c0a6, roughness: 0.96, side: THREE.DoubleSide });
    this.blackMaterial = new THREE.MeshStandardMaterial({ color: 0x050606, roughness: 1 });
    this.redEmissiveMaterial = new THREE.MeshStandardMaterial({
      color: 0x350505,
      emissive: 0xaa0505,
      emissiveIntensity: 1.8,
      roughness: 0.45
    });

    this.chalkboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x17342f,
      roughness: 0.9,
      metalness: 0.02
    });
    this.paintMaterial = new THREE.MeshStandardMaterial({ color: 0xa9b4b3, roughness: 0.84 });
    this.bluePlasticMaterial = new THREE.MeshStandardMaterial({ color: 0x365c70, roughness: 0.68 });
    this.greenPlasticMaterial = new THREE.MeshStandardMaterial({ color: 0x476b5d, roughness: 0.68 });
    this.redPlasticMaterial = new THREE.MeshStandardMaterial({ color: 0x743f3f, roughness: 0.7 });
    this.bookMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x7d3e38, roughness: 0.82 }),
      new THREE.MeshStandardMaterial({ color: 0x3f5878, roughness: 0.82 }),
      new THREE.MeshStandardMaterial({ color: 0x60723e, roughness: 0.82 }),
      new THREE.MeshStandardMaterial({ color: 0x8b7440, roughness: 0.82 }),
      new THREE.MeshStandardMaterial({ color: 0x65517d, roughness: 0.82 })
    ];

    this.windowFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x263239,
      roughness: 0.48,
      metalness: 0.58
    });
    this.windowGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x738f9c,
      roughness: 0.22,
      metalness: 0.08,
      transparent: true,
      opacity: 0.36,
      transmission: 0.12,
      thickness: 0.08,
      side: THREE.DoubleSide,
      emissive: 0x102530,
      emissiveIntensity: 0.22,
      depthWrite: false
    });
    this.windowGlassMaterials.push(this.windowGlassMaterial);
  }

  buildLevel() {
    const floorGeometry = new THREE.PlaneGeometry(MAP_W * TILE, MAP_H * TILE);
    const floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ceiling = new THREE.Mesh(floorGeometry, this.ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    ceiling.receiveShadow = true;
    this.scene.add(ceiling);

    const wallGeometry = new THREE.BoxGeometry(TILE, WALL_HEIGHT, TILE);
    const wallCells = [];

    for (let z = 0; z < MAP_H; z += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        if (LEVEL[z][x] === '1' && !WINDOW_CELL_KEYS.has(`${x},${z}`)) wallCells.push({ x, z });
      }
    }

    const walls = new THREE.InstancedMesh(wallGeometry, this.wallMaterial, wallCells.length);
    walls.castShadow = true;
    walls.receiveShadow = true;
    const matrix = new THREE.Matrix4();
    wallCells.forEach((cell, index) => {
      const position = cellToWorld(cell.x, cell.z, WALL_HEIGHT / 2);
      matrix.makeTranslation(position.x, position.y, position.z);
      walls.setMatrixAt(index, matrix);
    });
    walls.instanceMatrix.needsUpdate = true;
    walls.computeBoundingSphere();
    this.scene.add(walls);
    this.staticRaycastObjects.push(walls);

    this.createExterior();
    this.createWindows();
    this.createEntranceDoor();
    this.createExitDoor();
    this.createHallwayDetails();
  }

  createExterior() {
    const exteriorGround = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_W * TILE + 58, MAP_H * TILE + 58),
      new THREE.MeshStandardMaterial({
        color: 0x0c1518,
        roughness: 0.32,
        metalness: 0.08
      })
    );
    exteriorGround.rotation.x = -Math.PI / 2;
    exteriorGround.position.y = -0.035;
    exteriorGround.receiveShadow = true;
    this.scene.add(exteriorGround);

    const distantMaterial = new THREE.MeshStandardMaterial({
      color: 0x11191d,
      roughness: 0.96,
      emissive: 0x020506,
      emissiveIntensity: 0.15
    });
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x111313, roughness: 1 });
    const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x090b0c, roughness: 1 });

    const buildings = [
      [-SCHOOL_HALF_WIDTH - 17, -15, 9, 14, 12],
      [SCHOOL_HALF_WIDTH + 18, -7, 12, 10, 17],
      [-18, -SCHOOL_HALF_DEPTH - 20, 15, 12, 9],
      [12, SCHOOL_HALF_DEPTH + 22, 18, 9, 11],
      [SCHOOL_HALF_WIDTH + 24, SCHOOL_HALF_DEPTH + 14, 10, 16, 10]
    ];
    buildings.forEach(([x, z, width, height, depth]) => {
      const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), distantMaterial);
      building.position.set(x, height * 0.5 - 0.02, z);
      building.castShadow = false;
      building.receiveShadow = true;
      this.scene.add(building);
    });

    for (let index = 0; index < 30; index += 1) {
      const angle = (index / 30) * Math.PI * 2 + seededRandom(index + 3200) * 0.2;
      const radiusX = SCHOOL_HALF_WIDTH + 8 + seededRandom(index + 3300) * 16;
      const radiusZ = SCHOOL_HALF_DEPTH + 8 + seededRandom(index + 3400) * 16;
      const tree = new THREE.Group();
      const trunkHeight = 3.2 + seededRandom(index + 3500) * 3.2;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.22, trunkHeight, 7), trunkMaterial);
      trunk.position.y = trunkHeight * 0.5;
      tree.add(trunk);
      for (let branchIndex = 0; branchIndex < 5; branchIndex += 1) {
        const branch = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.075, 1.4 + seededRandom(index * 9 + branchIndex) * 1.4, 6),
          branchMaterial
        );
        branch.position.y = trunkHeight * (0.58 + branchIndex * 0.07);
        branch.rotation.z = (branchIndex % 2 ? 1 : -1) * (0.55 + seededRandom(index * 11 + branchIndex) * 0.42);
        branch.rotation.y = branchIndex * 1.3;
        tree.add(branch);
      }
      tree.position.set(Math.cos(angle) * radiusX, 0, Math.sin(angle) * radiusZ);
      this.scene.add(tree);
    }
  }


  createWindows() {
    const openingWidth = 1.55;
    const sillHeight = 0.88;
    const openingHeight = 1.72;
    const headerHeight = WALL_HEIGHT - sillHeight - openingHeight;
    const sideWidth = (TILE - openingWidth) * 0.5;
    const wallDepth = 0.22;
    const boundary = TILE * 0.5 - wallDepth * 0.5;

    WINDOW_CELLS.forEach(({ x, z, side }, index) => {
      const group = new THREE.Group();
      group.position.copy(cellToWorld(x, z, 0));
      const alongX = side === 'north' || side === 'south';

      const left = new THREE.Mesh(
        new THREE.BoxGeometry(alongX ? sideWidth : wallDepth, WALL_HEIGHT, alongX ? wallDepth : sideWidth),
        this.wallMaterial
      );
      const right = left.clone();
      if (alongX) {
        left.position.x = -(openingWidth + sideWidth) * 0.5;
        right.position.x = (openingWidth + sideWidth) * 0.5;
      } else {
        left.position.z = -(openingWidth + sideWidth) * 0.5;
        right.position.z = (openingWidth + sideWidth) * 0.5;
      }
      left.position.y = WALL_HEIGHT * 0.5;
      right.position.y = WALL_HEIGHT * 0.5;

      const sill = new THREE.Mesh(
        new THREE.BoxGeometry(alongX ? openingWidth : wallDepth, sillHeight, alongX ? wallDepth : openingWidth),
        this.wallMaterial
      );
      sill.position.y = sillHeight * 0.5;
      const header = new THREE.Mesh(
        new THREE.BoxGeometry(alongX ? openingWidth : wallDepth, headerHeight, alongX ? wallDepth : openingWidth),
        this.wallMaterial
      );
      header.position.y = sillHeight + openingHeight + headerHeight * 0.5;

      [left, right, sill, header].forEach((mesh) => {
        if (alongX) mesh.position.z = side === 'north' ? boundary : -boundary;
        else mesh.position.x = side === 'west' ? boundary : -boundary;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      });

      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(openingWidth - 0.08, openingHeight - 0.08),
        this.windowGlassMaterial.clone()
      );
      pane.position.y = sillHeight + openingHeight * 0.5;
      const glassOffset = boundary - 0.03;
      if (side === 'north') {
        pane.position.z = glassOffset;
        pane.rotation.y = Math.PI;
      } else if (side === 'south') {
        pane.position.z = -glassOffset;
      } else if (side === 'west') {
        pane.position.x = glassOffset;
        pane.rotation.y = -Math.PI / 2;
      } else {
        pane.position.x = -glassOffset;
        pane.rotation.y = Math.PI / 2;
      }
      pane.renderOrder = 2;
      this.windowGlassMaterials.push(pane.material);
      group.add(pane);

      const frameThickness = 0.065;
      const frameDepth = 0.07;
      const verticalGeometry = new THREE.BoxGeometry(frameThickness, openingHeight, frameDepth);
      const horizontalGeometry = new THREE.BoxGeometry(openingWidth, frameThickness, frameDepth);
      const frameGroup = new THREE.Group();
      const frameX = openingWidth * 0.5;
      const frameY = openingHeight * 0.5;
      [-frameX, frameX, 0].forEach((offset) => {
        const bar = new THREE.Mesh(verticalGeometry, this.windowFrameMaterial);
        bar.position.x = offset;
        frameGroup.add(bar);
      });
      [-frameY, frameY, 0].forEach((offset) => {
        const bar = new THREE.Mesh(horizontalGeometry, this.windowFrameMaterial);
        bar.position.y = offset;
        frameGroup.add(bar);
      });
      frameGroup.position.copy(pane.position);
      frameGroup.rotation.copy(pane.rotation);
      group.add(frameGroup);

      const backdropMaterial = new THREE.MeshBasicMaterial({
        map: createWindowViewTexture(index + 1, false),
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(openingWidth - 0.12, openingHeight - 0.12), backdropMaterial);
      backdrop.position.copy(pane.position);
      backdrop.rotation.copy(pane.rotation);
      backdrop.translateZ(-0.12);
      backdrop.renderOrder = 1;
      group.add(backdrop);
      this.windowBackdropMaterials.push(backdropMaterial);

      const eyesMaterial = new THREE.MeshBasicMaterial({
        map: createWindowViewTexture(index + 103, true),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const eyesPlane = new THREE.Mesh(new THREE.PlaneGeometry(openingWidth - 0.12, openingHeight - 0.12), eyesMaterial);
      eyesPlane.position.copy(pane.position);
      eyesPlane.rotation.copy(pane.rotation);
      eyesPlane.translateZ(-0.10);
      eyesPlane.renderOrder = 3;
      group.add(eyesPlane);
      this.windowEyeMaterials.push({ material: eyesMaterial, timer: 5 + (index % 3) * 2.2, visible: 0 });

      const flashPanelMaterial = new THREE.MeshBasicMaterial({
        color: 0xb9d5df,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const flashPanel = new THREE.Mesh(new THREE.PlaneGeometry(openingWidth - 0.12, openingHeight - 0.12), flashPanelMaterial);
      flashPanel.position.copy(pane.position);
      flashPanel.rotation.copy(pane.rotation);
      flashPanel.translateZ(-0.04);
      group.add(flashPanel);
      this.outdoorLightningMaterials.push(flashPanelMaterial);

      this.scene.add(group);
    });
  }

  createStairMesh(direction = 'down') {
    const group = new THREE.Group();
    const concrete = new THREE.MeshStandardMaterial({ color: 0x72787d, roughness: 0.95, metalness: 0.02 });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaeb5b8, roughness: 0.82, metalness: 0.02 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x4f575c, roughness: 0.72, metalness: 0.18 });
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x232b2f, roughness: 0.45, metalness: 0.58 });
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xd9bc54, roughness: 0.58, metalness: 0.12 });
    const barrierMaterial = new THREE.MeshStandardMaterial({ color: 0x5b473d, roughness: 0.84, metalness: 0.05 });

    if (direction !== 'up') {
      group.userData.collider = { width: 2.2, depth: 3.4, offsetZ: 0.95 };
      return group;
    }

    const stepCount = 8;
    const treadDepth = 0.28;
    const stepThickness = 0.11;
    const rise = 0.17;
    const stairWidth = 1.9;
    const landingDepth = 1.04;
    const totalDepth = landingDepth + stepCount * treadDepth + 0.9;
    const totalRise = stepCount * rise;
    const sideX = stairWidth * 0.5 + 0.07;

    const entryLanding = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.12, landingDepth), concrete);
    entryLanding.position.set(0, -0.06, -0.52);
    entryLanding.receiveShadow = true;
    group.add(entryLanding);

    for (let i = 0; i < stepCount; i += 1) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, stepThickness, treadDepth), concrete);
      step.position.set(0, i * rise + stepThickness * 0.5, -0.04 + i * treadDepth);
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);

      const edge = new THREE.Mesh(new THREE.BoxGeometry(stairWidth - 0.08, 0.022, 0.04), stripeMaterial);
      edge.position.set(0, stepThickness * 0.5 - 0.01, -treadDepth * 0.5 + 0.02);
      step.add(edge);
    }

    const topLanding = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.12, 0.82), concrete);
    topLanding.position.set(0, totalRise - 0.02, stepCount * treadDepth + 0.34);
    topLanding.receiveShadow = true;
    group.add(topLanding);

    [-sideX, sideX].forEach((x) => {
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1 + totalRise * 0.3, totalDepth), wallMaterial);
      sideWall.position.set(x, 0.54 + totalRise * 0.15, 0.72);
      sideWall.castShadow = true;
      sideWall.receiveShadow = true;
      group.add(sideWall);

      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, totalDepth), trimMaterial);
      baseTrim.position.set(x - Math.sign(x) * 0.015, 0.04, 0.72);
      group.add(baseTrim);
    });

    [-0.72, 0.72].forEach((x) => {
      const postA = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.02, 10), railMaterial);
      postA.position.set(x, 0.48, -0.38);
      group.add(postA);
      const postB = postA.clone();
      postB.position.set(x, totalRise + 0.38, stepCount * treadDepth + 0.22);
      group.add(postB);

      const railLength = Math.sqrt((stepCount * treadDepth + 0.62) ** 2 + (totalRise - 0.1) ** 2);
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, railLength, 10), railMaterial);
      rail.rotation.x = Math.PI / 2;
      rail.rotation.z = Math.atan2(totalRise - 0.1, stepCount * treadDepth + 0.62);
      rail.position.set(x, totalRise * 0.5 + 0.45, stepCount * treadDepth * 0.5 + 0.02);
      group.add(rail);
    });

    const barrierFrame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.05, 0.08), wallMaterial);
    barrierFrame.position.set(0, totalRise + 0.48, stepCount * treadDepth + 0.68);
    group.add(barrierFrame);

    for (let i = 0; i < 3; i += 1) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.14, 0.08), barrierMaterial);
      board.position.set(0, totalRise + 0.26 + i * 0.21, stepCount * treadDepth + 0.63);
      board.rotation.z = i % 2 === 0 ? 0.24 : -0.22;
      board.castShadow = true;
      group.add(board);
    }

    const caution = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.5, 0.03), stripeMaterial);
    caution.position.set(0, totalRise + 0.48, stepCount * treadDepth + 0.58);
    group.add(caution);

    group.userData.collider = { width: 2.28, depth: 3.55, offsetZ: 0.9 };
    return group;
  }

  createBlockedRubble() {
    const group = new THREE.Group();
    const rubbleMaterial = new THREE.MeshStandardMaterial({ color: 0x303638, roughness: 0.95 });
    for (let i = 0; i < 11; i += 1) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13 + seededRandom(i + 5300) * 0.16, 0), rubbleMaterial);
      rock.position.set((seededRandom(i + 5400) - 0.5) * 1.45, 0.22 + seededRandom(i + 5500) * 0.4, -0.45 + seededRandom(i + 5600) * 0.8);
      rock.rotation.set(seededRandom(i) * 2, seededRandom(i + 1) * 2, seededRandom(i + 2) * 2);
      rock.castShadow = true;
      group.add(rock);
    }
    return group;
  }

  getBasementBounds() {
    const stairCenter = cellToWorld(STAIRS_DOWN_CELL.x, STAIRS_DOWN_CELL.z, 0);
    const roomCenter = cellToWorld(23, 19, 0);
    return {
      stairCenter,
      walkLaneCenterZ: stairCenter.z,
      stairStartX: stairCenter.x - 1.05,
      stairEndX: stairCenter.x + 1.74,
      stairHalfDepth: 0.5,
      basementMinX: stairCenter.x + 1.55,
      basementMaxX: roomCenter.x + TILE * 1.45,
      basementMinZ: roomCenter.z - TILE * 1.05,
      basementMaxZ: stairCenter.z + TILE * 0.82
    };
  }

  getGroundHeight(x, z, allowBasement = false) {
    if (!allowBasement) return 0;
    const bounds = this.getBasementBounds();
    const inStairBand = Math.abs(z - bounds.walkLaneCenterZ) <= bounds.stairHalfDepth;
    if (inStairBand && x >= bounds.stairStartX && x <= bounds.stairEndX) {
      const t = clamp((x - bounds.stairStartX) / (bounds.stairEndX - bounds.stairStartX), 0, 1);
      return THREE.MathUtils.lerp(0, BASEMENT_FLOOR_Y, t);
    }
    const inThreshold = Math.abs(z - bounds.walkLaneCenterZ) <= 0.62 && x > bounds.stairEndX && x <= bounds.basementMinX + 0.18;
    if (inThreshold) return BASEMENT_FLOOR_Y;
    const insideBasementRoom = x >= bounds.basementMinX && x <= bounds.basementMaxX && z >= bounds.basementMinZ && z <= bounds.basementMaxZ;
    if (insideBasementRoom && this.playerInBasement) {
      return BASEMENT_FLOOR_Y;
    }
    return 0;
  }

  isInsideRect(x, z, centerX, centerZ, halfWidth, halfDepth, radius = 0) {
    return Math.abs(x - centerX) <= halfWidth + radius && Math.abs(z - centerZ) <= halfDepth + radius;
  }

  isBlockedByStairArchitecture(x, z, radius = PLAYER_RADIUS) {
    const bounds = this.getBasementBounds();
    const regionMinX = bounds.stairStartX - 0.45;
    const regionMaxX = bounds.basementMinX + 0.22;
    const regionMinZ = bounds.walkLaneCenterZ - 1.08;
    const regionMaxZ = bounds.walkLaneCenterZ + 1.08;
    if (x < regionMinX || x > regionMaxX || z < regionMinZ || z > regionMaxZ) return false;

    const onTopLanding = x < bounds.stairStartX + 0.18 && Math.abs(z - bounds.walkLaneCenterZ) <= 0.62;
    const onSlope = x >= bounds.stairStartX - 0.02 && x <= bounds.stairEndX + 0.12 && Math.abs(z - bounds.walkLaneCenterZ) <= 0.48;
    const onLowerThreshold = x > bounds.stairEndX + 0.12 && x <= bounds.basementMinX + 0.18 && Math.abs(z - bounds.walkLaneCenterZ) <= 0.62;
    const inBasementRoom = x >= bounds.basementMinX && x <= bounds.basementMaxX && z >= bounds.basementMinZ && z <= bounds.basementMaxZ;

    if (onTopLanding || onSlope || onLowerThreshold || inBasementRoom) return false;
    return true;
  }

  constrainPlayerOnStairs() {
    const bounds = this.getBasementBounds();
    const onStairX = this.camera.position.x >= bounds.stairStartX - 0.18 && this.camera.position.x <= bounds.basementMinX + 0.04;
    if (!onStairX) return;
    if (Math.abs(this.camera.position.z - bounds.walkLaneCenterZ) <= 0.82) {
      this.camera.position.z = clamp(this.camera.position.z, bounds.walkLaneCenterZ - 0.3, bounds.walkLaneCenterZ + 0.3);
    }
  }

  createWalkableBasementStairs() {
    const group = new THREE.Group();
    const concrete = new THREE.MeshStandardMaterial({ color: 0x737a7f, roughness: 0.94, metalness: 0.02 });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xb5bcc0, roughness: 0.84, metalness: 0.02 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x4d565b, roughness: 0.7, metalness: 0.18 });
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x21292d, roughness: 0.42, metalness: 0.62 });
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xd7bc56, roughness: 0.6, metalness: 0.08 });

    const stairWidth = 1.78;
    const sideWallThickness = 0.1;
    const topLandingDepth = 1.08;
    const bottomLandingDepth = 1.02;
    const stepCount = 9;
    const treadDepth = 0.31;
    const stepThickness = 0.1;
    const totalRun = stepCount * treadDepth;
    const startX = -1.05;
    const endX = startX + totalRun;
    const stepDrop = Math.abs(BASEMENT_FLOOR_Y) / stepCount;
    const wallHeight = 1.04;
    const sideOffset = stairWidth * 0.5 + sideWallThickness * 0.5 + 0.04;

    const topLanding = new THREE.Mesh(new THREE.BoxGeometry(topLandingDepth, 0.12, stairWidth + 0.18), concrete);
    topLanding.position.set(startX - topLandingDepth * 0.5 + 0.08, -0.06, 0);
    topLanding.receiveShadow = true;
    group.add(topLanding);

    for (let i = 0; i < stepCount; i += 1) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(treadDepth, stepThickness, stairWidth), concrete);
      step.position.set(startX + i * treadDepth + treadDepth * 0.5, -(i + 0.5) * stepDrop, 0);
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);

      const edge = new THREE.Mesh(new THREE.BoxGeometry(treadDepth - 0.03, 0.02, 0.05), stripeMaterial);
      edge.position.set(0, stepThickness * 0.5 - 0.008, -stairWidth * 0.5 + 0.03);
      step.add(edge);
    }

    const bottomLanding = new THREE.Mesh(new THREE.BoxGeometry(bottomLandingDepth, 0.12, stairWidth + 0.2), concrete);
    bottomLanding.position.set(endX + bottomLandingDepth * 0.5 + 0.04, BASEMENT_FLOOR_Y - 0.06, 0);
    bottomLanding.receiveShadow = true;
    group.add(bottomLanding);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(totalRun + topLandingDepth + bottomLandingDepth + 0.18, wallHeight, sideWallThickness), wallMaterial);
    leftWall.position.set((startX + endX) * 0.5 + 0.04, 0.46, -sideOffset);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = leftWall.clone();
    rightWall.position.z = sideOffset;
    group.add(rightWall);

    const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(totalRun + topLandingDepth + bottomLandingDepth + 0.16, 0.08, 0.05), trimMaterial);
    leftTrim.position.set((startX + endX) * 0.5 + 0.04, 0.04, -sideOffset + 0.03);
    group.add(leftTrim);
    const rightTrim = leftTrim.clone();
    rightTrim.position.z = sideOffset - 0.03;
    group.add(rightTrim);

    [-0.62, 0.62].forEach((railZ) => {
      const postTop = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.88, 10), railMaterial);
      postTop.position.set(startX - 0.18, 0.42, railZ);
      group.add(postTop);

      const postBottom = postTop.clone();
      postBottom.position.set(endX + 0.18, BASEMENT_FLOOR_Y + 0.42, railZ);
      group.add(postBottom);

      const railLength = Math.sqrt((totalRun + 0.36) ** 2 + (Math.abs(BASEMENT_FLOOR_Y)) ** 2);
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, railLength, 10), railMaterial);
      rail.rotation.z = -Math.atan2(Math.abs(BASEMENT_FLOOR_Y), totalRun + 0.36);
      rail.position.set((startX + endX) * 0.5, BASEMENT_FLOOR_Y * 0.5 + 0.46, railZ);
      group.add(rail);
    });

    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, stairWidth + 0.16), trimMaterial);
    beam.position.set(startX - 0.02, 0.04, 0);
    group.add(beam);

    group.userData.antiBlockKeep = true;
    group.userData.layoutRole = 'stairs-down-walkable';
    return group;
  }

  createMonitorScreenTexture(seed = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a1d18');
    gradient.addColorStop(1, '#102c24');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(120, 255, 215, 0.16)';
    for (let y = 18; y < canvas.height; y += 16) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(canvas.width - 10, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(95, 255, 204, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 118);
    for (let x = 20; x < canvas.width - 12; x += 18) {
      const wave = Math.sin((x + seed * 13) * 0.045) * 18 + Math.cos((x + seed * 5) * 0.09) * 7;
      ctx.lineTo(x, 70 + wave);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(165, 255, 222, 0.85)';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('OPS ROOM', 16, 24);
    ctx.font = '15px monospace';
    ctx.fillText(`CANAL ${seed.toString().padStart(2, '0')}`, 16, 146);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createBasementMistPlane(width = 2.8, height = 1.45, opacity = 0.16) {
    if (!this.basementMistTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(128, 128, 18, 128, 128, 120);
      gradient.addColorStop(0, 'rgba(210, 230, 236, 0.42)');
      gradient.addColorStop(0.38, 'rgba(210, 230, 236, 0.18)');
      gradient.addColorStop(1, 'rgba(210, 230, 236, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      this.basementMistTexture = new THREE.CanvasTexture(canvas);
      this.basementMistTexture.colorSpace = THREE.SRGBColorSpace;
    }
    const material = new THREE.MeshBasicMaterial({
      map: this.basementMistTexture,
      transparent: true,
      depthWrite: false,
      opacity,
      side: THREE.DoubleSide,
      color: 0xc5d5db,
      blending: THREE.AdditiveBlending
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    plane.userData.baseOpacity = opacity;
    this.basementFogPlanes.push({ mesh: plane, material, baseOpacity: opacity, phase: Math.random() * Math.PI * 2 });
    return plane;
  }

  createOperationsConsole(screenCount = 2) {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3539, roughness: 0.66, metalness: 0.32 });
    const screenShellMaterial = new THREE.MeshStandardMaterial({ color: 0x111617, roughness: 0.48, metalness: 0.2 });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.09, 0.78), bodyMaterial);
    deskTop.position.y = 0.82;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    group.add(deskTop);

    [-0.72, 0.72].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.82, 0.09), bodyMaterial);
      leg.position.set(x, 0.41, -0.28);
      group.add(leg);
      const legBack = leg.clone();
      legBack.position.z = 0.28;
      group.add(legBack);
    });

    for (let i = 0; i < screenCount; i += 1) {
      const shell = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.28, 0.05), screenShellMaterial);
      shell.position.set(-0.33 + i * 0.48, 1.08, -0.12 + (i % 2) * 0.06);
      shell.castShadow = true;
      group.add(shell);
      const screenMaterial = new THREE.MeshStandardMaterial({
        map: this.createMonitorScreenTexture(i + 1),
        emissive: 0x3affcf,
        emissiveIntensity: 0.42,
        roughness: 0.22,
        metalness: 0.02
      });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.21), screenMaterial);
      screen.position.set(0, 0, -0.028);
      shell.add(screen);
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.17, 0.04), bodyMaterial);
      stand.position.set(0, -0.2, 0);
      shell.add(stand);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.12), bodyMaterial);
      base.position.set(0, -0.29, 0);
      shell.add(base);
    }

    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.025, 0.14), new THREE.MeshStandardMaterial({ color: 0x202528, roughness: 0.92 }));
    keyboard.position.set(-0.16, 0.88, 0.12);
    group.add(keyboard);
    const radio = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.18), new THREE.MeshStandardMaterial({ color: 0x232c30, roughness: 0.72, metalness: 0.2 }));
    radio.position.set(0.55, 0.91, 0.07);
    group.add(radio);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.46, 8), this.metalMaterial);
    antenna.position.set(0.08, 0.27, 0);
    radio.add(antenna);
    group.userData.collider = { width: 1.75, depth: 0.92, offsetX: 0, offsetZ: 0 };
    return group;
  }

  createPipeSegment(length = 3.2, radius = 0.08, color = 0x687276) {
    const group = new THREE.Group();
    const pipeMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.46, metalness: 0.52 });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 14), pipeMaterial);
    pipe.rotation.z = Math.PI / 2;
    pipe.castShadow = true;
    group.add(pipe);
    [-length * 0.3, 0, length * 0.3].forEach((x) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.05, 0.016, 8, 18), pipeMaterial);
      ring.position.x = x;
      ring.rotation.y = Math.PI / 2;
      group.add(ring);
    });
    return group;
  }

  createCableBundle(length = 2.5, count = 4) {
    const group = new THREE.Group();
    const colors = [0x1b1e23, 0x3a2020, 0x202e3b, 0x2f3520];
    for (let i = 0; i < count; i += 1) {
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, length, 8),
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.9 })
      );
      cable.rotation.z = Math.PI / 2;
      cable.position.set(0, 0, (i - (count - 1) / 2) * 0.065);
      group.add(cable);
      if (i % 2 === 0) {
        const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.52, 8), cable.material);
        drop.position.set(-length * 0.22 + i * 0.12, -0.26, cable.position.z);
        group.add(drop);
      }
    }
    return group;
  }

  createAlarmBeacon() {
    const group = new THREE.Group();
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 16), this.metalMaterial);
    group.add(housing);
    const lensMaterial = new THREE.MeshStandardMaterial({
      color: 0x521414,
      emissive: 0xff3c33,
      emissiveIntensity: 1.55,
      transparent: true,
      opacity: 0.92,
      roughness: 0.28
    });
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), lensMaterial);
    lens.position.y = 0.03;
    group.add(lens);
    const light = new THREE.PointLight(0xff4d43, 1.1, 8.5, 2);
    light.position.y = 0.08;
    group.add(light);
    this.emergencyLights.push({ light, phase: Math.random() * Math.PI * 2, base: 1.1, isEmergency: true });
    return group;
  }

  createBasementOperationsRoom() {
    const roomCenter = cellToWorld(23.15, 19.1, BASEMENT_FLOOR_Y);
    const roomWidth = TILE * 4.65;
    const roomDepth = TILE * 3.55;
    const roomHeight = 2.7;
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x556063, roughness: 0.88, metalness: 0.04 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x252d30, roughness: 0.96, metalness: 0.03 });
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x293235, roughness: 0.92, metalness: 0.03, side: THREE.DoubleSide });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.12, roomDepth), floorMaterial);
    floor.position.set(roomCenter.x, BASEMENT_FLOOR_Y - 0.06, roomCenter.z);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.08, roomDepth), ceilingMaterial);
    ceiling.position.set(roomCenter.x, BASEMENT_FLOOR_Y + roomHeight, roomCenter.z);
    ceiling.receiveShadow = true;
    this.scene.add(ceiling);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, roomHeight, 0.12), wallMaterial);
    backWall.position.set(roomCenter.x, BASEMENT_FLOOR_Y + roomHeight * 0.5, roomCenter.z + roomDepth * 0.5);
    this.scene.add(backWall);

    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, roomHeight, roomDepth), wallMaterial);
    eastWall.position.set(roomCenter.x + roomWidth * 0.5, BASEMENT_FLOOR_Y + roomHeight * 0.5, roomCenter.z);
    this.scene.add(eastWall);

    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, roomHeight, roomDepth * 0.48), wallMaterial);
    westWall.position.set(roomCenter.x - roomWidth * 0.5, BASEMENT_FLOOR_Y + roomHeight * 0.5, roomCenter.z + roomDepth * 0.26);
    this.scene.add(westWall);

    const northLeft = new THREE.Mesh(new THREE.BoxGeometry(roomWidth * 0.34, roomHeight, 0.12), wallMaterial);
    northLeft.position.set(roomCenter.x - roomWidth * 0.33, BASEMENT_FLOOR_Y + roomHeight * 0.5, roomCenter.z - roomDepth * 0.5);
    this.scene.add(northLeft);
    const northRight = northLeft.clone();
    northRight.position.x = roomCenter.x + roomWidth * 0.27;
    this.scene.add(northRight);

    const corridorCeiling = new THREE.Mesh(new THREE.BoxGeometry(TILE * 2.55, 0.08, TILE * 1.75), ceilingMaterial);
    corridorCeiling.position.copy(cellToWorld(21.8, 20, BASEMENT_FLOOR_Y + 2.42));
    corridorCeiling.receiveShadow = true;
    this.scene.add(corridorCeiling);

    const signMaterial = new THREE.MeshStandardMaterial({
      map: createSignTexture('OPERAÇÕES', 'SALA DO QUADRO'),
      roughness: 0.8,
      emissive: 0x101414,
      emissiveIntensity: 0.16
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 0.55), signMaterial);
    sign.position.set(roomCenter.x + roomWidth * 0.18, BASEMENT_FLOOR_Y + 2.05, roomCenter.z - roomDepth * 0.5 + 0.07);
    this.scene.add(sign);

    const pipe1 = this.createPipeSegment(roomWidth * 0.78, 0.08);
    pipe1.position.set(roomCenter.x, BASEMENT_FLOOR_Y + 2.35, roomCenter.z + roomDepth * 0.18);
    this.scene.add(pipe1);
    const pipe2 = this.createPipeSegment(roomDepth * 0.7, 0.06, 0x4f5a5e);
    pipe2.rotation.y = Math.PI / 2;
    pipe2.position.set(roomCenter.x + roomWidth * 0.16, BASEMENT_FLOOR_Y + 2.12, roomCenter.z - 0.15);
    this.scene.add(pipe2);

    const cableTray = this.createCableBundle(roomWidth * 0.74, 5);
    cableTray.position.set(roomCenter.x, BASEMENT_FLOOR_Y + 2.2, roomCenter.z - roomDepth * 0.24);
    this.scene.add(cableTray);

    const sideCableTray = this.createCableBundle(roomDepth * 0.48, 4);
    sideCableTray.rotation.y = Math.PI / 2;
    sideCableTray.position.set(roomCenter.x - roomWidth * 0.1, BASEMENT_FLOOR_Y + 2.02, roomCenter.z + roomDepth * 0.08);
    this.scene.add(sideCableTray);

    const wallCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.95, 0.18), this.metalMaterial);
    wallCabinet.position.set(roomCenter.x - roomWidth * 0.27, BASEMENT_FLOOR_Y + 1.45, roomCenter.z + roomDepth * 0.5 - 0.11);
    wallCabinet.castShadow = true;
    this.scene.add(wallCabinet);
    const cabinetDoor = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.9, 0.04), new THREE.MeshStandardMaterial({ color: 0x445055, roughness: 0.62, metalness: 0.38 }));
    cabinetDoor.position.z = -0.11;
    wallCabinet.add(cabinetDoor);

    const alarmA = this.createAlarmBeacon();
    alarmA.position.set(roomCenter.x - roomWidth * 0.39, BASEMENT_FLOOR_Y + 2.2, roomCenter.z - roomDepth * 0.42);
    this.scene.add(alarmA);
    const alarmB = this.createAlarmBeacon();
    alarmB.position.set(roomCenter.x + roomWidth * 0.39, BASEMENT_FLOOR_Y + 2.2, roomCenter.z + roomDepth * 0.41);
    this.scene.add(alarmB);

    const roomMist = this.createBasementMistPlane(3.6, 1.9, 0.12);
    roomMist.rotation.x = -Math.PI / 2;
    roomMist.position.set(roomCenter.x - 0.2, BASEMENT_FLOOR_Y + 0.08, roomCenter.z + 0.12);
    this.scene.add(roomMist);
    const corridorMist = this.createBasementMistPlane(2.1, 1.05, 0.17);
    corridorMist.rotation.x = -Math.PI / 2;
    corridorMist.position.copy(cellToWorld(21.55, 20, BASEMENT_FLOOR_Y + 0.08));
    this.scene.add(corridorMist);
  }

  createOperationsArea() {
    this.createBasementOperationsRoom();

    const stairsDown = this.createWalkableBasementStairs();
    stairsDown.position.copy(cellToWorld(STAIRS_DOWN_CELL.x, STAIRS_DOWN_CELL.z, 0));
    this.scene.add(stairsDown);
    this.schoolProps.push(stairsDown);

    const stairTopAlarm = this.createAlarmBeacon();
    stairTopAlarm.position.copy(cellToWorld(STAIRS_DOWN_CELL.x, STAIRS_DOWN_CELL.z, 1.95));
    stairTopAlarm.position.set(stairTopAlarm.position.x - 1.05, 1.95, stairTopAlarm.position.z - 0.76);
    this.scene.add(stairTopAlarm);
    const stairBottomAlarm = this.createAlarmBeacon();
    stairBottomAlarm.position.copy(cellToWorld(STAIRS_DOWN_CELL.x, STAIRS_DOWN_CELL.z, BASEMENT_FLOOR_Y + 1.55));
    stairBottomAlarm.position.set(stairBottomAlarm.position.x + 1.1, BASEMENT_FLOOR_Y + 1.55, stairBottomAlarm.position.z + 0.76);
    this.scene.add(stairBottomAlarm);

    const stairMist = this.createBasementMistPlane(2.4, 1.1, 0.16);
    stairMist.rotation.x = -Math.PI / 2;
    stairMist.position.copy(cellToWorld(STAIRS_DOWN_CELL.x + 0.45, STAIRS_DOWN_CELL.z, BASEMENT_FLOOR_Y + 0.18));
    this.scene.add(stairMist);


    const mainConsole = this.createOperationsConsole(2);
    this.placeAgainstWall(mainConsole, 23, 20, 'south', 0.82, 0.06);
    mainConsole.position.y = BASEMENT_FLOOR_Y;

    const sideConsole = this.createOperationsConsole(1);
    this.placeAgainstWall(sideConsole, 24, 19, 'east', 0.68, 0.06, -0.16);
    sideConsole.position.y = BASEMENT_FLOOR_Y;

    const lockerA = this.createLocker();
    this.placeAgainstWall(lockerA, 22, 19, 'west', 0.76, 0.04, 0.3);
    lockerA.position.y = BASEMENT_FLOOR_Y;
    const lockerB = this.createLocker();
    this.placeAgainstWall(lockerB, 22, 18, 'west', 0.76, 0.04, -0.3);
    lockerB.position.y = BASEMENT_FLOOR_Y;

    const smallBin = this.createTrashBin();
    this.placeAgainstWall(smallBin, 22, 20, 'south', 0.78, 0.08);
    smallBin.position.y = BASEMENT_FLOOR_Y;
  }

  createEntranceDoor() {
    const group = new THREE.Group();
    const doorWidth = 1.28;
    const doorHeight = 2.48;
    const wallDepth = 0.14;
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x232d31, roughness: 0.64, metalness: 0.36 });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x6a7276, roughness: 0.76, metalness: 0.08 });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 0.18, doorHeight + 0.18, wallDepth), frameMaterial);
    frame.position.set(0, doorHeight * 0.5, 0);
    frame.castShadow = true;
    group.add(frame);

    const door = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, wallDepth * 0.72), doorMaterial);
    door.position.set(0, doorHeight * 0.5, 0.02);
    door.castShadow = true;
    door.receiveShadow = true;
    group.add(door);

    const handlePlate = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.2, 0.02), this.metalMaterial);
    handlePlate.position.set(doorWidth * 0.34, 1.03, 0.07);
    group.add(handlePlate);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), this.metalMaterial);
    handle.position.set(doorWidth * 0.39, 1.03, 0.09);
    group.add(handle);

    const interaction = this.createInteractionVolume('jammedDoor', 'Abrir porta de entrada', new THREE.Vector3(0.28, PLAYER_HEIGHT, 0), new THREE.Vector3(1.6, 2.4, 1.25));
    interaction.userData.parentGroup = group;
    group.add(interaction);

    const position = cellToWorld(ENTRANCE_CELL.x, ENTRANCE_CELL.z, 0);
    group.position.copy(position);
    group.rotation.y = Math.PI / 2;
    group.position.x -= TILE * 0.5 - 0.12;
    group.userData.collider = { width: 0.18, depth: doorWidth + 0.04, offsetX: 0, offsetZ: 0 };
    group.userData.antiBlockKeep = true;
    group.userData.layoutRole = 'entrance-door';

    this.scene.add(group);
    this.schoolProps.push(group);
    this.registerPropCollider(group);
    this.interactables.push(interaction);
    this.raycastTargets.push(interaction);
    this.entranceDoor = group;
  }

  createExitDoor() {
    const position = cellToWorld(EXIT_CELL.x, EXIT_CELL.z, 0);
    const group = new THREE.Group();
    group.position.copy(position);

    const wallDepth = 0.24;
    const boundaryZ = -TILE * 0.5 + wallDepth * 0.5;
    const openingWidth = TILE * 0.66;
    const doorWidth = openingWidth - 0.12;
    const doorHeight = WALL_HEIGHT * 0.79;
    const sideFillWidth = (TILE - openingWidth) * 0.5;
    const topFillHeight = WALL_HEIGHT - doorHeight;

    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x20282c, roughness: 0.68, metalness: 0.58 });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x3a4448, roughness: 0.56, metalness: 0.46 });

    [-1, 1].forEach((side) => {
      const filler = new THREE.Mesh(new THREE.BoxGeometry(sideFillWidth, WALL_HEIGHT, wallDepth), this.wallMaterial);
      filler.position.set(side * (openingWidth * 0.5 + sideFillWidth * 0.5), WALL_HEIGHT * 0.5, boundaryZ);
      filler.castShadow = true;
      filler.receiveShadow = true;
      group.add(filler);
    });

    const topFiller = new THREE.Mesh(new THREE.BoxGeometry(openingWidth, topFillHeight, wallDepth), this.wallMaterial);
    topFiller.position.set(0, doorHeight + topFillHeight * 0.5, boundaryZ);
    topFiller.castShadow = true;
    topFiller.receiveShadow = true;
    group.add(topFiller);

    const framePostGeometry = new THREE.BoxGeometry(0.08, doorHeight + 0.08, 0.12);
    [-1, 1].forEach((side) => {
      const post = new THREE.Mesh(framePostGeometry, frameMaterial);
      post.position.set(side * (openingWidth * 0.5 - 0.04), (doorHeight + 0.08) * 0.5, boundaryZ + 0.02);
      post.castShadow = true;
      group.add(post);
    });

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(openingWidth, 0.08, 0.12), frameMaterial);
    frameTop.position.set(0, doorHeight + 0.04, boundaryZ + 0.02);
    frameTop.castShadow = true;
    group.add(frameTop);

    const door = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, 0.16), doorMaterial);
    door.position.set(0, doorHeight * 0.5, boundaryZ);
    door.castShadow = true;
    door.receiveShadow = true;
    group.add(door);

    const centerStripe = new THREE.Mesh(new THREE.BoxGeometry(doorWidth * 0.12, doorHeight * 0.72, 0.02), frameMaterial);
    centerStripe.position.set(0, doorHeight * 0.53, boundaryZ - 0.09);
    group.add(centerStripe);

    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.05), this.redEmissiveMaterial);
    lamp.position.set(openingWidth * 0.34, doorHeight * 0.68, boundaryZ - 0.11);
    group.add(lamp);

    const interaction = this.createInteractionVolume('exit', 'Abrir a saída', new THREE.Vector3(0, PLAYER_HEIGHT, 0.15), new THREE.Vector3(TILE * 0.9, WALL_HEIGHT, 1.25));
    group.add(interaction);

    group.userData.doorMesh = door;
    group.userData.lamp = lamp;
    group.userData.baseDoorY = doorHeight * 0.5;
    group.userData.openRise = WALL_HEIGHT * 0.94;
    group.userData.openingWidth = openingWidth;
    group.userData.boundaryZ = boundaryZ;
    group.userData.collider = {
      width: doorWidth,
      depth: 0.26,
      offsetZ: boundaryZ,
      enabled: () => group.userData.openAmount < 0.72
    };
    group.userData.openAmount = 0;
    this.exitDoor = group;
    this.scene.add(group);
    this.registerPropCollider(group);
    this.interactables.push(interaction);
    this.raycastTargets.push(interaction);
    this.staticRaycastObjects.push(door);
  }

  createHallwayDetails() {
    const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x20292c, roughness: 0.7, metalness: 0.4 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x263034, roughness: 0.82 });

    for (let z = 2; z < MAP_H - 1; z += 4) {
      const world = cellToWorld(MAP_W / 2, z, WALL_HEIGHT - 0.18);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(MAP_W * TILE, 0.16, 0.18), beamMaterial);
      beam.position.copy(world);
      beam.castShadow = true;
      this.scene.add(beam);
    }

    for (let i = 0; i < 18; i += 1) {
      const cellX = 1 + Math.floor(seededRandom(i * 5 + 3) * (MAP_W - 2));
      const cellZ = 1 + Math.floor(seededRandom(i * 7 + 11) * (MAP_H - 2));
      if (!isLayoutSafeCell(cellX, cellZ, 1)) continue;
      const puddle = new THREE.Mesh(
        new THREE.CircleGeometry(0.35 + seededRandom(i * 13) * 0.8, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x101b20,
          roughness: 0.16,
          metalness: 0.05,
          transparent: true,
          opacity: 0.52,
          clearcoat: 1,
          clearcoatRoughness: 0.1
        })
      );
      const position = cellToWorld(cellX, cellZ, 0.008);
      puddle.position.copy(position);
      puddle.rotation.x = -Math.PI / 2;
      puddle.scale.y = 0.45 + seededRandom(i * 17) * 0.45;
      this.scene.add(puddle);
    }

    const signs = [
      { x: 4, z: 5, text: 'ALA A', subtitle: 'SALAS 01–08', orientation: 'horizontal', width: 1.65, height: 0.43 },
      { x: 12, z: 10, text: 'SALA 13', subtitle: 'INTERDITADA', orientation: 'vertical', width: 1.65, height: 0.43 },
      { x: 20, z: 16, text: 'SAÍDA', subtitle: 'PORTA NORTE', orientation: 'horizontal', width: 1.85, height: 0.48 }
    ];

    signs.forEach((sign) => {
      const group = new THREE.Group();
      const backing = new THREE.Mesh(
        new THREE.BoxGeometry(sign.width + 0.08, sign.height + 0.07, 0.045),
        new THREE.MeshStandardMaterial({ color: 0x252d30, roughness: 0.72, metalness: 0.28 })
      );
      backing.castShadow = true;
      group.add(backing);

      const material = new THREE.MeshStandardMaterial({
        map: createSignTexture(sign.text, sign.subtitle),
        roughness: 0.8,
        emissive: 0x101414,
        emissiveIntensity: 0.15,
        side: THREE.DoubleSide
      });
      const face = new THREE.Mesh(new THREE.PlaneGeometry(sign.width, sign.height), material);
      face.position.z = -0.026;
      group.add(face);

      group.position.copy(cellToWorld(sign.x, sign.z, 2.88));
      group.rotation.y = sign.orientation === 'vertical' ? Math.PI / 2 : 0;
      this.scene.add(group);
      this.schoolProps.push(group);
    });

    const trimGeometry = new THREE.BoxGeometry(TILE * 0.96, 0.09, 0.08);
    for (let z = 1; z < MAP_H - 1; z += 1) {
      for (let x = 1; x < MAP_W - 1; x += 1) {
        if (LEVEL[z][x] !== '0') continue;
        if (LEVEL[z - 1]?.[x] === '1') {
          const trim = new THREE.Mesh(trimGeometry, trimMaterial);
          const p = cellToWorld(x, z, 0.28);
          trim.position.set(p.x, 0.28, p.z - TILE * 0.47);
          this.scene.add(trim);
        }
      }
    }
  }

  createProps() {
    CLUES.forEach((clue, index) => this.createClue(clue, index));
    BATTERIES.forEach((battery, index) => this.createBattery(battery, index));
    HIDE_SPOTS.forEach((spot, index) => this.createHideSpot(spot, index));
    this.createOperationsArea();
    this.createBreaker();
    this.createClassroomClutter();
    this.createSchoolEnvironment();
  }

  createInteractionVolume(type, label, offset, size) {
    const material = new THREE.MeshBasicMaterial({ visible: false });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
    mesh.position.copy(offset);
    mesh.userData.type = type;
    mesh.userData.label = label;
    mesh.userData.active = true;
    return mesh;
  }

  createClue(data, index) {
    const group = new THREE.Group();
    group.position.copy(cellToWorld(data.cellX, data.cellZ, 0.035));
    group.rotation.y = seededRandom(index + 4) * Math.PI * 2;

    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.018, 0.68), this.paperMaterial);
    paper.rotation.z = (seededRandom(index + 20) - 0.5) * 0.28;
    paper.castShadow = true;
    group.add(paper);

    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x3d3d35 });
    for (let i = 0; i < 5; i += 1) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.32 - i * 0.016, 0.011), lineMaterial);
      line.position.set(0, 0.012, 0.18 - i * 0.085);
      line.rotation.x = -Math.PI / 2;
      group.add(line);
    }

    const interaction = this.createInteractionVolume('clue', 'Examinar pista', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(1.1, 1.6, 1.1));
    interaction.userData.data = data;
    interaction.userData.index = index;
    interaction.userData.parentGroup = group;
    group.add(interaction);

    this.scene.add(group);
    this.interactables.push(interaction);
    this.raycastTargets.push(interaction);
    this.activeClues.push(interaction);
    // A pista permanece apoiada no piso; não flutua.
  }

  createBattery(data, index) {
    const group = new THREE.Group();
    group.position.copy(cellToWorld(data.cellX, data.cellZ, 0.115));

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xa88d31,
      roughness: 0.48,
      metalness: 0.4,
      emissive: 0x281e02,
      emissiveIntensity: 0.25
    });
    const battery = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.48, 16), bodyMaterial);
    battery.rotation.z = Math.PI / 2;
    battery.castShadow = true;
    group.add(battery);

    const capMaterial = new THREE.MeshStandardMaterial({ color: 0xbcc2b9, metalness: 0.8, roughness: 0.28 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.035, 12), capMaterial);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = 0.257;
    group.add(cap);

    const interaction = this.createInteractionVolume('battery', 'Pegar pilhas', new THREE.Vector3(0, 0.38, 0), new THREE.Vector3(1.1, 1.3, 1.1));
    interaction.userData.parentGroup = group;
    group.add(interaction);

    this.scene.add(group);
    this.interactables.push(interaction);
    this.raycastTargets.push(interaction);
    this.activeBatteries.push(interaction);
    this.animatedObjects.push({ object: group, type: 'rotate', phase: index, baseY: group.position.y, amplitude: 0 });
  }

  createMapPaperTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e1d4ae';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(68, 62, 44, 0.9)';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.fillStyle = '#473b2a';
    ctx.font = '700 28px Georgia';
    ctx.fillText('PLANTA DA ESCOLA', 24, 42);
    ctx.font = '18px Georgia';
    ctx.fillText('Recepção • salas • saída norte', 24, 68);
    ctx.strokeStyle = 'rgba(67, 78, 88, 0.75)';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 92, 348, 166);
    ctx.strokeRect(64, 120, 70, 42);
    ctx.strokeRect(164, 120, 94, 42);
    ctx.strokeRect(288, 120, 68, 42);
    ctx.beginPath();
    ctx.moveTo(36, 182); ctx.lineTo(384, 182);
    ctx.moveTo(142, 92); ctx.lineTo(142, 258);
    ctx.moveTo(266, 92); ctx.lineTo(266, 258);
    ctx.stroke();
    ctx.fillStyle = '#5b6d7a';
    ctx.fillRect(58, 195, 52, 22);
    ctx.fillRect(302, 205, 56, 22);
    ctx.fillStyle = '#6a3f3f';
    ctx.fillRect(178, 205, 68, 22);
    ctx.fillStyle = '#3f5d46';
    ctx.fillRect(212, 94, 32, 16);
    ctx.fillStyle = '#473b2a';
    ctx.font = '16px Georgia';
    ctx.fillText('ENTRADA', 58, 245);
    ctx.fillText('SALA 13', 176, 245);
    ctx.fillText('QUADRO', 296, 245);
    ctx.fillText('SAÍDA', 205, 112);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createEntranceMapTable() {
    const table = this.createTable();
    table.userData.antiBlockKeep = true;
    table.userData.layoutRole = 'map-table';
    const placed = this.placeAgainstWall(table, 2, 2, 'north', 0.76, 0.03, -0.18);
    const mapPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 0.66),
      new THREE.MeshStandardMaterial({ map: this.createMapPaperTexture(), side: THREE.DoubleSide, roughness: 0.92 })
    );
    mapPaper.rotation.x = -Math.PI / 2;
    mapPaper.position.set(0, 0.97, 0.08);
    mapPaper.castShadow = true;
    placed.add(mapPaper);

    const note = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.035, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x67523d, roughness: 0.88 })
    );
    note.position.set(-0.28, 0.96, -0.05);
    note.rotation.y = 0.36;
    placed.add(note);

    const interaction = this.createInteractionVolume('schoolMap', 'Pegar mapa da escola', new THREE.Vector3(0, 1.08, 0), new THREE.Vector3(1.8, 1.35, 1.15));
    interaction.userData.parentGroup = placed;
    interaction.userData.mapPaper = mapPaper;
    placed.add(interaction);
    this.interactables.push(interaction);
    this.raycastTargets.push(interaction);
    this.mapPickup = interaction;
    return placed;
  }

  createLocker() {
    const group = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.45, 0.68), this.metalMaterial);
    shell.position.y = 1.225;
    shell.castShadow = true;
    shell.receiveShadow = true;
    group.add(shell);

    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x3e4b50, roughness: 0.54, metalness: 0.48 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.82, 2.28, 0.06), doorMaterial);
    door.position.set(0, 1.22, -0.37);
    door.castShadow = true;
    group.add(door);

    for (let i = 0; i < 5; i += 1) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.025, 0.018), this.blackMaterial);
      slot.position.set(-0.12, 1.78 - i * 0.09, -0.408);
      group.add(slot);
    }

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.035), new THREE.MeshStandardMaterial({ color: 0x9aa3a2, metalness: 0.8, roughness: 0.25 }));
    handle.position.set(0.27, 1.14, -0.42);
    group.add(handle);
    group.userData.collider = { width: 0.92, depth: 0.68 };
    group.userData.allowAntiBlockRemoval = true;
    group.userData.layoutRole = 'locker';
    return group;
  }

  createTable() {
    const group = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.13, 1.05), this.woodMaterial);
    top.position.y = 0.93;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    const legGeometry = new THREE.BoxGeometry(0.12, 0.9, 0.12);
    const positions = [
      [-0.78, 0.45, -0.38], [0.78, 0.45, -0.38],
      [-0.78, 0.45, 0.38], [0.78, 0.45, 0.38]
    ];
    positions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeometry, this.metalMaterial);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });
    group.userData.collider = { width: 1.9, depth: 1.05 };
    group.userData.allowAntiBlockRemoval = true;
    group.userData.layoutRole = 'table';
    return group;
  }

  createChair(material = this.bluePlasticMaterial) {
    const group = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 0.7), material);
    seat.position.y = 0.52;
    seat.castShadow = true;
    seat.receiveShadow = true;
    group.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.08), material);
    back.position.set(0, 0.9, 0.31);
    back.rotation.x = -0.08;
    back.castShadow = true;
    group.add(back);

    const legGeometry = new THREE.CylinderGeometry(0.025, 0.032, 0.52, 7);
    const legs = [
      [-0.27, 0.26, -0.25], [0.27, 0.26, -0.25],
      [-0.27, 0.26, 0.25], [0.27, 0.26, 0.25]
    ];
    legs.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeometry, this.metalMaterial);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });
    return group;
  }

  createStudentDesk(chairMaterial = this.bluePlasticMaterial) {
    const group = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.09, 0.66), this.woodMaterial);
    top.position.set(0, 0.78, -0.12);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    const frameGeometry = new THREE.BoxGeometry(0.055, 0.73, 0.055);
    [[-0.43, 0.38, -0.35], [0.43, 0.38, -0.35], [-0.43, 0.38, 0.1], [0.43, 0.38, 0.1]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(frameGeometry, this.metalMaterial);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });

    const chair = this.createChair(chairMaterial);
    chair.scale.setScalar(0.83);
    chair.position.set(0, 0, 0.63);
    group.add(chair);
    group.userData.collider = { width: 1.12, depth: 1.52, offsetZ: 0.24 };
    group.userData.allowAntiBlockRemoval = true;
    group.userData.layoutRole = 'student-desk';
    return group;
  }

  createTeacherDesk() {
    const group = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.13, 0.92), this.woodMaterial);
    top.position.y = 0.88;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x454b4c, roughness: 0.76, metalness: 0.2 });
    const leftCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.79, 0.76), cabinetMaterial);
    const rightCabinet = leftCabinet.clone();
    leftCabinet.position.set(-0.7, 0.41, 0);
    rightCabinet.position.set(0.7, 0.41, 0);
    leftCabinet.castShadow = true;
    rightCabinet.castShadow = true;
    group.add(leftCabinet, rightCabinet);

    for (let side of [-1, 1]) {
      for (let row = 0; row < 2; row += 1) {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 0.035), this.metalMaterial);
        handle.position.set(side * 0.7, 0.52 - row * 0.28, -0.397);
        group.add(handle);
      }
    }
    group.userData.collider = { width: 2.15, depth: 0.92 };
    group.userData.allowAntiBlockRemoval = true;
    group.userData.layoutRole = 'teacher-desk';
    return group;
  }

  createBlackboard(width = 3.6, label = 'MATÉRIA INTERROMPIDA') {
    const group = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.18, 1.62, 0.1), this.woodMaterial);
    frame.position.y = 1.9;
    group.add(frame);

    const board = new THREE.Mesh(new THREE.BoxGeometry(width, 1.44, 0.065), this.chalkboardMaterial);
    board.position.set(0, 1.9, -0.07);
    board.receiveShadow = true;
    group.add(board);

    const chalkMaterial = new THREE.MeshBasicMaterial({ color: 0xcbd2c7 });
    const lines = [
      { x: -0.75, y: 2.2, w: 1.8 },
      { x: 0.35, y: 1.9, w: 1.25 },
      { x: -0.2, y: 1.58, w: 2.1 }
    ];
    lines.forEach((line, index) => {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(line.w, 0.025 + index * 0.004), chalkMaterial);
      mark.position.set(line.x, line.y, -0.106);
      group.add(mark);
    });

    const labelTexture = createSignTexture(label, 'NÃO APAGAR');
    const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, opacity: 0.52 });
    const note = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.35), labelMaterial);
    note.position.set(width * 0.22, 2.28, -0.109);
    group.add(note);
    return group;
  }

  createBookshelf() {
    const group = new THREE.Group();
    const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3429, roughness: 0.88 });
    const sides = new THREE.BoxGeometry(0.1, 2.28, 0.52);
    const left = new THREE.Mesh(sides, shelfMaterial);
    const right = left.clone();
    left.position.set(-0.77, 1.14, 0);
    right.position.set(0.77, 1.14, 0);
    group.add(left, right);

    for (let level = 0; level < 5; level += 1) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.09, 0.54), shelfMaterial);
      shelf.position.y = 0.08 + level * 0.54;
      shelf.castShadow = true;
      group.add(shelf);

      if (level < 4) {
        let cursor = -0.68;
        for (let book = 0; book < 8; book += 1) {
          const width = 0.09 + seededRandom(level * 31 + book + 13) * 0.08;
          const height = 0.31 + seededRandom(level * 47 + book + 9) * 0.16;
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, 0.34),
            this.bookMaterials[(book + level) % this.bookMaterials.length]
          );
          mesh.position.set(cursor + width / 2, shelf.position.y + 0.09 + height / 2, -0.02);
          mesh.rotation.z = book === 6 ? 0.12 : 0;
          group.add(mesh);
          cursor += width + 0.025;
          if (cursor > 0.62) break;
        }
      }
    }
    group.userData.collider = { width: 1.62, depth: 0.54 };
    group.userData.allowAntiBlockRemoval = true;
    group.userData.layoutRole = 'bookshelf';
    return group;
  }

  createBulletinBoard(title = 'AVISOS') {
    const group = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.38, 0.09), this.woodMaterial);
    frame.position.y = 1.75;
    group.add(frame);
    const cork = new THREE.Mesh(
      new THREE.BoxGeometry(2.08, 1.2, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x8c6b48, roughness: 1 })
    );
    cork.position.set(0, 1.75, -0.07);
    group.add(cork);

    const colors = [0xd8d0b4, 0xb9c8d3, 0xc8b8a6, 0xb8c6af, 0xd2b5b5];
    for (let i = 0; i < 7; i += 1) {
      const note = new THREE.Mesh(
        new THREE.PlaneGeometry(0.34 + seededRandom(i + 2) * 0.22, 0.32 + seededRandom(i + 8) * 0.26),
        new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
      );
      note.position.set(-0.72 + (i % 3) * 0.68, 1.48 + Math.floor(i / 3) * 0.47, -0.096);
      note.rotation.z = (seededRandom(i + 50) - 0.5) * 0.16;
      group.add(note);
    }

    const titleTexture = createSignTexture(title, 'ESCOLA MUNICIPAL SANTA HELENA');
    const titleMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.34),
      new THREE.MeshBasicMaterial({ map: titleTexture })
    );
    titleMesh.position.set(0, 2.53, -0.11);
    group.add(titleMesh);
    return group;
  }

  createTrashBin() {
    const group = new THREE.Group();
    const bin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.27, 0.7, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x34474b, roughness: 0.72, metalness: 0.28, side: THREE.DoubleSide })
    );
    bin.position.y = 0.35;
    bin.castShadow = true;
    group.add(bin);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 7, 18), this.metalMaterial);
    rim.position.y = 0.7;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);
    group.userData.collider = { width: 0.66, depth: 0.66 };
    group.userData.allowAntiBlockRemoval = true;
    group.userData.layoutRole = 'trash-bin';
    return group;
  }

  createWaterFountain() {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x87989c, roughness: 0.38, metalness: 0.72 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.05, 0.55), bodyMaterial);
    body.position.y = 0.54;
    body.castShadow = true;
    group.add(body);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.3, 0.12, 22), bodyMaterial);
    basin.position.set(0, 1.08, -0.02);
    group.add(basin);
    const tap = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.026, 7, 14, Math.PI), this.metalMaterial);
    tap.position.set(0, 1.22, -0.04);
    tap.rotation.z = Math.PI / 2;
    group.add(tap);
    group.userData.collider = { width: 0.76, depth: 0.55 };
    group.userData.allowAntiBlockRemoval = true;
    group.userData.layoutRole = 'water-fountain';
    return group;
  }

  createFireExtinguisher() {
    const group = new THREE.Group();
    const red = new THREE.MeshStandardMaterial({ color: 0x9d2523, roughness: 0.42, metalness: 0.34 });
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.82, 18), red);
    cylinder.position.y = 0.47;
    cylinder.castShadow = true;
    group.add(cylinder);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.18, 14), this.metalMaterial);
    top.position.y = 0.96;
    group.add(top);
    const hose = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 6, 18, Math.PI * 1.35), this.blackMaterial);
    hose.position.set(0.16, 0.72, 0);
    hose.rotation.y = Math.PI / 2;
    group.add(hose);
    group.userData.collider = { width: 0.44, depth: 0.38 };
    return group;
  }

  createWallClock() {
    const group = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.08, 28), this.metalMaterial);
    frame.rotation.x = Math.PI / 2;
    group.add(frame);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 28),
      new THREE.MeshBasicMaterial({ color: 0xd8d7ca })
    );
    face.position.z = -0.045;
    group.add(face);
    const handMaterial = new THREE.MeshBasicMaterial({ color: 0x242728 });
    const hour = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.18, 0.012), handMaterial);
    hour.position.set(0.03, 0.07, -0.055);
    hour.rotation.z = -0.65;
    const minute = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.25, 0.012), handMaterial);
    minute.position.set(-0.06, 0.09, -0.057);
    minute.rotation.z = 0.48;
    group.add(hour, minute);
    return group;
  }

  createHallBench() {
    const group = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.13, 0.48), this.woodMaterial);
    seat.position.y = 0.56;
    seat.castShadow = true;
    group.add(seat);
    const legGeometry = new THREE.BoxGeometry(0.12, 0.55, 0.36);
    [-0.86, 0.86].forEach((x) => {
      const leg = new THREE.Mesh(legGeometry, this.metalMaterial);
      leg.position.set(x, 0.28, 0);
      leg.castShadow = true;
      group.add(leg);
    });
    group.userData.collider = { width: 2.35, depth: 0.48 };
    group.userData.allowAntiBlockRemoval = true;
    group.userData.layoutRole = 'bench';
    return group;
  }

  createOpenClassroomDoor(openDirection = 1) {
    const group = new THREE.Group();
    const openingWidth = 1.58;
    const doorWidth = 1.46;
    const doorHeight = 2.54;
    const wallDepth = 0.2;
    const sideFillWidth = (TILE - openingWidth) * 0.5;
    const topFillHeight = WALL_HEIGHT - doorHeight;

    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x2b3539, roughness: 0.58, metalness: 0.34 });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0xe4e7e8, roughness: 0.82, metalness: 0.04 });

    const sideGeometry = new THREE.BoxGeometry(sideFillWidth, WALL_HEIGHT, wallDepth);
    [-1, 1].forEach((side) => {
      const filler = new THREE.Mesh(sideGeometry, this.wallMaterial);
      filler.position.set(side * (openingWidth * 0.5 + sideFillWidth * 0.5), WALL_HEIGHT * 0.5, 0);
      filler.castShadow = true;
      filler.receiveShadow = true;
      group.add(filler);
    });

    const topFiller = new THREE.Mesh(new THREE.BoxGeometry(openingWidth, topFillHeight, wallDepth), this.wallMaterial);
    topFiller.position.set(0, doorHeight + topFillHeight * 0.5, 0);
    topFiller.castShadow = true;
    topFiller.receiveShadow = true;
    group.add(topFiller);

    const framePostGeometry = new THREE.BoxGeometry(0.08, doorHeight + 0.08, 0.14);
    [-1, 1].forEach((side) => {
      const post = new THREE.Mesh(framePostGeometry, frameMaterial);
      post.position.set(side * (openingWidth * 0.5 - 0.04), (doorHeight + 0.08) * 0.5, 0.02);
      post.castShadow = true;
      group.add(post);
    });

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(openingWidth, 0.08, 0.14), frameMaterial);
    frameTop.position.set(0, doorHeight + 0.04, 0.02);
    frameTop.castShadow = true;
    group.add(frameTop);

    const pivot = new THREE.Group();
    pivot.position.set(-doorWidth * 0.5, 0, 0.015);
    group.add(pivot);

    const door = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, 0.08), doorMaterial);
    door.position.set(doorWidth * 0.5, doorHeight * 0.5, 0);
    door.castShadow = true;
    door.receiveShadow = true;
    pivot.add(door);

    const glassFrame = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.02), frameMaterial);
    glassFrame.position.set(doorWidth * 0.5, 1.96, -0.033);
    pivot.add(glassFrame);
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.26),
      new THREE.MeshPhysicalMaterial({ color: 0xc7d7dc, transparent: true, opacity: 0.22, roughness: 0.2, side: THREE.DoubleSide })
    );
    glass.position.set(doorWidth * 0.5, 1.96, -0.05);
    pivot.add(glass);

    const handlePlate = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.01), this.metalMaterial);
    handlePlate.position.set(doorWidth - 0.13, 1.08, -0.045);
    pivot.add(handlePlate);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), this.metalMaterial);
    handle.position.set(doorWidth - 0.08, 1.08, -0.07);
    pivot.add(handle);

    const interaction = this.createInteractionVolume('door', 'Abrir porta', new THREE.Vector3(0, PLAYER_HEIGHT, 0), new THREE.Vector3(2.0, 2.6, 1.2));
    interaction.userData.doorRef = group;
    group.add(interaction);

    group.userData.pivot = pivot;
    group.userData.interaction = interaction;
    group.userData.openDirection = openDirection;
    group.userData.openAmount = 0;
    group.userData.targetOpen = 0;
    group.userData.collider = {
      width: doorWidth,
      depth: 0.16,
      offsetX: 0,
      offsetZ: 0,
      enabled: () => group.userData.openAmount < 0.7
    };
    return group;
  }

  registerPropCollider(group, collider = group.userData.collider) {
    if (!collider) return;
    this.propColliders.push({
      group,
      width: collider.width,
      depth: collider.depth,
      offsetX: collider.offsetX ?? 0,
      offsetZ: collider.offsetZ ?? 0,
      enabled: collider.enabled ?? (() => group.visible)
    });
  }

  circleIntersectsProp(x, z, radius, collider) {
    if (!collider.enabled()) return false;
    const group = collider.group;
    const scaleX = Math.abs(group.scale.x || 1);
    const scaleZ = Math.abs(group.scale.z || 1);
    const yaw = group.rotation.y;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const offsetX = collider.offsetX * scaleX;
    const offsetZ = collider.offsetZ * scaleZ;
    const centerX = group.position.x + cos * offsetX + sin * offsetZ;
    const centerZ = group.position.z - sin * offsetX + cos * offsetZ;
    const dx = x - centerX;
    const dz = z - centerZ;
    const localX = cos * dx - sin * dz;
    const localZ = sin * dx + cos * dz;
    const halfWidth = collider.width * scaleX * 0.5;
    const halfDepth = collider.depth * scaleZ * 0.5;
    const nearestX = clamp(localX, -halfWidth, halfWidth);
    const nearestZ = clamp(localZ, -halfDepth, halfDepth);
    const deltaX = localX - nearestX;
    const deltaZ = localZ - nearestZ;
    return deltaX * deltaX + deltaZ * deltaZ < radius * radius;
  }

  placeSchoolProp(group, cellX, cellZ, rotation = 0, offsetX = 0, offsetZ = 0, scale = 1) {
    const position = cellToWorld(cellX, cellZ, 0);
    group.position.set(position.x + offsetX, 0, position.z + offsetZ);
    group.rotation.y = rotation;
    group.scale.setScalar(scale);
    this.scene.add(group);
    this.schoolProps.push(group);
    this.registerPropCollider(group);
    return group;
  }

  placeAgainstWall(group, cellX, cellZ, preferredSide = 'south', scale = 1, gap = 0.04, lateralOffset = 0) {
    const mountSide = resolveWallMountSide(cellX, cellZ, preferredSide);
    const position = cellToWorld(cellX, cellZ, 0);
    const collider = group.userData.collider ?? { width: 0.8, depth: 0.6 };
    const objectDepth = (collider.depth ?? 0.6) * scale;
    const wallOffset = TILE * 0.475 - objectDepth * 0.5 - gap;
    group.position.set(position.x, 0, position.z);
    if (mountSide === 'north') {
      group.position.z -= wallOffset;
      group.position.x += lateralOffset;
      group.rotation.y = Math.PI;
    } else if (mountSide === 'south') {
      group.position.z += wallOffset;
      group.position.x += lateralOffset;
      group.rotation.y = 0;
    } else if (mountSide === 'east') {
      group.position.x += wallOffset;
      group.position.z += lateralOffset;
      group.rotation.y = Math.PI / 2;
    } else {
      group.position.x -= wallOffset;
      group.position.z += lateralOffset;
      group.rotation.y = -Math.PI / 2;
    }
    group.scale.setScalar(scale);
    group.userData.mountSide = mountSide;
    this.scene.add(group);
    this.schoolProps.push(group);
    this.registerPropCollider(group);
    return group;
  }

  placeWallProp(group, cellX, cellZ, side, height, scale = 1, lateralOffset = 0) {
    const mountSide = resolveWallMountSide(cellX, cellZ, side);
    const position = cellToWorld(cellX, cellZ, 0);
    const wallOffset = TILE * 0.475;
    group.position.set(position.x, height, position.z);
    if (mountSide === 'north') {
      group.position.z -= wallOffset;
      group.position.x += lateralOffset;
      group.rotation.y = Math.PI;
    } else if (mountSide === 'south') {
      group.position.z += wallOffset;
      group.position.x += lateralOffset;
      group.rotation.y = 0;
    } else if (mountSide === 'east') {
      group.position.x += wallOffset;
      group.position.z += lateralOffset;
      group.rotation.y = Math.PI / 2;
    } else {
      group.position.x -= wallOffset;
      group.position.z += lateralOffset;
      group.rotation.y = -Math.PI / 2;
    }
    group.scale.setScalar(scale);
    group.userData.mountSide = mountSide;
    this.scene.add(group);
    this.schoolProps.push(group);
    return group;
  }

  createSchoolEnvironment() {
    const chairMaterials = [this.bluePlasticMaterial, this.greenPlasticMaterial, this.redPlasticMaterial];
    const deskLayouts = [
      [2, 2, 0], [5, 2, 0], [2, 4, 0], [5, 4, 0],
      [10, 2, 0], [13, 2, 0], [16, 2, 0], [10, 4, 0], [14, 4, 0],
      [20, 2, Math.PI], [23, 2, Math.PI], [20, 4, Math.PI], [23, 4, Math.PI],
      [2, 7, 0], [5, 7, 0], [2, 9, 0], [6, 9, 0],
      [13, 7, 0], [16, 7, 0], [11, 9, 0], [15, 9, 0],
      [20, 7, Math.PI], [24, 7, Math.PI], [20, 9, Math.PI],
      [5, 12, Math.PI / 2], [10, 12, Math.PI / 2], [15, 12, Math.PI / 2],
      [21, 12, -Math.PI / 2], [24, 14, -Math.PI / 2],
      [2, 18, 0], [5, 18, 0], [10, 18, 0], [14, 18, 0], [17, 20, Math.PI]
    ];

    deskLayouts.forEach(([x, z, rotation], index) => {
      if (LEVEL[z]?.[x] !== '0') return;
      const desk = this.createStudentDesk(chairMaterials[index % chairMaterials.length]);
      this.placeSchoolProp(desk, x, z, rotation, 0, 0, 0.86);
    });

    const teacherDesks = [
      [6, 3, Math.PI / 2, -0.35, 0],
      [16, 3, -Math.PI / 2, 0.35, 0],
      [6, 8, Math.PI / 2, -0.35, 0],
      [16, 8, -Math.PI / 2, 0.35, 0],
      [24, 8, -Math.PI / 2, 0.25, 0],
      [7, 14, Math.PI / 2, -0.3, 0],
      [17, 14, -Math.PI / 2, 0.3, 0]
    ];
    teacherDesks.forEach(([x, z, rotation, ox, oz]) => {
      if (LEVEL[z]?.[x] === '0') this.placeSchoolProp(this.createTeacherDesk(), x, z, rotation, ox, oz, 0.86);
    });

    const blackboards = [
      [7, 2, 'east'], [17, 3, 'east'], [19, 3, 'west'],
      [7, 7, 'east'], [17, 8, 'east'], [19, 8, 'west'],
      [7, 14, 'north'], [17, 14, 'east']
    ];
    blackboards.forEach(([x, z, side], index) => {
      if (LEVEL[z]?.[x] === '0') {
        this.placeWallProp(this.createBlackboard(3.25, index === 3 ? 'SALA 13' : 'LIÇÃO DO DIA'), x, z, side, 0, 0.82);
      }
    });

    const bookshelves = [
      [9, 3, 'west'], [24, 3, 'east'],
      [1, 8, 'west'], [9, 8, 'west'],
      [24, 9, 'east'], [2, 14, 'north'],
      [15, 20, 'south']
    ];
    bookshelves.forEach(([x, z, side]) => {
      if (LEVEL[z]?.[x] === '0') this.placeAgainstWall(this.createBookshelf(), x, z, side, 0.86, 0.03);
    });

    const bulletinBoards = [
      [3, 1, 'north', 'AVISOS'], [12, 1, 'north', 'CALENDÁRIO'],
      [21, 1, 'north', 'TRABALHOS'], [3, 6, 'north', 'TURMA 31'],
      [13, 6, 'north', 'EVENTOS'], [22, 6, 'north', 'COMUNICADOS'],
      [6, 17, 'north', 'DESAPARECIDOS']
    ];
    bulletinBoards.forEach(([x, z, side, title]) => {
      if (LEVEL[z]?.[x] === '0') this.placeWallProp(this.createBulletinBoard(title), x, z, side, 0, 0.82);
    });

    const benches = [
      [4, 6, 'north'], [12, 11, 'west'],
      [20, 11, 'east'], [9, 17, 'north'],
      [20, 20, 'south']
    ];
    benches.forEach(([x, z, side]) => {
      if (LEVEL[z]?.[x] === '0') this.placeAgainstWall(this.createHallBench(), x, z, side, 0.88, 0.08);
    });

    const fountains = [[3, 11, 'west'], [24, 6, 'east']];
    fountains.forEach(([x, z, side]) => {
      if (LEVEL[z]?.[x] === '0') this.placeAgainstWall(this.createWaterFountain(), x, z, side, 0.9, 0.03);
    });

    const bins = [
      [7, 3, 'north'], [16, 4, 'south'], [23, 9, 'south'],
      [6, 15, 'south'], [15, 11, 'north'], [24, 18, 'east'], [2, 20, 'south']
    ];
    bins.forEach(([x, z, side]) => {
      if (LEVEL[z]?.[x] === '0') this.placeAgainstWall(this.createTrashBin(), x, z, side, 0.82, 0.08);
    });

    const extinguishers = [
      [4, 4, 'south'], [12, 9, 'south'], [21, 9, 'south'],
      [5, 17, 'north'], [19, 20, 'south']
    ];
    extinguishers.forEach(([x, z, side]) => {
      if (LEVEL[z]?.[x] === '0') {
        const extinguisher = this.createFireExtinguisher();
        const prop = this.placeWallProp(extinguisher, x, z, side, 0, 0.92);
        this.registerPropCollider(prop);
      }
    });

    const clocks = [
      [7, 4, 'east'], [17, 4, 'south'], [19, 9, 'west'], [8, 18, 'north']
    ];
    clocks.forEach(([x, z, side]) => {
      if (LEVEL[z]?.[x] === '0') this.placeWallProp(this.createWallClock(), x, z, side, 2.55, 0.9);
    });

    const extraFountains = [[1, 18, 'west'], [24, 17, 'east'], [24, 3, 'east']];
    extraFountains.forEach(([x, z, side]) => {
      if (LEVEL[z]?.[x] === '0') this.placeAgainstWall(this.createWaterFountain(), x, z, side, 0.88, 0.03);
    });

    const extraBins = [[1, 3, 'west'], [10, 20, 'south'], [18, 20, 'south'], [24, 11, 'east']];
    extraBins.forEach(([x, z, side]) => {
      if (LEVEL[z]?.[x] === '0') this.placeAgainstWall(this.createTrashBin(), x, z, side, 0.82, 0.08);
    });

    const extraExtinguishers = [[8, 1, 'north'], [18, 1, 'north'], [1, 14, 'west'], [23, 20, 'south']];
    extraExtinguishers.forEach(([x, z, side]) => {
      if (LEVEL[z]?.[x] === '0') {
        const extinguisher = this.createFireExtinguisher();
        const prop = this.placeWallProp(extinguisher, x, z, side, 0, 0.92);
        this.registerPropCollider(prop);
      }
    });

    const supplementalDesks = [
      [22, 2, Math.PI], [22, 4, Math.PI],
      [3, 8, 0], [22, 8, Math.PI],
      [12, 18, 0], [20, 18, Math.PI]
    ];
    supplementalDesks.forEach(([x, z, rotation], index) => {
      if (LEVEL[z]?.[x] !== '0') return;
      const desk = this.createStudentDesk(chairMaterials[(index + 1) % chairMaterials.length]);
      desk.scale.setScalar(0.78);
      this.placeSchoolProp(desk, x, z, rotation, 0, 0, 0.78);
    });

    CLASSROOM_DOOR_CELLS.forEach(([x, z], index) => {
      if (LEVEL[z]?.[x] !== '0') return;
      const openDirection = index % 2 === 0 ? 1 : -1;
      const door = this.createOpenClassroomDoor(openDirection);
      const position = cellToWorld(x, z, 0);
      door.position.copy(position);
      const leftWall = LEVEL[z]?.[x - 1] === '1';
      const rightWall = LEVEL[z]?.[x + 1] === '1';
      const northWall = LEVEL[z - 1]?.[x] === '1';
      const southWall = LEVEL[z + 1]?.[x] === '1';
      if (northWall && southWall && !(leftWall && rightWall)) {
        door.rotation.y = Math.PI / 2;
      }
      this.scene.add(door);
      this.schoolProps.push(door);
      this.registerPropCollider(door);
      this.classroomDoors.push(door);
      this.interactables.push(door.userData.interaction);
      this.raycastTargets.push(door.userData.interaction);
    });

    for (let i = 0; i < 34; i += 1) {
      const cellX = 1 + Math.floor(seededRandom(i + 1200) * (MAP_W - 2));
      const cellZ = 1 + Math.floor(seededRandom(i + 1400) * (MAP_H - 2));
      if (!isLayoutSafeCell(cellX, cellZ, 1)) continue;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.22 + seededRandom(i + 1500) * 0.2, 0.035, 0.3 + seededRandom(i + 1600) * 0.2),
        this.bookMaterials[i % this.bookMaterials.length]
      );
      book.position.copy(cellToWorld(cellX, cellZ, 0.04));
      book.position.x += (seededRandom(i + 1700) - 0.5) * 1.15;
      book.position.z += (seededRandom(i + 1800) - 0.5) * 1.15;
      book.rotation.y = seededRandom(i + 1900) * Math.PI;
      book.rotation.z = (seededRandom(i + 2000) - 0.5) * 0.08;
      book.castShadow = true;
      this.scene.add(book);
      this.schoolProps.push(book);
    }
  }

  createHideMarker(kind) {
    const marker = new THREE.Group();
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x79d9cd,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.57, 32), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.035;
    marker.add(ring);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(4, 16, 18, 0.82)';
    context.fillRect(8, 12, 496, 104);
    context.strokeStyle = 'rgba(121, 217, 205, 0.9)';
    context.lineWidth = 5;
    context.strokeRect(8, 12, 496, 104);
    context.fillStyle = '#bdeee7';
    context.font = '700 39px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const label = kind === 'locker' ? 'E  ARMÁRIO' : kind === 'table' ? 'E  SOB A MESA' : 'E  ESCURIDÃO';
    context.fillText(label, 256, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, depthTest: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2.25, 0.56, 1);
    sprite.position.y = kind === 'locker' ? 2.72 : kind === 'table' ? 1.42 : 1.1;
    marker.add(sprite);
    marker.userData.ring = ring;
    marker.userData.sprite = sprite;
    return marker;
  }

  createHideSpot(data, index) {
    const group = data.kind === 'locker' ? this.createLocker() : data.kind === 'table' ? this.createTable() : new THREE.Group();
    group.position.copy(cellToWorld(data.cellX, data.cellZ, 0));
    group.rotation.y = data.rotation ?? (seededRandom(index * 11 + 3) > 0.5 ? Math.PI / 2 : 0);
    group.userData.antiBlockKeep = true;

    if (data.kind === 'locker') {
      const distances = [
        { side: 'north', dx: 0, dz: -1 },
        { side: 'south', dx: 0, dz: 1 },
        { side: 'west', dx: -1, dz: 0 },
        { side: 'east', dx: 1, dz: 0 }
      ].map((entry) => {
        let steps = 0;
        let x = data.cellX;
        let z = data.cellZ;
        while (steps < 64) {
          x += entry.dx;
          z += entry.dz;
          steps += 1;
          if (!LEVEL[z] || LEVEL[z][x] === undefined || LEVEL[z][x] === '1') break;
        }
        return { side: entry.side, steps };
      }).sort((a, b) => a.steps - b.steps);

      const side = data.side ?? distances[0].side;
      const wallSurfaceOffset = TILE * 0.475;
      const lockerHalfDepth = 0.68 * 0.5;
      const wallOffset = wallSurfaceOffset - lockerHalfDepth - 0.01;
      if (side === 'north') {
        group.position.z -= wallOffset;
        group.rotation.y = Math.PI;
      } else if (side === 'south') {
        group.position.z += wallOffset;
        group.rotation.y = 0;
      } else if (side === 'west') {
        group.position.x -= wallOffset;
        group.rotation.y = -Math.PI / 2;
      } else {
        group.position.x += wallOffset;
        group.rotation.y = Math.PI / 2;
      }
    }

    if (data.kind === 'table') {
      const clothMaterial = new THREE.MeshStandardMaterial({ color: 0x172226, roughness: 0.96, side: THREE.DoubleSide });
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 0.58), clothMaterial);
      cloth.position.set(0, 0.61, 0.53);
      group.add(cloth);
    }

    if (data.kind === 'dark') {
      const dark = new THREE.Mesh(
        new THREE.CircleGeometry(1.35, 28),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6, depthWrite: false })
      );
      dark.rotation.x = -Math.PI / 2;
      dark.position.y = 0.015;
      group.add(dark);
    }

    const height = data.kind === 'table' ? 1.4 : 2.5;
    const interaction = this.createInteractionVolume(
      data.kind,
      data.kind === 'locker' ? 'Esconder no armário' : data.kind === 'table' ? 'Esconder sob a mesa' : 'Ocultar-se na escuridão',
      new THREE.Vector3(0, height / 2, 0),
      new THREE.Vector3(data.kind === 'table' ? 2.25 : 1.55, height, data.kind === 'table' ? 1.5 : 1.55)
    );
    interaction.userData.parentGroup = group;
    interaction.userData.spotData = data;
    interaction.userData.index = index;
    group.add(interaction);

    const marker = this.createHideMarker(data.kind);
    group.add(marker);
    interaction.userData.marker = marker;

    this.scene.add(group);
    this.registerPropCollider(group);
    this.hideMarkers.push({ interaction, marker, phase: index * 0.83 });
    this.interactables.push(interaction);
    this.raycastTargets.push(interaction);
    this.hideSpots.push(interaction);
  }

  createBreaker() {
    const group = new THREE.Group();
    group.position.copy(cellToWorld(OPERATIONS_ROOM_CELL.x, OPERATIONS_ROOM_CELL.z, BASEMENT_FLOOR_Y));
    group.position.x += TILE * 0.5 - 0.12;
    group.rotation.y = 0;

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.35, 0.9), this.metalMaterial);
    box.position.y = 1.45;
    box.castShadow = true;
    group.add(box);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.15, 0.72), new THREE.MeshStandardMaterial({ color: 0x252c2e, roughness: 0.65, metalness: 0.5 }));
    panel.position.set(-0.125, 1.45, 0);
    group.add(panel);

    this.breakerLightMaterial = this.redEmissiveMaterial.clone();
    const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), this.breakerLightMaterial);
    indicator.position.set(-0.15, 1.75, -0.22);
    group.add(indicator);

    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.08), new THREE.MeshStandardMaterial({ color: 0xc0c4bd, metalness: 0.75, roughness: 0.25 }));
    lever.position.set(-0.17, 1.35, 0.1);
    lever.rotation.z = -0.45;
    group.add(lever);

    const interaction = this.createInteractionVolume('breaker', 'Religar quadro elétrico', new THREE.Vector3(-0.55, 1.4, 0), new THREE.Vector3(1.5, 2.2, 1.6));
    interaction.userData.parentGroup = group;
    group.add(interaction);

    this.breaker = { group, interaction, lever };
    this.scene.add(group);
    group.userData.collider = { width: 0.26, depth: 0.95, offsetX: 0 };
    this.registerPropCollider(group);
    this.interactables.push(interaction);
    this.raycastTargets.push(interaction);
  }

  createClassroomClutter() {
    const deskCells = [
      [3, 7], [4, 8], [13, 3], [15, 3], [21, 4],
      [6, 14], [14, 12], [22, 12], [11, 18], [17, 18]
    ];
    deskCells.forEach(([x, z], index) => {
      if (LEVEL[z][x] !== '0') return;
      const table = this.createTable();
      table.scale.setScalar(0.78);
      table.position.copy(cellToWorld(x, z, 0));
      table.rotation.y = (index % 2) * Math.PI / 2;
      this.scene.add(table);
      this.registerPropCollider(table);
    });

    for (let i = 0; i < 16; i += 1) {
      const cellX = 1 + Math.floor(seededRandom(i + 201) * (MAP_W - 2));
      const cellZ = 1 + Math.floor(seededRandom(i + 401) * (MAP_H - 2));
      if (!isLayoutSafeCell(cellX, cellZ, 1)) continue;
      const debris = new THREE.Mesh(
        new THREE.BoxGeometry(0.12 + seededRandom(i + 1) * 0.35, 0.04 + seededRandom(i + 2) * 0.08, 0.12 + seededRandom(i + 3) * 0.4),
        new THREE.MeshStandardMaterial({ color: 0x302824, roughness: 0.95 })
      );
      debris.position.copy(cellToWorld(cellX, cellZ, 0.06));
      debris.position.x += (seededRandom(i + 4) - 0.5) * 1.1;
      debris.position.z += (seededRandom(i + 5) - 0.5) * 1.1;
      debris.rotation.set(0, seededRandom(i + 7) * Math.PI, (seededRandom(i + 8) - 0.5) * 0.18);
      debris.castShadow = true;
      this.scene.add(debris);
    }
  }

  createRain() {
    const count = 2300;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const point = randomExteriorRainPoint(Math.random() * 14);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      speeds[i] = 9 + Math.random() * 11;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.PointsMaterial({
      color: 0xaec8d4,
      size: 0.035,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.rain = new THREE.Points(geometry, material);
    this.rain.frustumCulled = false;
    this.scene.add(this.rain);
  }

  createMonster() {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.94 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.15, 6, 12), bodyMaterial);
    torso.position.y = 1.48;
    torso.scale.z = 0.72;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16), bodyMaterial);
    head.position.y = 2.53;
    head.scale.set(0.82, 1.23, 0.76);
    head.castShadow = true;
    group.add(head);

    const eyeMaterial = this.redEmissiveMaterial.clone();
    eyeMaterial.emissiveIntensity = 3.5;
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), eyeMaterial);
    const rightEye = leftEye.clone();
    leftEye.position.set(-0.095, 2.57, -0.245);
    rightEye.position.set(0.095, 2.57, -0.245);
    group.add(leftEye, rightEye);

    const limbGeometry = new THREE.CapsuleGeometry(0.105, 1.08, 5, 9);
    this.monsterLimbs = {};
    ['leftArm', 'rightArm', 'leftLeg', 'rightLeg'].forEach((name) => {
      const limb = new THREE.Mesh(limbGeometry, bodyMaterial);
      limb.castShadow = true;
      group.add(limb);
      this.monsterLimbs[name] = limb;
    });

    this.monsterLimbs.leftArm.position.set(-0.49, 1.55, 0);
    this.monsterLimbs.rightArm.position.set(0.49, 1.55, 0);
    this.monsterLimbs.leftLeg.position.set(-0.2, 0.48, 0);
    this.monsterLimbs.rightLeg.position.set(0.2, 0.48, 0);
    this.monsterLimbs.leftArm.rotation.z = -0.12;
    this.monsterLimbs.rightArm.rotation.z = 0.12;

    const spawn = cellToWorld(23, 18, 0);
    group.position.copy(spawn);
    group.rotation.y = Math.PI;
    group.traverse((child) => {
      if (child.isMesh) child.frustumCulled = true;
    });

    this.monster.group = group;
    this.monster.position = group.position;
    this.scene.add(group);
  }

  createLighting() {
    const ambient = new THREE.HemisphereLight(0xa7c1cc, 0x28302d, 0.62);
    this.scene.add(ambient);
    this.ambientLight = ambient;

    const fill = new THREE.AmbientLight(0x8299a3, 0.18);
    this.scene.add(fill);
    this.fillLight = fill;

    this.lightningLight = new THREE.DirectionalLight(0xc9e5ef, 0);
    this.lightningLight.position.set(-20, 35, -15);
    this.lightningLight.castShadow = false;
    this.scene.add(this.lightningLight);

    this.emergencyLights = this.emergencyLights ?? [];
    this.powerLights = this.powerLights ?? [];
    const positions = [
      [4, 4], [12, 4], [20, 4], [4, 9], [14, 9], [22, 9],
      [5, 15], [15, 15], [23, 15], [4, 18], [9, 20], [15, 20], [19, 20], [24, 20]
    ];

    positions.forEach(([x, z], index) => {
      if (LEVEL[z][x] !== '0') return;
      const isEmergency = index % 5 === 0;
      const fixtureMaterial = new THREE.MeshStandardMaterial({
        color: isEmergency ? 0x4b3636 : 0xb8c2c1,
        emissive: isEmergency ? 0x7c1b18 : 0x4a555a,
        emissiveIntensity: isEmergency ? 1.05 : 0.08,
        roughness: 0.48
      });
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 0.08, 0.32),
        fixtureMaterial
      );
      const position = cellToWorld(x, z, WALL_HEIGHT - 0.15);
      fixture.position.copy(position);
      fixture.rotation.x = Math.PI / 2;
      this.scene.add(fixture);

      const light = new THREE.PointLight(
        isEmergency ? 0xb9433c : 0xf3fbff,
        isEmergency ? 0.9 : 0,
        isEmergency ? 8.2 : 16,
        2
      );
      light.position.copy(position);
      light.position.y -= 0.3;
      light.castShadow = false;
      this.scene.add(light);
      const entry = { light, fixtureMaterial, phase: index * 1.7, base: isEmergency ? 0.9 : 2.85, isEmergency };
      if (isEmergency) this.emergencyLights.push(entry);
      else this.powerLights.push(entry);
    });

    const basementFixtures = [
      { x: 22.25, z: 18.85, y: BASEMENT_FLOOR_Y + 2.38, isEmergency: false, width: 1.2 },
      { x: 24.15, z: 18.85, y: BASEMENT_FLOOR_Y + 2.38, isEmergency: false, width: 1.2 },
      { x: 23.1, z: 20.05, y: BASEMENT_FLOOR_Y + 2.28, isEmergency: false, width: 1.0 },
      { x: 21.8, z: 20.0, y: BASEMENT_FLOOR_Y + 2.2, isEmergency: true, width: 0.85 }
    ];
    basementFixtures.forEach((entry, index) => {
      const fixtureMaterial = new THREE.MeshStandardMaterial({
        color: entry.isEmergency ? 0x4b3636 : 0xb8c2c1,
        emissive: entry.isEmergency ? 0x7c1b18 : 0x4a555a,
        emissiveIntensity: entry.isEmergency ? 1.05 : 0.08,
        roughness: 0.48
      });
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(entry.width, 0.08, 0.28), fixtureMaterial);
      fixture.rotation.x = Math.PI / 2;
      fixture.position.copy(cellToWorld(entry.x, entry.z, entry.y));
      this.scene.add(fixture);
      const light = new THREE.PointLight(entry.isEmergency ? 0xb9433c : 0xf3fbff, entry.isEmergency ? 0.9 : 0, entry.isEmergency ? 7.5 : 11.5, 2);
      light.position.copy(fixture.position);
      light.position.y -= 0.28;
      this.scene.add(light);
      const lightEntry = { light, fixtureMaterial, phase: 31 + index * 1.4, base: entry.isEmergency ? 0.8 : 2.35, isEmergency: entry.isEmergency };
      if (entry.isEmergency) this.emergencyLights.push(lightEntry);
      else this.powerLights.push(lightEntry);
    });

    this.flashlight = new THREE.SpotLight(0xe2f1f4, 11.5, 25, THREE.MathUtils.degToRad(28), 0.38, 1.15);
    this.flashlight.position.set(0.13, -0.12, -0.05);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.set(768, 768);
    this.flashlight.shadow.camera.near = 0.1;
    this.flashlight.shadow.camera.far = 22;
    this.flashlight.shadow.bias = -0.0004;

    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, -0.05, -6);
    this.cameraFillLight = new THREE.PointLight(0x7f9eaa, 0.32, 5.5, 2);
    this.cameraFillLight.position.set(0, 0.15, 0.15);
    this.camera.add(this.cameraFillLight);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.camera);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('blur', () => this.clearMovementKeys());

    document.addEventListener('keydown', (event) => {
      this.keys.add(event.code);
      if (event.code === 'KeyE' && !event.repeat) this.interact();
      if (event.code === 'KeyF' && !event.repeat) this.toggleFlashlight();
      if (event.code === 'KeyM' && !event.repeat) {
        event.preventDefault();
        this.toggleMapScreen();
      }
    });

    document.addEventListener('keyup', (event) => this.keys.delete(event.code));

    ui.startButton.addEventListener('click', async () => {
      await this.audio.start();
      this.debugMode = Boolean(ui.debugToggle?.checked);
      this.applyDebugMode();
      this.started = true;
      this.paused = false;
      ui.startScreen.classList.remove('visible');
      ui.hud.classList.remove('hidden');
      this.controls.lock(true);
      this.renderMap();
      this.showMessage(this.debugMode ? 'MODO DEBUG: criatura desativada.' : 'A escola está silenciosa demais.', 3.4);
    });

    ui.resumeButton.addEventListener('click', async () => {
      await this.audio.start();
      this.controls.lock(true);
    });

    ui.closeClue.addEventListener('click', () => {
      this.modalOpen = false;
      ui.clueScreen.classList.remove('visible');
      this.controls.lock(true);
    });

    ui.closeMap?.addEventListener('click', () => this.toggleMapScreen(false));

    ui.part2Button?.addEventListener('click', () => {
      window.location.href = './part2.html';
    });

    ui.restartButton.addEventListener('click', async () => {
      await this.audio.start();
      this.reset();
      ui.endScreen.classList.remove('visible');
      ui.hud.classList.remove('hidden');
      ui.endPhoto.style.display = 'none';
      this.started = true;
      this.paused = false;
      this.controls.lock(true);
    });

    this.renderer.domElement.addEventListener('click', () => {
      if (this.started && !this.modalOpen && !this.ended && !this.controls.isLocked) {
        this.controls.lock(true);
      }
    });
  }

  reset() {
    this.ended = false;
    this.modalOpen = false;
    this.mapOpen = false;
    this.basementHintShown = false;
    this.paused = !this.started;
    this.elapsed = 0;
    this.messageTimer = 0;
    this.thunderTimer = 6 + Math.random() * 9;
    this.lightning = 0;
    this.powerLightLevel = 0;

    Object.assign(this.player, {
      battery: 100,
      batteryReserves: 0,
      stamina: 100,
      noise: 0,
      clues: 0,
      hasMap: true,
      flashlightOn: true,
      hidden: false,
      hideSpot: null,
      powerOn: false,
      bobTime: 0,
      baseY: PLAYER_HEIGHT
    });
    this.player.velocity.set(0, 0, 0);

    const start = cellToWorld(START.cellX, START.cellZ, PLAYER_HEIGHT);
    this.camera.position.copy(start);
    this.camera.rotation.set(0, START.yaw, 0);

    Object.assign(this.monster, {
      state: 'patrol',
      alert: 0,
      target: cellToWorld(23, 18, 0),
      lastSeen: null,
      path: [],
      pathTimer: 0,
      wanderTimer: 0,
      stepTimer: 0,
      animationTime: 0,
      seenLastFrame: false,
      pursuitActive: false
    });
    this.monster.group.position.copy(cellToWorld(23, 18, 0));

    this.activeClues.forEach((item) => {
      item.userData.active = true;
      item.userData.parentGroup.visible = true;
    });
    this.activeBatteries.forEach((item) => {
      item.userData.active = true;
      item.userData.parentGroup.visible = true;
    });

    if (this.mapPickup) {
      this.mapPickup.userData.active = true;
      if (this.mapPickup.userData.mapPaper) this.mapPickup.userData.mapPaper.visible = true;
      if (this.mapPickup.userData.parentGroup) this.mapPickup.userData.parentGroup.visible = true;
    }

    this.playerInBasement = false;
    this.descentSequenceTimer = 0;
    this.mapState.unlocked = true;
    this.mapState.discoveredCells = new Set();
    this.mapState.discoveredPois = new Set(['entrada']);
    ui.mapScreen.classList.remove('visible');
    ui.endPhoto.style.display = 'none';
    ui.endKicker.textContent = 'Fim da tentativa';
    ui.endSequel.textContent = '';
    if (ui.part2Button) ui.part2Button.hidden = true;

    this.breaker.lever.rotation.z = -0.45;
    this.breakerLightMaterial.color.set(0x350505);
    this.breakerLightMaterial.emissive.set(0xaa0505);
    this.breakerLightMaterial.emissiveIntensity = 2.6;
    this.applyPowerLighting(0);
    this.exitDoor.userData.openAmount = 0;
    this.exitDoor.userData.doorMesh.position.y = this.exitDoor.userData.baseDoorY;
    this.exitDoor.userData.doorMesh.visible = true;
    this.exitDoor.userData.lamp.material = this.redEmissiveMaterial;
    this.classroomDoors.forEach((door) => {
      door.userData.openAmount = 0;
      door.userData.targetOpen = 0;
      door.userData.pivot.rotation.y = 0;
      door.userData.interaction.userData.label = 'Abrir porta';
    });

    this.applyDebugMode();
    this.flashlight.visible = true;
    this.discoverMapAroundPlayer();
    this.updateObjective();
    this.updateHud();
    this.renderMap();
  }

  applyDebugMode() {
    if (!this.monster?.group) return;
    this.monster.group.visible = !this.debugMode;
    if (this.debugMode) {
      this.monster.state = 'disabled';
      this.monster.alert = 0;
      this.monster.path = [];
      this.monster.target = null;
      this.monster.lastSeen = null;
      this.monster.seenLastFrame = false;
      this.monster.pursuitActive = false;
      ui.pursuit.classList.remove('visible', 'seen');
      ui.pursuitBar.style.width = '0%';
      ui.danger.style.opacity = '0';
    } else if (this.monster.state === 'disabled') {
      this.monster.state = 'patrol';
      this.monster.target = cellToWorld(23, 18, 0);
      this.monster.wanderTimer = 0;
      this.monster.pathTimer = 0;
    }
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  clearMovementKeys() {
    this.keys.clear();
    this.player.velocity.set(0, 0, 0);
  }

  isBlockedWorld(x, z, radius = PLAYER_RADIUS, includeProps = true) {
    const samples = [
      [x - radius, z - radius], [x + radius, z - radius],
      [x - radius, z + radius], [x + radius, z + radius],
      [x, z - radius], [x, z + radius], [x - radius, z], [x + radius, z]
    ];

    const blockedByWall = samples.some(([sampleX, sampleZ]) => {
      const cell = worldToCell(sampleX, sampleZ);
      if (cell.x < 0 || cell.z < 0 || cell.x >= MAP_W || cell.z >= MAP_H) return true;
      const value = LEVEL[cell.z][cell.x];
      if (value === '1') {
        if (cell.x === EXIT_CELL.x && cell.z === 0 && this.exitDoor) {
          const exitCenter = this.exitDoor.position;
          const halfOpening = this.exitDoor.userData.openingWidth * 0.5 - 0.04;
          const openingZ = exitCenter.z - TILE * 0.5;
          if (Math.abs(sampleX - exitCenter.x) <= halfOpening && Math.abs(sampleZ - openingZ) <= 0.42) {
            return false;
          }
        }
        return true;
      }
      return false;
    });
    if (blockedByWall) return true;
    if (this.isBlockedByStairArchitecture(x, z, radius)) return true;
    if (!includeProps) return false;
    return this.propColliders.some((collider) => this.circleIntersectsProp(x, z, radius, collider));
  }

  moveWithCollision(object, deltaX, deltaZ, radius) {
    const nextX = object.position.x + deltaX;
    const nextZ = object.position.z + deltaZ;
    const includeProps = object !== this.monster.group;
    if (!this.isBlockedWorld(nextX, object.position.z, radius, includeProps)) object.position.x = nextX;
    if (!this.isBlockedWorld(object.position.x, nextZ, radius, includeProps)) object.position.z = nextZ;
  }

  updatePlayer(delta) {
    if (this.player.hidden) {
      this.player.noise = Math.max(0, this.player.noise - delta * 90);
      this.camera.position.y += (this.player.baseY - this.camera.position.y) * Math.min(1, delta * 8);
      return;
    }

    const forwardInput = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const rightInput = Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'));
    const hasMovement = forwardInput !== 0 || rightInput !== 0;
    const running = hasMovement && (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && this.player.stamina > 0.5;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();

    const direction = new THREE.Vector3()
      .addScaledVector(forward, forwardInput)
      .addScaledVector(right, rightInput);
    if (direction.lengthSq() > 0) direction.normalize();

    const targetSpeed = running ? 5.45 : 3.05;
    const targetVelocity = direction.multiplyScalar(targetSpeed);
    const acceleration = hasMovement ? 13 : 18;
    this.player.velocity.lerp(targetVelocity, 1 - Math.exp(-acceleration * delta));

    this.moveWithCollision(
      this.camera,
      this.player.velocity.x * delta,
      this.player.velocity.z * delta,
      PLAYER_RADIUS
    );
    this.constrainPlayerOnStairs();

    const bounds = this.getBasementBounds();
    const inStairBand = Math.abs(this.camera.position.z - bounds.walkLaneCenterZ) <= bounds.stairHalfDepth;
    if (!this.playerInBasement && inStairBand && this.camera.position.x >= bounds.stairStartX + 0.52) this.playerInBasement = true;
    if (this.playerInBasement && inStairBand && this.camera.position.x <= bounds.stairStartX + 0.02) this.playerInBasement = false;

    const groundY = this.getGroundHeight(this.camera.position.x, this.camera.position.z, true);
    this.player.baseY = groundY + PLAYER_HEIGHT;
    if (groundY < -0.15 && !this.basementHintShown) {
      this.basementHintShown = true;
      this.descentSequenceTimer = 2.6;
      this.markPoiDiscovered('quadro');
      this.audio.alert();
      this.audio.noise(0.8, 0.05, 950);
      window.setTimeout(() => this.audio.tone(132, 0.22, 0.05, 'sawtooth', 92), 110);
      this.showMessage('Você desceu para o subterrâneo. A sala de operações fica logo adiante.', 2.8);
    }

    if (hasMovement) {
      this.player.bobTime += delta * (running ? 12.5 : 7.4);
      const bob = Math.sin(this.player.bobTime) * (running ? 0.055 : 0.032);
      const sway = Math.cos(this.player.bobTime * 0.5) * (running ? 0.024 : 0.014);
      this.camera.position.y += (this.player.baseY + bob - this.camera.position.y) * Math.min(1, delta * 18);
      this.flashlight.position.x = 0.13 + sway;

      this.player.noise = clamp(this.player.noise + delta * (running ? 105 : 27), 0, 100);
      this.audio.stepCooldown -= delta;
      if (this.audio.stepCooldown <= 0) {
        this.audio.footstep(running);
        this.audio.stepCooldown = running ? 0.28 : 0.47;
      }

      if (running) {
        this.player.stamina = Math.max(0, this.player.stamina - delta * 24);
        if (this.distanceToMonster() < 11) this.investigatePlayerNoise();
      } else {
        this.player.stamina = Math.min(100, this.player.stamina + delta * 9);
      }
    } else {
      this.camera.position.y += (this.player.baseY - this.camera.position.y) * Math.min(1, delta * 10);
      this.player.noise = Math.max(0, this.player.noise - delta * 72);
      this.player.stamina = Math.min(100, this.player.stamina + delta * 17);
      this.audio.stepCooldown = Math.max(0, this.audio.stepCooldown - delta);
    }

    if (this.player.flashlightOn) {
      this.player.battery = Math.max(0, this.player.battery - delta * 0.92);
      if (this.player.battery <= 0) {
        if (!this.useBatteryReserve(true)) {
          this.player.flashlightOn = false;
          this.flashlight.visible = false;
          this.audio.switchClick(false);
          this.showMessage('A lanterna apagou. Encontre pilhas.', 3);
        }
      }
    }
  }

  investigatePlayerNoise() {
    if (this.debugMode || this.monster.state === 'chase') return;
    this.monster.state = 'investigate';
    this.monster.target = this.camera.position.clone().setY(0);
    this.monster.alert = Math.max(this.monster.alert, 38);
    this.monster.pathTimer = 0;
  }

  distanceToMonster() {
    const dx = this.camera.position.x - this.monster.group.position.x;
    const dz = this.camera.position.z - this.monster.group.position.z;
    return Math.hypot(dx, dz);
  }

  lineClearWorld(from, to) {
    const distance = from.distanceTo(to);
    const steps = Math.ceil(distance / 0.22);
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const x = THREE.MathUtils.lerp(from.x, to.x, t);
      const z = THREE.MathUtils.lerp(from.z, to.z, t);
      const cell = worldToCell(x, z);
      if (cell.x < 0 || cell.z < 0 || cell.x >= MAP_W || cell.z >= MAP_H) return false;
      if (LEVEL[cell.z][cell.x] === '1') return false;
      if (cell.x === EXIT_CELL.x && cell.z === EXIT_CELL.z && !this.player.powerOn) return false;
    }
    return true;
  }

  canMonsterSeePlayer() {
    if (this.debugMode || this.player.hidden) return false;
    const distance = this.distanceToMonster();
    const visionDistance = this.player.flashlightOn ? 17.5 : 11.2;
    if (distance > visionDistance) return false;

    const monsterForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.monster.group.quaternion).normalize();
    const toPlayer = this.camera.position.clone().sub(this.monster.group.position).setY(0).normalize();
    const angle = Math.acos(clamp(monsterForward.dot(toPlayer), -1, 1));
    const halfFov = this.monster.state === 'chase' ? Math.PI * 0.68 : Math.PI * 0.4;
    if (angle > halfFov) return false;

    return this.lineClearWorld(this.monster.group.position, this.camera.position);
  }

  getRandomFloorTarget() {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const x = 1 + Math.floor(Math.random() * (MAP_W - 2));
      const z = 1 + Math.floor(Math.random() * (MAP_H - 2));
      if (LEVEL[z][x] !== '0') continue;
      const target = cellToWorld(x, z, 0);
      if (target.distanceTo(this.monster.group.position) > TILE * 3) return target;
    }
    return cellToWorld(23, 18, 0);
  }

  findPath(startWorld, targetWorld) {
    const start = worldToCell(startWorld.x, startWorld.z);
    const goal = worldToCell(targetWorld.x, targetWorld.z);
    const queue = [start];
    const visited = new Map();
    visited.set(`${start.x},${start.z}`, null);
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current.x === goal.x && current.z === goal.z) break;
      for (const [dx, dz] of directions) {
        const next = { x: current.x + dx, z: current.z + dz };
        const key = `${next.x},${next.z}`;
        if (next.x < 0 || next.z < 0 || next.x >= MAP_W || next.z >= MAP_H) continue;
        if (visited.has(key)) continue;
        if (LEVEL[next.z][next.x] === '1') continue;
        if (next.x === EXIT_CELL.x && next.z === EXIT_CELL.z && !this.player.powerOn) continue;
        visited.set(key, current);
        queue.push(next);
      }
    }

    const goalKey = `${goal.x},${goal.z}`;
    if (!visited.has(goalKey)) return [];
    const path = [];
    let current = goal;
    while (current) {
      path.push(cellToWorld(current.x, current.z, 0));
      current = visited.get(`${current.x},${current.z}`);
    }
    path.reverse();
    return path.slice(1);
  }

  updateMonster(delta) {
    if (this.debugMode) return;
    this.monster.animationTime += delta;
    this.monster.pathTimer -= delta;
    this.monster.wanderTimer -= delta;
    this.monster.stepTimer -= delta;

    const seesPlayer = this.canMonsterSeePlayer();
    if (seesPlayer) {
      if (!this.monster.seenLastFrame) {
        this.audio.alert();
        this.showMessage('CORRA. ELE VIU VOCÊ.', 2.25);
      }
      this.monster.seenLastFrame = true;
      this.monster.pursuitActive = true;
      this.monster.state = 'chase';
      this.monster.alert = 100;
      this.monster.lastSeen = this.camera.position.clone().setY(0);
      this.monster.target = this.monster.lastSeen.clone();
      this.monster.pathTimer = 0;
    } else {
      this.monster.seenLastFrame = false;
      if (this.monster.state === 'chase') {
        this.monster.alert = Math.max(0, this.monster.alert - delta * 10);
        if (this.monster.lastSeen) this.monster.target = this.monster.lastSeen.clone();
        if (this.monster.alert <= 0 || this.monster.group.position.distanceTo(this.monster.target) < 0.7) {
          this.monster.state = 'investigate';
          this.monster.alert = 35;
          this.monster.wanderTimer = 4;
        }
      } else if (this.monster.state === 'investigate') {
        this.monster.alert = Math.max(0, this.monster.alert - delta * 7);
        if (!this.monster.target || this.monster.group.position.distanceTo(this.monster.target) < 0.7 || this.monster.alert <= 0) {
          this.monster.state = 'patrol';
          this.monster.pursuitActive = false;
          this.monster.target = this.getRandomFloorTarget();
          this.monster.wanderTimer = 7 + Math.random() * 7;
          this.monster.pathTimer = 0;
        }
      } else if (!this.monster.target || this.monster.wanderTimer <= 0 || this.monster.group.position.distanceTo(this.monster.target) < 0.8) {
        this.monster.target = this.getRandomFloorTarget();
        this.monster.wanderTimer = 7 + Math.random() * 8;
        this.monster.pathTimer = 0;
      }
    }

    if (this.monster.state === 'chase') {
      this.monster.target = this.camera.position.clone().setY(0);
    }

    if (this.monster.pathTimer <= 0 && this.monster.target) {
      this.monster.path = this.findPath(this.monster.group.position, this.monster.target);
      this.monster.pathTimer = this.monster.state === 'chase' ? 0.2 : 0.65;
    }

    let moving = false;
    if (this.monster.path.length > 0) {
      const node = this.monster.path[0];
      const direction = node.clone().sub(this.monster.group.position).setY(0);
      const distance = direction.length();
      if (distance < 0.16) {
        this.monster.path.shift();
      } else {
        direction.normalize();
        const speed = this.monster.state === 'chase' ? 4.25 : this.monster.state === 'investigate' ? 2.55 : 1.7;
        this.moveWithCollision(this.monster.group, direction.x * speed * delta, direction.z * speed * delta, MONSTER_RADIUS);
        const targetYaw = Math.atan2(-direction.x, -direction.z);
        this.monster.group.rotation.y += angleDifference(targetYaw, this.monster.group.rotation.y) * Math.min(1, delta * 7);
        moving = true;

        if (this.monster.stepTimer <= 0 && this.distanceToMonster() < 13) {
          this.audio.noise(0.06, this.monster.state === 'chase' ? 0.075 : 0.035, 150);
          this.monster.stepTimer = this.monster.state === 'chase' ? 0.31 : 0.52;
        }
      }
    }

    this.animateMonster(moving);
    const distance = this.distanceToMonster();

    if (this.player.hidden && this.player.hideSpot && distance < 1.25) {
      const enteredSeen = this.player.hideSpot.userData.enteredSeen;
      if (enteredSeen || Math.random() < delta * 0.028) {
        this.lose('A criatura abriu o esconderijo.');
      }
    } else if (!this.player.hidden && distance < 0.78 && this.lineClearWorld(this.monster.group.position, this.camera.position)) {
      this.lose('A criatura alcançou você no corredor.');
    }

    this.audio.heartbeatCooldown -= delta;
    if (distance < 9 && this.audio.heartbeatCooldown <= 0) {
      const intensity = 1 - clamp(distance / 9, 0, 1);
      this.audio.heartbeat(intensity);
      this.audio.heartbeatCooldown = 1 - intensity * 0.55;
    }
  }

  animateMonster(moving) {
    const speedFactor = this.monster.state === 'chase' ? 9 : 5;
    const swing = moving ? Math.sin(this.monster.animationTime * speedFactor) : Math.sin(this.monster.animationTime * 1.4) * 0.12;
    this.monsterLimbs.leftArm.rotation.x = swing * 0.62;
    this.monsterLimbs.rightArm.rotation.x = -swing * 0.62;
    this.monsterLimbs.leftLeg.rotation.x = -swing * 0.46;
    this.monsterLimbs.rightLeg.rotation.x = swing * 0.46;
    const groundY = this.getGroundHeight(this.monster.group.position.x, this.monster.group.position.z, false);
    this.monster.group.position.y = groundY + (moving ? Math.abs(Math.sin(this.monster.animationTime * speedFactor)) * 0.055 : 0);
  }

  updateRain(delta) {
    const positions = this.rain.geometry.attributes.position.array;
    const speeds = this.rain.geometry.attributes.speed.array;
    for (let i = 0; i < speeds.length; i += 1) {
      const offset = i * 3;
      positions[offset + 1] -= speeds[i] * delta;
      positions[offset] -= delta * 1.15;
      if (positions[offset + 1] < 0 || isInsideSchoolFootprint(positions[offset], positions[offset + 2], 0.9)) {
        const point = randomExteriorRainPoint(11 + Math.random() * 4);
        positions[offset] = point.x;
        positions[offset + 1] = point.y;
        positions[offset + 2] = point.z;
      }
    }
    this.rain.geometry.attributes.position.needsUpdate = true;
  }

  updateEnvironment(delta) {
    this.thunderTimer -= delta;
    this.lightning = Math.max(0, this.lightning - delta * 2.9);
    if (this.thunderTimer <= 0) {
      this.lightning = 1;
      this.audio.thunder();
      this.thunderTimer = 11 + Math.random() * 20;
    }
    this.lightningLight.intensity = this.lightning * 4.6;
    this.renderer.toneMappingExposure = 1.08 + this.lightning * 0.32;
    this.windowGlassMaterials.forEach((material) => {
      material.emissiveIntensity = 0.22 + this.lightning * 1.45;
      material.opacity = 0.36 + this.lightning * 0.12;
    });
    this.windowBackdropMaterials.forEach((material) => {
      material.opacity = 0.84 + this.lightning * 0.08;
    });
    this.windowEyeMaterials.forEach((entry) => {
      entry.timer -= delta;
      if (entry.visible > 0) {
        entry.visible -= delta;
        entry.material.opacity = 0.28 + Math.max(0, Math.sin(this.elapsed * 12)) * 0.22 + this.lightning * 0.18;
      } else {
        entry.material.opacity = 0;
        if (entry.timer <= 0) {
          entry.visible = 0.55 + Math.random() * 0.75;
          entry.timer = 7 + Math.random() * 14;
        }
      }
    });
    this.outdoorLightningMaterials.forEach((material) => {
      material.opacity = this.lightning * 0.5;
    });

    const emergencyBaseLevel = this.player.powerOn ? 0.42 : 1;
    this.emergencyLights.forEach(({ light, phase, base }) => {
      const randomFlicker = Math.sin(this.elapsed * 9 + phase) > 0.965 ? 0.58 : 1;
      light.intensity = base * emergencyBaseLevel * (0.92 + Math.sin(this.elapsed * 1.7 + phase) * 0.06) * randomFlicker;
    });

    const targetPower = this.player.powerOn ? 1 : 0;
    const previousPowerLevel = this.powerLightLevel;
    const nextPowerLevel = THREE.MathUtils.damp(previousPowerLevel, targetPower, this.player.powerOn ? 5.8 : 3.2, delta);
    this.applyPowerLighting(nextPowerLevel);
    if (this.player.powerOn && previousPowerLevel < 0.9 && nextPowerLevel >= 0.9) {
      this.showMessage('As luzes fluorescentes da escola acenderam.', 2.4);
    }

    if (this.descentSequenceTimer > 0) this.descentSequenceTimer = Math.max(0, this.descentSequenceTimer - delta);
    const inBasement = this.playerInBasement || this.player.baseY - PLAYER_HEIGHT < -0.08;
    const fogBoost = this.descentSequenceTimer > 0 ? 0.006 + Math.abs(Math.sin(this.elapsed * 18)) * 0.005 : 0;
    const targetFogDensity = (inBasement ? 0.041 : 0.027) + fogBoost;
    this.scene.fog.density = THREE.MathUtils.damp(this.scene.fog.density, targetFogDensity, 3.6, delta);
    this.bloomPass.strength = 0.22 + (this.descentSequenceTimer > 0 ? 0.11 * (0.55 + Math.abs(Math.sin(this.elapsed * 14))) : 0);
    this.renderer.toneMappingExposure += (inBasement ? 0.04 : 0) + (this.descentSequenceTimer > 0 ? 0.12 * (0.55 + Math.abs(Math.sin(this.elapsed * 14))) : 0);
    this.basementFogPlanes.forEach(({ mesh, material, baseOpacity, phase }) => {
      material.opacity = baseOpacity * (inBasement ? 1.25 : 0.85) * (0.82 + Math.sin(this.elapsed * 0.95 + phase) * 0.16);
      mesh.rotation.z = Math.sin(this.elapsed * 0.22 + phase) * 0.06;
      const scalePulse = 1 + Math.sin(this.elapsed * 0.62 + phase) * 0.03;
      mesh.scale.set(scalePulse, scalePulse, 1);
    });

    const lowBatteryFlicker = this.player.battery < 18 && Math.random() < 0.045 ? 0.08 : 1;
    this.flashlight.intensity = 11.5 * lowBatteryFlicker;
    this.flashlight.visible = this.player.flashlightOn && !this.player.hidden;
    ui.flashlightVignette.style.opacity = this.player.flashlightOn && !this.player.hidden ? String(0.38 + (1 - lowBatteryFlicker) * 0.25) : '0.76';

    if (this.player.powerOn) {
      this.exitDoor.userData.openAmount = Math.min(1, this.exitDoor.userData.openAmount + delta * 0.68);
      const eased = THREE.MathUtils.smoothstep(this.exitDoor.userData.openAmount, 0, 1);
      this.exitDoor.userData.doorMesh.position.y = this.exitDoor.userData.baseDoorY + eased * this.exitDoor.userData.openRise;
      if (eased > 0.98) this.exitDoor.userData.doorMesh.visible = false;
    }

    this.classroomDoors.forEach((door) => {
      const next = THREE.MathUtils.damp(door.userData.openAmount, door.userData.targetOpen, 8, delta);
      door.userData.openAmount = next;
      door.userData.pivot.rotation.y = door.userData.openDirection * next * Math.PI * 0.5;
    });

    this.hideMarkers.forEach(({ interaction, marker, phase }) => {
      const world = new THREE.Vector3();
      interaction.getWorldPosition(world);
      const distance = world.distanceTo(this.camera.position);
      const visible = interaction.userData.active && !this.player.hidden && distance < 12.5 && this.lineClearWorld(this.camera.position, world);
      marker.visible = visible;
      if (!visible) return;
      const proximity = 1 - clamp((distance - 1.5) / 9, 0, 1);
      const pulse = 0.72 + Math.sin(this.elapsed * 3.2 + phase) * 0.18;
      marker.userData.ring.material.opacity = (0.22 + proximity * 0.48) * pulse;
      marker.userData.sprite.material.opacity = 0.25 + proximity * 0.72;
      marker.userData.ring.rotation.z += delta * 0.42;
    });

    this.animatedObjects.forEach((entry) => {
      if (!entry.object.visible) return;
      entry.object.position.y = entry.baseY + Math.sin(this.elapsed * 2 + entry.phase) * entry.amplitude;
      if (entry.type === 'rotate') entry.object.rotation.y += delta * 0.55;
    });

    if (this.messageTimer > 0) {
      this.messageTimer -= delta;
      if (this.messageTimer <= 0) ui.message.classList.remove('visible');
    }
  }

  updateInteraction() {
    if (this.player.hidden) {
      this.nearInteractable = this.player.hideSpot;
      this.setPrompt('[E] Sair do esconderijo');
      return;
    }

    this.raycaster.setFromCamera(this.centerNdc, this.camera);
    this.raycaster.far = INTERACT_DISTANCE;
    const hits = this.raycaster.intersectObjects(this.raycastTargets, false);
    let target = hits.find((hit) => hit.object.userData.active && hit.object.visible)?.object ?? null;

    if (!target) {
      let nearestDistance = INTERACT_DISTANCE * 0.8;
      for (const item of this.interactables) {
        if (!item.userData.active || !item.visible) continue;
        const world = new THREE.Vector3();
        item.getWorldPosition(world);
        const distance = world.distanceTo(this.camera.position);
        if (distance < nearestDistance) {
          target = item;
          nearestDistance = distance;
        }
      }
    }

    this.nearInteractable = target;
    if (target?.userData.type === 'breaker') this.markPoiDiscovered('quadro');
    if (target?.userData.type === 'exit') this.markPoiDiscovered('saida');
    if (target?.userData.type === 'schoolMap') this.markPoiDiscovered('mapa');
    if (target?.userData.type === 'clue') this.markPoiDiscovered(`pista-${target.userData.index + 1}`);
    if (target?.userData.type === 'door') {
      const label = target.userData.doorRef?.userData.targetOpen > 0.5 ? 'Fechar porta' : 'Abrir porta';
      this.setPrompt(`[E] ${label}`);
    } else {
      this.setPrompt(target ? `[E] ${target.userData.label}` : '');
    }
  }

  interact() {
    if (!this.started || this.paused || this.modalOpen || this.ended) return;

    if (this.player.hidden) {
      this.exitHideSpot();
      return;
    }

    const target = this.nearInteractable;
    if (!target || !target.userData.active) return;

    switch (target.userData.type) {
      case 'clue':
        this.collectClue(target);
        break;
      case 'battery':
        this.collectBattery(target);
        break;
      case 'schoolMap':
        this.collectSchoolMap(target);
        break;
      case 'breaker':
        this.useBreaker();
        break;
      case 'exit':
        if (this.player.powerOn && this.exitDoor.userData.openAmount > 0.7) this.win();
        else this.showMessage('A porta magnética continua sem energia.', 2.2);
        break;
      case 'jammedDoor':
        this.audio.noise(0.08, 0.018, 900);
        this.audio.tone(96, 0.12, 0.03, 'square');
        this.showMessage('A porta de entrada está emperrada.', 1.9);
        break;
      case 'blockedStairsUp':
        this.audio.noise(0.12, 0.02, 700);
        this.showMessage('A escada para o andar superior está bloqueada por escombros. Não há como subir agora.', 2.5);
        break;
      case 'stairsDown':
        this.markPoiDiscovered('quadro');
        this.showMessage('A escada desce para a sala de operações. O quadro de energia está logo adiante.', 2.5);
        break;
      case 'door': {
        const door = target.userData.doorRef;
        door.userData.targetOpen = door.userData.targetOpen > 0.5 ? 0 : 1;
        target.userData.label = door.userData.targetOpen > 0.5 ? 'Fechar porta' : 'Abrir porta';
        this.audio.tone(door.userData.targetOpen > 0.5 ? 185 : 135, 0.07, 0.03, 'square');
        this.audio.noise(0.06, 0.015, 1000);
        break;
      }
      case 'locker':
      case 'table':
      case 'dark':
        this.enterHideSpot(target);
        break;
      default:
        break;
    }
  }

  collectClue(target) {
    target.userData.active = false;
    target.userData.parentGroup.visible = false;
    this.player.clues += 1;
    this.markPoiDiscovered(`pista-${target.userData.index + 1}`);
    this.audio.pickup();
    this.modalOpen = true;
    this.paused = true;
    this.controls.unlock();
    ui.pauseScreen.classList.remove('visible');
    ui.clueTitle.textContent = target.userData.data.title;
    ui.clueBody.textContent = target.userData.data.body;
    ui.clueScreen.classList.add('visible');
    this.updateObjective();
    this.renderMap();
  }

  collectSchoolMap(target) {
    target.userData.active = false;
    if (target.userData.mapPaper) target.userData.mapPaper.visible = false;
    this.player.hasMap = true;
    this.mapState.unlocked = true;
    this.discoverMapAroundPlayer();
    this.markPoiDiscovered('mapa');
    this.audio.pickup();
    this.showMessage('Você encontrou o mapa da escola. Pressione M para acompanhar a exploração.', 3.2);
    this.updateObjective();
    this.renderMap();
  }

  collectBattery(target) {
    target.userData.active = false;
    target.userData.parentGroup.visible = false;
    this.player.batteryReserves += 1;
    this.audio.pickup();
    this.showMessage(`Pilha guardada na reserva. Total: ${this.player.batteryReserves}.`, 2.2);
  }

  useBreaker() {
    if (this.player.clues < CLUES.length) {
      this.audio.tone(88, 0.18, 0.05, 'square');
      this.showMessage('O quadro está bloqueado por uma senha de quatro partes.', 2.8);
      return;
    }
    if (this.player.powerOn) {
      this.showMessage('O quadro já está ligado.', 1.6);
      return;
    }

    this.player.powerOn = true;
    this.markPoiDiscovered('quadro');
    this.breaker.lever.rotation.z = 0.42;
    this.breakerLightMaterial.color.set(0x164927);
    this.breakerLightMaterial.emissive.set(0x22cc62);
    this.breakerLightMaterial.emissiveIntensity = 2.2;
    this.exitDoor.userData.lamp.material = new THREE.MeshStandardMaterial({
      color: 0x164927,
      emissive: 0x22cc62,
      emissiveIntensity: 2.4
    });
    this.audio.tone(58, 0.55, 0.12, 'sawtooth', 170);
    this.applyPowerLighting(0.22);
    window.setTimeout(() => this.applyPowerLighting(0.55), 180);
    window.setTimeout(() => this.applyPowerLighting(0.82), 360);
    window.setTimeout(() => this.applyPowerLighting(1), 620);
    window.setTimeout(() => this.audio.tone(240, 0.2, 0.08, 'square'), 420);
    this.showMessage('Energia restaurada. As luzes da escola foram acesas e a saída norte foi liberada.', 3.5);
    if (!this.debugMode) {
      this.monster.state = 'chase';
      this.monster.alert = 82;
      this.monster.target = this.camera.position.clone().setY(0);
      this.monster.pathTimer = 0;
    }
    this.updateObjective();
  }

  enterHideSpot(target) {
    const spotWorld = new THREE.Vector3();
    target.getWorldPosition(spotWorld);
    const wasSeen = this.monster.state === 'chase' && this.canMonsterSeePlayer();
    target.userData.enteredSeen = wasSeen;
    this.player.hidden = true;
    this.player.hideSpot = target;
    this.player.flashlightOn = false;
    this.flashlight.visible = false;
    this.player.noise = 0;

    const kind = target.userData.type;
    const localOffsetY = kind === 'table' ? 0.58 : kind === 'locker' ? 1.28 : 0.86;
    const offsetY = this.getGroundHeight(spotWorld.x, spotWorld.z, true) + localOffsetY;
    this.camera.position.set(spotWorld.x, offsetY, spotWorld.z);
    this.player.baseY = offsetY;
    this.audio.tone(120, 0.2, 0.04, 'triangle', 65);
    this.showMessage(
      kind === 'table' ? 'Você se escondeu embaixo da mesa.' : kind === 'locker' ? 'Você entrou no armário.' : 'Você se ocultou na escuridão.',
      2
    );
    ui.hiddenState.classList.add('visible');
  }

  exitHideSpot() {
    const spot = this.player.hideSpot;
    const world = new THREE.Vector3();
    spot.getWorldPosition(world);
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const possibleOffsets = [
      cameraDirection.clone().multiplyScalar(1.2),
      cameraDirection.clone().negate().multiplyScalar(1.2),
      new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x).multiplyScalar(1.2),
      new THREE.Vector3(cameraDirection.z, 0, -cameraDirection.x).multiplyScalar(1.2)
    ];

    let exitPosition = null;
    for (const offset of possibleOffsets) {
      const candidate = world.clone().add(offset);
      if (!this.isBlockedWorld(candidate.x, candidate.z, PLAYER_RADIUS)) {
        exitPosition = candidate;
        break;
      }
    }

    if (!exitPosition) exitPosition = world.clone();
    const exitY = this.getGroundHeight(exitPosition.x, exitPosition.z, true) + PLAYER_HEIGHT;
    this.camera.position.set(exitPosition.x, exitY, exitPosition.z);
    this.player.baseY = exitY;
    this.player.hidden = false;
    this.player.hideSpot = null;
    this.audio.tone(155, 0.12, 0.03, 'triangle');
    this.showMessage('Você saiu do esconderijo.', 1.5);
    ui.hiddenState.classList.remove('visible');
  }

  useBatteryReserve(autoUse = false) {
    if (this.player.batteryReserves <= 0) return false;
    this.player.batteryReserves -= 1;
    this.player.battery = 100;
    this.player.flashlightOn = true;
    this.flashlight.visible = !this.player.hidden;
    this.audio.switchClick(true);
    this.showMessage(autoUse ? 'Lanterna recarregada automaticamente com uma pilha reserva.' : 'Você recarregou a lanterna com uma pilha reserva.', 2.2);
    return true;
  }

  toggleFlashlight() {
    if (!this.started || this.paused || this.modalOpen || this.ended || this.player.hidden) return;
    if (!this.player.flashlightOn && this.player.battery <= 0) {
      if (this.useBatteryReserve(false)) return;
      this.showMessage('Sem carga. Encontre pilhas.', 1.8);
      this.audio.tone(72, 0.16, 0.05, 'square');
      return;
    }
    this.player.flashlightOn = !this.player.flashlightOn;
    this.flashlight.visible = this.player.flashlightOn;
    this.audio.switchClick(this.player.flashlightOn);
  }

  updateObjective() {
    if (this.player.clues < CLUES.length) {
      ui.objective.textContent = `Encontre pistas sobre o desaparecimento (${this.player.clues}/${CLUES.length}).`;
    } else if (!this.player.powerOn) {
      ui.objective.textContent = 'Religue o quadro elétrico na ala sudeste.';
    } else {
      ui.objective.textContent = 'A porta magnética está aberta. Alcance a saída norte.';
    }
  }

  applyPowerLighting(level = this.powerLightLevel) {
    const clampedLevel = clamp(level, 0, 1);
    this.powerLightLevel = clampedLevel;
    this.powerLights.forEach(({ light, fixtureMaterial, phase, base }) => {
      const pulse = clampedLevel > 0 ? 0.97 + Math.sin(this.elapsed * 1.8 + phase) * 0.03 : 1;
      light.intensity = base * clampedLevel * pulse;
      fixtureMaterial.emissiveIntensity = 0.08 + clampedLevel * 1.75;
    });
    if (this.fillLight) this.fillLight.intensity = 0.18 + clampedLevel * 0.45;
    if (this.ambientLight) this.ambientLight.intensity = 0.62 + clampedLevel * 0.28;
    this.cameraFillLight.intensity = 0.32 + clampedLevel * 0.18;
    this.renderer.toneMappingExposure = 1.12 + clampedLevel * 0.3;
  }

  findGridPathCells(startCell, goalCell) {
    const queue = [startCell];
    const visited = new Map();
    visited.set(`${startCell.x},${startCell.z}`, null);
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current.x === goalCell.x && current.z === goalCell.z) break;
      for (const [dx, dz] of directions) {
        const next = { x: current.x + dx, z: current.z + dz };
        const key = `${next.x},${next.z}`;
        if (next.x < 0 || next.z < 0 || next.x >= MAP_W || next.z >= MAP_H) continue;
        if (visited.has(key)) continue;
        if (LEVEL[next.z][next.x] === '1') continue;
        visited.set(key, current);
        queue.push(next);
      }
    }

    const goalKey = `${goalCell.x},${goalCell.z}`;
    if (!visited.has(goalKey)) return [];
    const path = [];
    let current = goalCell;
    while (current) {
      path.push(current);
      current = visited.get(`${current.x},${current.z}`);
    }
    return path.reverse();
  }

  buildCriticalRouteSet() {
    const startCell = { x: START.cellX, z: START.cellZ };
    const targets = [
      { x: ENTRANCE_CELL.x, z: ENTRANCE_CELL.z },
      { x: EXIT_CELL.x, z: EXIT_CELL.z },
      { x: OPERATIONS_ROOM_CELL.x, z: OPERATIONS_ROOM_CELL.z },
      ...CLUES.map(({ cellX, cellZ }) => ({ x: cellX, z: cellZ })),
      ...BATTERIES.map(({ cellX, cellZ }) => ({ x: cellX, z: cellZ })),
      ...HIDE_SPOTS.map(({ cellX, cellZ }) => ({ x: cellX, z: cellZ })),
      ...CLASSROOM_DOOR_CELLS.map(([x, z]) => ({ x, z }))
    ];
    const protectedCells = new Set();
    const addCell = (x, z) => {
      if (x < 0 || z < 0 || x >= MAP_W || z >= MAP_H) return;
      if (LEVEL[z][x] === '1') return;
      protectedCells.add(`${x},${z}`);
    };

    targets.forEach((target) => {
      this.findGridPathCells(startCell, target).forEach(({ x, z }) => {
        addCell(x, z);
        addCell(x + 1, z);
        addCell(x - 1, z);
        addCell(x, z + 1);
        addCell(x, z - 1);
      });
    });

    [startCell, { x: ENTRANCE_CELL.x, z: ENTRANCE_CELL.z }, { x: EXIT_CELL.x, z: EXIT_CELL.z }, { x: 24, z: 19 }].forEach(({ x, z }) => {
      for (let dz = -1; dz <= 1; dz += 1) {
        for (let dx = -1; dx <= 1; dx += 1) addCell(x + dx, z + dz);
      }
    });
    return protectedCells;
  }

  runAntiBlockageCheck() {
    const protectedCells = this.buildCriticalRouteSet();
    const removedRoles = [];
    this.propColliders = this.propColliders.filter((collider) => {
      const group = collider.group;
      if (!group?.userData?.allowAntiBlockRemoval || group.userData.antiBlockKeep) return true;
      const { x, z } = worldToCell(group.position.x, group.position.z);
      const key = `${x},${z}`;
      if (!protectedCells.has(key)) return true;
      removedRoles.push(group.userData.layoutRole || 'prop');
      if (group.parent) group.parent.remove(group);
      this.schoolProps = this.schoolProps.filter((item) => item !== group);
      return false;
    });
    this.antiBlockSummary = removedRoles;
    if (removedRoles.length > 0) console.info(`[anti-block] ${removedRoles.length} objetos removidos da rota principal.`, removedRoles);
  }

  markPoiDiscovered(id) {
    if (!id || this.mapState.discoveredPois.has(id)) return;
    this.mapState.discoveredPois.add(id);
    this.renderMap();
  }

  discoverMapAroundPlayer(radius = 2) {
    if (!this.player.hasMap) return;
    const { x: cellX, z: cellZ } = worldToCell(this.camera.position.x, this.camera.position.z);
    for (let dz = -radius; dz <= radius; dz += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const mapX = cellX + dx;
        const mapZ = cellZ + dz;
        if (mapX < 0 || mapZ < 0 || mapX >= MAP_W || mapZ >= MAP_H) continue;
        if (Math.hypot(dx, dz) > radius + 0.35) continue;
        this.mapState.discoveredCells.add(`${mapX},${mapZ}`);
      }
    }

    this.mapPoiDefinitions.forEach((poi) => {
      const world = cellToWorld(poi.cellX, poi.cellZ, 0);
      if (world.distanceTo(this.camera.position) <= TILE * 2.7) this.markPoiDiscovered(poi.id);
    });
  }

  refreshMapLegend() {
    if (!ui.mapLegend) return;
    const entries = this.mapPoiDefinitions.filter((poi) => this.mapState.discoveredPois.has(poi.id));
    ui.mapLegend.innerHTML = entries.length
      ? entries.map((poi) => `<div class="map-legend-item"><span class="map-legend-swatch" style="background:${poi.color}"></span><span>${poi.label}</span></div>`).join('')
      : '<div class="map-legend-item"><span>Nenhum ponto de interesse descoberto ainda.</span></div>';
  }

  drawMapToCanvas(canvas, isFullMap = false) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#091116';
    ctx.fillRect(0, 0, width, height);

    const padding = isFullMap ? 18 : 10;
    const cellSize = Math.floor(Math.min((width - padding * 2) / MAP_W, (height - padding * 2) / MAP_H));
    const originX = Math.floor((width - cellSize * MAP_W) / 2);
    const originY = Math.floor((height - cellSize * MAP_H) / 2);
    const playerCell = worldToCell(this.camera.position.x, this.camera.position.z);

    for (let z = 0; z < MAP_H; z += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        const key = `${x},${z}`;
        const explored = this.mapState.discoveredCells.has(key);
        const px = originX + x * cellSize;
        const py = originY + z * cellSize;

        ctx.fillStyle = explored
          ? LEVEL[z][x] === '1' ? '#6c7a82' : '#bcc8cb'
          : isFullMap ? '#121c21' : '#0b1317';
        ctx.fillRect(px, py, cellSize, cellSize);
        if (!explored && !isFullMap) continue;
        ctx.strokeStyle = explored ? 'rgba(0,0,0,0.18)' : 'rgba(160,180,190,0.05)';
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
    }

    this.mapPoiDefinitions.forEach((poi) => {
      if (!this.mapState.discoveredPois.has(poi.id)) return;
      const key = `${poi.cellX},${poi.cellZ}`;
      if (!this.mapState.discoveredCells.has(key) && !isFullMap) return;
      const px = originX + poi.cellX * cellSize + cellSize * 0.5;
      const py = originY + poi.cellZ * cellSize + cellSize * 0.5;
      ctx.fillStyle = poi.color;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(2.5, cellSize * 0.28), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(7, 11, 14, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    if (this.player.hasMap) {
      const centerX = originX + playerCell.x * cellSize + cellSize * 0.5;
      const centerY = originY + playerCell.z * cellSize + cellSize * 0.5;
      const yaw = this.camera.rotation.y;
      const size = Math.max(4, cellSize * 0.48);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-yaw);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.72, size * 0.9);
      ctx.lineTo(0, size * 0.45);
      ctx.lineTo(-size * 0.72, size * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  renderMap() {
    if (!ui.mapHint) return;
    ui.mapHint.textContent = 'Exploração ativa · tecla M';
    this.refreshMapLegend();
    this.drawMapToCanvas(ui.minimap, false);
    this.drawMapToCanvas(ui.mapCanvas, true);
  }

  toggleMapScreen(forceState = null) {
    if (!this.started || this.ended) return;
    const shouldOpen = forceState == null ? !this.mapOpen : forceState;
    if (shouldOpen) {
      if (ui.clueScreen.classList.contains('visible')) return;
      this.mapOpen = true;
      this.modalOpen = true;
      this.paused = true;
      this.controls.unlock();
      ui.pauseScreen.classList.remove('visible');
      ui.mapScreen.classList.add('visible');
      this.renderMap();
      return;
    }

    if (!this.mapOpen) return;
    this.mapOpen = false;
    this.basementHintShown = false;
    this.modalOpen = false;
    ui.mapScreen.classList.remove('visible');
    this.controls.lock(true);
  }

  updateHud() {
    const battery = clamp(this.player.battery, 0, 100);
    const stamina = clamp(this.player.stamina, 0, 100);
    const noise = clamp(this.player.noise, 0, 100);
    ui.batteryBar.style.width = `${battery}%`;
    ui.batteryValue.textContent = `${Math.round(battery)} · ${this.player.batteryReserves}R`;
    ui.staminaBar.style.width = `${stamina}%`;
    ui.staminaValue.textContent = String(Math.round(stamina));
    ui.noiseBar.style.width = `${noise}%`;
    ui.noiseValue.textContent = String(Math.round(noise));
    ui.status.textContent = `${this.debugMode ? 'DEBUG · SEM INIMIGOS · ' : ''}Pistas: ${this.player.clues}/${CLUES.length} · Reserva: ${this.player.batteryReserves} ${this.player.batteryReserves === 1 ? 'carga' : 'cargas'} · Lanterna ${this.player.flashlightOn ? 'ligada' : 'desligada'} · Mapa ${this.player.hasMap ? 'ativo' : 'indisponível'}${!this.debugMode && this.monster.seenLastFrame ? ' · ELE ESTÁ VENDO VOCÊ' : ''}`;
    const pursuitVisible = !this.debugMode && this.monster.pursuitActive && (this.monster.state === 'chase' || this.monster.state === 'investigate');
    const pursuitValue = this.monster.seenLastFrame ? 100 : clamp(this.monster.alert, 0, 100);
    ui.pursuit.classList.toggle('visible', pursuitVisible);
    ui.pursuit.classList.toggle('seen', this.monster.seenLastFrame);
    ui.pursuitBar.style.width = `${pursuitValue}%`;
    ui.pursuitStatus.textContent = this.monster.seenLastFrame
      ? 'À VISTA — CORRA'
      : this.monster.state === 'chase'
        ? 'SEGUINDO SEU RASTRO'
        : 'PROCURANDO VOCÊ';
    ui.danger.style.opacity = !this.debugMode && this.monster.state === 'chase'
      ? String(0.48 + Math.sin(this.elapsed * 8) * 0.1)
      : String(clamp(this.monster.alert / 240, 0, 0.35));
  }

  showMessage(text, duration = 2.4) {
    ui.message.textContent = text;
    ui.message.classList.add('visible');
    this.messageTimer = duration;
  }

  setPrompt(text) {
    ui.prompt.textContent = text;
    ui.prompt.classList.toggle('visible', Boolean(text));
  }

  lose(reason) {
    if (this.ended) return;
    this.ended = true;
    this.paused = true;
    this.controls.unlock();
    ui.pauseScreen.classList.remove('visible');
    this.audio.alert();
    ui.endKicker.textContent = 'Fim da tentativa';
    ui.endTitle.textContent = 'VOCÊ FOI ENCONTRADO';
    ui.endTitle.style.color = '#b83d3d';
    ui.endPhoto.style.display = 'none';
    ui.endText.textContent = `${reason} Pistas recuperadas: ${this.player.clues}/${CLUES.length}.`;
    ui.endSequel.textContent = '';
    if (ui.part2Button) ui.part2Button.hidden = true;
    ui.endScreen.classList.add('visible');
  }

  win() {
    if (this.ended) return;
    this.ended = true;
    this.paused = true;
    this.controls.unlock();
    ui.pauseScreen.classList.remove('visible');
    this.audio.tone(220, 0.6, 0.09, 'triangle', 440);
    window.setTimeout(() => this.audio.tone(440, 0.8, 0.065, 'sine'), 440);
    ui.endKicker.textContent = 'Fim da primeira parte';
    ui.endTitle.textContent = 'VOCÊ ESCAPOU';
    ui.endTitle.style.color = '#d5e1e5';
    ui.endPhoto.style.display = 'block';
    ui.endText.textContent = 'A foto escapou do bolso quando você alcançou o portão. Segurando aquele rosto outra vez, você sussurra: “Espere por mim, Sydney... eu vou encontrar você.” O silêncio responde, mas o sinal não morreu — ele apenas mudou de lugar.';
    ui.endSequel.textContent = 'Continua... a escola terminou, mas a busca por Sydney está só começando.';
    if (ui.part2Button) ui.part2Button.hidden = false;
    ui.endScreen.classList.add('visible');
  }

  adaptPerformance(delta) {
    this.adaptiveTimer += delta;
    this.frameSamples.push(delta);
    if (this.adaptiveTimer < 4 || this.frameSamples.length < 120) return;

    const average = this.frameSamples.reduce((sum, value) => sum + value, 0) / this.frameSamples.length;
    const fps = 1 / average;
    let nextRatio = this.pixelRatio;
    if (fps < 44 && this.pixelRatio > 0.8) nextRatio = Math.max(0.8, this.pixelRatio - 0.15);
    if (fps > 57 && this.pixelRatio < Math.min(window.devicePixelRatio, 1.5)) nextRatio = Math.min(Math.min(window.devicePixelRatio, 1.5), this.pixelRatio + 0.1);

    if (Math.abs(nextRatio - this.pixelRatio) > 0.01) {
      this.pixelRatio = nextRatio;
      this.renderer.setPixelRatio(this.pixelRatio);
      this.composer.setPixelRatio(this.pixelRatio);
      this.resize();
    }

    this.frameSamples.length = 0;
    this.adaptiveTimer = 0;
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    if (this.started && !this.paused && !this.modalOpen && !this.ended) {
      this.elapsed += delta;
      this.updatePlayer(delta);
      this.discoverMapAroundPlayer();
      if (!this.debugMode) this.updateMonster(delta);
      this.updateRain(delta);
      this.updateEnvironment(delta);
      this.updateInteraction();
      this.updateHud();
      this.renderMap();
      this.adaptPerformance(delta);
    } else {
      this.updateRain(delta * 0.3);
      this.updateEnvironment(delta * 0.25);
    }
    this.composer.render(delta);
  }
}

try {
  if (!document.createElement('canvas').getContext('webgl2')) {
    throw new Error('WebGL 2 não está disponível neste navegador.');
  }
  new Game();
} catch (error) {
  console.error(error);
  ui.loading.textContent = error instanceof Error ? error.message : 'Não foi possível iniciar o jogo.';
  ui.loading.classList.add('visible');
}
function createWindowViewTexture(seed = 1, withEyes = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#091017');
  grad.addColorStop(0.55, '#0e171f');
  grad.addColorStop(1, '#121d24');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // distant fog bands
  for (let i = 0; i < 7; i += 1) {
    ctx.fillStyle = `rgba(180, 205, 215, ${0.025 + i * 0.006})`;
    ctx.fillRect(0, 90 + i * 70, canvas.width, 48 + i * 10);
  }

  // tree silhouettes
  for (let i = 0; i < 8; i += 1) {
    const x = canvas.width * (0.08 + ((i * 97 + seed * 17) % 100) / 100 * 0.84);
    const h = 150 + (((i * 53 + seed * 31) % 100) / 100) * 200;
    ctx.fillStyle = 'rgba(10, 14, 17, 0.95)';
    ctx.fillRect(x, canvas.height - h - 40, 8, h);
    ctx.strokeStyle = 'rgba(8, 12, 15, 0.95)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 4, canvas.height - h - 10);
    ctx.lineTo(x - 28, canvas.height - h + 50);
    ctx.moveTo(x + 4, canvas.height - h + 20);
    ctx.lineTo(x + 36, canvas.height - h + 80);
    ctx.moveTo(x + 4, canvas.height - h + 70);
    ctx.lineTo(x - 32, canvas.height - h + 130);
    ctx.stroke();
  }

  // rain streaks
  ctx.strokeStyle = 'rgba(180, 210, 230, 0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 42; i += 1) {
    const x = ((i * 37 + seed * 13) % 100) / 100 * canvas.width;
    const y = ((i * 19 + seed * 29) % 100) / 100 * canvas.height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 28);
    ctx.stroke();
  }

  // near fog
  for (let i = 0; i < 10; i += 1) {
    const x = ((i * 43 + seed * 5) % 100) / 100 * canvas.width;
    const y = 150 + (((i * 71 + seed * 11) % 100) / 100) * 500;
    const r = 80 + (((i * 23 + seed * 7) % 100) / 100) * 130;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(205, 220, 228, 0.10)');
    g.addColorStop(1, 'rgba(205, 220, 228, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (withEyes) {
    const eyesY = 280 + ((seed * 37) % 180);
    const eyesX = 170 + ((seed * 61) % 170);
    const sep = 24;
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(255,0,0,0.9)';
    ctx.fillStyle = 'rgba(255,40,40,0.98)';
    ctx.beginPath();
    ctx.ellipse(eyesX, eyesY, 8, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(eyesX + sep, eyesY + 1, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}


