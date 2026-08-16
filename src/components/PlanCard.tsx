import type { Plan } from '../lib/schedule'

const RANK_LABEL = { must: '必須', want: '見たい', maybe: 'できれば' } as const

interface PlanCardProps {
  plan: Plan
  rank: number
}

export function PlanCard({ plan, rank }: PlanCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span className="font-semibold text-slate-700 dark:text-slate-200">プラン {rank}</span>
        <span>
          {RANK_LABEL.must}
          {plan.score.must} / {RANK_LABEL.want}
          {plan.score.want} / {RANK_LABEL.maybe}
          {plan.score.maybe} ・ あき{plan.score.idleMin}分
        </span>
      </div>
      <ol className="flex flex-col gap-2">
        {plan.items.map((item, i) => (
          <li key={`${item.showId}-${i}`}>
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 tabular-nums text-sm text-slate-500">
                {item.start}–{item.end}
              </span>
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-slate-400">{item.venue}</span>
            </div>
            {item.gapAfterMin != null && (
              <div className="ml-24 pl-3 text-xs text-slate-400">↓ あき {item.gapAfterMin}分</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
