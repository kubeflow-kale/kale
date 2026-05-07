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

import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Kernel } from '@jupyterlab/services';
import {
  DefaultState,
  IExperiment,
  IKaleNotebookMetadata,
} from '../LeftPanelTypes';
import { useNotebookLoader } from './useNotebookLoader';
import { useNotebookMetadataPersistence } from './useNotebookMetadataPersistence';
import { useEnableByDefaultEffect } from './useEnableByDefaultEffect';

const KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook';
const defaultMetadata = DefaultState.metadata;

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

export interface ILoaderSetters {
  setMetadata: Dispatch<SetStateAction<IKaleNotebookMetadata>>;
  setExperiments: Dispatch<SetStateAction<IExperiment[]>>;
  setGettingExperiments: Dispatch<SetStateAction<boolean>>;
  setIsEnabled: Dispatch<SetStateAction<boolean>>;
  setNamespace: Dispatch<SetStateAction<string>>;
  setKfpUiHost: Dispatch<SetStateAction<string>>;
  setDefaultBaseImage: Dispatch<SetStateAction<string>>;
  metadataRef: MutableRefObject<IKaleNotebookMetadata>;
  experimentsRef: MutableRefObject<IExperiment[]>;
  resetForNoNotebook: () => void;
}

interface IUseNotebookMetadataParams {
  tracker: INotebookTracker;
  backend: boolean;
  kernel: Kernel.IKernelConnection;
  enableKaleByDefault: boolean;
}

/**
 * Hook that owns all pipeline metadata state for the left panel: notebook
 * metadata fields, experiment list, enable toggle, and namespace. Composes
 * sub-hooks for notebook loading, metadata persistence, and the
 * enable-by-default setting.
 */
export function useNotebookMetadata({
  tracker,
  backend,
  kernel,
  enableKaleByDefault,
}: IUseNotebookMetadataParams): INotebookMetadataState {
  const [metadata, setMetadata] =
    useState<IKaleNotebookMetadata>(defaultMetadata);
  const [experiments, setExperiments] = useState<IExperiment[]>([]);
  const [gettingExperiments, setGettingExperiments] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [namespace, setNamespace] = useState('');
  const [kfpUiHost, setKfpUiHost] = useState('');
  const [defaultBaseImage, setDefaultBaseImage] = useState('');

  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;
  const experimentsRef = useRef(experiments);
  experimentsRef.current = experiments;

  // --- updaters (exposed to LeftPanel form inputs) ---

  const updateExperiment = useCallback((experiment: IExperiment) => {
    setMetadata(prev => ({
      ...prev,
      experiment,
      experiment_name: experiment.name,
    }));
  }, []);

  const updatePipelineName = useCallback((name: string) => {
    setMetadata(prev => ({ ...prev, pipeline_name: name }));
  }, []);

  const updatePipelineDescription = useCallback((desc: string) => {
    setMetadata(prev => ({ ...prev, pipeline_description: desc }));
  }, []);

  const updateDockerImage = useCallback((name: string) => {
    setMetadata(prev => ({ ...prev, base_image: name }));
  }, []);

  const updateEnableCaching = useCallback((enabled: boolean) => {
    setMetadata(prev => ({ ...prev, enable_caching: enabled }));
  }, []);

  const resetForNoNotebook = useCallback(() => {
    setMetadata(defaultMetadata);
    setExperiments([]);
    setGettingExperiments(false);
    setIsEnabled(false);
    setNamespace('');
    setKfpUiHost('');
    setDefaultBaseImage('');
  }, []);

  // --- composed hooks ---

  useNotebookLoader({
    tracker,
    backend,
    kernel,
    enableKaleByDefault,
    metadataKey: KALE_NOTEBOOK_METADATA_KEY,
    setters: {
      setMetadata,
      setExperiments,
      setGettingExperiments,
      setIsEnabled,
      setNamespace,
      setKfpUiHost,
      setDefaultBaseImage,
      metadataRef,
      experimentsRef,
      resetForNoNotebook,
    },
  });

  useEnableByDefaultEffect({
    enableKaleByDefault,
    isEnabled,
    setIsEnabled,
  });

  useNotebookMetadataPersistence({
    tracker,
    metadata,
    metadataKey: KALE_NOTEBOOK_METADATA_KEY,
  });

  return {
    metadata,
    experiments,
    gettingExperiments,
    isEnabled,
    namespace,
    kfpUiHost,
    defaultBaseImage,
    updateExperiment,
    updatePipelineName,
    updatePipelineDescription,
    updateDockerImage,
    updateEnableCaching,
    setIsEnabled,
  };
}
