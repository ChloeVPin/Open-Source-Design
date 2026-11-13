import { buildBranch, drawBranch, reachTime } from './branch.js';
import { icons } from './icons.js';
import { PX, Raster } from './raster.js';
import { ROOT, UNIT, isText } from './tree.js';

const VIEW_W = 891; // content area, CSS px — both multiples of PX
const VIEW_H = 561;
const START_DELAY = 0.35; // seconds before the first branch starts to grow
const WITHER_TIME = 0.5; // seconds for a closed folder's branch to die back
const SETTLE_TIME = 4; // seconds after which a grown branch stops changing

const canvas = document.querySelector('.content__canvas');
const world = document.querySelector('.content__world');
const count = document.querySelector('.statusbar__count');
const windowEl = document.querySelector('.window');
const raster = new Raster(canvas, VIEW_W / PX, VIEW_H / PX);
const calm = matchMedia('(prefers-reduced-motion: reduce)');

const params = new URLSearchParams(location.search);

/* ------------------------------------------------------------------- model */

const nodes = [];

function seedOf(name) {
  let h = 2166136261;
  for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Lay out a file or folder (and everything inside it) at a point in the world. */
function build(def, parent, x, y) {
  const node = {
    def, parent, x, y,
    folder: !!def.branch,
    children: [],
    branch: null,
    anchor: 0, // where on the parent's branch this item hangs
    open: false,
    born: -1, // when its branch began to grow
    died: -1, // when its branch began to wither
    shown: false,
    el: null,
  };
  nodes.push(node);
  if (node.folder) {
    node.branch = buildBranch(def.branch, x, y, seedOf(def.name));
    for (const child of def.children) {
      const c = build(child, node, x + child.at[0] * UNIT, y + child.at[1] * UNIT);
      c.anchor = node.branch.nearest(c.x, c.y);
      node.children.push(c);
    }
  }
  return node;
}

const root = build(ROOT, null, 0, 0);

for (const node of nodes) {
  if (node === root) continue;
  const { def } = node;
  const el = document.createElement('button');
  el.type = 'button';
  el.tabIndex = -1;
  el.className = `item item--${node.folder ? 'folder' : 'file'} item--${def.label}`;
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;
  const icon = node.folder ? icons.folder : isText(def.name) ? icons.text : icons.blank;
  el.innerHTML = `<span class="item__icon">${icon}</span><span class="item__label"></span>`;
  el.lastChild.textContent = node.folder ? `${def.name}/` : def.name;
  if (node.folder) {
    el.setAttribute('aria-expanded', 'false');
    el.addEventListener('click', () => toggle(node));
  }
  node.el = el;
  world.append(el);
}

/* ------------------------------------------------------------------ camera */

let now = 0;
let dirty = true; // something changed, so the picture needs redrawing
let focus = root;
const camera = { x: 0, y: 0 };

/** Grow a box to take in a folder's branch, its icon, and the items hanging on the branch. */
function extend(box, node) {
  const b = node.branch.bbox;
  box.minX = Math.min(box.minX, b.minX, node.x - 30);
  box.maxX = Math.max(box.maxX, b.maxX);
  box.minY = Math.min(box.minY, b.minY);
  box.maxY = Math.max(box.maxY, b.maxY, node.y + 30);
  for (const c of node.children) {
    const below = c.def.label === 'below';
    box.minX = Math.min(box.minX, c.x - (below ? 60 : 20));
    box.maxX = Math.max(box.maxX, c.x + (below ? 60 : 30 + c.def.name.length * 10.5));
    box.minY = Math.min(box.minY, c.y - 22);
    box.maxY = Math.max(box.maxY, c.y + (below ? 52 : 22));
  }
}

/**
 * Where the view should rest for a folder: centred on its branch plus the
 * room its sub-folders would need if opened next, without ever pushing the
 * folder itself out of sight.
 */
function frame(node) {
  if (node === root) return { x: 0, y: 0 };
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  extend(box, node);
  for (const c of node.children) if (c.folder) extend(box, c);
  const margin = 48;
  const x = (box.minX + box.maxX) / 2 - VIEW_W / 2, y = (box.minY + box.maxY) / 2 - VIEW_H / 2;
  return {
    x: Math.min(node.x - margin, Math.max(node.x - VIEW_W + margin, x)),
    y: Math.min(node.y - margin, Math.max(node.y - VIEW_H + margin, y)),
  };
}

/* ------------------------------------------------------------- interaction */

function open(node) {
  node.open = true;
  node.born = calm.matches ? now - SETTLE_TIME : now;
  node.died = -1;
  dirty = true;
  node.el?.classList.add('is-open');
  node.el?.setAttribute('aria-expanded', 'true');
}

function close(node) {
  for (const c of node.children) if (c.open) close(c);
  node.open = false;
  node.died = calm.matches ? now - WITHER_TIME : now;
  dirty = true;
  node.el.classList.remove('is-open');
  node.el.setAttribute('aria-expanded', 'false');
}

function toggle(node) {
  if (node.open) {
    close(node);
    focus = node.parent;
  } else {
    open(node);
    focus = node;
  }
}

/* -------------------------------------------------------------------- loop */

let lastCount = -1;

/** Reveal each item once its parent's branch has grown out to it; hide it when the folder closes. */
function updateItems() {
  let visible = 0;
  for (const node of nodes) {
    if (node === root) continue;
    const p = node.parent;
    const shown = p.open && now - p.born >= reachTime(p.branch, node.anchor) + 0.08;
    if (shown) visible++;
    if (shown !== node.shown) {
      node.shown = shown;
      node.el.classList.toggle('is-visible', shown);
      node.el.tabIndex = shown ? 0 : -1;
    }
  }
  if (visible !== lastCount) {
    lastCount = visible;
    count.textContent = `${visible} ${visible === 1 ? 'item' : 'items'}`;
  }
}

function render() {
  // The view moves in whole art pixels so the picture never shimmers.
  const cx = Math.round(camera.x / PX) * PX, cy = Math.round(camera.y / PX) * PX;
  raster.clear();
  let busy = false;
  for (const node of nodes) {
    if (!node.folder || node.born < 0) continue;
    const dying = node.died >= 0;
    const life = dying ? 1 - (now - node.died) / WITHER_TIME : 1;
    if (life <= 0) { node.born = -1; continue; }
    const age = now - node.born;
    if (dying || age < SETTLE_TIME) busy = true;
    drawBranch(raster, node.branch, age, life, cx, cy);
  }
  raster.resolve(cx / PX, cy / PX);
  world.style.transform = `translate(${-cx}px, ${-cy}px)`;
  return busy;
}

/** Advance the simulation by `dt` seconds. Returns whether the view is still travelling. */
function step(dt) {
  now += dt;
  if (!root.open && now >= START_DELAY) open(root);

  const goal = frame(focus);
  const k = calm.matches ? 1 : 1 - Math.exp(-dt * 4.2);
  const dx = goal.x - camera.x, dy = goal.y - camera.y;
  const moving = Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4;
  camera.x = moving ? camera.x + dx * k : goal.x;
  camera.y = moving ? camera.y + dy * k : goal.y;
  updateItems();
  return moving;
}

let last = performance.now();
function tick(time) {
  const dt = Math.min(0.05, (time - last) / 1000);
  last = time;
  const moving = step(dt);
  // Once everything has grown in and the view is at rest there is nothing to redraw.
  if (dirty || moving) dirty = render() || moving;
  if (!params.has('freeze')) requestAnimationFrame(tick);
}

function fit() {
  const s = Math.min(1, (innerWidth - 32) / 891, (innerHeight - 32) / 643);
  windowEl.style.setProperty('--fit', s.toFixed(4));
}
addEventListener('resize', fit);
fit();

// ?open=woodland,old-oak   click these folders in order on load (repeat a name to close it)
// ?t=6                     then fast-forward that many seconds (handy for screenshots)
// ?freeze                  draw that one frame and stop
const clicks = (params.get('open') || '').split(',').filter(Boolean);
const skip = Number(params.get('t')) || 0;
if (clicks.length) step(START_DELAY);
for (const name of clicks) {
  const node = nodes.find((n) => n.folder && n.def.name === name);
  if (!node) continue;
  for (let i = 0; i < 100; i++) step(1 / 60); // let each branch grow before the next click
  toggle(node);
}
for (let i = 0; i < skip * 60; i++) step(1 / 60);

requestAnimationFrame(tick);
