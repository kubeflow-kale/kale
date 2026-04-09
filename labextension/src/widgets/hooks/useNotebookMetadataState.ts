import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from 'react';
import { DefaultState, IExperiment, IKaleNotebookMetadata } from '../LeftPanel';

const defaultMetadata = DefaultState.metadata;

export interface INotebookMetadataStateSlice {
  metadata: IKaleNotebookMetadata;
  experiments: IExperiment[];
  gettingExperiments: boolean;
  isEnabled: boolean;
  namespace: string;
  kfpUiHost: string;
  defaultBaseImage: string;
  setMetadata: Dispatch<SetStateAction<IKaleNotebookMetadata>>;
  setExperiments: Dispatch<SetStateAction<IExperiment[]>>;
  setGettingExperiments: Dispatch<SetStateAction<boolean>>;
  setIsEnabled: Dispatch<SetStateAction<boolean>>;
  setNamespace: Dispatch<SetStateAction<string>>;
  setKfpUiHost: Dispatch<SetStateAction<string>>;
  setDefaultBaseImage: Dispatch<SetStateAction<string>>;
  metadataRef: MutableRefObject<IKaleNotebookMetadata>;
  experimentsRef: MutableRefObject<IExperiment[]>;
  serverBaseImageRef: MutableRefObject<string>;
  updateExperiment: (experiment: IExperiment) => void;
  updatePipelineName: (name: string) => void;
  updatePipelineDescription: (desc: string) => void;
  updateDockerImage: (name: string) => void;
  updateEnableCaching: (enabled: boolean) => void;
  resetForNoNotebook: () => void;
}

export function useNotebookMetadataState(): INotebookMetadataStateSlice {
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
  const serverBaseImageRef = useRef('');

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

  return {
    metadata,
    experiments,
    gettingExperiments,
    isEnabled,
    namespace,
    kfpUiHost,
    defaultBaseImage,
    setMetadata,
    setExperiments,
    setGettingExperiments,
    setIsEnabled,
    setNamespace,
    setKfpUiHost,
    setDefaultBaseImage,
    metadataRef,
    experimentsRef,
    serverBaseImageRef,
    updateExperiment,
    updatePipelineName,
    updatePipelineDescription,
    updateDockerImage,
    updateEnableCaching,
    resetForNoNotebook,
  };
}
