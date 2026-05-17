# Architecture

## Directory Structure

```
src/
  game/
    engine.ts         # GameEngine class — physics, state, weapons, input, game loop
    draw.ts           # Pure drawing functions (room, buddy, props, particles, HUD)
    ai.ts             # Buddy AI (balance, walking, getting-up logic)
    constants.ts      # Shared constants (ROOM_WIDTH, ROOM_HEIGHT, etc.)
    items/
      index.ts        # ITEMS array and DEFAULT_ITEMS
  types/
    index.ts          # TypeScript types (GameState, ToolItem, Mood, Particle, etc.)
  hooks/
    useGame.ts        # React hook wrapping GameEngine lifecycle
  components/
    GameCanvas.tsx    # Canvas element + keyboard listener (G for gravity toggle)
    Toolbar.tsx       # Weapon/item selection UI
  App.tsx             # Root layout — title bar, money display, GameCanvas + Toolbar
  App.css             # Dark gradient theme, toolbar, items grid styling
  main.tsx            # Vite entry point
```

## Data Flow

1. **GameEngine** owns the Matter.js world, buddy bodies, props, and all game state
2. React renders `GameCanvas` which creates a `GameEngine` instance via `useGame` hook
3. Mouse events on the canvas call `engine.onMouseDown/Move/Up`
4. Each animation frame: `Engine.update` → `updateAI` → `enforceBounds` → auto-fire tick → update particles/money/mood → draw
5. Drawing is delegated to pure functions in `draw.ts` that receive `ctx` + data
6. AI is a pure function in `ai.ts` that receives buddy bodies + AI state object
7. State changes flow up to React via `onStateChange` and `onMoneyEarned` callbacks

## Key Concepts

- **Buddy**: ragdoll composed of 6 Matter.js bodies (head, torso, 2 arms, 2 legs) connected by constraints, all sharing a `collisionFilter.group` so limbs don't collide with each other
- **AI**: torso angular spring for balance, walking via alternating leg forces, getting-up via arm pushes on floor
- **Weapons**: `handleInteraction` switch with 18 cases — each applies unique forces, particles, screenshake, mood triggers, and money logic
- **Drag**: click within 65px of a buddy body to grab it; `Body.setVelocity` tracks mouse; release throws
- **Props**: additional physics bodies (ball, crate) that the buddy can interact with
- **Gravity toggle**: `G` key switches between normal (1.5) and low (0.4) gravity