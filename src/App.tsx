import { useMemo, useState } from 'react'
import { PlanCard } from './components/PlanCard'
import { ShowPicker } from './components/ShowPicker'
import { DAYS, SAMPLE_SHOWS } from './data/sampleShows'
import { findPlans, type Rank, type Ranks } from './lib/schedule'

function App() {
  const [day, setDay] = useState(DAYS[0].id)
  const [bufferMin, setBufferMin] = useState(10)
  const [ranks, setRanks] = useState<Ranks>({})

  const handleRankChange = (showId: string, rank: Rank | undefined) => {
    setRanks((prev) => ({ ...prev, [showId]: rank }))
  }

  const result = useMemo(
    () => findPlans(SAMPLE_SHOWS, ranks, { day, bufferMin }),
    [ranks, day, bufferMin],
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold">event-planner</h1>
        <p className="text-sm text-slate-500">
          見たい公演を選ぶと、時間が重ならない組み合わせプランを提案します（サンプルデータ）。
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {DAYS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDay(d.id)}
              className={`rounded-full border px-4 py-1 text-sm transition ${
                day === d.id
                  ? 'border-slate-800 bg-slate-800 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900'
                  : 'border-slate-300 text-slate-600 dark:border-slate-600'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          乗り換えの余裕
          <input
            type="number"
            min={0}
            step={5}
            value={bufferMin}
            onChange={(e) => setBufferMin(Math.max(0, Number(e.target.value) || 0))}
            className="w-16 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-800"
          />
          分
        </label>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">公演を選ぶ</h2>
        <ShowPicker shows={SAMPLE_SHOWS} ranks={ranks} onChange={handleRankChange} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">プラン候補</h2>
        {result.tooManyShows && (
          <p className="text-sm text-amber-600">選んだ公演が多すぎます。数を絞ってください。</p>
        )}
        {!result.tooManyShows && result.plans.length === 0 && (
          <p className="text-sm text-slate-500">公演を選ぶとここにプランが表示されます。</p>
        )}
        <div className="flex flex-col gap-3">
          {result.plans.map((plan, i) => (
            <PlanCard key={plan.key} plan={plan} rank={i + 1} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
