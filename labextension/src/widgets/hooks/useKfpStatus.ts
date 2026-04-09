import { useEffect, useRef, useState } from 'react';
import { Kernel } from '@jupyterlab/services';
import { executeRpc } from '../../lib/RPCUtils';
import { KfpStatus } from '../../components/KFPStatusBadge';

const KFP_STATUS_REFRESH_MS = 30_000;

export function useKfpStatus(
  kernel: Kernel.IKernelConnection,
  backend: boolean,
): KfpStatus {
  const [kfpStatus, setKfpStatus] = useState<KfpStatus>('checking');
  const kernelRef = useRef(kernel);
  kernelRef.current = kernel;

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const k = kernelRef.current;
      const status = k?.status;
      if (!backend || status === 'dead' || status === 'terminating') {
        return;
      }
      const isConnected = await executeRpc(k, 'kfp.ping');
      if (!cancelled) {
        setKfpStatus(isConnected ? 'connected' : 'disconnected');
      }
    };

    refresh();
    const timerId = setInterval(refresh, KFP_STATUS_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timerId);
    };
  }, [backend]);

  return kfpStatus;
}
