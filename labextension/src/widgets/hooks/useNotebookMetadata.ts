import { useCallback, useEffect, useRef, useState } from 'react';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Kernel } from '@jupyterlab/services';
import { PageConfig } from '@jupyterlab/coreutils';
import NotebookUtils from '../../lib/NotebookUtils';
import Commands from '../../lib/Commands';
import {
  DefaultState,
  IExperiment,
  IKaleNotebookMetadata,
  NEW_EXPERIMENT,
} from '../LeftPanel';

const KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook';
const DEFAULT_UI_URL = 'http://localhost:8080';

const defaultMetadata = DefaultState.metadata;

function getNotebookFileName(notebook: NotebookPanel | null): string {
  if (!notebook?.context?.path) {
    return '';
  }
  const path = notebook.context.path as string;
  const base = path.split('/').pop() || '';
  return base.replace(/\.ipynb$/i, '');
}

function sanitizePipelineName(name: string): string {
  if (!name) {
    return '';
  }
  let s = name.toLowerCase();
  s = s.replace(/[^a-z0-9-]+/g, '-');
  s = s.replace(/-+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  if (!/^[a-z0-9].*[a-z0-9]$/.test(s)) {
    return 'pipeline-' + Date.now().toString(36);
  }
  return s;
}

function getNotebookPath(notebook: NotebookPanel | null): string | false {
  if (!notebook) {
    return false;
  }
  return PageConfig.getOption('serverRoot') + '/' + notebook.context.path;
}

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

  const prevEnableByDefaultRef = useRef(enableKaleByDefault);

  // --- metadata field updaters ---

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

  // --- core async notebook loading ---

  const loadNotebookPanel = useCallback(
    async (notebook: NotebookPanel) => {
      if (tracker.size === 0) {
        return;
      }

      const commands = new Commands(notebook, kernel);
      await notebook.sessionContext.ready;

      const host = (await commands.getKfpUiHost()) || DEFAULT_UI_URL;
      const defImage = await commands.getDefaultBaseImage();
      setKfpUiHost(host);
      setDefaultBaseImage(defImage);

      const notebookMetadata = NotebookUtils.getMetaData(
        notebook,
        KALE_NOTEBOOK_METADATA_KEY,
      );

      let fetchedExperiments: IExperiment[] = [];
      let serverBaseImage = serverBaseImageRef.current;

      if (backend) {
        setNamespace(await commands.getNamespace());

        const nbFilePath = getNotebookPath(notebook);
        if (nbFilePath) {
          await commands.resumeStateIfExploreNotebook(nbFilePath);
        }

        const baseImage = await commands.getBaseImage();
        serverBaseImage = baseImage || '';
        serverBaseImageRef.current = serverBaseImage;

        setGettingExperiments(true);
        const currentMeta = metadataRef.current;
        const expResult = await commands.getExperiments(
          currentMeta.experiment,
          currentMeta.experiment_name,
        );
        fetchedExperiments = expResult.experiments;

        setExperiments(expResult.experiments);
        setGettingExperiments(false);
        setMetadata(prev => ({
          ...prev,
          experiment: expResult.experiment,
          experiment_name: expResult.experiment_name,
        }));
      }

      if (notebookMetadata) {
        const currentMeta = metadataRef.current;
        const currentExperiments = experimentsRef.current;
        let experiment: IExperiment = currentMeta.experiment;
        let experiment_name: string = currentMeta.experiment_name;

        if (notebookMetadata['experiment']) {
          experiment = {
            id:
              notebookMetadata['experiment']['id'] || currentMeta.experiment.id,
            name:
              notebookMetadata['experiment']['name'] ||
              currentMeta.experiment.name,
          };
          experiment_name = experiment.name;
          const experimentsToUse =
            fetchedExperiments.length > 0
              ? fetchedExperiments
              : currentExperiments;
          if (
            !experiment.id &&
            !experiment.name &&
            experimentsToUse.length > 0
          ) {
            experiment = experimentsToUse[0];
            experiment_name = experimentsToUse[0].name;
          }
        } else if (notebookMetadata['experiment_name']) {
          const matching = currentExperiments.filter(
            (e: IExperiment) => e.name === notebookMetadata['experiment_name'],
          );
          if (matching.length > 0) {
            experiment = matching[0];
          } else {
            experiment = {
              id: NEW_EXPERIMENT.id,
              name: notebookMetadata['experiment_name'],
            };
          }
          experiment_name = notebookMetadata['experiment_name'];
        } else {
          if (currentExperiments.length > 0) {
            experiment = currentExperiments[0];
            experiment_name = currentExperiments[0].name;
          } else if (currentMeta.experiment.id || currentMeta.experiment.name) {
            experiment = currentMeta.experiment;
            experiment_name = currentMeta.experiment_name || '';
          } else {
            experiment = { id: '', name: '' };
            experiment_name = '';
          }
        }

        const defaultPipelineName = getNotebookFileName(notebook);
        const sanitized = sanitizePipelineName(defaultPipelineName);
        setMetadata({
          ...notebookMetadata,
          experiment,
          experiment_name,
          pipeline_name:
            notebookMetadata['pipeline_name'] &&
            notebookMetadata['pipeline_name'] !== ''
              ? notebookMetadata['pipeline_name']
              : sanitized,
          pipeline_description: notebookMetadata['pipeline_description'] || '',
          base_image: notebookMetadata['base_image'] || serverBaseImage,
          steps_defaults: defaultMetadata.steps_defaults,
        });
      } else {
        const defaultPipelineName = getNotebookFileName(notebook);
        const sanitized = sanitizePipelineName(defaultPipelineName);
        setMetadata(prev => ({
          ...defaultMetadata,
          experiment: prev.experiment,
          experiment_name: prev.experiment_name,
          pipeline_name: sanitized,
          base_image: serverBaseImage || defaultMetadata.base_image,
        }));
      }
    },
    [tracker, backend, kernel],
  );

  // --- tracker.currentChanged signal wiring ---

  useEffect(() => {
    const handleNotebookChanged = async (
      _tracker: INotebookTracker,
      notebook: NotebookPanel | null,
    ) => {
      if (notebook) {
        await loadNotebookPanel(notebook);
        setIsEnabled(prev => enableKaleByDefault || prev);
      } else {
        setMetadata(defaultMetadata);
        setExperiments([]);
        setGettingExperiments(false);
        setIsEnabled(false);
        setNamespace('');
        setKfpUiHost('');
        setDefaultBaseImage('');
      }
    };

    tracker.currentChanged.connect(handleNotebookChanged);

    // Load the already-open notebook on mount
    if (tracker.currentWidget instanceof NotebookPanel) {
      loadNotebookPanel(tracker.currentWidget);
    }

    return () => {
      tracker.currentChanged.disconnect(handleNotebookChanged);
    };
  }, [tracker, loadNotebookPanel, enableKaleByDefault]);

  // --- enableKaleByDefault prop change ---

  useEffect(() => {
    if (!prevEnableByDefaultRef.current && enableKaleByDefault && !isEnabled) {
      setIsEnabled(true);
    }
    prevEnableByDefaultRef.current = enableKaleByDefault;
  }, [enableKaleByDefault, isEnabled]);

  // --- persist metadata to notebook ---

  const prevMetadataJsonRef = useRef(JSON.stringify(metadata));

  useEffect(() => {
    const json = JSON.stringify(metadata);
    if (json !== prevMetadataJsonRef.current) {
      prevMetadataJsonRef.current = json;
      const notebook = tracker.currentWidget;
      if (notebook) {
        NotebookUtils.setMetaData(
          notebook,
          KALE_NOTEBOOK_METADATA_KEY,
          metadata,
        );
      }
    }
  }, [metadata, tracker]);

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
