import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'

const defaultProps = {
  userInitials: 'OJ',
  userName: 'Ole J.',
  address: 'Søvej 6D, 4900 Nakskov',
  orderNumber: '1212343',
  activeMode: 'planlægning' as const,
  onModeChange: vi.fn(),
}

describe('AppShell', () => {
  it('viser adresse og ordrenummer', () => {
    render(<AppShell {...defaultProps}><div /></AppShell>)
    expect(screen.getByText('Søvej 6D, 4900 Nakskov')).toBeInTheDocument()
    expect(screen.getByText(/1212343/)).toBeInTheDocument()
  })

  it('markerer aktiv mode med aria-current', () => {
    render(<AppShell {...defaultProps}><div /></AppShell>)
    const btn = screen.getByRole('button', { name: /Planlægning/i })
    expect(btn).toHaveAttribute('aria-current', 'page')
  })

  it('kalder onModeChange ved klik på anden mode', async () => {
    const onModeChange = vi.fn()
    render(<AppShell {...defaultProps} onModeChange={onModeChange}><div /></AppShell>)
    await userEvent.click(screen.getByRole('button', { name: /Udførelse/i }))
    expect(onModeChange).toHaveBeenCalledWith('udførelse')
  })

  it('viser children i main', () => {
    render(<AppShell {...defaultProps}><p>Test indhold</p></AppShell>)
    expect(screen.getByText('Test indhold')).toBeInTheDocument()
  })

  it('viser railFooter når angivet', () => {
    render(
      <AppShell {...defaultProps} railFooter={<span>Henrik Thor</span>}>
        <div />
      </AppShell>
    )
    expect(screen.getByText('Henrik Thor')).toBeInTheDocument()
  })
})
