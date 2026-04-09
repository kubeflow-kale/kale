import { useCallback, useRef, useState } from 'react';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Kernel } from '@jupyterlab/services';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { PageConfig } from '@jupyterlab/coreutils';
import { DeployProgressState } from '../deploys-progress/DeploysProgress';
import { DefaultState, DeployType, IKaleNotebookMetadata } from '../LeftPanel';
import Commands from '../../lib/Commands';
import NotebookUtils from '../../lib/NotebookUtils';

let deployIndex = 0;

interface IUseDeploymentParams {
  tracker: INotebookTracker;
  kernel: Kernel.IKernelConnection;
  docManager: IDocumentManager;
  autoSaveOnCompileOrRun: boolean;
}

export interface IDeploymentState {
  runDeployment: boolean;
  deploys: { [index: number]: DeployProgressState };
  activateRunDeployState: (type: DeployType) => void;
  onPanelRemove: (index: number) => void;
  triggerCompile: () => void;
  triggerRun: () => void;
  syncRefs: (
    metadata: IKaleNotebookMetadata,
    namespace: string,
    deployDebugMessage: boolean,
  ) => void;
}

export function useDeployment({
  tracker,
  kernel,
  docManager,
  autoSaveOnCompileOrRun,
}: IUseDeploymentParams): IDeploymentState {
  const [runDeployment, setRunDeployment] = useState(false);
  const [deploys, setDeploys] = useState<{
    [index: number]: DeployProgressState;
  }>({});

  // Refs to read current values from inside the async deploy command
  // without needing them in dependency arrays.
  const runDeploymentRef = useRef(false);
  runDeploymentRef.current = runDeployment;

  // These refs will be set by the LeftPanel component before deploy is used
  const metadataRef = useRef<IKaleNotebookMetadata>(DefaultState.metadata);
  const namespaceRef = useRef('');
  const deployDebugMessageRef = useRef(false);
  const deploymentTypeRef = useRef<DeployType>('compile');

  // Expose setters so the parent component can keep refs in sync
  const syncRefs = useCallback(
    (
      metadata: IKaleNotebookMetadata,
      namespace: string,
      deployDebugMessage: boolean,
    ) => {
      metadataRef.current = metadata;
      namespaceRef.current = namespace;
      deployDebugMessageRef.current = deployDebugMessage;
    },
    [],
  );

  const updateDeployProgress = useCallback(
    (index: number, progress: DeployProgressState) => {
      setDeploys(prev => {
        const existing = prev[index];
        const entry = existing ? { ...existing, ...progress } : progress;
        return { ...prev, [index]: entry };
      });
    },
    [],
  );

  const onPanelRemove = useCallback((index: number) => {
    setDeploys(prev => {
      const deploy = prev[index];
      if (deploy === null) {
        return prev;
      }
      return { ...prev, [index]: { ...deploy, deleted: true } };
    });
  }, []);

  const getActiveNotebook = useCallback(
    (): NotebookPanel | null => tracker.currentWidget,
    [tracker],
  );

  const getActiveNotebookPath = useCallback(() => {
    const notebook = getActiveNotebook();
    if (!notebook) {
      return false;
    }
    return PageConfig.getOption('serverRoot') + '/' + notebook.context.path;
  }, [getActiveNotebook]);

  const runDeploymentCommand = useCallback(async () => {
    const activeNotebook = getActiveNotebook();

    if (!activeNotebook) {
      setRunDeployment(false);
      return;
    }

    if (activeNotebook.model?.dirty && !autoSaveOnCompileOrRun) {
      const result = await NotebookUtils.showYesNoDialog('Unsaved Changes', [
        'Your current Notebook contains unsaved changes. Saving is required to proceed.',
        'Would you like to save now?',
      ]);
      if (!result) {
        setRunDeployment(false);
        return;
      }
    }
    if (activeNotebook.model?.dirty) {
      await activeNotebook.context.save();
    }

    const commands = new Commands(activeNotebook, kernel);
    const currentDeployIndex = ++deployIndex;
    const progressCallback = (x: DeployProgressState) => {
      updateDeployProgress(currentDeployIndex, {
        ...x,
        namespace: namespaceRef.current,
      });
    };

    const metadata: IKaleNotebookMetadata = JSON.parse(
      JSON.stringify(metadataRef.current),
    );

    if (metadata.base_image === '') {
      metadata.base_image = DefaultState.metadata.base_image;
    }

    const nbFilePath = getActiveNotebookPath();

    if (!nbFilePath) {
      progressCallback({ message: 'No active notebook path found.' });
      setRunDeployment(false);
      return;
    }

    // VALIDATE
    const validationSucceeded = await commands.validateMetadata(
      nbFilePath,
      metadata,
      progressCallback,
    );
    if (!validationSucceeded) {
      setRunDeployment(false);
      return;
    }
    progressCallback({ message: 'Validation completed successfully' });

    // COMPILE
    const compileResult = await commands.compilePipeline(
      nbFilePath,
      metadata,
      docManager,
      deployDebugMessageRef.current,
      progressCallback,
    );
    if (!compileResult.success) {
      setRunDeployment(false);
      return;
    }
    progressCallback({ message: 'Notebook compiled successfully' });

    // UPLOAD
    const currentDeploymentType = deploymentTypeRef.current;
    const uploadPipeline =
      currentDeploymentType === 'upload' || currentDeploymentType === 'run'
        ? await commands.uploadPipeline(
            compileResult.pipeline_package_path,
            compileResult.pipeline_metadata,
            progressCallback,
          )
        : null;

    if (!uploadPipeline) {
      setRunDeployment(false);
      progressCallback({ pipeline: false });
      return;
    }
    progressCallback({
      message: 'Pipeline uploaded successfully',
      pipeline: {
        pipeline: {
          pipelineid: uploadPipeline.pipeline.pipelineid,
          versionid: uploadPipeline.pipeline.versionid,
          name: uploadPipeline.pipeline.name,
        },
      },
    });

    // RUN
    if (currentDeploymentType === 'run') {
      const runPipeline = await commands.runPipeline(
        uploadPipeline.pipeline.pipelineid,
        uploadPipeline.pipeline.versionid,
        compileResult.pipeline_metadata,
        compileResult.pipeline_package_path,
        progressCallback,
      );
      if (runPipeline) {
        commands.pollRun(runPipeline, progressCallback);
      }
    }

    setRunDeployment(false);
  }, [
    getActiveNotebook,
    getActiveNotebookPath,
    kernel,
    docManager,
    autoSaveOnCompileOrRun,
    updateDeployProgress,
  ]);

  const activateRunDeployState = useCallback(
    (type: DeployType) => {
      if (!runDeploymentRef.current) {
        deploymentTypeRef.current = type;
        setRunDeployment(true);
        setDeploys({});
        runDeploymentCommand();
      }
    },
    [runDeploymentCommand],
  );

  const triggerCompile = useCallback(() => {
    activateRunDeployState('compile');
  }, [activateRunDeployState]);

  const triggerRun = useCallback(() => {
    activateRunDeployState('run');
  }, [activateRunDeployState]);

  return {
    runDeployment,
    deploys,
    activateRunDeployState,
    onPanelRemove,
    triggerCompile,
    triggerRun,
    // Internal: parent calls this each render to keep refs fresh
    syncRefs,
  };
}
