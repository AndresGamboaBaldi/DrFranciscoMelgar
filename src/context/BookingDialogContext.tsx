import { createContext, useContext } from 'react'

interface BookingDialogCtx {
  openBooking: () => void
}

export const BookingDialogContext = createContext<BookingDialogCtx>({ openBooking: () => {} })

export const useOpenBooking = () => useContext(BookingDialogContext).openBooking
