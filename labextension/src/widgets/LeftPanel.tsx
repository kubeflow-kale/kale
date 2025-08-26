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
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import NotebookUtils from '../lib/NotebookUtils';
import { IRPCError, rokErrorTooltip } from '../lib/RPCUtils';
// import { AdvancedSettings } from '../components/AdvancedSettings';
import { InlineCellsMetadata } from './cell-metadata/InlineCellMetadata';
// import { SELECT_VOLUME_TYPES, VolumesPanel } from './VolumesPanel';
import { SplitDeployButton } from '../components/DeployButton';
import { Kernel } from '@jupyterlab/services';
import { ExperimentInput } from '../components/ExperimentInput';
import {
  DeployProgressState,
  DeploysProgress
} from './deploys-progress/DeploysProgress';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../Theme';
import { Button, Switch, Zoom } from '@mui/material';
// import { KatibDialog } from './KatibDialog';
import { Input } from '../components/Input';
import { LightTooltip } from '../components/LightTooltip';
import Commands from '../lib/Commands';
import { IAnnotation } from '../components/AnnotationInput';
import { ISelectOption } from '../components/Select';
import { PageConfig } from '@jupyterlab/coreutils';

const KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook';

export interface IExperiment {
  id: string;
  name: string;
}

export const NEW_EXPERIMENT: IExperiment = {
  name: '+ New Experiment',
  id: 'new'
};

interface IProps {
  lab: JupyterFrontEnd;
  tracker: INotebookTracker;
  docManager: IDocumentManager;
  backend: boolean;
  kernel: Kernel.IKernelConnection;
}

interface IState {
  metadata: IKaleNotebookMetadata;
  runDeployment: boolean;
  deploymentType: string;
  deployDebugMessage: boolean;
  experiments: IExperiment[];
  gettingExperiments: boolean;
  // notebookVolumes?: IVolumeMetadata[];
  // volumes?: IVolumeMetadata[];
  // selectVolumeTypes: ISelectOption[];
  deploys: { [index: number]: DeployProgressState };
  isEnabled: boolean;
  // katibDialog: boolean;
  namespace: string;
}

// Katib types
// v1alpha3: https://github.com/kubeflow/katib/blob/v0.9.0/pkg/apis/controller/experiments/v1alpha3/experiment_types.go
// v1beta1: https://github.com/kubeflow/katib/blob/v0.10.0/pkg/apis/controller/experiments/v1beta1/experiment_types.go
// export interface IKatibParameter {
//   name: string;
//   parameterType: 'unknown' | 'double' | 'int' | 'categorical' | 'discrete';
//   feasibleSpace: { min?: string; max?: string; list?: string[]; step?: string };
// }

// interface IKatibObjective {
//   goal?: number;
//   type: 'minimize' | 'maximize';
//   objectiveMetricName: string;
//   additionalMetricNames?: string[];
// }

// interface IKatibAlgorithm {
//   algorithmName:
//     | 'random'
//     | 'grid'
//     | 'bayesianoptimization'
//     | 'hyperband'
//     | 'tpe';
//   algorithmSettings?: { name: string; value: string }[];
//   earlyStopping?: {
//     earlyStoppingAlgorithmName: { name: string; value: string }[];
//   };
// }

// export interface IKatibMetadata {
//   parameters: IKatibParameter[];
//   objective: IKatibObjective;
//   algorithm: IKatibAlgorithm;
//   maxTrialCount: number;
//   maxFailedTrialCount: number;
//   parallelTrialCount: number;
// }

// const DefaultKatibMetadata: IKatibMetadata = {
//   parameters: [],
//   objective: {
//     type: 'minimize',
//     objectiveMetricName: '',
//   },
//   algorithm: {
//     algorithmName: 'grid',
//   },
//   maxTrialCount: 12,
//   maxFailedTrialCount: 3,
//   parallelTrialCount: 3,
// };

// export interface IVolumeMetadata {
//   type: string;
//   // name field will have different meaning based on the type:
//   //  - pv: name of the PV
//   //  - pvc: name of the pvc
//   //  - new_pvc: new pvc with dynamic provisioning
//   //  - clone: clone a volume which is currently mounted to the Notebook Server
//   //  - snap: new_pvc from Rok Snapshot
//   name: string;
//   mount_point: string;
//   size?: number;
//   size_type?: string;
//   annotations: IAnnotation[];
//   snapshot: boolean;
//   snapshot_name?: string;
// }

// keep names with Python notation because they will be read
// in python by Kale.
export interface IKaleNotebookMetadata {
  experiment: IExperiment;
  experiment_name: string; // Keep this for backwards compatibility
  pipeline_name: string;
  pipeline_description: string;
  docker_image: string;
  // volumes: IVolumeMetadata[];
  // snapshot_volumes: boolean;
  // autosnapshot: boolean;
  // katib_run: boolean;
  // katib_metadata?: IKatibMetadata;
  steps_defaults?: string[];
  storage_class_name?: string;
  // volume_access_mode?: string;
}

// export interface IKatibExperiment {
//   apiVersion: string;
//   name?: string;
//   namespace?: string;
//   status: string;
//   reason: string;
//   message: string;
//   trials?: number;
//   trialsFailed?: number;
//   trialsRunning?: number;
//   trialsSucceeded?: number;
//   maxTrialCount?: number;
//   currentOptimalTrial?: {
//     bestTrialName: string;
//     parameterAssignments: { name: string; value: string }[];
//     observation: {
//       metrics: {
//         name: string;
//         value?: number; // v1alpha3
//         latest?: string; //v1beta1
//         max?: string; //v1beta1
//         min?: string; //v1beta1
//       }[];
//     };
//   };
// }

export const DefaultState: IState = {
  metadata: {
    experiment: { id: '', name: '' },
    experiment_name: '',
    pipeline_name: '',
    pipeline_description: '',
    docker_image: '',
    // volumes: [],
    // snapshot_volumes: false,
    // autosnapshot: false,
    // katib_run: false,
    steps_defaults: []
    // volume_access_mode: 'rwm',
  },
  runDeployment: false,
  deploymentType: 'compile',
  deployDebugMessage: false,
  experiments: [],
  gettingExperiments: false,
  // notebookVolumes: [],
  // volumes: [],
  // selectVolumeTypes: SELECT_VOLUME_TYPES,
  deploys: {},
  isEnabled: false,
  // katibDialog: false,
  namespace: ''
};

let deployIndex = 0;

export class KubeflowKaleLeftPanel extends React.Component<IProps, IState> {
  // init state default values
  state = DefaultState;

  getActiveNotebook = (): NotebookPanel | null => {
    return this.props.tracker.currentWidget;
  };

  getActiveNotebookPath = () => {
    return (
      this.getActiveNotebook() &&
      // absolute path to the notebook's root (--notebook-dir option, if set)
      PageConfig.getOption('serverRoot') +
        '/' +
        // relative path wrt to 'serverRoot'
        this.getActiveNotebook()?.context.path
    );
  };

  // update metadata state values: use destructure operator to update nested dict
  updateExperiment = (experiment: IExperiment) =>
    this.setState((prevState, props) => ({
      metadata: {
        ...prevState.metadata,
        experiment: experiment,
        experiment_name: experiment.name
      }
    }));
  updatePipelineName = (name: string) =>
    this.setState((prevState, props) => ({
      metadata: { ...prevState.metadata, pipeline_name: name }
    }));
  updatePipelineDescription = (desc: string) =>
    this.setState((prevState, props) => ({
      metadata: { ...prevState.metadata, pipeline_description: desc }
    }));
  updateDockerImage = (name: string) =>
    this.setState((prevState, props) => ({
      metadata: {
        ...prevState.metadata,
        docker_image: name
      }
    }));
  // updateVolumesSwitch = () => {
  //   this.setState((prevState, props) => ({
  //     volumes: prevState.notebookVolumes,
  //     metadata: {
  //       ...prevState.metadata,
  //       volumes: prevState.notebookVolumes,
  //       snapshot_volumes: !prevState.metadata.snapshot_volumes,
  //       storage_class_name: undefined,
  //       volume_access_mode: undefined,
  //     },
  //   }));
  // };
  // updateAutosnapshotSwitch = (autosnapshot?: boolean) =>
  //   this.setState((prevState, props) => ({
  //     metadata: {
  //       ...prevState.metadata,
  //       autosnapshot:
  //         autosnapshot === undefined
  //           ? !prevState.metadata.autosnapshot
  //           : autosnapshot,
  //     },
  //   }));

  // getNotebookMountPoints = (): { label: string; value: string }[] => {
  //   const mountPoints: { label: string; value: string }[] = [];
  //   this.state.notebookVolumes?.map(item => {   // check is optional using ?
  //     mountPoints.push({ label: item.mount_point, value: item.mount_point });
  //   });
  //   return mountPoints;
  // };

  activateRunDeployState = (type: string) => {
    if (!this.state.runDeployment) {
      this.setState({ runDeployment: true, deploymentType: type });
      this.runDeploymentCommand();
    }
  };

  changeDeployDebugMessage = () =>
    this.setState((prevState, props) => ({
      deployDebugMessage: !prevState.deployDebugMessage
    }));

  // updateStorageClassName = (storage_class_name: string) =>
  //   this.setState((prevState, props) => ({
  //     metadata: { ...prevState.metadata, storage_class_name },
  //   }));

  // updateVolumeAccessMode = (volume_access_mode: string) => {
  //   this.setState((prevState, props) => ({
  //     metadata: { ...prevState.metadata, volume_access_mode },
  //   }));
  // };

  // updateKatibRun = () =>
  //   this.setState((prevState, props) => ({
  //     metadata: {
  //       ...prevState.metadata,
  //       katib_run: !prevState.metadata.katib_run,
  //     },
  //   }));

  // updateKatibMetadata = (metadata: IKatibMetadata) =>
  //   this.setState((prevState, props) => ({
  //     metadata: {
  //       ...prevState.metadata,
  //       katib_metadata: metadata,
  //     },
  //   }));

  // updateVolumes = (
  //   volumes: IVolumeMetadata[],
  //   metadataVolumes: IVolumeMetadata[],
  // ) => {
  //   this.setState((prevState, props) => ({
  //     volumes,
  //     metadata: { ...prevState.metadata, volumes: metadataVolumes },
  //   }));
  // };

  // toggleKatibDialog = async () => {
  //   // When opening the katib dialog, we sent and RPC to Kale to parse the
  //   // current notebook to retrieve the pipeline parameters. In case the
  //   // notebook is in an unsaved state, ask the user to save it.
  //   if (!this.state.katibDialog) {
  //     await NotebookUtils.saveNotebook(this.getActiveNotebook(), true, true);
  //     // if the notebook is saved
  //     if (!this.getActiveNotebook().context.model.dirty) {
  //       this.setState({ katibDialog: true });
  //     }
  //   } else {
  //     // close
  //     this.setState({ katibDialog: false });
  //   }
  // };

  // restore state to default values
  resetState = () =>
    this.setState((prevState, props) => ({
      ...DefaultState,
      isEnabled: prevState.isEnabled
    }));

  componentDidMount = () => {
    // Notebook tracker will signal when a notebook is changed
    this.props.tracker.currentChanged.connect(this.handleNotebookChanged, this);
    // Set notebook widget if one is open
    if (this.props.tracker.currentWidget instanceof NotebookPanel) {
      this.setNotebookPanel(this.props.tracker.currentWidget);
    }
  };

  componentDidUpdate = (
    prevProps: Readonly<IProps>,
    prevState: Readonly<IState>
  ) => {
    // fast comparison of Metadata objects.
    // warning: this method does not work if keys change order.
    if (
      JSON.stringify(prevState.metadata) !==
        JSON.stringify(this.state.metadata) &&
      this.getActiveNotebook()
    ) {
      const activeNotebook = this.getActiveNotebook();
      if (activeNotebook) {
        // Write new metadata to the notebook and save
        NotebookUtils.setMetaData(
          activeNotebook,
          KALE_NOTEBOOK_METADATA_KEY,
          this.state.metadata,
          true
        );
      }
    }
  };

  /**
   * This handles when a notebook is switched to another notebook.
   * The parameters are automatically passed from the signal when a switch occurs.
   */
  handleNotebookChanged = async (
    tracker: INotebookTracker,
    notebook: NotebookPanel | null
  ) => {
    // Set the current notebook and wait for the session to be ready
    if (notebook) {
      await this.setNotebookPanel(notebook);
    } else {
      // Handle null case - reset to default state
      this.resetState();
    }
  };

  /**
   * Read new notebook and assign its metadata to the state.
   * @param notebook active NotebookPanel
   */
  setNotebookPanel = async (notebook: NotebookPanel | null) => {
    // if there at least an open notebook
    if (this.props.tracker.size > 0 && notebook) {
      const commands = new Commands(notebook, this.props.kernel);
      // wait for the session to be ready before reading metadata
      await notebook.sessionContext.ready;

      // get notebook metadata
      const notebookMetadata = NotebookUtils.getMetaData(
        notebook,
        KALE_NOTEBOOK_METADATA_KEY
      );

      if (this.props.backend) {
        // Retrieve the notebook's namespace
        this.setState({ namespace: await commands.getNamespace() });
        // Detect whether this is an exploration, i.e., recovery from snapshot
        const nbFilePath = this.getActiveNotebookPath();
        if (nbFilePath) {
          await commands.resumeStateIfExploreNotebook(nbFilePath);
        }
        // if (!this.props.rokError) {
        //   // Get information about volumes currently mounted on the notebook server
        //   const {
        //     notebookVolumes,
        //     selectVolumeTypes,
        //   } = await commands.getMountedVolumes(this.state.notebookVolumes);
        //   this.setState({
        //     notebookVolumes,
        //     selectVolumeTypes,
        //   });
        // } else {
        //   this.setState((prevState, props) => ({
        //     selectVolumeTypes: prevState.selectVolumeTypes.map(t => {
        //       return t.value === 'clone' || t.value === 'snap'
        //         ? { ...t, tooltip: rokErrorTooltip(this.props.rokError) }
        //         : t;
        //     }),
        //   }));
        // }
        // Detect the base image of the current Notebook Server
        const baseImage = await commands.getBaseImage();
        if (baseImage) {
          DefaultState.metadata.docker_image = baseImage;
        } else {
          DefaultState.metadata.docker_image = '';
        }

        // Detect poddefault labels applied on server and add them as steps defaults
        // fixme: This RPC could be called just when starting the widget
        //        and not every time we set a new notebook
        // const podDefaultLabels = await commands.findPodDefaultLabelsOnServer();
        // Object.keys(podDefaultLabels)
        //   .map(key => `label:${key}:${podDefaultLabels[key]}`)
        //   .forEach(label => {
        //     if (!DefaultState.metadata.steps_defaults?.includes(label)) {
        //       DefaultState.metadata.steps_defaults?.push(label);
        //     }
        //   });

        // Get experiment information last because it may take more time to respond
        this.setState({ gettingExperiments: true });
        const { experiments, experiment, experiment_name } =
          await commands.getExperiments(
            this.state.metadata.experiment,
            this.state.metadata.experiment_name
          );
        this.setState((prevState, props) => ({
          experiments,
          gettingExperiments: false,
          metadata: {
            ...prevState.metadata,
            experiment,
            experiment_name
          }
        }));
      }

      // ********Commenting to just make the build run**********
      // if the key exists in the notebook's metadata
      if (notebookMetadata) {
        let experiment: IExperiment = { id: '', name: '' };
        let experiment_name: string = '';
        if (notebookMetadata['experiment']) {
          experiment = {
            id: notebookMetadata['experiment']['id'] || '',
            name: notebookMetadata['experiment']['name'] || ''
          };
          experiment_name = notebookMetadata['experiment']['name'];
        } else if (notebookMetadata['experiment_name']) {
          const matchingExperiments = this.state.experiments.filter(
            e => e.name === notebookMetadata['experiment_name']
          );
          if (matchingExperiments.length > 0) {
            experiment = matchingExperiments[0];
          } else {
            experiment = {
              id: NEW_EXPERIMENT.id,
              name: notebookMetadata['experiment_name']
            };
          }
          experiment_name = notebookMetadata['experiment_name'];
        } else {
          this.resetState();
        }

        //     let metadataVolumes = (notebookMetadata['volumes'] || []).filter(
        //       (v: IVolumeMetadata) => v.type !== 'clone',
        //     );
        //     let stateVolumes = this.props.rokError
        //       ? metadataVolumes
        //       : metadataVolumes.map((volume: IVolumeMetadata) => {
        //           if (
        //             volume.type === 'new_pvc' &&
        //             volume.annotations.length > 0 &&
        //             volume.annotations[0].key === 'rok/origin'
        //           ) {
        //             return { ...volume, type: 'snap' };
        //           }
        //           return volume;
        //         });
        //     if (stateVolumes.length === 0 && metadataVolumes.length === 0) {
        //       metadataVolumes = stateVolumes = this.state.notebookVolumes;
        //     } else {
        //       metadataVolumes = metadataVolumes.concat(this.state.notebookVolumes);
        //       stateVolumes = stateVolumes.concat(this.state.notebookVolumes);
        //     }

        let metadata: IKaleNotebookMetadata = {
          ...notebookMetadata,
          experiment: experiment,
          experiment_name: experiment_name,
          pipeline_name: notebookMetadata['pipeline_name'] || '',
          pipeline_description: notebookMetadata['pipeline_description'] || '',
          docker_image:
            notebookMetadata['docker_image'] ||
            DefaultState.metadata.docker_image,
          steps_defaults: DefaultState.metadata.steps_defaults
        };
        this.setState({
          metadata: metadata
        });
      } else {
        this.setState((prevState, props) => ({
          metadata: {
            ...DefaultState.metadata
          }
        }));
      }
    } else {
      this.resetState();
    }
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
    const activeNotebook = this.getActiveNotebook();
    if (!activeNotebook) {
      this.setState({ runDeployment: false });
      return;
    }

    await activeNotebook.context.save();

    const commands = new Commands(activeNotebook, this.props.kernel);
    const _deployIndex = ++deployIndex;
    const _updateDeployProgress = (x: DeployProgressState) => {
      this.updateDeployProgress(_deployIndex, {
        ...x,
        namespace: this.state.namespace
      });
    };

    const metadata = JSON.parse(JSON.stringify(this.state.metadata)); // Deepcopy metadata

    // assign the default docker image in case it is empty
    if (metadata.docker_image === '') {
      metadata.docker_image = DefaultState.metadata.docker_image;
    }

    const nbFilePath = this.getActiveNotebookPath();

    if (!nbFilePath) {
      // Handle the error, show a message, or return early
      const extendedProgress: DeployProgressState = {
        message: 'No active notebook path found.'
      };
      _updateDeployProgress(extendedProgress);
      this.setState({ runDeployment: false });
      return;
    }

    // VALIDATE METADATA
    const validationSucceeded = await commands.validateMetadata(
      nbFilePath,
      metadata,
      _updateDeployProgress
    );
    if (!validationSucceeded) {
      this.setState({ runDeployment: false });
      return;
    }
    _updateDeployProgress({
      message: 'Validation completed successfully'
    });
    // SNAPSHOT VOLUMES
    // if (
    //   metadata.volumes.filter((v: IVolumeMetadata) => v.type === 'clone')
    //     .length > 0
    // ) {
    //   const task = await commands.runSnapshotProcedure(_updateDeployProgress);
    //   console.log(task);
    //   if (!task) {
    //     this.setState({ runDeployment: false });
    //     return;
    //   }
    //   metadata.volumes = await commands.replaceClonedVolumes(
    //     task.bucket,
    //     task.result.event.object,
    //     task.result.event.version,
    //     metadata.volumes,
    //   );
    // }

    // CREATE PIPELINE
    const compileNotebook = await commands.compilePipeline(
      nbFilePath,
      metadata,
      this.props.docManager,
      this.state.deployDebugMessage,
      _updateDeployProgress
    );
    if (!compileNotebook) {
      this.setState({ runDeployment: false });
      return;
    }
    _updateDeployProgress({
      message: 'Notebook compiled successfully'
    });

    // UPLOAD
    const uploadPipeline =
      this.state.deploymentType === 'upload' ||
      this.state.deploymentType === 'run'
        ? await commands.uploadPipeline(
            compileNotebook.pipeline_package_path,
            compileNotebook.pipeline_metadata,
            _updateDeployProgress
          )
        : null;

    if (!uploadPipeline) {
      this.setState({ runDeployment: false });
      _updateDeployProgress({ pipeline: false });
      return;
    }
    _updateDeployProgress({
      message: 'Pipeline uploaded successfully',
      pipeline: true
    });
    // RUN
    if (this.state.deploymentType === 'run') {
      // if (metadata.katib_run) {
      //   try {
      //     const katibExperiment = await commands.runKatib(
      //       nbFilePath,
      //       metadata,
      //       uploadPipeline.pipeline.pipelineid,
      //       uploadPipeline.pipeline.versionid,
      //       _updateDeployProgress,
      //     );
      //     commands.pollKatib(katibExperiment, _updateDeployProgress);
      //   } catch (error) {
      //     this.setState({ runDeployment: false });
      //     throw error;
      //   }
      // } else {
      const runPipeline = await commands.runPipeline(
        uploadPipeline.pipeline.pipelineid,
        uploadPipeline.pipeline.versionid,
        compileNotebook.pipeline_metadata,
        compileNotebook.pipeline_package_path,
        _updateDeployProgress
      );
      if (runPipeline) {
        commands.pollRun(runPipeline, _updateDeployProgress);
      }
    }
    // stop deploy button icon spin
    this.setState({ runDeployment: false });
  };

  onMetadataEnable = (isEnabled: boolean) => {
    this.setState({ isEnabled });
  };

  render() {
    // FIXME: What about human-created Notebooks? Match name and old API as well
    const selectedExperiments: IExperiment[] = this.state.experiments.filter(
      e =>
        e.id === this.state.metadata.experiment.id ||
        e.name === this.state.metadata.experiment.name
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

    // const katib_run_input = (
    //   <div className="input-container">
    //     <LightTooltip
    //       title={'Enable this option to run HyperParameter Tuning with Katib'}
    //       placement="top-start"
    //       interactive={true}
    //       TransitionComponent={Zoom}
    //     >
    //       <div className="toolbar">
    //         <div className="switch-label">HP Tuning with Katib</div>
    //         <Switch
    //           checked={this.state.metadata.katib_run}
    //           onChange={_ => this.updateKatibRun()}
    //           color="primary"
    //           name="enableKatib"
    //           className="material-switch"
    //           inputProps={{ 'aria-label': 'primary checkbox' }}
    //         />
    //       </div>
    //     </LightTooltip>
    //   </div>
    // );

    // const volsPanel = (
    //   <VolumesPanel
    //     volumes={this.state.volumes}
    //     notebookVolumes={this.state.notebookVolumes}
    //     metadataVolumes={this.state.metadata.volumes}
    //     notebookMountPoints={this.getNotebookMountPoints()}
    //     selectVolumeTypes={this.state.selectVolumeTypes}
    //     useNotebookVolumes={this.state.metadata.snapshot_volumes}
    //     updateVolumesSwitch={this.updateVolumesSwitch}
    //     autosnapshot={this.state.metadata.autosnapshot}
    //     updateAutosnapshotSwitch={this.updateAutosnapshotSwitch}
    //     rokError={this.props.rokError}
    //     updateVolumes={this.updateVolumes}
    //     storageClassName={this.state.metadata.storage_class_name}
    //     updateStorageClassName={this.updateStorageClassName}
    //     volumeAccessMode={this.state.metadata.volume_access_mode}
    //     updateVolumeAccessMode={this.updateVolumeAccessMode}
    //   />
    // );
    const activeNotebook = this.getActiveNotebook();
    return (
      <ThemeProvider theme={theme}>
        <div className={'kubeflow-widget'} key="kale-widget">
          <div className={'kubeflow-widget-content'}>
            <div>
              <p
                style={{
                  fontSize: 'var(--jp-ui-font-size3)',
                  color: theme.kale.headers.main
                }}
                className="kale-header"
              >
                Kale Deployment Panel {this.state.isEnabled}
              </p>
            </div>

            <div className="kale-component">
              {activeNotebook && (
                <InlineCellsMetadata
                  onMetadataEnable={this.onMetadataEnable}
                  notebook={activeNotebook}
                />
              )}
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

            {/* <div
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
            </div> */}

            <div
              className={
                'kale-component ' + (this.state.isEnabled ? '' : 'hidden')
              }
            >
              {/* <AdvancedSettings
                title={'Advanced Settings'}
                dockerImageValue={this.state.metadata.docker_image}
                dockerImageDefaultValue={DefaultState.metadata.docker_image}
                dockerChange={this.updateDockerImage}
                debug={this.state.deployDebugMessage}
                volsPanel={volsPanel}
                changeDebug={this.changeDeployDebugMessage}
              /> */}
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
            />
          </div>

          {/* <KatibDialog
            open={this.state.katibDialog}
            nbFilePath={this.getActiveNotebookPath()}
            toggleDialog={this.toggleKatibDialog}
            katibMetadata={
              this.state.metadata.katib_metadata || DefaultKatibMetadata
            }
            updateKatibMetadata={this.updateKatibMetadata}
            kernel={this.props.kernel}
          /> */}
        </div>
      </ThemeProvider>
    );
  }
}
