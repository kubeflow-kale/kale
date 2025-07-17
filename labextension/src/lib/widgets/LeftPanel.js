"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const notebook_1 = require("@jupyterlab/notebook");
const NotebookUtils_1 = __importDefault(require("../lib/NotebookUtils"));
const RPCUtils_1 = require("../lib/RPCUtils");
const AdvancedSettings_1 = require("../components/AdvancedSettings");
const InlineCellMetadata_1 = require("./cell-metadata/InlineCellMetadata");
const VolumesPanel_1 = require("./VolumesPanel");
const DeployButton_1 = require("../components/DeployButton");
const ExperimentInput_1 = require("../components/ExperimentInput");
const DeploysProgress_1 = require("./deploys-progress/DeploysProgress");
const styles_1 = require("@material-ui/core/styles");
const Theme_1 = require("../Theme");
const core_1 = require("@material-ui/core");
const KatibDialog_1 = require("./KatibDialog");
const Input_1 = require("../components/Input");
const LightTooltip_1 = require("../components/LightTooltip");
const Commands_1 = __importDefault(require("../lib/Commands"));
const coreutils_1 = require("@jupyterlab/coreutils");
const KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook';
exports.NEW_EXPERIMENT = {
    name: '+ New Experiment',
    id: 'new',
};
const DefaultKatibMetadata = {
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
exports.DefaultState = {
    metadata: {
        experiment: { id: '', name: '' },
        experiment_name: '',
        pipeline_name: '',
        pipeline_description: '',
        docker_image: '',
        volumes: [],
        snapshot_volumes: false,
        autosnapshot: false,
        katib_run: false,
        steps_defaults: [],
        volume_access_mode: 'rwm',
    },
    runDeployment: false,
    deploymentType: 'compile',
    deployDebugMessage: false,
    experiments: [],
    gettingExperiments: false,
    notebookVolumes: [],
    volumes: [],
    selectVolumeTypes: VolumesPanel_1.SELECT_VOLUME_TYPES,
    deploys: {},
    isEnabled: false,
    katibDialog: false,
    namespace: '',
};
let deployIndex = 0;
class KubeflowKaleLeftPanel extends React.Component {
    constructor() {
        super(...arguments);
        // init state default values
        this.state = exports.DefaultState;
        this.getActiveNotebook = () => {
            return this.props.tracker.currentWidget;
        };
        this.getActiveNotebookPath = () => {
            return (this.getActiveNotebook() &&
                // absolute path to the notebook's root (--notebook-dir option, if set)
                coreutils_1.PageConfig.getOption('serverRoot') +
                    '/' +
                    // relative path wrt to 'serverRoot'
                    this.getActiveNotebook().context.path);
        };
        // update metadata state values: use destructure operator to update nested dict
        this.updateExperiment = (experiment) => this.setState((prevState, props) => ({
            metadata: Object.assign(Object.assign({}, prevState.metadata), { experiment: experiment, experiment_name: experiment.name }),
        }));
        this.updatePipelineName = (name) => this.setState((prevState, props) => ({
            metadata: Object.assign(Object.assign({}, prevState.metadata), { pipeline_name: name }),
        }));
        this.updatePipelineDescription = (desc) => this.setState((prevState, props) => ({
            metadata: Object.assign(Object.assign({}, prevState.metadata), { pipeline_description: desc }),
        }));
        this.updateDockerImage = (name) => this.setState((prevState, props) => ({
            metadata: Object.assign(Object.assign({}, prevState.metadata), { docker_image: name }),
        }));
        this.updateVolumesSwitch = () => {
            this.setState((prevState, props) => ({
                volumes: prevState.notebookVolumes,
                metadata: Object.assign(Object.assign({}, prevState.metadata), { volumes: prevState.notebookVolumes, snapshot_volumes: !prevState.metadata.snapshot_volumes, storage_class_name: undefined, volume_access_mode: undefined }),
            }));
        };
        this.updateAutosnapshotSwitch = (autosnapshot) => this.setState((prevState, props) => ({
            metadata: Object.assign(Object.assign({}, prevState.metadata), { autosnapshot: autosnapshot === undefined
                    ? !prevState.metadata.autosnapshot
                    : autosnapshot }),
        }));
        this.getNotebookMountPoints = () => {
            const mountPoints = [];
            this.state.notebookVolumes.map(item => {
                mountPoints.push({ label: item.mount_point, value: item.mount_point });
            });
            return mountPoints;
        };
        this.activateRunDeployState = (type) => {
            if (!this.state.runDeployment) {
                this.setState({ runDeployment: true, deploymentType: type });
                this.runDeploymentCommand();
            }
        };
        this.changeDeployDebugMessage = () => this.setState((prevState, props) => ({
            deployDebugMessage: !prevState.deployDebugMessage,
        }));
        this.updateStorageClassName = (storage_class_name) => this.setState((prevState, props) => ({
            metadata: Object.assign(Object.assign({}, prevState.metadata), { storage_class_name }),
        }));
        this.updateVolumeAccessMode = (volume_access_mode) => {
            this.setState((prevState, props) => ({
                metadata: Object.assign(Object.assign({}, prevState.metadata), { volume_access_mode }),
            }));
        };
        this.updateKatibRun = () => this.setState((prevState, props) => ({
            metadata: Object.assign(Object.assign({}, prevState.metadata), { katib_run: !prevState.metadata.katib_run }),
        }));
        this.updateKatibMetadata = (metadata) => this.setState((prevState, props) => ({
            metadata: Object.assign(Object.assign({}, prevState.metadata), { katib_metadata: metadata }),
        }));
        this.updateVolumes = (volumes, metadataVolumes) => {
            this.setState((prevState, props) => ({
                volumes,
                metadata: Object.assign(Object.assign({}, prevState.metadata), { volumes: metadataVolumes }),
            }));
        };
        this.toggleKatibDialog = async () => {
            // When opening the katib dialog, we sent and RPC to Kale to parse the
            // current notebook to retrieve the pipeline parameters. In case the
            // notebook is in an unsaved state, ask the user to save it.
            if (!this.state.katibDialog) {
                await NotebookUtils_1.default.saveNotebook(this.getActiveNotebook(), true, true);
                // if the notebook is saved
                if (!this.getActiveNotebook().context.model.dirty) {
                    this.setState({ katibDialog: true });
                }
            }
            else {
                // close
                this.setState({ katibDialog: false });
            }
        };
        // restore state to default values
        this.resetState = () => this.setState((prevState, props) => (Object.assign(Object.assign({}, exports.DefaultState), { isEnabled: prevState.isEnabled })));
        this.componentDidMount = () => {
            // Notebook tracker will signal when a notebook is changed
            this.props.tracker.currentChanged.connect(this.handleNotebookChanged, this);
            // Set notebook widget if one is open
            if (this.props.tracker.currentWidget instanceof notebook_1.NotebookPanel) {
                this.setNotebookPanel(this.props.tracker.currentWidget);
            }
        };
        this.componentDidUpdate = (prevProps, prevState) => {
            // fast comparison of Metadata objects.
            // warning: this method does not work if keys change order.
            if (JSON.stringify(prevState.metadata) !==
                JSON.stringify(this.state.metadata) &&
                this.getActiveNotebook()) {
                // Write new metadata to the notebook and save
                NotebookUtils_1.default.setMetaData(this.getActiveNotebook(), KALE_NOTEBOOK_METADATA_KEY, this.state.metadata, true);
            }
        };
        /**
         * This handles when a notebook is switched to another notebook.
         * The parameters are automatically passed from the signal when a switch occurs.
         */
        this.handleNotebookChanged = async (tracker, notebook) => {
            // Set the current notebook and wait for the session to be ready
            if (notebook) {
                await this.setNotebookPanel(notebook);
            }
            else {
                await this.setNotebookPanel(null);
            }
        };
        /**
         * Read new notebook and assign its metadata to the state.
         * @param notebook active NotebookPanel
         */
        this.setNotebookPanel = async (notebook) => {
            // if there at least an open notebook
            if (this.props.tracker.size > 0 && notebook) {
                const commands = new Commands_1.default(this.getActiveNotebook(), this.props.kernel);
                // wait for the session to be ready before reading metadata
                await notebook.sessionContext.ready;
                // get notebook metadata
                const notebookMetadata = NotebookUtils_1.default.getMetaData(notebook, KALE_NOTEBOOK_METADATA_KEY);
                console.log('Inside setNotebookPanel');
                console.log('Kubeflow metadata:');
                console.log(notebookMetadata);
                if (this.props.backend) {
                    // Retrieve the notebook's namespace
                    // this.setState({ namespace: await commands.getNamespace() });
                    // Detect whether this is an exploration, i.e., recovery from snapshot
                    const nbFilePath = this.getActiveNotebookPath();
                    await commands.resumeStateIfExploreNotebook(nbFilePath);
                    if (!this.props.rokError) {
                        // Get information about volumes currently mounted on the notebook server
                        const { notebookVolumes, selectVolumeTypes, } = await commands.getMountedVolumes(this.state.notebookVolumes);
                        this.setState({
                            notebookVolumes,
                            selectVolumeTypes,
                        });
                    }
                    else {
                        this.setState((prevState, props) => ({
                            selectVolumeTypes: prevState.selectVolumeTypes.map(t => {
                                return t.value === 'clone' || t.value === 'snap'
                                    ? Object.assign(Object.assign({}, t), { tooltip: RPCUtils_1.rokErrorTooltip(this.props.rokError) }) : t;
                            }),
                        }));
                    }
                    // Detect the base image of the current Notebook Server
                    const baseImage = await commands.getBaseImage();
                    if (baseImage) {
                        exports.DefaultState.metadata.docker_image = baseImage;
                    }
                    else {
                        exports.DefaultState.metadata.docker_image = '';
                    }
                    // Detect poddefault labels applied on server and add them as steps defaults
                    // fixme: This RPC could be called just when starting the widget
                    //        and not every time we set a new notebook
                    const podDefaultLabels = await commands.findPodDefaultLabelsOnServer();
                    Object.keys(podDefaultLabels)
                        .map(key => `label:${key}:${podDefaultLabels[key]}`)
                        .forEach(label => {
                        if (!exports.DefaultState.metadata.steps_defaults.includes(label)) {
                            exports.DefaultState.metadata.steps_defaults.push(label);
                        }
                    });
                    // Get experiment information last because it may take more time to respond
                    this.setState({ gettingExperiments: true });
                    const { experiments, experiment, experiment_name, } = await commands.getExperiments(this.state.metadata.experiment, this.state.metadata.experiment_name);
                    this.setState((prevState, props) => ({
                        experiments,
                        gettingExperiments: false,
                        metadata: Object.assign(Object.assign({}, prevState.metadata), { experiment,
                            experiment_name }),
                    }));
                }
                // if the key exists in the notebook's metadata
                if (notebookMetadata) {
                    let experiment = { id: '', name: '' };
                    let experiment_name = '';
                    if (notebookMetadata['experiment']) {
                        experiment = {
                            id: notebookMetadata['experiment']['id'] || '',
                            name: notebookMetadata['experiment']['name'] || '',
                        };
                        experiment_name = notebookMetadata['experiment']['name'];
                    }
                    else if (notebookMetadata['experiment_name']) {
                        const matchingExperiments = this.state.experiments.filter(e => e.name === notebookMetadata['experiment_name']);
                        if (matchingExperiments.length > 0) {
                            experiment = matchingExperiments[0];
                        }
                        else {
                            experiment = {
                                id: exports.NEW_EXPERIMENT.id,
                                name: notebookMetadata['experiment_name'],
                            };
                        }
                        experiment_name = notebookMetadata['experiment_name'];
                    }
                    let metadataVolumes = (notebookMetadata['volumes'] || []).filter((v) => v.type !== 'clone');
                    let stateVolumes = this.props.rokError
                        ? metadataVolumes
                        : metadataVolumes.map((volume) => {
                            if (volume.type === 'new_pvc' &&
                                volume.annotations.length > 0 &&
                                volume.annotations[0].key === 'rok/origin') {
                                return Object.assign(Object.assign({}, volume), { type: 'snap' });
                            }
                            return volume;
                        });
                    if (stateVolumes.length === 0 && metadataVolumes.length === 0) {
                        metadataVolumes = stateVolumes = this.state.notebookVolumes;
                    }
                    else {
                        metadataVolumes = metadataVolumes.concat(this.state.notebookVolumes);
                        stateVolumes = stateVolumes.concat(this.state.notebookVolumes);
                    }
                    let metadata = Object.assign(Object.assign({}, notebookMetadata), { experiment: experiment, experiment_name: experiment_name, pipeline_name: notebookMetadata['pipeline_name'] || '', pipeline_description: notebookMetadata['pipeline_description'] || '', docker_image: notebookMetadata['docker_image'] ||
                            exports.DefaultState.metadata.docker_image, volumes: metadataVolumes, katib_run: notebookMetadata['katib_run'] || exports.DefaultState.metadata.katib_run, katib_metadata: Object.assign(Object.assign({}, DefaultKatibMetadata), (notebookMetadata['katib_metadata'] || {})), autosnapshot: notebookMetadata['autosnapshot'] === undefined
                            ? !this.props.rokError && this.state.notebookVolumes.length > 0
                            : notebookMetadata['autosnapshot'], snapshot_volumes: notebookMetadata['snapshot_volumes'] === undefined
                            ? !this.props.rokError && this.state.notebookVolumes.length > 0
                            : notebookMetadata['snapshot_volumes'], 
                        // fixme: for now we are using the 'steps_defaults' field just for poddefaults
                        //        so we replace any existing value every time
                        steps_defaults: exports.DefaultState.metadata.steps_defaults });
                    this.setState({
                        volumes: stateVolumes,
                        metadata: metadata,
                    });
                }
                else {
                    this.setState((prevState, props) => ({
                        metadata: Object.assign(Object.assign({}, exports.DefaultState.metadata), { volumes: prevState.notebookVolumes, snapshot_volumes: !this.props.rokError && prevState.notebookVolumes.length > 0, autosnapshot: !this.props.rokError && prevState.notebookVolumes.length > 0 }),
                        volumes: prevState.notebookVolumes,
                    }));
                }
            }
            else {
                this.resetState();
            }
        };
        this.updateDeployProgress = (index, progress) => {
            let deploy;
            if (!this.state.deploys[index]) {
                deploy = { [index]: progress };
            }
            else {
                deploy = { [index]: Object.assign(Object.assign({}, this.state.deploys[index]), progress) };
            }
            this.setState({ deploys: Object.assign(Object.assign({}, this.state.deploys), deploy) });
        };
        this.onPanelRemove = (index) => {
            const deploys = Object.assign({}, this.state.deploys);
            deploys[index].deleted = true;
            this.setState({ deploys });
        };
        this.runDeploymentCommand = async () => {
            if (!this.getActiveNotebook()) {
                this.setState({ runDeployment: false });
                return;
            }
            await this.getActiveNotebook().context.save();
            const commands = new Commands_1.default(this.getActiveNotebook(), this.props.kernel);
            const _deployIndex = ++deployIndex;
            const _updateDeployProgress = (x) => {
                this.updateDeployProgress(_deployIndex, Object.assign(Object.assign({}, x), { namespace: this.state.namespace }));
            };
            const metadata = JSON.parse(JSON.stringify(this.state.metadata)); // Deepcopy metadata
            // assign the default docker image in case it is empty
            if (metadata.docker_image === '') {
                metadata.docker_image = exports.DefaultState.metadata.docker_image;
            }
            const nbFilePath = this.getActiveNotebookPath();
            // VALIDATE METADATA
            const validationSucceeded = await commands.validateMetadata(nbFilePath, metadata, _updateDeployProgress);
            if (!validationSucceeded) {
                this.setState({ runDeployment: false });
                return;
            }
            // SNAPSHOT VOLUMES
            if (metadata.volumes.filter((v) => v.type === 'clone')
                .length > 0) {
                const task = await commands.runSnapshotProcedure(_updateDeployProgress);
                console.log(task);
                if (!task) {
                    this.setState({ runDeployment: false });
                    return;
                }
                metadata.volumes = await commands.replaceClonedVolumes(task.bucket, task.result.event.object, task.result.event.version, metadata.volumes);
            }
            // CREATE PIPELINE
            const compileNotebook = await commands.compilePipeline(nbFilePath, metadata, this.props.docManager, this.state.deployDebugMessage, _updateDeployProgress);
            if (!compileNotebook) {
                this.setState({ runDeployment: false });
                return;
            }
            // UPLOAD
            const uploadPipeline = this.state.deploymentType === 'upload' ||
                this.state.deploymentType === 'run'
                ? await commands.uploadPipeline(compileNotebook.pipeline_package_path, compileNotebook.pipeline_metadata, _updateDeployProgress)
                : null;
            if (!uploadPipeline) {
                this.setState({ runDeployment: false });
                _updateDeployProgress({ pipeline: false });
                return;
            }
            // RUN
            if (this.state.deploymentType === 'run') {
                if (metadata.katib_run) {
                    try {
                        const katibExperiment = await commands.runKatib(nbFilePath, metadata, uploadPipeline.pipeline.pipelineid, uploadPipeline.pipeline.versionid, _updateDeployProgress);
                        commands.pollKatib(katibExperiment, _updateDeployProgress);
                    }
                    catch (error) {
                        this.setState({ runDeployment: false });
                        throw error;
                    }
                }
                else {
                    const runPipeline = await commands.runPipeline(uploadPipeline.pipeline.pipelineid, uploadPipeline.pipeline.versionid, compileNotebook.pipeline_metadata, _updateDeployProgress);
                    if (runPipeline) {
                        commands.pollRun(runPipeline, _updateDeployProgress);
                    }
                }
            }
            // stop deploy button icon spin
            this.setState({ runDeployment: false });
        };
        this.onMetadataEnable = (isEnabled) => {
            this.setState({ isEnabled });
        };
    }
    render() {
        // FIXME: What about human-created Notebooks? Match name and old API as well
        const selectedExperiments = this.state.experiments.filter(e => e.id === this.state.metadata.experiment.id ||
            e.name === this.state.metadata.experiment.name ||
            e.name === this.state.metadata.experiment_name);
        if (this.state.experiments.length > 0 && selectedExperiments.length === 0) {
            selectedExperiments.push(this.state.experiments[0]);
        }
        let experimentInputSelected = '';
        let experimentInputValue = '';
        if (selectedExperiments.length > 0) {
            experimentInputSelected = selectedExperiments[0].id;
            if (selectedExperiments[0].id === exports.NEW_EXPERIMENT.id) {
                if (this.state.metadata.experiment.name !== '') {
                    experimentInputValue = this.state.metadata.experiment.name;
                }
                else {
                    experimentInputValue = this.state.metadata.experiment_name;
                }
            }
            else {
                experimentInputValue = selectedExperiments[0].name;
            }
        }
        const experiment_name_input = (React.createElement(ExperimentInput_1.ExperimentInput, { updateValue: this.updateExperiment, options: this.state.experiments, selected: experimentInputSelected, value: experimentInputValue, loading: this.state.gettingExperiments }));
        const pipeline_name_input = (React.createElement(Input_1.Input, { variant: "standard", label: 'Pipeline Name', updateValue: this.updatePipelineName, value: this.state.metadata.pipeline_name, regex: '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$', regexErrorMsg: "Pipeline name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character." }));
        const pipeline_desc_input = (React.createElement(Input_1.Input, { variant: "standard", label: 'Pipeline Description', updateValue: this.updatePipelineDescription, value: this.state.metadata.pipeline_description }));
        const katib_run_input = (React.createElement("div", { className: "input-container" },
            React.createElement(LightTooltip_1.LightTooltip, { title: 'Enable this option to run HyperParameter Tuning with Katib', placement: "top-start", interactive: true, TransitionComponent: core_1.Zoom },
                React.createElement("div", { className: "toolbar" },
                    React.createElement("div", { className: "switch-label" }, "HP Tuning with Katib"),
                    React.createElement(core_1.Switch, { checked: this.state.metadata.katib_run, onChange: _ => this.updateKatibRun(), color: "primary", name: "enableKatib", className: "material-switch", inputProps: { 'aria-label': 'primary checkbox' } })))));
        const volsPanel = (React.createElement(VolumesPanel_1.VolumesPanel, { volumes: this.state.volumes, notebookVolumes: this.state.notebookVolumes, metadataVolumes: this.state.metadata.volumes, notebookMountPoints: this.getNotebookMountPoints(), selectVolumeTypes: this.state.selectVolumeTypes, useNotebookVolumes: this.state.metadata.snapshot_volumes, updateVolumesSwitch: this.updateVolumesSwitch, autosnapshot: this.state.metadata.autosnapshot, updateAutosnapshotSwitch: this.updateAutosnapshotSwitch, rokError: this.props.rokError, updateVolumes: this.updateVolumes, storageClassName: this.state.metadata.storage_class_name, updateStorageClassName: this.updateStorageClassName, volumeAccessMode: this.state.metadata.volume_access_mode, updateVolumeAccessMode: this.updateVolumeAccessMode }));
        return (React.createElement(styles_1.ThemeProvider, { theme: Theme_1.theme },
            React.createElement("div", { className: 'kubeflow-widget', key: "kale-widget" },
                React.createElement("div", { className: 'kubeflow-widget-content' },
                    React.createElement("div", null,
                        React.createElement("p", { style: {
                                fontSize: 'var(--jp-ui-font-size3)',
                                color: Theme_1.theme.kale.headers.main,
                            }, className: "kale-header" },
                            "Kale Deployment Panel ",
                            this.state.isEnabled)),
                    React.createElement("div", { className: "kale-component" },
                        React.createElement(InlineCellMetadata_1.InlineCellsMetadata, { onMetadataEnable: this.onMetadataEnable, notebook: this.getActiveNotebook() })),
                    React.createElement("div", { className: 'kale-component ' + (this.state.isEnabled ? '' : 'hidden') },
                        React.createElement("div", null,
                            React.createElement("p", { className: "kale-header", style: { color: Theme_1.theme.kale.headers.main } }, "Pipeline Metadata")),
                        React.createElement("div", { className: 'input-container' },
                            experiment_name_input,
                            pipeline_name_input,
                            pipeline_desc_input)),
                    React.createElement("div", { className: 'kale-component ' + (this.state.isEnabled ? '' : 'hidden') },
                        React.createElement("div", null,
                            React.createElement("p", { className: "kale-header", style: { color: Theme_1.theme.kale.headers.main } }, "Run")),
                        katib_run_input,
                        React.createElement("div", { className: "input-container add-button" },
                            React.createElement(core_1.Button, { variant: "contained", color: "primary", size: "small", title: "SetupKatibJob", onClick: this.toggleKatibDialog, disabled: !this.state.metadata.katib_run, style: { marginLeft: '10px', marginTop: '0px' } }, "Set Up Katib Job"))),
                    React.createElement("div", { className: 'kale-component ' + (this.state.isEnabled ? '' : 'hidden') },
                        React.createElement(AdvancedSettings_1.AdvancedSettings, { title: 'Advanced Settings', dockerImageValue: this.state.metadata.docker_image, dockerImageDefaultValue: exports.DefaultState.metadata.docker_image, dockerChange: this.updateDockerImage, debug: this.state.deployDebugMessage, volsPanel: volsPanel, changeDebug: this.changeDeployDebugMessage }))),
                React.createElement("div", { className: this.state.isEnabled ? '' : 'hidden', style: { marginTop: 'auto' } },
                    React.createElement(DeploysProgress_1.DeploysProgress, { deploys: this.state.deploys, onPanelRemove: this.onPanelRemove }),
                    React.createElement(DeployButton_1.SplitDeployButton, { running: this.state.runDeployment, handleClick: this.activateRunDeployState, katibRun: this.state.metadata.katib_run })),
                React.createElement(KatibDialog_1.KatibDialog, { open: this.state.katibDialog, nbFilePath: this.getActiveNotebookPath(), toggleDialog: this.toggleKatibDialog, katibMetadata: this.state.metadata.katib_metadata || DefaultKatibMetadata, updateKatibMetadata: this.updateKatibMetadata, kernel: this.props.kernel }))));
    }
}
exports.KubeflowKaleLeftPanel = KubeflowKaleLeftPanel;
