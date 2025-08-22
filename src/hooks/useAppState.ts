import { useState, useEffect, useCallback } from 'react';
import { apiService, type User, type CountsResponse } from '@/services/api';

export type Category = 'coffee' | 'lunch' | 'zanpan';

interface AppState {
  // User data
  email: string;
  name: string;
  age: number | null;
  gender: string;
  category: Category;
  
  // Status
  open: boolean;
  sameSexPref: boolean;
  sameSexYap: boolean;
  
  // Age ranges
  ageMin: number;
  ageMax: number;
  ageMinYap: number;
  ageMaxYap: number;
  
  // Group size
  groupMin: number;
  groupMax: number;
  
  // Counts
  counts: CountsResponse;
  
  // UI states
  loading: boolean;
  error: string | null;
  success: string | null;
}

const CATEGORY_CONFIG = {
  coffee: { title: '☕ Coffee Break', word: 'Coffee', emoji: '☕' },
  lunch: { title: '🍱 Lunch Break', word: 'Lunch', emoji: '🍱' },
  zanpan: { title: '🍚 残飯（残業ごはん）', word: '残飯', emoji: '🍚' }
};

export const useAppState = () => {
  const [state, setState] = useState<AppState>({
    email: '',
    name: '',
    age: null,
    gender: '',
    category: 'coffee',
    open: false,
    sameSexPref: false,
    sameSexYap: false,
    ageMin: 20,
    ageMax: 60,
    ageMinYap: 20,
    ageMaxYap: 60,
    groupMin: 1,
    groupMax: 3,
    counts: { coffee: 0, lunch: 0, zanpan: 0 },
    loading: false,
    error: null,
    success: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = {
      email: localStorage.getItem('cm_email') || '',
      name: localStorage.getItem('cm_name') || '',
      age: localStorage.getItem('cm_age') ? parseInt(localStorage.getItem('cm_age')!) : null,
      gender: localStorage.getItem('cm_gender') || '',
      category: (localStorage.getItem('cm_category') || 'coffee') as Category,
      ageMin: parseInt(localStorage.getItem('cm_ageMin') || '20'),
      ageMax: parseInt(localStorage.getItem('cm_ageMax') || '60'),
    };

    setState(prev => ({
      ...prev,
      ...savedData,
      open: localStorage.getItem(`cm_open_${savedData.category}`) === '1',
      sameSexPref: localStorage.getItem(`cm_same_${savedData.category}`) === '1',
      sameSexYap: localStorage.getItem('cm_same_yap') === '1',
      ageMinYap: savedData.ageMin,
      ageMaxYap: savedData.ageMax,
      groupMin: parseInt(localStorage.getItem(`cm_gmin_${savedData.category}`) || '1'),
      groupMax: parseInt(localStorage.getItem(`cm_gmax_${savedData.category}`) || '3'),
    }));
  }, []);

  // Persist to localStorage
  const persistState = useCallback((newState: Partial<AppState>) => {
    Object.entries(newState).forEach(([key, value]) => {
      if (key === 'email') localStorage.setItem('cm_email', value as string);
      if (key === 'name') localStorage.setItem('cm_name', value as string);
      if (key === 'age') localStorage.setItem('cm_age', (value as number)?.toString() || '');
      if (key === 'gender') localStorage.setItem('cm_gender', value as string);
      if (key === 'category') localStorage.setItem('cm_category', value as string);
      if (key === 'ageMin') localStorage.setItem('cm_ageMin', (value as number).toString());
      if (key === 'ageMax') localStorage.setItem('cm_ageMax', (value as number).toString());
    });

    if (newState.open !== undefined) {
      localStorage.setItem(`cm_open_${newState.category || state.category}`, newState.open ? '1' : '0');
    }
    if (newState.sameSexPref !== undefined) {
      localStorage.setItem(`cm_same_${newState.category || state.category}`, newState.sameSexPref ? '1' : '0');
    }
    if (newState.sameSexYap !== undefined) {
      localStorage.setItem('cm_same_yap', newState.sameSexYap ? '1' : '0');
    }
    if (newState.groupMin !== undefined) {
      localStorage.setItem(`cm_gmin_${newState.category || state.category}`, newState.groupMin.toString());
    }
    if (newState.groupMax !== undefined) {
      localStorage.setItem(`cm_gmax_${newState.category || state.category}`, newState.groupMax.toString());
    }
  }, [state.category]);

  const updateState = useCallback((newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
    persistState(newState);
  }, [persistState]);

  // Clear messages after delay
  useEffect(() => {
    if (state.error || state.success) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, error: null, success: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error, state.success]);

  // API actions
  const saveProfile = useCallback(async () => {
    if (!state.email || !state.name) {
      updateState({ error: 'Please fill in email and name' });
      return false;
    }

    updateState({ loading: true, error: null });
    
    try {
      const response = await apiService.register({
        email: state.email,
        name: state.name,
        age: state.age,
        gender: state.gender,
        category: state.category,
        open: state.open,
        sameSex: state.sameSexPref,
      });

      if (response.ok) {
        updateState({ loading: false, success: response.message || 'Profile saved!' });
        return true;
      } else {
        updateState({ loading: false, error: response.error || 'Failed to save profile' });
        return false;
      }
    } catch (error) {
      updateState({ loading: false, error: 'Network error occurred' });
      return false;
    }
  }, [state, updateState]);

  const sendPing = useCallback(async () => {
    if (!state.email || !state.name) {
      updateState({ error: 'Please fill in email and name first' });
      return false;
    }

    updateState({ loading: true, error: null });

    try {
      const response = await apiService.yap({
        email: state.email,
        name: state.name,
        category: state.category,
        open: state.open,
        minAge: state.ageMinYap,
        maxAge: state.ageMaxYap,
        sameSex: state.sameSexYap,
        userGender: state.gender,
        groupMin: state.category === 'coffee' ? 1 : state.groupMin,
        groupMax: state.category === 'coffee' ? 1 : state.groupMax,
      });

      if (response.ok) {
        updateState({ loading: false, success: response.message || 'Ping sent!' });
        return true;
      } else {
        updateState({ loading: false, error: response.error || 'Failed to send ping' });
        return false;
      }
    } catch (error) {
      updateState({ loading: false, error: 'Network error occurred' });
      return false;
    }
  }, [state, updateState]);

  const refreshCounts = useCallback(async () => {
    try {
      const response = await apiService.getCounts({
        excludeEmail: state.email || null,
        minAge: state.ageMin,
        maxAge: state.ageMax,
        userGender: state.gender,
        sameSex: state.sameSexPref,
      });

      if (response.ok && response.data) {
        updateState({ counts: response.data });
      }
    } catch (error) {
      console.error('Failed to refresh counts:', error);
    }
  }, [state.email, state.ageMin, state.ageMax, state.gender, state.sameSexPref, updateState]);

  // Auto-refresh counts every 30 seconds
  useEffect(() => {
    refreshCounts();
    const interval = setInterval(refreshCounts, 30000);
    return () => clearInterval(interval);
  }, [refreshCounts]);

  return {
    state,
    updateState,
    saveProfile,
    sendPing,
    refreshCounts,
    categoryConfig: CATEGORY_CONFIG,
  };
};