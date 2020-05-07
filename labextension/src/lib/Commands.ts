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
} from '../widgets/LeftPanelWidget';
import NotebookUtils from './NotebookUtils';
import {
  SELECT_VOLUME_SIZE_TYPES,
  SELECT_VOLUME_TYPES,
} from '../widgets/VolumesPanel';
import { IDocumentManager } from '@jupyterlab/docmanager';

interface ICompileNotebookArgs {
  source_notebook_path: string;
  notebook_metadata_overrides: IKaleNotebookMetadata;
  debug: boolean;
  auto_snapshot: boolean;
}

export default class Commands {
  private readonly _notebook: NotebookPanel;
  private readonly _kernel: Kernel.IKernel;

  constructor(notebook: NotebookPanel, kernel: Kernel.IKernel) {
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
    autosnapshot: boolean,
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
      auto_snapshot: autosnapshot,
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
}
