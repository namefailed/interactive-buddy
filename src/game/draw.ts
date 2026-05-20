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
    ctx.translate((Math.random() - 0.5) * screenshake * 1.6, (Math.random() - 0.5) * screenshake * 1.6);
  }

  const grad = ctx.createLinearGradient(0, 0, 0, ROOM_HEIGHT);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

  const backGlow = ctx.createRadialGradient(ROOM_WIDTH * 0.5, ROOM_HEIGHT * 0.45, 20, ROOM_WIDTH * 0.5, ROOM_HEIGHT * 0.45, 400);
  backGlow.addColorStop(0, 'rgba(254,215,170,0.4)');
  backGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = backGlow;
  ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

  ctx.fillStyle = 'rgba(148,163,184,0.08)';
  for (let x = 0; x < ROOM_WIDTH; x += 50) {
    ctx.fillRect(x, 0, 1, ROOM_HEIGHT);
  }
  for (let y = 0; y < ROOM_HEIGHT; y += 50) {
    ctx.fillRect(0, y, ROOM_WIDTH, 1);
  }

  const floor = ctx.createLinearGradient(0, ROOM_HEIGHT - 115, 0, ROOM_HEIGHT);
  floor.addColorStop(0, '#e2e8f0');
  floor.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = floor;
  ctx.fillRect(0, ROOM_HEIGHT - 115, ROOM_WIDTH, 115);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, ROOM_WIDTH - 2, ROOM_HEIGHT - 2);
}

export function drawProps(ctx: CanvasRenderingContext2D, props: Matter.Body[]): void {
  for (const p of props) {
    ctx.save();
    ctx.translate(p.position.x, p.position.y);
    ctx.rotate(p.angle);

    if (p.label === 'prop-treat') {
      ctx.fillStyle = '#2ecc71';
      roundRect(ctx, -10, -5, 20, 10, 4);
      ctx.fill();
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (p.label === 'prop-grenade') {
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-3, -12, 6, 4);
      ctx.strokeStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(3, -13, 3, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.label === 'prop-mine') {
      ctx.fillStyle = '#34495e';
      roundRect(ctx, -12, -4, 24, 8, 2);
      ctx.fill();
      ctx.fillStyle = (Date.now() % 1000 < 500) ? '#e74c3c' : '#c0392b';
      ctx.beginPath();
      ctx.arc(0, -4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.label === 'prop-bowling') {
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(8, -8, 3, 0, Math.PI * 2);
      ctx.arc(15, -2, 3, 0, Math.PI * 2);
      ctx.arc(12, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.label === 'prop-rubberball') {
      const r = p.circleRadius || 10;
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (p.label === 'prop-blackhole') {
      const pulse = 1 + Math.sin(Date.now() / 150) * 0.15;
      
      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 50 * pulse);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.2, '#0f172a');
      grad.addColorStop(0.6, 'rgba(76, 29, 149, 0.4)');
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 50 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 30 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Fallback
      const r = p.circleRadius;
      if (r) {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-18, -18, 36, 36);
      }
    }
    
    ctx.restore();
  }
}

function drawFace(ctx: CanvasRenderingContext2D, x: number, y: number, mood: Mood, isAsleep: boolean): void {
  ctx.save();

  // Cute blush
  if (!isAsleep) {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x - 12, y + 2, 4, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 12, y + 2, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const eyeOff = 8;
  const eyeY = y - 3;
  const eyeScale = 1.4;

  if (isAsleep) {
    // Sleeping eyes
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.arc(x - eyeOff, eyeY + 2, 5, 0, Math.PI, true);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x + eyeOff, eyeY + 2, 5, 0, Math.PI, true);
    ctx.stroke();

    // Zzz's
    const time = Date.now();
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('z', x + 10 + Math.sin(time/500)*5, y - 20 - (time%2000)/100);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Z', x + 20 + Math.sin(time/400)*5, y - 35 - ((time+500)%2000)/100);
    
  } else {
    // Open eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x - eyeOff, eyeY, 5.5 * eyeScale, 6.5 * eyeScale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + eyeOff, eyeY, 5.5 * eyeScale, 6.5 * eyeScale, 0, 0, Math.PI * 2);
    ctx.fill();

    const px = mood === 'scared' ? 2 : mood === 'angry' ? -1.5 : 0;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(x - eyeOff + px, eyeY, 3.5, 0, Math.PI * 2);
    ctx.arc(x + eyeOff + px, eyeY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlights (cute anime glint)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - eyeOff + px - 1, eyeY - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(x + eyeOff + px - 1, eyeY - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - eyeOff + px + 1.5, eyeY + 1.5, 0.8, 0, Math.PI * 2);
    ctx.arc(x + eyeOff + px + 1.5, eyeY + 1.5, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (isAsleep) {
    ctx.arc(x, y + 8, 3, 0, Math.PI * 2);
  } else {
    switch (mood) {
      case 'happy':
        // Cute cat mouth (omega)
        ctx.arc(x - 3, y + 8, 3, 0, Math.PI);
        ctx.arc(x + 3, y + 8, 3, 0, Math.PI);
        break;
      case 'sad':
        ctx.arc(x, y + 14, 5, Math.PI, 0);
        break;
      case 'angry':
        ctx.moveTo(x - 4, y + 9);
        ctx.lineTo(x, y + 6);
        ctx.lineTo(x + 4, y + 9);
        break;
      case 'scared':
        ctx.ellipse(x, y + 10, 3, 5, 0, 0, Math.PI*2);
        break;
      default:
        // Small smile
        ctx.arc(x, y + 7, 4, 0.2, Math.PI - 0.2);
    }
  }
  ctx.stroke();

  if (mood === 'angry' && !isAsleep) {
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - eyeOff - 5, eyeY - 8);
    ctx.lineTo(x - eyeOff + 2, eyeY - 5);
    ctx.moveTo(x + eyeOff + 5, eyeY - 8);
    ctx.lineTo(x + eyeOff - 2, eyeY - 5);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawBuddy(ctx: CanvasRenderingContext2D, parts: Matter.Body[], color: string, mood: Mood, aiStateStr?: string): void {
  const torso = parts.find(p => p.label === 'buddy-torso');
  const head = parts.find(p => p.label === 'buddy-head');

  ctx.save();

  const floorGlow = ctx.createRadialGradient(ROOM_WIDTH/2, ROOM_HEIGHT - 30, 20, ROOM_WIDTH/2, ROOM_HEIGHT - 30, 180);
  floorGlow.addColorStop(0, `${color}44`);
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

  if (head) drawFace(ctx, head.position.x, head.position.y, mood, aiStateStr === 'sleep');
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

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, Math.PI * 2);
  ctx.fill();

  const moodColors: Record<Mood, string> = {
    happy: '#34d399',
    neutral: '#fbbf24',
    sad: '#60a5fa',
    angry: '#f43f5e',
    scared: '#a78bfa',
  };

  ctx.fillStyle = moodColors[mood];
  ctx.beginPath();
  ctx.arc(x, y, r - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labels: Record<Mood, string> = {
    happy: 'YAY',
    neutral: '-_-',
    sad: ';(',
    angry: '>_<',
    scared: 'O_O',
  };
  ctx.fillText(labels[mood], x, y + 1);
}

export function drawHUD(ctx: CanvasRenderingContext2D, money: number, health: number, activeItemName: string): void {
  const pad = 16;

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  roundRect(ctx, ROOM_WIDTH - 180, pad, 160, 40, 12);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(148,163,184,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = '800 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`$${Math.floor(money)}`, ROOM_WIDTH - 24, pad + 20);

  ctx.fillStyle = health > 30 ? '#10b981' : '#f43f5e';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`â ¤ ${Math.max(0, Math.floor(health))}`, ROOM_WIDTH - 170, pad + 20);

  ctx.fillStyle = 'rgba(100,116,139,0.5)';
  ctx.font = '600 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`ðŸ”§ ${activeItemName}`, ROOM_WIDTH / 2, ROOM_HEIGHT - 12);
}

