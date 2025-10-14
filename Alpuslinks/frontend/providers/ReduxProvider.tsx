'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/store'

interface ReduxProviderProps {
  children: React.ReactNode
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>} 
        persistor={persistor}
        onBeforeLift={() => {
          // Set a flag to indicate rehydration is starting
          if (typeof window !== 'undefined') {
            window.__REDUX_PERSIST_STATE__ = 'rehydrating'
          }
        }}
        onAfterLift={() => {
          // Set a flag to indicate rehydration is complete
          if (typeof window !== 'undefined') {
            window.__REDUX_PERSIST_STATE__ = 'rehydrated'
            // Dispatch a custom event for components to listen to
            window.dispatchEvent(new CustomEvent('redux-persist-rehydrated'))
          }
        }}
      >
        {children}
      </PersistGate>
    </Provider>
  )
}
