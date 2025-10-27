import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SidebarState {
  collapsed: boolean
  expandedSections: string[]
}

const initialState: SidebarState = {
  collapsed: false,
  expandedSections: []
}

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleCollapsed: (state) => {
      state.collapsed = !state.collapsed
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.collapsed = action.payload
    },
    toggleSection: (state, action: PayloadAction<string>) => {
      const sectionName = action.payload
      if (state.expandedSections.includes(sectionName)) {
        state.expandedSections = state.expandedSections.filter(name => name !== sectionName)
      } else {
        state.expandedSections.push(sectionName)
      }
    },
    setExpandedSections: (state, action: PayloadAction<string[]>) => {
      state.expandedSections = action.payload
    },
    resetSidebar: (state) => {
      state.collapsed = false
      state.expandedSections = []
    }
  }
})

export const { 
  toggleCollapsed, 
  setCollapsed, 
  toggleSection, 
  setExpandedSections, 
  resetSidebar 
} = sidebarSlice.actions

export default sidebarSlice.reducer
