import { createState, step } from './leap';
import type { LeapState, Level } from './types';

export const MAX_SOLVER_TICKS = 3600;

export interface Solution {
  presses: number[];
  ticks: number;
}

export interface SolverResult {
  exit: Solution | undefined;
  exitWithCog: Solution | undefined;
}

interface Node {
  state: LeapState;
  parent: Node | undefined;
  tick: number;
  pressed: boolean;
}

type Outcome = number | 'fall' | 'exit' | 'exit-with-cog';

interface GraphNode {
  jumpable: boolean;
  wait: Outcome;
  press: Outcome;
}

function greatestCommonDivisor(first: number, second: number): number {
  return second === 0 ? first : greatestCommonDivisor(second, first % second);
}

function moverCycle(level: Level, roomIndex: 0 | 1): number {
  return level.rooms[roomIndex].movers.reduce(
    (cycle, mover) => (cycle * mover.period) / greatestCommonDivisor(cycle, mover.period),
    1,
  );
}

function canJump(state: LeapState): boolean {
  return state.runner.launched && (state.runner.grounded || state.runner.coyote > 0);
}

function stateKey(state: LeapState, cycle: number): string {
  const { x, y, vy, facing, grounded, coyote, buffer, onLever } = state.runner;
  return [
    x,
    y,
    vy,
    facing,
    grounded,
    coyote,
    buffer,
    onLever,
    state.doorsSwapped,
    state.pendingSwap,
    state.roomCog,
    state.roomTick % cycle,
  ].join(',');
}

// The room is solved as the first of a level made of that room twice: reaching its exit is moving to room 2.
function roomLevel(level: Level, roomIndex: 0 | 1): Level {
  const room = level.rooms[roomIndex];
  return { id: level.id, rooms: [room, room] };
}

function solution(node: Node): Solution {
  const presses: number[] = [];
  for (let current: Node | undefined = node; current !== undefined; current = current.parent) {
    if (current.pressed) {
      presses.unshift(current.tick);
    }
  }
  return { presses, ticks: node.tick - 1 };
}

// Breadth-first search on the steps of a room, pressing only when a jump is possible: a press at any other
// moment is either ignored or buffered into a jump a few steps later, which another branch covers.
// Presses are numbered like the steps of the room, the first one being the launch; ticks do not count it.
export function solveRoom(level: Level, roomIndex: 0 | 1): SolverResult {
  const solverLevel = roomLevel(level, roomIndex);
  const cycle = moverCycle(level, roomIndex);
  const result: SolverResult = { exit: undefined, exitWithCog: undefined };
  const launch: Node = {
    state: step(solverLevel, createState(solverLevel), true),
    parent: undefined,
    tick: 1,
    pressed: true,
  };
  const seen = new Set([stateKey(launch.state, cycle)]);
  let frontier = [launch];

  for (let tick = 2; tick <= MAX_SOLVER_TICKS + 1 && frontier.length > 0; tick++) {
    const next: Node[] = [];
    for (const node of frontier) {
      for (const pressed of canJump(node.state) ? [false, true] : [false]) {
        const state = step(solverLevel, node.state, pressed);
        if (state.falls > 0) {
          continue;
        }
        const child = { state, parent: node, tick, pressed };
        if (state.room === 1) {
          result.exit ??= solution(child);
          if (state.cogs === 1) {
            result.exitWithCog ??= solution(child);
          }
          continue;
        }
        const key = stateKey(state, cycle);
        if (!seen.has(key)) {
          seen.add(key);
          next.push(child);
        }
      }
    }
    if (result.exit !== undefined && result.exitWithCog !== undefined) {
      break;
    }
    frontier = next;
  }
  return result;
}

function exploreRoom(level: Level, roomIndex: 0 | 1): { start: number; nodes: GraphNode[] } {
  const solverLevel = roomLevel(level, roomIndex);
  const cycle = moverCycle(level, roomIndex);
  const ids = new Map<string, number>();
  const states: LeapState[] = [];
  const outcome = (state: LeapState): Outcome => {
    if (state.falls > 0) {
      return 'fall';
    }
    if (state.room === 1) {
      return state.cogs === 1 ? 'exit-with-cog' : 'exit';
    }
    const key = stateKey(state, cycle);
    const known = ids.get(key);
    if (known !== undefined) {
      return known;
    }
    ids.set(key, states.length);
    states.push(state);
    return states.length - 1;
  };
  const start = outcome(step(solverLevel, createState(solverLevel), true));
  if (typeof start !== 'number') {
    throw new Error(`Level ${level.id}: the launch ends the room`);
  }
  const nodes: GraphNode[] = [];
  for (let index = 0; index < states.length; index++) {
    const state = states[index]!;
    const jumpable = canJump(state);
    nodes.push({
      jumpable,
      wait: outcome(step(solverLevel, state, false)),
      press: jumpable ? outcome(step(solverLevel, state, true)) : 'fall',
    });
  }
  return { start, nodes };
}

interface StateGraph {
  start: number;
  nodes: GraphNode[];
  waitPredecessors: number[][];
  pressPredecessors: number[][];
}

function predecessors(nodes: GraphNode[], edge: (node: GraphNode) => Outcome): number[][] {
  const result: number[][] = nodes.map(() => []);
  nodes.forEach((node, index) => {
    const target = edge(node);
    if (typeof target === 'number') {
      result[target]!.push(index);
    }
  });
  return result;
}

// States from which the goal is reachable when each press is placed anywhere in a run of `width` consecutive
// steps where pressing keeps the goal reachable (no press at all with a width of Infinity). A state that becomes
// winning is propagated backwards: through waits, and to the states whose run of `width` steps includes a press
// leading to it.
function winningStates(graph: StateGraph, width: number, withCog: boolean): Uint8Array {
  const { nodes, waitPredecessors, pressPredecessors } = graph;
  const winning = new Uint8Array(nodes.length);
  const queue: number[] = [];
  const wins = (outcome: Outcome) =>
    outcome === 'exit-with-cog' || (outcome === 'exit' && !withCog) || (typeof outcome === 'number' && winning[outcome] === 1);
  const pressWindow = (index: number) => {
    let current: Outcome = index;
    for (let offset = 0; offset < width; offset++) {
      const node: GraphNode | undefined = typeof current === 'number' ? nodes[current] : undefined;
      if (node === undefined || !node.jumpable || !wins(node.press)) {
        return false;
      }
      current = node.wait;
    }
    return true;
  };
  const check = (index: number) => {
    if (winning[index] === 0 && (wins(nodes[index]!.wait) || (Number.isFinite(width) && pressWindow(index)))) {
      winning[index] = 1;
      queue.push(index);
    }
  };
  for (let index = nodes.length - 1; index >= 0; index--) {
    check(index);
  }
  while (queue.length > 0) {
    const reached = queue.pop()!;
    waitPredecessors[reached]!.forEach(check);
    if (!Number.isFinite(width)) {
      continue;
    }
    let runStarts = pressPredecessors[reached]!;
    for (let offset = 0; offset < width && runStarts.length > 0; offset++) {
      runStarts.forEach(check);
      runStarts = runStarts.flatMap((index) => waitPredecessors[index]!);
    }
  }
  return winning;
}

function narrowestWindowIn(graph: StateGraph, withCog: boolean): number {
  const reaches = (width: number) => winningStates(graph, width, withCog)[graph.start] === 1;
  if (reaches(Infinity)) {
    return Infinity;
  }
  if (!reaches(1)) {
    return 0;
  }
  let reachable = 1;
  while (reachable < MAX_SOLVER_TICKS && reaches(reachable * 2)) {
    reachable *= 2;
  }
  let unreachable = reachable * 2;
  while (unreachable - reachable > 1) {
    const width = Math.floor((reachable + unreachable) / 2);
    if (reaches(width)) {
      reachable = width;
    } else {
      unreachable = width;
    }
  }
  return reachable;
}

// The widest run of steps in which each necessary press of a room can be placed, to reach the exit and to reach
// it with the cog: 0 if the goal is unreachable, Infinity if it is reached without any press.
export function narrowestWindows(level: Level, roomIndex: 0 | 1): { exit: number; exitWithCog: number } {
  const { start, nodes } = exploreRoom(level, roomIndex);
  const graph: StateGraph = {
    start,
    nodes,
    waitPredecessors: predecessors(nodes, (node) => node.wait),
    pressPredecessors: predecessors(nodes, (node) => node.press),
  };
  return { exit: narrowestWindowIn(graph, false), exitWithCog: narrowestWindowIn(graph, true) };
}
