const BACKGROUND_SOURCES = {
  loading: new URL('../background/loading.png', import.meta.url).href,
  menu: new URL('../background/main_menu.png', import.meta.url).href,
  prep: new URL('../background/prep_phase.png', import.meta.url).href,
  fight: new URL('../background/fight_phase.png', import.meta.url).href,
  codex: new URL('../background/codex.png', import.meta.url).href,
};

const UI_SOURCES = {
  gameTitle: new URL('../background/game-name.png', import.meta.url).href,
};

const DRAGON_ELEMENTS = {
  ember: 'Fire',
  stonescale: 'Earth',
  zephyr: 'Wind',
  tidecaller: 'Water',
  voltfang: 'Energy',
  nightshade: 'Shadow',
  crystalwing: 'Metal',
  solflare: 'Light',
};

const imageCache = new Map();

// Return the background image for a named game phase.
export function getBackgroundImage(phase) {
  return getImage(BACKGROUND_SOURCES[phase]);
}

// Return the shared Wyrmpit title artwork.
export function getGameTitleImage() {
  return getImage(UI_SOURCES.gameTitle);
}

// Return a dragon sprite, reusing Tier 2 artwork for Tier 3.
export function getDragonImage(id, tier) {
  const descriptor = getDragonSpriteDescriptor(id, tier);
  if (!descriptor) return null;
  const source = new URL(`../sprites/${descriptor.element}_Dragon_T${descriptor.artworkTier}.png`, import.meta.url).href;
  return getImage(source);
}

// Describe which element artwork a dragon tier uses without loading browser images.
export function getDragonSpriteDescriptor(id, tier) {
  const element = DRAGON_ELEMENTS[id];
  if (!element) return null;
  return { element, artworkTier: tier <= 1 ? 1 : 2 };
}

// Load all runtime images before the first interactive frame.
export async function preloadAssets(onProgress = () => {}) {
  if (typeof Image === 'undefined') return;
  const sources = [
    ...Object.values(BACKGROUND_SOURCES),
    ...Object.values(UI_SOURCES),
    ...Object.values(DRAGON_ELEMENTS).flatMap(element => [
      new URL(`../sprites/${element}_Dragon_T1.png`, import.meta.url).href,
      new URL(`../sprites/${element}_Dragon_T2.png`, import.meta.url).href,
    ]),
  ];
  let completed = 0;
  onProgress(completed / sources.length);
  await Promise.all(sources.map(async source => {
    await loadImage(source);
    completed += 1;
    onProgress(completed / sources.length);
  }));
}

// Return a cached browser image without creating DOM dependencies in logic tests.
function getImage(source) {
  if (!source || typeof Image === 'undefined') return null;
  if (!imageCache.has(source)) loadImage(source);
  return imageCache.get(source) || null;
}

// Cache one image and resolve after it is decoded or fails gracefully.
function loadImage(source) {
  if (imageCache.has(source)) {
    const cached = imageCache.get(source);
    return cached.complete ? Promise.resolve(cached) : waitForImage(cached);
  }
  const image = new Image();
  image.decoding = 'async';
  imageCache.set(source, image);
  const ready = waitForImage(image);
  image.src = source;
  return image.complete ? Promise.resolve(image) : ready;
}

// Resolve image loading without preventing the game from booting on one bad asset.
function waitForImage(image) {
  if (image.complete) return Promise.resolve(image);
  return new Promise(resolve => {
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => resolve(image), { once: true });
  });
}
