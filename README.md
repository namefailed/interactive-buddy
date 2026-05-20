# Interactive Buddy

Interactive Buddy is a polished arcade physics pet built for a portfolio site. It keeps the classic cartoon mayhem loop: click, drag, unlock tools, trigger ragdoll physics, and earn currency. The redesign adds a light companion layer so the buddy also reacts to care, stress, trust, skins, and recovery moments.

## Gameplay Loop

1. Use the tool dock to choose a mayhem, toy, utility, or care action.
2. Interact with the buddy on the canvas to produce physics reactions, particles, score, and money.
3. Watch the buddy signal mood, trust, stress, and short reactions in the status strip.
4. Spend money on new tools and skins.
5. Balance chaos with care tools like Comfort, Tickle, Treat, and Radio to keep the buddy responsive.

## Controls

- Mouse down on the stage: use the selected tool.
- Drag near the buddy: grab and toss a body part.
- Hold with Machine Gun or Flamethrower: continuous effects.
- G: toggle low gravity.

## Project Scripts

    pnpm install
    pnpm dev
    pnpm build
    pnpm lint
    pnpm preview

## Portfolio Positioning

The game is meant to read as a shippable interactive toy rather than a raw prototype. The current pass focuses on:

- a studio-like game shell with status, stage, and tool dock;
- synced React UI and Matter.js engine state;
- a simple emotional model with mood, trust, stress, and reactions;
- readable tool categories and locked, owned, and active states;
- practical docs for future contributors.

## Adding Content

### Add a Tool

1. Add a ToolItem entry in src/game/items/index.ts with an id, category, tone, cost, damage, and money multiplier.
2. Add behavior for the id in GameEngine.handleInteraction in src/game/engine.ts.
3. Add a short token in src/components/Toolbar.tsx if the generated three-letter token is not clear.
4. Run pnpm build and pnpm lint.

### Add a Skin

1. Add a Skin entry in src/game/items/index.ts.
2. The toolbar will render it automatically.
3. The selected skin color is synced to GameEngine.setSkin through GameCanvas and useGame.

### Add a Reaction

Use GameEngine.setReaction from interaction code when the player does something meaningful. Reactions should be short, present-tense status lines that fit the bottom strip.

## Tech Stack

- React 19
- TypeScript
- Vite
- Matter.js
- Canvas 2D rendering
