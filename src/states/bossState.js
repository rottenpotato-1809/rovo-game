import { CONFIG } from '../config.js';
import { playAbility, playBossAppear, playDeath, playHit } from '../engine/audio.js';
import { simulateBossFight } from '../systems/battle.js';
import { createPlayerBattleTeam } from '../systems/run.js';
import { createFloatingNumber, ease, TweenSystem, updateFloatingNumbers } from '../ui/animations.js';
import { clear, drawBar, drawBossFog, drawBossSprite, drawDragon, drawPhaseBackground, drawText } from '../ui/renderer.js';
import { getFightPoint } from '../ui/layout.js';

// Play the Eternal Wyrm intro, accelerating defeat montage, and score reveal.
export class BossState {
  constructor(stateManager, game) {
    this.stateManager = stateManager;
    this.game = game;
    this.playerTeam = [];
    this.views = new Map();
    this.events = [];
    this.eventIndex = 0;
    this.eventTimerMs = 0;
    this.score = 0;
    this.bossHp = CONFIG.BOSS_HP;
    this.bossPower = CONFIG.BOSS_ATK_START;
    this.turnsUntilBlast = CONFIG.BOSS_ATTACK_INTERVAL_TURNS;
    this.floaters = [];
    this.tweens = new TweenSystem();
    this.result = null;
    this.run = null;
    this.phase = 'intro';
    this.phaseElapsedMs = 0;
    this.revealScore = 0;
    this.newRecord = false;
  }

  // Simulate a boss fight and prepare immutable display combatants.
  enter(payload) {
    this.run = payload.run;
    const simulationTeam = createPlayerBattleTeam(payload.run.team);
    this.playerTeam = simulationTeam.map(dragon => ({ ...dragon, statuses: [] }));
    this.result = simulateBossFight(simulationTeam);
    this.events = this.result.log;
    this.eventIndex = 0;
    this.eventTimerMs = 0;
    this.score = 0;
    this.bossHp = CONFIG.BOSS_HP;
    this.bossPower = CONFIG.BOSS_ATK_START;
    this.turnsUntilBlast = CONFIG.BOSS_ATTACK_INTERVAL_TURNS;
    this.floaters = [];
    this.tweens = new TweenSystem();
    this.phase = 'intro';
    this.phaseElapsedMs = 0;
    this.revealScore = 0;
    this.newRecord = this.result.totalDamage > this.game.saveData.highScore;
    this.views = new Map();
    playBossAppear();
    this.playerTeam.forEach((dragon, index) => {
      const point = getFightPoint('player', index);
      this.views.set(dragon.instanceId, {
        x: point.x,
        y: point.y,
        baseX: point.x,
        alpha: CONFIG.ARENA_ALIVE_ALPHA,
        scale: CONFIG.ARENA_ALIVE_ALPHA,
        hitFlash: 0,
        rotation: 0,
        fallOffset: 0,
      });
    });
  }

  // Advance boss events, portrait tweens, and combat numbers.
  update(dt) {
    this.tweens.update(dt);
    this.floaters = updateFloatingNumbers(this.floaters, dt);
    this.phaseElapsedMs += dt * 1000;
    if (this.phase === 'intro') {
      if (this.phaseElapsedMs >= CONFIG.BOSS_INTRO_DURATION_MS) this.startPhase('montage');
      return;
    }
    if (this.phase === 'flash') {
      if (this.phaseElapsedMs >= CONFIG.BOSS_FLASH_DURATION_MS) this.startPhase('reveal');
      return;
    }
    if (this.phase === 'reveal') {
      const progress = Math.min(CONFIG.ARENA_ALIVE_ALPHA, this.phaseElapsedMs / CONFIG.BOSS_REVEAL_DURATION_MS);
      this.revealScore = Math.round(this.result.totalDamage * ease(progress, CONFIG.DEFAULT_EASE));
      if (progress >= CONFIG.ARENA_ALIVE_ALPHA) {
        this.revealScore = this.result.totalDamage;
        this.startPhase('complete');
      }
      return;
    }
    if (this.phase !== 'montage') return;
    if (this.eventIndex >= this.events.length) {
      this.score = this.result.totalDamage;
      this.startPhase('flash');
      return;
    }
    this.eventTimerMs += dt * 1000;
    if (this.eventTimerMs < this.getMontageEventDelay()) return;
    this.eventTimerMs = 0;
    this.playEvent(this.events[this.eventIndex]);
    this.eventIndex += 1;
  }

  // Draw the boss arena, live score, combatants, and final reveal.
  render(ctx) {
    clear(ctx);
    drawPhaseBackground(ctx, 'fight');
    drawBossFog(ctx);
    if (this.phase === 'reveal' || this.phase === 'complete') {
      this.renderScoreReveal(ctx);
      return;
    }
    if (this.phase !== 'intro') drawText(ctx, `DAMAGE ${this.score}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.BOSS_SCORE_Y, CONFIG.FONT_SIZE_SCORE, CONFIG.GOLD_COLOR);
    if (this.phase === 'intro' || this.phase === 'montage' || this.phase === 'flash') {
      if (this.phase !== 'intro') {
        drawText(ctx, 'ETERNAL WYRM', CONFIG.FIGHT_BOSS_X, CONFIG.BOSS_NAME_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.BOSS_HP_COLOR);
        drawBar(ctx, CONFIG.BOSS_HP_BAR_X, CONFIG.BOSS_HP_BAR_Y, CONFIG.BOSS_HP_BAR_WIDTH, CONFIG.BOSS_HP_BAR_HEIGHT, this.bossHp / CONFIG.BOSS_HP, CONFIG.BOSS_HP_COLOR);
        drawText(ctx, `POWER ${this.bossPower} | BLAST IN ${this.turnsUntilBlast}`, CONFIG.FIGHT_BOSS_X, CONFIG.BOSS_STATUS_Y, CONFIG.FONT_SIZE_DRAGON_NAME, CONFIG.GOLD_COLOR);
      }
      drawBossSprite(ctx, CONFIG.FIGHT_BOSS_X, CONFIG.FIGHT_BOSS_Y, this.phase === 'intro' ? this.getBossIntroScale() : this.getBossPulseScale());
      this.playerTeam.forEach(dragon => {
        const view = this.views.get(dragon.instanceId);
        if (view) drawDragon(ctx, dragon, view);
      });
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
    if (this.phase === 'intro') {
      drawText(ctx, 'ETERNAL WYRM', CONFIG.CANVAS_WIDTH / 2, CONFIG.BOSS_INTRO_TITLE_Y, CONFIG.FONT_SIZE_TITLE, CONFIG.GOLD_COLOR);
    }
    if (this.phase === 'flash') {
      const progress = Math.min(CONFIG.ARENA_ALIVE_ALPHA, this.phaseElapsedMs / CONFIG.BOSS_FLASH_DURATION_MS);
      ctx.save();
      ctx.globalAlpha = CONFIG.ARENA_ALIVE_ALPHA - progress;
      ctx.fillStyle = CONFIG.BOSS_FLASH_COLOR;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      ctx.restore();
    }
  }

  // Continue to full results after the score reveal.
  handlePointerDown() {
    if (this.phase !== 'complete') return;
    this.stateManager.change('result', {
      run: this.run,
      bossDamage: this.result.totalDamage,
      reachedBoss: true,
    });
  }

  // Reset elapsed timing when the cinematic advances to its next beat.
  startPhase(phase) {
    this.phase = phase;
    this.phaseElapsedMs = 0;
  }

  // Accelerate event playback as the boss montage approaches the wipe.
  getMontageEventDelay() {
    const progress = this.events.length > 0 ? this.eventIndex / this.events.length : CONFIG.ARENA_ALIVE_ALPHA;
    return CONFIG.BOSS_MONTAGE_START_DELAY_MS
      + ((CONFIG.BOSS_MONTAGE_END_DELAY_MS - CONFIG.BOSS_MONTAGE_START_DELAY_MS) * progress);
  }

  // Draw the final count-up over a clean, centered arena reveal.
  renderScoreReveal(ctx) {
    ctx.fillStyle = CONFIG.BOSS_REVEAL_OVERLAY_COLOR;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    drawText(ctx, 'FINAL SCORE', CONFIG.CANVAS_WIDTH / 2, CONFIG.BOSS_REVEAL_LABEL_Y, CONFIG.FONT_SIZE_TITLE, CONFIG.TEXT_PRIMARY);
    drawText(ctx, `${this.revealScore}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.BOSS_REVEAL_SCORE_Y, CONFIG.FONT_SIZE_BOSS_REVEAL_SCORE, CONFIG.GOLD_COLOR);
    if (this.newRecord) drawText(ctx, 'NEW RECORD!', CONFIG.CANVAS_WIDTH / 2, CONFIG.BOSS_REVEAL_RECORD_Y, CONFIG.FONT_SIZE_SCORE, CONFIG.ACCENT_PRIMARY);
    if (this.phase === 'complete') drawText(ctx, 'CLICK TO CONTINUE', CONFIG.CANVAS_WIDTH / 2, CONFIG.BOSS_REVEAL_CONTINUE_Y, CONFIG.FONT_SIZE_HEADER);
  }

  // Grow the boss into frame during the one-second entrance.
  getBossIntroScale() {
    const progress = Math.min(CONFIG.ARENA_ALIVE_ALPHA, this.phaseElapsedMs / CONFIG.BOSS_INTRO_DURATION_MS);
    return CONFIG.BOSS_INTRO_START_SCALE
      + ((CONFIG.ARENA_ALIVE_ALPHA - CONFIG.BOSS_INTRO_START_SCALE) * ease(progress, CONFIG.DEFAULT_EASE));
  }

  // Apply a structured boss event to the playback display.
  playEvent(event) {
    if (event.actorId === 'boss_wyrm' && event.action === 'boss_buff') {
      this.bossPower = event.value;
      this.turnsUntilBlast = CONFIG.BOSS_ATTACK_INTERVAL_TURNS - (event.turn % CONFIG.BOSS_ATTACK_INTERVAL_TURNS);
    }
    if (event.actorId === 'boss_wyrm' && event.action === 'apocalypse_breath') {
      this.turnsUntilBlast = CONFIG.BOSS_ATTACK_INTERVAL_TURNS;
    }
    const actorView = this.views.get(event.actorId);
    if (actorView && event.targetId === 'boss_wyrm') {
      const lungeX = actorView.baseX + CONFIG.ATTACK_LUNGE_DIST;
      this.tweens.add(actorView, 'x', actorView.baseX, lungeX, CONFIG.ATTACK_LUNGE_DURATION, CONFIG.DEFAULT_EASE,
        () => this.tweens.add(actorView, 'x', lungeX, actorView.baseX, CONFIG.ATTACK_RETURN_DURATION));
    }
    if (event.targetId === 'boss_wyrm' && event.value > 0) {
      this.score += event.value;
      this.bossHp = Math.max(0, this.bossHp - event.value);
      const actor = this.playerTeam.find(dragon => dragon.instanceId === event.actorId);
      const elementColor = actor ? CONFIG.ELEMENT_COLORS[actor.element] || CONFIG.DAMAGE_NUMBER_COLOR : CONFIG.DAMAGE_NUMBER_COLOR;
      this.floaters.push(createFloatingNumber(`-${event.value}`, CONFIG.FIGHT_BOSS_X, CONFIG.FIGHT_BOSS_Y, elementColor, {
        size: event.action.includes('ability') ? CONFIG.DAMAGE_FONT_ABILITY : CONFIG.DAMAGE_FONT_BASIC,
        bold: event.action.includes('ability'),
      }));
      if (event.action.includes('ability')) playAbility(actor?.element);
      else playHit();
      return;
    }
    const target = this.playerTeam.find(dragon => dragon.instanceId === event.targetId);
    if (target && event.value > 0 && event.action === 'boss_attack') {
      target.hp = Math.max(0, target.hp - event.value);
      const view = this.views.get(target.instanceId);
      this.floaters.push(createFloatingNumber(`-${event.value}`, view.x, view.y, CONFIG.BOSS_HP_COLOR, { size: CONFIG.DAMAGE_FONT_ABILITY, bold: true }));
      playAbility('shadow');
    }
    if (target && event.action === 'kill') {
      const view = this.views.get(target.instanceId);
      this.tweens.add(view, 'alpha', CONFIG.ARENA_ALIVE_ALPHA, CONFIG.ARENA_DEAD_ALPHA, CONFIG.DEATH_FADE_DURATION);
      this.tweens.add(view, 'rotation', 0, CONFIG.DEATH_FALL_ROTATION, CONFIG.DEATH_FADE_DURATION);
      this.tweens.add(view, 'fallOffset', 0, CONFIG.DEATH_FALL_OFFSET_Y, CONFIG.DEATH_FADE_DURATION);
      playDeath();
    }
  }

  // Pulse harder as the next team-wide blast approaches.
  getBossPulseScale() {
    const now = globalThis.performance ? globalThis.performance.now() : Date.now();
    const charge = (CONFIG.BOSS_ATTACK_INTERVAL_TURNS - this.turnsUntilBlast) / CONFIG.BOSS_ATTACK_INTERVAL_TURNS;
    const wave = (Math.sin(now / CONFIG.BOSS_SPRITE_PULSE_SPEED_MS) + 1) / 2;
    return CONFIG.ARENA_ALIVE_ALPHA + (wave * charge * CONFIG.BOSS_SPRITE_PULSE_SCALE);
  }
}
