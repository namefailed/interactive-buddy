# Architecture

Interactive Buddy is a React/Vite canvas game backed by a Matter.js physics engine. React owns presentation, shop state, and unlock state. GameEngine owns physics, interaction effects, buddy state, particles, and the animation loop.

## Directory Structure

    src/
      components/
        GameCanvas.tsx     Canvas element, keyboard listener, React-to-engine sync
        Toolbar.tsx        Tool, care, toy, utility, explosive, and skin dock
      game/
        ai.ts              Buddy balance, walking, and get-up behavior
        constants.ts       Room and body constants
        draw.ts            Pure canvas rendering for room, buddy, props, particles, HUD
        engine.ts          Matter.js world, interactions, mood, trust, stress, score
        items/index.ts     Tool and skin catalog plus defaults
      hooks/
        useGame.ts         GameEngine lifecycle and imperative bridge
        useGameState.ts    React-side GameState and unlock helpers
      types/index.ts       Shared TypeScript interfaces
      App.tsx              Top-level game shell and state wiring

## State Flow

1. App owns the React GameState: money, unlocks, active item, active skin, mood, score, trust, stress, and reaction.
2. GameCanvas receives active item, active skin color, unlocked items, and money as props.
3. useGame creates one GameEngine instance and exposes stable methods for syncing React choices into the engine.
4. Mouse and keyboard events go from GameCanvas to GameEngine.
5. Each interaction updates Matter bodies, particles, score, mood, trust, stress, and reactions inside the engine.
6. The engine emits partial GameState updates through onStateChange and money deltas through onMoneyEarned.
7. React re-renders the shell, status strip, meters, toolbar, and skin states.

## Engine Responsibilities

GameEngine is the source of truth for runtime simulation:

- creates the room, buddy ragdoll, constraints, and props;
- applies tool effects and care effects;
- manages health, score, mood, trust, stress, and short reaction text;
- updates particles, money popups, screenshake, and Matter.js each frame;
- draws the stage through pure functions in draw.ts.

React should not mutate Matter bodies directly. It should only sync selected tools, selected skin color, current money, and unlocked item ids through the bridge methods in useGame.

## Item System

Tools are defined in src/game/items/index.ts with:

- category: hand, care, toy, mayhem, explosive, or utility;
- tone: violent, playful, or care;
- damage and moneyMultiplier for reward and stress tuning;
- cost for the shop loop.

The toolbar groups tools by category automatically. Every tool id that needs unique behavior should have a corresponding branch in GameEngine.handleInteraction.

## Buddy Emotional Model

The MVP emotional model is intentionally small:

- mood: visible expression state used by the face and mood pill;
- trust: increases with care and some playful tools, decreases with damage;
- stress: increases with violent impacts, decreases with care tools;
- reaction: short text feedback for the bottom status strip.

Violent tools should feel satisfying, but they should also move the buddy toward higher stress. Care tools should visibly lower stress, rebuild trust, and give small rewards so the pet loop is useful rather than decorative.

## Rendering Pipeline

Each animation frame:

1. Matter.js advances the physics world.
2. updateAI nudges the buddy toward balance, walking, and recovery.
3. The engine enforces bounds and continuous-fire tools.
4. Particles, money popups, mood timers, and screenshake decay.
5. drawRoom, drawProps, drawBuddy, drawParticles, drawMoneyPopups, drawMoodIndicator, and drawHUD render the frame.

Rendering functions should stay pure: pass data in, draw to the canvas, and avoid changing game state.

## Contributor Notes

- Keep new gameplay behavior in GameEngine, not in React components.
- Keep new catalog data in items/index.ts, not hardcoded inside the toolbar.
- Keep GameState additions typed in types/index.ts and emitted through emitState.
- Run pnpm build and pnpm lint after changing engine, types, or UI wiring.
