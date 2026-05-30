import { createContext, useContext } from 'react'
import type { Professional } from '../types/professional'

export const ProfessionalContext = createContext<Professional | null>(null)

export function useProfessional(): Professional {
  const ctx = useContext(ProfessionalContext)
  if (!ctx) throw new Error('useProfessional must be used inside ProfessionalContext.Provider')
  return ctx
}
