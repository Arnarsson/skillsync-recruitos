import { useEffect, useCallback, useRef } from 'react';

type ModalState = Record<string, boolean>;

/**
 * Hook to sync modal states with browser history.
 * When a modal opens, it pushes a new history state.
 * When the user presses the browser back button, the modal closes.
 * 
 * Usage:
 * const { openModal, closeModal } = useModalHistory({
 *   import: [showImport, setShowImport],
 *   compare: [showComparison, setShowComparison],
 *   outreach: [showOutreach, setShowOutreach],
 * });
 * 
 * // Open modal (pushes history)
 * openModal('import');
 * 
 * // Close modal (pops history)
 * closeModal('import');
 */
export function useModalHistory(
  modals: Record<string, [boolean, (value: boolean) => void]>
) {
  const isNavigatingRef = useRef(false);
  const modalKeysRef = useRef(Object.keys(modals));

  // Get current modal state for history
  const getModalState = useCallback((): ModalState => {
    const state: ModalState = {};
    for (const key of modalKeysRef.current) {
      state[key] = modals[key][0];
    }
    return state;
  }, [modals]);

  // Open a modal and push to history
  const openModal = useCallback((key: string) => {
    const [isOpen, setOpen] = modals[key];
    if (!isOpen) {
      setOpen(true);
      // Push new history state with modal key
      const newState = { ...getModalState(), [key]: true, _modal: key };
      window.history.pushState(newState, '', window.location.href);
    }
  }, [modals, getModalState]);

  // Close a modal
  const closeModal = useCallback((key: string, fromPopstate = false) => {
    const [isOpen, setOpen] = modals[key];
    if (isOpen) {
      isNavigatingRef.current = true;
      setOpen(false);
      // If not from popstate, we need to go back
      if (!fromPopstate) {
        window.history.back();
      }
      // Reset the navigating flag after a tick
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 0);
    }
  }, [modals]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopstate = (event: PopStateEvent) => {
      if (isNavigatingRef.current) return;

      const state = event.state as ModalState | null;
      
      // Check which modals need to be closed
      for (const key of modalKeysRef.current) {
        const [isOpen, setOpen] = modals[key];
        const shouldBeOpen = state?.[key] ?? false;
        
        if (isOpen && !shouldBeOpen) {
          // Modal should be closed
          isNavigatingRef.current = true;
          setOpen(false);
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 0);
        }
      }
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [modals]);

  return { openModal, closeModal };
}

/**
 * Simpler hook for single modal usage.
 * 
 * Usage:
 * const [isOpen, setOpen, { open, close }] = useModalWithHistory('import');
 */
export function useModalWithHistory(modalKey: string) {
  const isOpenRef = useRef(false);
  const isNavigatingRef = useRef(false);

  const setIsOpen = useCallback((value: boolean) => {
    if (value === isOpenRef.current) return;
    
    isOpenRef.current = value;
    
    if (value && !isNavigatingRef.current) {
      // Opening modal - push history
      window.history.pushState({ _modal: modalKey, isOpen: true }, '', window.location.href);
    }
  }, [modalKey]);

  const open = useCallback(() => {
    if (!isOpenRef.current) {
      isOpenRef.current = true;
      window.history.pushState({ _modal: modalKey, isOpen: true }, '', window.location.href);
    }
  }, [modalKey]);

  const close = useCallback((fromPopstate = false) => {
    if (isOpenRef.current) {
      isNavigatingRef.current = true;
      isOpenRef.current = false;
      if (!fromPopstate) {
        window.history.back();
      }
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 0);
    }
  }, []);

  useEffect(() => {
    const handlePopstate = (event: PopStateEvent) => {
      if (isNavigatingRef.current) return;
      
      const state = event.state as { _modal?: string; isOpen?: boolean } | null;
      const shouldBeOpen = state?._modal === modalKey && state?.isOpen;
      
      if (isOpenRef.current && !shouldBeOpen) {
        close(true);
      }
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [modalKey, close]);

  return { isOpen: isOpenRef.current, setIsOpen, open, close };
}
