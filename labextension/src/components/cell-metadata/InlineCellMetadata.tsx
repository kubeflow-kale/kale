import * as React from 'react';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import Switch from 'react-switch';
import CellUtils from '../../utils/CellUtils';
import { InlineMetadata } from './InlineMetadata';
import { CellMetadataEditor, RESERVED_CELL_NAMES } from './CellMetadataEditor';

interface IProps {
  notebook: NotebookPanel;
  activeCellIndex: number;
  onMetadataEnable: (isEnabled: boolean) => void;
}

interface IState {
  prevBlockName?: string;
  metadataCmp?: JSX.Element[];
  checked?: boolean;
  editorsCmp?: JSX.Element[];
}

const DefaultState: IState = {
  prevBlockName: null,
  metadataCmp: [],
  checked: false,
  editorsCmp: [],
};

type SaveState = 'started' | 'completed' | 'failed';

export class InlineCellsMetadata extends React.Component<IProps, IState> {
  state = DefaultState;

  componentDidUpdate = async (
    prevProps: Readonly<IProps>,
    prevState: Readonly<IState>,
  ) => {
    if (!this.props.notebook && prevProps.notebook) {
      // no notebook
      this.removeCells();
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
    }
  };

  handleSaveState = (context: DocumentRegistry.Context, state: SaveState) => {
    if (state === 'completed') {
      if (this.state.checked) {
        this.addMetadataInfo();
      }
    }
  };

  handleCellChange = (cells: any, args: any) => {
    const types = ['add', 'remove', 'move'];
    if (types.includes(args.type)) {
      this.resetMetadataComponents();
    }
  };

  resetMetadataComponents() {
    if (this.state.checked) {
      this.removeCells(() => {
        this.addMetadataInfo();
      });
    }
  }

  addMetadataInfo = () => {
    if (!this.props.notebook) {
      return;
    }

    const cells = this.props.notebook.model.cells;
    const allTags: any[] = [];
    const metadata: any[] = [];
    const editors: any[] = [];
    for (let index = 0; index < cells.length; index++) {
      let tags = this.getKaleCellTags(this.props.notebook.content, index);
      if (!tags) {
        tags = {
          blockName: '',
          prevBlockNames: [],
        };
      }
      allTags.push(tags);
      let parentBlockName;

      if (!tags.blockName) {
        parentBlockName = this.getPreviousBlock(
          this.props.notebook.content,
          index,
        );
      }

      editors.push(
        <CellMetadataEditor
          key={index}
          notebook={this.props.notebook}
          activeCellIndex={index}
          cellModel={this.props.notebook.model.cells.get(index)}
          stepName={tags.blockName || parentBlockName}
          parentBlockName={parentBlockName || ''}
          cellMetadata={tags}
        />,
      );

      metadata.push(
        <InlineMetadata
          key={index}
          cellElement={this.props.notebook.content.node.childNodes[index]}
          blockName={tags.blockName}
          prevBlockNames={tags.prevBlockNames}
          parentBlockName={parentBlockName}
        />,
      );
    }
    this.setState({ metadataCmp: metadata, editorsCmp: editors });
  };

  removeCells = (callback?: () => void) => {
    // triggers cleanup in InlineMetadata
    this.setState({ metadataCmp: [], editorsCmp: [] }, () => {
      if (callback) {
        callback();
      }
    });
  };

  getAllBlocks = (notebook: Notebook): string[] => {
    let blocks = new Set<string>();
    for (const idx of Array(notebook.model.cells.length).keys()) {
      let mt = this.getKaleCellTags(notebook, idx);
      if (mt && mt.blockName && mt.blockName !== '') {
        blocks.add(mt.blockName);
      }
    }
    return Array.from(blocks);
  };

  getPreviousBlock = (notebook: Notebook, current: number): string => {
    for (let i = current - 1; i >= 0; i--) {
      let mt = this.getKaleCellTags(notebook, i);
      if (
        mt &&
        mt.blockName &&
        mt.blockName !== 'skip' &&
        mt.blockName !== ''
      ) {
        return mt.blockName;
      }
    }
    return null;
  };

  getKaleCellTags = (notebook: Notebook, index: number) => {
    const tags: string[] = CellUtils.getCellMetaData(notebook, index, 'tags');
    if (tags) {
      let b_name = tags.map(v => {
        if (RESERVED_CELL_NAMES.includes(v)) {
          return v;
        }
        if (v.startsWith('block:')) {
          return v.replace('block:', '');
        }
      });

      let prevs = tags
        .filter(v => {
          return v.startsWith('prev:');
        })
        .map(v => {
          return v.replace('prev:', '');
        });
      return {
        blockName: b_name[0],
        prevBlockNames: prevs,
      };
    }
    return null;
  };

  handleChange(checked: boolean) {
    this.setState({ checked });
    this.props.onMetadataEnable(checked);
    if (checked) {
      this.addMetadataInfo();
    } else {
      this.removeCells();
    }
  }

  render() {
    return (
      <React.Fragment>
        <div className="toolbar input-container">
          <div className={'switch-label'}>Enable</div>
          <Switch
            checked={this.state.checked}
            onChange={c => this.handleChange(c)}
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
          {this.state.metadataCmp}
          {this.state.editorsCmp}
        </div>
      </React.Fragment>
    );
  }
}
