import Matter from 'matter-js';
import { ROOM_HEIGHT } from './constants';

const { Body, Vector } = Matter;

export interface AIState {
  state: 'idle' | 'wander' | 'seek_treat' | 'play' | 'sleep';
  walkDir: number;
  timer: number;
  walkPhase: number;
  targetProp: Matter.Body | null;
  idleTicks: number;
}

export function createAIState(): AIState {
  return { state: 'idle', walkDir: 0, timer: 60, walkPhase: 0, targetProp: null, idleTicks: 0 };
}

export function updateAI(buddies: Matter.Body[], ai: AIState, props: Matter.Body[]): void {
  const torso = buddies.find(b => b.label === 'buddy-torso');
  if (!torso) return;

  const floorY = ROOM_HEIGHT - 20;
  const onGround = torso.position.y > floorY - 30;
  const angleError = -torso.angle;
  const isUpright = Math.abs(angleError) < 0.6;

  // Upright balancing (if not sleeping)
  if (ai.state !== 'sleep') {
    Body.setAngularVelocity(torso, torso.angularVelocity * 0.9 + angleError * 0.02);
  } else {
    // Lie down when sleeping
    Body.setAngularVelocity(torso, torso.angularVelocity * 0.9 + (Math.PI/2 - torso.angle) * 0.01);
  }

  // Stand up if fallen and not sleeping
  if (onGround && !isUpright && ai.state !== 'sleep') {
    Body.setAngularVelocity(torso, torso.angularVelocity + angleError * 0.04);
    for (const b of buddies) {
      if (b.label === 'buddy-arm' && b.position.y > floorY - 15) {
        Body.applyForce(b, b.position, { x: (torso.position.x - b.position.x) * 0.0006, y: -0.018 });
      }
    }
  }

  // Scan for props (treats and toys)
  if (onGround && isUpright && ai.state !== 'sleep') {
    const treats = props.filter(p => p.label === 'prop-treat');
    const toys = props.filter(p => p.label === 'prop-rubberball');
    
    if (treats.length > 0) {
      ai.state = 'seek_treat';
      ai.idleTicks = 0;
      let nearest = treats[0];
      let minDist = Vector.magnitude(Vector.sub(nearest.position, torso.position));
      for (let i = 1; i < treats.length; i++) {
        const d = Vector.magnitude(Vector.sub(treats[i].position, torso.position));
        if (d < minDist) {
          minDist = d;
          nearest = treats[i];
        }
      }
      ai.targetProp = nearest;
    } else if (toys.length > 0 && ai.state !== 'seek_treat') {
      ai.state = 'play';
      ai.idleTicks = 0;
      let nearest = toys[0];
      let minDist = Vector.magnitude(Vector.sub(nearest.position, torso.position));
      for (let i = 1; i < toys.length; i++) {
        const d = Vector.magnitude(Vector.sub(toys[i].position, torso.position));
        if (d < minDist) {
          minDist = d;
          nearest = toys[i];
        }
      }
      ai.targetProp = nearest;
    } else if (ai.state === 'seek_treat' || ai.state === 'play') {
      ai.state = 'idle';
      ai.timer = 30;
      ai.targetProp = null;
    }
  }

  ai.timer--;

  if (ai.state === 'idle') {
    ai.idleTicks++;
    if (ai.idleTicks > 900) { // ~30 seconds of pure idle
      ai.state = 'sleep';
      ai.timer = 300;
    }
  } else {
    // Any other state resets sleep timer unless we are sleeping
    if (ai.state !== 'sleep') {
      ai.idleTicks = 0;
    }
  }

  // Waking up if interrupted
  if (ai.state === 'sleep') {
    if (!onGround || Vector.magnitude(torso.velocity) > 2) {
      ai.state = 'idle';
      ai.idleTicks = 0;
      ai.timer = 60;
    }
  }

  if (ai.timer <= 0) {
    if (ai.state === 'idle') {
      ai.state = 'wander';
      ai.walkDir = Math.random() < 0.5 ? -1 : 1;
      ai.timer = 60 + Math.random() * 100;
    } else if (ai.state === 'wander') {
      ai.state = 'idle';
      ai.walkDir = 0;
      ai.timer = 40 + Math.random() * 60;
    } else if (ai.state === 'sleep') {
      // Continue sleeping but maybe toss and turn? Just reset timer.
      ai.timer = 300;
    }
  }

  // Handle states
  let activeDir = 0;
  if (ai.state === 'wander') {
    activeDir = ai.walkDir;
  } else if ((ai.state === 'seek_treat' || ai.state === 'play') && ai.targetProp) {
    const dist = ai.targetProp.position.x - torso.position.x;
    if (Math.abs(dist) > 25) {
      activeDir = dist > 0 ? 1 : -1;
    } else if (ai.state === 'play' && Math.abs(dist) <= 25) {
      // Nudge the toy
      if (Math.random() < 0.1) {
        Body.applyForce(ai.targetProp, ai.targetProp.position, { x: (dist > 0 ? 0.01 : -0.01), y: -0.015 });
        const head = buddies.find(b => b.label === 'buddy-head');
        if (head) Body.applyForce(head, head.position, { x: (dist > 0 ? 0.005 : -0.005), y: 0 });
      }
    }
  } else if (ai.state === 'idle') {
    // Occasional head wobble
    if (Math.random() < 0.02) {
      const head = buddies.find(b => b.label === 'buddy-head');
      if (head) Body.applyForce(head, head.position, { x: (Math.random() - 0.5) * 0.002, y: 0 });
    }
  }

  // Execute walking
  if (activeDir !== 0 && onGround && isUpright && ai.state !== 'sleep') {
    Body.applyForce(torso, torso.position, { x: activeDir * 0.003, y: 0 });
    ai.walkPhase = (ai.walkPhase + 0.1) % (Math.PI * 2);
    for (const b of buddies) {
      if (b.label === 'buddy-leg' && b.position.y > floorY - 15) {
        const wiggle = Math.sin(ai.walkPhase + (b.position.x < torso.position.x ? 0 : Math.PI));
        Body.applyForce(b, b.position, { x: wiggle * 0.002, y: -0.006 - Math.abs(wiggle) * 0.003 });
      }
    }
  }

  // Keep arms/legs somewhat tucked
  for (const b of buddies) {
    if (b.position.y > floorY - 10 && ai.state !== 'sleep') {
      if (b.label === 'buddy-leg') {
        Body.applyForce(b, b.position, { x: (torso.position.x - b.position.x) * 0.0003, y: -0.01 });
      } else if (b.label === 'buddy-arm') {
        Body.applyForce(b, b.position, { x: 0, y: -0.008 });
      }
    }
  }
}
