import { useEffect, useRef } from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import NotebookUtils from '../../lib/NotebookUtils';
import { IKaleNotebookMetadata } from '../LeftPanel';

interface IUseNotebookMetadataPersistenceParams {
  tracker: INotebookTracker;
  metadata: IKaleNotebookMetadata;
  metadataKey: string;
}

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
