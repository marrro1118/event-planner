import type { Rank, Ranks, Show } from '../lib/schedule'

const RANK_OPTIONS: { rank: Rank; label: string; activeClass: string }[] = [
  { rank: 'must', label: '必須', activeClass: 'bg-rose-600 text-white border-rose-600' },
  { rank: 'want', label: '見たい', activeClass: 'bg-sky-600 text-white border-sky-600' },
  { rank: 'maybe', label: 'できれば', activeClass: 'bg-slate-500 text-white border-slate-500' },
]

interface ShowPickerProps {
  shows: Show[]
  ranks: Ranks
  onChange: (showId: string, rank: Rank | undefined) => void
}

export function ShowPicker({ shows, ranks, onChange }: ShowPickerProps) {
  const byVenue = new Map<string, Show[]>()
  for (const show of shows) {
    const list = byVenue.get(show.venue) ?? []
    list.push(show)
    byVenue.set(show.venue, list)
  }

  return (
    <div className="flex flex-col gap-6">
      {[...byVenue.entries()].map(([venue, venueShows]) => (
        <div key={venue}>
          <h3 className="text-sm font-semibold text-slate-500 mb-2">{venue}</h3>
          <div className="flex flex-col gap-2">
            {venueShows.map((show) => {
              const current = ranks[show.id]
              return (
                <div
                  key={show.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                >
                  <span className="font-medium">{show.title}</span>
                  <div className="flex gap-1">
                    {RANK_OPTIONS.map(({ rank, label, activeClass }) => (
                      <button
                        key={rank}
                        type="button"
                        onClick={() => onChange(show.id, current === rank ? undefined : rank)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          current === rank
                            ? activeClass
                            : 'border-slate-300 text-slate-500 hover:border-slate-400 dark:border-slate-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
