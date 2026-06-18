import { CONFIG } from '../config.js';
import { TweenSystem, createFloatingNumber, updateFloatingNumbers } from '../ui/animations.js';
import { clear, drawArenaBackdrop, drawCircle, drawDragon, drawText } from '../ui/renderer.js';
import { getFightPoint } from '../ui/layout.js';

// Play a simulated battle log back as animated canvas combat.
export class FightState {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.tweens = new TweenSystem();
    this.playerTeam = [];
    this.enemyTeam = [];
    this.combatLog = [];
    this.floaters = [];
    this.eventIndex = 0;
    this.eventTimerMs = 0;
    this.outcome = '';
    this.result = null;
    this.onComplete = null;
  }

  // Load a fresh battle result and create visual state for each combatant.
  enter(payload) {
    this.playerTeam = payload.playerTeam;
    this.enemyTeam = payload.enemyTeam;
    this.result = payload.result;
    this.onComplete = payload.onComplete || null;
    this.events = payload.result.log;
    this.outcome = payload.result.outcome;
    this.combatLog = [];
    this.floaters = [];
    this.eventIndex = 0;
    this.eventTimerMs = 0;
    this.tweens = new TweenSystem();
    this.views = new Map();
    [...this.playerTeam, ...this.enemyTeam].forEach((dragon, index) => {
      const teamIndex = index % CONFIG.TEAM_SIZE;
      const point = getFightPoint(dragon.team, teamIndex);
      this.views.set(dragon.instanceId, {
        x: point.x,
        y: point.y,
        baseX: point.x,
        baseY: point.y,
        alpha: CONFIG.ARENA_ALIVE_ALPHA,
        glow: 0,
      });
    });
  }

  // Advance battle playback, tweens, and floating text.
  update(dt) {
    this.tweens.update(dt);
    this.floaters = updateFloatingNumbers(this.floaters, dt);
    if (this.eventIndex >= this.events.length) return;
    this.eventTimerMs += dt * 1000;
    if (this.eventTimerMs < CONFIG.TURN_DELAY_MS) return;
    this.eventTimerMs = 0;
    this.playEvent(this.events[this.eventIndex]);
    this.eventIndex += 1;
  }

  // Draw the fight state.
  render(ctx) {
    clear(ctx);
    drawArenaBackdrop(ctx);
    const isFinished = this.eventIndex >= this.events.length;
    if (!isFinished) {
      drawText(ctx, 'YOUR TEAM', CONFIG.FIGHT_PLAYER_X, CONFIG.ARENA_TEAM_LABEL_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_SECONDARY);
      drawText(ctx, 'ENEMY', CONFIG.FIGHT_ENEMY_X, CONFIG.ARENA_TEAM_LABEL_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_SECONDARY);
    }
    drawText(ctx, 'VS', CONFIG.ARENA_VS_X, CONFIG.FIGHT_Y_POSITIONS[1], CONFIG.FONT_SIZE_TITLE, CONFIG.ACCENT_PRIMARY);
    [...this.playerTeam, ...this.enemyTeam].forEach(dragon => this.renderDragon(ctx, dragon));
    this.renderFloaters(ctx);
    this.renderCombatLog(ctx);
    if (isFinished) {
      ctx.fillStyle = CONFIG.HEADER_BG_COLOR;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.ARENA_RESULT_PANEL_HEIGHT);
      drawText(ctx, this.outcome.toUpperCase(), CONFIG.CANVAS_WIDTH / 2, CONFIG.ARENA_RESULT_Y, CONFIG.FONT_SIZE_SCORE, this.outcome === 'win' ? CONFIG.HP_BAR_FULL : CONFIG.HP_BAR_LOW);
      drawText(ctx, 'CLICK TO CONTINUE', CONFIG.CANVAS_WIDTH / 2, CONFIG.ARENA_RESULT_Y + CONFIG.BUTTON_HEIGHT, CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_PRIMARY);
    }
  }

  // Continue to the next run state after playback finishes.
  handlePointerDown() {
    if (this.eventIndex < this.events.length || !this.onComplete) return;
    this.onComplete(this.result);
  }

  // Draw one combatant with its optional ability glow.
  renderDragon(ctx, dragon) {
    const view = this.views.get(dragon.instanceId);
    if (!view) return;
    if (view.glow > 0) {
      drawCircle(
        ctx,
        view.x,
        view.y,
        CONFIG.DRAGON_RADIUS_FIGHT * CONFIG.ARENA_ABILITY_GLOW_RADIUS_MULTIPLIER,
        CONFIG.GOLD_COLOR,
        view.glow * CONFIG.ARENA_ABILITY_GLOW_ALPHA,
      );
    }
    drawDragon(ctx, dragon, view);
  }

  // Draw active floating combat numbers.
  renderFloaters(ctx) {
    this.floaters.forEach(number => {
      ctx.save();
      ctx.globalAlpha = number.alpha;
      drawText(ctx, number.text, number.x, number.y, CONFIG.DAMAGE_FLOAT_FONT_SIZE, number.color);
      ctx.restore();
    });
  }

  // Draw the newest combat log lines near the bottom.
  renderCombatLog(ctx) {
    ctx.fillStyle = CONFIG.HEADER_BG_COLOR;
    ctx.fillRect(0, CONFIG.COMBAT_LOG_Y - CONFIG.ARENA_LOG_LINE_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.ARENA_LOG_BG_HEIGHT);
    const visible = this.combatLog.slice(-CONFIG.COMBAT_LOG_MAX_LINES);
    visible.forEach((line, index) => {
      drawText(
        ctx,
        line,
        CONFIG.ARENA_LOG_X,
        CONFIG.COMBAT_LOG_Y + (index * CONFIG.ARENA_LOG_LINE_HEIGHT),
        CONFIG.FONT_SIZE_COMBAT_LOG,
        CONFIG.TEXT_PRIMARY,
        'left',
      );
    });
  }

  // Apply one battle event to the visible arena.
  playEvent(event) {
    const actor = this.findDragon(event.actorId);
    const target = this.findDragon(event.targetId);
    if (actor) this.animateActor(actor, event);
    if (target && event.value > 0) this.applyValueToTarget(target, event);
    if (event.action === 'kill' && target) this.fadeDragon(target);
    this.combatLog.push(this.describeEvent(event));
  }

  // Find a combatant by battle instance id.
  findDragon(instanceId) {
    return [...this.playerTeam, ...this.enemyTeam].find(dragon => dragon.instanceId === instanceId);
  }

  // Animate attacks as lunges and abilities as a short glow.
  animateActor(actor, event) {
    const view = this.views.get(actor.instanceId);
    if (!view) return;
    const isAbility = event.action.includes('ability')
      || event.action.includes('heal')
      || event.action.includes('taunt')
      || event.action.includes('shield')
      || event.action.includes('stun');
    if (isAbility) {
      this.tweens.add(view, 'glow', CONFIG.ARENA_FLOAT_ALPHA, 0, CONFIG.ABILITY_GLOW_DURATION, 'linear');
    } else if (event.action.includes('basic_attack')) {
      const direction = actor.team === 'player'
        ? CONFIG.ARENA_LUNGE_DIRECTION_RIGHT
        : CONFIG.ARENA_LUNGE_DIRECTION_LEFT;
      const lungeX = view.baseX + (CONFIG.ATTACK_LUNGE_DIST * direction);
      this.tweens.add(
        view,
        'x',
        view.baseX,
        lungeX,
        CONFIG.ATTACK_LUNGE_DURATION,
        CONFIG.DEFAULT_EASE,
        () => this.tweens.add(view, 'x', lungeX, view.baseX, CONFIG.ATTACK_RETURN_DURATION),
      );
    }
  }

  // Apply damage or healing to the visual dragon snapshot.
  applyValueToTarget(target, event) {
    const view = this.views.get(target.instanceId);
    if (!view) return;
    if (event.action.includes('heal')) {
      target.hp = Math.min(target.maxHp, target.hp + event.value);
      this.floaters.push(createFloatingNumber(`+${event.value}`, view.x, view.y, CONFIG.HEAL_NUMBER_COLOR));
      return;
    }
    target.hp = Math.max(0, target.hp - event.value);
    this.floaters.push(createFloatingNumber(`-${event.value}`, view.x, view.y, CONFIG.DAMAGE_NUMBER_COLOR));
  }

  // Fade out a defeated dragon.
  fadeDragon(target) {
    const view = this.views.get(target.instanceId);
    if (!view) return;
    this.tweens.add(view, 'alpha', CONFIG.ARENA_ALIVE_ALPHA, CONFIG.ARENA_DEAD_ALPHA, CONFIG.DEATH_FADE_DURATION);
  }

  // Convert a structured battle event into a short combat log line.
  describeEvent(event) {
    if (event.action === 'kill') return `${event.targetName} falls`;
    if (event.action.includes('heal')) return `${event.actorName} heals ${event.targetName} for ${event.value}`;
    if (event.action.includes('ability')) return `${event.actorName} casts on ${event.targetName} for ${event.value}`;
    if (event.action.includes('basic_attack')) return `${event.actorName} hits ${event.targetName} for ${event.value}`;
    if (event.targetName) return `${event.actorName} ${event.action} ${event.targetName}`;
    return `${event.actorName} ${event.action}`;
  }
}
