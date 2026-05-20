import { ITEMS, SKINS, getItem, getSkin } from '../game/items';
import type { ItemCategory, ToolItem } from '../types';

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

const itemTokens: Record<string, string> = {
  fist: 'FST',
  tickle: 'TKL',
  comfort: 'PET',
  treat: 'TRT',
  grenade: 'GRN',
  pistol: 'PST',
  shotgun: 'SHG',
  machinegun: 'MG',
  flamethrower: 'FLM',
  missile: 'MSL',
  bowling: 'BWL',
  fireball: 'FIR',
  mine: 'MIN',
  stun: 'STN',
  rubberballs: 'RBR',
  flail: 'FLA',
  molotov: 'MOL',
  gravity: 'GRV',
  magicorb: 'ORB',
  radio: 'RAD',
};

function groupedItems() {
  return categoryOrder
    .map(category => ({ category, items: ITEMS.filter(item => item.category === category) }))
    .filter(group => group.items.length > 0);
}

function actionLabel(owned: boolean, canAfford: boolean, item: ToolItem) {
  if (owned) return item.tone === 'care' ? 'Ready' : 'Armed';
  if (canAfford) return 'Buy $' + item.cost;
  return '$' + item.cost;
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
  const activeItem = getItem(activeItemId);
  const activeSkin = getSkin(activeSkinId ?? 'default');

  return (
    <aside className="tool-dock" aria-label="Studio controls">
      <header className="dock-header">
        <span className="eyebrow">Loadout</span>
        <strong>{activeItem?.name ?? 'No tool'}</strong>
        <small>{activeItem?.description}</small>
      </header>

      <div className="dock-scroll">
        {groupedItems().map(group => (
          <section className="tool-section" key={group.category}>
            <div className="section-heading">
              <span>{categoryLabels[group.category]}</span>
              <span>{group.items.length}</span>
            </div>
            <div className="tool-list">
              {group.items.map(item => {
                const owned = unlockedItems.includes(item.id);
                const canAfford = money >= item.cost;
                const isActive = activeItemId === item.id;
                const disabled = !owned && !canAfford;

                return (
                  <button
                    className={'tool-card ' + (isActive ? 'active ' : '') + (owned ? 'owned ' : 'locked ') + item.tone}
                    disabled={disabled}
                    key={item.id}
                    title={item.description}
                    onClick={() => {
                      if (owned) onSelectItem(item.id);
                      else if (canAfford) onBuyItem(item.id);
                    }}
                  >
                    <span className="tool-token">{itemTokens[item.id] ?? item.name.slice(0, 3).toUpperCase()}</span>
                    <span className="tool-copy">
                      <strong>{item.name}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span className="tool-meta">{actionLabel(owned, canAfford, item)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <section className="tool-section skins-section">
          <div className="section-heading">
            <span>Skins</span>
            <span>{unlockedSkins.length}/{SKINS.length}</span>
          </div>
          <div className="skin-grid">
            {SKINS.map(skin => {
              const owned = unlockedSkins.includes(skin.id) || skin.cost === 0;
              const canAfford = money >= skin.cost;
              const isActive = activeSkinId === skin.id;
              const disabled = !owned && !canAfford;

              return (
                <button
                  className={'skin-card ' + (isActive ? 'active' : '')}
                  disabled={disabled}
                  key={skin.id}
                  onClick={() => {
                    if (owned) onSelectSkin(skin.id);
                    else if (canAfford) onBuySkin(skin.id);
                  }}
                >
                  <span className="skin-swatch" style={{ backgroundColor: skin.color }} />
                  <span>{skin.name}</span>
                  {!owned && <small>Cost {skin.cost}</small>}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="dock-footer">
        <span>Suit</span>
        <strong>{activeSkin?.name ?? 'Buddy'}</strong>
      </footer>
    </aside>
  );
}
