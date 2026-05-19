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

import { useState, useEffect, useCallback } from 'react';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';

/**
 * Tracks which cell is currently active (selected) in the notebook.
 * Connects to JupyterLab's activeCellChanged signal and returns
 * the current active cell index.
 */
export function useActiveCellIndex(notebook: NotebookPanel): number {
  const [activeCellIndex, setActiveCellIndex] = useState(0);

  const onActiveCellChanged = useCallback(
    (nb: Notebook, _activeCell: Cell | null) => {
      setActiveCellIndex(nb.activeCellIndex);
    },
    [],
  );

  useEffect(() => {
    if (!notebook) {
      return;
    }

    let cancelled = false;
    notebook.context.ready.then(() => {
      if (cancelled) {
        return;
      }
      notebook.content.activeCellChanged.connect(onActiveCellChanged);
      setActiveCellIndex(notebook.content.activeCellIndex);
    });

    return () => {
      cancelled = true;
      notebook.content.activeCellChanged.disconnect(onActiveCellChanged);
    };
  }, [notebook, onActiveCellChanged]);

  return activeCellIndex;
}
