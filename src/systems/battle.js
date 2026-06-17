/**
 * ═══════════════════════════════════════════════════════════════
 * WYRMPIT — Battle System (src/systems/battle.js)
 * ═══════════════════════════════════════════════════════════════
 * 
 * PURE LOGIC — no rendering, no DOM, no Canvas calls.
 * Takes two teams → simulates turn-by-turn combat → returns a log.
 * The fight state (states/fightState.js) reads the log and animates it.
 * 
 * USAGE:
 *   import { simulateBattle } from './battle.js';
 *   const result = simulateBattle(playerTeam, enemyTeam);
 *   // result.log = array of event objects
 *   // result.outcome = 'win' | 'lose' | 'timeout'
 *   // result.survivingPlayer = array of alive player dragons (if won)
 * 
 * DRAGON INSTANCE FORMAT (expected input):
 *   {
 *     id: 'ember',
 *     instanceId: 'ember_1',   // unique per dragon in this fight
 *     name: 'Ember Drake',
 *     tier: 2,
 *     hp: 160, maxHp: 160,
 *     atk: 50, baseAtk: 50,
 *     spd: 14, baseSpd: 14,
 *     abilityName: 'Inferno',
 *     abilityType: 'hit_lowest_hp',
 *     abilityPower: 1.5,
 *     abilityExtra: { splash: 1 },
 *     cooldownMax: 3,          // from CONFIG
 *     cooldownCurrent: 0,      // 0 = ready
 *     element: 'fire',
 *     team: 'player',          // or 'enemy'
 *     statuses: [],            // active buffs/debuffs
 *     shield: 0,
 *     isAlive: true,
 *     isCharging: false,
 *     chargeTurnsLeft: 0,
 *   }
 * ═══════════════════════════════════════════════════════════════
 */

import { CONFIG } from '../config.js';

// ─── MAIN ENTRY POINT ───────────────────────────────────────────

/**
 * Simulate a full battle between two teams.
 * @param {Array} playerTeam - Array of dragon instances (up to TEAM_SIZE)
 * @param {Array} enemyTeam - Array of dragon instances (up to TEAM_SIZE)
 * @returns {{ log: Array, outcome: string, survivingPlayer: Array, survivingEnemy: Array }}
 */
export function simulateBattle(playerTeam, enemyTeam) {
  const log = [];
  let turnNumber = 0;

  // Tag teams for identification
  playerTeam.forEach(d => { d.team = 'player'; });
  enemyTeam.forEach(d => { d.team = 'enemy'; });

  const allDragons = [...playerTeam, ...enemyTeam];

  if (CONFIG.LOG_BATTLE) console.log('[BATTLE] Fight started:', 
    playerTeam.map(d => `${d.name} T${d.tier}`).join(', '),
    'vs',
    enemyTeam.map(d => `${d.name} T${d.tier}`).join(', ')
  );

  // ─── MAIN COMBAT LOOP ─────────────────────────────────────────
  while (turnNumber < CONFIG.MAX_TURNS_PER_ROUND) {
    turnNumber++;

    // Check if fight is over before processing
    if (_isTeamDead(playerTeam)) break;
    if (_isTeamDead(enemyTeam)) break;

    // Process start-of-turn effects (poison ticks, etc.)
    if (CONFIG.POISON_TICK_TIMING === 'start_of_turn') {
      _processPoison(allDragons, turnNumber, log);
    }

    // Check again after poison
    if (_isTeamDead(playerTeam)) break;
    if (_isTeamDead(enemyTeam)) break;

    // Sort all living dragons by SPD (descending). Ties broken randomly.
    const turnOrder = _getAlive(allDragons).sort((a, b) => {
      if (b.spd !== a.spd) return b.spd - a.spd;
      return Math.random() - 0.5;
    });

    // Each dragon takes their action
    for (const dragon of turnOrder) {
      if (!dragon.isAlive) continue;
      if (_isTeamDead(playerTeam) || _isTeamDead(enemyTeam)) break;

      // Check if stunned — skip turn
      if (_hasStatus(dragon, 'stun')) {
        log.push(_event(turnNumber, dragon, 'stunned', null, 0));
        _decrementStatus(dragon, 'stun');
        if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${dragon.name} is stunned, skipping turn`);
        continue;
      }

      // Check if charging (Solflare mechanic)
      if (dragon.isCharging) {
        dragon.chargeTurnsLeft--;
        if (dragon.chargeTurnsLeft <= 0) {
          // Fire the charged ability
          _executeAbility(dragon, allDragons, playerTeam, enemyTeam, turnNumber, log);
          dragon.isCharging = false;
        } else {
          log.push(_event(turnNumber, dragon, 'charging', null, 0));
          if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${dragon.name} is charging... ${dragon.chargeTurnsLeft} turns left`);
        }
        continue;
      }

      // Decide: use ability or basic attack
      if (dragon.cooldownCurrent <= 0) {
        // Ability is ready
        _useAbility(dragon, allDragons, playerTeam, enemyTeam, turnNumber, log);
      } else {
        // Basic attack
        _basicAttack(dragon, allDragons, playerTeam, enemyTeam, turnNumber, log);
        dragon.cooldownCurrent--;
      }
    }

    // End-of-turn: decrement status durations, expire buffs
    _processEndOfTurn(allDragons, turnNumber, log);

    // Process end-of-turn poison if configured
    if (CONFIG.POISON_TICK_TIMING === 'end_of_turn') {
      _processPoison(allDragons, turnNumber, log);
    }
  }

  // ─── DETERMINE OUTCOME ─────────────────────────────────────────
  let outcome;
  if (_isTeamDead(playerTeam)) {
    outcome = 'lose';
  } else if (_isTeamDead(enemyTeam)) {
    outcome = 'win';
  } else {
    // Max turns exceeded — player loses (anti-stall rule)
    outcome = 'timeout';
  }

  if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] Fight ended: ${outcome} after ${turnNumber} turns`);

  return {
    log,
    outcome,
    totalTurns: turnNumber,
    survivingPlayer: playerTeam.filter(d => d.isAlive),
    survivingEnemy: enemyTeam.filter(d => d.isAlive),
  };
}

// ─── BASIC ATTACK ────────────────────────────────────────────────

/**
 * Perform a basic attack against the default target.
 * Basic attacks RESPECT taunt (unlike some abilities).
 */
function _basicAttack(attacker, allDragons, playerTeam, enemyTeam, turn, log) {
  const enemies = _getAliveEnemies(attacker, playerTeam, enemyTeam);
  if (enemies.length === 0) return;

  // Check for taunt — must hit taunter if active
  const taunter = enemies.find(e => _hasStatus(e, 'taunt'));
  let target;

  if (taunter) {
    target = taunter;
  } else {
    target = _selectTarget(enemies, CONFIG.BASIC_ATK_TARGET);
  }

  const damage = Math.round(attacker.atk * CONFIG.BASIC_ATK_MULTIPLIER);
  _applyDamage(target, damage, attacker, turn, log, 'basic_attack');

  if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${attacker.name} basic attacks ${target.name} for ${damage}`);
}

// ─── ABILITY USAGE ───────────────────────────────────────────────

/**
 * Initiate ability use. May start a charge or fire immediately.
 */
function _useAbility(dragon, allDragons, playerTeam, enemyTeam, turn, log) {
  const extra = dragon.abilityExtra || {};

  // Check if this is a charge-type ability
  if (extra.chargeTurns && extra.chargeTurns > 0) {
    dragon.isCharging = true;
    dragon.chargeTurnsLeft = extra.chargeTurns;
    dragon.cooldownCurrent = dragon.cooldownMax;
    log.push(_event(turn, dragon, 'start_charge', null, 0));
    if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${dragon.name} begins charging ${dragon.abilityName}`);
    return;
  }

  // Fire ability immediately
  _executeAbility(dragon, allDragons, playerTeam, enemyTeam, turn, log);
}

/**
 * Execute the ability effect. Called immediately or after charge completes.
 */
function _executeAbility(dragon, allDragons, playerTeam, enemyTeam, turn, log) {
  const enemies = _getAliveEnemies(dragon, playerTeam, enemyTeam);
  const allies = _getAliveAllies(dragon, playerTeam, enemyTeam);
  const extra = dragon.abilityExtra || {};
  const power = dragon.abilityPower;

  // Set cooldown
  dragon.cooldownCurrent = dragon.cooldownMax;

  if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${dragon.name} uses ${dragon.abilityName}`);

  switch (dragon.abilityType) {

    // ─── DAMAGE: Hit lowest HP enemy ─────────────────────────────
    case 'hit_lowest_hp': {
      if (enemies.length === 0) break;
      const target = _selectTarget(enemies, 'lowest_hp');
      const damage = Math.round(dragon.atk * power);
      _applyDamage(target, damage, dragon, turn, log, 'ability');
      
      // Splash to adjacent (Inferno T2 mechanic)
      if (extra.splash && extra.splash > 0) {
        const splashTargets = enemies.filter(e => e !== target && e.isAlive).slice(0, extra.splash);
        splashTargets.forEach(st => {
          const splashDmg = Math.round(dragon.atk * power);
          _applyDamage(st, splashDmg, dragon, turn, log, 'ability_splash');
        });
      }
      break;
    }

    // ─── DAMAGE: Hit highest SPD enemy (backline/assassin) ───────
    case 'hit_highest_spd': {
      if (enemies.length === 0) break;
      // Assassin abilities IGNORE taunt
      const target = _selectTarget(enemies, 'highest_spd');
      const hits = extra.hits || 1;
      for (let i = 0; i < hits; i++) {
        if (!target.isAlive) break;
        const damage = Math.round(dragon.atk * power);
        _applyDamage(target, damage, dragon, turn, log, 'ability');
      }
      // Dodge buff after attack
      if (extra.dodgeChance) {
        _applyStatus(dragon, 'dodge', extra.dodgeDuration || 1, { chance: extra.dodgeChance });
      }
      break;
    }

    // ─── DAMAGE: Hit all enemies (AoE) ──────────────────────────
    case 'hit_all_enemies': {
      enemies.forEach(enemy => {
        if (!enemy.isAlive) return;
        const damage = Math.round(dragon.atk * power);
        _applyDamage(enemy, damage, dragon, turn, log, 'ability_aoe');
      });
      // Stun chance per target (Voltfang T3)
      if (extra.stunChance) {
        enemies.forEach(enemy => {
          if (!enemy.isAlive) return;
          if (Math.random() < extra.stunChance) {
            _applyStatus(enemy, 'stun', extra.stunDuration || 1, {});
            log.push(_event(turn, dragon, 'apply_stun', enemy, 0));
          }
        });
      }
      // Self-destruct (Solflare T3 Supernova)
      if (extra.selfDestruct) {
        dragon.hp = 0;
        dragon.isAlive = false;
        log.push(_event(turn, dragon, 'self_destruct', dragon, 0));
        if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${dragon.name} self-destructs after Supernova`);
      }
      break;
    }

    // ─── DAMAGE: Hit one, bounce to others ──────────────────────
    case 'hit_one_bounce': {
      if (enemies.length === 0) break;
      // Primary target: highest ATK (kill the threat)
      const primary = _selectTarget(enemies, 'highest_atk');
      const primaryDmg = Math.round(dragon.atk * power);
      _applyDamage(primary, primaryDmg, dragon, turn, log, 'ability');

      // Bounce to additional targets
      const bounceCount = extra.bounceCount || 1;
      const falloff = extra.bounceFalloff || 0.5;
      const bounceTargets = enemies.filter(e => e !== primary && e.isAlive).slice(0, bounceCount);
      bounceTargets.forEach(bt => {
        const bounceDmg = Math.round(dragon.atk * power * falloff);
        _applyDamage(bt, bounceDmg, dragon, turn, log, 'ability_bounce');
      });
      break;
    }

    // ─── DAMAGE: Charge then hit one (Solflare) ─────────────────
    case 'charge_hit_one': {
      // This is called AFTER charge completes
      if (extra.hitAll) {
        // T3 Supernova — hits all enemies
        enemies.forEach(enemy => {
          if (!enemy.isAlive) return;
          const damage = Math.round(dragon.atk * power);
          _applyDamage(enemy, damage, dragon, turn, log, 'ability_aoe');
        });
        if (extra.selfDestruct) {
          dragon.hp = 0;
          dragon.isAlive = false;
          log.push(_event(turn, dragon, 'self_destruct', dragon, 0));
        }
      } else {
        // T1/T2 — single target nuke
        if (enemies.length === 0) break;
        const target = _selectTarget(enemies, 'highest_atk');
        const damage = Math.round(dragon.atk * power);
        _applyDamage(target, damage, dragon, turn, log, 'ability');

        // Overkill splash (T2 mechanic)
        if (extra.overkillSplash && !target.isAlive) {
          const overkillDmg = damage - (target.hp + damage); // excess damage
          // Simplified: if target died, deal 50% of original to another
          const spillTarget = enemies.find(e => e.isAlive && e !== target);
          if (spillTarget) {
            const spillDmg = Math.round(damage * 0.5);
            _applyDamage(spillTarget, spillDmg, dragon, turn, log, 'ability_overkill');
          }
        }
      }
      break;
    }

    // ─── SUPPORT: Heal lowest HP ally ───────────────────────────
    case 'heal_lowest_ally': {
      const alliesIncSelf = [...allies, dragon].filter(a => a.isAlive);
      if (alliesIncSelf.length === 0) break;
      const target = _selectTarget(alliesIncSelf, 'lowest_hp');
      const healAmount = Math.round(dragon.maxHp * (extra.healPercent || 0.3));
      _applyHeal(target, healAmount, dragon, turn, log);

      // Cleanse debuffs
      if (extra.cleanse) {
        target.statuses = target.statuses.filter(s => !s.isDebuff);
        log.push(_event(turn, dragon, 'cleanse', target, 0));
      }
      break;
    }

    // ─── SUPPORT: Heal all allies ───────────────────────────────
    case 'heal_all_allies': {
      const alliesIncSelf = [...allies, dragon].filter(a => a.isAlive);
      alliesIncSelf.forEach(ally => {
        const healAmount = Math.round(dragon.maxHp * (extra.healPercent || 0.2));
        _applyHeal(ally, healAmount, dragon, turn, log);
      });
      // Damage component (Tsunami T3)
      if (extra.damageAll) {
        enemies.forEach(enemy => {
          if (!enemy.isAlive) return;
          const damage = Math.round(dragon.atk * power);
          _applyDamage(enemy, damage, dragon, turn, log, 'ability_aoe');
        });
      }
      break;
    }

    // ─── TANK: Self-taunt ───────────────────────────────────────
    case 'self_taunt': {
      const duration = extra.duration || CONFIG.TAUNT_DEFAULT_DURATION;
      _applyStatus(dragon, 'taunt', duration, { damageReduction: extra.damageReduction || 0 });
      log.push(_event(turn, dragon, 'taunt', dragon, 0));

      // T3 Earthquake: stun all enemies
      if (extra.stunAll) {
        enemies.forEach(enemy => {
          if (!enemy.isAlive) return;
          _applyStatus(enemy, 'stun', extra.stunAll, {});
          log.push(_event(turn, dragon, 'apply_stun', enemy, 0));
        });
      }
      break;
    }

    // ─── SUPPORT: Shield all allies ─────────────────────────────
    case 'shield_all': {
      const alliesIncSelf = [...allies, dragon].filter(a => a.isAlive);
      const shieldAmount = Math.round(dragon.maxHp * (extra.shieldPercent || 0.15));
      alliesIncSelf.forEach(ally => {
        ally.shield += shieldAmount;
        log.push(_event(turn, dragon, 'shield', ally, shieldAmount));
      });

      // SPD debuff on enemies (Crystalwing T2/T3)
      if (extra.spdDebuff) {
        enemies.forEach(enemy => {
          if (!enemy.isAlive) return;
          _applyStatus(enemy, 'spd_debuff', extra.debuffDuration || 2, { amount: extra.spdDebuff });
          enemy.spd = Math.max(1, enemy.spd - extra.spdDebuff);
          log.push(_event(turn, dragon, 'apply_slow', enemy, 0));
        });
      }

      // Freeze lowest HP enemy (Crystalwing T3)
      if (extra.freezeLowest) {
        const freezeTarget = _selectTarget(enemies.filter(e => e.isAlive), 'lowest_hp');
        if (freezeTarget) {
          _applyStatus(freezeTarget, 'stun', extra.freezeLowest, {});
          log.push(_event(turn, dragon, 'freeze', freezeTarget, 0));
        }
      }
      break;
    }

    // ─── DEBUFFER: Poison/DOT all enemies ───────────────────────
    case 'dot_all_enemies': {
      const dotDuration = extra.dotDuration || 3;
      enemies.forEach(enemy => {
        if (!enemy.isAlive) return;
        _applyStatus(enemy, 'poison', dotDuration, {
          damagePerTick: Math.round(dragon.atk * power),
          source: dragon.instanceId,
          isDebuff: true,
        });
        log.push(_event(turn, dragon, 'apply_poison', enemy, 0));
      });

      // ATK debuff (Nightshade T2/T3)
      if (extra.atkDebuff) {
        enemies.forEach(enemy => {
          if (!enemy.isAlive) return;
          _applyStatus(enemy, 'atk_debuff', extra.debuffDuration || 2, {
            amount: extra.atkDebuff,
            isDebuff: true,
          });
          enemy.atk = Math.round(enemy.atk * (1 - extra.atkDebuff));
          log.push(_event(turn, dragon, 'apply_atk_debuff', enemy, 0));
        });
      }
      break;
    }

    default:
      if (CONFIG.LOG_BATTLE) console.warn(`[BATTLE] Unknown ability type: ${dragon.abilityType}`);
      break;
  }
}

// ─── DAMAGE APPLICATION ──────────────────────────────────────────

/**
 * Apply damage to a target, respecting shields, dodge, and damage reduction.
 */
function _applyDamage(target, rawDamage, attacker, turn, log, type) {
  if (!target || !target.isAlive) return;

  // Check dodge
  if (_hasStatus(target, 'dodge')) {
    const dodgeData = _getStatusData(target, 'dodge');
    if (Math.random() < (dodgeData.chance || 0.3)) {
      log.push(_event(turn, attacker, 'dodged', target, 0));
      if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${target.name} dodged the attack!`);
      return;
    }
  }

  let damage = rawDamage;

  // Damage reduction from taunt/shield abilities
  if (_hasStatus(target, 'taunt')) {
    const tauntData = _getStatusData(target, 'taunt');
    if (tauntData.damageReduction) {
      const reduced = Math.round(damage * tauntData.damageReduction);
      damage -= reduced;

      // Reflect damage back (Stonescale T2/T3)
      if (tauntData.reflect && attacker) {
        const reflectDmg = Math.round(reduced * tauntData.reflect);
        // Direct HP damage to attacker (no recursion)
        attacker.hp -= reflectDmg;
        if (attacker.hp <= 0) {
          attacker.hp = 0;
          attacker.isAlive = false;
          log.push(_event(turn, target, 'reflect_kill', attacker, reflectDmg));
        } else {
          log.push(_event(turn, target, 'reflect', attacker, reflectDmg));
        }
      }
    }
  }

  // Shield absorbs first
  if (target.shield > 0) {
    if (target.shield >= damage) {
      target.shield -= damage;
      log.push(_event(turn, attacker, type + '_shielded', target, damage));
      if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${target.name}'s shield absorbs ${damage}`);
      return;
    } else {
      damage -= target.shield;
      log.push(_event(turn, attacker, 'shield_break', target, target.shield));
      target.shield = 0;
    }
  }

  // Apply remaining damage to HP
  target.hp -= damage;
  log.push(_event(turn, attacker, type, target, damage));

  if (target.hp <= 0) {
    target.hp = 0;
    target.isAlive = false;
    log.push(_event(turn, attacker, 'kill', target, 0));
    if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${target.name} is defeated by ${attacker.name}`);
  }
}

// ─── HEALING ─────────────────────────────────────────────────────

/**
 * Heal a target. Cannot exceed max HP.
 */
function _applyHeal(target, amount, healer, turn, log) {
  if (!target || !target.isAlive) return;
  const actualHeal = Math.min(amount, target.maxHp - target.hp);
  target.hp += actualHeal;
  log.push(_event(turn, healer, 'heal', target, actualHeal));
  if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${healer.name} heals ${target.name} for ${actualHeal}`);
}

// ─── STATUS EFFECTS ──────────────────────────────────────────────

/**
 * Apply a status effect to a dragon.
 */
function _applyStatus(dragon, type, duration, data) {
  // Remove existing status of same type (refresh, don't stack)
  dragon.statuses = dragon.statuses.filter(s => s.type !== type);
  dragon.statuses.push({ type, duration, ...data });
}

/**
 * Check if a dragon has a specific status.
 */
function _hasStatus(dragon, type) {
  return dragon.statuses.some(s => s.type === type && s.duration > 0);
}

/**
 * Get data object for a specific status.
 */
function _getStatusData(dragon, type) {
  return dragon.statuses.find(s => s.type === type) || {};
}

/**
 * Decrement a status duration by 1. Remove if expired.
 */
function _decrementStatus(dragon, type) {
  const status = dragon.statuses.find(s => s.type === type);
  if (status) {
    status.duration--;
    if (status.duration <= 0) {
      dragon.statuses = dragon.statuses.filter(s => s.type !== type);
    }
  }
}

// ─── END OF TURN PROCESSING ─────────────────────────────────────

/**
 * Process all end-of-turn effects: decrement durations, restore debuffed stats.
 */
function _processEndOfTurn(allDragons, turn, log) {
  allDragons.forEach(dragon => {
    if (!dragon.isAlive) return;

    // Decrement all status durations
    dragon.statuses.forEach(status => {
      status.duration--;
    });

    // Remove expired statuses and restore stats
    const expired = dragon.statuses.filter(s => s.duration <= 0);
    expired.forEach(status => {
      // Restore SPD if slow expired
      if (status.type === 'spd_debuff') {
        dragon.spd = Math.min(dragon.baseSpd, dragon.spd + (status.amount || 0));
      }
      // Restore ATK if debuff expired
      if (status.type === 'atk_debuff') {
        dragon.atk = dragon.baseAtk;
      }
    });

    // Clean up expired statuses
    dragon.statuses = dragon.statuses.filter(s => s.duration > 0);
  });
}

/**
 * Process poison ticks for all dragons.
 */
function _processPoison(allDragons, turn, log) {
  allDragons.forEach(dragon => {
    if (!dragon.isAlive) return;
    const poison = dragon.statuses.find(s => s.type === 'poison');
    if (!poison) return;

    const tickDmg = poison.damagePerTick || 0;
    dragon.hp -= tickDmg;
    log.push(_event(turn, { name: 'Poison', instanceId: 'poison' }, 'poison_tick', dragon, tickDmg));

    if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${dragon.name} takes ${tickDmg} poison damage`);

    if (dragon.hp <= 0) {
      dragon.hp = 0;
      dragon.isAlive = false;
      log.push(_event(turn, { name: 'Poison', instanceId: 'poison' }, 'kill', dragon, 0));
    }

    // Lifesteal: heal poison source (Nightshade T3)
    if (poison.lifesteal) {
      // Find the source dragon
      const source = allDragons.find(d => d.instanceId === poison.source && d.isAlive);
      if (source) {
        _applyHeal(source, tickDmg, source, turn, log);
      }
    }
  });
}

// ─── TARGETING HELPERS ───────────────────────────────────────────

/**
 * Select a target from a list based on strategy.
 */
function _selectTarget(candidates, strategy) {
  if (candidates.length === 0) return null;
  const alive = candidates.filter(c => c.isAlive);
  if (alive.length === 0) return null;

  switch (strategy) {
    case 'highest_atk':
      return alive.reduce((best, c) => c.atk > best.atk ? c : best, alive[0]);
    case 'lowest_hp':
      return alive.reduce((best, c) => c.hp < best.hp ? c : best, alive[0]);
    case 'highest_spd':
      return alive.reduce((best, c) => c.spd > best.spd ? c : best, alive[0]);
    case 'random':
      return alive[Math.floor(Math.random() * alive.length)];
    default:
      return alive[0];
  }
}

/**
 * Get alive enemies of a dragon.
 */
function _getAliveEnemies(dragon, playerTeam, enemyTeam) {
  const enemies = dragon.team === 'player' ? enemyTeam : playerTeam;
  return enemies.filter(e => e.isAlive);
}

/**
 * Get alive allies of a dragon (excluding self).
 */
function _getAliveAllies(dragon, playerTeam, enemyTeam) {
  const allies = dragon.team === 'player' ? playerTeam : enemyTeam;
  return allies.filter(a => a.isAlive && a.instanceId !== dragon.instanceId);
}

/**
 * Get all alive dragons from a combined list.
 */
function _getAlive(allDragons) {
  return allDragons.filter(d => d.isAlive);
}

/**
 * Check if an entire team is dead.
 */
function _isTeamDead(team) {
  return team.every(d => !d.isAlive);
}

// ─── EVENT FACTORY ───────────────────────────────────────────────

/**
 * Create a structured combat log event.
 * These events are consumed by fightState.js for animation.
 */
function _event(turn, actor, action, target, value) {
  return {
    turn,
    actorId: actor ? actor.instanceId : null,
    actorName: actor ? actor.name : null,
    action,
    targetId: target ? target.instanceId : null,
    targetName: target ? target.name : null,
    value,
    timestamp: Date.now(),
  };
}

// ─── BOSS FIGHT VARIANT ──────────────────────────────────────────

/**
 * Simulate the boss fight (Eternal Wyrm).
 * Same core loop but boss has special rules:
 *   - Always acts last (lowest SPD)
 *   - Hits ALL player dragons every turn
 *   - Escalating damage per turn
 *   - Fight ends when all player dragons die
 * 
 * @param {Array} playerTeam - player's surviving team
 * @returns {{ log: Array, totalDamage: number, totalTurns: number }}
 */
export function simulateBossFight(playerTeam) {
  const log = [];
  let turnNumber = 0;
  let totalDamageDealt = 0;

  // Create boss instance
  const boss = {
    id: 'eternal_wyrm',
    instanceId: 'boss_wyrm',
    name: 'Eternal Wyrm',
    tier: 99,
    hp: CONFIG.BOSS_HP,
    maxHp: CONFIG.BOSS_HP,
    atk: CONFIG.BOSS_ATK_START,
    baseAtk: CONFIG.BOSS_ATK_START,
    spd: CONFIG.BOSS_SPEED,
    baseSpd: CONFIG.BOSS_SPEED,
    abilityName: 'Apocalypse Breath',
    abilityType: 'boss_aoe',
    abilityPower: 1.0,
    abilityExtra: {},
    cooldownMax: 0,      // boss uses ability every turn
    cooldownCurrent: 0,
    element: 'shadow',
    team: 'enemy',
    statuses: [],
    shield: 0,
    isAlive: true,
    isCharging: false,
    chargeTurnsLeft: 0,
  };

  const enemyTeam = [boss];
  playerTeam.forEach(d => { d.team = 'player'; });

  if (CONFIG.LOG_BATTLE) console.log('[BATTLE] Boss fight started! Eternal Wyrm awaits.');

  // ─── BOSS COMBAT LOOP ─────────────────────────────────────────
  while (!_isTeamDead(playerTeam)) {
    turnNumber++;

    // Boss ATK escalates each turn
    boss.atk = CONFIG.BOSS_ATK_START + (turnNumber * CONFIG.BOSS_ATK_ESCALATION);

    // Process poison on boss (yes, you can poison the boss)
    if (CONFIG.POISON_TICK_TIMING === 'start_of_turn') {
      const poisonStatus = boss.statuses.find(s => s.type === 'poison');
      if (poisonStatus) {
        const tickDmg = poisonStatus.damagePerTick || 0;
        boss.hp -= tickDmg;
        totalDamageDealt += tickDmg;
        log.push(_event(turnNumber, { name: 'Poison', instanceId: 'poison' }, 'poison_tick', boss, tickDmg));
      }
    }

    // Sort turn order: players + boss by SPD
    const allDragons = [...playerTeam.filter(d => d.isAlive), boss];
    const turnOrder = allDragons.sort((a, b) => {
      if (b.spd !== a.spd) return b.spd - a.spd;
      return Math.random() - 0.5;
    });

    for (const dragon of turnOrder) {
      if (!dragon.isAlive) continue;
      if (_isTeamDead(playerTeam)) break;

      // Stun check
      if (_hasStatus(dragon, 'stun')) {
        log.push(_event(turnNumber, dragon, 'stunned', null, 0));
        _decrementStatus(dragon, 'stun');
        continue;
      }

      if (dragon.instanceId === 'boss_wyrm') {
        // Boss action: hit all player dragons
        const alivePlayers = playerTeam.filter(d => d.isAlive);
        alivePlayers.forEach(target => {
          const damage = boss.atk;
          _applyDamage(target, damage, boss, turnNumber, log, 'boss_attack');
        });
        log.push(_event(turnNumber, boss, 'apocalypse_breath', null, boss.atk));
        if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] Eternal Wyrm uses Apocalypse Breath for ${boss.atk} to all`);
      } else {
        // Player dragon acts normally
        if (dragon.isCharging) {
          dragon.chargeTurnsLeft--;
          if (dragon.chargeTurnsLeft <= 0) {
            _executeAbility(dragon, [...playerTeam, boss], playerTeam, enemyTeam, turnNumber, log);
            dragon.isCharging = false;
          }
          continue;
        }

        if (dragon.cooldownCurrent <= 0) {
          // Track damage dealt to boss
          const bossHpBefore = boss.hp;
          _executeAbility(dragon, [...playerTeam, boss], playerTeam, enemyTeam, turnNumber, log);
          const damageThisTurn = bossHpBefore - boss.hp;
          if (damageThisTurn > 0) totalDamageDealt += damageThisTurn;
        } else {
          // Basic attack the boss
          const bossHpBefore = boss.hp;
          const damage = Math.round(dragon.atk * CONFIG.BASIC_ATK_MULTIPLIER);
          boss.hp -= damage;
          totalDamageDealt += damage;
          log.push(_event(turnNumber, dragon, 'basic_attack', boss, damage));
          dragon.cooldownCurrent--;
          if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] ${dragon.name} hits Wyrm for ${damage}`);
        }
      }
    }

    // End of turn processing
    _processEndOfTurn([...playerTeam, boss], turnNumber, log);

    if (CONFIG.POISON_TICK_TIMING === 'end_of_turn') {
      const poisonStatus = boss.statuses.find(s => s.type === 'poison');
      if (poisonStatus) {
        const tickDmg = poisonStatus.damagePerTick || 0;
        boss.hp -= tickDmg;
        totalDamageDealt += tickDmg;
        log.push(_event(turnNumber, { name: 'Poison', instanceId: 'poison' }, 'poison_tick', boss, tickDmg));
      }
    }
  }

  if (CONFIG.LOG_BATTLE) console.log(`[BATTLE] Boss fight ended. Total damage: ${totalDamageDealt} in ${turnNumber} turns`);

  return {
    log,
    totalDamage: totalDamageDealt,
    totalTurns: turnNumber,
  };
}

// ─── INSTANCE FACTORY ────────────────────────────────────────────

/**
 * Create a battle-ready dragon instance from a dragon definition + tier.
 * Call this before passing dragons into simulateBattle().
 * 
 * @param {Object} dragonDef - from dragons.js (getDragon result)
 * @param {number} tier - 1, 2, or 3
 * @param {string} team - 'player' or 'enemy'
 * @param {number} index - position index for unique instanceId
 * @returns {Object} battle-ready dragon instance
 */
export function createBattleInstance(dragonDef, tier, team, index) {
  const tierData = dragonDef.tiers[tier - 1];
  if (!tierData) {
    console.error(`[BATTLE] No tier ${tier} data for dragon ${dragonDef.id}`);
    return null;
  }

  const cooldownMax = tier >= CONFIG.MAX_TIER ? CONFIG.ABILITY_COOLDOWN_T3 : CONFIG.ABILITY_COOLDOWN;

  return {
    id: dragonDef.id,
    instanceId: `${dragonDef.id}_${team}_${index}_${Date.now()}`,
    name: dragonDef.name,
    tier: tier,
    hp: tierData.hp,
    maxHp: tierData.hp,
    atk: tierData.atk,
    baseAtk: tierData.atk,
    spd: tierData.spd,
    baseSpd: tierData.spd,
    abilityName: tierData.abilityName,
    abilityType: tierData.abilityType,
    abilityPower: tierData.abilityPower,
    abilityExtra: tierData.abilityExtra ? { ...tierData.abilityExtra } : {},
    cooldownMax: cooldownMax,
    cooldownCurrent: 0,       // ability ready on first turn
    element: dragonDef.element,
    emoji: dragonDef.emoji,
    team: team,
    statuses: [],
    shield: 0,
    isAlive: true,
    isCharging: false,
    chargeTurnsLeft: 0,
  };
}