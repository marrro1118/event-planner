import type { Show } from '../lib/schedule'

// 動作確認用のダミーデータ。実イベントのデータではない。

export const DAYS = [
  { id: 'day1', label: '1日目' },
  { id: 'day2', label: '2日目' },
]

export const SAMPLE_SHOWS: Show[] = [
  {
    id: 'a',
    title: 'サンプル脱出A',
    venue: '会場1',
    price: 3000,
    slots: [
      { day: 'day1', start: '10:00', end: '11:30' },
      { day: 'day1', start: '13:00', end: '14:30' },
      { day: 'day1', start: '16:00', end: '17:30' },
      { day: 'day2', start: '10:00', end: '11:30' },
      { day: 'day2', start: '13:00', end: '14:30' },
    ],
  },
  {
    id: 'b',
    title: 'サンプル脱出B',
    venue: '会場1',
    price: 2500,
    slots: [
      { day: 'day1', start: '11:00', end: '12:00' },
      { day: 'day1', start: '14:00', end: '15:00' },
      { day: 'day1', start: '17:00', end: '18:00' },
      { day: 'day2', start: '11:00', end: '12:00' },
      { day: 'day2', start: '15:00', end: '16:00' },
    ],
  },
  {
    id: 'c',
    title: 'サンプル脱出C',
    venue: '会場2',
    price: 2000,
    slots: [
      { day: 'day1', start: '10:30', end: '11:15' },
      { day: 'day1', start: '12:00', end: '12:45' },
      { day: 'day1', start: '15:00', end: '15:45' },
      { day: 'day2', start: '10:30', end: '11:15' },
      { day: 'day2', start: '13:30', end: '14:15' },
    ],
  },
  {
    id: 'd',
    title: 'サンプル体験D',
    venue: '会場2',
    price: 1500,
    slots: [
      { day: 'day1', start: '13:00', end: '13:30' },
      { day: 'day1', start: '15:30', end: '16:00' },
      { day: 'day1', start: '18:00', end: '18:30' },
      { day: 'day2', start: '14:00', end: '14:30' },
      { day: 'day2', start: '16:30', end: '17:00' },
    ],
  },
  {
    id: 'e',
    title: 'サンプル謎E',
    venue: '会場3',
    price: 3500,
    slots: [
      { day: 'day1', start: '10:00', end: '12:00' },
      { day: 'day1', start: '14:30', end: '16:30' },
      { day: 'day2', start: '10:00', end: '12:00' },
      { day: 'day2', start: '15:00', end: '17:00' },
    ],
  },
]
