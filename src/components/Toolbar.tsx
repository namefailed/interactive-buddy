import { useState } from 'react';
import { ITEMS, SKINS, getItem, getSkin } from '../game/items';

interface ToolbarProps {
  activeItemId: string;
  unlockedItems: string[];
  unlockedSkins: string[];
  activeSkinId: string | null;
  money: number;
  onSelectItem: (id: string) => void;
  onSelectSkin: (color: string) => void;
  onBuyItem: (id: string) => void;
  onBuySkin: (id: string) => void;
}

type Tab = 'items' | 'skins';

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
  const [tab, setTab] = useState<Tab>('items');

  const activeItem = getItem(activeItemId);
  const activeSkin = getSkin(activeSkinId ?? '');

  return (
    <div style={modern.container}>
      <div style={modern.header}>
        <div style={modern.tabs}>
          <button
            onClick={() => setTab('items')}
            style={{
              ...modern.tab,
              ...(tab === 'items' ? modern.tabActive : {}),
            }}
          >
            Items
          </button>
          <button
            onClick={() => setTab('skins')}
            style={{
              ...modern.tab,
              ...(tab === 'skins' ? modern.tabActive : {}),
            }}
          >
            Skins
          </button>
        </div>
      </div>

      <div style={modern.body}>
        {tab === 'items' && (
          <div style={modern.grid}>
            {ITEMS.map(item => {
              const owned = unlockedItems.includes(item.id);
              const canAfford = money >= item.cost;
              const isActive = activeItemId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (owned) onSelectItem(item.id);
                    else if (canAfford) onBuyItem(item.id);
                  }}
                  style={{
                    ...modern.card,
                    ...(isActive ? modern.cardActive : {}),
                    ...(!owned && !canAfford ? modern.cardLocked : {}),
                    opacity: owned ? 1 : canAfford ? 0.7 : 0.35,
                    cursor: owned || canAfford ? 'pointer' : 'not-allowed',
                  }}
                  title={`${item.description} — $${item.cost}`}
                >
                  <span style={modern.icon}>{itemIcons[item.id] || '🔫'}</span>
                  <span style={modern.label}>{item.name}</span>
                  {!owned && <span style={modern.price}>${item.cost}</span>}
                  {owned && <span style={modern.owned}>✓</span>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'skins' && (
          <div style={modern.grid}>
            {SKINS.map(skin => {
              const owned = unlockedSkins.includes(skin.id) || skin.cost === 0;
              const canAfford = money >= skin.cost;
              const isActive = activeSkinId === skin.id;
              return (
                <div
                  key={skin.id}
                  onClick={() => {
                    if (owned) onSelectSkin(skin.color);
                    else if (canAfford) onBuySkin(skin.id);
                  }}
                  style={{
                    ...modern.card,
                    ...(isActive ? modern.cardActive : {}),
                    ...(!owned && !canAfford ? modern.cardLocked : {}),
                    opacity: owned ? 1 : canAfford ? 0.7 : 0.35,
                    cursor: owned || canAfford ? 'pointer' : 'not-allowed',
                  }}
                >
                  <div style={{ ...modern.swatch, background: skin.color }} />
                  <span style={modern.label}>{skin.name}</span>
                  {skin.cost > 0 && !owned && <span style={modern.price}>${skin.cost}</span>}
                  {owned && <span style={modern.owned}>✓</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={modern.footer}>
        <span style={modern.footerText}>
          {activeItem?.name}
          {activeSkin && ` · ${activeSkin.name}`}
        </span>
      </div>
    </div>
  );
}

const itemIcons: Record<string, string> = {
  fist: '✊', tickle: '🪶', grenade: '💣', pistol: '🔫', shotgun: '🔫',
  machinegun: '🔫', flamethrower: '🔥', missile: '🚀', bowling: '🎳',
  fireball: '🔥', mine: '💣', stun: '⚡', rubberballs: '⚾', flail: '🔗',
  molotov: '🧪', gravity: '🌀', magicorb: '🔮', radio: '📻',
};

const modern: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(20,20,40,0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    width: 290,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  header: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '6px 12px 0',
  },
  tabs: {
    display: 'flex',
    gap: 2,
  },
  tab: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '8px 12px',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.3px',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  tabActive: {
    color: '#fff',
    borderBottom: '2px solid #6c5ce7',
  },
  body: {
    height: 280,
    overflowY: 'auto',
    padding: 8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 6,
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: '8px 4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.15s',
    position: 'relative',
  },
  cardActive: {
    background: 'rgba(108,92,231,0.15)',
    border: '1px solid rgba(108,92,231,0.4)',
    boxShadow: '0 0 12px rgba(108,92,231,0.15)',
  },
  cardLocked: {
    filter: 'grayscale(0.5)',
  },
  icon: {
    fontSize: 22,
    lineHeight: 1,
  },
  label: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 1.2,
    fontWeight: 500,
  },
  price: {
    fontSize: 9,
    color: '#ffd700',
    fontWeight: 700,
  },
  owned: {
    fontSize: 9,
    color: '#2ecc71',
    fontWeight: 700,
    position: 'absolute',
    top: 3,
    right: 5,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.1)',
  },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '6px 12px',
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
};
