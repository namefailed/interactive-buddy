import type { Mood, Particle } from '../types';
import type Matter from 'matter-js';
import { ROOM_WIDTH, ROOM_HEIGHT } from './constants';

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

export function lighten(c: string, p: number): string {
  const n = parseInt(c.replace('#', ''), 16);
  const a = Math.round(2.55 * p);
  return `rgb(${Math.min(255, (n >> 16) + a)},${Math.min(255, ((n >> 8) & 0xff) + a)},${Math.min(255, (n & 0xff) + a)})`;
}

export function darken(c: string, p: number): string {
  const n = parseInt(c.replace('#', ''), 16);
  const a = Math.round(2.55 * p);
  return `rgb(${Math.max(0, (n >> 16) - a)},${Math.max(0, ((n >> 8) & 0xff) - a)},${Math.max(0, (n & 0xff) - a)})`;
}

export function drawRoom(ctx: CanvasRenderingContext2D, screenshake: number): void {
  if (screenshake > 0) {
    ctx.translate((Math.random() - 0.5) * screenshake * 2, (Math.random() - 0.5) * screenshake * 2);
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

export function drawProps(ctx: CanvasRenderingContext2D, props: Matter.Body[]): void {
  for (const p of props) {
    const r = p.circleRadius;
    if (r) {
      const g = ctx.createRadialGradient(p.position.x - 3, p.position.y - 3, 2, p.position.x, p.position.y, r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, '#e0e0e0');
      g.addColorStop(1, '#999999');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      const w = 36, h = 36;
      const x = p.position.x - w / 2, y = p.position.y - h / 2;
      ctx.fillStyle = '#8B6914';
      roundRect(ctx, x, y, w, h, 3);
      ctx.fill();
      ctx.strokeStyle = '#6B4F12';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, w, h, 3);
      ctx.stroke();
      ctx.strokeStyle = '#6B4F12';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, y); ctx.lineTo(x + w * 0.5, y + h);
      ctx.moveTo(x, y + h * 0.5); ctx.lineTo(x + w, y + h * 0.5);
      ctx.stroke();
    }
  }
}

function drawFace(ctx: CanvasRenderingContext2D, x: number, y: number, mood: Mood): void {
  ctx.save();

  const glow = mood === 'happy' ? '#2ecc7133' : mood === 'angry' ? '#e74c3c33' : mood === 'scared' ? '#9b59b633' : 'transparent';
  if (glow !== 'transparent') {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 25;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const eyeOff = 8;
  const eyeY = y - 3;
  const eyeScale = 1.3;

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x - eyeOff, eyeY, 5.5 * eyeScale, 6.5 * eyeScale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + eyeOff, eyeY, 5.5 * eyeScale, 6.5 * eyeScale, 0, 0, Math.PI * 2);
  ctx.fill();

  const px = mood === 'scared' ? 2 : mood === 'angry' ? -1.5 : 0;
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(x - eyeOff + px, eyeY, 3, 0, Math.PI * 2);
  ctx.arc(x + eyeOff + px, eyeY, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - eyeOff + px - 0.8, eyeY - 1, 1.2, 0, Math.PI * 2);
  ctx.arc(x + eyeOff + px - 0.8, eyeY - 1, 1.2, 0, Math.PI * 2);
  ctx.fill();

  if (mood === 'scared') {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - eyeOff - 1, eyeY - 1.5, 1, 0, Math.PI * 2);
    ctx.arc(x + eyeOff - 1, eyeY - 1.5, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  switch (mood) {
    case 'happy':
      ctx.arc(x, y + 8, 10, 0.15, Math.PI - 0.15);
      break;
    case 'sad':
      ctx.arc(x, y + 22, 10, Math.PI + 0.3, Math.PI * 2 - 0.3);
      break;
    case 'angry':
      ctx.moveTo(x - 10, y + 11);
      ctx.lineTo(x, y + 4);
      ctx.lineTo(x + 10, y + 11);
      break;
    case 'scared':
      ctx.arc(x, y + 13, 8, 0, Math.PI * 2);
      break;
    default:
      ctx.moveTo(x - 7, y + 7);
      ctx.lineTo(x + 7, y + 7);
  }
  ctx.stroke();

  if (mood === 'angry') {
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - eyeOff - 7, eyeY - 9);
    ctx.lineTo(x - eyeOff + 2, eyeY - 4);
    ctx.moveTo(x + eyeOff + 7, eyeY - 9);
    ctx.lineTo(x + eyeOff - 2, eyeY - 4);
    ctx.stroke();
  }

  if (mood === 'sad') {
    ctx.fillStyle = 'rgba(52,152,219,0.25)';
    ctx.beginPath();
    ctx.arc(x - eyeOff, eyeY + 12, 4, 0, Math.PI * 2);
    ctx.arc(x + eyeOff, eyeY + 12, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawBuddy(ctx: CanvasRenderingContext2D, parts: Matter.Body[], color: string, mood: Mood): void {
  const torso = parts.find(p => p.label === 'buddy-torso');
  const head = parts.find(p => p.label === 'buddy-head');

  ctx.save();

  const floorGlow = ctx.createRadialGradient(400, ROOM_HEIGHT - 30, 10, 400, ROOM_HEIGHT - 30, 120);
  floorGlow.addColorStop(0, `${color}22`);
  floorGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = floorGlow;
  ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

  if (head && torso) {
    ctx.strokeStyle = darken(color, 30);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(head.position.x, head.position.y + 14);
    ctx.lineTo(torso.position.x, torso.position.y - 14);
    ctx.stroke();
  }

  for (const part of parts) {
    if (part.label === 'buddy-head') continue;
    if (torso && part.label !== 'buddy-torso') {
      ctx.strokeStyle = darken(color, 30);
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(torso.position.x, torso.position.y);
      ctx.lineTo(part.position.x, part.position.y);
      ctx.stroke();
    }
  }

  for (const part of parts) {
    const verts = part.vertices;
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let j = 1; j < verts.length; j++) ctx.lineTo(verts[j].x, verts[j].y);
    ctx.closePath();

    const cr = part.circleRadius;
    if (cr) {
      const g = ctx.createRadialGradient(
        part.position.x - cr * 0.3, part.position.y - cr * 0.3, 2,
        part.position.x, part.position.y, cr,
      );
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, lighten(color, 30));
      g.addColorStop(0.75, color);
      g.addColorStop(1, darken(color, 25));
      ctx.fillStyle = g;
      ctx.fill();
    } else {
      const bw = part.bounds.max.x - part.bounds.min.x;
      const bh = part.bounds.max.y - part.bounds.min.y;
      const g = ctx.createRadialGradient(
        part.position.x - bw * 0.15, part.position.y - bh * 0.15, 2,
        part.position.x, part.position.y, Math.max(bw, bh) * 0.7,
      );
      g.addColorStop(0, lighten(color, 45));
      g.addColorStop(0.4, color);
      g.addColorStop(1, darken(color, 30));
      ctx.fillStyle = g;
      ctx.fill();
    }

    ctx.strokeStyle = darken(color, 50);
    ctx.lineWidth = cr ? 2 : 2.5;
    ctx.stroke();
  }

  ctx.restore();

  if (head) drawFace(ctx, head.position.x, head.position.y, mood);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
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

export function drawMoneyPopups(ctx: CanvasRenderingContext2D, popups: { x: number; y: number; text: string; life: number }[]): void {
  for (const p of popups) {
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

export function drawMoodIndicator(ctx: CanvasRenderingContext2D, mood: Mood): void {
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

  ctx.fillStyle = moodColors[mood];
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
  ctx.fillText(emojis[mood], x, y + 1);
}

export function drawHUD(ctx: CanvasRenderingContext2D, money: number, health: number, activeItemName: string): void {
  const pad = 12;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRect(ctx, ROOM_WIDTH - 170, pad, 158, 34, 8);
  ctx.fill();

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`$${Math.floor(money)}`, ROOM_WIDTH - 20, pad + 17);

  ctx.fillStyle = health > 30 ? '#2ecc71' : '#e74c3c';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`❤ ${Math.max(0, Math.floor(health))}`, ROOM_WIDTH - 162, pad + 17);

  const hpPct = health / 100;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, ROOM_WIDTH - 162, pad + 22, 140, 5, 3);
  ctx.fill();
  ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
  roundRect(ctx, ROOM_WIDTH - 162, pad + 22, 140 * hpPct, 5, 3);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`🔧 ${activeItemName}`, ROOM_WIDTH / 2, ROOM_HEIGHT - 8);
}
