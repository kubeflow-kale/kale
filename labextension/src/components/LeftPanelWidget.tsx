import * as React from "react";
import {
    INotebookTracker, Notebook,
    NotebookPanel
} from "@jupyterlab/notebook";
import NotebookUtils from "../utils/NotebookUtils";
import Switch from "react-switch";

import {
    CollapsablePanel,
    MaterialInput
} from "./Components";
import {CellTags} from "./CellTags";
import {Cell} from "@jupyterlab/cells";
import {VolumesPanel} from "./VolumesPanel";
import {SplitDeployButton} from "./DeployButton";
import { Kernel } from "@jupyterlab/services";
import {ExperimentInput} from "./ExperimentInput";
import { DeploysProgress, DeployProgressState } from "./deploys-progress/DeploysProgress";

const KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook';


export interface ISelectOption {
    label: string;
    value: string;
}

export interface IExperiment {
    id: string;
    name: string;
}

export const NEW_EXPERIMENT: IExperiment = {
    name: "+ New Experiment",
    id: "new"
};
const selectVolumeSizeTypes = [
    {label: "Gi", value: "Gi", base: 1024 ** 3},
    {label: "Mi", value: "Mi", base: 1024 ** 2},
    {label: "Ki", value: "Ki", base: 1024 ** 1},
    {label: "", value: "", base: 1024 ** 0},
];

const selectVolumeTypes = [
    {label: "Create Empty Volume", value: 'new_pvc'},
    {label: "Clone Notebook Volume", value: 'clone'},
    {label: "Clone Existing Snapshot", value: 'snap'},
    {label: "Use Existing Volume", value: 'pvc'},
];

interface IProps {
    tracker: INotebookTracker;
    notebook: NotebookPanel
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
    selectVolumeTypes: {label: string, value: string}[];
    useNotebookVolumes: boolean;
    autosnapshot: boolean;
    deploys: { [index:number]: DeployProgressState };
}

export interface IAnnotation {
    key: string,
    value: string
}

export interface IVolumeMetadata {
    type: string,
    // name field will have different meaning based on the type:
    //  - pv: name of the PV
    //  - pvc: name of the pvc
    //  - new_pvc: new pvc with dynamic provisioning
    //  - clone: clone a volume which is currently mounted to the Notebook Server
    //  - snap: new_pvc from Rok Snapshot
    name: string,
    mount_point: string,
    size?: number,
    size_type?: string,
    annotations: IAnnotation[],
    snapshot: boolean,
    snapshot_name?: string
}

// keep names with Python notation because they will be read
// in python by Kale.
interface IKaleNotebookMetadata {
    experiment: IExperiment;
    experiment_name: string;    // Keep this for backwards compatibility
    pipeline_name: string;
    pipeline_description: string;
    docker_image: string;
    volumes: IVolumeMetadata[];
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

interface IRunPipelineArgs {
    pipeline_package_path: string;
    pipeline_metadata: Object;
}

const DefaultState: IState = {
    metadata: {
        experiment: {id: '', name: ''},
        experiment_name: '',
        pipeline_name: '',
        pipeline_description: '',
        docker_image: '',
        volumes: []
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
    value: ''
};

export class KubeflowKaleLeftPanel extends React.Component<IProps, IState> {
    // init state default values
    state = DefaultState;

    removeIdxFromArray = (index: number, arr: Array<any>): Array<any> => {return arr.slice(0, index).concat(arr.slice(index + 1, arr.length))};
    updateIdxInArray = (element: any, index: number, arr: Array<any>): Array<any> => {return arr.slice(0, index).concat([element]).concat(arr.slice(index + 1, arr.length))};

    updateSelectValue = (val: string) => this.setState({selectVal: val});
    // update metadata state values: use destructure operator to update nested dict
    updateExperiment = (experiment: IExperiment) => this.setState({metadata: {...this.state.metadata, experiment: experiment, experiment_name: experiment.name}});
    updatePipelineName = (name: string) => this.setState({metadata: {...this.state.metadata, pipeline_name: name}});
    updatePipelineDescription = (desc: string) => this.setState({metadata: {...this.state.metadata, pipeline_description: desc}});
    updateDockerImage = (name: string) => this.setState({metadata: {...this.state.metadata, docker_image: name}});
    updateVolumesSwitch = () => {
        this.setState({
            useNotebookVolumes: !this.state.useNotebookVolumes,
            volumes: this.state.notebookVolumes,
            metadata: {
                ...this.state.metadata,
                volumes: this.state.notebookVolumes,
            },
        })
    };
    updateAutosnapshotSwitch = () => this.setState({autosnapshot: !this.state.autosnapshot});

    // Volume managers
    deleteVolume = (idx: number) => {
        // If we delete the last volume, turn autosnapshot off
        const autosnapshot = this.state.volumes.length === 1 ? false : this.state.autosnapshot;
        this.setState({
            volumes: this.removeIdxFromArray(idx, this.state.volumes),
            metadata: {...this.state.metadata, volumes: this.removeIdxFromArray(idx, this.state.metadata.volumes)},
            autosnapshot: autosnapshot,
        });
    };
    addVolume = () => {
        // If we add a volume to an empty list, turn autosnapshot on
        const autosnapshot = this.state.volumes.length === 0 ? true : this.state.autosnapshot;
        this.setState({
            volumes: [...this.state.volumes, DefaultEmptyVolume],
            metadata: {...this.state.metadata, volumes: [...this.state.metadata.volumes, DefaultEmptyVolume]},
            autosnapshot: autosnapshot,
        });
    };
    updateVolumeType = (type: string, idx: number) => {
        const kaleType: string = (type === "snap") ? "new_pvc" : type;
        const annotations: IAnnotation[] = (type === "snap") ? [{key: "rok/origin", value: ""}]: [];
        this.setState({
            volumes: this.state.volumes.map((item, key) => {return (key === idx) ? {...item, type: type, annotations: annotations}: item}),
            metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...item, type: kaleType, annotations: annotations}: item})}
        });
    };
    updateVolumeName = (name: string, idx: number) => {
        this.setState({
            volumes: this.state.volumes.map((item, key) => {return (key === idx) ? {...item, name: name}: item}),
            metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...item, name: name}: item})}
        });
    };
    updateVolumeMountPoint = (mountPoint: string, idx: number) => {
        let cloneVolume: IVolumeMetadata = null;
        if (this.state.volumes[idx].type === "clone") {
            cloneVolume = this.state.notebookVolumes.filter(v => v.mount_point === mountPoint)[0];
        }
        const updateItem = (item: IVolumeMetadata, key: number): IVolumeMetadata => {
            if (key === idx) {
                if (item.type === "clone") {
                    return {...cloneVolume};
                } else {
                    return {...this.state.volumes[idx], mount_point: mountPoint};
                }
            } else {
                return item;
            }
        };
        this.setState({
            volumes: this.state.volumes.map((item, key) => {return updateItem(item, key)}),
            metadata: {
                ...this.state.metadata,
                volumes: this.state.metadata.volumes.map((item, key) => {return updateItem(item, key)})
            }
        });
    };
    updateVolumeSnapshot = (idx: number) => {
        this.setState({
            volumes: this.state.volumes.map((item, key) => {return (key === idx) ? {...this.state.volumes[idx], snapshot: !this.state.volumes[idx].snapshot}: item}),
            metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], snapshot: !this.state.metadata.volumes[idx].snapshot}: item})}
        });
    };
    updateVolumeSnapshotName = (name: string, idx: number) => {
        this.setState({
            volumes: this.state.volumes.map((item, key) => {return (key === idx) ? {...this.state.volumes[idx], snapshot_name: name}: item}),
            metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], snapshot_name: name}: item})}
        });
    };
    updateVolumeSize = (size: number, idx: number) => {
        this.setState({
            volumes: this.state.volumes.map((item, key) => {return (key === idx) ? {...this.state.volumes[idx], size: size}: item}),
            metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], size: size}: item})}
        });
    };
    updateVolumeSizeType = (sizeType: string, idx: number) => {
        this.setState({
            volumes: this.state.volumes.map((item, key) => {return (key === idx) ? {...this.state.volumes[idx], size_type: sizeType}: item}),
            metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], size_type: sizeType}: item})}
        });
    };
    addAnnotation = (idx: number) => {
        const updateItem = (item: IVolumeMetadata, key: number) => {
            if (key === idx) {
                return {
                    ...item,
                    annotations: [...item.annotations, DefaultEmptyAnnotation]
                };
            } else {
                return item;
            }
        };
        this.setState({
            volumes: this.state.volumes.map((item, key) => {return updateItem(item, key)}),
            metadata: {
                ...this.state.metadata,
                volumes: this.state.metadata.volumes.map((item, key) => {return updateItem(item, key)})
            }
        });
    };
    deleteAnnotation = (volumeIdx: number, annotationIdx: number) => {
        const updateItem = (item: IVolumeMetadata, key: number) => {
            if (key === volumeIdx) {
                return {...item, annotations: this.removeIdxFromArray(annotationIdx, item.annotations)};
            } else {
                return item;
            }
        };
        this.setState({
            volumes: this.state.volumes.map((item, key) => {return updateItem(item, key)}),
            metadata: {
                ...this.state.metadata,
                volumes: this.state.metadata.volumes.map((item, key) => {return updateItem(item, key)})
            }
        });
    };
    updateVolumeAnnotation = (annotation: {key: string, value: string}, volumeIdx: number, annotationIdx: number) => {
        const updateItem = (item: IVolumeMetadata, key: number) => {
            if (key === volumeIdx) {
                return {
                    ...item,
                    annotations: this.updateIdxInArray(annotation, annotationIdx, item.annotations)
                };
            } else {
                return item;
            }
        };
        this.setState({
            volumes: this.state.volumes.map((item, key) => {return updateItem(item, key)}),
            metadata: {
                ...this.state.metadata,
                volumes: this.state.metadata.volumes.map((item, key) => {return updateItem(item, key)})
            }
        });
    };
    getNotebookMountPoints = (): {label: string; value: string}[] => {
        const mountPoints: {label: string, value: string}[] = [];
        this.state.notebookVolumes.map((item) => {
            mountPoints.push({label: item.mount_point, value: item.mount_point});
        });
        return mountPoints;
    };

    activateRunDeployState = (type: string) => {
        if(!this.state.runDeployment){
            this.setState({runDeployment: true, deploymentType: type});
            this.runDeploymentCommand();
        }
    };

    changeDeployDebugMessage = () => this.setState({deployDebugMessage: !this.state.deployDebugMessage});


    // restore state to default values
    resetState = () => this.setState(DefaultState);

    componentDidMount = () => {
        // Notebook tracker will signal when a notebook is changed
        this.props.tracker.currentChanged.connect(this.handleNotebookChanged, this);
        // Set notebook widget if one is open
        if (this.props.tracker.currentWidget instanceof  NotebookPanel) {
            this.setState({activeNotebook: this.props.tracker.currentWidget});
            this.setNotebookPanel(this.props.tracker.currentWidget);
        }
    };

    componentDidUpdate = (prevProps: Readonly<IProps>, prevState: Readonly<IState>) => {
        // fast comparison of Metadata objects.
        // warning: this method does not work if keys change order.
        if (JSON.stringify(prevState.metadata) !== JSON.stringify(this.state.metadata)
            && this.state.activeNotebook) {
            // Write new metadata to the notebook and save
            NotebookUtils.setMetaData(
                this.state.activeNotebook,
                KALE_NOTEBOOK_METADATA_KEY,
                this.state.metadata,
                true)
        }
    };

    /**
    * This handles when a notebook is switched to another notebook.
    * The parameters are automatically passed from the signal when a switch occurs.
    */
    handleNotebookChanged = async (tracker: INotebookTracker, notebook: NotebookPanel) => {
        // Set the current notebook and wait for the session to be ready
        if (notebook) {
            this.setState({activeNotebook: notebook});
            await this.setNotebookPanel(notebook)
        } else {
            this.setState({activeNotebook: null});
            await this.setNotebookPanel(null)
        }
    };

    handleActiveCellChanged = async (notebook: Notebook, activeCell: Cell) => {
        this.setState({activeCell: activeCell, activeCellIndex: notebook.activeCellIndex});
    };

    executeRpc = async (env: NotebookPanel | Kernel.IKernel, func: string, args: any = {}) => {
        let retryRpc = true;
        let result: any = null;
        // Kerned aborts the execution if busy
        // If that is the case, retry the RPC
        while (retryRpc) {
            try {
                result = await NotebookUtils.executeRpc(env, func, args);
                retryRpc = false;
            } catch (error) {
                if (error.status !== 'aborted') {
                    console.error(error);
                    retryRpc = false;
                }
            }
        }
        return result;
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
            const currentCell = {activeCell: notebook.content.activeCell, activeCellIndex: notebook.content.activeCellIndex};

            // get notebook metadata
            const notebookMetadata = NotebookUtils.getMetaData(
                notebook,
                KALE_NOTEBOOK_METADATA_KEY
            );
            console.log("Kubeflow metadata:");
            console.log(notebookMetadata);

            await this.getExperiments();
            // Get information about volumes currently mounted on the notebook server
            await this.getMountedVolumes();
            // Detect the base image of the current Notebook Server
            await this.getBaseImage();

            // if the key exists in the notebook's metadata
            if (notebookMetadata) {
                let experiment: IExperiment = {id: '', name: ''};
                let experiment_name: string = '';
                if (notebookMetadata['experiment']) {
                    experiment = {
                        id: notebookMetadata['experiment']['id'] || '',
                        name: notebookMetadata['experiment']['name'] || '',
                    };
                    experiment_name = notebookMetadata['experiment']['name'];
                } else if (notebookMetadata['experiment_name']) {
                    const matchingExperiments = this.state.experiments.filter(e => e.name === notebookMetadata['experiment_name']);
                    if (matchingExperiments.length > 0) {
                        experiment = matchingExperiments[0];
                    } else {
                        experiment = {id: NEW_EXPERIMENT.id, name: notebookMetadata['experiment_name']};
                    }
                    experiment_name = notebookMetadata['experiment_name'];
                }

                let useNotebookVolumes = this.state.notebookVolumes.length > 0;
                let metadataVolumes = (notebookMetadata['volumes'] || []).filter((v: IVolumeMetadata) => v.type !== 'clone');
                let stateVolumes = metadataVolumes.map((volume: IVolumeMetadata) => {
                    if (volume.type === 'new_pvc' && volume.annotations.length > 0 && volume.annotations[0].key === 'rok/origin') {
                        return {...volume, type: 'snap'};
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
                    experiment: experiment,
                    experiment_name: experiment_name,
                    pipeline_name: notebookMetadata['pipeline_name'] || '',
                    pipeline_description: notebookMetadata['pipeline_description'] || '',
                    docker_image: notebookMetadata['docker_image'] || DefaultState.metadata.docker_image,
                    volumes: metadataVolumes,
                };
                this.setState({
                    volumes: stateVolumes,
                    metadata: metadata,
                    useNotebookVolumes: useNotebookVolumes,
                    autosnapshot: stateVolumes.length > 0,
                    ...currentCell
                });
            } else {
                this.setState({metadata: DefaultState.metadata, ...currentCell})
            }
        } else {
            this.resetState();
        }
    };

    wait = (ms:number) =>{
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    runSnapshotProcedure = async (_deployIndex:number) => {
        const showSnapshotProgress = true;
        const snapshot = await this.snapshotNotebook();
        const taskId = snapshot.task.id;
        let task = await this.getSnapshotProgress(taskId);
        this.updateDeployProgress(_deployIndex, { task, showSnapshotProgress });

        while (!['success', 'error', 'canceled'].includes(task.status)) {
            task = await this.getSnapshotProgress(taskId,1000);
            this.updateDeployProgress(_deployIndex, { task });
        }

        if (task.status === 'success') {
            console.log("Snapshotting successful!");
            return task;
        } else if (task.status === 'error') {
            console.error("Snapshotting failed");
            console.error("Stopping the deployment...");
        } else if (task.status === 'canceled') {
            console.error("Snapshotting canceled");
            console.error("Stopping the deployment...");
        }

        return null;
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

        if (metadata.volumes.filter((v: IVolumeMetadata) => v.type === 'clone').length > 0) {
            const task = await this.runSnapshotProcedure(_deployIndex)
            console.log(task);
            if (!task) {
                this.setState({ runDeployment: false });
                return;
            }
            metadata.volumes = await this.replaceClonedVolumes(
                task.bucket,
                task.result.event.object,
                task.result.event.version,
                metadata.volumes
            );
        }

        console.log('metadata:', metadata);

        const nbFileName = this.state.activeNotebook.context.path.split('/').pop();

        // CREATE PIPELINE
        const compileNotebookArgs: ICompileNotebookArgs = {
            source_notebook_path: nbFileName,
            notebook_metadata_overrides: metadata,
            debug: this.state.deployDebugMessage,
            auto_snapshot: this.state.autosnapshot,
        };
        const compileNotebook = await this.executeRpc(this.state.activeNotebook, 'nb.compile_notebook', compileNotebookArgs);
        if (!compileNotebook) {
            this.setState({ runDeployment: false });
            await NotebookUtils.showMessage('Operation Failed', ['Could not compile pipeline.']);
            return;
        }
        let msg = ["Pipeline saved successfully at " + compileNotebook.pipeline_package_path];
        if (this.state.deploymentType === 'compile') {
            await NotebookUtils.showMessage('Operation Successful', msg);
        }

        // UPLOAD
        if (this.state.deploymentType === 'upload' || this.state.deploymentType === 'run') {
            this.updateDeployProgress(_deployIndex, { showUploadProgress: true });
            const uploadPipelineArgs: IUploadPipelineArgs = {
                pipeline_package_path: compileNotebook.pipeline_package_path,
                pipeline_metadata: compileNotebook.pipeline_metadata,
                overwrite: false,
            };
            let uploadPipeline = await this.executeRpc(this.state.activeNotebook, 'kfp.upload_pipeline', uploadPipelineArgs);
            let result = true;
            if (!uploadPipeline) {
                this.setState({ runDeployment: false });
                msg = msg.concat(['Could not upload pipeline.']);
                await NotebookUtils.showMessage('Operation Failed', msg);
                return;
            }
            if (uploadPipeline && uploadPipeline.already_exists) {
                // show dialog to ask user if they want to overwrite the existing pipeline
                result = await NotebookUtils.showYesNoDialog(
                    'Pipeline Upload Failed',
                    'Pipeline with name ' + compileNotebook.pipeline_metadata.pipeline_name + ' already exists. ' +
                    'Would you like to overwrite it?',
                );
                // OVERWRITE EXISTING PIPELINE
                if (result) {
                    uploadPipelineArgs.overwrite = true;
                    uploadPipeline = await this.executeRpc(this.state.activeNotebook, 'kfp.upload_pipeline', uploadPipelineArgs);
                } else {
                    this.updateDeployProgress(_deployIndex, { pipeline: false });
                }
            }
            if (uploadPipeline && result) {
                this.updateDeployProgress(_deployIndex, { pipeline: uploadPipeline });
                msg = msg.concat(['Pipeline with name ' + uploadPipeline.pipeline.name + ' uploaded successfully.']);
                if (this.state.deploymentType === 'upload') {
                    await NotebookUtils.showMessage('Operation Successful', msg);
                }
            }
        }

        // RUN
        if (this.state.deploymentType === 'run') {
            this.updateDeployProgress(_deployIndex, { showRunProgress: true });
            const runPipelineArgs: IRunPipelineArgs = {
                pipeline_package_path: compileNotebook.pipeline_package_path,
                pipeline_metadata: compileNotebook.pipeline_metadata,
            };
            const runPipeline = await this.executeRpc(this.state.activeNotebook, 'kfp.run_pipeline', runPipelineArgs);
            if (runPipeline) {
                this.updateDeployProgress(_deployIndex, { runPipeline });
                this.pollRun(_deployIndex,runPipeline);
                msg = msg.concat(['Pipeline run created successfully']);
                await NotebookUtils.showMessage('Operation Successful', msg);
            } else {
                msg = msg.concat(['Could not create run.']);
                await NotebookUtils.showMessage('Operation Failed', msg);
            }
        }
        // stop deploy button icon spin
        this.setState({ runDeployment: false });
    };

    pollRun(_deployIndex:number, runPipeline:any) {
        this.executeRpc(this.state.activeNotebook, 'kfp.get_run', { run_id: runPipeline.id }).then((run)=> {
            this.updateDeployProgress(_deployIndex, { runPipeline:run });
            if(run && (run.status === 'Running' || run.status === null)){
                setTimeout(()=>this.pollRun(_deployIndex,run),2000)
            }
        });
    };

    getExperiments = async () => {
        this.setState({gettingExperiments: true});
        let list_experiments: IExperiment[] = await this.executeRpc(this.state.activeNotebook, "kfp.list_experiments");
        if (list_experiments) {
            list_experiments.push(NEW_EXPERIMENT);
        } else {
            list_experiments = [NEW_EXPERIMENT];
        }

        // Fix experiment metadata
        let experiment: IExperiment = null;
        let selectedExperiments: IExperiment[] = list_experiments.filter(
            e => (
                e.id === this.state.metadata.experiment.id
                || e.name === this.state.metadata.experiment.name
                || e.name === this.state.metadata.experiment_name
            )
        );
        if (selectedExperiments.length === 0 || selectedExperiments[0].id === NEW_EXPERIMENT.id) {
            let name = list_experiments[0].name;
            if (name === NEW_EXPERIMENT.name) {
                name = (this.state.metadata.experiment.name !== '') ?
                    this.state.metadata.experiment.name
                    : this.state.metadata.experiment_name;
            }
            experiment = {...list_experiments[0], name: name};
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
        let notebookVolumes: IVolumeMetadata[] = await this.executeRpc(this.state.activeNotebook, "nb.list_volumes");

        if (notebookVolumes) {
            notebookVolumes = notebookVolumes.map((volume) => {
                const sizeGroup = selectVolumeSizeTypes.filter(s => volume.size >= s.base)[0];
                volume.size = Math.ceil(volume.size / sizeGroup.base);
                volume.size_type = sizeGroup.value;
                volume.annotations = [];
                return volume;
            });
            this.setState({
                notebookVolumes: notebookVolumes,
                selectVolumeTypes: selectVolumeTypes,
            });
        } else {
            this.setState({selectVolumeTypes: selectVolumeTypes.filter(t => t.value !== 'clone')});
        }
    };

    getBaseImage = async () => {
        let baseImage: string = await this.executeRpc(this.state.activeNotebook, "nb.get_base_image");
        if (baseImage) {
            DefaultState.metadata.docker_image = baseImage
        } else {
            DefaultState.metadata.docker_image = ''
        }
    };

    snapshotNotebook = async () => {
        return await this.executeRpc(this.state.activeNotebook, "rok.snapshot_notebook");
    };

    getSnapshotProgress = async (task_id: string, ms?: number) => {
        const task = await this.executeRpc(this.state.activeNotebook, "rok.get_task", { task_id });
        if (ms) {
            await this.wait(ms);
        }
        return task
    };

    replaceClonedVolumes = async (
        bucket: string,
        obj: string,
        version: string,
        volumes: IVolumeMetadata[]
    ) => {
        return await this.executeRpc(
            this.state.activeNotebook,
            "rok.replace_cloned_volumes",
            {bucket, obj, version, volumes}
        );
    };

    render() {

        // FIXME: What about human-created Notebooks? Match name and old API as well
        const selectedExperiments: IExperiment[] = this.state.experiments.filter(
            e => (
                e.id === this.state.metadata.experiment.id
                || e.name === this.state.metadata.experiment.name
                || e.name === this.state.metadata.experiment_name
            )
        );
        if (this.state.experiments.length > 0 && selectedExperiments.length === 0) {
            selectedExperiments.push(this.state.experiments[0]);
        }
        let experimentInputSelected = '';
        let experimentInputValue = ''
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
        const experiment_name_input = <ExperimentInput
            updateValue={this.updateExperiment}
            options={this.state.experiments}
            selected={experimentInputSelected}
            value={experimentInputValue}
            loading={this.state.gettingExperiments}
        />

        const pipeline_name_input = <MaterialInput
            label={"Pipeline Name"}
            updateValue={this.updatePipelineName}
            value={this.state.metadata.pipeline_name}
            regex={"^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"}
            regexErrorMsg={"Pipeline name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character."}
        />;

        const pipeline_desc_input = <MaterialInput
            label={"Pipeline Description"}
            updateValue={this.updatePipelineDescription}
            value={this.state.metadata.pipeline_description}
        />;

        const volsPanel = <VolumesPanel
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
        />;

        return (
            <div className={"kubeflow-widget"}>
                <div className={"kubeflow-widget-content"}>

                    <div>
                        <p style={{fontSize: "var(--jp-ui-font-size2)" }}
                           className="kale-header">
                            Kale  Deployment  Panel
                        </p>
                    </div>

                    <div className="kale-component">
                        <div>
                            <p className="kale-header">Pipeline Metadata</p>
                        </div>

                        <div className={'input-container'}>
                            {experiment_name_input}
                            {pipeline_name_input}
                            {pipeline_desc_input}
                        </div>
                    </div>


                    {/*  CELLTAGS PANEL  */}
                    <div className="kale-component">
                        <CellTags
                            notebook={this.state.activeNotebook}
                            activeCellIndex={this.state.activeCellIndex}
                            activeCell={this.state.activeCell}
                        />
                    </div>
                    {/*  --------------  */}

                    {volsPanel}

                    <div className="kale-component">
                        <CollapsablePanel
                            title={"Advanced Settings"}
                            dockerImageValue={this.state.metadata.docker_image}
                            dockerChange={this.updateDockerImage}
                            debug={this.state.deployDebugMessage}
                            changeDebug={this.changeDeployDebugMessage}
                        />
                    </div>
                </div>
                <div className="kale-footer">
                    <DeploysProgress deploys={this.state.deploys} onPanelRemove={this.onPanelRemove} />
                    <SplitDeployButton
                        running={this.state.runDeployment}
                        handleClick={this.activateRunDeployState}
                    />
                </div>
            </div>
        );
    }
}