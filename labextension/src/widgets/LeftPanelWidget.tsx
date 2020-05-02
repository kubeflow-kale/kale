/*
 * Copyright 2019-2020 The Kale Authors
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

import * as React from 'react';
import {
  INotebookTracker,
  Notebook,
  NotebookPanel,
} from '@jupyterlab/notebook';
import NotebookUtils from '../lib/NotebookUtils';
import { RPCError, IRPCError, rokErrorTooltip } from '../lib/RPCUtils';
import CellUtils from '../lib/CellUtils';
import { AdvancedSettings } from '../components/AdvancedSettings';
import { Cell } from '@jupyterlab/cells';
import { InlineCellsMetadata } from './cell-metadata/InlineCellMetadata';
import { VolumesPanel } from './VolumesPanel';
import { SplitDeployButton } from '../components/DeployButton';
import { Kernel } from '@jupyterlab/services';
import { ExperimentInput } from '../components/ExperimentInput';
import {
  DeploysProgress,
  DeployProgressState,
} from './deploys-progress/DeploysProgress';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { ThemeProvider } from '@material-ui/core/styles';
import { theme } from '../Theme';
import { Button, Switch, Zoom } from '@material-ui/core';
import { KatibDialog } from './KatibDialog';
import { Input } from '../components/Input';
import { LightTooltip } from '../components/LightTooltip';
import {
  _legacy_executeRpc,
  _legacy_executeRpcAndShowRPCError,
} from '../lib/RPCUtils';
import { wait, removeIdxFromArray, updateIdxInArray } from '../lib/Utils';

const KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook';

enum RUN_CELL_STATUS {
  OK = 'ok',
  ERROR = 'error',
}

export interface ISelectOption {
  label: string;
  value: string;
}

export interface IExperiment {
  id: string;
  name: string;
}

export const NEW_EXPERIMENT: IExperiment = {
  name: '+ New Experiment',
  id: 'new',
};
const selectVolumeSizeTypes = [
  { label: 'Gi', value: 'Gi', base: 1024 ** 3 },
  { label: 'Mi', value: 'Mi', base: 1024 ** 2 },
  { label: 'Ki', value: 'Ki', base: 1024 ** 1 },
  { label: '', value: '', base: 1024 ** 0 },
];

enum VOLUME_TOOLTIP {
  CREATE_EMTPY_VOLUME = 'Mount an empty volume on your pipeline steps',
  CLONE_NOTEBOOK_VOLUME = "Clone a Notebook Server's volume and mount it on your pipeline steps",
  CLONE_EXISTING_SNAPSHOT = 'Clone a Rok Snapshot and mount it on your pipeline steps',
  USE_EXISTING_VOLUME = 'Mount an existing volume on your pipeline steps',
}

export interface ISelectVolumeTypes extends ISelectOption {
  invalid: boolean;
  tooltip: any;
}

const selectVolumeTypes: ISelectVolumeTypes[] = [
  {
    label: 'Create Empty Volume',
    value: 'new_pvc',
    invalid: false,
    tooltip: VOLUME_TOOLTIP.CREATE_EMTPY_VOLUME,
  },
  {
    label: 'Clone Notebook Volume',
    value: 'clone',
    invalid: true,
    tooltip: VOLUME_TOOLTIP.CLONE_NOTEBOOK_VOLUME,
  },
  {
    label: 'Clone Existing Snapshot',
    value: 'snap',
    invalid: true,
    tooltip: VOLUME_TOOLTIP.CLONE_EXISTING_SNAPSHOT,
  },
  {
    label: 'Use Existing Volume',
    value: 'pvc',
    invalid: false,
    tooltip: VOLUME_TOOLTIP.USE_EXISTING_VOLUME,
  },
];

interface IProps {
  lab: JupyterFrontEnd;
  tracker: INotebookTracker;
  notebook: NotebookPanel;
  docManager: IDocumentManager;
  backend: boolean;
  kernel: Kernel.IKernel;
  rokError: IRPCError;
}

interface IState {
  metadata: IKaleNotebookMetadata;
  runDeployment: boolean;
  deploymentType: string;
  deployDebugMessage: boolean;
  selectVal: string;
  activeNotebook?: NotebookPanel;
  activeCell?: Cell;
  activeCellIndex?: number;
  experiments: IExperiment[];
  gettingExperiments: boolean;
  notebookVolumes?: IVolumeMetadata[];
  volumes?: IVolumeMetadata[];
  selectVolumeTypes: ISelectVolumeTypes[];
  useNotebookVolumes: boolean;
  autosnapshot: boolean;
  deploys: { [index: number]: DeployProgressState };
  isEnabled: boolean;
  katibDialog: boolean;
}

export interface IAnnotation {
  key: string;
  value: string;
}

// Katib types: https://github.com/kubeflow/katib/blob/master/pkg/apis/controller/experiments/v1alpha3/experiment_types.go
export interface IKatibParameter {
  name: string;
  parameterType: 'unknown' | 'double' | 'int' | 'categorical' | 'discrete';
  feasibleSpace: { min?: string; max?: string; list?: string[]; step?: string };
}

interface IKatibObjective {
  goal?: number;
  type: 'minimize' | 'maximize';
  objectiveMetricName: string;
  additionalMetricNames?: string[];
}

interface IKatibAlgorithm {
  algorithmName:
    | 'random'
    | 'grid'
    | 'bayesianoptimization'
    | 'hyperband'
    | 'tpe';
  algorithmSettings?: { name: string; value: string }[];
  earlyStopping?: {
    earlyStoppingAlgorithmName: { name: string; value: string }[];
  };
}

export interface IKatibMetadata {
  parameters: IKatibParameter[];
  objective: IKatibObjective;
  algorithm: IKatibAlgorithm;
  maxTrialCount: number;
  maxFailedTrialCount: number;
  parallelTrialCount: number;
}

const DefaultKatibMetadata: IKatibMetadata = {
  parameters: [],
  objective: {
    type: 'minimize',
    objectiveMetricName: '',
  },
  algorithm: {
    algorithmName: 'grid',
  },
  maxTrialCount: 12,
  maxFailedTrialCount: 3,
  parallelTrialCount: 3,
};

export interface IVolumeMetadata {
  type: string;
  // name field will have different meaning based on the type:
  //  - pv: name of the PV
  //  - pvc: name of the pvc
  //  - new_pvc: new pvc with dynamic provisioning
  //  - clone: clone a volume which is currently mounted to the Notebook Server
  //  - snap: new_pvc from Rok Snapshot
  name: string;
  mount_point: string;
  size?: number;
  size_type?: string;
  annotations: IAnnotation[];
  snapshot: boolean;
  snapshot_name?: string;
}

// keep names with Python notation because they will be read
// in python by Kale.
interface IKaleNotebookMetadata {
  experiment: IExperiment;
  experiment_name: string; // Keep this for backwards compatibility
  pipeline_name: string;
  pipeline_description: string;
  docker_image: string;
  volumes: IVolumeMetadata[];
  katib_run: boolean;
  katib_metadata?: IKatibMetadata;
}

interface ICompileNotebookArgs {
  source_notebook_path: string;
  notebook_metadata_overrides: Object;
  debug: boolean;
  auto_snapshot: boolean;
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

export interface IKatibExperiment {
  name?: string;
  namespace?: string;
  status: string;
  trials?: number;
  trialsFailed?: number;
  trialsRunning?: number;
  trialsSucceeded?: number;
  maxTrialCount?: number;
}

const DefaultState: IState = {
  metadata: {
    experiment: { id: '', name: '' },
    experiment_name: '',
    pipeline_name: '',
    pipeline_description: '',
    docker_image: '',
    volumes: [],
    katib_run: false,
  },
  runDeployment: false,
  deploymentType: 'compile',
  deployDebugMessage: false,
  selectVal: '',
  activeNotebook: null,
  activeCell: null,
  activeCellIndex: 0,
  experiments: [],
  gettingExperiments: false,
  notebookVolumes: [],
  volumes: [],
  selectVolumeTypes: selectVolumeTypes,
  useNotebookVolumes: false,
  autosnapshot: false,
  deploys: {},
  isEnabled: false,
  katibDialog: false,
};

let deployIndex = 0;

const DefaultEmptyVolume: IVolumeMetadata = {
  type: 'new_pvc',
  name: '',
  mount_point: '',
  annotations: [],
  size: 1,
  size_type: 'Gi',
  snapshot: false,
  snapshot_name: '',
};

const DefaultEmptyAnnotation: IAnnotation = {
  key: '',
  value: '',
};

export class KubeflowKaleLeftPanel extends React.Component<IProps, IState> {
  // init state default values
  state = DefaultState;

  updateSelectValue = (val: string) => this.setState({ selectVal: val });
  // update metadata state values: use destructure operator to update nested dict
  updateExperiment = (experiment: IExperiment) =>
    this.setState({
      metadata: {
        ...this.state.metadata,
        experiment: experiment,
        experiment_name: experiment.name,
      },
    });
  updatePipelineName = (name: string) =>
    this.setState({
      metadata: { ...this.state.metadata, pipeline_name: name },
    });
  updatePipelineDescription = (desc: string) =>
    this.setState({
      metadata: { ...this.state.metadata, pipeline_description: desc },
    });
  updateDockerImage = (name: string) =>
    this.setState({
      metadata: {
        ...this.state.metadata,
        docker_image: name,
      },
    });
  updateVolumesSwitch = () => {
    this.setState({
      useNotebookVolumes: !this.state.useNotebookVolumes,
      volumes: this.state.notebookVolumes,
      metadata: {
        ...this.state.metadata,
        volumes: this.state.notebookVolumes,
      },
    });
  };
  updateAutosnapshotSwitch = () =>
    this.setState({ autosnapshot: !this.state.autosnapshot });

  // Volume managers
  deleteVolume = (idx: number) => {
    // If we delete the last volume, turn autosnapshot off
    const autosnapshot =
      this.state.volumes.length === 1 ? false : this.state.autosnapshot;
    this.setState({
      volumes: removeIdxFromArray(idx, this.state.volumes),
      metadata: {
        ...this.state.metadata,
        volumes: removeIdxFromArray(idx, this.state.metadata.volumes),
      },
      autosnapshot: autosnapshot,
    });
  };
  addVolume = () => {
    // If we add a volume to an empty list, turn autosnapshot on
    const autosnapshot =
      !this.props.rokError && this.state.volumes.length === 0
        ? true
        : !this.props.rokError && this.state.autosnapshot;
    this.setState({
      volumes: [...this.state.volumes, DefaultEmptyVolume],
      metadata: {
        ...this.state.metadata,
        volumes: [...this.state.metadata.volumes, DefaultEmptyVolume],
      },
      autosnapshot: autosnapshot,
    });
  };
  updateVolumeType = (type: string, idx: number) => {
    const kaleType: string = type === 'snap' ? 'new_pvc' : type;
    const annotations: IAnnotation[] =
      type === 'snap' ? [{ key: 'rok/origin', value: '' }] : [];
    this.setState({
      volumes: this.state.volumes.map((item, key) => {
        return key === idx
          ? { ...item, type: type, annotations: annotations }
          : item;
      }),
      metadata: {
        ...this.state.metadata,
        volumes: this.state.metadata.volumes.map((item, key) => {
          return key === idx
            ? { ...item, type: kaleType, annotations: annotations }
            : item;
        }),
      },
    });
  };
  updateVolumeName = (name: string, idx: number) => {
    this.setState({
      volumes: this.state.volumes.map((item, key) => {
        return key === idx ? { ...item, name: name } : item;
      }),
      metadata: {
        ...this.state.metadata,
        volumes: this.state.metadata.volumes.map((item, key) => {
          return key === idx ? { ...item, name: name } : item;
        }),
      },
    });
  };
  updateVolumeMountPoint = (mountPoint: string, idx: number) => {
    let cloneVolume: IVolumeMetadata = null;
    if (this.state.volumes[idx].type === 'clone') {
      cloneVolume = this.state.notebookVolumes.filter(
        v => v.mount_point === mountPoint,
      )[0];
    }
    const updateItem = (
      item: IVolumeMetadata,
      key: number,
    ): IVolumeMetadata => {
      if (key === idx) {
        if (item.type === 'clone') {
          return { ...cloneVolume };
        } else {
          return { ...this.state.volumes[idx], mount_point: mountPoint };
        }
      } else {
        return item;
      }
    };
    this.setState({
      volumes: this.state.volumes.map((item, key) => {
        return updateItem(item, key);
      }),
      metadata: {
        ...this.state.metadata,
        volumes: this.state.metadata.volumes.map((item, key) => {
          return updateItem(item, key);
        }),
      },
    });
  };
  updateVolumeSnapshot = (idx: number) => {
    this.setState({
      volumes: this.state.volumes.map((item, key) => {
        return key === idx
          ? {
              ...this.state.volumes[idx],
              snapshot: !this.state.volumes[idx].snapshot,
            }
          : item;
      }),
      metadata: {
        ...this.state.metadata,
        volumes: this.state.metadata.volumes.map((item, key) => {
          return key === idx
            ? {
                ...this.state.metadata.volumes[idx],
                snapshot: !this.state.metadata.volumes[idx].snapshot,
              }
            : item;
        }),
      },
    });
  };
  updateVolumeSnapshotName = (name: string, idx: number) => {
    this.setState({
      volumes: this.state.volumes.map((item, key) => {
        return key === idx
          ? { ...this.state.volumes[idx], snapshot_name: name }
          : item;
      }),
      metadata: {
        ...this.state.metadata,
        volumes: this.state.metadata.volumes.map((item, key) => {
          return key === idx
            ? { ...this.state.metadata.volumes[idx], snapshot_name: name }
            : item;
        }),
      },
    });
  };
  updateVolumeSize = (size: number, idx: number) => {
    this.setState({
      volumes: this.state.volumes.map((item, key) => {
        return key === idx ? { ...this.state.volumes[idx], size: size } : item;
      }),
      metadata: {
        ...this.state.metadata,
        volumes: this.state.metadata.volumes.map((item, key) => {
          return key === idx
            ? { ...this.state.metadata.volumes[idx], size: size }
            : item;
        }),
      },
    });
  };
  updateVolumeSizeType = (sizeType: string, idx: number) => {
    this.setState({
      volumes: this.state.volumes.map((item, key) => {
        return key === idx
          ? { ...this.state.volumes[idx], size_type: sizeType }
          : item;
      }),
      metadata: {
        ...this.state.metadata,
        volumes: this.state.metadata.volumes.map((item, key) => {
          return key === idx
            ? { ...this.state.metadata.volumes[idx], size_type: sizeType }
            : item;
        }),
      },
    });
  };
  addAnnotation = (idx: number) => {
    const updateItem = (item: IVolumeMetadata, key: number) => {
      if (key === idx) {
        return {
          ...item,
          annotations: [...item.annotations, DefaultEmptyAnnotation],
        };
      } else {
        return item;
      }
    };
    this.setState({
      volumes: this.state.volumes.map((item, key) => {
        return updateItem(item, key);
      }),
      metadata: {
        ...this.state.metadata,
        volumes: this.state.metadata.volumes.map((item, key) => {
          return updateItem(item, key);
        }),
      },
    });
  };
  deleteAnnotation = (volumeIdx: number, annotationIdx: number) => {
    const updateItem = (item: IVolumeMetadata, key: number) => {
      if (key === volumeIdx) {
        return {
          ...item,
          annotations: removeIdxFromArray(annotationIdx, item.annotations),
        };
      } else {
        return item;
      }
    };
    this.setState({
      volumes: this.state.volumes.map((item, key) => {
        return updateItem(item, key);
      }),
      metadata: {
        ...this.state.metadata,
        volumes: this.state.metadata.volumes.map((item, key) => {
          return updateItem(item, key);
        }),
      },
    });
  };
  updateVolumeAnnotation = (
    annotation: { key: string; value: string },
    volumeIdx: number,
    annotationIdx: number,
  ) => {
    const updateItem = (item: IVolumeMetadata, key: number) => {
      if (key === volumeIdx) {
        return {
          ...item,
          annotations: updateIdxInArray(
            annotation,
            annotationIdx,
            item.annotations,
          ),
        };
      } else {
        return item;
      }
    };
    this.setState({
      volumes: this.state.volumes.map((item, key) => {
        return updateItem(item, key);
      }),
      metadata: {
        ...this.state.metadata,
        volumes: this.state.metadata.volumes.map((item, key) => {
          return updateItem(item, key);
        }),
      },
    });
  };
  getNotebookMountPoints = (): { label: string; value: string }[] => {
    const mountPoints: { label: string; value: string }[] = [];
    this.state.notebookVolumes.map(item => {
      mountPoints.push({ label: item.mount_point, value: item.mount_point });
    });
    return mountPoints;
  };

  activateRunDeployState = (type: string) => {
    if (!this.state.runDeployment) {
      this.setState({ runDeployment: true, deploymentType: type });
      this.runDeploymentCommand();
    }
  };

  changeDeployDebugMessage = () =>
    this.setState({ deployDebugMessage: !this.state.deployDebugMessage });

  updateKatibRun = () =>
    this.setState({
      metadata: {
        ...this.state.metadata,
        katib_run: !this.state.metadata.katib_run,
      },
    });

  updateKatibMetadata = (metadata: IKatibMetadata) =>
    this.setState({
      metadata: {
        ...this.state.metadata,
        katib_metadata: metadata,
      },
    });

  toggleKatibDialog = async () => {
    // When opening the katib dialog, we sent and RPC to Kale to parse the
    // current notebook to retrieve the pipeline parameters. In case the
    // notebook is in an unsaved state, ask the user to save it.
    if (!this.state.katibDialog) {
      await NotebookUtils.saveNotebook(this.state.activeNotebook, true, true);
      // if the notebook is saved
      if (!this.state.activeNotebook.context.model.dirty) {
        this.setState({ katibDialog: true });
      }
    } else {
      // close
      this.setState({ katibDialog: false });
    }
  };

  // restore state to default values
  resetState = () =>
    this.setState({ ...DefaultState, isEnabled: this.state.isEnabled });

  componentDidMount = () => {
    // Notebook tracker will signal when a notebook is changed
    this.props.tracker.currentChanged.connect(this.handleNotebookChanged, this);
    // Set notebook widget if one is open
    if (this.props.tracker.currentWidget instanceof NotebookPanel) {
      this.setState({ activeNotebook: this.props.tracker.currentWidget });
      this.setNotebookPanel(this.props.tracker.currentWidget);
    }
  };

  componentDidUpdate = (
    prevProps: Readonly<IProps>,
    prevState: Readonly<IState>,
  ) => {
    // fast comparison of Metadata objects.
    // warning: this method does not work if keys change order.
    if (
      JSON.stringify(prevState.metadata) !==
        JSON.stringify(this.state.metadata) &&
      this.state.activeNotebook
    ) {
      // Write new metadata to the notebook and save
      NotebookUtils.setMetaData(
        this.state.activeNotebook,
        KALE_NOTEBOOK_METADATA_KEY,
        this.state.metadata,
        true,
      );
    }
  };

  /**
   * This handles when a notebook is switched to another notebook.
   * The parameters are automatically passed from the signal when a switch occurs.
   */
  handleNotebookChanged = async (
    tracker: INotebookTracker,
    notebook: NotebookPanel,
  ) => {
    // Set the current notebook and wait for the session to be ready
    if (notebook) {
      this.setState({ activeNotebook: notebook });
      await this.setNotebookPanel(notebook);
    } else {
      this.setState({ activeNotebook: null });
      await this.setNotebookPanel(null);
    }
  };

  handleActiveCellChanged = async (notebook: Notebook, activeCell: Cell) => {
    this.setState({
      activeCell: activeCell,
      activeCellIndex: notebook.activeCellIndex,
    });
  };

  /**
   * Read new notebook and assign its metadata to the state.
   * @param notebook active NotebookPanel
   */
  setNotebookPanel = async (notebook: NotebookPanel) => {
    // if there at least an open notebook
    if (this.props.tracker.size > 0 && notebook) {
      // wait for the session to be ready before reading metadata
      await notebook.session.ready;
      notebook.content.activeCellChanged.connect(this.handleActiveCellChanged);
      let currentCell = {
        activeCell: notebook.content.activeCell,
        activeCellIndex: notebook.content.activeCellIndex,
      };

      // get notebook metadata
      const notebookMetadata = NotebookUtils.getMetaData(
        notebook,
        KALE_NOTEBOOK_METADATA_KEY,
      );
      console.log('Kubeflow metadata:');
      console.log(notebookMetadata);

      if (this.props.backend) {
        // Detect whether this is an exploration, i.e., recovery from snapshot
        const nbFilePath = this.state.activeNotebook.context.path;
        const exploration = await _legacy_executeRpcAndShowRPCError(
          this.state.activeNotebook,
          this.props.kernel,
          'nb.explore_notebook',
          { source_notebook_path: nbFilePath },
        );
        if (exploration && exploration.is_exploration) {
          NotebookUtils.clearCellOutputs(this.state.activeNotebook);
          let runCellResponse = await NotebookUtils.runGlobalCells(
            this.state.activeNotebook,
          );
          this.setState({
            activeCellIndex: runCellResponse.index,
            activeCell: runCellResponse.cell,
          });
          if (runCellResponse.status === RUN_CELL_STATUS.OK) {
            // unmarshalData runs in the same kernel as the .ipynb, so it requires the filename
            await this.unmarshalData(nbFilePath.split('/').pop());
            const cell = CellUtils.getCellByStepName(
              this.state.activeNotebook,
              exploration.step_name,
            );
            const title = 'Notebook Exploration';
            const message = [
              `Resuming notebook at step: "${exploration.step_name}"`,
            ];
            if (cell) {
              NotebookUtils.selectAndScrollToCell(
                this.state.activeNotebook,
                cell,
              );
              currentCell = {
                activeCell: cell.cell,
                activeCellIndex: cell.index,
              };
            } else {
              message.push(`ERROR: Could not retrieve step's position.`);
            }
            await NotebookUtils.showMessage(title, message);
          } else {
            currentCell = {
              activeCell: notebook.content.widgets[runCellResponse.cellIndex],
              activeCellIndex: runCellResponse.cellIndex,
            };
            await NotebookUtils.showMessage('Notebook Exploration', [
              `Executing "${runCellResponse.cellType}" cell failed.\n` +
                `Resuming notebook at cell index ${runCellResponse.cellIndex}.`,
              `Error name: ${runCellResponse.ename}`,
              `Error value: ${runCellResponse.evalue}`,
            ]);
          }
          await _legacy_executeRpcAndShowRPCError(
            this.state.activeNotebook,
            this.props.kernel,
            'nb.remove_marshal_dir',
            {
              source_notebook_path: nbFilePath,
            },
          );
        }

        if (!this.props.rokError) {
          // Get information about volumes currently mounted on the notebook server
          await this.getMountedVolumes();
        } else {
          this.setState({
            selectVolumeTypes: this.state.selectVolumeTypes.map(t => {
              return t.value === 'clone' || t.value === 'snap'
                ? { ...t, tooltip: rokErrorTooltip(this.props.rokError) }
                : t;
            }),
          });
        }
        // Detect the base image of the current Notebook Server
        await this.getBaseImage();
        // Get experiment information last because it may take more time to respond
        await this.getExperiments();
      }

      // if the key exists in the notebook's metadata
      if (notebookMetadata) {
        let experiment: IExperiment = { id: '', name: '' };
        let experiment_name: string = '';
        if (notebookMetadata['experiment']) {
          experiment = {
            id: notebookMetadata['experiment']['id'] || '',
            name: notebookMetadata['experiment']['name'] || '',
          };
          experiment_name = notebookMetadata['experiment']['name'];
        } else if (notebookMetadata['experiment_name']) {
          const matchingExperiments = this.state.experiments.filter(
            e => e.name === notebookMetadata['experiment_name'],
          );
          if (matchingExperiments.length > 0) {
            experiment = matchingExperiments[0];
          } else {
            experiment = {
              id: NEW_EXPERIMENT.id,
              name: notebookMetadata['experiment_name'],
            };
          }
          experiment_name = notebookMetadata['experiment_name'];
        }

        let useNotebookVolumes = this.state.notebookVolumes.length > 0;
        let metadataVolumes = (notebookMetadata['volumes'] || []).filter(
          (v: IVolumeMetadata) => v.type !== 'clone',
        );
        let stateVolumes = this.props.rokError
          ? metadataVolumes
          : metadataVolumes.map((volume: IVolumeMetadata) => {
              if (
                volume.type === 'new_pvc' &&
                volume.annotations.length > 0 &&
                volume.annotations[0].key === 'rok/origin'
              ) {
                return { ...volume, type: 'snap' };
              }
              return volume;
            });
        if (stateVolumes.length === 0 && metadataVolumes.length === 0) {
          metadataVolumes = stateVolumes = this.state.notebookVolumes;
        } else {
          useNotebookVolumes = false;
          metadataVolumes = metadataVolumes.concat(this.state.notebookVolumes);
          stateVolumes = stateVolumes.concat(this.state.notebookVolumes);
        }

        let metadata: IKaleNotebookMetadata = {
          ...notebookMetadata,
          experiment: experiment,
          experiment_name: experiment_name,
          pipeline_name: notebookMetadata['pipeline_name'] || '',
          pipeline_description: notebookMetadata['pipeline_description'] || '',
          docker_image:
            notebookMetadata['docker_image'] ||
            DefaultState.metadata.docker_image,
          volumes: metadataVolumes,
          katib_run:
            notebookMetadata['katib_run'] || DefaultState.metadata.katib_run,
          katib_metadata: {
            ...DefaultKatibMetadata,
            ...(notebookMetadata['katib_metadata'] || {}),
          },
        };
        this.setState({
          volumes: stateVolumes,
          metadata: metadata,
          useNotebookVolumes: useNotebookVolumes,
          autosnapshot: !this.props.rokError && stateVolumes.length > 0,
          ...currentCell,
        });
      } else {
        this.setState({
          metadata: {
            volumes: this.state.notebookVolumes,
            ...DefaultState.metadata,
          },
          volumes: this.state.notebookVolumes,
          useNotebookVolumes:
            !this.props.rokError && this.state.notebookVolumes.length > 0,
          autosnapshot:
            !this.props.rokError && this.state.notebookVolumes.length > 0,
          ...currentCell,
        });
      }
    } else {
      this.resetState();
    }
  };

  runSnapshotProcedure = async (_deployIndex: number) => {
    const showSnapshotProgress = true;
    const snapshot = await this.snapshotNotebook();
    const taskId = snapshot.task.id;
    let task = await this.getSnapshotProgress(taskId);
    this.updateDeployProgress(_deployIndex, { task, showSnapshotProgress });

    while (!['success', 'error', 'canceled'].includes(task.status)) {
      task = await this.getSnapshotProgress(taskId, 1000);
      this.updateDeployProgress(_deployIndex, { task });
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

  updateDeployProgress = (index: number, progress: DeployProgressState) => {
    let deploy: { [index: number]: DeployProgressState };
    if (!this.state.deploys[index]) {
      deploy = { [index]: progress };
    } else {
      deploy = { [index]: { ...this.state.deploys[index], ...progress } };
    }
    this.setState({ deploys: { ...this.state.deploys, ...deploy } });
  };

  onPanelRemove = (index: number) => {
    const deploys = { ...this.state.deploys };
    deploys[index].deleted = true;
    this.setState({ deploys });
  };

  runDeploymentCommand = async () => {
    if (!this.state.activeNotebook) {
      this.setState({ runDeployment: false });
      return;
    }

    await this.state.activeNotebook.context.save();

    const _deployIndex = ++deployIndex;

    const metadata = JSON.parse(JSON.stringify(this.state.metadata)); // Deepcopy metadata

    // assign the default docker image in case it is empty
    if (metadata.docker_image === '') {
      metadata.docker_image = DefaultState.metadata.docker_image;
    }

    const nbFilePath = this.state.activeNotebook.context.path;

    // VALIDATE METADATA
    this.updateDeployProgress(_deployIndex, {
      showValidationProgress: true,
    });
    const validateNotebookArgs = {
      source_notebook_path: nbFilePath,
      notebook_metadata_overrides: metadata,
    };
    const validateNotebook = await _legacy_executeRpcAndShowRPCError(
      this.state.activeNotebook,
      this.props.kernel,
      'nb.validate_notebook',
      validateNotebookArgs,
    );
    if (!validateNotebook) {
      this.updateDeployProgress(_deployIndex, { notebookValidation: false });
      this.setState({ runDeployment: false });
      return;
    }
    this.updateDeployProgress(_deployIndex, { notebookValidation: true });

    // SNAPSHOT VOLUMES
    if (
      metadata.volumes.filter((v: IVolumeMetadata) => v.type === 'clone')
        .length > 0
    ) {
      const task = await this.runSnapshotProcedure(_deployIndex);
      console.log(task);
      if (!task) {
        this.setState({ runDeployment: false });
        return;
      }
      metadata.volumes = await this.replaceClonedVolumes(
        task.bucket,
        task.result.event.object,
        task.result.event.version,
        metadata.volumes,
      );
    }

    console.log('metadata:', metadata);

    // after parsing and validating the metadata, show warnings (if necessary)
    const compileWarnings = this.getCompileWarnings(metadata);

    // CREATE PIPELINE
    this.updateDeployProgress(_deployIndex, {
      showCompileProgress: true,
      docManager: this.props.docManager,
    });
    if (compileWarnings.length) {
      this.updateDeployProgress(_deployIndex, { compileWarnings });
    }
    const compileNotebookArgs: ICompileNotebookArgs = {
      source_notebook_path: nbFilePath,
      notebook_metadata_overrides: metadata,
      debug: this.state.deployDebugMessage,
      auto_snapshot: this.state.autosnapshot,
    };
    const compileNotebook = await _legacy_executeRpcAndShowRPCError(
      this.state.activeNotebook,
      this.props.kernel,
      'nb.compile_notebook',
      compileNotebookArgs,
    );
    if (!compileNotebook) {
      this.updateDeployProgress(_deployIndex, { compiledPath: 'error' });
      this.setState({ runDeployment: false });
      await NotebookUtils.showMessage('Operation Failed', [
        'Could not compile pipeline.',
      ]);
      return;
    }
    // Pass to the deploy progress the path to the generated py script:
    // compileNotebook is the name of the tar package, that generated in the
    // workdir. Instead, the python script has a slightly different name and is
    // generated in the same directory where the notebook lives.
    this.updateDeployProgress(_deployIndex, {
      compiledPath: compileNotebook.pipeline_package_path.replace(
        'pipeline.yaml',
        'kale.py',
      ),
    });

    // UPLOAD
    let uploadPipeline: IUploadPipelineResp = null;
    if (
      this.state.deploymentType === 'upload' ||
      this.state.deploymentType === 'run'
    ) {
      this.updateDeployProgress(_deployIndex, { showUploadProgress: true });
      const uploadPipelineArgs: IUploadPipelineArgs = {
        pipeline_package_path: compileNotebook.pipeline_package_path,
        pipeline_metadata: compileNotebook.pipeline_metadata,
        overwrite: false,
      };
      uploadPipeline = await _legacy_executeRpcAndShowRPCError(
        this.state.activeNotebook,
        this.props.kernel,
        'kfp.upload_pipeline',
        uploadPipelineArgs,
      );
      let result = true;
      if (!uploadPipeline) {
        this.setState({ runDeployment: false });
        this.updateDeployProgress(_deployIndex, {
          showUploadProgress: false,
          pipeline: false,
        });
        return;
      }
      if (uploadPipeline && uploadPipeline.already_exists) {
        // show dialog to ask user if they want to overwrite the existing pipeline
        result = await NotebookUtils.showYesNoDialog('Pipeline Upload Failed', [
          'Pipeline with name ' +
            compileNotebook.pipeline_metadata.pipeline_name +
            ' already exists. ',
          'Would you like to overwrite it?',
        ]);
        // OVERWRITE EXISTING PIPELINE
        if (result) {
          uploadPipelineArgs.overwrite = true;
          uploadPipeline = await _legacy_executeRpcAndShowRPCError(
            this.state.activeNotebook,
            this.props.kernel,
            'kfp.upload_pipeline',
            uploadPipelineArgs,
          );
        } else {
          this.updateDeployProgress(_deployIndex, { pipeline: false });
        }
      }
      if (uploadPipeline && result) {
        this.updateDeployProgress(_deployIndex, { pipeline: uploadPipeline });
      }
    }

    if (!uploadPipeline) {
      this.setState({ runDeployment: false });
      this.updateDeployProgress(_deployIndex, { pipeline: false });
      console.error(
        '`uploadPipeline` is null even if it should have a valid ' +
          'pipeline name and id.',
      );
      return;
    }

    // RUN
    if (this.state.deploymentType === 'run') {
      if (metadata.katib_run) {
        this.updateDeployProgress(_deployIndex, {
          showKatibKFPExperiment: true,
        });
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
            this.state.activeNotebook,
            this.props.kernel,
            'kfp.create_experiment',
            {
              experiment_name: newExpName,
            },
          );
          this.updateDeployProgress(_deployIndex, {
            katibKFPExperiment: kfpExperiment,
          });
        } catch (error) {
          // stop deploy button icon spin
          this.setState({ runDeployment: false });
          this.updateDeployProgress(_deployIndex, {
            showKatibProgress: false,
            katibKFPExperiment: { id: 'error', name: 'error' },
          });
          throw error;
        }

        this.updateDeployProgress(_deployIndex, { showKatibProgress: true });
        const runKatibArgs: IKatibRunArgs = {
          pipeline_id: uploadPipeline.pipeline.id,
          pipeline_metadata: {
            ...metadata,
            experiment_name: kfpExperiment.name,
          },
          output_path: nbFilePath.substring(0, nbFilePath.lastIndexOf('/')),
        };
        let katibExperiment: IKatibExperiment = null;
        try {
          katibExperiment = await _legacy_executeRpc(
            this.state.activeNotebook,
            this.props.kernel,
            'katib.create_katib_experiment',
            runKatibArgs,
          );
        } catch (error) {
          // stop deploy button icon spin
          this.setState({ runDeployment: false });
          this.updateDeployProgress(_deployIndex, {
            katib: { status: 'error' },
          });
          throw error;
        }
        this.pollKatib(_deployIndex, katibExperiment);
      } else {
        this.updateDeployProgress(_deployIndex, { showRunProgress: true });
        const runPipelineArgs: IRunPipelineArgs = {
          pipeline_metadata: compileNotebook.pipeline_metadata,
          pipeline_id: uploadPipeline.pipeline.id,
        };
        const runPipeline = await _legacy_executeRpcAndShowRPCError(
          this.state.activeNotebook,
          this.props.kernel,
          'kfp.run_pipeline',
          runPipelineArgs,
        );
        if (runPipeline) {
          this.updateDeployProgress(_deployIndex, { runPipeline });
          this.pollRun(_deployIndex, runPipeline);
        } else {
          this.updateDeployProgress(_deployIndex, {
            showRunProgress: false,
            runPipeline: false,
          });
        }
      }
    }
    // stop deploy button icon spin
    this.setState({ runDeployment: false });
  };

  pollRun(_deployIndex: number, runPipeline: any) {
    _legacy_executeRpcAndShowRPCError(
      this.state.activeNotebook,
      this.props.kernel,
      'kfp.get_run',
      {
        run_id: runPipeline.id,
      },
    ).then(run => {
      this.updateDeployProgress(_deployIndex, { runPipeline: run });
      if (run && (run.status === 'Running' || run.status === null)) {
        setTimeout(() => this.pollRun(_deployIndex, run), 2000);
      }
    });
  }

  pollKatib(_deployIndex: number, katibExperiment: IKatibExperiment) {
    const getExperimentArgs: any = {
      experiment: katibExperiment.name,
      namespace: katibExperiment.namespace,
    };
    _legacy_executeRpcAndShowRPCError(
      this.state.activeNotebook,
      this.props.kernel,
      'katib.get_experiment',
      getExperimentArgs,
    ).then(katib => {
      if (!katib) {
        // could not get the experiment
        this.updateDeployProgress(_deployIndex, { katib: { status: 'error' } });
        return;
      }
      this.updateDeployProgress(_deployIndex, { katib });
      if (katib && katib.status !== 'Succeeded' && katib.status !== 'Failed') {
        setTimeout(() => this.pollKatib(_deployIndex, katibExperiment), 5000);
      }
    });
  }

  getExperiments = async () => {
    this.setState({ gettingExperiments: true });
    let list_experiments: IExperiment[] = await _legacy_executeRpcAndShowRPCError(
      this.state.activeNotebook,
      this.props.kernel,
      'kfp.list_experiments',
    );
    if (list_experiments) {
      list_experiments.push(NEW_EXPERIMENT);
    } else {
      list_experiments = [NEW_EXPERIMENT];
    }

    // Fix experiment metadata
    let experiment: IExperiment = null;
    let selectedExperiments: IExperiment[] = list_experiments.filter(
      e =>
        e.id === this.state.metadata.experiment.id ||
        e.name === this.state.metadata.experiment.name ||
        e.name === this.state.metadata.experiment_name,
    );
    if (
      selectedExperiments.length === 0 ||
      selectedExperiments[0].id === NEW_EXPERIMENT.id
    ) {
      let name = list_experiments[0].name;
      if (name === NEW_EXPERIMENT.name) {
        name =
          this.state.metadata.experiment.name !== ''
            ? this.state.metadata.experiment.name
            : this.state.metadata.experiment_name;
      }
      experiment = { ...list_experiments[0], name: name };
    } else {
      experiment = selectedExperiments[0];
    }

    this.setState({
      experiments: list_experiments,
      gettingExperiments: false,
      metadata: {
        ...this.state.metadata,
        experiment: experiment,
        experiment_name: experiment.name,
      },
    });
  };

  getMountedVolumes = async () => {
    let notebookVolumes: IVolumeMetadata[] = await _legacy_executeRpcAndShowRPCError(
      this.state.activeNotebook,
      this.props.kernel,
      'nb.list_volumes',
    );
    let availableVolumeTypes = selectVolumeTypes.map(t => {
      return t.value === 'snap' ? { ...t, invalid: false } : t;
    });

    if (notebookVolumes) {
      notebookVolumes = notebookVolumes.map(volume => {
        const sizeGroup = selectVolumeSizeTypes.filter(
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
      notebookVolumes = this.state.notebookVolumes;
    }
    this.setState({
      notebookVolumes: notebookVolumes,
      selectVolumeTypes: availableVolumeTypes,
    });
  };

  getBaseImage = async () => {
    let baseImage: string = null;
    try {
      baseImage = await _legacy_executeRpc(
        this.state.activeNotebook,
        this.props.kernel,
        'nb.get_base_image',
      );
    } catch (error) {
      if (error instanceof RPCError) {
        console.warn('Kale is not running in a Notebook Server', error.error);
      } else {
        throw error;
      }
    }
    if (baseImage) {
      DefaultState.metadata.docker_image = baseImage;
    } else {
      DefaultState.metadata.docker_image = '';
    }
  };

  snapshotNotebook = async () => {
    return await _legacy_executeRpcAndShowRPCError(
      this.state.activeNotebook,
      this.props.kernel,
      'rok.snapshot_notebook',
    );
  };

  getSnapshotProgress = async (task_id: string, ms?: number) => {
    const task = await _legacy_executeRpcAndShowRPCError(
      this.state.activeNotebook,
      this.props.kernel,
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

  replaceClonedVolumes = async (
    bucket: string,
    obj: string,
    version: string,
    volumes: IVolumeMetadata[],
  ) => {
    return await _legacy_executeRpcAndShowRPCError(
      this.state.activeNotebook,
      this.props.kernel,
      'rok.replace_cloned_volumes',
      {
        bucket,
        obj,
        version,
        volumes,
      },
    );
  };

  unmarshalData = async (nbFileName: string) => {
    const cmd: string =
      `from kale.rpc.nb import unmarshal_data as __kale_rpc_unmarshal_data\n` +
      `locals().update(__kale_rpc_unmarshal_data("${nbFileName}"))`;
    console.log('Executing command: ' + cmd);
    await NotebookUtils.sendKernelRequestFromNotebook(
      this.state.activeNotebook,
      cmd,
      {},
    );
  };

  onMetadataEnable = (isEnabled: boolean) => {
    this.setState({ isEnabled });
    // When drawing cell metadata on Kale enable/disable, the targetted
    // cell may be lost. Therefore, we select and scroll to the active
    // cell.
    if (
      this.state.activeNotebook &&
      this.state.activeCell &&
      this.state.activeCellIndex
    ) {
      setTimeout(
        NotebookUtils.selectAndScrollToCell,
        200,
        this.state.activeNotebook,
        {
          cell: this.state.activeCell,
          index: this.state.activeCellIndex,
        },
      );
    }
  };

  render() {
    // FIXME: What about human-created Notebooks? Match name and old API as well
    const selectedExperiments: IExperiment[] = this.state.experiments.filter(
      e =>
        e.id === this.state.metadata.experiment.id ||
        e.name === this.state.metadata.experiment.name ||
        e.name === this.state.metadata.experiment_name,
    );
    if (this.state.experiments.length > 0 && selectedExperiments.length === 0) {
      selectedExperiments.push(this.state.experiments[0]);
    }
    let experimentInputSelected = '';
    let experimentInputValue = '';
    if (selectedExperiments.length > 0) {
      experimentInputSelected = selectedExperiments[0].id;
      if (selectedExperiments[0].id === NEW_EXPERIMENT.id) {
        if (this.state.metadata.experiment.name !== '') {
          experimentInputValue = this.state.metadata.experiment.name;
        } else {
          experimentInputValue = this.state.metadata.experiment_name;
        }
      } else {
        experimentInputValue = selectedExperiments[0].name;
      }
    }
    const experiment_name_input = (
      <ExperimentInput
        updateValue={this.updateExperiment}
        options={this.state.experiments}
        selected={experimentInputSelected}
        value={experimentInputValue}
        loading={this.state.gettingExperiments}
      />
    );

    const pipeline_name_input = (
      <Input
        variant="standard"
        label={'Pipeline Name'}
        updateValue={this.updatePipelineName}
        value={this.state.metadata.pipeline_name}
        regex={'^[a-z0-9]([-a-z0-9]*[a-z0-9])?$'}
        regexErrorMsg={
          "Pipeline name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character."
        }
      />
    );

    const pipeline_desc_input = (
      <Input
        variant="standard"
        label={'Pipeline Description'}
        updateValue={this.updatePipelineDescription}
        value={this.state.metadata.pipeline_description}
      />
    );

    const katib_run_input = (
      <div className="input-container">
        <LightTooltip
          title={'Enable this option to run HyperParameter Tuning with Katib'}
          placement="top-start"
          interactive={true}
          TransitionComponent={Zoom}
        >
          <div className="toolbar">
            <div className="switch-label">HP Tuning with Katib</div>
            <Switch
              checked={this.state.metadata.katib_run}
              onChange={_ => this.updateKatibRun()}
              color="primary"
              name="enableKatib"
              className="material-switch"
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />
          </div>
        </LightTooltip>
      </div>
    );

    const volsPanel = (
      <VolumesPanel
        volumes={this.state.volumes}
        addVolume={this.addVolume}
        updateVolumeType={this.updateVolumeType}
        updateVolumeName={this.updateVolumeName}
        updateVolumeMountPoint={this.updateVolumeMountPoint}
        updateVolumeSnapshot={this.updateVolumeSnapshot}
        updateVolumeSnapshotName={this.updateVolumeSnapshotName}
        updateVolumeSize={this.updateVolumeSize}
        updateVolumeSizeType={this.updateVolumeSizeType}
        deleteVolume={this.deleteVolume}
        updateVolumeAnnotation={this.updateVolumeAnnotation}
        addAnnotation={this.addAnnotation}
        deleteAnnotation={this.deleteAnnotation}
        notebookMountPoints={this.getNotebookMountPoints()}
        selectVolumeSizeTypes={selectVolumeSizeTypes}
        selectVolumeTypes={this.state.selectVolumeTypes}
        useNotebookVolumes={this.state.useNotebookVolumes}
        updateVolumesSwitch={this.updateVolumesSwitch}
        autosnapshot={this.state.autosnapshot}
        updateAutosnapshotSwitch={this.updateAutosnapshotSwitch}
        rokError={this.props.rokError}
      />
    );

    return (
      <ThemeProvider theme={theme}>
        <div className={'kubeflow-widget'} key="kale-widget">
          <div className={'kubeflow-widget-content'}>
            <div>
              <p
                style={{
                  fontSize: 'var(--jp-ui-font-size3)',
                  color: theme.kale.headers.main,
                }}
                className="kale-header"
              >
                Kale Deployment Panel {this.state.isEnabled}
              </p>
            </div>

            <div className="kale-component">
              <InlineCellsMetadata
                onMetadataEnable={this.onMetadataEnable}
                notebook={this.state.activeNotebook}
                activeCellIndex={this.state.activeCellIndex}
              />
            </div>

            <div
              className={
                'kale-component ' + (this.state.isEnabled ? '' : 'hidden')
              }
            >
              <div>
                <p
                  className="kale-header"
                  style={{ color: theme.kale.headers.main }}
                >
                  Pipeline Metadata
                </p>
              </div>

              <div className={'input-container'}>
                {experiment_name_input}
                {pipeline_name_input}
                {pipeline_desc_input}
              </div>
            </div>

            <div
              className={
                'kale-component ' + (this.state.isEnabled ? '' : 'hidden')
              }
            >
              <div>
                <p
                  className="kale-header"
                  style={{ color: theme.kale.headers.main }}
                >
                  Run
                </p>
              </div>
              {katib_run_input}
              <div className="input-container add-button">
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  title="SetupKatibJob"
                  onClick={this.toggleKatibDialog}
                  disabled={!this.state.metadata.katib_run}
                  style={{ marginLeft: '10px', marginTop: '0px' }}
                >
                  Set Up Katib Job
                </Button>
              </div>
            </div>

            <div className={this.state.isEnabled ? '' : 'hidden'}>
              <div className="kale-component" key="kale-component-volumes">
                <div className="kale-header-switch">
                  <p
                    className="kale-header"
                    style={{ color: theme.kale.headers.main }}
                  >
                    Volumes
                  </p>
                </div>
                {volsPanel}
              </div>
            </div>

            <div
              className={
                'kale-component ' + (this.state.isEnabled ? '' : 'hidden')
              }
            >
              <AdvancedSettings
                title={'Advanced Settings'}
                dockerImageValue={this.state.metadata.docker_image}
                dockerImageDefaultValue={DefaultState.metadata.docker_image}
                dockerChange={this.updateDockerImage}
                debug={this.state.deployDebugMessage}
                changeDebug={this.changeDeployDebugMessage}
              />
            </div>
          </div>
          <div
            className={this.state.isEnabled ? '' : 'hidden'}
            style={{ marginTop: 'auto' }}
          >
            <DeploysProgress
              deploys={this.state.deploys}
              onPanelRemove={this.onPanelRemove}
            />
            <SplitDeployButton
              running={this.state.runDeployment}
              handleClick={this.activateRunDeployState}
              katibRun={this.state.metadata.katib_run}
            />
          </div>

          <KatibDialog
            open={this.state.katibDialog}
            toggleDialog={this.toggleKatibDialog}
            katibMetadata={
              this.state.metadata.katib_metadata || DefaultKatibMetadata
            }
            updateKatibMetadata={this.updateKatibMetadata}
            activeNotebook={this.state.activeNotebook}
            kernel={this.props.kernel}
          />
        </div>
      </ThemeProvider>
    );
  }
}
