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
  selectedPostId?: string // Optional selected post ID
}

interface CartState {
  items: CartItem[]
}

const initialState: CartState = {
  items: [],
}

function makeId(websiteId: string, type: OrderType) {
  return `${websiteId}-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }>) => {
      const { websiteId, type, domain, price, selectedPostId } = action.payload
      const quantity = action.payload.quantity ?? 1
      const id = makeId(websiteId, type)
      // Always create a new independent order
      state.items.push({ id, websiteId, type, domain, price, quantity, selectedPostId })
    },
    removeItem: (state, action: PayloadAction<{ id: string }>) => {
      state.items = state.items.filter(i => i.id !== action.payload.id)
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(i => i.id === action.payload.id)
      if (!item) return
      item.quantity = Math.max(1, action.payload.quantity)
    },
    clearCart: (state) => {
      state.items = []
    },
    addPostToCart: (state, action: PayloadAction<Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }>) => {
      const { websiteId, type, domain, price, selectedPostId } = action.payload
      const quantity = action.payload.quantity ?? 1
      
      // Check if there's already a cart item for this website and type
      const existingItem = state.items.find(item => 
        item.websiteId === websiteId && item.type === type
      )
      
      if (existingItem) {
        // Update existing item with the selectedPostId
        existingItem.selectedPostId = selectedPostId
      } else {
        // Create new item only if none exists
        const id = makeId(websiteId, type)
        state.items.push({ id, websiteId, type, domain, price, quantity, selectedPostId })
      }
    },
  },
})

export const { addItem, removeItem, updateQuantity, clearCart, addPostToCart } = cartSlice.actions

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


