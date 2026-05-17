import Matter from 'matter-js';
import type { Mood, Particle, GameState, ToolItem } from '../types';
import { ITEMS, DEFAULT_ITEMS } from './items';

const { Engine, World, Bodies, Body, Composite, Vector, Constraint } = Matter;

const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 500;
const WALL_THICKNESS = 20;
const BUDDY_RADIUS = 18;

export interface GameEngineState {
  buddyBodies: Matter.Body[];
  buddyConstraints: Matter.Constraint[];
  mood: Mood;
  money: number;
  health: number;
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
  shootTimer = 0;
  lastTimestamp = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.engine = Engine.create({
      gravity: { x: 0, y: 1.5, scale: 0.001 },
    });

    this.room = this.createRoom();
    this.state = this.createInitialState();
    const { bodies, constraints } = this.createBuddy();
    this.state.buddyBodies = bodies;
    this.state.buddyConstraints = constraints;

    World.add(this.engine.world, [...this.room, ...bodies, ...constraints]);
  }

  private createInitialState(): GameEngineState {
    return {
      buddyBodies: [],
      buddyConstraints: [],
      mood: 'neutral',
      money: 0,
      health: 100,
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

    const opts: Record<string, unknown> = {
      restitution: 0.35,
      friction: 0.4,
      frictionAir: 0.015,
      density: 0.002,
    };

    const head = bd.circle(cx, cy - 55, r * 1.15, { ...opts, label: 'buddy-head', density: 0.0015 });
    const torso = bd.rectangle(cx, cy - 14, r * 1.7, r * 1.5, { ...opts, label: 'buddy-torso', density: 0.003 });
    const leftArm = bd.circle(cx - r - 6, cy - 26, r * 0.55, { ...opts, label: 'buddy-arm' });
    const rightArm = bd.circle(cx + r + 6, cy - 26, r * 0.55, { ...opts, label: 'buddy-arm' });
    const leftLeg = bd.circle(cx - r * 0.45, cy + 28, r * 0.65, { ...opts, label: 'buddy-leg' });
    const rightLeg = bd.circle(cx + r * 0.45, cy + 28, r * 0.65, { ...opts, label: 'buddy-leg' });

    parts.push(head, torso, leftArm, rightArm, leftLeg, rightLeg);

    constraints.push(
      Constraint.create({ bodyA: head, bodyB: torso, stiffness: 0.8, damping: 0.1 }),
      Constraint.create({ bodyA: leftArm, bodyB: torso, stiffness: 0.6, damping: 0.15 }),
      Constraint.create({ bodyA: rightArm, bodyB: torso, stiffness: 0.6, damping: 0.15 }),
      Constraint.create({ bodyA: leftLeg, bodyB: torso, stiffness: 0.7, damping: 0.1 }),
      Constraint.create({ bodyA: rightLeg, bodyB: torso, stiffness: 0.7, damping: 0.1 }),
    );

    return { bodies: parts, constraints };
  }

  // ── Drawing ────────────────────────────────────

  private drawRoom(): void {
    const ctx = this.ctx;
    const shake = this.state.screenshake;
    if (shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * shake * 2,
        (Math.random() - 0.5) * shake * 2,
      );
    }

    const grad = ctx.createLinearGradient(0, 0, 0, ROOM_HEIGHT);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

    for (let x = 0; x < ROOM_WIDTH; x += 40) {
      for (let y = 0; y < ROOM_HEIGHT; y += 40) {
        ctx.fillStyle = (x / 40 + y / 40) % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
        ctx.fillRect(x, y, 40, 40);
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, ROOM_WIDTH - 2, ROOM_HEIGHT - 2);
  }

  private drawBuddy(): void {
    const ctx = this.ctx;
    const parts = this.state.buddyBodies;
    const color = this.state.baseColor;

    for (const part of parts) {
      const verts = part.vertices;
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let j = 1; j < verts.length; j++) ctx.lineTo(verts[j].x, verts[j].y);
      ctx.closePath();

      const r = part.circleRadius || 14;
      const g = ctx.createRadialGradient(
        part.position.x - r * 0.25, part.position.y - r * 0.25, 2,
        part.position.x, part.position.y, r
      );
      g.addColorStop(0, this.lighten(color, 40));
      g.addColorStop(0.7, color);
      g.addColorStop(1, this.darken(color, 20));
      ctx.fillStyle = g;
      ctx.fill();

      ctx.strokeStyle = this.darken(color, 40);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (part.label === 'buddy-arm') {
        ctx.beginPath();
        ctx.arc(part.position.x, part.position.y, (part.circleRadius || 8) * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = this.lighten(color, 20);
        ctx.fill();
      }

      if (part.label === 'buddy-leg') {
        ctx.fillStyle = this.darken(color, 15);
        ctx.beginPath();
        ctx.arc(part.position.x, part.position.y + 2, (part.circleRadius || 10) * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const head = parts.find(p => p.label === 'buddy-head');
    if (head) this.drawFace(head.position.x, head.position.y);
  }

  private drawFace(x: number, y: number): void {
    const ctx = this.ctx;
    const mood = this.state.mood;
    const eyeOff = 7;
    const eyeY = y - 4;

    ctx.save();

    const glow = mood === 'happy' ? '#2ecc7122' : mood === 'angry' ? '#e74c3c22' : 'transparent';
    if (glow !== 'transparent') {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 20;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, eyeY + 4, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x - eyeOff, eyeY, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.ellipse(x + eyeOff, eyeY, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const px = mood === 'scared' ? 1.5 : mood === 'angry' ? -1 : 0;
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(x - eyeOff + px, eyeY, 2.2, 0, Math.PI * 2);
    ctx.arc(x + eyeOff + px, eyeY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (mood === 'scared') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x - eyeOff - 0.5, eyeY - 0.5, 0.8, 0, Math.PI * 2);
      ctx.arc(x + eyeOff - 0.5, eyeY - 0.5, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();

    switch (mood) {
      case 'happy':
        ctx.arc(x, y + 7, 8, 0.15, Math.PI - 0.15);
        break;
      case 'sad':
        ctx.arc(x, y + 18, 8, Math.PI + 0.3, Math.PI * 2 - 0.3);
        break;
      case 'angry':
        ctx.moveTo(x - 8, y + 9);
        ctx.lineTo(x, y + 3);
        ctx.lineTo(x + 8, y + 9);
        break;
      case 'scared':
        ctx.arc(x, y + 11, 6, 0, Math.PI * 2);
        break;
      default:
        ctx.moveTo(x - 6, y + 6);
        ctx.lineTo(x + 6, y + 6);
    }
    ctx.stroke();

    if (mood === 'angry') {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2.5;
      const brow = eyeY - 7;
      ctx.beginPath();
      ctx.moveTo(x - eyeOff - 6, brow + 3);
      ctx.lineTo(x - eyeOff + 2, brow - 2);
      ctx.moveTo(x + eyeOff + 6, brow + 3);
      ctx.lineTo(x + eyeOff - 2, brow - 2);
      ctx.stroke();
    }

    if (mood === 'sad') {
      ctx.fillStyle = 'rgba(52,152,219,0.3)';
      ctx.beginPath();
      ctx.arc(x - eyeOff, eyeY + 10, 3, 0, Math.PI * 2);
      ctx.arc(x + eyeOff, eyeY + 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    for (const p of this.state.particles) {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a * 0.8;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private drawMoneyPopups(): void {
    const ctx = this.ctx;
    for (const p of this.state.moneyPopups) {
      const a = p.life / 40;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.fillText(p.text, p.x, p.y - (1 - a) * 30);
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  private drawHUD(): void {
    const ctx = this.ctx;
    const pad = 12;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.roundRect(ctx, ROOM_WIDTH - 170, pad, 158, 34, 8);
    ctx.fill();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`$${Math.floor(this.state.money)}`, ROOM_WIDTH - 20, pad + 17);

    ctx.fillStyle = this.state.health > 30 ? '#2ecc71' : '#e74c3c';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`❤ ${Math.max(0, Math.floor(this.state.health))}`, ROOM_WIDTH - 162, pad + 17);

    const hpPct = this.state.health / 100;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.roundRect(ctx, ROOM_WIDTH - 162, pad + 22, 140, 5, 3);
    ctx.fill();
    ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
    this.roundRect(ctx, ROOM_WIDTH - 162, pad + 22, 140 * hpPct, 5, 3);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`🔧 ${this.state.activeItem.name}`, ROOM_WIDTH / 2, ROOM_HEIGHT - 8);
  }

  private drawMoodIndicator(): void {
    const ctx = this.ctx;
    const x = 24;
    const y = 24;
    const r = 22;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fill();

    const moodColors: Record<Mood, string> = {
      happy: '#2ecc71',
      neutral: '#f39c12',
      sad: '#3498db',
      angry: '#e74c3c',
      scared: '#9b59b6',
    };

    ctx.fillStyle = moodColors[this.state.mood];
    ctx.beginPath();
    ctx.arc(x, y, r - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const emojis: Record<Mood, string> = {
      happy: '😊',
      neutral: '😐',
      sad: '😢',
      angry: '😠',
      scared: '😨',
    };
    ctx.fillText(emojis[this.state.mood], x, y + 1);
  }

  // ── Particles ───────────────────────────────────

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

  // ── Game logic ──────────────────────────────────

  applyDamage(amount: number): void {
    if (amount <= 0) return;
    this.state.health = Math.max(0, this.state.health - amount);
    const cash = Math.max(1, Math.floor(amount * this.state.activeItem.moneyMultiplier));
    this.state.money += cash;
    this.onMoneyEarned?.(cash);
    this.state.screenshake = Math.min(this.state.screenshake + amount * 0.1, 8);
    this.updateMood(-amount);

    if (this.state.health <= 0) this.respawnBuddy();
  }

  private updateMood(damage: number): void {
    if (damage > 15) this.state.mood = 'angry';
    else if (damage > 5) this.state.mood = 'sad';
    else if (damage < 0) this.state.mood = 'happy';
    else if (Math.random() < 0.1) this.state.mood = 'scared';
    this.state.moodTimer = 90;
    this.emitState();
  }

  private emitState(): void {
    this.onStateChange?.({ money: this.state.money, mood: this.state.mood } as Partial<GameState>);
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
    this.state.screenshake = 10;
    this.spawnParticles(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, '#ffd700', 40);
    this.state.money += 50;
    this.onMoneyEarned?.(50);
    this.emitState();
  }

  // ── Interactions ────────────────────────────────

  private handleInteraction(x: number, y: number): void {
    const item = this.state.activeItem;
    const buddies = this.state.buddyBodies;

    let hit = false;
    for (const b of buddies) {
      if (Matter.Bounds.contains(b.bounds, { x, y })) { hit = true; break; }
    }
    if (!hit) return;

    switch (item.id) {
      case 'fist': {
        for (const b of buddies) {
          const d = Vector.magnitude(Vector.sub(b.position, { x, y }));
          if (d < 60) {
            const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
            Body.applyForce(b, b.position, {
              x: dir.x * 0.025 * (60 / Math.max(d, 15)),
              y: (dir.y * 0.025 - 0.015) * (60 / Math.max(d, 15)),
            });
          }
        }
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#fff', 6);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        this.state.mood = 'angry';
        this.state.moodTimer = 30;
        break;
      }
      case 'tickle': {
        for (const b of buddies) {
          Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.005,
            y: -0.005 - Math.random() * 0.005,
          });
        }
        this.state.mood = 'happy';
        this.state.money += 1;
        this.onMoneyEarned?.(1);
        this.spawnParticles(x, y, '#ffd700', 6);
        this.spawnMoneyPopup(x, y - 20, 1);
        break;
      }
      case 'grenade': {
        this.spawnExplosion(x, y, 28);
        this.spawnMoneyPopup(x, y - 30, 15);
        for (const b of buddies) {
          Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.04,
            y: -0.04 - Math.random() * 0.03,
          });
        }
        break;
      }
      case 'pistol': {
        const head = buddies.find(b => b.label === 'buddy-head') || buddies[0];
        const dir = Vector.normalise(Vector.sub(head.position, this.mousePos));
        const force = 0.003 * item.damage;
        Body.applyForce(head, head.position, { x: dir.x * force, y: dir.y * force - force * 0.3 });
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#ffdd00', 5);
        this.spawnParticles(x, y, '#ff8800', 3);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'shotgun': {
        for (let i = 0; i < 5; i++) {
          const sx = x + (Math.random() - 0.5) * 50;
          const sy = y + (Math.random() - 0.5) * 50;
          const target = buddies[Math.floor(Math.random() * buddies.length)];
          const dir = Vector.normalise(Vector.sub(target.position, { x: sx, y: sy }));
          Body.applyForce(target, target.position, {
            x: dir.x * 0.003 * item.damage,
            y: dir.y * 0.003 * item.damage - 0.002,
          });
        }
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#ff8800', 15);
        this.state.screenshake = Math.min(this.state.screenshake + 4, 10);
        this.spawnMoneyPopup(x, y - 30, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'machinegun': {
        const head = buddies.find(b => b.label === 'buddy-head') || buddies[0];
        const dir = Vector.normalise(Vector.sub(head.position, this.mousePos));
        Body.applyForce(head, head.position, {
          x: dir.x * 0.002 * item.damage,
          y: dir.y * 0.002 * item.damage - 0.001,
        });
        this.applyDamage(item.damage);
        this.spawnParticles(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, '#ffdd00', 3);
        break;
      }
      case 'flamethrower': {
        for (const b of buddies) {
          Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.005,
            y: -0.01 - Math.random() * 0.01,
          });
        }
        this.applyDamage(item.damage);
        this.spawnParticles(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 10, '#ff4400', 8);
        this.spawnParticles(x + (Math.random() - 0.5) * 20, y, '#ffaa00', 5);
        this.state.mood = 'sad';
        break;
      }
      case 'missile': {
        this.spawnExplosion(x, y, 50);
        this.spawnMoneyPopup(x, y - 30, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'bowling': {
        for (const b of buddies) {
          const d = Vector.magnitude(Vector.sub(b.position, { x, y }));
          if (d < 100) {
            const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
            Body.applyForce(b, b.position, {
              x: dir.x * 0.05,
              y: dir.y * 0.05 - 0.04,
            });
          }
        }
        this.applyDamage(item.damage);
        this.state.screenshake = Math.min(this.state.screenshake + 5, 10);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'fireball': {
        const target = buddies[Math.floor(Math.random() * buddies.length)];
        const dir = Vector.normalise(Vector.sub(target.position, { x, y }));
        Body.applyForce(target, target.position, {
          x: dir.x * 0.004 * item.damage,
          y: dir.y * 0.004 * item.damage - 0.01,
        });
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#ff4400', 12);
        this.spawnParticles(x, y, '#ffdd00', 8);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'mine': {
        this.spawnExplosion(x + (Math.random() - 0.5) * 15, y + (Math.random() - 0.5) * 15, 32);
        break;
      }
      case 'stun': {
        for (const b of buddies) {
          Body.setVelocity(b, { x: 0, y: 0 });
          Body.applyForce(b, b.position, { x: (Math.random() - 0.5) * 0.005, y: -0.005 });
        }
        this.applyDamage(10);
        this.spawnParticles(x, y, '#00d4ff', 15);
        this.spawnParticles(x, y, '#fff', 8);
        this.state.mood = 'scared';
        break;
      }
      case 'rubberballs': {
        for (const b of buddies) {
          Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.015,
            y: -0.015 - Math.random() * 0.01,
          });
        }
        this.applyDamage(3);
        this.spawnParticles(x, y, '#ff6b6b', 4);
        break;
      }
      case 'flail': {
        const target = buddies[Math.floor(Math.random() * buddies.length)];
        const dir = Vector.normalise(Vector.sub(target.position, { x, y }));
        Body.applyForce(target, target.position, {
          x: dir.x * 0.04,
          y: dir.y * 0.04 - 0.03,
        });
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#8e44ad', 8);
        this.state.screenshake = Math.min(this.state.screenshake + 3, 8);
        this.spawnMoneyPopup(x, y - 20, Math.floor(item.damage * item.moneyMultiplier));
        break;
      }
      case 'molotov': {
        this.spawnExplosion(x, y, 32);
        this.spawnParticles(x, y, '#ff4400', 20);
        this.state.mood = 'angry';
        break;
      }
      case 'gravity': {
        for (const b of buddies) {
          const dir = Vector.normalise(Vector.sub({ x, y }, b.position));
          Body.applyForce(b, b.position, { x: dir.x * 0.035, y: dir.y * 0.035 });
        }
        this.spawnParticles(x, y, '#9b59b6', 10);
        break;
      }
      case 'magicorb': {
        for (const b of buddies) {
          const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
          Body.applyForce(b, b.position, {
            x: dir.x * 0.06,
            y: dir.y * 0.06 - 0.05,
          });
        }
        this.applyDamage(item.damage);
        this.spawnParticles(x, y, '#9b59b6', 20);
        this.spawnParticles(x, y, '#ffd700', 15);
        this.state.screenshake = Math.min(this.state.screenshake + 6, 10);
        break;
      }
      case 'radio': {
        for (const b of buddies) {
          Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.008,
            y: -0.008 - Math.random() * 0.008,
          });
        }
        this.state.mood = 'happy';
        this.state.money += 5;
        this.onMoneyEarned?.(5);
        this.spawnParticles(x, y, '#ffd700', 10);
        this.spawnParticles(x, y, '#e74c3c', 5);
        this.spawnParticles(x, y, '#3498db', 5);
        break;
      }
      default: {
        for (const b of buddies) {
          const dir = Vector.normalise(Vector.sub(b.position, { x, y }));
          Body.applyForce(b, b.position, { x: dir.x * 0.02, y: -0.02 });
        }
        this.applyDamage(10);
      }
    }
  }

  // ── Update ──────────────────────────────────────

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
        this.state.mood = 'neutral';
        this.emitState();
      }
    }
  }

  // ── Input handlers (public) ────────────────────

  onMouseDown(e: React.MouseEvent<HTMLCanvasElement>): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.isMouseDown = true;
    this.mousePos = { x, y };
    this.handleInteraction(x, y);
  }

  onMouseMove(e: React.MouseEvent<HTMLCanvasElement>): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (this.isMouseDown && this.state.activeItem.id === 'machinegun') {
      this.handleInteraction(this.mousePos.x, this.mousePos.y);
    }
  }

  onMouseUp(): void { this.isMouseDown = false; }

  setActiveItem(itemId: string): void {
    const item = ITEMS.find(i => i.id === itemId);
    if (item && this.state.unlockedItems.includes(itemId)) {
      this.state.activeItem = item;
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

  setSkin(color: string): void { this.state.baseColor = color; }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ── Color helpers ───────────────────────────────

  private lighten(c: string, p: number): string {
    const n = parseInt(c.replace('#', ''), 16);
    const a = Math.round(2.55 * p);
    return `rgb(${Math.min(255, (n >> 16) + a)},${Math.min(255, ((n >> 8) & 0xff) + a)},${Math.min(255, (n & 0xff) + a)})`;
  }

  private darken(c: string, p: number): string {
    const n = parseInt(c.replace('#', ''), 16);
    const a = Math.round(2.55 * p);
    return `rgb(${Math.max(0, (n >> 16) - a)},${Math.max(0, ((n >> 8) & 0xff) - a)},${Math.max(0, (n & 0xff) - a)})`;
  }

  // ── Loop ────────────────────────────────────────

  start(): void {
    this.lastTimestamp = performance.now();
    const loop = (ts: number) => {
      const d = Math.min(ts - this.lastTimestamp, 33);
      this.lastTimestamp = ts;

      Engine.update(this.engine, d);
      this.updateParticles();
      this.updateMoneyPopups();
      this.updateMoodTimer();

      if (this.state.screenshake > 0) this.state.screenshake *= 0.85;
      if (this.state.screenshake < 0.5) this.state.screenshake = 0;

      this.ctx.save();
      this.drawRoom();
      this.drawBuddy();
      this.drawParticles();
      this.drawMoneyPopups();
      this.drawMoodIndicator();
      this.drawHUD();
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

const bd = Bodies as unknown as {
  rectangle: (x: number, y: number, w: number, h: number, opts?: Record<string, unknown>) => Matter.Body;
  circle: (x: number, y: number, r: number, opts?: Record<string, unknown>) => Matter.Body;
};
