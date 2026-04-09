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

import { useEffect, useRef } from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import NotebookUtils from '../../lib/NotebookUtils';
import { IKaleNotebookMetadata } from '../LeftPanelTypes';

interface IUseNotebookMetadataPersistenceParams {
  tracker: INotebookTracker;
  metadata: IKaleNotebookMetadata;
  metadataKey: string;
}

/**
 * Hook that writes the current metadata state back to the active notebook's
 * .ipynb file whenever it changes, keeping the form and the file in sync.
 */
export function useNotebookMetadataPersistence({
  tracker,
  metadata,
  metadataKey,
}: IUseNotebookMetadataPersistenceParams) {
  const prevMetadataJsonRef = useRef(JSON.stringify(metadata));

  useEffect(() => {
    const json = JSON.stringify(metadata);
    if (json !== prevMetadataJsonRef.current) {
      prevMetadataJsonRef.current = json;
      const notebook = tracker.currentWidget;
      if (notebook) {
        NotebookUtils.setMetaData(notebook, metadataKey, metadata);
      }
    }
  }, [metadata, tracker, metadataKey]);
}
