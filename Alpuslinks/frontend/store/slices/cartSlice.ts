import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export type OrderType = 'guestPost' | 'linkInsertion' | 'writingGuestPost'

export interface CartItem {
  id: string // unique key: websiteId + '-' + type
  websiteId: string
  domain: string
  type: OrderType
  price: number
  quantity: number
}

interface CartState {
  items: CartItem[]
}

const initialState: CartState = {
  items: [],
}

function makeId(websiteId: string, type: OrderType) {
  return `${websiteId}-${type}`
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }>) => {
      const { websiteId, type, domain, price } = action.payload
      const quantity = action.payload.quantity ?? 1
      const id = makeId(websiteId, type)
      const existing = state.items.find(i => i.id === id)
      if (existing) {
        existing.quantity += quantity
      } else {
        state.items.push({ id, websiteId, type, domain, price, quantity })
      }
    },
    removeItem: (state, action: PayloadAction<{ websiteId: string; type: OrderType }>) => {
      const id = makeId(action.payload.websiteId, action.payload.type)
      state.items = state.items.filter(i => i.id !== id)
    },
    updateQuantity: (state, action: PayloadAction<{ websiteId: string; type: OrderType; quantity: number }>) => {
      const id = makeId(action.payload.websiteId, action.payload.type)
      const item = state.items.find(i => i.id === id)
      if (!item) return
      item.quantity = Math.max(1, action.payload.quantity)
    },
    clearCart: (state) => {
      state.items = []
    },
  },
})

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions

export default cartSlice.reducer

// Selectors
export const selectCartItems = (state: RootState) => state.cart.items

export const selectCartSummary = createSelector([selectCartItems], (items) => {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  return {
    count: items.length,
    quantity: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
  }
})


