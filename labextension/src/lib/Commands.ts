/*
 * Copyright 2020 The Kale Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Kernel } from '@jupyterlab/services';
import { NotebookPanel } from '@jupyterlab/notebook';
import {
  _legacy_executeRpc,
  _legacy_executeRpcAndShowRPCError,
  RPCError,
} from './RPCUtils';
import { wait } from './Utils';
import {
  DefaultState,
  IExperiment,
  IKaleNotebookMetadata,
  IKatibExperiment,
  IVolumeMetadata,
  NEW_EXPERIMENT,
} from '../widgets/LeftPanel';
import NotebookUtils from './NotebookUtils';
import {
  SELECT_VOLUME_SIZE_TYPES,
  SELECT_VOLUME_TYPES,
} from '../widgets/VolumesPanel';
import { IDocumentManager } from '@jupyterlab/docmanager';
import CellUtils from './CellUtils';

enum RUN_CELL_STATUS {
  OK = 'ok',
  ERROR = 'error',
}

interface ICompileNotebookArgs {
  source_notebook_path: string;
  notebook_metadata_overrides: IKaleNotebookMetadata;
  debug: boolean;
}

interface IUploadPipelineArgs {
  pipeline_package_path: string;
  pipeline_metadata: Object;
  overwrite: boolean;
}

interface IUploadPipelineResp {
  already_exists: boolean;
  pipeline: { id: string; name: string };
}

interface IRunPipelineArgs {
  pipeline_metadata: Object;
  pipeline_package_path?: string;
  pipeline_id?: string;
}

interface IKatibRunArgs {
  pipeline_id: string;
  pipeline_metadata: any;
  output_path: string;
}

export default class Commands {
  private readonly _notebook: NotebookPanel;
  private readonly _kernel: Kernel.IKernelConnection;

  constructor(notebook: NotebookPanel, kernel: Kernel.IKernelConnection) {
    this._notebook = notebook;
    this._kernel = kernel;
  }

  snapshotNotebook = async () => {
    return await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'rok.snapshot_notebook',
    );
  };

  getSnapshotProgress = async (task_id: string, ms?: number) => {
    const task = await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'rok.get_task',
      {
        task_id,
      },
    );
    if (ms) {
      await wait(ms);
    }
    return task;
  };

  runSnapshotProcedure = async (onUpdate: Function) => {
    const showSnapshotProgress = true;
    const snapshot = await this.snapshotNotebook();
    const taskId = snapshot.task.id;
    let task = await this.getSnapshotProgress(taskId);
    onUpdate({ task, showSnapshotProgress });

    while (!['success', 'error', 'canceled'].includes(task.status)) {
      task = await this.getSnapshotProgress(taskId, 1000);
      onUpdate({ task });
    }

    if (task.status === 'success') {
      console.log('Snapshotting successful!');
      return task;
    } else if (task.status === 'error') {
      console.error('Snapshotting failed');
      console.error('Stopping the deployment...');
    } else if (task.status === 'canceled') {
      console.error('Snapshotting canceled');
      console.error('Stopping the deployment...');
    }

    return null;
  };

  replaceClonedVolumes = async (
    bucket: string,
    obj: string,
    version: string,
    volumes: IVolumeMetadata[],
  ) => {
    return await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'rok.replace_cloned_volumes',
      {
        bucket,
        obj,
        version,
        volumes,
      },
    );
  };

  getMountedVolumes = async (currentNotebookVolumes: IVolumeMetadata[]) => {
    let notebookVolumes: IVolumeMetadata[] = await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'nb.list_volumes',
    );
    let availableVolumeTypes = SELECT_VOLUME_TYPES.map(t => {
      return t.value === 'snap' ? { ...t, invalid: false } : t;
    });

    if (notebookVolumes) {
      notebookVolumes = notebookVolumes.map(volume => {
        const sizeGroup = SELECT_VOLUME_SIZE_TYPES.filter(
          s => volume.size >= s.base,
        )[0];
        volume.size = Math.ceil(volume.size / sizeGroup.base);
        volume.size_type = sizeGroup.value;
        volume.annotations = [];
        return volume;
      });
      availableVolumeTypes = availableVolumeTypes.map(t => {
        return t.value === 'clone' ? { ...t, invalid: false } : t;
      });
    } else {
      notebookVolumes = currentNotebookVolumes;
    }
    return {
      notebookVolumes,
      selectVolumeTypes: availableVolumeTypes,
    };
  };

  unmarshalData = async (nbFileName: string) => {
    const cmd: string =
      `from kale.rpc.nb import unmarshal_data as __kale_rpc_unmarshal_data\n` +
      `locals().update(__kale_rpc_unmarshal_data("${nbFileName}"))`;
    console.log('Executing command: ' + cmd);
    await NotebookUtils.sendKernelRequestFromNotebook(this._notebook, cmd, {});
  };

  getBaseImage = async () => {
    let baseImage: string = null;
    try {
      baseImage = await _legacy_executeRpc(
        this._notebook,
        this._kernel,
        'nb.get_base_image',
      );
    } catch (error) {
      if (error instanceof RPCError) {
        console.warn('Kale is not running in a Notebook Server', error.error);
      } else {
        throw error;
      }
    }
    return baseImage;
  };

  getExperiments = async (
    experiment: { id: string; name: string },
    experimentName: string,
  ) => {
    let experimentsList: IExperiment[] = await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'kfp.list_experiments',
    );
    if (experimentsList) {
      experimentsList.push(NEW_EXPERIMENT);
    } else {
      experimentsList = [NEW_EXPERIMENT];
    }

    // Fix experiment metadata
    let newExperiment: IExperiment = null;
    let selectedExperiments: IExperiment[] = experimentsList.filter(
      e =>
        e.id === experiment.id ||
        e.name === experiment.name ||
        e.name === experimentName,
    );
    if (
      selectedExperiments.length === 0 ||
      selectedExperiments[0].id === NEW_EXPERIMENT.id
    ) {
      let name = experimentsList[0].name;
      if (name === NEW_EXPERIMENT.name) {
        name = experiment.name !== '' ? experiment.name : experimentName;
      }
      newExperiment = { ...experimentsList[0], name: name };
    } else {
      newExperiment = selectedExperiments[0];
    }
    return {
      experiments: experimentsList,
      experiment: newExperiment,
      experiment_name: newExperiment.name,
    };
  };

  pollRun(runPipeline: any, onUpdate: Function) {
    _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'kfp.get_run',
      {
        run_id: runPipeline.id,
      },
    ).then(run => {
      onUpdate({ runPipeline: run });
      if (run && (run.status === 'Running' || run.status === null)) {
        setTimeout(() => this.pollRun(run, onUpdate), 2000);
      }
    });
  }

  pollKatib(katibExperiment: IKatibExperiment, onUpdate: Function) {
    const getExperimentArgs: any = {
      experiment: katibExperiment.name,
      namespace: katibExperiment.namespace,
    };
    _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'katib.get_experiment',
      getExperimentArgs,
    ).then(katib => {
      if (!katib) {
        // could not get the experiment
        onUpdate({ katib: { status: 'error' } });
        return;
      }
      onUpdate({ katib });
      if (katib && katib.status !== 'Succeeded' && katib.status !== 'Failed') {
        setTimeout(() => this.pollKatib(katibExperiment, onUpdate), 5000);
      }
    });
  }

  validateMetadata = async (
    notebookPath: string,
    metadata: IKaleNotebookMetadata,
    onUpdate: Function,
  ): Promise<boolean> => {
    onUpdate({ showValidationProgress: true });
    const validateNotebookArgs = {
      source_notebook_path: notebookPath,
      notebook_metadata_overrides: metadata,
    };
    const validateNotebook = await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'nb.validate_notebook',
      validateNotebookArgs,
    );
    if (!validateNotebook) {
      onUpdate({ notebookValidation: false });
      return false;
    }
    onUpdate({ notebookValidation: true });
    return true;
  };

  /**
   * Analyse the current metadata and produce some warning to be shown
   * under the compilation task
   * @param metadata Notebook metadata
   */
  getCompileWarnings = (metadata: IKaleNotebookMetadata) => {
    let warningContent = [];

    // in case the notebook's docker base image is different than the default
    // one (e.g. the one detected in the Notebook Server), alert the user
    if (
      DefaultState.metadata.docker_image !== '' &&
      metadata.docker_image !== DefaultState.metadata.docker_image
    ) {
      warningContent.push(
        'The image you used to create the notebook server is different ' +
          'from the image you have selected for your pipeline.',
        '',
        'Your Kubeflow pipeline will use the following image: <pre><b>' +
          metadata.docker_image +
          '</b></pre>',
        'You created the notebook server using the following image: <pre><b>' +
          DefaultState.metadata.docker_image +
          '</b></pre>',
        '',
        "To use this notebook server's image as base image" +
          ' for the pipeline steps, delete the existing docker image' +
          ' from the Advanced Settings section.',
      );
    }
    return warningContent;
  };

  // todo: docManager needs to be passed to deploysProgress during init
  // todo: autosnapshot will become part of metadata
  // todo: deployDebugMessage will be removed (the "Debug" toggle is of no use
  //  anymore
  compilePipeline = async (
    notebookPath: string,
    metadata: IKaleNotebookMetadata,
    docManager: IDocumentManager,
    deployDebugMessage: boolean,
    onUpdate: Function,
  ) => {
    // after parsing and validating the metadata, show warnings (if necessary)
    const compileWarnings = this.getCompileWarnings(metadata);
    onUpdate({ showCompileProgress: true, docManager: docManager });
    if (compileWarnings.length) {
      onUpdate({ compileWarnings });
    }
    const compileNotebookArgs: ICompileNotebookArgs = {
      source_notebook_path: notebookPath,
      notebook_metadata_overrides: metadata,
      debug: deployDebugMessage,
    };
    const compileNotebook = await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'nb.compile_notebook',
      compileNotebookArgs,
    );
    if (!compileNotebook) {
      onUpdate({ compiledPath: 'error' });
      await NotebookUtils.showMessage('Operation Failed', [
        'Could not compile pipeline.',
      ]);
    } else {
      // Pass to the deploy progress the path to the generated py script:
      // compileNotebook is the name of the tar package, that generated in the
      // workdir. Instead, the python script has a slightly different name and
      // is generated in the same directory where the notebook lives.
      onUpdate({
        compiledPath: compileNotebook.pipeline_package_path.replace(
          'pipeline.yaml',
          'kale.py',
        ),
      });
    }
    return compileNotebook;
  };

  uploadPipeline = async (
    compiledPackagePath: string,
    compiledPipelineMetadata: IKaleNotebookMetadata,
    onUpdate: Function,
  ): Promise<IUploadPipelineResp> => {
    onUpdate({ showUploadProgress: true });
    const uploadPipelineArgs: IUploadPipelineArgs = {
      pipeline_package_path: compiledPackagePath,
      pipeline_metadata: compiledPipelineMetadata,
      overwrite: false,
    };
    let uploadPipeline: IUploadPipelineResp = await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'kfp.upload_pipeline',
      uploadPipelineArgs,
    );
    let result = true;
    if (!uploadPipeline) {
      onUpdate({ showUploadProgress: false, pipeline: false });
      return uploadPipeline;
    }
    if (uploadPipeline && uploadPipeline.already_exists) {
      // show dialog to ask user if they want to overwrite the existing pipeline
      result = await NotebookUtils.showYesNoDialog('Pipeline Upload Failed', [
        'Pipeline with name ' +
          compiledPipelineMetadata.pipeline_name +
          ' already exists. ',
        'Would you like to overwrite it?',
      ]);
      // OVERWRITE EXISTING PIPELINE
      if (result) {
        uploadPipelineArgs.overwrite = true;
        uploadPipeline = await _legacy_executeRpcAndShowRPCError(
          this._notebook,
          this._kernel,
          'kfp.upload_pipeline',
          uploadPipelineArgs,
        );
      } else {
        onUpdate({ pipeline: false });
      }
    }
    if (uploadPipeline && result) {
      onUpdate({ pipeline: uploadPipeline });
    }
    return uploadPipeline;
  };

  runKatib = async (
    notebookPath: string,
    metadata: IKaleNotebookMetadata,
    pipelineId: string,
    onUpdate: Function,
  ): Promise<IKatibExperiment> => {
    onUpdate({ showKatibKFPExperiment: true });
    // create a new experiment, using the base name of the currently
    // selected one
    const newExpName: string =
      metadata.experiment.name +
      '-' +
      Math.random()
        .toString(36)
        .slice(2, 7);

    // create new KFP experiment
    let kfpExperiment: { id: string; name: string };
    try {
      kfpExperiment = await _legacy_executeRpc(
        this._notebook,
        this._kernel,
        'kfp.create_experiment',
        {
          experiment_name: newExpName,
        },
      );
      onUpdate({ katibKFPExperiment: kfpExperiment });
    } catch (error) {
      onUpdate({
        showKatibProgress: false,
        katibKFPExperiment: { id: 'error', name: 'error' },
      });
      throw error;
    }

    onUpdate({ showKatibProgress: true });
    const runKatibArgs: IKatibRunArgs = {
      pipeline_id: pipelineId,
      pipeline_metadata: {
        ...metadata,
        experiment_name: kfpExperiment.name,
      },
      output_path: notebookPath.substring(0, notebookPath.lastIndexOf('/')),
    };
    let katibExperiment: IKatibExperiment = null;
    try {
      katibExperiment = await _legacy_executeRpc(
        this._notebook,
        this._kernel,
        'katib.create_katib_experiment',
        runKatibArgs,
      );
    } catch (error) {
      onUpdate({ katib: { status: 'error' } });
      throw error;
    }
    return katibExperiment;
  };

  runPipeline = async (
    pipelineId: string,
    compiledPipelineMetadata: IKaleNotebookMetadata,
    onUpdate: Function,
  ) => {
    onUpdate({ showRunProgress: true });
    const runPipelineArgs: IRunPipelineArgs = {
      pipeline_metadata: compiledPipelineMetadata,
      pipeline_id: pipelineId,
    };
    const runPipeline = await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'kfp.run_pipeline',
      runPipelineArgs,
    );
    if (runPipeline) {
      onUpdate({ runPipeline });
    } else {
      onUpdate({ showRunProgress: false, runPipeline: false });
    }
    return runPipeline;
  };

  resumeStateIfExploreNotebook = async (notebookPath: string) => {
    const exploration = await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'nb.explore_notebook',
      { source_notebook_path: notebookPath },
    );

    if (!exploration || !exploration.is_exploration) {
      return;
    }

    NotebookUtils.clearCellOutputs(this._notebook);
    let runCellResponse = await NotebookUtils.runGlobalCells(this._notebook);
    if (runCellResponse.status === RUN_CELL_STATUS.OK) {
      // unmarshalData runs in the same kernel as the .ipynb, so it requires the
      // filename
      await this.unmarshalData(notebookPath.split('/').pop());
      const cell = CellUtils.getCellByStepName(
        this._notebook,
        exploration.step_name,
      );
      const title = 'Notebook Exploration';
      const message = [`Resuming notebook at step: "${exploration.step_name}"`];
      if (cell) {
        NotebookUtils.selectAndScrollToCell(this._notebook, cell);
      } else {
        message.push(`ERROR: Could not retrieve step's position.`);
      }
      await NotebookUtils.showMessage(title, message);
    } else {
      await NotebookUtils.showMessage('Notebook Exploration', [
        `Executing "${runCellResponse.cellType}" cell failed.\n` +
          `Resuming notebook at cell index ${runCellResponse.cellIndex}.`,
        `Error name: ${runCellResponse.ename}`,
        `Error value: ${runCellResponse.evalue}`,
      ]);
    }
    await _legacy_executeRpcAndShowRPCError(
      this._notebook,
      this._kernel,
      'nb.remove_marshal_dir',
      {
        source_notebook_path: notebookPath,
      },
    );
  };

  findPodDefaultLabelsOnServer = async (): Promise<{
    [key: string]: string;
  }> => {
    let labels: {
      [key: string]: string;
    } = {};
    try {
      return await _legacy_executeRpc(
        this._notebook,
        this._kernel,
        'nb.find_poddefault_labels_on_server',
      );
    } catch (error) {
      console.error('Failed to retrieve PodDefaults applied on server', error);
      return labels;
    }
  };
}
