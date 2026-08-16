import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'event-planner' })).toBeInTheDocument()
  })

  it('shows a plan once a show is ranked', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('公演を選ぶとここにプランが表示されます。')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '見たい' })[0])

    expect(screen.getByText('プラン 1')).toBeInTheDocument()
  })
})
