'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Trophy, Building2, User, Zap } from 'lucide-react';

const MEDAL_CONFIG = [
  { border: 'border-l-4 border-[#FFD700] bg-[#FFD700]/5', icon: '🥇', label: 'Gold' },
  { border: 'border-l-4 border-[#C0C0C0] bg-[#C0C0C0]/5', icon: '🥈', label: 'Silver' },
  { border: 'border-l-4 border-[#CD7F32] bg-[#CD7F32]/5', icon: '🥉', label: 'Bronze' }
];

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-sm font-bold text-[var(--muted)] w-7 text-center">#{rank}</span>;
}

function LeaderRow({ item, rank }) {
  const medalCfg = rank <= 3 ? MEDAL_CONFIG[rank - 1] : null;
  const isDept = item.type === 'department';

  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border)]/50 transition-colors hover:bg-[var(--panel2)]/40 ${medalCfg ? medalCfg.border : ''}`}>
      {/* Rank */}
      <div className="w-9 flex items-center justify-center shrink-0">
        <RankBadge rank={rank} />
      </div>

      {/* Avatar / type icon */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        isDept ? 'bg-[var(--purple)]/15 text-[var(--purple)]' : 'bg-[var(--orange)]/15 text-[var(--orange)]'
      }`}>
        {isDept ? <Building2 size={16} /> : <User size={16} />}
      </div>

      {/* Name + label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text)] truncate">{item.displayName || item.name}</p>
        <p className="text-[11px] text-[var(--muted)]">{isDept ? 'Department' : item.label || item.department}</p>
      </div>

      {/* XP */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Zap size={13} className="text-[var(--orange)]" />
        <span className="text-sm font-extrabold text-[var(--text)] font-space">{item.xp.toLocaleString()}</span>
        <span className="text-[11px] text-[var(--muted)]">XP</span>
      </div>
    </div>
  );
}

function EmployeeTable({ board }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider">
            <th className="text-left px-5 py-3 font-semibold w-12">Rank</th>
            <th className="text-left px-4 py-3 font-semibold">Employee</th>
            <th className="text-left px-4 py-3 font-semibold">Department</th>
            <th className="text-right px-5 py-3 font-semibold">XP</th>
          </tr>
        </thead>
        <tbody>
          {board.map((item, i) => {
            const medalCfg = i < 3 ? MEDAL_CONFIG[i] : null;
            return (
              <tr key={item.id} className={`border-b border-[var(--border)]/50 hover:bg-[var(--panel2)]/60 transition-colors ${medalCfg ? medalCfg.border : ''} ${i % 2 !== 0 ? 'bg-[var(--panel2)]/20' : ''}`}>
                <td className="px-5 py-3">
                  <RankBadge rank={item.rank} />
                </td>
                <td className="px-4 py-3 font-medium text-[var(--text)]">{item.name}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{item.department}</td>
                <td className="px-5 py-3 text-right">
                  <span className="font-extrabold text-[var(--orange)] font-space">{item.xp.toLocaleString()}</span>
                  <span className="text-[11px] text-[var(--muted)] ml-1">XP</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DeptTable({ board }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider">
            <th className="text-left px-5 py-3 font-semibold w-12">Rank</th>
            <th className="text-left px-4 py-3 font-semibold">Department</th>
            <th className="text-right px-5 py-3 font-semibold">Total XP</th>
          </tr>
        </thead>
        <tbody>
          {board.map((item, i) => {
            const medalCfg = i < 3 ? MEDAL_CONFIG[i] : null;
            return (
              <tr key={item.name} className={`border-b border-[var(--border)]/50 hover:bg-[var(--panel2)]/60 transition-colors ${medalCfg ? medalCfg.border : ''} ${i % 2 !== 0 ? 'bg-[var(--panel2)]/20' : ''}`}>
                <td className="px-5 py-3">
                  <RankBadge rank={item.rank} />
                </td>
                <td className="px-4 py-3 font-medium text-[var(--text)] flex items-center gap-2">
                  <Building2 size={14} className="text-[var(--purple)] shrink-0" />
                  {item.name}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="font-extrabold text-[var(--purple)] font-space">{item.xp.toLocaleString()}</span>
                  <span className="text-[11px] text-[var(--muted)] ml-1">XP</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CombinedList({ combined }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
      {combined.map((item) => (
        <LeaderRow key={`${item.type}-${item.id}`} item={item} rank={item.rank} />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState({ employeeBoard: [], deptBoard: [], combined: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('combined');
  const toast = useToast();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/gamification/leaderboard');
        if (res.ok) setData(await res.json());
        else toast.error('Failed to load leaderboard');
      } catch { toast.error('Network error'); }
      finally { setLoading(false); }
    };
    fetchLeaderboard();
  }, []); // eslint-disable-line

  const TABS = [
    { key: 'combined',  label: '🏆 Combined'   },
    { key: 'employees', label: '👤 Employees'   },
    { key: 'departments',label: '🏢 Departments' }
  ];

  const top3 = data.combined.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Leaderboard</h1>
        <p className="text-sm text-[var(--muted)]">Top performers in ESG — employees and departments ranked by lifetime XP.</p>
      </div>

      {/* Podium top-3 */}
      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {top3.map((item, i) => {
            const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];
            const heights = ['h-24', 'h-20', 'h-16'];
            return (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-center">
                <span className="text-3xl">{MEDAL_CONFIG[i].icon}</span>
                <div>
                  <p className="text-sm font-bold text-[var(--text)] leading-tight">{item.displayName || item.name}</p>
                  <p className="text-[11px] text-[var(--muted)]">{item.type === 'department' ? 'Dept' : item.label || item.department}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Zap size={12} style={{ color: medals[i] }} />
                  <span className="font-extrabold text-sm font-space" style={{ color: medals[i] }}>
                    {item.xp.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab selector */}
      <div className="flex gap-1 bg-[var(--panel2)] p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-[var(--panel)] text-[var(--text)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[var(--muted)]">Loading leaderboard...</div>
      ) : (
        <>
          {activeTab === 'combined' && <CombinedList combined={data.combined} />}
          {activeTab === 'employees' && <EmployeeTable board={data.employeeBoard} />}
          {activeTab === 'departments' && <DeptTable board={data.deptBoard} />}
        </>
      )}
    </div>
  );
}