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
import { _legacy_executeRpcAndShowRPCError } from './RPCUtils';
import { wait } from './Utils';
import { IVolumeMetadata } from '../widgets/LeftPanelWidget';

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
}
