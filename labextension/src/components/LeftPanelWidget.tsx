import * as React from "react";
import {
    INotebookTracker, Notebook,
    NotebookPanel
} from "@jupyterlab/notebook";
import NotebookUtils from "../utils/NotebookUtils";

import {
    CollapsablePanel,
    MaterialInput
} from "./Components";
import {CellTags} from "./CellTags";
import {Cell} from "@jupyterlab/cells";
import {VolumesPanel} from "./VolumesPanel";
import {Dialog, showDialog} from "@jupyterlab/apputils";
import {SplitDeployButton} from "./DeployButton";


const KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_noteobok';

interface IProps {
    tracker: INotebookTracker;
    notebook: NotebookPanel
}

interface IState {
    metadata: IKaleNotebookMetadata;
    runDeployment: boolean;
    deploymentType: string;
    deploymentStatus: string;
    selectVal: string;
    activeNotebook?: NotebookPanel;
    activeCell?: Cell;
    activeCellIndex?: number;
}

export interface IVolumeMetadata {
    type: string,
    // name field will have different meaning based on the type:
    //  - pv: name of the PV
    //  - pvc: name of the pvc
    //  - new_pvc: new pvc with dynamic provisioning
    name: string,
    mount_point: string,
    size?: string,
    size_type?: string,
    annotation?: {key: string, value: string},
    // true if snapshot to be taken at the end of the pipeline
    snapshot: boolean,
    snapshot_name?: string
}

// keep names with Python notation because they will be read
// in python by Kale.
interface IKaleNotebookMetadata {
    experiment_name: string;
    pipeline_name: string;
    pipeline_description: string;
    docker_image: string;
    volumes: IVolumeMetadata[];
}

const DefaultState: IState = {
    metadata: {
        experiment_name: '',
        pipeline_name: '',
        pipeline_description: '',
        docker_image: '',
        volumes: []
    },

    runDeployment: false,
    deploymentType: 'compile',
    deploymentStatus: 'No active deployment.',
    selectVal: '',
    activeNotebook: null,
};

export class KubeflowKaleLeftPanel extends React.Component<IProps, IState> {
    // init state default values
    state = DefaultState;

     DefaultEmptyVolume: IVolumeMetadata = {
        type: 'pvc',
        name: '',
        mount_point: '',
        size: '',
        annotation: {key: '', value: ''},
        snapshot: false
    };

    removeIdxFromArray = (index: number, arr: Array<any>): Array<any> => {return arr.slice(0, index).concat(arr.slice(index + 1, arr.length))};

    updateSelectValue = (val: string) => this.setState({selectVal: val});
    // update metadata state values: use destructure operator to update nested dict
    updateExperimentName = (name: string) => this.setState({metadata: {...this.state.metadata, experiment_name: name}});
    updatePipelineName = (name: string) => this.setState({metadata: {...this.state.metadata, pipeline_name: name}});
    updatePipelineDescription = (desc: string) => this.setState({metadata: {...this.state.metadata, pipeline_description: desc}});
    updateDockerImage = (name: string) => this.setState({metadata: {...this.state.metadata, docker_image: name}});

    // Volume managers
    deleteVolume = (idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.removeIdxFromArray(idx, this.state.metadata.volumes)}});
    addVolume = () => this.setState({metadata: {...this.state.metadata, volumes: [...this.state.metadata.volumes, this.DefaultEmptyVolume]}});
    updateVolumeType = (type: string, idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], type: type}: item})}});
    updateVolumeName = (name: string, idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], name: name}: item})}});
    updateVolumeMountPoint = (mountPoint: string, idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], mount_point: mountPoint}: item})}});
    updateVolumeSnapshot = (idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], snapshot: !this.state.metadata.volumes[idx].snapshot}: item})}});
    updateVolumeSnapshotName = (name: string, idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], snapshot_name: name}: item})}});
    updateVolumeSize = (size: string, idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], size: size}: item})}});
    updateVolumeSizeType = (sizeType: string, idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], size_type: sizeType}: item})}});
    updateVolumeAnnotation = (annotation: {key: string, value: string}, idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => {return (key === idx) ? {...this.state.metadata.volumes[idx], annotation: annotation}: item})}});

    activateRunDeployState = (type: string) => this.setState({runDeployment: true, deploymentStatus: 'No active deployment', deploymentType: type});


    // restore state to default values
    resetState = () => this.setState({...DefaultState, ...DefaultState.metadata});

    componentDidMount = () => {
        // Notebook tracker will signal when a notebook is changed
        this.props.tracker.currentChanged.connect(this.handleNotebookChanged, this);
        // Set notebook widget if one is open
        if (this.props.tracker.currentWidget instanceof  NotebookPanel) {
            this.setNotebookPanel(this.props.tracker.currentWidget);
        } else {
            this.setNotebookPanel(null);
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

        // deployment button has been pressed
        if (prevState.runDeployment !== this.state.runDeployment && this.state.runDeployment) {
            this.runDeploymentCommand()
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

    handleNotebookDisposed = async (notebookPanel: NotebookPanel) => {
        notebookPanel.disposed.disconnect(this.handleNotebookDisposed);
        // reset widget to default state
        this.resetState()
    };

    handleActiveCellChanged = async (notebook: Notebook, activeCell: Cell) => {
        this.setState({activeCell: activeCell, activeCellIndex: notebook.activeCellIndex});
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
            notebook.disposed.connect(this.handleNotebookDisposed);
            notebook.content.activeCellChanged.connect(this.handleActiveCellChanged);
            const currentCell = {activeCell: notebook.content.activeCell, activeCellIndex: notebook.content.activeCellIndex};

            // get notebook metadata
            const notebookMetadata = NotebookUtils.getMetaData(
                notebook,
                KALE_NOTEBOOK_METADATA_KEY
            );
            console.log("Kubeflow metadata:");
            console.log(notebookMetadata);
            // if the key exists in the notebook's metadata
            if (notebookMetadata) {
                let metadata: IKaleNotebookMetadata = {
                    experiment_name: notebookMetadata['experiment_name'] || '',
                    pipeline_name: notebookMetadata['pipeline_name'] || '',
                    pipeline_description: notebookMetadata['pipeline_description'] || '',
                    docker_image: notebookMetadata['docker_image'] || '',
                    volumes: notebookMetadata['volumes'] || [],
                };
                this.setState({metadata: metadata, ...currentCell})
            } else {
                this.setState({metadata: DefaultState.metadata, ...currentCell})
            }
        }
    };

    runDeploymentCommand = async () => {
        const nbFileName = this.state.activeNotebook.context.path.split('/').pop();

        let flag = '';
        if (this.state.deploymentType === 'upload') {
            flag = ' --upload_pipeline'
        }
        if (this.state.deploymentType === 'run') {
            flag = ' --run_pipeline'
        }
        const mainCommand = "output=!kale --nb " + nbFileName + flag;
        console.log("Executing command: " + mainCommand);
        const expr = {output: "output"};
        const output = await NotebookUtils.sendKernelRequest(this.state.activeNotebook, mainCommand, expr, false);
        this.setState({runDeployment: false});

        console.log(output);
        console.log(output.user_expressions.output.data['text/plain']);

        // show dialog with result
        const buttons: ReadonlyArray<Dialog.IButton> = [
          Dialog.okButton({ label: "OK", className: "" })
        ];
        const msg =
            <div>
                {eval(output.user_expressions.output.data['text/plain']).map((s: string) => {return <><span>{s}</span><br/></>})}
            </div>;
        await showDialog({ title: "Deployment Result", buttons, body: msg });
    };


    render() {

        const experiment_name_input = <MaterialInput
            updateValue={this.updateExperimentName}
            value={this.state.metadata.experiment_name}
            label={"Experiment Name"}
        />;

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
            volumes={this.state.metadata.volumes}
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
        />;

        let run_link = null;
        // if (this.state.deploymentRunLink !== '') {
        //     run_link = <p>
        //         Pipeline run at
        //         <a style={{color: "#106ba3"}}
        //              href={this.state.deploymentRunLink}
        //              target="_blank">this
        //         </a> link.</p>;
        // }

        return (
            <div className={"kubeflow-widget"}>
                <div className={"kubeflow-widget-content"}>

                    <div>
                        <p style={{fontSize: "var(--jp-ui-font-size2)" }}
                           className="kale-header">
                            Kale  Deployment  Panel
                        </p>
                    </div>

                    <div>
                        <p className="kale-header">Pipeline Metadata</p>
                    </div>

                    <div className={'input-container'}>
                        {experiment_name_input}
                        {pipeline_name_input}
                        {pipeline_desc_input}
                    </div>

                    {/*  CELLTAGS PANEL  */}
                    <CellTags
                        notebook={this.state.activeNotebook}
                        activeCellIndex={this.state.activeCellIndex}
                        activeCell={this.state.activeCell}
                    />
                    {/*  --------------  */}

                    {volsPanel}


                    <div>
                        <p className="kale-header">Deployment Status</p>
                    </div>
                    <div className='jp-KeySelector' style={{color: "var(--jp-ui-font-color3)", margin: "10px"}}>
                        {this.state.deploymentStatus}
                        {run_link}
                    </div>

                    <CollapsablePanel
                        title={"Advanced Settings"}
                        dockerImageValue={this.state.metadata.docker_image}
                        dockerChange={this.updateDockerImage}
                    />

                    <SplitDeployButton
                        running={this.state.runDeployment}
                        handleClick={this.activateRunDeployState}
                    />
                </div>

            </div>
        );
    }
}