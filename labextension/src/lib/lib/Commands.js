"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RPCUtils_1 = require("./RPCUtils");
const Utils_1 = require("./Utils");
const LeftPanel_1 = require("../widgets/LeftPanel");
const NotebookUtils_1 = __importDefault(require("./NotebookUtils"));
const VolumesPanel_1 = require("../widgets/VolumesPanel");
const CellUtils_1 = __importDefault(require("./CellUtils"));
var RUN_CELL_STATUS;
(function (RUN_CELL_STATUS) {
    RUN_CELL_STATUS["OK"] = "ok";
    RUN_CELL_STATUS["ERROR"] = "error";
})(RUN_CELL_STATUS || (RUN_CELL_STATUS = {}));
class Commands {
    constructor(notebook, kernel) {
        this.snapshotNotebook = async () => {
            return await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'rok.snapshot_notebook');
        };
        this.getSnapshotProgress = async (task_id, ms) => {
            const task = await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'rok.get_task', {
                task_id,
            });
            if (ms) {
                await Utils_1.wait(ms);
            }
            return task;
        };
        this.runSnapshotProcedure = async (onUpdate) => {
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
            }
            else if (task.status === 'error') {
                console.error('Snapshotting failed');
                console.error('Stopping the deployment...');
            }
            else if (task.status === 'canceled') {
                console.error('Snapshotting canceled');
                console.error('Stopping the deployment...');
            }
            return null;
        };
        this.replaceClonedVolumes = async (bucket, obj, version, volumes) => {
            return await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'rok.replace_cloned_volumes', {
                bucket,
                obj,
                version,
                volumes,
            });
        };
        this.getMountedVolumes = async (currentNotebookVolumes) => {
            let notebookVolumes = await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'nb.list_volumes');
            let availableVolumeTypes = VolumesPanel_1.SELECT_VOLUME_TYPES.map(t => {
                return t.value === 'snap' ? Object.assign(Object.assign({}, t), { invalid: false }) : t;
            });
            if (notebookVolumes) {
                notebookVolumes = notebookVolumes.map(volume => {
                    const sizeGroup = VolumesPanel_1.SELECT_VOLUME_SIZE_TYPES.filter(s => volume.size >= s.base)[0];
                    volume.size = Math.ceil(volume.size / sizeGroup.base);
                    volume.size_type = sizeGroup.value;
                    volume.annotations = [];
                    return volume;
                });
                availableVolumeTypes = availableVolumeTypes.map(t => {
                    return t.value === 'clone' ? Object.assign(Object.assign({}, t), { invalid: false }) : t;
                });
            }
            else {
                notebookVolumes = currentNotebookVolumes;
            }
            return {
                notebookVolumes,
                selectVolumeTypes: availableVolumeTypes,
            };
        };
        this.unmarshalData = async (nbFileName) => {
            const cmd = `from kale.rpc.nb import unmarshal_data as __kale_rpc_unmarshal_data\n` +
                `locals().update(__kale_rpc_unmarshal_data("${nbFileName}"))`;
            console.log('Executing command: ' + cmd);
            await NotebookUtils_1.default.sendKernelRequestFromNotebook(this._notebook, cmd, {});
        };
        this.getBaseImage = async () => {
            let baseImage = null;
            try {
                baseImage = await RPCUtils_1._legacy_executeRpc(this._notebook, this._kernel, 'nb.get_base_image');
            }
            catch (error) {
                if (error instanceof RPCUtils_1.RPCError) {
                    console.warn('Kale is not running in a Notebook Server', error.error);
                }
                else {
                    throw error;
                }
            }
            return baseImage;
        };
        this.getExperiments = async (experiment, experimentName) => {
            let experimentsList = await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'kfp.list_experiments');
            if (experimentsList) {
                experimentsList.push(LeftPanel_1.NEW_EXPERIMENT);
            }
            else {
                experimentsList = [LeftPanel_1.NEW_EXPERIMENT];
            }
            // Fix experiment metadata
            let newExperiment = null;
            let selectedExperiments = experimentsList.filter(e => e.id === experiment.id ||
                e.name === experiment.name ||
                e.name === experimentName);
            if (selectedExperiments.length === 0 ||
                selectedExperiments[0].id === LeftPanel_1.NEW_EXPERIMENT.id) {
                let name = experimentsList[0].name;
                if (name === LeftPanel_1.NEW_EXPERIMENT.name) {
                    name = experiment.name !== '' ? experiment.name : experimentName;
                }
                newExperiment = Object.assign(Object.assign({}, experimentsList[0]), { name: name });
            }
            else {
                newExperiment = selectedExperiments[0];
            }
            return {
                experiments: experimentsList,
                experiment: newExperiment,
                experiment_name: newExperiment.name,
            };
        };
        this.validateMetadata = async (notebookPath, metadata, onUpdate) => {
            onUpdate({ showValidationProgress: true });
            const validateNotebookArgs = {
                source_notebook_path: notebookPath,
                notebook_metadata_overrides: metadata,
            };
            const validateNotebook = await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'nb.validate_notebook', validateNotebookArgs);
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
        this.getCompileWarnings = (metadata) => {
            let warningContent = [];
            // in case the notebook's docker base image is different than the default
            // one (e.g. the one detected in the Notebook Server), alert the user
            if (LeftPanel_1.DefaultState.metadata.docker_image !== '' &&
                metadata.docker_image !== LeftPanel_1.DefaultState.metadata.docker_image) {
                warningContent.push('The image you used to create the notebook server is different ' +
                    'from the image you have selected for your pipeline.', '', 'Your Kubeflow pipeline will use the following image: <pre><b>' +
                    metadata.docker_image +
                    '</b></pre>', 'You created the notebook server using the following image: <pre><b>' +
                    LeftPanel_1.DefaultState.metadata.docker_image +
                    '</b></pre>', '', "To use this notebook server's image as base image" +
                    ' for the pipeline steps, delete the existing docker image' +
                    ' from the Advanced Settings section.');
            }
            return warningContent;
        };
        // todo: docManager needs to be passed to deploysProgress during init
        // todo: autosnapshot will become part of metadata
        // todo: deployDebugMessage will be removed (the "Debug" toggle is of no use
        //  anymore
        this.compilePipeline = async (notebookPath, metadata, docManager, deployDebugMessage, onUpdate) => {
            // after parsing and validating the metadata, show warnings (if necessary)
            const compileWarnings = this.getCompileWarnings(metadata);
            onUpdate({ showCompileProgress: true, docManager: docManager });
            if (compileWarnings.length) {
                onUpdate({ compileWarnings });
            }
            const compileNotebookArgs = {
                source_notebook_path: notebookPath,
                notebook_metadata_overrides: metadata,
                debug: deployDebugMessage,
            };
            const compileNotebook = await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'nb.compile_notebook', compileNotebookArgs);
            if (!compileNotebook) {
                onUpdate({ compiledPath: 'error' });
                await NotebookUtils_1.default.showMessage('Operation Failed', [
                    'Could not compile pipeline.',
                ]);
            }
            else {
                // Pass to the deploy progress the path to the generated py script:
                // compileNotebook is the name of the tar package, that generated in the
                // workdir. Instead, the python script has a slightly different name and
                // is generated in the same directory where the notebook lives.
                onUpdate({
                    compiledPath: compileNotebook.pipeline_package_path.replace('pipeline.yaml', 'kale.py'),
                });
            }
            return compileNotebook;
        };
        this.uploadPipeline = async (compiledPackagePath, compiledPipelineMetadata, onUpdate) => {
            onUpdate({ showUploadProgress: true });
            const uploadPipelineArgs = {
                pipeline_package_path: compiledPackagePath,
                pipeline_metadata: compiledPipelineMetadata,
            };
            let uploadPipeline = await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'kfp.upload_pipeline', uploadPipelineArgs);
            let result = true;
            if (!uploadPipeline) {
                onUpdate({ showUploadProgress: false, pipeline: false });
                return uploadPipeline;
            }
            if (uploadPipeline && result) {
                onUpdate({ pipeline: uploadPipeline });
            }
            return uploadPipeline;
        };
        this.runKatib = async (notebookPath, metadata, pipelineId, versionId, onUpdate) => {
            onUpdate({ showKatibKFPExperiment: true });
            // create a new experiment, using the base name of the currently
            // selected one
            const newExpName = metadata.experiment.name +
                '-' +
                Math.random()
                    .toString(36)
                    .slice(2, 7);
            // create new KFP experiment
            let kfpExperiment;
            try {
                kfpExperiment = await RPCUtils_1._legacy_executeRpc(this._notebook, this._kernel, 'kfp.create_experiment', {
                    experiment_name: newExpName,
                });
                onUpdate({ katibKFPExperiment: kfpExperiment });
            }
            catch (error) {
                onUpdate({
                    showKatibProgress: false,
                    katibKFPExperiment: { id: 'error', name: 'error' },
                });
                throw error;
            }
            onUpdate({ showKatibProgress: true });
            const runKatibArgs = {
                pipeline_id: pipelineId,
                version_id: versionId,
                pipeline_metadata: Object.assign(Object.assign({}, metadata), { experiment_name: kfpExperiment.name }),
                output_path: notebookPath.substring(0, notebookPath.lastIndexOf('/')),
            };
            let katibExperiment = null;
            try {
                katibExperiment = await RPCUtils_1._legacy_executeRpc(this._notebook, this._kernel, 'katib.create_katib_experiment', runKatibArgs);
            }
            catch (error) {
                onUpdate({ katib: { status: 'error' } });
                throw error;
            }
            return katibExperiment;
        };
        this.runPipeline = async (pipelineId, versionId, compiledPipelineMetadata, onUpdate) => {
            onUpdate({ showRunProgress: true });
            const runPipelineArgs = {
                pipeline_metadata: compiledPipelineMetadata,
                pipeline_id: pipelineId,
                version_id: versionId,
            };
            const runPipeline = await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'kfp.run_pipeline', runPipelineArgs);
            if (runPipeline) {
                onUpdate({ runPipeline });
            }
            else {
                onUpdate({ showRunProgress: false, runPipeline: false });
            }
            return runPipeline;
        };
        this.resumeStateIfExploreNotebook = async (notebookPath) => {
            const exploration = await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'nb.explore_notebook', { source_notebook_path: notebookPath });
            if (!exploration || !exploration.is_exploration) {
                return;
            }
            NotebookUtils_1.default.clearCellOutputs(this._notebook);
            let title = 'Notebook Exploration';
            let message = [];
            let runCellResponse = await NotebookUtils_1.default.runGlobalCells(this._notebook);
            if (runCellResponse.status === RUN_CELL_STATUS.OK) {
                // unmarshalData runs in the same kernel as the .ipynb, so it requires the
                // filename
                await this.unmarshalData(notebookPath.split('/').pop());
                const cell = CellUtils_1.default.getCellByStepName(this._notebook, exploration.step_name);
                message = [
                    `Resuming notebook ${exploration.final_snapshot ? 'after' : 'before'} step: "${exploration.step_name}"`,
                ];
                if (cell) {
                    NotebookUtils_1.default.selectAndScrollToCell(this._notebook, cell);
                }
                else {
                    message.push(`ERROR: Could not retrieve step's position.`);
                }
            }
            else {
                message = [
                    `Executing "${runCellResponse.cellType}" cell failed.\n` +
                        `Resuming notebook at cell index ${runCellResponse.cellIndex}.`,
                    `Error name: ${runCellResponse.ename}`,
                    `Error value: ${runCellResponse.evalue}`,
                ];
            }
            await NotebookUtils_1.default.showMessage(title, message);
            await RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'nb.remove_marshal_dir', {
                source_notebook_path: notebookPath,
            });
        };
        this.findPodDefaultLabelsOnServer = async () => {
            let labels = {};
            try {
                return await RPCUtils_1._legacy_executeRpc(this._notebook, this._kernel, 'nb.find_poddefault_labels_on_server');
            }
            catch (error) {
                console.error('Failed to retrieve PodDefaults applied on server', error);
                return labels;
            }
        };
        this.getNamespace = async () => {
            try {
                return await RPCUtils_1._legacy_executeRpc(this._notebook, this._kernel, 'nb.get_namespace');
            }
            catch (error) {
                console.error("Failed to retrieve notebook's namespace");
                return '';
            }
        };
        this._notebook = notebook;
        this._kernel = kernel;
    }
    pollRun(runPipeline, onUpdate) {
        RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'kfp.get_run', {
            run_id: runPipeline.id,
        }).then(run => {
            onUpdate({ runPipeline: run });
            if (run && (run.status === 'Running' || run.status === null)) {
                setTimeout(() => this.pollRun(run, onUpdate), 2000);
            }
        });
    }
    pollKatib(katibExperiment, onUpdate) {
        const getExperimentArgs = {
            experiment: katibExperiment.name,
            namespace: katibExperiment.namespace,
        };
        RPCUtils_1._legacy_executeRpcAndShowRPCError(this._notebook, this._kernel, 'katib.get_experiment', getExperimentArgs).then(katib => {
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
}
exports.default = Commands;
