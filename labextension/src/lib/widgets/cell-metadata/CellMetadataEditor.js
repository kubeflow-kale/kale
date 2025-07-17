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
const TagsUtils_1 = __importDefault(require("../../lib/TagsUtils"));
const cells_1 = require("@jupyterlab/cells");
const Close_1 = __importDefault(require("@material-ui/icons/Close"));
const ColorUtils_1 = __importDefault(require("../../lib/ColorUtils"));
const CellMetadataContext_1 = require("../../lib/CellMetadataContext");
const core_1 = require("@material-ui/core");
const CellMetadataEditorDialog_1 = require("./CellMetadataEditorDialog");
const Input_1 = require("../../components/Input");
const Select_1 = require("../../components/Select");
const SelectMulti_1 = require("../../components/SelectMulti");
const CELL_TYPES = [
    { value: 'imports', label: 'Imports' },
    { value: 'functions', label: 'Functions' },
    { value: 'pipeline-parameters', label: 'Pipeline Parameters' },
    { value: 'pipeline-metrics', label: 'Pipeline Metrics' },
    { value: 'step', label: 'Pipeline Step' },
    { value: 'skip', label: 'Skip Cell' },
];
exports.RESERVED_CELL_NAMES = [
    'imports',
    'functions',
    'pipeline-parameters',
    'pipeline-metrics',
    'skip',
];
exports.RESERVED_CELL_NAMES_HELP_TEXT = {
    imports: 'The code in this cell will be pre-pended to every step of the pipeline.',
    functions: 'The code in this cell will be pre-pended to every step of the pipeline,' +
        ' after `imports`.',
    'pipeline-parameters': 'The variables in this cell will be transformed into pipeline parameters,' +
        ' preserving the current values as defaults.',
    'pipeline-metrics': 'The variables in this cell will be transformed into pipeline metrics.',
    skip: 'This cell will be skipped and excluded from pipeline steps',
};
exports.RESERVED_CELL_NAMES_CHIP_COLOR = {
    skip: 'a9a9a9',
    'pipeline-parameters': 'ee7a1a',
    'pipeline-metrics': '773d0d',
    imports: 'a32626',
    functions: 'a32626',
};
const STEP_NAME_ERROR_MSG = `Step name must consist of lower case alphanumeric
 characters or \'_\', and can not start with a digit.`;
const DefaultState = {
    previousStepName: null,
    stepNameErrorMsg: STEP_NAME_ERROR_MSG,
    blockDependenciesChoices: [],
    cellMetadataEditorDialog: false,
};
/**
 * Component that allow to edit the Kale cell tags of a notebook cell.
 */
class CellMetadataEditor extends React.Component {
    constructor(props) {
        super(props);
        this.editorRef = null;
        this.updateCurrentCellType = (value) => {
            if (exports.RESERVED_CELL_NAMES.includes(value)) {
                this.updateCurrentBlockName(value);
            }
            else {
                TagsUtils_1.default.resetCell(this.props.notebook, this.context.activeCellIndex, this.props.stepName);
            }
        };
        this.updateCurrentBlockName = (value) => {
            const oldBlockName = this.props.stepName;
            let currentCellMetadata = {
                prevBlockNames: this.props.stepDependencies,
                limits: this.props.limits,
                blockName: value,
            };
            TagsUtils_1.default.setKaleCellTags(this.props.notebook, this.context.activeCellIndex, currentCellMetadata, false).then(oldValue => {
                TagsUtils_1.default.updateKaleCellsTags(this.props.notebook, oldBlockName, value);
            });
        };
        /**
         * Even handler of the MultiSelect used to select the dependencies of a block
         */
        this.updatePrevBlocksNames = (previousBlocks) => {
            let currentCellMetadata = {
                blockName: this.props.stepName,
                limits: this.props.limits,
                prevBlockNames: previousBlocks,
            };
            TagsUtils_1.default.setKaleCellTags(this.props.notebook, this.context.activeCellIndex, currentCellMetadata, true);
        };
        /**
         * Event triggered when the the CellMetadataEditorDialog dialog is closed
         */
        this.updateCurrentLimits = (actions) => {
            let limits = Object.assign({}, this.props.limits);
            actions.forEach(action => {
                if (action.action === 'update') {
                    limits[action.limitKey] = action.limitValue;
                }
                if (action.action === 'delete' &&
                    Object.keys(this.props.limits).includes(action.limitKey)) {
                    delete limits[action.limitKey];
                }
            });
            let currentCellMetadata = {
                blockName: this.props.stepName,
                prevBlockNames: this.props.stepDependencies,
                limits: limits,
            };
            TagsUtils_1.default.setKaleCellTags(this.props.notebook, this.context.activeCellIndex, currentCellMetadata, true);
        };
        /**
         * Function called before updating the value of the block name input text
         * field. It acts as a validator.
         */
        this.onBeforeUpdate = (value) => {
            if (value === this.props.stepName) {
                return false;
            }
            const blockNames = TagsUtils_1.default.getAllBlocks(this.props.notebook.content);
            if (blockNames.includes(value)) {
                this.setState({ stepNameErrorMsg: 'This name already exists.' });
                return true;
            }
            this.setState({ stepNameErrorMsg: STEP_NAME_ERROR_MSG });
            return false;
        };
        this.getPrevStepNotice = () => {
            return this.state.previousStepName && this.props.stepName === ''
                ? `Leave the step name empty to merge the cell to step '${this.state.previousStepName}'`
                : null;
        };
        // We use this element reference in order to move it inside Notebooks's cell
        // element.
        this.editorRef = React.createRef();
        this.state = DefaultState;
        this.updateCurrentBlockName = this.updateCurrentBlockName.bind(this);
        this.updateCurrentCellType = this.updateCurrentCellType.bind(this);
        this.updatePrevBlocksNames = this.updatePrevBlocksNames.bind(this);
        this.toggleTagsEditorDialog = this.toggleTagsEditorDialog.bind(this);
    }
    componentWillUnmount() {
        const editor = this.editorRef.current;
        if (editor) {
            editor.remove();
        }
    }
    isEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    /**
     * When the activeCellIndex of the editor changes, the editor needs to be
     * moved to the correct position.
     */
    moveEditor() {
        if (!this.props.notebook) {
            return;
        }
        // get the HTML element corresponding to the current active cell
        const metadataWrapper = this.props.notebook.content.node.childNodes[this.context.activeCellIndex];
        const editor = this.editorRef.current;
        const inlineElement = metadataWrapper.querySelector('.kale-inline-cell-metadata');
        const elem = metadataWrapper.querySelector('.moved');
        if (elem && !elem.querySelector('.kale-metadata-editor-wrapper')) {
            elem.insertBefore(editor, inlineElement.nextSibling);
        }
    }
    componentDidUpdate(prevProps, prevState) {
        this.hideEditorIfNotCodeCell();
        this.moveEditor();
        this.setState(this.updateBlockDependenciesChoices);
        this.setState(this.updatePreviousStepName);
    }
    hideEditorIfNotCodeCell() {
        if (this.props.notebook && !this.props.notebook.isDisposed) {
            const cellModel = this.props.notebook.model.cells.get(this.context.activeCellIndex);
            if (!cells_1.isCodeCellModel(cellModel) && this.context.isEditorVisible) {
                this.closeEditor();
            }
        }
    }
    /**
     * Scan the notebook for all block tags and get them all, excluded the current
     * one (and the reserved cell tags) The value `previousBlockChoices` is used
     * by the dependencies select option to select the current step's
     * dependencies.
     */
    updateBlockDependenciesChoices(state, props) {
        if (!props.notebook) {
            return null;
        }
        const allBlocks = TagsUtils_1.default.getAllBlocks(props.notebook.content);
        const dependencyChoices = allBlocks
            // remove all reserved names and current step name
            .filter(el => !exports.RESERVED_CELL_NAMES.includes(el) && !(el === props.stepName))
            .map(name => ({ value: name, color: `#${ColorUtils_1.default.getColor(name)}` }));
        if (this.isEqual(state.blockDependenciesChoices, dependencyChoices)) {
            return null;
        }
        // XXX (stefano): By setting state.cellMetadataEditorDialog NOT optional,
        // XXX (stefano): this return will require cellMetadataEditorDialog.
        return { blockDependenciesChoices: dependencyChoices };
    }
    updatePreviousStepName(state, props) {
        if (!props.notebook) {
            return null;
        }
        const prevBlockName = TagsUtils_1.default.getPreviousBlock(props.notebook.content, this.context.activeCellIndex);
        if (prevBlockName === this.state.previousStepName) {
            return null;
        }
        // XXX (stefano): By setting state.cellMetadataEditorDialog NOT optional,
        // XXX (stefano): this return will require cellMetadataEditorDialog.
        return { previousStepName: prevBlockName };
    }
    /**
     * Event handler of close button, positioned on the top right of the cell
     */
    closeEditor() {
        this.context.onEditorVisibilityChange(false);
    }
    toggleTagsEditorDialog() {
        this.setState({
            cellMetadataEditorDialog: !this.state.cellMetadataEditorDialog,
        });
    }
    render() {
        const cellType = exports.RESERVED_CELL_NAMES.includes(this.props.stepName)
            ? this.props.stepName
            : 'step';
        const cellColor = this.props.stepName
            ? `#${ColorUtils_1.default.getColor(this.props.stepName)}`
            : 'transparent';
        const prevStepNotice = this.getPrevStepNotice();
        return (React.createElement(React.Fragment, null,
            React.createElement("div", null,
                React.createElement("div", { className: 'kale-metadata-editor-wrapper' +
                        (this.context.isEditorVisible ? ' opened' : '') +
                        (cellType === 'step' ? ' kale-is-step' : ''), ref: this.editorRef },
                    React.createElement("div", { className: 'kale-cell-metadata-editor' +
                            (this.context.isEditorVisible ? '' : ' hidden'), style: { borderLeft: `2px solid ${cellColor}` } },
                        React.createElement(Select_1.Select, { updateValue: this.updateCurrentCellType, values: CELL_TYPES, value: cellType, label: 'Cell type', index: 0, variant: "outlined", style: { width: '30%' } }),
                        cellType === 'step' ? (React.createElement(Input_1.Input, { label: 'Step name', updateValue: this.updateCurrentBlockName, value: this.props.stepName || '', regex: '^([_a-z]([_a-z0-9]*)?)?$', regexErrorMsg: this.state.stepNameErrorMsg, variant: "outlined", onBeforeUpdate: this.onBeforeUpdate, style: { width: '30%' } })) : (''),
                        cellType === 'step' ? (React.createElement(SelectMulti_1.SelectMulti, { id: "select-previous-blocks", label: "Depends on", disabled: !(this.props.stepName && this.props.stepName.length > 0), updateSelected: this.updatePrevBlocksNames, options: this.state.blockDependenciesChoices, variant: "outlined", selected: this.props.stepDependencies || [], style: { width: '35%' } })) : (''),
                        cellType === 'step' ? (React.createElement("div", { style: { padding: 0 } },
                            React.createElement(core_1.Button, { disabled: !(this.props.stepName && this.props.stepName.length > 0), color: "primary", variant: "contained", size: "small", title: "GPU", onClick: _ => this.toggleTagsEditorDialog(), style: { width: '5%' } }, "GPU"))) : (''),
                        React.createElement(core_1.IconButton, { "aria-label": "delete", onClick: () => this.closeEditor() },
                            React.createElement(Close_1.default, { fontSize: "small" }))),
                    React.createElement("div", { className: 'kale-cell-metadata-editor-helper-text' +
                            (this.context.isEditorVisible ? '' : ' hidden') },
                        React.createElement("p", null, prevStepNotice)))),
            React.createElement(CellMetadataEditorDialog_1.CellMetadataEditorDialog, { open: this.state.cellMetadataEditorDialog, toggleDialog: this.toggleTagsEditorDialog, stepName: this.props.stepName, limits: this.props.limits || {}, updateLimits: this.updateCurrentLimits })));
    }
}
exports.CellMetadataEditor = CellMetadataEditor;
CellMetadataEditor.contextType = CellMetadataContext_1.CellMetadataContext;
