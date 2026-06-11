import { createContext, useContext } from 'react'
import type { StaffMember } from '../types/professional'

/** The selected staff member when viewing /:slug/setup/:staffId — null on the agency-level pages */
export const StaffContext = createContext<StaffMember | null>(null)

export function useStaff(): StaffMember | null {
  return useContext(StaffContext)
}
