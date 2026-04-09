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
