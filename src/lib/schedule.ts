// 「見たい公演」の組み合わせから、時間が重ならないプランを探す。DOM には触れない純粋関数のみ。

export type Rank = 'must' | 'want' | 'maybe'
export type Ranks = Record<string, Rank | undefined>

const RANK_KEYS: Rank[] = ['must', 'want', 'maybe']

/** ビットマスクDPの上限。2^MAX 通りを総当たりするので、実用上はこの程度が上限。 */
const MAX_SELECTABLE_SHOWS = 18

export interface Slot {
  day: string
  start: string // "HH:MM"
  end: string
}

export interface Show {
  id: string
  title: string
  venue: string
  price?: number
  slots: Slot[]
}

export interface PlanItem {
  showId: string
  title: string
  venue: string
  day: string
  start: string
  end: string
  startMin: number
  endMin: number
  gapAfterMin: number | null
}

export interface PlanScore {
  must: number
  want: number
  maybe: number
  count: number
  idleMin: number
  spanMin: number
}

export interface Plan {
  key: string
  items: PlanItem[]
  score: PlanScore
}

export interface FindPlansOptions {
  day: string
  bufferMin?: number
  maxPlans?: number
}

export interface FindPlansResult {
  plans: Plan[]
  tooManyShows: boolean
}

export function toMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) throw new Error(`時刻の形式が不正です: ${hhmm}`)
  const h = Number(m[1])
  const mi = Number(m[2])
  if (h > 23 || mi > 59) throw new Error(`時刻の範囲が不正です: ${hhmm}`)
  return h * 60 + mi
}

export function toHHMM(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/** あき(分)がバッファ条件を満たすか。あきが0分ちょうどは繋がらない扱い。 */
function gapOk(gap: number, bufferMin: number): boolean {
  return gap > 0 && gap >= bufferMin
}

interface CandidateSlot {
  showId: string
  title: string
  venue: string
  day: string
  start: string
  end: string
  startMin: number
  endMin: number
}

function candidateSlots(show: Show, day: string): CandidateSlot[] {
  return show.slots
    .filter((s) => s.day === day)
    .map((s) => ({
      showId: show.id,
      title: show.title,
      venue: show.venue,
      day: s.day,
      start: s.start,
      end: s.end,
      startMin: toMinutes(s.start),
      endMin: toMinutes(s.end),
    }))
    .sort((a, b) => a.startMin - b.startMin)
}

interface DPStep {
  prevMask: number
  showIndex: number
}

/** best[mask] = mask の公演全部を観るときの、ありうる最も早い終了時刻。Infinity なら1日に収まらない。 */
function buildDP(slotsByShow: CandidateSlot[][], bufferMin: number) {
  const n = slotsByShow.length
  const size = 1 << n
  const best = new Float64Array(size).fill(Infinity)
  const from: (DPStep | null)[] = new Array(size).fill(null)
  best[0] = -Infinity

  for (let mask = 0; mask < size; mask++) {
    const cur = best[mask]
    if (cur === Infinity) continue
    for (let k = 0; k < n; k++) {
      const bit = 1 << k
      if (mask & bit) continue

      let pick: CandidateSlot | null = null
      for (const slot of slotsByShow[k]) {
        if (!gapOk(slot.startMin - cur, bufferMin)) continue
        if (pick === null || slot.endMin < pick.endMin) pick = slot
      }
      if (!pick) continue

      const next = mask | bit
      if (pick.endMin < best[next]) {
        best[next] = pick.endMin
        from[next] = { prevMask: mask, showIndex: k }
      }
    }
  }
  return { best, from }
}

function reconstructOrder(mask: number, from: (DPStep | null)[]): number[] {
  const order: number[] = []
  let cur = mask
  while (cur !== 0) {
    const step = from[cur]
    if (!step) break
    order.push(step.showIndex)
    cur = step.prevMask
  }
  order.reverse()
  return order
}

function pickEarliest(slots: CandidateSlot[], afterMin: number, bufferMin: number): CandidateSlot | null {
  let pick: CandidateSlot | null = null
  for (const slot of slots) {
    if (!gapOk(slot.startMin - afterMin, bufferMin)) continue
    if (pick === null || slot.endMin < pick.endMin) pick = slot
  }
  return pick
}

function dpSlotsOf(order: number[], slotsByShow: CandidateSlot[][], bufferMin: number): CandidateSlot[] {
  const slots: CandidateSlot[] = []
  let cur = -Infinity
  for (const k of order) {
    const pick = pickEarliest(slotsByShow[k], cur, bufferMin)
    if (!pick) throw new Error('DPが選んだ組み合わせのはずが枠を再現できませんでした')
    slots.push(pick)
    cur = pick.endMin
  }
  return slots
}

/** DPは「最も早く終わる」枠を選ぶので無駄なあきが残ることがある。後ろから寄せて詰める。 */
function compact(order: number[], slotsByShow: CandidateSlot[][], bufferMin: number): CandidateSlot[] {
  const dpSlots = dpSlotsOf(order, slotsByShow, bufferMin)
  if (order.length <= 1) return dpSlots

  const result: CandidateSlot[] = new Array(order.length)
  result[order.length - 1] = dpSlots[order.length - 1]
  let limit = result[order.length - 1].startMin

  for (let i = order.length - 2; i >= 0; i--) {
    let pick: CandidateSlot | null = null
    for (const slot of slotsByShow[order[i]]) {
      if (!gapOk(limit - slot.endMin, bufferMin)) continue
      if (pick === null || slot.startMin > pick.startMin) pick = slot
    }
    if (!pick) return dpSlots
    result[i] = pick
    limit = pick.startMin
  }
  return result
}

function buildPlan(slots: CandidateSlot[], ranks: Ranks): Plan {
  const items: PlanItem[] = slots.map((slot, i) => {
    const next = slots[i + 1]
    return {
      showId: slot.showId,
      title: slot.title,
      venue: slot.venue,
      day: slot.day,
      start: slot.start,
      end: slot.end,
      startMin: slot.startMin,
      endMin: slot.endMin,
      gapAfterMin: next ? next.startMin - slot.endMin : null,
    }
  })

  const score: PlanScore = { must: 0, want: 0, maybe: 0, count: items.length, idleMin: 0, spanMin: 0 }
  for (const it of items) {
    const rank = ranks[it.showId]
    if (rank) score[rank]++
  }
  for (let i = 1; i < items.length; i++) score.idleMin += items[i].startMin - items[i - 1].endMin
  if (items.length) score.spanMin = items[items.length - 1].endMin - items[0].startMin

  return {
    key: items
      .map((i) => i.showId)
      .sort()
      .join('+'),
    items,
    score,
  }
}

function comparePlans(a: Plan, b: Plan): number {
  return (
    b.score.must - a.score.must ||
    b.score.want - a.score.want ||
    b.score.maybe - a.score.maybe ||
    a.score.idleMin - b.score.idleMin ||
    a.score.spanMin - b.score.spanMin ||
    a.items[0].startMin - b.items[0].startMin
  )
}

/**
 * ランク付けされた公演から、成立するプラン（これ以上どの公演も足せない組み合わせ）を
 * 良い順（必須→欲しい→できれば の数が多い、あきが少ない、拘束時間が短い）に返す。
 */
export function findPlans(shows: Show[], ranks: Ranks, opts: FindPlansOptions): FindPlansResult {
  const bufferMin = opts.bufferMin ?? 10
  const maxPlans = opts.maxPlans ?? 20
  const selected = shows.filter((s) => {
    const rank = ranks[s.id]
    return rank !== undefined && RANK_KEYS.includes(rank)
  })

  if (selected.length === 0) return { plans: [], tooManyShows: false }
  if (selected.length > MAX_SELECTABLE_SHOWS) return { plans: [], tooManyShows: true }

  const slotsByShow = selected.map((s) => candidateSlots(s, opts.day))
  const n = selected.length
  const { best, from } = buildDP(slotsByShow, bufferMin)

  const plans: Plan[] = []
  const size = 1 << n
  for (let mask = 1; mask < size; mask++) {
    if (best[mask] === Infinity) continue

    // 極大な集合（これ以上どの公演も足せない）だけをプランにする
    let maximal = true
    for (let k = 0; k < n && maximal; k++) {
      const bit = 1 << k
      if (mask & bit) continue
      if (best[mask | bit] < Infinity) maximal = false
    }
    if (!maximal) continue

    const order = reconstructOrder(mask, from)
    const slots = compact(order, slotsByShow, bufferMin)
    plans.push(buildPlan(slots, ranks))
  }

  plans.sort(comparePlans)
  return { plans: plans.slice(0, maxPlans), tooManyShows: false }
}
