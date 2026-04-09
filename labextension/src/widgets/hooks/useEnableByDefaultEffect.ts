import { useEffect, useRef } from 'react';

interface IUseEnableByDefaultEffectParams {
  enableKaleByDefault: boolean;
  isEnabled: boolean;
  setIsEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
}

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
