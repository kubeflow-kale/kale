// Copyright 2026 The Kubeflow Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useEffect, useRef, useState } from 'react';
import { Kernel } from '@jupyterlab/services';
import { executeRpc } from '../../lib/RPCUtils';
import { KfpStatus } from '../../components/KFPStatusBadge';

const KFP_STATUS_REFRESH_MS = 30_000;

/**
 * Hook that polls the KFP API server for connectivity status every 30 seconds.
 * Returns the current connection state for the status badge in the panel header.
 */
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
