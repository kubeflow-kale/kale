import { useEffect, useRef } from 'react';

interface IUseEnableByDefaultEffectParams {
  enableKaleByDefault: boolean;
  isEnabled: boolean;
  setIsEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
}

/**
 * Hook that reacts to the "Enable Kale by default" JupyterLab setting.
 * When the setting transitions from off to on, it turns on the Kale
 * toggle for the current notebook without requiring a notebook switch.
 */
export function useEnableByDefaultEffect({
  enableKaleByDefault,
  isEnabled,
  setIsEnabled,
}: IUseEnableByDefaultEffectParams) {
  const prevEnableByDefaultRef = useRef(enableKaleByDefault);

  useEffect(() => {
    if (!prevEnableByDefaultRef.current && enableKaleByDefault && !isEnabled) {
      setIsEnabled(true);
    }
    prevEnableByDefaultRef.current = enableKaleByDefault;
  }, [enableKaleByDefault, isEnabled, setIsEnabled]);
}
