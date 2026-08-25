import React, { useState, useMemo } from 'react';
import { Clock, Flame, Calendar, Sparkles, TrendingUp } from 'lucide-react';

interface PeakActivityHeatmapProps {
  title?: string;
  subtitle?: string;
}

export const PeakActivityHeatmap: React.FC<PeakActivityHeatmapProps> = ({
  title = "Matrice des Pics d'Interaction & Horaires Optimaux",
  subtitle = "Identifiez les créneaux horaires où vos contacts scannent et consultent le plus vos profils pour maximiser vos relances."
}) => {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hours = ['8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];

  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: string; value: number } | null>(null);

  // Generate realistic heatmap intensity values (Peak on Tuesday-Thursday afternoons)
  const heatmapData = useMemo(() => {
    return days.map((day, dayIdx) => {
      return hours.map((hour, hourIdx) => {
        let intensity = 10;
        
        // Weekdays vs Weekends
        const isWeekday = dayIdx < 5;
        const base = isWeekday ? 35 : 12;

        // Afternoon peak (14h - 18h)
        if (hourIdx >= 3 && hourIdx <= 5) {
          intensity = isWeekday ? base + 45 + (dayIdx === 1 || dayIdx === 3 ? 20 : 10) : base + 15;
        } else if (hourIdx === 2) {
          // Lunch time 12h
          intensity = isWeekday ? base + 25 : base + 20;
        } else if (hourIdx === 0 || hourIdx === 1) {
          // Morning
          intensity = isWeekday ? base + 15 : base + 5;
        } else {
          // Evening
          intensity = base;
        }

        // Add slight organic variation
        const value = Math.max(5, Math.round(intensity + Math.sin(dayIdx * 2 + hourIdx) * 8));

        return {
          day,
          hour,
          value,
        };
      });
    });
  }, []);

  const maxValue = 110;

  const getColorClass = (val: number) => {
    const ratio = val / maxValue;
    if (ratio > 0.8) return 'bg-indigo-600 text-white font-bold';
    if (ratio > 0.6) return 'bg-indigo-500 text-white';
    if (ratio > 0.4) return 'bg-indigo-400 text-white';
    if (ratio > 0.25) return 'bg-indigo-200 text-indigo-900';
    if (ratio > 0.12) return 'bg-indigo-100 text-indigo-800';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-7 flex flex-col gap-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-600" />
              <span>Horaires Clés</span>
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-1">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 shrink-0">
          <span>Faible</span>
          <div className="flex items-center gap-1 px-1">
            <div className="w-3.5 h-3.5 rounded bg-slate-100"></div>
            <div className="w-3.5 h-3.5 rounded bg-indigo-100"></div>
            <div className="w-3.5 h-3.5 rounded bg-indigo-300"></div>
            <div className="w-3.5 h-3.5 rounded bg-indigo-500"></div>
            <div className="w-3.5 h-3.5 rounded bg-indigo-700"></div>
          </div>
          <span>Intense</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Header Row: Hours */}
          <div className="grid grid-cols-9 gap-1.5 mb-1.5 text-center text-xs font-bold text-slate-500">
            <div className="text-left pl-2 text-slate-400">Jour</div>
            {hours.map((h) => (
              <div key={h} className="py-1">{h}</div>
            ))}
          </div>

          {/* Days Rows */}
          <div className="space-y-1.5">
            {heatmapData.map((row, dayIdx) => (
              <div key={days[dayIdx]} className="grid grid-cols-9 gap-1.5 items-center">
                <div className="text-xs font-bold text-slate-700 pl-2">
                  {days[dayIdx]}
                </div>

                {row.map((cell) => (
                  <div
                    key={`${cell.day}_${cell.hour}`}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`h-9 rounded-xl flex items-center justify-center text-[11px] cursor-pointer transition-all duration-150 relative ${getColorClass(
                      cell.value
                    )} hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-indigo-400`}
                  >
                    <span>{cell.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Recommendation Box */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-indigo-950">
              Créneau optimal recommandé : <strong>Mardi & Jeudi de 14h00 à 17h30</strong>
            </p>
            <p className="text-indigo-800 text-[11px] mt-0.5">
              C'est sur ces créneaux que vos prospects ouvrent 42% plus rapidement les liens vCard et valident leurs formulaires.
            </p>
          </div>
        </div>

        {hoveredCell && (
          <div className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 font-bold text-indigo-900 shrink-0 shadow-2xs">
            {hoveredCell.day} à {hoveredCell.hour} : <strong>{hoveredCell.value} interactions</strong>
          </div>
        )}
      </div>

    </div>
  );
};
