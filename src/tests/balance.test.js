import { getDragon, getDragonTier } from '../data/dragons.js';
import { assert, summarize, test } from './testHarness.js';

test('Voltfang Tier 1 base attack does not exceed Ember Drake', () => {
  const voltfang = getDragonTier('voltfang', 1);
  const ember = getDragonTier('ember', 1);
  assert(voltfang.atk <= ember.atk, 'Voltfang base attack must stay below starter DPS attack');
});

test('Voltfang Tier 1 chain stays within Ember ability damage budget', () => {
  const voltfang = getDragon('voltfang');
  const ember = getDragon('ember');
  const voltfangTier = getDragonTier('voltfang', 1);
  const emberTier = getDragonTier('ember', 1);
  const chainMultiplier = voltfangTier.abilityPower
    * (1 + (voltfangTier.abilityExtra.bounceCount * voltfangTier.abilityExtra.bounceFalloff));
  const voltfangBudget = voltfangTier.atk * chainMultiplier;
  const emberBudget = emberTier.atk * emberTier.abilityPower;

  assert(voltfangBudget <= emberBudget, `${voltfang.name} chain must not exceed ${ember.name} ability damage`);
});

summarize();
