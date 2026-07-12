'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Leaf, Users, ShieldCheck, BarChart3, Sliders, FileText, ArrowRight } from 'lucide-react';
import CustomReportBuilder from './custom/CustomReportBuilder';

export default function ReportsHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('environmental');

  const tabs = [
    { value: 'environmental', label: 'Environmental', icon: <Leaf size={14} className="inline mr-1" /> },
    { value: 'social', label: 'Social', icon: <Users size={14} className="inline mr-1" /> },
    { value: 'governance', label: 'Governance', icon: <ShieldCheck size={14} className="inline mr-1" /> },
    { value: 'esg-summary', label: 'ESG Summary', icon: <BarChart3 size={14} className="inline mr-1" /> },
    { value: 'custom', label: 'Custom Builder', icon: <Sliders size={14} className="inline mr-1" /> },
  ];

  const cardsInfo = {
    environmental: {
      title: 'Environmental Report',
      desc: 'Emissions, goals, vendor & product breakdown',
      slug: 'environmental',
      accent: 'green',
      icon: <Leaf size={48} className="text-[var(--green)]" />,
      colorClass: 'border-t-4 border-t-[var(--green)]',
    },
    social: {
      title: 'Social Report',
      desc: 'Diversity, CSR participation, training completion',
      slug: 'social',
      accent: 'blue',
      icon: <Users size={48} className="text-[var(--blue)]" />,
      colorClass: 'border-t-4 border-t-[var(--blue)]',
    },
    governance: {
      title: 'Governance Report',
      desc: 'Policies, audits, compliance & risk summary',
      slug: 'governance',
      accent: 'purple',
      icon: <ShieldCheck size={48} className="text-[var(--purple)]" />,
      colorClass: 'border-t-4 border-t-[var(--purple)]',
    },
    'esg-summary': {
      title: 'ESG Summary',
      desc: 'Executive overview: all 4 scores + dept comparison',
      slug: 'esg-summary',
      accent: 'orange',
      icon: <BarChart3 size={48} className="text-[var(--orange)]" />,
      colorClass: 'border-t-4 border-t-[var(--orange)]',
    },
  };

  const handleGenerate = (slug) => {
    router.push(`/reports/${slug}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)] font-space-grotesk flex items-center gap-2">
          <FileText size={28} className="text-[var(--blue)]" />
          Reports Hub
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Generate, customize, and export ESG standard reports for EcoSphere compliance.
        </p>
      </div>

      <div className="border-b border-[var(--border)] pb-2">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accent={
            activeTab === 'environmental'
              ? 'green'
              : activeTab === 'governance'
              ? 'purple'
              : activeTab === 'custom'
              ? 'orange'
              : 'blue'
          }
        />
      </div>

      <div className="mt-6">
        {activeTab === 'custom' ? (
          <CustomReportBuilder />
        ) : (
          <div className="max-w-2xl mx-auto">
            {(() => {
              const card = cardsInfo[activeTab];
              if (!card) return null;
              return (
                <Card className={`transition-all duration-300 hover:shadow-xl ${card.colorClass} p-8 space-y-6`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-[var(--text)] font-space-grotesk">
                        {card.title}
                      </h2>
                      <p className="text-[var(--muted)] text-base">
                        {card.desc}
                      </p>
                    </div>
                    <div className="p-4 bg-[var(--panel2)] rounded-2xl">
                      {card.icon}
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] pt-6 flex items-center justify-between">
                    <span className="text-xs text-[var(--muted)] uppercase tracking-wider">
                      Module Report • A4 Standard PDF/Excel Export
                    </span>
                    <Button
                      variant={card.accent}
                      onClick={() => handleGenerate(card.slug)}
                      className="px-6 py-2.5 flex items-center gap-2"
                    >
                      Generate Report
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </Card>
              );
            })()}
          </div>
        )}
      </div>

      {/* Grid view of all reports at the bottom to wow the user */}
      {activeTab !== 'custom' && (
        <div className="mt-12 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
            All Report Modules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(cardsInfo).map(([key, card]) => (
              <Card
                key={key}
                className={`cursor-pointer border border-[var(--border)] hover:border-[var(--blue)] hover:bg-[var(--panel2)] transition-all duration-200 p-5 flex items-center justify-between ${
                  activeTab === key ? 'ring-2 ring-[var(--blue)] bg-[var(--panel2)]' : ''
                }`}
                onClick={() => setActiveTab(key)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--panel)] rounded-xl border border-[var(--border)]">
                    {card.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[var(--text)] font-space-grotesk">
                      {card.title}
                    </h4>
                    <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">
                      {card.desc}
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[var(--muted)]" />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
