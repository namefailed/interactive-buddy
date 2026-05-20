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

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, ROOM_HEIGHT);
  grad.addColorStop(0, '#05080f');
  grad.addColorStop(1, '#020409');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

  // Subtle center glow
  const backGlow = ctx.createRadialGradient(ROOM_WIDTH * 0.5, ROOM_HEIGHT * 0.45, 20, ROOM_WIDTH * 0.5, ROOM_HEIGHT * 0.45, 340);
  backGlow.addColorStop(0, 'rgba(124, 58, 237, 0.08)');
  backGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = backGlow;
  ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

  // Subtle grid
  ctx.fillStyle = 'rgba(255,255,255,0.018)';
  for (let x = 0; x < ROOM_WIDTH; x += 50) ctx.fillRect(x, 0, 1, ROOM_HEIGHT);
  for (let y = 0; y < ROOM_HEIGHT; y += 50) ctx.fillRect(0, y, ROOM_WIDTH, 1);

  // Floor
  const floor = ctx.createLinearGradient(0, ROOM_HEIGHT - 100, 0, ROOM_HEIGHT);
  floor.addColorStop(0, '#0f1829');
  floor.addColorStop(1, '#080d18');
  ctx.fillStyle = floor;
  ctx.fillRect(0, ROOM_HEIGHT - 100, ROOM_WIDTH, 100);

  // Floor line
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, ROOM_HEIGHT - 100);
  ctx.lineTo(ROOM_WIDTH, ROOM_HEIGHT - 100);
  ctx.stroke();

  // Vignette — darkens corners, makes it feel like a lit stage
  const vignette = ctx.createRadialGradient(
    ROOM_WIDTH * 0.5, ROOM_HEIGHT * 0.5, ROOM_HEIGHT * 0.1,
    ROOM_WIDTH * 0.5, ROOM_HEIGHT * 0.5, ROOM_WIDTH * 0.75
  );
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
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

  const drawConnections = () => {
    if (!head || !torso) return;
    
    // Neck
    ctx.beginPath(); 
    ctx.moveTo(head.position.x, head.position.y + 10); 
    ctx.lineTo(torso.position.x, torso.position.y - 10); 
    ctx.stroke();

    for (const part of parts) {
      if (part.label === 'buddy-head' || part.label === 'buddy-torso' || part.label === 'buddy-ear') continue;
      // Limbs to torso
      ctx.beginPath(); 
      ctx.moveTo(torso.position.x, torso.position.y); 
      ctx.lineTo(part.position.x, part.position.y); 
      ctx.stroke();
    }

    // Ears to head
    const ears = parts.filter(p => p.label === 'buddy-ear');
    for (const ear of ears) {
      ctx.beginPath(); 
      ctx.moveTo(head.position.x, head.position.y); 
      ctx.lineTo(ear.position.x, ear.position.y); 
      ctx.stroke();
    }
  };

  const drawShapes = (isStroke: boolean) => {
    for (const part of parts) {
      const cr = part.circleRadius;
      ctx.beginPath();
      if (cr) {
        ctx.arc(part.position.x, part.position.y, cr, 0, Math.PI * 2);
      } else {
        const verts = part.vertices;
        ctx.moveTo(verts[0].x, verts[0].y);
        for (let j = 1; j < verts.length; j++) ctx.lineTo(verts[j].x, verts[j].y);
        ctx.closePath();
      }
      if (isStroke) ctx.stroke();
      else ctx.fill();
    }
  };

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // --- PASS 1: Outline ---
  ctx.strokeStyle = darken(color, 60);
  ctx.lineWidth = 34; // thick connection outlines
  drawConnections();
  ctx.lineWidth = 6;  // shape outlines
  drawShapes(true);

  // --- PASS 2: Solid Fill ---
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 28; // fill connections
  drawConnections();
  drawShapes(false);

  // --- PASS 3: Cute Highlights & Shading ---
  for (const part of parts) {
    const cr = part.circleRadius;
    const size = cr ? cr : (part.bounds.max.x - part.bounds.min.x) * 0.5;
    
    const g = ctx.createRadialGradient(
      part.position.x - size * 0.3, part.position.y - size * 0.3, 2,
      part.position.x, part.position.y, size * 1.5
    );
    g.addColorStop(0, lighten(color, 30));
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, darken(color, 20));

    ctx.fillStyle = g;
    ctx.beginPath();
    if (cr) {
      ctx.arc(part.position.x, part.position.y, cr, 0, Math.PI * 2);
    } else {
      const verts = part.vertices;
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let j = 1; j < verts.length; j++) ctx.lineTo(verts[j].x, verts[j].y);
      ctx.closePath();
    }
    ctx.fill();
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
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.fillText(p.text, p.x, p.y - (1 - a) * 30);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

export function drawActiveItemLabel(ctx: CanvasRenderingContext2D, itemName: string): void {
  const label = itemName;
  ctx.font = '600 11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(label);
  const pw = metrics.width + 20;
  const ph = 22;
  const px = ROOM_WIDTH / 2 - pw / 2;
  const py = ROOM_HEIGHT - 18 - ph / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, px, py, pw, ph, 11);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(148,163,184,0.9)';
  ctx.fillText(label, ROOM_WIDTH / 2, py + ph / 2);
}


