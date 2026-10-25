import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AutosaveController, AUTOSAVE_DELAY_MS } from '../src/renderer/src/hooks/useAutosave'

describe('AutosaveController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('does not trigger performSave if shouldSave returns false', () => {
    const controller = new AutosaveController(2000)
    const performSave = vi.fn().mockResolvedValue(true)

    controller.schedule(() => false, performSave)
    vi.advanceTimersByTime(3000)

    expect(performSave).not.toHaveBeenCalled()
  })

  it('triggers performSave after delay when shouldSave is true', async () => {
    const controller = new AutosaveController(2000)
    const performSave = vi.fn().mockResolvedValue(true)

    controller.schedule(() => true, performSave)
    expect(performSave).not.toHaveBeenCalled()

    // Advance 1999ms - should still not have fired
    vi.advanceTimersByTime(1999)
    expect(performSave).not.toHaveBeenCalled()

    // Advance 1ms to hit 2000ms
    vi.advanceTimersByTime(1)
    expect(performSave).toHaveBeenCalledTimes(1)
  })

  it('debounces multiple calls within the 2-second window', () => {
    const controller = new AutosaveController(AUTOSAVE_DELAY_MS)
    const performSave = vi.fn().mockResolvedValue(true)

    // First change at t = 0
    controller.schedule(() => true, performSave)

    // Next change at t = 1000
    vi.advanceTimersByTime(1000)
    controller.schedule(() => true, performSave)

    // Next change at t = 1500
    vi.advanceTimersByTime(500)
    controller.schedule(() => true, performSave)

    // At t = 3000 (1500ms since last change), should NOT have fired yet
    vi.advanceTimersByTime(1500)
    expect(performSave).not.toHaveBeenCalled()

    // At t = 3500 (2000ms since last change), should have fired ONCE
    vi.advanceTimersByTime(500)
    expect(performSave).toHaveBeenCalledTimes(1)
  })

  it('cancels pending save when cancel is called', () => {
    const controller = new AutosaveController(2000)
    const performSave = vi.fn().mockResolvedValue(true)

    controller.schedule(() => true, performSave)
    vi.advanceTimersByTime(1000)
    controller.cancel()

    vi.advanceTimersByTime(2000)
    expect(performSave).not.toHaveBeenCalled()
  })
})
