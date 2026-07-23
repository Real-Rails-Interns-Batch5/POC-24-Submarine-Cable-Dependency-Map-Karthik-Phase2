"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, FilterState, SimulationResult } from '@/lib/types';

type Action = 
  | { type: 'SET_SELECTED_CABLE'; payload: string | null }
  | { type: 'SET_SELECTED_LANDING_POINT'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: AppState['activeTab'] }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'SET_SIM_STATE'; payload: Partial<AppState['sim']> }
  | { type: 'SET_SIM_RESULT'; payload: { result: SimulationResult | null; error: string | null } }
  | { type: 'SET_PANEL'; payload: AppState['panel'] }
  | { type: 'SET_PANEL_OPEN'; payload: boolean };

const initialState: AppState = {
  selectedCable: null,
  selectedLandingPoint: null,
  activeTab: 'map',
  filters: { region: 'all', capacity: 'all', status: 'all' },
  sim: { running: false, cableId: null, result: null, error: null },
  panel: null,
  panelOpen: false,
};

const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  openPanel: () => void;
  closePanel: () => void;
} | undefined>(undefined);

function appStateReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SELECTED_CABLE':
      return { ...state, selectedCable: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_SIM_STATE':
      return { ...state, sim: { ...state.sim, ...action.payload } };
    case 'SET_SIM_RESULT':
      return { ...state, sim: { ...state.sim, result: action.payload.result, error: action.payload.error, running: false } };
    case 'SET_PANEL':
      return { ...state, panel: action.payload };
    case 'SET_SELECTED_LANDING_POINT':
      return { ...state, selectedLandingPoint: action.payload };
    case 'SET_PANEL_OPEN':
      return { ...state, panelOpen: action.payload };
    default:
      return state;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  const openPanel = () => dispatch({ type: 'SET_PANEL_OPEN', payload: true });
  const closePanel = () => dispatch({ type: 'SET_PANEL_OPEN', payload: false });

  return (
    <AppStateContext.Provider value={{ state, dispatch, openPanel, closePanel }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
