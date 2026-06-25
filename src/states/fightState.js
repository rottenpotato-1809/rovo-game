import { CONFIG } from '../config.js';
import { playAbility, playDeath, playDefeat, playHit, playVictory } from '../engine/audio.js';
import { TweenSystem, createFloatingNumber, updateFloatingNumbers } from '../ui/animations.js';
import {
  clear,
  createAmbientParticles,
  drawAmbientEmbers,
  drawCircle,
  drawDragon,
  drawFitText,
  drawPhaseBackground,
  drawRect,
  drawText,
  updateAmbientParticles,
} from '../ui/renderer.js';
import { getBattleSpeedButtons, getFightPoint, pointInRect } from '../ui/layout.js';
import { createPlaybackSpeedState, getPlaybackEventDelay, getPlaybackMultiplier, setPlaybackSpeedMode, updatePlaybackSpeed } from '../systems/playbackSpeed.js';

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
    this.logScrollOffset = 0;
    this.logDragY = null;
    this.playbackSpeed = createPlaybackSpeedState();
    this.emberParticles = createAmbientParticles(CONFIG.AMBIENT_EMBER_COUNT);
    this.screenShakeMs = 0;
    this.resultSfxPlayed = false;
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
    this.logScrollOffset = 0;
    this.logDragY = null;
    this.playbackSpeed = createPlaybackSpeedState();
    this.screenShakeMs = 0;
    this.resultSfxPlayed = false;
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
        hitFlash: 0,
        hitOffset: 0,
        scale: CONFIG.ARENA_ALIVE_ALPHA,
      });
    });
  }

  // Advance battle playback, tweens, and floating text.
  update(dt) {
    this.tweens.update(dt);
    this.floaters = updateFloatingNumbers(this.floaters, dt);
    updateAmbientParticles(this.emberParticles, dt, CONFIG.AMBIENT_EMBER_SPEED);
    if (this.screenShakeMs > 0) this.screenShakeMs = Math.max(0, this.screenShakeMs - (dt * 1000));
    if (this.eventIndex >= this.events.length) {
      this.playResultSfx();
      return;
    }
    this.playbackSpeed = updatePlaybackSpeed(this.playbackSpeed, dt);
    this.eventTimerMs += dt * 1000;
    if (this.eventTimerMs < getPlaybackEventDelay(this.playbackSpeed)) return;
    this.eventTimerMs = 0;
    this.playEvent(this.events[this.eventIndex]);
    this.eventIndex += 1;
    if (this.eventIndex >= this.events.length) this.playResultSfx();
  }

  // Draw the fight state.
  render(ctx) {
    clear(ctx);
    drawPhaseBackground(ctx, 'fight');
    drawAmbientEmbers(ctx, this.emberParticles);
    ctx.save();
    if (this.screenShakeMs > 0) {
      const shake = (this.screenShakeMs / CONFIG.SHAKE_DURATION) * CONFIG.SHAKE_INTENSITY;
      ctx.translate((Math.random() - CONFIG.ARENA_HP_HIGH_THRESHOLD) * shake, (Math.random() - CONFIG.ARENA_HP_HIGH_THRESHOLD) * shake);
    }
    const isFinished = this.eventIndex >= this.events.length;
    if (!isFinished) {
      drawText(ctx, 'YOUR TEAM', CONFIG.FIGHT_PLAYER_X, CONFIG.ARENA_TEAM_LABEL_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_SECONDARY);
      drawText(ctx, 'ENEMY', CONFIG.FIGHT_ENEMY_X, CONFIG.ARENA_TEAM_LABEL_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_SECONDARY);
      this.renderSpeedControl(ctx);
    }
    [...this.playerTeam, ...this.enemyTeam].forEach(dragon => this.renderDragon(ctx, dragon));
    this.renderFloaters(ctx);
    this.renderCombatLog(ctx);
    if (isFinished) {
      drawRect(ctx, this.getResultPanel(), CONFIG.UI_PANEL_COLOR, CONFIG.TEXT_PRIMARY);
      drawText(ctx, this.outcome.toUpperCase(), CONFIG.CANVAS_WIDTH / 2, CONFIG.ARENA_RESULT_Y, CONFIG.FONT_SIZE_FIGHT_RESULT, this.outcome === 'win' ? CONFIG.HP_BAR_FULL : CONFIG.HP_BAR_LOW);
      drawText(ctx, 'CLICK TO CONTINUE', CONFIG.CANVAS_WIDTH / 2, CONFIG.ARENA_RESULT_CONTINUE_Y, CONFIG.FONT_SIZE_BODY, CONFIG.TEXT_SECONDARY);
    }
    ctx.restore();
  }

  // Continue to the next run state after playback finishes.
  handlePointerDown(point) {
    if (this.isPointInCombatLog(point)) {
      this.logDragY = point.y;
      return;
    }
    if (this.eventIndex < this.events.length) {
      const speedButton = getBattleSpeedButtons().find(button => pointInRect(point, button));
      if (speedButton) this.playbackSpeed = setPlaybackSpeedMode(this.playbackSpeed, speedButton.mode);
      return;
    }
    if (this.onComplete) this.onComplete(this.result);
  }

  // Scroll the combat log by dragging inside its panel.
  handlePointerMove(point) {
    if (this.logDragY === null) return;
    const delta = point.y - this.logDragY;
    if (Math.abs(delta) < CONFIG.ARENA_LOG_LINE_HEIGHT) return;
    this.scrollCombatLog(delta > 0 ? CONFIG.COMBAT_LOG_SCROLL_STEP : -CONFIG.COMBAT_LOG_SCROLL_STEP);
    this.logDragY = point.y;
  }

  // Stop a combat-log touch drag.
  handlePointerUp() {
    this.logDragY = null;
  }

  // Scroll the combat log with the mouse wheel when the pointer is over it.
  handleWheel(point, deltaY) {
    if (!this.isPointInCombatLog(point)) return;
    this.scrollCombatLog(deltaY < 0 ? CONFIG.COMBAT_LOG_SCROLL_STEP : -CONFIG.COMBAT_LOG_SCROLL_STEP);
  }

  // Draw a segmented AUTO/1x/2x/3x playback selector above the battlefield.
  renderSpeedControl(ctx) {
    getBattleSpeedButtons().forEach(button => {
      const selected = button.mode === this.playbackSpeed.mode;
      const label = button.mode === 'auto' ? 'AUTO' : `${button.mode}X`;
      drawRect(ctx, button, selected ? CONFIG.ACCENT_SECONDARY : CONFIG.UI_PANEL_COLOR, selected ? CONFIG.GOLD_COLOR : CONFIG.TEXT_MUTED);
      drawText(ctx, label, button.x + button.width / 2, button.y + button.height / 2, CONFIG.FONT_SIZE_STATS, selected ? CONFIG.GOLD_COLOR : CONFIG.TEXT_SECONDARY);
    });
    drawText(ctx, `${getPlaybackMultiplier(this.playbackSpeed).toFixed(1)}X`, CONFIG.CANVAS_WIDTH / 2, CONFIG.BATTLE_SPEED_READOUT_Y, CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_SECONDARY);
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
    const animatedView = { ...view, x: view.x + view.hitOffset };
    drawDragon(ctx, dragon, animatedView);
    this.renderAbilityTimer(ctx, dragon, animatedView);
  }

  // Draw readiness or remaining turns for one dragon's special ability.
  renderAbilityTimer(ctx, dragon, view) {
    const isPlayer = dragon.team === 'player';
    const x = view.x + (CONFIG.ARENA_INFO_OFFSET_X * (isPlayer ? -1 : 1));
    const label = dragon.cooldownCurrent <= 0 ? 'ABILITY READY' : `ABILITY IN ${dragon.cooldownCurrent}`;
    drawFitText(
      ctx,
      label,
      x,
      view.y + CONFIG.ARENA_ABILITY_TIMER_OFFSET_Y,
      CONFIG.FONT_SIZE_STATS,
      CONFIG.ARENA_ABILITY_TIMER_WIDTH,
      CONFIG.FONT_SIZE_SMALL,
      dragon.cooldownCurrent <= 0 ? CONFIG.GOLD_COLOR : CONFIG.TEXT_SECONDARY,
      isPlayer ? 'right' : 'left',
    );
  }

  // Draw active floating combat numbers.
  renderFloaters(ctx) {
    this.floaters.forEach(number => {
      ctx.save();
      ctx.globalAlpha = number.alpha;
      ctx.font = `${number.bold ? 'bold ' : ''}${number.size}px ${CONFIG.FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = CONFIG.TEXT_OUTLINE_COLOR;
      ctx.lineWidth = CONFIG.TEXT_OUTLINE_WIDTH;
      ctx.strokeText(number.text, number.x, number.y);
      ctx.fillStyle = number.color;
      ctx.fillText(number.text, number.x, number.y);
      ctx.restore();
    });
  }

  // Draw the newest combat log lines near the bottom.
  renderCombatLog(ctx) {
    drawRect(ctx, this.getCombatLogPanel(), CONFIG.UI_PANEL_COLOR, CONFIG.TEXT_SECONDARY);
    drawText(ctx, 'BATTLE LOG', CONFIG.ARENA_LOG_X, CONFIG.ARENA_LOG_HEADER_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.GOLD_COLOR, 'left');
    const end = Math.max(0, this.combatLog.length - this.logScrollOffset);
    const start = Math.max(0, end - CONFIG.COMBAT_LOG_MAX_LINES);
    const visible = this.combatLog.slice(start, end);
    visible.forEach((line, index) => {
      drawFitText(
        ctx,
        line,
        CONFIG.ARENA_LOG_X,
        CONFIG.COMBAT_LOG_Y + (index * CONFIG.ARENA_LOG_LINE_HEIGHT),
        CONFIG.FONT_SIZE_COMBAT_LOG,
        CONFIG.ARENA_LOG_PANEL_WIDTH - (CONFIG.ARENA_LOG_PANEL_PADDING * 2) - CONFIG.ARENA_LOG_SCROLLBAR_WIDTH,
        CONFIG.FONT_SIZE_SMALL,
        CONFIG.TEXT_PRIMARY,
        'left',
      );
    });
    this.renderCombatLogScrollbar(ctx);
  }

  // Draw a scrollbar thumb that shows the current combat-log history position.
  renderCombatLogScrollbar(ctx) {
    if (this.combatLog.length <= CONFIG.COMBAT_LOG_MAX_LINES) return;
    const trackTop = CONFIG.COMBAT_LOG_Y - (CONFIG.ARENA_LOG_LINE_HEIGHT / 2);
    const trackHeight = CONFIG.ARENA_LOG_PANEL_HEIGHT - (trackTop - CONFIG.ARENA_LOG_PANEL_Y) - CONFIG.ARENA_LOG_PANEL_PADDING;
    const trackX = CONFIG.ARENA_LOG_PANEL_X + CONFIG.ARENA_LOG_PANEL_WIDTH - CONFIG.ARENA_LOG_SCROLLBAR_MARGIN - CONFIG.ARENA_LOG_SCROLLBAR_WIDTH;
    const thumbHeight = Math.max(
      CONFIG.ARENA_LOG_SCROLLBAR_MIN_HEIGHT,
      trackHeight * (CONFIG.COMBAT_LOG_MAX_LINES / this.combatLog.length),
    );
    const maximumOffset = this.combatLog.length - CONFIG.COMBAT_LOG_MAX_LINES;
    const progress = maximumOffset > 0 ? 1 - (this.logScrollOffset / maximumOffset) : 1;
    const thumbY = trackTop + ((trackHeight - thumbHeight) * progress);
    ctx.fillStyle = CONFIG.ARENA_LOG_SCROLLBAR_TRACK_COLOR;
    ctx.fillRect(trackX, trackTop, CONFIG.ARENA_LOG_SCROLLBAR_WIDTH, trackHeight);
    ctx.fillStyle = CONFIG.ARENA_LOG_SCROLLBAR_THUMB_COLOR;
    ctx.fillRect(trackX, thumbY, CONFIG.ARENA_LOG_SCROLLBAR_WIDTH, thumbHeight);
  }

  // Apply one battle event to the visible arena.
  playEvent(event) {
    const actor = this.findDragon(event.actorId);
    const target = this.findDragon(event.targetId);
    if (actor) this.animateActor(actor, event);
    if (target && event.value > 0) this.applyValueToTarget(target, event);
    if (event.action === 'kill' && target) this.fadeDragon(target);
    this.playEventSfx(event, actor);
    this.updateAbilityCooldown(actor, event);
    if (this.logScrollOffset > 0) this.logScrollOffset += 1;
    this.combatLog.push(this.describeEvent(event));
  }

  // Recreate each actor's ability cooldown from structured playback events.
  updateAbilityCooldown(actor, event) {
    if (!actor) return;
    if (this.isAbilityEvent(event.action)) {
      actor.cooldownCurrent = actor.cooldownMax;
      return;
    }
    if (event.action === 'basic_attack') {
      actor.cooldownCurrent = Math.max(0, actor.cooldownCurrent - 1);
    }
  }

  // Return whether an event represents an ability activation or effect.
  isAbilityEvent(action) {
    return action.includes('ability')
      || action.includes('heal')
      || action.includes('taunt')
      || action.includes('shield')
      || action.includes('poison')
      || action.includes('charge');
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
      this.tweens.add(
        view,
        'scale',
        CONFIG.ARENA_ALIVE_ALPHA,
        CONFIG.ABILITY_CAST_SCALE,
        CONFIG.ABILITY_GLOW_DURATION,
        CONFIG.DEFAULT_EASE,
        () => this.tweens.add(view, 'scale', CONFIG.ABILITY_CAST_SCALE, CONFIG.ARENA_ALIVE_ALPHA, CONFIG.ATTACK_RETURN_DURATION),
      );
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
      this.floaters.push(createFloatingNumber(`+${event.value}`, view.x, view.y, CONFIG.HEAL_NUMBER_COLOR, { size: CONFIG.DAMAGE_FONT_BASIC }));
      return;
    }
    if (event.action.includes('shielded')) {
      this.floaters.push(createFloatingNumber(`🛡 ${event.value}`, view.x, view.y, CONFIG.SHIELD_COLOR, { size: CONFIG.DAMAGE_FONT_SHIELD }));
      return;
    }
    const recoilDirection = target.team === 'player'
      ? CONFIG.ARENA_LUNGE_DIRECTION_LEFT
      : CONFIG.ARENA_LUNGE_DIRECTION_RIGHT;
    this.tweens.add(
      view,
      'hitOffset',
      CONFIG.HIT_RECOIL_DISTANCE * recoilDirection,
      0,
      CONFIG.HIT_RECOIL_DURATION,
      CONFIG.DEFAULT_EASE,
    );
    this.tweens.add(view, 'hitFlash', CONFIG.ARENA_ABILITY_GLOW_ALPHA, 0, CONFIG.HIT_FLASH_DURATION, 'linear');
    const critical = target.maxHp > 0 && event.value / target.maxHp > CONFIG.DAMAGE_CRIT_THRESHOLD;
    if (critical) this.screenShakeMs = CONFIG.SHAKE_DURATION;
    target.hp = Math.max(0, target.hp - event.value);
    this.floaters.push(this.createDamageFloater(event, view, target, critical));
  }

  // Create styled floating damage based on combat event type.
  createDamageFloater(event, view, target, critical) {
    const actor = this.findDragon(event.actorId);
    const elementColor = actor ? CONFIG.ELEMENT_COLORS[actor.element] || CONFIG.DAMAGE_NUMBER_COLOR : CONFIG.DAMAGE_NUMBER_COLOR;
    if (critical) {
      return createFloatingNumber(`-${event.value}`, view.x, view.y, elementColor, { size: CONFIG.DAMAGE_FONT_CRIT, bold: true });
    }
    if (event.action.includes('ability')) {
      const aoeIndex = event.action.includes('aoe') ? target.slotIndex || 0 : 0;
      return createFloatingNumber(`-${event.value}`, view.x, view.y, elementColor, {
        size: event.action.includes('aoe') ? CONFIG.DAMAGE_FONT_BASIC : CONFIG.DAMAGE_FONT_ABILITY,
        bold: !event.action.includes('aoe'),
        delayMs: event.action.includes('aoe') ? aoeIndex * CONFIG.DAMAGE_AOE_STAGGER_MS : 0,
      });
    }
    return createFloatingNumber(`-${event.value}`, view.x, view.y, CONFIG.TEXT_PRIMARY, { size: CONFIG.DAMAGE_FONT_BASIC });
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
    const action = event.action.replaceAll('_', ' ');
    if (event.targetName) return `${event.actorName} ${action} ${event.targetName}`;
    return `${event.actorName} ${action}`;
  }

  // Play non-blocking SFX from playback events after browser audio unlock.
  playEventSfx(event, actor) {
    if (event.action === 'kill') {
      playDeath();
      return;
    }
    if (this.isAbilityEvent(event.action) && actor) {
      playAbility(actor.element);
      return;
    }
    if (event.action.includes('basic_attack') && event.value > 0) playHit();
  }

  // Announce the final result once when playback finishes.
  playResultSfx() {
    if (this.resultSfxPlayed) return;
    this.resultSfxPlayed = true;
    if (this.outcome === 'win') playVictory();
    else playDefeat();
  }

  // Clamp a requested combat-log offset to available history.
  scrollCombatLog(change) {
    const maximumOffset = Math.max(0, this.combatLog.length - CONFIG.COMBAT_LOG_MAX_LINES);
    this.logScrollOffset = Math.max(0, Math.min(maximumOffset, this.logScrollOffset + change));
  }

  // Check whether a logical pointer position is inside the combat-log panel.
  isPointInCombatLog(point) {
    const panel = this.getCombatLogPanel();
    return point.x >= panel.x
      && point.x <= panel.x + panel.width
      && point.y >= panel.y
      && point.y <= panel.y + panel.height;
  }

  // Return the configured upper-right combat-log bounds.
  getCombatLogPanel() {
    return {
      x: CONFIG.ARENA_LOG_PANEL_X,
      y: CONFIG.ARENA_LOG_PANEL_Y,
      width: CONFIG.ARENA_LOG_PANEL_WIDTH,
      height: CONFIG.ARENA_LOG_PANEL_HEIGHT,
    };
  }

  // Return the compact completed-fight panel bounds.
  getResultPanel() {
    return {
      x: CONFIG.ARENA_RESULT_PANEL_X,
      y: CONFIG.ARENA_RESULT_PANEL_Y,
      width: CONFIG.ARENA_RESULT_PANEL_WIDTH,
      height: CONFIG.ARENA_RESULT_PANEL_HEIGHT,
    };
  }

}
