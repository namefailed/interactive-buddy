import Matter from 'matter-js';
import type { Mood, Particle, GameState, ToolItem } from '../types';
import { ITEMS, DEFAULT_ITEMS } from './items';
import { ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS, BUDDY_RADIUS } from './constants';
import { drawRoom, drawBuddy, drawProps, drawParticles, drawMoneyPopups, drawMoodIndicator, drawHUD } from './draw';
import { createAIState, updateAI, type AIState } from './ai';

const { Engine, World, Bodies, Body, Vector, Constraint } = Matter;

const bd = Bodies as unknown as {
  rectangle: (x: number, y: number, w: number, h: number, opts?: Record<string, unknown>) => Matter.Body;
  circle: (x: number, y: number, r: number, opts?: Record<string, unknown>) => Matter.Body;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export interface TimedProp {
  body: Matter.Body;
  timer: number;
}

export interface GameEngineState {
  buddyBodies: Matter.Body[];
  buddyConstraints: Matter.Constraint[];
  mood: Mood;
  money: number;
  score: number;
  health: number;
  trust: number;
  stress: number;
  reaction: string;
  particles: Particle[];
  activeItem: ToolItem;
  unlockedItems: string[];
  baseColor: string;
  moodTimer: number;
  screenshake: number;
  moneyPopups: { x: number; y: number; text: string; life: number }[];
}

export class GameEngine {
  engine: Matter.Engine;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  state: GameEngineState;
  room: Matter.Body[];
  animFrameId: number | null = null;
  onStateChange: ((state: Partial<GameState>) => void) | null = null;
  onMoneyEarned: ((amount: number) => void) | null = null;
  mousePos: { x: number; y: number } = { x: 0, y: 0 };
  isMouseDown = false;
  dragBody: Matter.Body | null = null;
  shootTimer = 0;
  lastTimestamp = 0;
  ai: AIState;
  props: Matter.Body[] = [];
  activeGrenades: TimedProp[] = [];
  activeBlackholes: TimedProp[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.engine = Engine.create({
      gravity: { x: 0, y: 1.5, scale: 0.001 },
    });

    this.ai = createAIState();
    this.room = this.createRoom();
    this.state = this.createInitialState();
    const { bodies, constraints } = this.createBuddy();
    this.state.buddyBodies = bodies;
    this.state.buddyConstraints = constraints;
    this.props = this.createProps();

    World.add(this.engine.world, [...this.room, ...bodies, ...constraints, ...this.props]);

    Matter.Events.on(this.engine, 'collisionStart', (event) => this.handleCollisions(event));
  }

  private handleCollisions(event: Matter.IEventCollision<Matter.Engine>): void {
    const pairs = event.pairs;
    for (const pair of pairs) {
      const { bodyA, bodyB } = pair;
      this.checkPropCollision(bodyA, bodyB);
      this.checkPropCollision(bodyB, bodyA);
    }
  }

  private checkPropCollision(prop: Matter.Body, other: Matter.Body): void {
    if (!prop.label.startsWith('prop-')) return;
    if (other.label.startsWith('buddy-') || other.label === 'explosion') {
      if (prop.label === 'prop-treat' && other.label.startsWith('buddy-')) {
        this.applyCare(prop.position.x, prop.position.y, 15, 18, 4, 'Snack accepted. Trust climbs.');
        this.removeProp(prop);
      } else if (prop.label === 'prop-mine' && other.label.startsWith('buddy-')) {
        this.spawnExplosion(prop.position.x, prop.position.y, 45);
        this.applyDamage(50);
        this.removeProp(prop);
      }
    }
  }

  private removeProp(prop: Matter.Body): void {
    World.remove(this.engine.world, prop);
    this.props = this.props.filter(p => p !== prop);
  }

  private createInitialState(): GameEngineState {
    return {
      buddyBodies: [],
      buddyConstraints: [],
      mood: 'neutral',
      money: 0,
      score: 0,
      health: 100,
      trust: 60,
      stress: 18,
      reaction: 'Ready for the first experiment.',
      particles: [],
      activeItem: ITEMS[0],
      unlockedItems: [...DEFAULT_ITEMS],
      baseColor: '#ff6b6b',
      moodTimer: 0,
      screenshake: 0,
      moneyPopups: [],
    };
  }

  private createRoom(): Matter.Body[] {
    const wallOptions: Record<string, unknown> = {
      isStatic: true,
      restitution: 0.6,
      friction: 0.3,
      label: 'wall',
    };

    const floor = bd.rectangle(ROOM_WIDTH / 2, ROOM_HEIGHT + WALL_THICKNESS / 2, ROOM_WIDTH + 100, WALL_THICKNESS, wallOptions);
    const leftWall = bd.rectangle(-WALL_THICKNESS / 2, ROOM_HEIGHT / 2, WALL_THICKNESS, ROOM_HEIGHT, wallOptions);
    const rightWall = bd.rectangle(ROOM_WIDTH + WALL_THICKNESS / 2, ROOM_HEIGHT / 2, WALL_THICKNESS, ROOM_HEIGHT, wallOptions);
    const ceiling = bd.rectangle(ROOM_WIDTH / 2, -WALL_THICKNESS / 2, ROOM_WIDTH + 100, WALL_THICKNESS, wallOptions);

    return [floor, leftWall, rightWall, ceiling];
  }

  private createBuddy(): { bodies: Matter.Body[]; constraints: Matter.Constraint[] } {
    const cx = ROOM_WIDTH / 2;
    const cy = ROOM_HEIGHT - 100;
    const r = BUDDY_RADIUS; // typically ~20
    const constraints: Matter.Constraint[] = [];
    const parts: Matter.Body[] = [];
    const group = Body.nextGroup(true);

    const opts: Record<string, unknown> = {
      restitution: 0.35,
      friction: 0.4,
      frictionAir: 0.015,
      density: 0.002,
      collisionFilter: { group },
    };

    const head = bd.circle(cx, cy - 45, r * 1.15, { ...opts, label: 'buddy-head', density: 0.0005 });
    const torso = bd.rectangle(cx, cy - 10, r * 1.7, r * 1.5, { ...opts, label: 'buddy-torso', density: 0.006 });
    const leftArm = bd.circle(cx - r - 12, cy - 15, r * 0.55, { ...opts, label: 'buddy-arm' });
    const rightArm = bd.circle(cx + r + 12, cy - 15, r * 0.55, { ...opts, label: 'buddy-arm' });
    const leftLeg = bd.circle(cx - 10, cy + 20, r * 0.65, { ...opts, label: 'buddy-leg' });
    const rightLeg = bd.circle(cx + 10, cy + 20, r * 0.65, { ...opts, label: 'buddy-leg' });

    // Lock torso upright
    Body.setInertia(torso, Infinity);

    parts.push(head, torso, leftArm, rightArm, leftLeg, rightLeg);

    constraints.push(
      // Two constraints for the neck to lock rotation
      Constraint.create({ bodyA: head, pointA: { x: -10, y: 15 }, bodyB: torso, pointB: { x: -10, y: -15 }, stiffness: 0.9, damping: 0.1 }),
      Constraint.create({ bodyA: head, pointA: { x: 10, y: 15 }, bodyB: torso, pointB: { x: 10, y: -15 }, stiffness: 0.9, damping: 0.1 }),
      // Shoulders
      Constraint.create({ bodyA: leftArm, bodyB: torso, pointB: { x: -15, y: -5 }, stiffness: 0.8, damping: 0.1 }),
      Constraint.create({ bodyA: rightArm, bodyB: torso, pointB: { x: 15, y: -5 }, stiffness: 0.8, damping: 0.1 }),
      // Hips
      Constraint.create({ bodyA: leftLeg, bodyB: torso, pointB: { x: -10, y: 15 }, stiffness: 0.9, damping: 0.1 }),
      Constraint.create({ bodyA: rightLeg, bodyB: torso, pointB: { x: 10, y: 15 }, stiffness: 0.9, damping: 0.1 }),
    );

    return { bodies: parts, constraints };
  }

  private createProps(): Matter.Body[] {
    const ball = bd.circle(650, 350, 14, {
      restitution: 0.8, friction: 0.3, frictionAir: 0.01, density: 0.002, label: 'prop',
    });
    const box = bd.rectangle(200, 420, 36, 36, {
      restitution: 0.2, friction: 0.8, frictionAir: 0.02, density: 0.004, label: 'prop',
    });
    return [ball, box];
  }

    // Particles

  private spawnParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      this.state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 20 + Math.random() * 25,
        maxLife: 45,
        color,
        size: 1.5 + Math.random() * 3,
      });
    }
  }

  private spawnMoneyPopup(x: number, y: number, amount: number): void {
    this.state.moneyPopups.push({
      x, y, text: `+$${amount}`, life: 40,
    });
  }

  private spawnExplosion(x: number, y: number, radius: number): void {
    this.state.screenshake = Math.min(this.state.screenshake + radius * 0.3, 12);
    this.spawnParticles(x, y, '#ff6b35', 25);
    this.spawnParticles(x, y, '#ff0000', 20);
    this.spawnParticles(x, y, '#ffdd00', 15);

    const boom = bd.circle(x, y, radius, { isStatic: true, isSensor: true, label: 'explosion' });
    World.add(this.engine.world, boom);

    const buddies = this.state.buddyBodies;
    for (const b of buddies) {
      const dist = Vector.magnitude(Vector.sub(b.position, { x, y }));
      if (dist < radius + 120) {
        const fm = (radius / Math.max(dist, 10)) * 0.04;
        const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
        Body.applyForce(b, b.position, { x: dir.x * fm, y: dir.y * fm - fm * 0.5 });
        const dmg = Math.floor((radius / Math.max(dist, 10)) * 4);
        if (dmg > 0) this.applyDamage(dmg);
      }
    }
    for (const p of this.props) {
      const dist = Vector.magnitude(Vector.sub(p.position, { x, y }));
      if (dist < radius + 150) {
        const fm = (radius / Math.max(dist, 10)) * 0.05;
        const dir = Vector.normalise(Vector.sub(p.position, { x, y }));
        Body.applyForce(p, p.position, { x: dir.x * fm, y: dir.y * fm - fm * 0.2 });
      }
    }

    setTimeout(() => {
      World.remove(this.engine.world, boom);
    }, 200);
  }

    // Game logic

  private emitState(): void {
    this.onStateChange?.({
      activeItemId: this.state.activeItem.id,
      mood: this.state.mood,
      money: this.state.money,
      score: this.state.score,
      trust: this.state.trust,
      stress: this.state.stress,
      reaction: this.state.reaction,
    });
  }

  private reward(amount: number, scoreMultiplier = 10): void {
    if (amount <= 0) return;
    this.state.money += amount;
    this.state.score += amount * scoreMultiplier;
    this.onMoneyEarned?.(amount);
  }

  private adjustBond(trustDelta: number, stressDelta: number): void {
    this.state.trust = clamp(this.state.trust + trustDelta);
    this.state.stress = clamp(this.state.stress + stressDelta);
  }

  private setReaction(reaction: string): void {
    this.state.reaction = reaction;
  }

  applyDamage(amount: number): void {
    if (amount <= 0) return;
    this.state.health = Math.max(0, this.state.health - amount);
    const cash = Math.max(1, Math.floor(amount * this.state.activeItem.moneyMultiplier));
    this.reward(cash);
    this.adjustBond(-amount * 0.3, amount * 0.45);
    this.state.screenshake = Math.min(this.state.screenshake + amount * 0.1, 8);
    this.updateMood(amount);

    if (this.state.health <= 0) this.respawnBuddy();
  }

  private applyCare(x: number, y: number, trustGain: number, stressDrop: number, reward: number, reaction: string): void {
    this.state.health = Math.min(100, this.state.health + Math.max(1, Math.floor(trustGain * 0.35)));
    this.adjustBond(trustGain, -stressDrop);
    this.reward(reward, 7);
    this.state.mood = 'happy';
    this.state.moodTimer = 90;
    this.setReaction(reaction);
    this.spawnParticles(x, y, '#5eead4', 8);
    this.spawnParticles(x, y, '#facc15', 5);
    if (reward > 0) this.spawnMoneyPopup(x, y - 20, reward);
    this.emitState();
  }

  private updateMood(intensity: number): void {
    if (this.state.stress > 78) this.state.mood = 'scared';
    else if (intensity > 22) this.state.mood = 'angry';
    else if (intensity > 6) this.state.mood = 'sad';
    else if (this.state.trust > 72 && this.state.stress < 32) this.state.mood = 'happy';
    else if (Math.random() < 0.12) this.state.mood = 'scared';
    else this.state.mood = 'neutral';

    this.setReaction(
      this.state.stress > 78
        ? 'Buddy is overwhelmed. Care tools will help.'
        : this.state.activeItem.name + ' landed. Stress is ' + Math.round(this.state.stress) + '%.'
    );
    this.state.moodTimer = 30 + Math.floor(Math.random() * 36);
    this.emitState();
  }

  private respawnBuddy(): void {
    const oldBodies = this.state.buddyBodies;
    const oldConstraints = this.state.buddyConstraints;
    World.remove(this.engine.world, [...oldBodies, ...oldConstraints]);

    const { bodies, constraints } = this.createBuddy();
    this.state.buddyBodies = bodies;
    this.state.buddyConstraints = constraints;
    World.add(this.engine.world, [...bodies, ...constraints]);

    this.state.health = 100;
    this.state.mood = 'happy';
    this.state.stress = Math.max(20, this.state.stress - 25);
    this.state.trust = Math.max(35, this.state.trust - 10);
    this.state.screenshake = 10;
    this.setReaction('Buddy bounced back, but remembers that one.');
    this.spawnParticles(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, '#ffd700', 40);
    this.reward(50);
    this.emitState();
  }

    // Interactions

  private handleInteraction(x: number, y: number, isAutoFire = false): void {
    const item = this.state.activeItem;
    const buddies = this.state.buddyBodies;

    let hit = false;
    for (const b of buddies) {
      const d = Vector.magnitude(Vector.sub(b.position, { x, y }));
      if (d < 70) { hit = true; break; }
    }

    if (isAutoFire) return;

    switch (item.id) {
      case 'fist': {
        for (const b of buddies) {
          const d = Vector.magnitude(Vector.sub(b.position, { x, y }));
          if (d < 65) {
            const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
            const power = 0.04 * (65 / Math.max(d, 15));
            Body.applyForce(b, b.position, { x: dir.x * power, y: (dir.y * power) - 0.025 });
          }
        }
        if (hit) {
          this.applyDamage(item.damage);
          this.spawnParticles(x, y, '#ffffff', 10);
          this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
          this.state.mood = 'angry';
          this.state.moodTimer = 30;
        }
        break;
      }
      case 'tickle': {
        if (!hit) break;
        for (const b of buddies) {
          Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.003,
            y: -0.003 - Math.random() * 0.002,
          });
        }
        this.applyCare(x, y, 6, 10, 2, 'Buddy loosens up. The lab feels friendlier.');
        break;
      }
      case 'comfort': {
        if (!hit) break;
        for (const b of buddies) {
          Body.applyForce(b, b.position, { x: (Math.random() - 0.5) * 0.0015, y: -0.0015 });
        }
        this.applyCare(x, y, 10, 14, 1, 'Buddy leans into the attention.');
        break;
      }
      case 'treat': {
        const treat = bd.rectangle(x, y, 20, 10, {
          restitution: 0.4, friction: 0.6, density: 0.002, label: 'prop-treat',
        });
        World.add(this.engine.world, treat);
        this.props.push(treat);
        break;
      }
      case 'grenade': {
        const grenade = bd.circle(x, y, 10, {
          restitution: 0.6, friction: 0.4, density: 0.004, label: 'prop-grenade',
        });
        World.add(this.engine.world, grenade);
        this.props.push(grenade);
        this.activeGrenades.push({ body: grenade, timer: 90 }); // ~3 seconds at 30fps
        break;
      }
      case 'mine': {
        const mine = bd.rectangle(x, y, 24, 8, {
          restitution: 0.1, friction: 0.8, density: 0.01, label: 'prop-mine',
        });
        World.add(this.engine.world, mine);
        this.props.push(mine);
        break;
      }
      case 'bowling': {
        const ball = bd.circle(x, y, 25, {
          restitution: 0.2, friction: 0.3, density: 0.015, label: 'prop-bowling',
        });
        World.add(this.engine.world, ball);
        this.props.push(ball);
        break;
      }
      case 'rubberballs': {
        for (let i = 0; i < 3; i++) {
          const bx = x + (Math.random() - 0.5) * 40;
          const by = y + (Math.random() - 0.5) * 20;
          const ball = bd.circle(bx, by, 8 + Math.random() * 6, {
            restitution: 0.9, friction: 0.2, frictionAir: 0.005, density: 0.001, label: 'prop-rubberball',
          });
          Body.applyForce(ball, ball.position, {
            x: (Math.random() - 0.5) * 0.02,
            y: -0.02 - Math.random() * 0.02,
          });
          World.add(this.engine.world, ball);
          this.props.push(ball);
        }
        break;
      }
      case 'gravity': {
        const bh = bd.circle(x, y, 30, {
          isStatic: true, isSensor: true, label: 'prop-blackhole',
        });
        World.add(this.engine.world, bh);
        this.props.push(bh);
        this.activeBlackholes.push({ body: bh, timer: 150 }); // 5 seconds
        break;
      }
    }
  }

    // Update

  private updateParticles(): void {
    for (let i = this.activeBlackholes.length - 1; i >= 0; i--) {
      const bh = this.activeBlackholes[i];
      bh.timer--;
      const pos = bh.body.position;
      
      // Suck in buddy
      for (const b of this.state.buddyBodies) {
        const d = Vector.magnitude(Vector.sub(pos, b.position));
        if (d < 400 && d > 10) {
          const dir = Vector.normalise(Vector.sub(pos, b.position));
          Body.applyForce(b, b.position, { x: dir.x * 0.015, y: dir.y * 0.015 });
        }
      }
      
      // Suck in props
      for (const p of this.props) {
        if (p === bh.body) continue;
        const d = Vector.magnitude(Vector.sub(pos, p.position));
        if (d < 400 && d > 10) {
          const dir = Vector.normalise(Vector.sub(pos, p.position));
          Body.applyForce(p, p.position, { x: dir.x * 0.02, y: dir.y * 0.02 });
        }
      }

      this.spawnParticles(pos.x + (Math.random() - 0.5) * 80, pos.y + (Math.random() - 0.5) * 80, '#9b59b6', 1);

      if (bh.timer <= 0) {
        this.removeProp(bh.body);
        this.activeBlackholes.splice(i, 1);
        this.spawnExplosion(pos.x, pos.y, 60);
      }
    }

    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.timer--;
      if (g.timer <= 0) {
        this.spawnExplosion(g.body.position.x, g.body.position.y, 40);
        this.applyDamage(40);
        this.removeProp(g.body);
        this.activeGrenades.splice(i, 1);
      }
    }

    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.98;
      p.life--;
      if (p.life <= 0) this.state.particles.splice(i, 1);
    }
  }

  private updateMoneyPopups(): void {
    for (let i = this.state.moneyPopups.length - 1; i >= 0; i--) {
      this.state.moneyPopups[i].life--;
      if (this.state.moneyPopups[i].life <= 0) this.state.moneyPopups.splice(i, 1);
    }
  }

  private updateMoodTimer(): void {
    if (this.state.moodTimer > 0) {
      this.state.moodTimer--;
      if (this.state.moodTimer === 0) {
        this.state.mood = this.state.stress > 70 ? 'scared' : this.state.trust > 70 ? 'happy' : 'neutral';
        this.emitState();
      }
    }
  }

  private enforceBounds(): void {
    const torso = this.state.buddyBodies.find(b => b.label === 'buddy-torso');
    if (!torso) return;
    const m = 200;
    if (torso.position.x < -m || torso.position.x > ROOM_WIDTH + m ||
        torso.position.y < -m || torso.position.y > ROOM_HEIGHT + m) {
      this.respawnBuddy();
    }
  }

    // Input handlers (public)

  onMouseDown(e: React.MouseEvent<HTMLCanvasElement>): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.isMouseDown = true;
    this.mousePos = { x, y };

    for (const b of this.state.buddyBodies) {
      const d = Vector.magnitude(Vector.sub(b.position, { x, y }));
      if (d < 65) { this.dragBody = b; break; }
    }

    this.handleInteraction(x, y);
  }

  onMouseMove(e: React.MouseEvent<HTMLCanvasElement>): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (this.isMouseDown && this.dragBody) {
      const dir = Vector.sub(this.mousePos, this.dragBody.position);
      Body.setVelocity(this.dragBody, Vector.mult(dir, 0.3));
    }

    if (this.isMouseDown && this.state.activeItem.id === 'machinegun') {
      this.handleInteraction(this.mousePos.x, this.mousePos.y);
    }
  }

  onMouseUp(): void {
    this.isMouseDown = false;
    this.dragBody = null;
  }

  setActiveItem(itemId: string): void {
    const item = ITEMS.find(i => i.id === itemId);
    if (item && this.state.unlockedItems.includes(itemId)) {
      this.state.activeItem = item;
      this.setReaction(item.name + ' selected.');
      this.emitState();
    }
  }

  unlockItem(itemId: string): boolean {
    const item = ITEMS.find(i => i.id === itemId);
    if (!item || this.state.unlockedItems.includes(itemId)) return false;
    if (this.state.money < item.cost) return false;
    this.state.money -= item.cost;
    this.state.unlockedItems.push(itemId);
    this.emitState();
    return true;
  }

  setSkin(color: string): void {
    this.state.baseColor = color;
  }

  syncUnlockedItems(itemIds: string[]): void {
    this.state.unlockedItems = [...new Set(itemIds)];
    if (!this.state.unlockedItems.includes(this.state.activeItem.id)) {
      this.state.activeItem = ITEMS[0];
    }
  }

  syncMoney(money: number): void {
    this.state.money = money;
  }

  setGravity(scale: number): void {
    this.engine.gravity.y = scale;
  }

    // Loop

  start(): void {
    this.lastTimestamp = performance.now();
    const loop = (ts: number) => {
      const d = Math.min(ts - this.lastTimestamp, 33);
      this.lastTimestamp = ts;

      Engine.update(this.engine, d);
      updateAI(this.state.buddyBodies, this.ai, this.props);
      this.enforceBounds();
      if (this.isMouseDown) {
        this.shootTimer--;
        if (this.shootTimer <= 0) {
          if (this.state.activeItem.id === 'machinegun') {
            this.shootTimer = 5;
            this.handleInteraction(this.mousePos.x, this.mousePos.y, true);
          } else if (this.state.activeItem.id === 'flamethrower') {
            this.shootTimer = 3;
            this.handleInteraction(this.mousePos.x, this.mousePos.y, true);
          }
        }
      }
      this.updateParticles();
      this.updateMoneyPopups();
      this.updateMoodTimer();

      if (this.state.screenshake > 0) this.state.screenshake *= 0.85;
      if (this.state.screenshake < 0.5) this.state.screenshake = 0;

      this.ctx.save();
      drawRoom(this.ctx, this.state.screenshake);
      drawProps(this.ctx, this.props);
      drawBuddy(this.ctx, this.state.buddyBodies, this.state.baseColor, this.state.mood, this.ai.state);
      drawParticles(this.ctx, this.state.particles);
      drawMoneyPopups(this.ctx, this.state.moneyPopups);
      drawMoodIndicator(this.ctx, this.state.mood);
      drawHUD(this.ctx, this.state.money, this.state.health, this.state.activeItem.name);
      this.ctx.restore();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.animFrameId !== null) { cancelAnimationFrame(this.animFrameId); }
    Engine.clear(this.engine);
  }

  getRoomDimensions() { return { width: ROOM_WIDTH, height: ROOM_HEIGHT }; }
}

