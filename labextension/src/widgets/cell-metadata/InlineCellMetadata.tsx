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
import {
  Cell,
  CodeCellModel,
  ICellModel,
  isCodeCellModel,
} from '@jupyterlab/cells';
import CellUtils from '../../lib/CellUtils';
import TagsUtils from '../../lib/TagsUtils';
import { InlineMetadata } from './InlineMetadata';
import {
  CellMetadataEditor,
  IProps as EditorProps,
} from './CellMetadataEditor';
import { CellMetadataContext } from '../../lib/CellMetadataContext';
import { Switch } from '@material-ui/core';
import NotebookUtils from '../../lib/NotebookUtils';

interface IProps {
  notebook: NotebookPanel;
  onMetadataEnable: (isEnabled: boolean) => void;
}

type Editors = { [index: string]: EditorProps };

interface IState {
  activeCellIndex: number;
  prevBlockName?: string;
  metadataCmp?: JSX.Element[];
  checked?: boolean;
  editors?: Editors;
  isEditorVisible: boolean;
}

const DefaultState: IState = {
  activeCellIndex: 0,
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

  componentDidMount = () => {
    if (this.props.notebook) {
      this.connectAndInitWhenReady(this.props.notebook);
    }
  };

  componentDidUpdate = async (
    prevProps: Readonly<IProps>,
    prevState: Readonly<IState>,
  ) => {
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

  connectAndInitWhenReady = (notebook: NotebookPanel) => {
    notebook.context.ready.then(() => {
      this.connectHandlersToNotebook(this.props.notebook);
      this.refreshEditorsPropsAndInlineMetadata();
      this.setState({
        activeCellIndex: notebook.content.activeCellIndex,
      });
    });
  };

  connectHandlersToNotebook = (notebook: NotebookPanel) => {
    notebook.context.saveState.connect(this.handleSaveState);
    notebook.content.activeCellChanged.connect(this.onActiveCellChanged);
    notebook.model.cells.changed.connect(this.handleCellChange);
  };

  disconnectHandlersFromNotebook = (notebook: NotebookPanel) => {
    notebook.context.saveState.disconnect(this.handleSaveState);
    notebook.content.activeCellChanged.disconnect(this.onActiveCellChanged);
    // when closing the notebook tab, notebook.model becomes null
    if (notebook.model) {
      notebook.model.cells.changed.disconnect(this.handleCellChange);
    }
  };

  onActiveCellChanged = (notebook: Notebook, activeCell: Cell) => {
    this.setState({
      activeCellIndex: notebook.activeCellIndex,
    });
  };

  handleSaveState = (context: DocumentRegistry.Context, state: SaveState) => {
    if (this.state.checked && state === 'completed') {
      this.generateEditorsPropsAndInlineMetadata();
    }
  };

  handleCellChange = (
    cells: IObservableUndoableList<ICellModel>,
    args: IObservableList.IChangedArgs<ICellModel>,
  ) => {
    this.refreshEditorsPropsAndInlineMetadata();

    const prevValue = args.oldValues[0];
    // Change type 'set' is when a cell changes its type. Even if a user changes
    // multiple cells using Shift + click the args.oldValues has only one cell
    // each time.
    if (args.type === 'set' && prevValue instanceof CodeCellModel) {
      CellUtils.setCellMetaData(
        this.props.notebook,
        args.newIndex,
        'tags',
        [],
        true,
      );
    }

    // Change type 'remove' is when a cell is removed from the notebook.
    if (args.type === 'remove') {
      TagsUtils.removeOldDependencies(this.props.notebook, prevValue);
    }
  };

  /**
   * Event handler for the global Kale switch (the one below the Kale title in
   * the left panel). Enabling the switch propagates to the father component
   * (LeftPanel) to enable the rest of the UI.
   */
  toggleGlobalKaleSwitch(checked: boolean) {
    this.setState({ checked });
    this.props.onMetadataEnable(checked);

    if (checked) {
      this.generateEditorsPropsAndInlineMetadata();

      // When drawing cell metadata on Kale enable/disable, the targeted
      // cell may be lost. Therefore, we select and scroll to the active
      // cell.
      if (this.props.notebook && this.props.notebook.content.activeCellIndex) {
        setTimeout(
          NotebookUtils.selectAndScrollToCell,
          200,
          this.props.notebook,
          {
            cell: this.props.notebook.content.activeCell,
            index: this.props.notebook.content.activeCellIndex,
          },
        );
      }
    } else {
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

  clearEditorsPropsAndInlineMetadata = (callback?: () => void) => {
    // triggers cleanup in InlineMetadata
    this.setState({ metadataCmp: [], editors: {} }, () => {
      if (callback) {
        callback();
      }
    });
  };

  generateEditorsPropsAndInlineMetadata = () => {
    if (!this.props.notebook) {
      return;
    }
    const metadata: any[] = [];
    const editors: Editors = {};
    const cells = this.props.notebook.model.cells;
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
      let previousBlockName = '';

      if (!tags.blockName) {
        previousBlockName = TagsUtils.getPreviousBlock(
          this.props.notebook.content,
          index,
        );
      }
      editors[index] = {
        notebook: this.props.notebook,
        stepName: tags.blockName || '',
        stepDependencies: tags.prevBlockNames || [],
        limits: tags.limits || {},
      };
      metadata.push(
        <InlineMetadata
          key={index}
          cellElement={this.props.notebook.content.node.childNodes[index]}
          blockName={tags.blockName}
          stepDependencies={tags.prevBlockNames}
          limits={tags.limits || {}}
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

  /**
   * Callback passed to the CellMetadataEditor context
   */
  onEditorVisibilityChange(isEditorVisible: boolean) {
    this.setState({ isEditorVisible });
  }

  render() {
    // Get the editor props of the active cell, so that just one editor is
    // rendered at any given time.
    const editorProps: EditorProps = {
      ...this.state.editors[this.state.activeCellIndex],
    };
    return (
      <React.Fragment>
        <div className="toolbar input-container">
          <div className={'switch-label'}>Enable</div>
          <Switch
            checked={this.state.checked}
            onChange={c => this.toggleGlobalKaleSwitch(c.target.checked)}
            color="primary"
            name="enableKale"
            inputProps={{ 'aria-label': 'primary checkbox' }}
            classes={{ root: 'material-switch' }}
          />
        </div>
        <div className="hidden">
          <CellMetadataContext.Provider
            value={{
              activeCellIndex: this.state.activeCellIndex,
              isEditorVisible: this.state.isEditorVisible,
              onEditorVisibilityChange: this.onEditorVisibilityChange,
            }}
          >
            <CellMetadataEditor
              notebook={editorProps.notebook}
              stepName={editorProps.stepName}
              stepDependencies={editorProps.stepDependencies}
              limits={editorProps.limits}
            />
            {this.state.metadataCmp}
          </CellMetadataContext.Provider>
        </div>
      </React.Fragment>
    );
  }
}
