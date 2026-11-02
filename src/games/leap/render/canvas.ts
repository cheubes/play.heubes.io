import { fitCellSize } from '../../shell/dom';
import { CELL_SIZE, ROOM_SIZE } from '../logic/types';

const MAX_CELL_SIZE = 48;
const ROOM_EXTENT = CELL_SIZE * ROOM_SIZE;

// Center and radius as shares of the room side; turn: duration of one turn in ms, negative counterclockwise.
export const BACKDROP_GEARS = [
  { x: 0.28, y: 0.32, radius: 0.24, teeth: 14, turn: 90_000 },
  { x: 0.78, y: 0.74, radius: 0.18, teeth: 11, turn: -70_000 },
] as const;

export interface RoomLayers {
  element: HTMLElement;
  gears: CanvasRenderingContext2D[];
  stage: HTMLElement;
  decor: CanvasRenderingContext2D;
  scene: CanvasRenderingContext2D;
  indicator: HTMLElement;
}

function createLayer(parent: HTMLElement, className: string): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  parent.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Leap needs a 2D canvas.');
  }
  return context;
}

export function createRoomLayers(): RoomLayers {
  const element = document.createElement('div');
  element.className = 'leap-room';
  const gears = BACKDROP_GEARS.map((gear) => {
    const context = createLayer(element, 'leap-gear');
    const { style } = context.canvas;
    style.left = `${(gear.x - gear.radius) * 100}%`;
    style.top = `${(gear.y - gear.radius) * 100}%`;
    style.width = `${gear.radius * 200}%`;
    style.height = `${gear.radius * 200}%`;
    return context;
  });
  const stage = document.createElement('div');
  stage.className = 'leap-stage';
  element.append(stage);
  const decor = createLayer(stage, 'leap-layer');
  const scene = createLayer(stage, 'leap-layer');
  const indicator = document.createElement('p');
  indicator.className = 'leap-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  element.append(indicator);
  return { element, gears, stage, decor, scene, indicator };
}

function sizeCanvas(context: CanvasRenderingContext2D, size: number, pixelsPerUnit: number): void {
  context.canvas.width = Math.round(size * window.devicePixelRatio);
  context.canvas.height = Math.round(size * window.devicePixelRatio);
  context.setTransform(pixelsPerUnit, 0, 0, pixelsPerUnit, 0, 0);
}

// Every layer draws in simulation units: one cell is CELL_SIZE units, whatever its size on screen.
export function fitRoomLayers(container: HTMLElement, layers: RoomLayers): void {
  const cellSize = fitCellSize(container, ROOM_SIZE, ROOM_SIZE, MAX_CELL_SIZE);
  const size = cellSize * ROOM_SIZE;
  const pixelsPerUnit = (cellSize * window.devicePixelRatio) / CELL_SIZE;
  layers.element.style.width = `${size}px`;
  layers.element.style.height = `${size}px`;
  sizeCanvas(layers.decor, size, pixelsPerUnit);
  sizeCanvas(layers.scene, size, pixelsPerUnit);
  layers.gears.forEach((context, index) => {
    sizeCanvas(context, size * (BACKDROP_GEARS[index]?.radius ?? 0) * 2, pixelsPerUnit);
  });
}

// A still copy of the stage, which slides out while the next room slides in.
export function snapshotStage(layers: RoomLayers): HTMLCanvasElement {
  const snapshot = document.createElement('canvas');
  snapshot.className = 'leap-layer';
  snapshot.width = layers.decor.canvas.width;
  snapshot.height = layers.decor.canvas.height;
  const context = snapshot.getContext('2d');
  context?.drawImage(layers.decor.canvas, 0, 0);
  context?.drawImage(layers.scene.canvas, 0, 0);
  layers.element.insertBefore(snapshot, layers.indicator);
  return snapshot;
}

export function gearRadius(index: number): number {
  return (BACKDROP_GEARS[index]?.radius ?? 0) * ROOM_EXTENT;
}
