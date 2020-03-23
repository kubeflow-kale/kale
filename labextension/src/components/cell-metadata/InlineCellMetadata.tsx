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
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  IObservableList,
  IObservableUndoableList,
} from '@jupyterlab/observables';
import { isCodeCellModel, CodeCellModel, ICellModel } from '@jupyterlab/cells';
import Switch from 'react-switch';
import CellUtils from '../../utils/CellUtils';
import TagsUtils from '../../utils/TagsUtils';
import { InlineMetadata } from './InlineMetadata';
import {
  CellMetadataEditor,
  IProps as EditorProps,
} from './CellMetadataEditor';
import { CellMetadataContext } from './CellMetadataContext';

interface IProps {
  notebook: NotebookPanel;
  activeCellIndex: number;
  onMetadataEnable: (isEnabled: boolean) => void;
}

type Editors = { [index: string]: EditorProps };

interface IState {
  prevBlockName?: string;
  metadataCmp?: JSX.Element[];
  checked?: boolean;
  editors?: Editors;
  isEditorVisible: boolean;
}

const DefaultState: IState = {
  prevBlockName: null,
  metadataCmp: [],
  checked: false,
  editors: {},
  isEditorVisible: false,
};

type SaveState = 'started' | 'completed' | 'failed';

export class InlineCellsMetadata extends React.Component<IProps, IState> {
  state = DefaultState;

  constructor(props: IProps) {
    super(props);
    this.onEditorVisibilityChange = this.onEditorVisibilityChange.bind(this);
  }

  componentDidUpdate = async (
    prevProps: Readonly<IProps>,
    prevState: Readonly<IState>,
  ) => {
    if (!this.props.notebook && prevProps.notebook) {
      // no notebook
      this.clearMetadataAndEditorsState();
    }

    const preNotebookId = prevProps.notebook ? prevProps.notebook.id : '';
    const notebookId = this.props.notebook ? this.props.notebook.id : '';
    if (preNotebookId !== notebookId) {
      // notebook changed
      if (prevProps.notebook) {
        prevProps.notebook.context.saveState.disconnect(this.handleSaveState);
        // prevProps.notebook.model is null
        // potential memory leak ??
        // prevProps.notebook.model.cells.changed.disconnect(this.handleCellChange);
      }
      if (this.props.notebook) {
        this.props.notebook.context.ready.then(() => {
          this.props.notebook.context.saveState.connect(this.handleSaveState);
          this.props.notebook.model.cells.changed.connect(
            this.handleCellChange,
          );
          this.resetMetadataComponents();
        });
      }

      // hide editor on notebook change
      this.setState({ isEditorVisible: false });
    }
  };

  /**
   * Event handler for the global Kale switch (the one below the Kale title in
   * the left panel). Enabling the switch propagates to the father component
   * (LeftPanelWidget) to enable the rest of the UI.
   */
  toggleGlobalKaleSwitch(checked: boolean) {
    this.setState({ checked });
    this.props.onMetadataEnable(checked);

    if (checked) {
      this.addMetadataInfo();
    } else {
      this.setState({ isEditorVisible: false });
      this.clearMetadataAndEditorsState();
    }
  }

  /**
   * Callback that is called every time the Notebook is saved. This function
   * is set in componentDidUpdate every time the current notebook changes.
   */
  handleSaveState = (context: DocumentRegistry.Context, state: SaveState) => {
    if (state === 'completed') {
      if (this.state.checked) {
        this.addMetadataInfo();
      }
    }
  };

  /**
   * Callback that is called every time the active cell changes. This function
   * is set in componentDidUpdate every time the current notebook changes.
   */
  handleCellChange = (
    cells: IObservableUndoableList<ICellModel>,
    args: IObservableList.IChangedArgs<ICellModel>,
  ) => {
    this.resetMetadataComponents();
    // Change type 'set' is when a cell changes its type. Even if a user changes
    // multiple cells using Shift + click the args.oldValues has only one chell
    // each time.
    if (args.type === 'set' && args.oldValues[0] instanceof CodeCellModel) {
      CellUtils.setCellMetaData(
        this.props.notebook,
        args.newIndex,
        'tags',
        [],
        true,
      );
    }
  };

  /**
   * Remove all the inline cell metadata info components and the editors.
   */
  resetMetadataComponents() {
    if (this.state.checked) {
      this.clearMetadataAndEditorsState(() => {
        this.addMetadataInfo();
      });
      this.setState({ isEditorVisible: false });
    }
  }

  clearMetadataAndEditorsState = (callback?: () => void) => {
    // triggers cleanup in InlineMetadata
    this.setState({ metadataCmp: [], editors: {} }, () => {
      if (callback) {
        callback();
      }
    });
  };

  /**
   * Parse the entire notebook cells and, based on the existing kale cell
   * metadata, create a new CellMetadataEditor component (actually, we store
   * just the props), and an InlineMetadata component (used to visualize
   * metadata information above the cells) for every code cell.
   *
   * This function is used as callback to `removeCells`.
   */
  addMetadataInfo = () => {
    if (!this.props.notebook) {
      return;
    }

    const cells = this.props.notebook.model.cells;
    const allTags: any[] = [];
    const metadata: any[] = [];
    const editors: Editors = {};
    for (let index = 0; index < cells.length; index++) {
      const isCodeCell = isCodeCellModel(
        this.props.notebook.model.cells.get(index),
      );
      if (!isCodeCell) {
        continue;
      }

      let tags = TagsUtils.getKaleCellTags(this.props.notebook.content, index);
      if (!tags) {
        tags = {
          blockName: '',
          prevBlockNames: [],
        };
      }
      allTags.push(tags);
      let previousBlockName = '';

      if (!tags.blockName) {
        previousBlockName = TagsUtils.getPreviousBlock(
          this.props.notebook.content,
          index,
        );
      }
      const editorProps: EditorProps = {
        notebook: this.props.notebook,
        stepName: tags.blockName || '',
        stepDependencies: tags.prevBlockNames || [],
      };
      editors[index] = editorProps;
      metadata.push(
        <InlineMetadata
          key={index}
          cellElement={this.props.notebook.content.node.childNodes[index]}
          blockName={tags.blockName}
          stepDependencies={tags.prevBlockNames}
          previousBlockName={previousBlockName}
          cellIndex={index}
        />,
      );
    }

    this.setState({
      metadataCmp: metadata,
      editors: editors,
    });
  };

  removeCells = (callback?: () => void) => {
    // triggers cleanup in InlineMetadata
    this.setState({ metadataCmp: [], editors: {} }, () => {
      if (callback) {
        callback();
      }
    });
  };

  handleChange(checked: boolean) {
    this.setState({ checked });
    this.props.onMetadataEnable(checked);

    if (checked) {
      this.addMetadataInfo();
    } else {
      this.setState({ isEditorVisible: false });
      this.removeCells();
    }
  }

  /**
   * Callback passed to the CellMetadataEditor context
   */
  onEditorVisibilityChange(isEditorVisible: boolean) {
    this.setState({ isEditorVisible });
  }

  render() {
    // Get the editor props of the active cell, so that just one editor is
    // rendered at any given time.
    const editorProps = {
      ...this.state.editors[this.props.activeCellIndex],
    };
    return (
      <React.Fragment>
        <div className="toolbar input-container">
          <div className={'switch-label'}>Enable</div>
          <Switch
            checked={this.state.checked}
            onChange={c => this.toggleGlobalKaleSwitch(c)}
            onColor="#599EF0"
            onHandleColor="#477EF0"
            handleDiameter={18}
            uncheckedIcon={false}
            checkedIcon={false}
            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
            activeBoxShadow="0px 0px 1px 7px rgba(0, 0, 0, 0.2)"
            height={10}
            width={20}
          />
        </div>
        <div className="hidden">
          <CellMetadataContext.Provider
            value={{
              activeCellIndex: this.props.activeCellIndex,
              isEditorVisible: this.state.isEditorVisible,
              onEditorVisibilityChange: this.onEditorVisibilityChange,
            }}
          >
            <CellMetadataEditor
              notebook={editorProps.notebook}
              stepName={editorProps.stepName}
              stepDependencies={editorProps.stepDependencies}
            />
            {this.state.metadataCmp}
          </CellMetadataContext.Provider>
        </div>
      </React.Fragment>
    );
  }
}
