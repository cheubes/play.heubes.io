import {
  carryingMover,
  findLanding,
  moveHorizontally,
  moverPosition,
  moveUp,
  overlapsClosingDoor,
  runnerBox,
  touchesSpikes,
  touchesTile,
} from './collision';
import {
  BUFFER_TICKS,
  CELL_SIZE,
  COYOTE_TICKS,
  GRAVITY,
  JUMP_SPEED,
  MAX_FALL_SPEED,
  ROOM_SIZE,
  RUN_SPEED,
  RUNNER_HEIGHT,
  RUNNER_WIDTH,
  SPRING_SPEED,
} from './types';
import type { LeapState, Level, Room, Runner } from './types';

type RoomStart = Pick<LeapState, 'roomTick' | 'runner' | 'doorsSwapped' | 'pendingSwap' | 'roomCog'>;

function startRunner(room: Room): Runner {
  return {
    x: room.entry.col * CELL_SIZE + (CELL_SIZE - RUNNER_WIDTH) / 2,
    y: (room.entry.row + 1) * CELL_SIZE - RUNNER_HEIGHT,
    vy: 0,
    facing: room.facing,
    launched: false,
    grounded: true,
    coyote: 0,
    buffer: 0,
    onLever: false,
  };
}

function roomStart(room: Room): RoomStart {
  return { roomTick: 0, runner: startRunner(room), doorsSwapped: false, pendingSwap: false, roomCog: false };
}

export function createState(level: Level): LeapState {
  return { room: 0, ...roomStart(level.rooms[0]), cogs: 0, falls: 0, runTicks: 0, outcome: 'playing' };
}

function finishRoom(level: Level, state: LeapState): LeapState {
  const cogs = state.roomCog ? state.cogs + 1 : state.cogs;
  if (state.room === 1) {
    return { ...state, cogs, roomCog: false, outcome: 'complete' };
  }
  return { ...state, room: 1, ...roomStart(level.rooms[1]), cogs };
}

export function step(level: Level, state: LeapState, pressed: boolean): LeapState {
  if (state.outcome === 'complete') {
    return state;
  }
  if (!state.runner.launched) {
    return pressed ? { ...state, runner: { ...state.runner, launched: true } } : state;
  }

  const room = level.rooms[state.room];
  const { doorsSwapped } = state;
  const previousTick = state.roomTick;
  const roomTick = previousTick + 1;
  let { x, y, vy, facing, grounded, coyote, buffer } = state.runner;

  const carrier = grounded ? carryingMover(room, x, y + RUNNER_HEIGHT, previousTick) : undefined;
  if (carrier !== undefined) {
    const from = moverPosition(carrier, previousTick);
    const to = moverPosition(carrier, roomTick);
    x = moveHorizontally(room, doorsSwapped, x, y, to.x - from.x).x;
    y = to.y < from.y ? moveUp(room, doorsSwapped, x, y, to.y - from.y).y : y + to.y - from.y;
  }

  if (pressed) {
    buffer = BUFFER_TICKS;
  }
  if (buffer > 0 && (grounded || coyote > 0)) {
    vy = -JUMP_SPEED;
    grounded = false;
    coyote = 0;
    buffer = 0;
  } else {
    buffer = Math.max(0, buffer - 1);
    coyote = Math.max(0, coyote - 1);
  }

  const horizontal = moveHorizontally(room, doorsSwapped, x, y, facing === 'right' ? RUN_SPEED : -RUN_SPEED);
  x = horizontal.x;
  if (horizontal.blocked) {
    facing = facing === 'right' ? 'left' : 'right';
  }

  vy = Math.min(vy + GRAVITY, MAX_FALL_SPEED);
  if (vy < 0) {
    const vertical = moveUp(room, doorsSwapped, x, y, vy);
    y = vertical.y;
    if (vertical.blocked) {
      vy = 0;
    }
    grounded = false;
  } else {
    const previousBottom = state.runner.y + RUNNER_HEIGHT;
    const landing = findLanding(room, doorsSwapped, x, previousBottom, y + vy + RUNNER_HEIGHT, previousTick, roomTick);
    if (landing === undefined) {
      y += vy;
      grounded = false;
    } else if (landing.spring) {
      y = landing.top - RUNNER_HEIGHT;
      vy = -SPRING_SPEED;
      grounded = false;
      coyote = 0;
    } else {
      y = landing.top - RUNNER_HEIGHT;
      vy = 0;
      grounded = true;
      coyote = COYOTE_TICKS;
    }
  }

  const box = runnerBox(x, y);
  if (touchesSpikes(room, box) || y + RUNNER_HEIGHT > ROOM_SIZE * CELL_SIZE) {
    return { ...state, ...roomStart(room), falls: state.falls + 1, runTicks: state.runTicks + 1 };
  }

  const onLever = touchesTile(room, box, 'lever');
  let pendingSwap = onLever && !state.runner.onLever ? !state.pendingSwap : state.pendingSwap;
  let nextDoorsSwapped = doorsSwapped;
  if (pendingSwap && !overlapsClosingDoor(room, box, doorsSwapped)) {
    nextDoorsSwapped = !doorsSwapped;
    pendingSwap = false;
  }

  const next: LeapState = {
    ...state,
    roomTick,
    runner: { x, y, vy, facing, launched: true, grounded, coyote, buffer, onLever },
    doorsSwapped: nextDoorsSwapped,
    pendingSwap,
    roomCog: state.roomCog || touchesTile(room, box, 'cog'),
    runTicks: state.runTicks + 1,
  };
  return touchesTile(room, box, 'exit') ? finishRoom(level, next) : next;
}
