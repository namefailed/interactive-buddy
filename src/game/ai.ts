import Matter from 'matter-js';
import { ROOM_HEIGHT } from './constants';

const { Body } = Matter;

export interface AIState {
  walkDir: number;
  walkTimer: number;
  walkPhase: number;
}

export function createAIState(): AIState {
  return { walkDir: 0, walkTimer: 0, walkPhase: 0 };
}

export function updateAI(buddies: Matter.Body[], ai: AIState): void {
  const torso = buddies.find(b => b.label === 'buddy-torso');
  if (!torso) return;

  const floorY = ROOM_HEIGHT - 20;
  const onGround = torso.position.y > floorY - 30;
  const angleError = -torso.angle;
  const isUpright = Math.abs(angleError) < 0.6;

  Body.setAngularVelocity(torso, torso.angularVelocity * 0.9 + angleError * 0.02);

  if (onGround && !isUpright) {
    Body.setAngularVelocity(torso, torso.angularVelocity + angleError * 0.04);
    for (const b of buddies) {
      if (b.label === 'buddy-arm' && b.position.y > floorY - 15) {
        Body.applyForce(b, b.position, { x: (torso.position.x - b.position.x) * 0.0006, y: -0.018 });
      }
    }
  }

  ai.walkTimer--;
  if (ai.walkTimer <= 0) {
    ai.walkDir = Math.random() < 0.65 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    ai.walkTimer = 80 + Math.random() * 140;
  }

  if (ai.walkDir !== 0 && onGround && isUpright) {
    Body.applyForce(torso, torso.position, { x: ai.walkDir * 0.003, y: 0 });
    ai.walkPhase = (ai.walkPhase + 0.07) % (Math.PI * 2);
    for (const b of buddies) {
      if (b.label === 'buddy-leg' && b.position.y > floorY - 15) {
        const wiggle = Math.sin(ai.walkPhase + (b.position.x < torso.position.x ? 0 : Math.PI));
        Body.applyForce(b, b.position, { x: wiggle * 0.002, y: -0.006 - Math.abs(wiggle) * 0.003 });
      }
    }
  }

  for (const b of buddies) {
    if (b.position.y > floorY - 10) {
      if (b.label === 'buddy-leg') {
        Body.applyForce(b, b.position, { x: (torso.position.x - b.position.x) * 0.0003, y: -0.01 });
      } else if (b.label === 'buddy-arm') {
        Body.applyForce(b, b.position, { x: 0, y: -0.008 });
      }
    }
  }
}
