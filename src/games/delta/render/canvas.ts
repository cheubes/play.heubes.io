import { MAP_HEIGHT, MAP_WIDTH } from '../logic/types';
import type { Point } from '../logic/types';

export interface MapView {
  context: CanvasRenderingContext2D;
  // CSS pixels per map unit.
  scale: number;
  // In portrait, the map is turned a quarter clockwise: (x, y) is drawn at (MAP_HEIGHT - y, x).
  rotated: boolean;
}

export function createMapView(): MapView {
  const canvas = document.createElement('canvas');
  canvas.className = 'delta-map';
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Delta needs a 2D canvas.');
  }
  return { context, scale: 0, rotated: false };
}

export function fitMapView(container: HTMLElement, view: MapView): void {
  const margin = parseFloat(getComputedStyle(container).getPropertyValue('--space-4'));
  const width = container.clientWidth - 2 * margin;
  const height = container.clientHeight - 2 * margin;
  view.rotated = height > width;
  const columns = view.rotated ? MAP_HEIGHT : MAP_WIDTH;
  const rows = view.rotated ? MAP_WIDTH : MAP_HEIGHT;
  view.scale = Math.max(0, Math.min(width / columns, height / rows));
  const { canvas } = view.context;
  canvas.style.width = `${columns * view.scale}px`;
  canvas.style.height = `${rows * view.scale}px`;
  canvas.width = Math.round(columns * view.scale * window.devicePixelRatio);
  canvas.height = Math.round(rows * view.scale * window.devicePixelRatio);
}

// Draws in map units from then on.
export function useMapTransform(view: MapView): void {
  const unit = view.scale * window.devicePixelRatio;
  if (view.rotated) {
    view.context.setTransform(0, unit, -unit, 0, MAP_HEIGHT * unit, 0);
  } else {
    view.context.setTransform(unit, 0, 0, unit, 0, 0);
  }
}

// Draws in device pixels from then on, upright whatever the orientation.
export function useDeviceTransform(view: MapView): void {
  view.context.setTransform(1, 0, 0, 1, 0, 0);
}

export function toDevice(view: MapView, point: Point): Point {
  const unit = view.scale * window.devicePixelRatio;
  return view.rotated ? { x: (MAP_HEIGHT - point.y) * unit, y: point.x * unit } : { x: point.x * unit, y: point.y * unit };
}
