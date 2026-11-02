import { fitCellSize } from '../../shell/dom';
import { CELL_SIZE, ROOM_SIZE } from '../logic/types';

const MAX_CELL_SIZE = 48;

export interface RoomLayers {
  element: HTMLElement;
  decor: CanvasRenderingContext2D;
  scene: CanvasRenderingContext2D;
}

function createLayer(element: HTMLElement): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  element.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Leap needs a 2D canvas.');
  }
  return context;
}

export function createRoomLayers(): RoomLayers {
  const element = document.createElement('div');
  element.className = 'leap-room';
  return { element, decor: createLayer(element), scene: createLayer(element) };
}

// Both layers draw in simulation units: one cell is CELL_SIZE units, whatever its size on screen.
export function fitRoomLayers(container: HTMLElement, layers: RoomLayers): void {
  const cellSize = fitCellSize(container, ROOM_SIZE, ROOM_SIZE, MAX_CELL_SIZE);
  const size = cellSize * ROOM_SIZE;
  const pixelRatio = window.devicePixelRatio || 1;
  layers.element.style.width = `${size}px`;
  layers.element.style.height = `${size}px`;
  for (const context of [layers.decor, layers.scene]) {
    context.canvas.width = Math.round(size * pixelRatio);
    context.canvas.height = Math.round(size * pixelRatio);
    const scale = (cellSize * pixelRatio) / CELL_SIZE;
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }
}
