import { CONFIG } from '../config.js';
import { setSoundVolume } from '../engine/audio.js';
import { save } from '../persistence/save.js';
import { getNextUnlockInfo } from '../systems/progression.js';
import { createRunState } from '../systems/run.js';
import { getMenuButtons, getMenuConfirmButtons, getMenuContinueButton, getMenuSettingsControls, pointInRect } from '../ui/layout.js';
import { clear, drawBar, drawButton, drawCircle, drawFitText, drawGameTitle, drawMenuHotspot, drawPhaseBackground, drawRect, drawText } from '../ui/renderer.js';

// Present persistent progression and entry points into a run or codex.
export class MenuState {
  constructor(stateManager, game) {
    this.stateManager = stateManager;
    this.game = game;
    this.buttons = getMenuButtons();
    this.continueButton = getMenuContinueButton();
    this.confirmButtons = getMenuConfirmButtons();
    this.settingsControls = getMenuSettingsControls();
    this.confirmingNewRun = false;
    this.settingsOpen = false;
    this.activeSlider = null;
  }

  // Keep the menu stateless between visits.
  enter() {
    this.confirmingNewRun = false;
    this.settingsOpen = false;
    this.activeSlider = null;
  }

  // Keep the menu static.
  update() {}

  // Draw title, score, XP progress, and menu commands.
  render(ctx) {
    clear(ctx);
    drawPhaseBackground(ctx, 'menu');
    drawRect(ctx, {
      x: CONFIG.MENU_STATS_PANEL_X,
      y: CONFIG.MENU_STATS_PANEL_Y,
      width: CONFIG.MENU_STATS_PANEL_WIDTH,
      height: CONFIG.MENU_STATS_PANEL_HEIGHT,
    }, CONFIG.UI_PANEL_SOFT_COLOR, CONFIG.TEXT_SECONDARY);
    drawGameTitle(ctx, {
      x: CONFIG.MENU_TITLE_X,
      y: CONFIG.MENU_TITLE_Y,
      width: CONFIG.MENU_TITLE_WIDTH,
      height: CONFIG.MENU_TITLE_HEIGHT,
    });
    drawText(ctx, `HIGH SCORE ${this.game.saveData.highScore}`, CONFIG.MENU_STATS_PANEL_X + (CONFIG.MENU_STATS_PANEL_WIDTH / 2), CONFIG.MENU_SCORE_Y, CONFIG.FONT_SIZE_HEADER);
    const nextUnlock = getNextUnlockInfo(this.game.saveData.totalXP);
    const label = nextUnlock
      ? `XP ${this.game.saveData.totalXP} - NEXT: ${nextUnlock.name}`
      : `XP ${this.game.saveData.totalXP} - ALL DRAGONS UNLOCKED`;
    const ratio = nextUnlock ? nextUnlock.current / nextUnlock.required : 1;
    drawText(ctx, label, CONFIG.MENU_STATS_PANEL_X + (CONFIG.MENU_STATS_PANEL_WIDTH / 2), CONFIG.MENU_XP_LABEL_Y, CONFIG.FONT_SIZE_HEADER);
    drawBar(ctx, CONFIG.MENU_XP_BAR_X, CONFIG.MENU_XP_BAR_Y, CONFIG.MENU_XP_BAR_WIDTH, CONFIG.MENU_XP_BAR_HEIGHT, ratio, CONFIG.GOLD_COLOR);
    drawMenuHotspot(ctx, this.getNewRunLabel(), 'NEW RUN');
    if (this.game.run) drawButton(ctx, this.continueButton, 'CONTINUE', CONFIG.GOLD_COLOR);
    drawMenuHotspot(ctx, this.getCodexLabel(), 'CODEX');
    drawButton(ctx, this.settingsControls.icon, '\u2699', CONFIG.UI_PANEL_COLOR, CONFIG.FONT_SIZE_TITLE);
    if (this.confirmingNewRun) this.renderNewRunConfirmation(ctx);
    if (this.settingsOpen) this.renderSettings(ctx);
  }

  // Draw persistent identity and audio controls over the menu scene.
  renderSettings(ctx) {
    const panel = {
      x: CONFIG.SETTINGS_PANEL_X,
      y: CONFIG.SETTINGS_PANEL_Y,
      width: CONFIG.SETTINGS_PANEL_WIDTH,
      height: CONFIG.SETTINGS_PANEL_HEIGHT,
    };
    drawRect(ctx, panel, CONFIG.HEADER_BG_COLOR, CONFIG.GOLD_COLOR);
    drawText(ctx, 'SETTINGS', CONFIG.CANVAS_WIDTH / 2, CONFIG.SETTINGS_TITLE_Y, CONFIG.FONT_SIZE_TITLE, CONFIG.GOLD_COLOR);
    drawText(ctx, 'PLAYER NAME', CONFIG.SETTINGS_LABEL_X, CONFIG.SETTINGS_NAME_Y + (CONFIG.SETTINGS_CONTROL_HEIGHT / 2), CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_SECONDARY, 'left');
    drawButton(ctx, this.settingsControls.name, this.game.saveData.playerName, CONFIG.ACCENT_SECONDARY);
    this.renderVolumeSlider(ctx, 'MUSIC', this.settingsControls.music, this.game.saveData.musicVolume);
    this.renderVolumeSlider(ctx, 'SOUND', this.settingsControls.sound, this.game.saveData.soundVolume);
    drawButton(ctx, this.settingsControls.close, 'DONE', CONFIG.ACCENT_PRIMARY);
  }

  // Draw one labeled percentage slider with a stable touch target.
  renderVolumeSlider(ctx, label, rect, value) {
    const centerY = rect.y + (rect.height / 2);
    drawText(ctx, label, CONFIG.SETTINGS_LABEL_X, centerY, CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_SECONDARY, 'left');
    drawBar(ctx, rect.x, centerY - (CONFIG.SETTINGS_SLIDER_HEIGHT / 2), rect.width, CONFIG.SETTINGS_SLIDER_HEIGHT, value, CONFIG.LOADING_BAR_COLOR);
    drawCircle(ctx, rect.x + (rect.width * value), centerY, CONFIG.SETTINGS_SLIDER_KNOB_RADIUS, CONFIG.TEXT_PRIMARY, CONFIG.ARENA_ALIVE_ALPHA, CONFIG.LOADING_BAR_COLOR);
    drawText(ctx, `${Math.round(value * CONFIG.PERCENT_MULTIPLIER)}%`, rect.x + rect.width + CONFIG.SETTINGS_SLIDER_KNOB_RADIUS, centerY, CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_PRIMARY, 'left');
  }

  // Draw a blocking confirmation before replacing a saved run.
  renderNewRunConfirmation(ctx) {
    const panel = {
      x: CONFIG.MENU_CONFIRM_PANEL_X,
      y: CONFIG.MENU_CONFIRM_PANEL_Y,
      width: CONFIG.MENU_CONFIRM_PANEL_WIDTH,
      height: CONFIG.MENU_CONFIRM_PANEL_HEIGHT,
    };
    drawRect(ctx, panel, CONFIG.UI_PANEL_COLOR, CONFIG.GOLD_COLOR);
    drawText(ctx, 'START A NEW RUN?', CONFIG.CANVAS_WIDTH / 2, CONFIG.MENU_CONFIRM_TITLE_Y, CONFIG.FONT_SIZE_TITLE, CONFIG.GOLD_COLOR);
    drawFitText(ctx, 'Your current run will be replaced.', CONFIG.CANVAS_WIDTH / 2, CONFIG.MENU_CONFIRM_BODY_Y, CONFIG.FONT_SIZE_HEADER, panel.width - (CONFIG.PREP_CARD_TEXT_LEFT_PAD * 2), CONFIG.FONT_SIZE_CARD_TITLE_MIN, CONFIG.TEXT_PRIMARY);
    drawButton(ctx, this.confirmButtons.cancel, 'CANCEL', CONFIG.ACCENT_SECONDARY);
    drawButton(ctx, this.confirmButtons.confirm, 'NEW RUN', CONFIG.ACCENT_PRIMARY);
  }

  // Return the compact New Run label over the tower entrance.
  getNewRunLabel() {
    return {
      x: CONFIG.MENU_NEW_RUN_LABEL_X,
      y: CONFIG.MENU_NEW_RUN_LABEL_Y,
      width: CONFIG.MENU_HOTSPOT_LABEL_WIDTH,
      height: CONFIG.MENU_HOTSPOT_LABEL_HEIGHT,
    };
  }

  // Return the compact Codex label over the ground-dragon group.
  getCodexLabel() {
    return {
      x: CONFIG.MENU_CODEX_LABEL_X,
      y: CONFIG.MENU_CODEX_LABEL_Y,
      width: CONFIG.MENU_HOTSPOT_LABEL_WIDTH,
      height: CONFIG.MENU_HOTSPOT_LABEL_HEIGHT,
    };
  }

  // Start a run or open the persistent codex.
  handlePointerDown(point) {
    if (this.settingsOpen) {
      this.handleSettingsPointerDown(point);
      return;
    }
    if (this.confirmingNewRun) {
      if (pointInRect(point, this.confirmButtons.cancel)) this.confirmingNewRun = false;
      if (pointInRect(point, this.confirmButtons.confirm)) this.startNewRun();
      return;
    }
    if (pointInRect(point, this.settingsControls.icon)) {
      this.settingsOpen = true;
      return;
    }
    if (this.game.run && pointInRect(point, this.continueButton)) {
      this.stateManager.change('prep');
      return;
    }
    if (pointInRect(point, this.buttons.newRun)) {
      if (this.game.run) this.confirmingNewRun = true;
      else this.startNewRun();
      return;
    }
    if (pointInRect(point, this.buttons.codex)) this.stateManager.change('codex');
  }

  // Activate a settings control while keeping the underlying menu blocked.
  handleSettingsPointerDown(point) {
    if (pointInRect(point, this.settingsControls.close)) {
      this.settingsOpen = false;
      this.persistSettings();
      return;
    }
    if (pointInRect(point, this.settingsControls.name)) {
      const requested = this.game.requestPlayerName?.(this.game.saveData.playerName);
      if (typeof requested === 'string') {
        this.game.saveData.playerName = requested.trim().slice(0, CONFIG.PLAYER_NAME_MAX_LENGTH) || CONFIG.DEFAULT_SAVE.playerName;
        this.persistSettings();
      }
      return;
    }
    for (const key of ['music', 'sound']) {
      if (!pointInRect(point, this.settingsControls[key])) continue;
      this.activeSlider = key;
      this.updateSlider(key, point.x);
      return;
    }
  }

  // Update a held volume slider on pointer movement.
  handlePointerMove(point) {
    if (this.settingsOpen && this.activeSlider) this.updateSlider(this.activeSlider, point.x);
  }

  // Finish a settings slider drag and persist its latest value.
  handlePointerUp() {
    if (!this.activeSlider) return;
    this.activeSlider = null;
    this.persistSettings();
  }

  // Convert a logical pointer position into a normalized audio level.
  updateSlider(key, x) {
    const rect = this.settingsControls[key];
    const value = Math.max(0, Math.min(CONFIG.ARENA_ALIVE_ALPHA, (x - rect.x) / rect.width));
    const field = key === 'music' ? 'musicVolume' : 'soundVolume';
    this.game.saveData[field] = value;
    if (key === 'music') this.game.music?.setVolume(value);
    if (key === 'sound') setSoundVolume(value);
  }

  // Save identity and audio preferences without altering the active run.
  persistSettings() {
    this.game.saveData = save(this.game.saveData);
  }

  // Replace any previous run, persist it, and enter prep.
  startNewRun() {
    this.game.run = createRunState(this.game.saveData.unlockedDragons);
    this.game.saveData = save({ ...this.game.saveData, activeRun: this.game.run });
    this.confirmingNewRun = false;
    this.stateManager.change('prep');
  }
}
