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
const core_1 = require("@material-ui/core");
const ColorUtils_1 = __importDefault(require("../../lib/ColorUtils"));
const CellMetadataEditor_1 = require("./CellMetadataEditor");
const Edit_1 = __importDefault(require("@material-ui/icons/Edit"));
const CellMetadataContext_1 = require("../../lib/CellMetadataContext");
const DefaultState = {
    cellTypeClass: '',
    color: '',
    dependencies: [],
    showEditor: false,
    isMergedCell: false,
};
/**
 * This component is used by InlineCellMetadata to display some state information
 * on top of each cell that is tagged with Kale tags.
 *
 * When a cell is tagged with a step name and some dependencies, a chip with the
 * step name and a series of coloured dots for its dependencies are show.
 */
class InlineMetadata extends React.Component {
    constructor(props) {
        super(props);
        this.wrapperRef = null;
        this.state = DefaultState;
        this.updateEditorState = (state, props) => {
            let showEditor = false;
            if (this.context.isEditorVisible) {
                if (this.context.activeCellIndex === props.cellIndex) {
                    showEditor = true;
                }
            }
            if (showEditor === state.showEditor) {
                return null;
            }
            return { showEditor };
        };
        this.updateIsMergedState = (state, props) => {
            let newIsMergedCell = false;
            const cellElement = props.cellElement;
            if (!props.blockName) {
                newIsMergedCell = true;
                // TODO: This is a side effect, consider moving it somewhere else.
                cellElement.classList.add('kale-merged-cell');
            }
            else {
                cellElement.classList.remove('kale-merged-cell');
            }
            if (newIsMergedCell === state.isMergedCell) {
                return null;
            }
            return { isMergedCell: newIsMergedCell };
        };
        // We use this element referene in order to move it inside Notebooks's cell
        // element.
        this.wrapperRef = React.createRef();
        this.openEditor = this.openEditor.bind(this);
    }
    componentDidMount() {
        this.setState(this.updateIsMergedState);
        this.checkIfReservedName();
        this.updateStyles();
        this.updateDependencies();
        this.moveComponentElementInCell();
    }
    moveComponentElementInCell() {
        if (this.wrapperRef &&
            !this.wrapperRef.current.classList.contains('moved')) {
            this.wrapperRef.current.classList.add('moved');
            this.props.cellElement.insertAdjacentElement('afterbegin', this.wrapperRef.current);
        }
    }
    componentWillUnmount() {
        const cellElement = this.props.cellElement;
        cellElement.classList.remove('kale-merged-cell');
        const codeMirrorElem = cellElement.querySelector('.CodeMirror');
        if (codeMirrorElem) {
            codeMirrorElem.style.border = '';
        }
        if (this.wrapperRef) {
            this.wrapperRef.current.remove();
        }
    }
    componentDidUpdate(prevProps, prevState) {
        this.setState(this.updateIsMergedState);
        if (prevProps.blockName !== this.props.blockName ||
            prevProps.previousBlockName !== this.props.previousBlockName) {
            this.updateStyles();
        }
        if (prevProps.stepDependencies !== this.props.stepDependencies) {
            this.updateDependencies();
        }
        this.checkIfReservedName();
        this.setState(this.updateEditorState);
    }
    /**
     * Check if the block tag of che current cell has a reserved name. If so,
     * apply the corresponding css class to the HTML Cell element.
     */
    checkIfReservedName() {
        this.setState((state, props) => {
            let cellTypeClass = '';
            if (CellMetadataEditor_1.RESERVED_CELL_NAMES.includes(props.blockName)) {
                cellTypeClass = 'kale-reserved-cell';
            }
            if (cellTypeClass === state.cellTypeClass) {
                return null;
            }
            return { cellTypeClass };
        });
    }
    /**
     * Update the style of the active cell, by changing the left border with
     * the correct color, based on the current block name.
     */
    updateStyles() {
        const name = this.props.blockName || this.props.previousBlockName;
        const codeMirrorElem = this.props.cellElement.querySelector('.CodeMirror');
        if (codeMirrorElem) {
            codeMirrorElem.style.borderLeft = `2px solid transparent`;
        }
        if (!name) {
            this.setState({ color: '' });
            return;
        }
        const rgb = this.getColorFromName(name);
        this.setState({ color: rgb });
        if (codeMirrorElem) {
            codeMirrorElem.style.borderLeft = `2px solid #${rgb}`;
        }
    }
    getColorFromName(name) {
        return ColorUtils_1.default.getColor(name);
    }
    createLimitsText() {
        const gpuType = Object.keys(this.props.limits).includes('nvidia.com/gpu')
            ? 'nvidia.com/gpu'
            : Object.keys(this.props.limits).includes('amd.com/gpu')
                ? 'amd.com/gpu'
                : undefined;
        return gpuType !== undefined ? (React.createElement(React.Fragment, null,
            React.createElement("p", { style: { fontStyle: 'italic', marginLeft: '10px' } },
                "GPU request: ",
                gpuType + ' - ',
                this.props.limits[gpuType]))) : ('');
    }
    /**
     * Create a list of div dots that represent the dependencies of the current
     * block
     */
    updateDependencies() {
        const dependencies = this.props.stepDependencies.map((name, i) => {
            const rgb = this.getColorFromName(name);
            return (React.createElement(core_1.Tooltip, { placement: "top", key: i, title: name },
                React.createElement("div", { className: "kale-inline-cell-dependency", style: {
                        backgroundColor: `#${rgb}`,
                    } })));
        });
        this.setState({ dependencies });
    }
    openEditor() {
        const showEditor = true;
        this.setState({ showEditor });
        this.context.onEditorVisibilityChange(showEditor);
    }
    render() {
        const details = CellMetadataEditor_1.RESERVED_CELL_NAMES.includes(this.props.blockName) ? null : (React.createElement(React.Fragment, null,
            this.state.dependencies.length > 0 ? (React.createElement("p", { style: { fontStyle: 'italic', margin: '0 5px' } }, "depends on: ")) : null,
            this.state.dependencies,
            this.createLimitsText()));
        return (React.createElement("div", null,
            React.createElement("div", { ref: this.wrapperRef },
                React.createElement("div", { className: 'kale-inline-cell-metadata' +
                        (this.state.isMergedCell ? ' hidden' : '') },
                    CellMetadataEditor_1.RESERVED_CELL_NAMES.includes(this.props.blockName) ? ('') : (React.createElement("p", { style: { fontStyle: 'italic', marginRight: '5px' } }, "step: ")),
                    React.createElement(core_1.Tooltip, { placement: "top", key: this.props.blockName + 'tooltip', title: CellMetadataEditor_1.RESERVED_CELL_NAMES.includes(this.props.blockName)
                            ? CellMetadataEditor_1.RESERVED_CELL_NAMES_HELP_TEXT[this.props.blockName]
                            : 'This cell starts the pipeline step: ' +
                                this.props.blockName },
                        React.createElement(core_1.Chip, { className: `kale-chip ${this.state.cellTypeClass}`, style: { backgroundColor: `#${this.state.color}` }, key: this.props.blockName, label: this.props.blockName })),
                    details),
                React.createElement("div", { style: { position: 'relative' }, className: this.state.showEditor ? ' hidden' : '' },
                    React.createElement("button", { className: "kale-editor-toggle", onClick: this.openEditor },
                        React.createElement(Edit_1.default, null))))));
    }
}
exports.InlineMetadata = InlineMetadata;
InlineMetadata.contextType = CellMetadataContext_1.CellMetadataContext;
