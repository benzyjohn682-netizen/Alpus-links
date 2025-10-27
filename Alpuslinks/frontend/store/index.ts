import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import { combineReducers } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import cartReducer from './slices/cartSlice'
import sidebarReducer from './slices/sidebarSlice'

// Create storage that works in both client and server environments
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null)
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value)
    },
    removeItem(_key: string) {
      return Promise.resolve()
    },
  }
}

const storage = typeof window !== 'undefined' 
  ? require('redux-persist/lib/storage').default 
  : createNoopStorage()

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'cart', 'sidebar'], // Persist auth, cart, and sidebar state
  blacklist: [], // Don't blacklist anything
  transforms: [], // No transforms needed
  debug: process.env.NODE_ENV === 'development' // Enable debug in development
}

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  sidebar: sidebarReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
