import { ITEMS, SKINS, getSkin } from '../game/items';
import type { ItemCategory, ItemTone, ToolItem } from '../types';

interface ToolbarProps {
  activeItemId: string;
  unlockedItems: string[];
  unlockedSkins: string[];
  activeSkinId: string | null;
  money: number;
  onSelectItem: (id: string) => void;
  onSelectSkin: (id: string) => void;
  onBuyItem: (id: string) => void;
  onBuySkin: (id: string) => void;
}

const categoryLabels: Record<ItemCategory, string> = {
  hand: 'Hands',
  care: 'Care',
  toy: 'Toys',
  mayhem: 'Mayhem',
  explosive: 'Explosives',
  utility: 'Physics',
};

const categoryOrder: ItemCategory[] = ['hand', 'care', 'toy', 'mayhem', 'explosive', 'utility'];

const itemIcons: Record<string, string> = {
  fist:       '🤜',
  tickle:     '🪶',
  comfort:    '🖐️',
  treat:      '🍬',
  grenade:    '💣',
  pistol:     '🔫',
  shotgun:    '💥',
  machinegun: '🧨',
  flamethrower:'🔥',
  missile:    '🚀',
  bowling:    '🎳',
  fireball:   '☄️',
  mine:       '🚨',
  stun:       '⚡',
  rubberballs:'🔴',
  flail:      '⛓️',
  molotov:    '🍾',
  gravity:    '🌌',
  magicorb:   '🔮',
  radio:      '📻',
};

function ownedBadgeClass(tone: ItemTone): string {
  return `tool-badge owned-${tone}`;
}

function ownedBadgeLabel(tone: ItemTone): string {
  if (tone === 'care') return 'READY';
  if (tone === 'violent') return 'ARMED';
  return 'ACTIVE';
}

function groupedItems() {
  return categoryOrder
    .map(cat => ({ cat, items: ITEMS.filter(i => i.category === cat) }))
    .filter(g => g.items.length > 0);
}

function ToolCard({
  item,
  owned,
  canAfford,
  isActive,
  onSelect,
  onBuy,
}: {
  item: ToolItem;
  owned: boolean;
  canAfford: boolean;
  isActive: boolean;
  onSelect: () => void;
  onBuy: () => void;
}) {
  const disabled = !owned && !canAfford;

  let badge: { label: string; cls: string } | null = null;
  if (owned) {
    badge = { label: ownedBadgeLabel(item.tone), cls: ownedBadgeClass(item.tone) };
  } else if (canAfford) {
    badge = { label: `$${item.cost}`, cls: 'tool-badge buy' };
  } else {
    badge = { label: `$${item.cost}`, cls: 'tool-badge locked' };
  }

  return (
    <button
      className={`tool-card ${isActive ? 'active' : ''} ${item.tone}`}
      disabled={disabled}
      title={item.description}
      onClick={() => owned ? onSelect() : canAfford ? onBuy() : undefined}
    >
      <span className="tool-icon">{itemIcons[item.id] ?? '🔧'}</span>
      <span className="tool-name">{item.name}</span>
      {badge && <span className={badge.cls}>{badge.label}</span>}
    </button>
  );
}

export function Toolbar({
  activeItemId,
  unlockedItems,
  unlockedSkins,
  activeSkinId,
  money,
  onSelectItem,
  onSelectSkin,
  onBuyItem,
  onBuySkin,
}: ToolbarProps) {
  const activeSkin = getSkin(activeSkinId ?? 'default');
  void activeSkin; // used for active class

  return (
    <aside className="tool-dock" aria-label="Studio controls">
      <div className="dock-scroll">
        {groupedItems().map(({ cat, items }) => (
          <section className="tool-section" key={cat}>
            <div className="section-heading">
              <span>{categoryLabels[cat]}</span>
              <span className="section-count">{items.filter(i => unlockedItems.includes(i.id)).length}/{items.length}</span>
            </div>
            <div className="tool-list">
              {items.map(item => (
                <ToolCard
                  key={item.id}
                  item={item}
                  owned={unlockedItems.includes(item.id)}
                  canAfford={money >= item.cost}
                  isActive={activeItemId === item.id}
                  onSelect={() => onSelectItem(item.id)}
                  onBuy={() => onBuyItem(item.id)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Skins */}
        <section className="tool-section">
          <div className="section-heading skin-section-label">
            <span>Appearance</span>
            <span className="section-count">{unlockedSkins.length}/{SKINS.length}</span>
          </div>
          <div className="skin-grid">
            {SKINS.map(skin => {
              const owned = unlockedSkins.includes(skin.id) || skin.cost === 0;
              const canAfford = money >= skin.cost;
              const isActive = activeSkinId === skin.id;

              return (
                <button
                  key={skin.id}
                  className={`skin-btn ${isActive ? 'active' : ''}`}
                  disabled={!owned && !canAfford}
                  title={skin.name + (owned ? '' : ` — $${skin.cost}`)}
                  onClick={() => {
                    if (owned) onSelectSkin(skin.id);
                    else if (canAfford) onBuySkin(skin.id);
                  }}
                >
                  <span className="skin-swatch" style={{ backgroundColor: skin.color }} />
                  <span className="skin-label">{skin.name.replace(' Buddy', '').replace('Buddy', 'Base')}</span>
                  {!owned && <span className="skin-cost">${skin.cost}</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
