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
    const r = BUDDY_RADIUS;
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

    const head = bd.circle(cx, cy - 55, r * 1.15, { ...opts, label: 'buddy-head', density: 0.0015 });
    const torso = bd.rectangle(cx, cy - 14, r * 1.7, r * 1.5, { ...opts, label: 'buddy-torso', density: 0.003 });
    const leftArm = bd.circle(cx - r - 6, cy - 26, r * 0.55, { ...opts, label: 'buddy-arm' });
    const rightArm = bd.circle(cx + r + 6, cy - 26, r * 0.55, { ...opts, label: 'buddy-arm' });
    const leftLeg = bd.circle(cx - r * 0.45, cy + 28, r * 0.65, { ...opts, label: 'buddy-leg' });
    const rightLeg = bd.circle(cx + r * 0.45, cy + 28, r * 0.65, { ...opts, label: 'buddy-leg' });

    parts.push(head, torso, leftArm, rightArm, leftLeg, rightLeg);

    constraints.push(
      Constraint.create({ bodyA: head, bodyB: torso, stiffness: 0.9, damping: 0.08 }),
      Constraint.create({ bodyA: leftArm, bodyB: torso, stiffness: 0.7, damping: 0.12 }),
      Constraint.create({ bodyA: rightArm, bodyB: torso, stiffness: 0.7, damping: 0.12 }),
      Constraint.create({ bodyA: leftLeg, bodyB: torso, stiffness: 0.8, damping: 0.08 }),
      Constraint.create({ bodyA: rightLeg, bodyB: torso, stiffness: 0.8, damping: 0.08 }),
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
    if (!hit) return;

    if (isAutoFire && item.id !== 'machinegun' && item.id !== 'flamethrower') return;

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
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#ffffff', 10);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        this.state.mood = 'angry';
        this.state.moodTimer = 30;
        break;
      }
      case 'tickle': {
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
        for (const b of buddies) {
          Body.applyForce(b, b.position, { x: (Math.random() - 0.5) * 0.0015, y: -0.0015 });
        }
        this.applyCare(x, y, 10, 14, 1, 'Buddy leans into the attention.');
        break;
      }
      case 'treat': {
        for (const b of buddies) {
          Body.applyForce(b, b.position, { x: (Math.random() - 0.5) * 0.002, y: -0.004 });
        }
        this.applyCare(x, y, 15, 18, 4, 'Snack accepted. Trust climbs.');
        break;
      }
      case 'grenade': {
        this.spawnExplosion(x, y, 30);
        this.spawnMoneyPopup(x, y - 30, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'pistol': {
        const head = buddies.find(b => b.label === 'buddy-head') || buddies[0];
        const dir = Vector.normalise(Vector.sub(head.position, { x: this.mousePos.x, y: this.mousePos.y }));
        const power = 0.06;
        Body.applyForce(head, head.position, { x: dir.x * power, y: dir.y * power - power * 0.15 });
        this.applyDamage(item.damage);
        this.spawnParticles(this.mousePos.x, this.mousePos.y, '#ffdd00', 8);
        this.spawnParticles(this.mousePos.x, this.mousePos.y, '#ffffff', 4);
        this.spawnParticles(head.position.x, head.position.y, '#ff8800', 6);
        this.state.screenshake = Math.min(this.state.screenshake + 3, 8);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'shotgun': {
        for (let i = 0; i < 5; i++) {
          const target = buddies[Math.floor(Math.random() * buddies.length)];
          const spreadX = (Math.random() - 0.5) * 0.025;
          const spreadY = (Math.random() - 0.5) * 0.025;
          const dir = Vector.normalise(Vector.sub(target.position, {
            x: x + (Math.random() - 0.5) * 50,
            y: y + (Math.random() - 0.5) * 50,
          }));
          Body.applyForce(target, target.position, {
            x: dir.x * 0.06 + spreadX,
            y: dir.y * 0.06 + spreadY - 0.015,
          });
        }
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#ff8800', 20);
        this.spawnParticles(x, y, '#ffcc00', 10);
        this.state.screenshake = Math.min(this.state.screenshake + 6, 12);
        this.spawnMoneyPopup(x, y - 30, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'machinegun': {
        const target = buddies[Math.floor(Math.random() * buddies.length)];
        const dir = Vector.normalise(Vector.sub(target.position, { x: this.mousePos.x, y: this.mousePos.y }));
        Body.applyForce(target, target.position, { x: dir.x * 0.03, y: dir.y * 0.03 - 0.005 });
        this.applyDamage(item.damage);
        this.spawnParticles(this.mousePos.x + (Math.random() - 0.5) * 8, this.mousePos.y + (Math.random() - 0.5) * 8, '#ffdd00', 4);
        this.state.screenshake = Math.min(this.state.screenshake + 1, 6);
        break;
      }
      case 'flamethrower': {
        for (const b of buddies) {
          Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.008,
            y: -0.018 - Math.random() * 0.012,
          });
        }
        this.applyDamage(Math.max(1, Math.floor(item.damage / 3)));
        this.spawnParticles(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 20, '#ff4400', 10);
        this.spawnParticles(x + (Math.random() - 0.5) * 35, y + (Math.random() - 0.5) * 10, '#ffaa00', 6);
        this.state.mood = 'scared';
        this.state.moodTimer = 20;
        break;
      }
      case 'missile': {
        this.spawnExplosion(x, y, 55);
        this.state.screenshake = Math.min(this.state.screenshake + 12, 18);
        this.spawnMoneyPopup(x, y - 30, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'bowling': {
        for (const b of buddies) {
          const d = Vector.magnitude(Vector.sub(b.position, { x, y }));
          if (d < 110) {
            const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
            Body.applyForce(b, b.position, { x: dir.x * 0.08, y: dir.y * 0.08 - 0.06 });
          }
        }
        this.applyDamage(item.damage);
        this.state.screenshake = Math.min(this.state.screenshake + 8, 14);
        this.spawnParticles(x, y, '#555555', 15);
        this.spawnParticles(x, y, '#888888', 10);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'fireball': {
        for (const b of buddies) {
          const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
          Body.applyForce(b, b.position, {
            x: dir.x * 0.006 * item.damage,
            y: dir.y * 0.006 * item.damage - 0.02,
          });
        }
        this.applyDamage(item.damage);
        this.spawnParticles(x + (Math.random() - 0.5) * 70, y + (Math.random() - 0.5) * 30, '#ff4400', 20);
        this.spawnParticles(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 20, '#ffdd00', 12);
        this.state.screenshake = Math.min(this.state.screenshake + 4, 10);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'mine': {
        for (const b of buddies) {
          const d = Vector.magnitude(Vector.sub(b.position, { x, y }));
          if (d < 130) {
            Body.applyForce(b, b.position, {
              x: (Math.random() - 0.5) * 0.035,
              y: -0.1 - (130 - d) * 0.0008,
            });
          }
        }
        this.applyDamage(item.damage);
        this.spawnExplosion(x, y, 35);
        this.spawnMoneyPopup(x, y - 30, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'stun': {
        for (const b of buddies) {
          Body.setVelocity(b, { x: 0, y: 0 });
          Body.setAngularVelocity(b, 0);
        }
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#00d4ff', 25);
        this.spawnParticles(x, y, '#ffffff', 12);
        this.state.mood = 'scared';
        this.state.moodTimer = 90;
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'rubberballs': {
        for (let i = 0; i < 5; i++) {
          const bx = x + (Math.random() - 0.5) * 40;
          const by = Math.min(y, ROOM_HEIGHT - 50) + (Math.random() - 0.5) * 20;
          const ball = bd.circle(bx, by, 6 + Math.random() * 5, {
            restitution: 0.9, friction: 0.2, frictionAir: 0.005, density: 0.001, label: 'prop',
          });
          Body.applyForce(ball, ball.position, {
            x: (Math.random() - 0.5) * 0.06,
            y: -0.06 - Math.random() * 0.04,
          });
          World.add(this.engine.world, ball);
          this.props.push(ball);
        }
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#ff6b6b', 8);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'flail': {
        const target = buddies[Math.floor(Math.random() * buddies.length)];
        const dir = Vector.normalise(Vector.sub(target.position, { x, y }));
        Body.applyForce(target, target.position, { x: dir.x * 0.06, y: dir.y * 0.06 - 0.045 });
        Body.setAngularVelocity(target, target.angularVelocity + (Math.random() - 0.5) * 0.4);
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#8e44ad', 14);
        this.state.screenshake = Math.min(this.state.screenshake + 5, 10);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'molotov': {
        this.spawnExplosion(x, y, 30);
        for (let i = 0; i < 20; i++) {
          this.state.particles.push({
            x: x + (Math.random() - 0.5) * 60,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2.5,
            vy: -Math.random() * 4 - 1,
            life: 30 + Math.random() * 30,
            maxLife: 60,
            color: Math.random() < 0.5 ? '#ff4400' : '#ffaa00',
            size: 3 + Math.random() * 4,
          });
        }
        this.applyDamage(item.damage);
        this.state.screenshake = Math.min(this.state.screenshake + 6, 10);
        this.spawnMoneyPopup(x, y - 30, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'gravity': {
        const pullPoint = { x, y };
        for (const b of buddies) {
          const d = Vector.magnitude(Vector.sub(pullPoint, b.position));
          if (d < 250) {
            const dir = Vector.normalise(Vector.sub(pullPoint, b.position));
            Body.applyForce(b, b.position, {
              x: dir.x * 0.05 * (250 / Math.max(d, 20)),
              y: dir.y * 0.05 * (250 / Math.max(d, 20)),
            });
          }
        }
        for (const b of this.props) {
          const d = Vector.magnitude(Vector.sub(pullPoint, b.position));
          if (d < 250) {
            const dir = Vector.normalise(Vector.sub(pullPoint, b.position));
            Body.applyForce(b, b.position, {
              x: dir.x * 0.03 * (250 / Math.max(d, 20)),
              y: dir.y * 0.03 * (250 / Math.max(d, 20)),
            });
          }
        }
        this.spawnParticles(x, y, '#9b59b6', 30);
        this.state.screenshake = Math.min(this.state.screenshake + 2, 6);
        break;
      }
      case 'magicorb': {
        for (const b of buddies) {
          const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
          Body.applyForce(b, b.position, { x: dir.x * 0.09, y: dir.y * 0.09 - 0.07 });
        }
        for (const b of this.props) {
          const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
          Body.applyForce(b, b.position, { x: dir.x * 0.06, y: dir.y * 0.06 });
        }
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#9b59b6', 35);
        this.spawnParticles(x, y, '#ffd700', 20);
        this.state.screenshake = Math.min(this.state.screenshake + 10, 14);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'radio': {
        for (const b of buddies) {
          Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.012,
            y: -0.012 - Math.random() * 0.01,
          });
        }
        this.applyCare(x, y, 12, 20, 10, 'Buddy found the beat. Stress drops.');
        const discoColors = ['#ff6b6b', '#ffd700', '#2ecc71', '#3498db', '#9b59b6'];
        for (let i = 0; i < 25; i++) {
          this.state.particles.push({
            x: x + (Math.random() - 0.5) * 100,
            y: y + (Math.random() - 0.5) * 50,
            vx: (Math.random() - 0.5) * 3.5,
            vy: -Math.random() * 5 - 2,
            life: 40 + Math.random() * 30,
            maxLife: 70,
            color: discoColors[Math.floor(Math.random() * discoColors.length)],
            size: 2 + Math.random() * 3,
          });
        }
        break;
      }
      default: {
        for (const b of buddies) {
          const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
          Body.applyForce(b, b.position, { x: dir.x * 0.03, y: -0.03 });
        }
        this.applyDamage(10);
      }
    }
  }

    // Update

  private updateParticles(): void {
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
      updateAI(this.state.buddyBodies, this.ai);
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
      drawBuddy(this.ctx, this.state.buddyBodies, this.state.baseColor, this.state.mood);
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

