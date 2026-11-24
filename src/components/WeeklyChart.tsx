import type { WeeklyChartDay } from '../utils/taskHelpers';

interface WeeklyChartProps {
  data: WeeklyChartDay[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxVal = Math.max(
    4,
    ...data.map((d) => Math.max(d.completedCount, d.createdCount))
  );

  const totalCompletedWeek = data.reduce((sum, d) => sum + d.completedCount, 0);
  const totalCreatedWeek = data.reduce((sum, d) => sum + d.createdCount, 0);

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Weekly Productivity
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Tasks created versus completed over the last 7 days
          </p>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 dark:bg-blue-500 inline-block" />
            <span>
              Completed{' '}
              <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {totalCompletedWeek}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-slate-600 inline-block" />
            <span>
              Created{' '}
              <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {totalCreatedWeek}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 items-end h-44 pt-4 border-b border-slate-200 dark:border-slate-800">
        {data.map((day) => {
          const completedPct = Math.round((day.completedCount / maxVal) * 100);
          const createdPct = Math.round((day.createdCount / maxVal) * 100);

          return (
            <div key={day.dateIso} className="flex flex-col items-center h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1.5 h-36 px-1">
                <div className="relative flex-1 max-w-[18px] h-full flex items-end">
                  <div
                    style={{ height: `${Math.max(createdPct, day.createdCount > 0 ? 8 : 2)}%` }}
                    title={`${day.fullDate}: ${day.createdCount} created`}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      day.createdCount > 0
                        ? 'bg-slate-300 dark:bg-slate-600'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  />
                </div>
                <div className="relative flex-1 max-w-[18px] h-full flex items-end">
                  <div
                    style={{ height: `${Math.max(completedPct, day.completedCount > 0 ? 8 : 2)}%` }}
                    title={`${day.fullDate}: ${day.completedCount} completed`}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      day.completedCount > 0
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 gap-3 pt-2.5 text-center">
        {data.map((day) => (
          <div key={day.dateIso}>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{day.dayLabel}</p>
            <p className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
              {day.completedCount}/{day.createdCount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
