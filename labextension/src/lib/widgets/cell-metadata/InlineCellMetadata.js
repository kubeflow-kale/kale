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
const cells_1 = require("@jupyterlab/cells");
const CellUtils_1 = __importDefault(require("../../lib/CellUtils"));
const TagsUtils_1 = __importDefault(require("../../lib/TagsUtils"));
const InlineMetadata_1 = require("./InlineMetadata");
const CellMetadataEditor_1 = require("./CellMetadataEditor");
const CellMetadataContext_1 = require("../../lib/CellMetadataContext");
const core_1 = require("@material-ui/core");
const NotebookUtils_1 = __importDefault(require("../../lib/NotebookUtils"));
const DefaultState = {
    activeCellIndex: 0,
    prevBlockName: null,
    metadataCmp: [],
    checked: false,
    editors: {},
    isEditorVisible: false,
};
class InlineCellsMetadata extends React.Component {
    constructor(props) {
        super(props);
        this.state = DefaultState;
        this.componentDidMount = () => {
            if (this.props.notebook) {
                this.connectAndInitWhenReady(this.props.notebook);
            }
        };
        this.componentDidUpdate = async (prevProps, prevState) => {
            if (!this.props.notebook && prevProps.notebook) {
                // no notebook
                this.clearEditorsPropsAndInlineMetadata();
            }
            const preNotebookId = prevProps.notebook ? prevProps.notebook.id : '';
            const notebookId = this.props.notebook ? this.props.notebook.id : '';
            if (preNotebookId !== notebookId) {
                // notebook changed
                if (prevProps.notebook) {
                    this.disconnectHandlersFromNotebook(prevProps.notebook);
                }
                if (this.props.notebook) {
                    this.connectAndInitWhenReady(this.props.notebook);
                }
                // hide editor on notebook change
                this.setState({ isEditorVisible: false });
            }
        };
        this.connectAndInitWhenReady = (notebook) => {
            notebook.context.ready.then(() => {
                this.connectHandlersToNotebook(this.props.notebook);
                this.refreshEditorsPropsAndInlineMetadata();
                this.setState({
                    activeCellIndex: notebook.content.activeCellIndex,
                });
            });
        };
        this.connectHandlersToNotebook = (notebook) => {
            notebook.context.saveState.connect(this.handleSaveState);
            notebook.content.activeCellChanged.connect(this.onActiveCellChanged);
            notebook.model.cells.changed.connect(this.handleCellChange);
        };
        this.disconnectHandlersFromNotebook = (notebook) => {
            notebook.context.saveState.disconnect(this.handleSaveState);
            notebook.content.activeCellChanged.disconnect(this.onActiveCellChanged);
            // when closing the notebook tab, notebook.model becomes null
            if (notebook.model) {
                notebook.model.cells.changed.disconnect(this.handleCellChange);
            }
        };
        this.onActiveCellChanged = (notebook, activeCell) => {
            this.setState({
                activeCellIndex: notebook.activeCellIndex,
            });
        };
        this.handleSaveState = (context, state) => {
            if (this.state.checked && state === 'completed') {
                this.generateEditorsPropsAndInlineMetadata();
            }
        };
        this.handleCellChange = (cells, args) => {
            this.refreshEditorsPropsAndInlineMetadata();
            const prevValue = args.oldValues[0];
            // Change type 'set' is when a cell changes its type. Even if a user changes
            // multiple cells using Shift + click the args.oldValues has only one cell
            // each time.
            if (args.type === 'set' && prevValue instanceof cells_1.CodeCellModel) {
                CellUtils_1.default.setCellMetaData(this.props.notebook, args.newIndex, 'tags', [], true);
            }
            // Change type 'remove' is when a cell is removed from the notebook.
            if (args.type === 'remove') {
                TagsUtils_1.default.removeOldDependencies(this.props.notebook, prevValue);
            }
        };
        this.clearEditorsPropsAndInlineMetadata = (callback) => {
            // triggers cleanup in InlineMetadata
            this.setState({ metadataCmp: [], editors: {} }, () => {
                if (callback) {
                    callback();
                }
            });
        };
        this.generateEditorsPropsAndInlineMetadata = () => {
            if (!this.props.notebook) {
                return;
            }
            const metadata = [];
            const editors = {};
            const cells = this.props.notebook.model.cells;
            for (let index = 0; index < cells.length; index++) {
                const isCodeCell = cells_1.isCodeCellModel(this.props.notebook.model.cells.get(index));
                if (!isCodeCell) {
                    continue;
                }
                let tags = TagsUtils_1.default.getKaleCellTags(this.props.notebook.content, index);
                if (!tags) {
                    tags = {
                        blockName: '',
                        prevBlockNames: [],
                    };
                }
                let previousBlockName = '';
                if (!tags.blockName) {
                    previousBlockName = TagsUtils_1.default.getPreviousBlock(this.props.notebook.content, index);
                }
                editors[index] = {
                    notebook: this.props.notebook,
                    stepName: tags.blockName || '',
                    stepDependencies: tags.prevBlockNames || [],
                    limits: tags.limits || {},
                };
                metadata.push(React.createElement(InlineMetadata_1.InlineMetadata, { key: index, cellElement: this.props.notebook.content.node.childNodes[index], blockName: tags.blockName, stepDependencies: tags.prevBlockNames, limits: tags.limits || {}, previousBlockName: previousBlockName, cellIndex: index }));
            }
            this.setState({
                metadataCmp: metadata,
                editors: editors,
            });
        };
        this.onEditorVisibilityChange = this.onEditorVisibilityChange.bind(this);
    }
    /**
     * Event handler for the global Kale switch (the one below the Kale title in
     * the left panel). Enabling the switch propagates to the father component
     * (LeftPanel) to enable the rest of the UI.
     */
    toggleGlobalKaleSwitch(checked) {
        this.setState({ checked });
        this.props.onMetadataEnable(checked);
        if (checked) {
            this.generateEditorsPropsAndInlineMetadata();
            // When drawing cell metadata on Kale enable/disable, the targeted
            // cell may be lost. Therefore, we select and scroll to the active
            // cell.
            if (this.props.notebook && this.props.notebook.content.activeCellIndex) {
                setTimeout(NotebookUtils_1.default.selectAndScrollToCell, 200, this.props.notebook, {
                    cell: this.props.notebook.content.activeCell,
                    index: this.props.notebook.content.activeCellIndex,
                });
            }
        }
        else {
            this.setState({ isEditorVisible: false });
            this.clearEditorsPropsAndInlineMetadata();
        }
    }
    refreshEditorsPropsAndInlineMetadata() {
        if (this.state.checked) {
            this.clearEditorsPropsAndInlineMetadata(() => {
                this.generateEditorsPropsAndInlineMetadata();
            });
            this.setState({ isEditorVisible: false });
        }
    }
    /**
     * Callback passed to the CellMetadataEditor context
     */
    onEditorVisibilityChange(isEditorVisible) {
        this.setState({ isEditorVisible });
    }
    render() {
        // Get the editor props of the active cell, so that just one editor is
        // rendered at any given time.
        const editorProps = Object.assign({}, this.state.editors[this.state.activeCellIndex]);
        return (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "toolbar input-container" },
                React.createElement("div", { className: 'switch-label' }, "Enable"),
                React.createElement(core_1.Switch, { checked: this.state.checked, onChange: c => this.toggleGlobalKaleSwitch(c.target.checked), color: "primary", name: "enableKale", inputProps: { 'aria-label': 'primary checkbox' }, classes: { root: 'material-switch' } })),
            React.createElement("div", { className: "hidden" },
                React.createElement(CellMetadataContext_1.CellMetadataContext.Provider, { value: {
                        activeCellIndex: this.state.activeCellIndex,
                        isEditorVisible: this.state.isEditorVisible,
                        onEditorVisibilityChange: this.onEditorVisibilityChange,
                    } },
                    React.createElement(CellMetadataEditor_1.CellMetadataEditor, { notebook: editorProps.notebook, stepName: editorProps.stepName, stepDependencies: editorProps.stepDependencies, limits: editorProps.limits }),
                    this.state.metadataCmp))));
    }
}
exports.InlineCellsMetadata = InlineCellsMetadata;
