import { useCallback } from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Kernel } from '@jupyterlab/services';
import { IExperiment, IKaleNotebookMetadata } from '../LeftPanel';
import { useNotebookMetadataState } from './useNotebookMetadataState';
import { useNotebookLoader } from './useNotebookLoader';
import { useNotebookMetadataPersistence } from './useNotebookMetadataPersistence';
import { useEnableByDefaultEffect } from './useEnableByDefaultEffect';

const KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook';

export interface INotebookMetadataState {
  metadata: IKaleNotebookMetadata;
  experiments: IExperiment[];
  gettingExperiments: boolean;
  isEnabled: boolean;
  namespace: string;
  kfpUiHost: string;
  defaultBaseImage: string;
  updateExperiment: (experiment: IExperiment) => void;
  updatePipelineName: (name: string) => void;
  updatePipelineDescription: (desc: string) => void;
  updateDockerImage: (name: string) => void;
  updateEnableCaching: (enabled: boolean) => void;
  setIsEnabled: (enabled: boolean) => void;
}

interface IUseNotebookMetadataParams {
  tracker: INotebookTracker;
  backend: boolean;
  kernel: Kernel.IKernelConnection;
  enableKaleByDefault: boolean;
}

export function useNotebookMetadata({
  tracker,
  backend,
  kernel,
  enableKaleByDefault,
}: IUseNotebookMetadataParams): INotebookMetadataState {
  const state = useNotebookMetadataState();

  useNotebookLoader({
    tracker,
    backend,
    kernel,
    enableKaleByDefault,
    metadataKey: KALE_NOTEBOOK_METADATA_KEY,
    state,
  });

  useEnableByDefaultEffect({
    enableKaleByDefault,
    isEnabled: state.isEnabled,
    setIsEnabled: state.setIsEnabled,
  });

  useNotebookMetadataPersistence({
    tracker,
    metadata: state.metadata,
    metadataKey: KALE_NOTEBOOK_METADATA_KEY,
  });

  const setIsEnabled = useCallback(
    (enabled: boolean) => {
      state.setIsEnabled(enabled);
    },
    [state.setIsEnabled],
  );

  return {
    metadata: state.metadata,
    experiments: state.experiments,
    gettingExperiments: state.gettingExperiments,
    isEnabled: state.isEnabled,
    namespace: state.namespace,
    kfpUiHost: state.kfpUiHost,
    defaultBaseImage: state.defaultBaseImage,
    updateExperiment: state.updateExperiment,
    updatePipelineName: state.updatePipelineName,
    updatePipelineDescription: state.updatePipelineDescription,
    updateDockerImage: state.updateDockerImage,
    updateEnableCaching: state.updateEnableCaching,
    setIsEnabled,
  };
}
