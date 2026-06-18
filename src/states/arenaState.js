import { CONFIG } from '../config.js';
import { getDragon } from '../data/dragons.js';
import { createBattleInstance, simulateBattle } from '../systems/battle.js';
import { clear, drawButton, drawPhaseBackground, drawText } from '../ui/renderer.js';
import { getArenaFightButton, pointInRect } from '../ui/layout.js';

// Render the temporary Milestone 1 start screen and launch a hardcoded battle.
export class ArenaState {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.fightButton = getArenaFightButton();
  }

  // Prepare the temporary arena screen.
  enter() {}

  // Keep the temporary arena screen static.
  update() {}

  // Draw the temporary arena screen.
  render(ctx) {
    clear(ctx);
    drawPhaseBackground(ctx, 'fight');
    drawText(ctx, 'WYRMPIT', CONFIG.CANVAS_WIDTH / 2, CONFIG.ARENA_TITLE_Y, CONFIG.FONT_SIZE_TITLE);
    drawText(ctx, 'Milestone 1: The Arena', CONFIG.CANVAS_WIDTH / 2, CONFIG.ARENA_SUBTITLE_Y, CONFIG.FONT_SIZE_BODY, CONFIG.TEXT_SECONDARY);
    drawButton(ctx, this.fightButton, 'FIGHT');
    drawText(ctx, 'Watch a fixed 3v3 auto-battle', CONFIG.CANVAS_WIDTH / 2, CONFIG.ARENA_STATUS_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_SECONDARY);
  }

  // Start a new hardcoded battle when the Fight button is pressed.
  handlePointerDown(point) {
    if (!pointInRect(point, this.fightButton)) return;
    const playerTeam = this.createTeam(['ember', 'stonescale', 'zephyr'], 'player');
    const enemyTeam = this.createTeam(['tidecaller', 'ember', 'stonescale'], 'enemy');
    const displayPlayerTeam = this.cloneTeam(playerTeam);
    const displayEnemyTeam = this.cloneTeam(enemyTeam);
    const result = simulateBattle(playerTeam, enemyTeam);
    this.stateManager.change('fight', { result, playerTeam: displayPlayerTeam, enemyTeam: displayEnemyTeam });
  }

  // Create battle instances for the temporary fixed teams.
  createTeam(ids, team) {
    return ids.map((id, index) => createBattleInstance(getDragon(id), 1, team, index));
  }

  // Clone battle instances so animation playback starts from the original HP values.
  cloneTeam(team) {
    return team.map(dragon => ({
      ...dragon,
      statuses: dragon.statuses.map(status => ({ ...status })),
      abilityExtra: { ...dragon.abilityExtra },
    }));
  }
}
