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
  IExperiment,
  IVolumeMetadata,
  NEW_EXPERIMENT,
} from '../widgets/LeftPanelWidget';
import NotebookUtils from './NotebookUtils';
import {
  SELECT_VOLUME_SIZE_TYPES,
  SELECT_VOLUME_TYPES,
} from '../widgets/VolumesPanel';

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
}
