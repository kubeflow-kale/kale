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
import { Chip, Tooltip } from '@mui/material';
import ColorUtils from '../../lib/ColorUtils';
import {
  RESERVED_CELL_NAMES,
  RESERVED_CELL_NAMES_HELP_TEXT
} from './CellMetadataEditor';
import EditIcon from '@mui/icons-material/Edit';
import { CellMetadataContext } from '../../lib/CellMetadataContext';

interface IProps {
  blockName: string;
  previousBlockName: string;
  stepDependencies: string[];
  limits: { [id: string]: string };
  cellElement: any;
  cellIndex: number;
}

interface IState {
  cellTypeClass: string;
  color: string;
  dependencies: any[];
  showEditor: boolean;
  isMergedCell: boolean;
}

const DefaultState: IState = {
  cellTypeClass: '',
  color: '',
  dependencies: [],
  showEditor: false,
  isMergedCell: false
};
// Check if an object is DOMElement
function isDOMElement(obj: any): obj is HTMLElement {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.nodeType === 1 &&
    typeof obj.classList !== 'undefined' &&
    typeof obj.querySelector === 'function'
  );
}

/**
 * This component is used by InlineCellMetadata to display some state information
 * on top of each cell that is tagged with Kale tags.
 *
 * When a cell is tagged with a step name and some dependencies, a chip with the
 * step name and a series of coloured dots for its dependencies are show.
 */
export class InlineMetadata extends React.Component<IProps, IState> {
  static contextType = CellMetadataContext;
  context!: React.ContextType<typeof CellMetadataContext>;
  wrapperRef: React.RefObject<HTMLDivElement> = null;
  state = DefaultState;
  private retryCount = 0;
  private maxRetries = 5;

  constructor(props: IProps) {
    super(props);
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
    this.attemptToMoveComponent();
  }

  attemptToMoveComponent() {
    if (!isDOMElement(this.props.cellElement)) {
      console.warn(
        `InlineMetadata: cellElement is not a valid DOM element (attempt ${this.retryCount + 1}/${this.maxRetries})`
      );

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
        const delay = 100 * Math.pow(2, this.retryCount - 1);
        setTimeout(() => {
          this.attemptToMoveComponent();
        }, delay);
      } else {
        console.error(
          'InlineMetadata: Failed to find valid cellElement after maximum retries'
        );
      }
      return;
    }

    this.moveComponentElementInCell();
  }

  moveComponentElementInCell() {
    if (!this.props.cellElement) {
      console.warn(
        'InlineMetadata: cellElement is undefined, cannot move component'
      );
      return;
    }

    if (!this.wrapperRef.current) {
      console.warn(
        'InlineMetadata: wrapperRef.current is null, cannot move component'
      );
      return;
    }

    try {
      if (!this.wrapperRef.current.classList.contains('moved')) {
        this.wrapperRef.current.classList.add('moved');
        this.props.cellElement.insertAdjacentElement(
          'afterbegin',
          this.wrapperRef.current
        );
        console.log('InlineMetadata: Succesfully moved component to cell');
      }
    } catch (error) {
      console.error('InlineMetadata: Error moving component element:', error);
    }
  }

  componentWillUnmount() {
    const cellElement = this.props.cellElement;
    if (isDOMElement(cellElement)) {
      cellElement.classList.remove('kale-merged-cell');
      const codeMirrorElem = cellElement.querySelector(
        '.CodeMirror'
      ) as HTMLElement;
      if (codeMirrorElem) {
        codeMirrorElem.style.border = '';
      }
    }

    if (this.wrapperRef?.current) {
      this.wrapperRef.current.remove();
    }
  }

  componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>) {
    const mergedState = this.updateIsMergedState(this.state, this.props);
    if (mergedState) {
      this.setState(mergedState);
    }

    if (
      prevProps.blockName !== this.props.blockName ||
      prevProps.previousBlockName !== this.props.previousBlockName
    ) {
      this.updateStyles();
    }

    if (prevProps.stepDependencies !== this.props.stepDependencies) {
      this.updateDependencies();
    }

    if (prevProps.cellElement !== this.props.cellElement) {
      this.retryCount = 0; // Reset retry count for new cellElement
      this.attemptToMoveComponent();
    }

    this.checkIfReservedName();
    const editorState = this.updateEditorState(this.state, this.props);
    if (editorState) {
      this.setState(editorState);
    }
  }

  updateEditorState = (state: IState, props: IProps) => {
    let showEditor = false;

    if (this.context && this.context.isEditorVisible) {
      if (this.context.activeCellIndex === props.cellIndex) {
        showEditor = true;
      }
    }

    if (showEditor === state.showEditor) {
      return null;
    }

    return { showEditor };
  };

  updateIsMergedState = (state: IState, props: IProps) => {
    let newIsMergedCell = false;
    const cellElement = props.cellElement;
    if (!props.blockName) {
      newIsMergedCell = true;

      // TODO: This is a side effect, consider moving it somewhere else.
      if (isDOMElement(cellElement)) {
        cellElement.classList.add('kale-merged-cell');
      }
    } else {
      if (isDOMElement(cellElement)) {
        cellElement.classList.remove('kale-merged-cell');
      }
    }

    if (newIsMergedCell === state.isMergedCell) {
      return null;
    }

    return { isMergedCell: newIsMergedCell };
  };

  /**
   * Check if the block tag of che current cell has a reserved name. If so,
   * apply the corresponding css class to the HTML Cell element.
   */
  checkIfReservedName() {
    this.setState((state: IState, props: IProps) => {
      let cellTypeClass = '';
      if (RESERVED_CELL_NAMES.includes(props.blockName)) {
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
    if (!isDOMElement(this.props.cellElement)) {
      return;
    }
    const name = this.props.blockName || this.props.previousBlockName;
    const codeMirrorElem = this.props.cellElement.querySelector(
      '.CodeMirror'
    ) as HTMLElement;

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

  getColorFromName(name: string) {
    return ColorUtils.getColor(name);
  }

  createLimitsText() {
    const gpuType = Object.keys(this.props.limits).includes('nvidia.com/gpu')
      ? 'nvidia.com/gpu'
      : Object.keys(this.props.limits).includes('amd.com/gpu')
        ? 'amd.com/gpu'
        : undefined;

    return gpuType !== undefined ? (
      <React.Fragment>
        <p style={{ fontStyle: 'italic', marginLeft: '10px' }}>
          GPU request: {gpuType + ' - '}
          {this.props.limits[gpuType]}
        </p>
      </React.Fragment>
    ) : (
      ''
    );
  }

  /**
   * Create a list of div dots that represent the dependencies of the current
   * block
   */
  updateDependencies() {
    const dependencies = this.props.stepDependencies.map((name, i) => {
      const rgb = this.getColorFromName(name);
      return (
        <Tooltip placement="top" key={i} title={name}>
          <div
            className="kale-inline-cell-dependency"
            style={{
              backgroundColor: `#${rgb}`
            }}
          ></div>
        </Tooltip>
      );
    });
    this.setState({ dependencies });
  }

  openEditor() {
    const showEditor = true;
    this.setState({ showEditor });
    this.context.onEditorVisibilityChange(showEditor);
  }

  render() {
    const details = RESERVED_CELL_NAMES.includes(
      this.props.blockName
    ) ? null : (
      <>
        {/* Add a `depends on: ` string before the deps dots in case there are some*/}
        {this.state.dependencies.length > 0 ? (
          <p style={{ fontStyle: 'italic', margin: '0 5px' }}>depends on: </p>
        ) : null}
        {this.state.dependencies}

        {this.createLimitsText()}
      </>
    );

    return (
      <div>
        <div ref={this.wrapperRef}>
          <div
            className={
              'kale-inline-cell-metadata' +
              (this.state.isMergedCell ? ' hidden' : '')
            }
          >
            {/* Add a `step: ` string before the Chip in case the chip belongs to a pipeline step*/}
            {RESERVED_CELL_NAMES.includes(this.props.blockName) ? (
              ''
            ) : (
              <p style={{ fontStyle: 'italic', marginRight: '5px' }}>step: </p>
            )}

            <Tooltip
              placement="top"
              key={this.props.blockName + 'tooltip'}
              title={
                RESERVED_CELL_NAMES.includes(this.props.blockName)
                  ? RESERVED_CELL_NAMES_HELP_TEXT[this.props.blockName]
                  : 'This cell starts the pipeline step: ' +
                    this.props.blockName
              }
            >
              <Chip
                className={`kale-chip ${this.state.cellTypeClass}`}
                style={{ backgroundColor: `#${this.state.color}` }}
                key={this.props.blockName}
                label={this.props.blockName}
              />
            </Tooltip>

            {details}
          </div>

          <div
            style={{ position: 'relative' }}
            className={this.state.showEditor ? ' hidden' : ''}
          >
            <button className="kale-editor-toggle" onClick={this.openEditor}>
              <EditIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }
}
