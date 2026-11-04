import type { CapacityBand } from '../types/api'

const DEFAULT_CAPACITY = Number(import.meta.env.VITE_CAPACIDADE_HORAS ?? 60)
const TOLERANCE = 0.15

export function getCapacityHours() {
  return DEFAULT_CAPACITY
}

export function minutesToHours(minutes: number | null | undefined) {
  if (minutes == null || Number.isNaN(Number(minutes))) return 0
  return Math.round((Number(minutes) / 60) * 10) / 10
}

export function getCapacityBand(hours: number, capacity = DEFAULT_CAPACITY): CapacityBand {
  const lower = capacity * (1 - TOLERANCE)
  const upper = capacity * (1 + TOLERANCE)
  if (hours < lower) return 'Ocioso'
  if (hours > upper) return 'Sobrecarga'
  return 'Ideal'
}

export function getCapacityPercent(hours: number, capacity = DEFAULT_CAPACITY) {
  if (capacity <= 0) return 0
  return Math.round((hours / capacity) * 100)
}
