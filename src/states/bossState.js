import { CONFIG } from '../config.js';
import { simulateBossFight } from '../systems/battle.js';
import { createPlayerBattleTeam } from '../systems/run.js';
import { createFloatingNumber, TweenSystem, updateFloatingNumbers } from '../ui/animations.js';
import { clear, drawBar, drawBossSprite, drawDragon, drawPhaseBackground, drawText } from '../ui/renderer.js';
import { getFightPoint } from '../ui/layout.js';
import { createPlaybackSpeedState, getPlaybackEventDelay, updatePlaybackSpeed } from '../systems/playbackSpeed.js';

// Play back the Eternal Wyrm score fight and reveal the final damage total.
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
    this.playbackSpeed = createPlaybackSpeedState();
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
    this.playbackSpeed = createPlaybackSpeedState();
    this.views = new Map();
    this.playerTeam.forEach((dragon, index) => {
      const point = getFightPoint('player', index);
      this.views.set(dragon.instanceId, {
        x: point.x,
        y: point.y,
        baseX: point.x,
        alpha: CONFIG.ARENA_ALIVE_ALPHA,
        scale: CONFIG.ARENA_ALIVE_ALPHA,
        hitFlash: 0,
      });
    });
  }

  // Advance boss events, portrait tweens, and combat numbers.
  update(dt) {
    this.tweens.update(dt);
    this.floaters = updateFloatingNumbers(this.floaters, dt);
    if (this.eventIndex >= this.events.length) {
      this.score = this.result.totalDamage;
      return;
    }
    this.playbackSpeed = updatePlaybackSpeed(this.playbackSpeed, dt);
    this.eventTimerMs += dt * 1000;
    if (this.eventTimerMs < getPlaybackEventDelay(this.playbackSpeed)) return;
    this.eventTimerMs = 0;
    this.playEvent(this.events[this.eventIndex]);
    this.eventIndex += 1;
  }

  // Draw the boss arena, live score, combatants, and final reveal.
  render(ctx) {
    clear(ctx);
    drawPhaseBackground(ctx, 'fight');
    const isFinished = this.eventIndex >= this.events.length;
    drawText(ctx, `DAMAGE ${this.score}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.BOSS_SCORE_Y, CONFIG.FONT_SIZE_SCORE, CONFIG.GOLD_COLOR);
    if (!isFinished) {
      drawText(ctx, 'ETERNAL WYRM', CONFIG.FIGHT_BOSS_X, CONFIG.BOSS_NAME_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.BOSS_HP_COLOR);
      drawBar(ctx, CONFIG.BOSS_HP_BAR_X, CONFIG.BOSS_HP_BAR_Y, CONFIG.BOSS_HP_BAR_WIDTH, CONFIG.BOSS_HP_BAR_HEIGHT, this.bossHp / CONFIG.BOSS_HP, CONFIG.BOSS_HP_COLOR);
      drawText(ctx, `POWER ${this.bossPower} | BLAST IN ${this.turnsUntilBlast}`, CONFIG.FIGHT_BOSS_X, CONFIG.BOSS_STATUS_Y, CONFIG.FONT_SIZE_DRAGON_NAME, CONFIG.GOLD_COLOR);
      drawBossSprite(ctx, CONFIG.FIGHT_BOSS_X, CONFIG.FIGHT_BOSS_Y, this.getBossPulseScale());
      this.playerTeam.forEach(dragon => {
        const view = this.views.get(dragon.instanceId);
        if (view) drawDragon(ctx, dragon, view);
      });
      this.floaters.forEach(number => {
        ctx.save();
        ctx.globalAlpha = number.alpha;
        drawText(ctx, number.text, number.x, number.y, CONFIG.DAMAGE_FLOAT_FONT_SIZE, number.color);
        ctx.restore();
      });
    }
    if (isFinished) {
      ctx.fillStyle = CONFIG.HEADER_BG_COLOR;
      ctx.fillRect(0, CONFIG.BOSS_RESULT_PANEL_Y, CONFIG.CANVAS_WIDTH, CONFIG.BOSS_RESULT_PANEL_HEIGHT);
      drawText(ctx, `YOUR SCORE ${this.result.totalDamage}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.BOSS_RESULT_Y, CONFIG.FONT_SIZE_SCORE, CONFIG.GOLD_COLOR);
      drawText(ctx, 'CLICK TO CONTINUE', CONFIG.CANVAS_WIDTH / 2, CONFIG.BOSS_CONTINUE_Y, CONFIG.FONT_SIZE_HEADER);
    }
  }

  // Continue to full results after the score reveal.
  handlePointerDown() {
    if (this.eventIndex < this.events.length) return;
    this.stateManager.change('result', {
      run: this.run,
      bossDamage: this.result.totalDamage,
      reachedBoss: true,
    });
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
      this.floaters.push(createFloatingNumber(`-${event.value}`, CONFIG.FIGHT_BOSS_X, CONFIG.FIGHT_BOSS_Y, CONFIG.DAMAGE_NUMBER_COLOR));
      return;
    }
    const target = this.playerTeam.find(dragon => dragon.instanceId === event.targetId);
    if (target && event.value > 0 && event.action === 'boss_attack') {
      target.hp = Math.max(0, target.hp - event.value);
      const view = this.views.get(target.instanceId);
      this.floaters.push(createFloatingNumber(`-${event.value}`, view.x, view.y, CONFIG.DAMAGE_NUMBER_COLOR));
    }
    if (target && event.action === 'kill') {
      const view = this.views.get(target.instanceId);
      this.tweens.add(view, 'alpha', CONFIG.ARENA_ALIVE_ALPHA, CONFIG.ARENA_DEAD_ALPHA, CONFIG.DEATH_FADE_DURATION);
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
