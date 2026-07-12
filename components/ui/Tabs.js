'use client';

/**
 * Tabs component — underline style matching the mockup
 */
export default function Tabs({ tabs, activeTab, onTabChange, accent = 'blue' }) {
  const accentMap = {
    blue: 'border-[var(--blue)] text-[var(--blue)]',
    green: 'border-[var(--green)] text-[var(--green)]',
    purple: 'border-[var(--purple)] text-[var(--purple)]',
    orange: 'border-[var(--orange)] text-[var(--orange)]',
  };

  const activeStyle = accentMap[accent] || accentMap.blue;

  return (
    <div className="flex items-center border-b border-[var(--border)] gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === (tab.value ?? tab);
        const label = tab.label ?? tab;
        const value = tab.value ?? tab;

        return (
          <button
            key={value}
            onClick={() => onTabChange(value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              isActive
                ? `${activeStyle} border-b-2`
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.icon && (
              <span className="mr-1.5">{tab.icon}</span>
            )}
            {label}
            {tab.count != null && (
              <span
                className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  isActive ? 'bg-[var(--blue)]/20 text-[var(--blue)]' : 'bg-[var(--panel2)] text-[var(--muted)]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
