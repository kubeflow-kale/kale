import * as React from "react";
import {Notebook, NotebookPanel} from "@jupyterlab/notebook";
import {MaterialInput, MaterialSelectMulti} from "./Components";
import CellUtils from "../utils/CellUtils";
import {ICellModel, Cell, isCodeCellModel} from "@jupyterlab/cells";
import Switch from "react-switch";

const KUBEFLOW_CELL_METADATA_KEY = 'kubeflow_cell';

interface IProps {
    notebook: NotebookPanel;
    activeCell: Cell;
    activeCellIndex: number;
}
 
interface IState {
    show: boolean;
    currentActiveCellMetadata: IKaleCellMetadata;
    allBlocks?: string[];
    prevBlockName?: string;
    skipCell: boolean
}

interface IKaleCellMetadata {
    blockName: string;
    prevBlockNames: string[]
}

const DefaultCellMetadata: IKaleCellMetadata = {
    blockName: '',
    prevBlockNames: []
};

const DefaultState: IState = {
    show: false,
    allBlocks: [],
    currentActiveCellMetadata: DefaultCellMetadata,
    prevBlockName: null,
    skipCell: true
};

export class CellTags extends React.Component<IProps, IState> {
    // TODO: Add function in constructor that initiates to the current active cell
    //   (when notebook opened - or on focus event)

    // TODO: Add listener to cell type changed to hide/show panel when a cell changes type

    // init state default values
    state = DefaultState;

    handleChangeSkipCell = () => {this.setState({ skipCell: !this.state.skipCell})};

    componentDidMount = () => {
        if (this.props.activeCell) {
            if (isCodeCellModel(this.props.activeCell.model)) {
                this.readAndShowMetadata();
            }
        }
    };

    componentDidUpdate = async (prevProps: Readonly<IProps>, prevState: Readonly<IState>) => {
        if (prevProps.activeCellIndex !== this.props.activeCellIndex) {
            // listen to cell type changes
            if (prevProps.activeCell) {
                prevProps.activeCell.model.contentChanged.disconnect(this.listenCellContentChanged)
            }
            // TODO: Listen to cell type change (code, markdown, raw)
            //   - stateChanged signal: That is fired only in a few specific circumstances,
            //  like when the trusted or readonly state changes
            //   - contentChange: this is wat we *would* expect to work EXCEPT in this instance.
            //      This is because they internally implement changing a cell type by removing the
            //      old cell and inserting a new one with the same text content.
            //      So you can’t listen to change signals on the old one as it is not really the same cell.
            //  Possible solution:
            //    1. Listen to the model.cells.changed signal.
            //    2. If a cell is deleted, cache the text content and type of the cell.
            //    3. If a cell is subsequently inserted, check to see if it is a new cell
            //       type with the same text content. That is your changed cell.
            //    4. If there is any other action, clear the cache.
            this.props.activeCell.model.contentChanged.connect(this.listenCellContentChanged);

            // if the active cell is not of type `code`, then hide panel
            if (!isCodeCellModel(this.props.activeCell.model)) {
                this.setState({show: false});
                return
            }

            this.readAndShowMetadata();
        } else {
            // in case the cell did not change and the user changed the skip cell toggle
             if (prevState.skipCell !== this.state.skipCell) {
                if (this.state.skipCell) {
                    // set the currentBlockName and the list of PrevBlocksNames to `skip` and []
                    const prevs: string[] = [];
                    let currentCellMetadata = {...this.state.currentActiveCellMetadata, blockName: 'skip', prevBlockNames: prevs};
                    this.setState({currentActiveCellMetadata: currentCellMetadata});
                    this.setKaleCellTags(
                        this.props.notebook,
                        this.props.activeCellIndex,
                        KUBEFLOW_CELL_METADATA_KEY,
                        currentCellMetadata,
                        true
                    )
                } else {
                    // In case the user clicked on the skip cell toggle.
                    // This may not be the case when this happens:
                    //   1. The user is active on a skip cell (skip metadata state is true)
                    //   2. The user clicks on a code cell.
                    //   3. The active cell props is updated, and triggers metadata read of the new cell
                    //   4. The new metadata is saved, so skip=False is saved to state.
                    //   5. componentDidUpdate is called again after state changed, with the same cellIndex but skip is updated to false
                    if (this.state.currentActiveCellMetadata.blockName === 'skip') {
                        await this.updateCurrentBlockName('')
                    }
                    this.readAndShowMetadata()
                }
            }
        }
    };

    readAndShowMetadata = () => {
        // 1. Read metadata from the active cell
        const cellMetadata = this.getKaleCellTags(
            this.props.notebook.content,
            this.props.activeCellIndex,
            KUBEFLOW_CELL_METADATA_KEY);

        // 2. Get all blocks currently defined in the notebook
        // TODO: This could be run on parent component when new notebook is opened and passed as property.
        //  Then kept updated as metadata change
        const allBlocks = this.getAllBlocks(this.props.notebook.content);
        const prevBlockName = this.getPreviousBlock(this.props.notebook.content, this.props.activeCellIndex);

        if (cellMetadata) {
            let skip = !!(cellMetadata.blockName && cellMetadata.blockName === 'skip');
            this.setState({
                show: true,
                allBlocks: allBlocks,
                prevBlockName: prevBlockName,
                skipCell: skip,
                currentActiveCellMetadata: {
                    blockName: cellMetadata.blockName || '',
                    prevBlockNames: cellMetadata.prevBlockNames || []
                }
            })
        } else {
            this.setState({
                show: true,
                allBlocks: allBlocks,
                prevBlockName: prevBlockName,
                skipCell: false,
                currentActiveCellMetadata: DefaultCellMetadata,
            })
        }
    };

    listenCellContentChanged = (model: ICellModel) => {
        // console.log("listenCellContentChanged activated");
        // console.log(model)
    };

    getPreviousBlock = (notebook: Notebook, current: number): string => {
        for (let i = current - 1; i >= 0; i--) {
            let mt = this.getKaleCellTags(notebook, i, KUBEFLOW_CELL_METADATA_KEY);
            if (mt && mt.blockName && mt.blockName !== 'skip' && mt.blockName !== "") {
                return mt.blockName
            }
        }
        return null
    };

    // TODO: This is executing at every render.
    getAllBlocks = (notebook: Notebook): string[] => {
        let blocks = new Set<string>();
        for (const idx of Array(notebook.model.cells.length).keys()) {
            let mt = this.getKaleCellTags(notebook, idx, KUBEFLOW_CELL_METADATA_KEY);
            if (mt && mt.blockName && mt.blockName !== '') {
                blocks.add(mt.blockName);
            }
        }
        return Array.from(blocks)
    };

    updateCurrentBlockName = async (value: string) => {
        let currentCellMetadata = {...this.state.currentActiveCellMetadata, blockName: value};
        await this.setState({currentActiveCellMetadata: currentCellMetadata});
        this.setKaleCellTags(
            this.props.notebook,
            this.props.activeCellIndex,
            KUBEFLOW_CELL_METADATA_KEY,
            currentCellMetadata,
            true
        )
    };

    updatePrevBlocksNames = async (previousBlocks: string[]) => {
        let currentCellMetadata = {...this.state.currentActiveCellMetadata, prevBlockNames: previousBlocks};
        await this.setState({currentActiveCellMetadata: currentCellMetadata});
        this.setKaleCellTags(
            this.props.notebook,
            this.props.activeCellIndex,
            KUBEFLOW_CELL_METADATA_KEY,
            currentCellMetadata,
            true
        )
    };

    getKaleCellTags = (
        notebook: Notebook,
        index: number,
        key: string) => {
        const tags: string[] = CellUtils.getCellMetaData(
            notebook,
            index,
            'tags'
        );
        if (tags) {
            let b_names = tags.map(v => {
                if (v === 'functions' || v === 'imports' || v === 'skip') {
                    return v
                }
                if (v.startsWith('block:')) {
                    return v.replace("block:", "")
                }
            });

            let prevs = tags.filter(v => {return v.startsWith('prev:')})
                .map(v => {return v.replace("prev:", '')});
            return {
                blockName: b_names[0],
                prevBlockNames: prevs
            }
        }
        return null;
    };

    setKaleCellTags = (
        notebookPanel: NotebookPanel,
        index: number,
        key: string,
        value: IKaleCellMetadata,
        save: boolean) => {
        // make the dict to save to tags
        let nb = value.blockName;
        if (value.blockName !== 'imports' && value.blockName !== 'functions' && value.blockName !== 'skip') {
            nb = 'block:' + nb
        }
        console.log('set kale cell tags');
        console.log(nb);
        const tags = [nb].concat(value.prevBlockNames.map(v => 'prev:' + v));
        console.log(tags);
        CellUtils.setCellMetaData(
            notebookPanel,
            index,
            'tags',
            tags,
            save
        )
    };

    render() {
        const headerName = 'Cell Tags';

        // if the active cell is not of type `code`
        if (!this.state.show) {
            return (<div>
                <div>
                    <p className="kale-header">{headerName}</p>
                </div>

                <div className="jp-KeySelector">
                <div className="jp-Toolbar toolbar" style={{padding: 0, marginLeft: "10px"}}>
                    <div className="jp-Toolbar-item"  style={{fontSize: 'var(--jp-ui-font-size0)'}}>
                        No active code cell
                    </div>
                </div>
                </div>
            </div>)
        }

        const switchHeader =
            <div className={"kale-header-switch"} >
                <div className="kale-header" style={{padding: "0"}}>
                    {headerName}
                </div>
                <div className={"skip-switch-container"}>
                    <label className={"skip-switch-label"}>Hide cell</label>
                    <Switch
                        checked={this.state.skipCell}
                        onChange={this.handleChangeSkipCell}
                        onColor="#599EF0"
                        onHandleColor="#477EF0"
                        handleDiameter={18}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                        activeBoxShadow="0px 0px 1px 7px rgba(0, 0, 0, 0.2)"
                        height={10}
                        width={20}
                        className="skip-switch"
                        id="skip-switch"
                    />
                </div>
            </div>;

        if (this.state.skipCell) {
            return (
                <div>
                    {switchHeader}
                    <div className="input-container">
                        <div className="skip-cell-info-text">
                            This cell will be skipped and excluded from pipeline steps
                        </div>
                    </div>
                </div>
            )
        }

        const prevBlockNotice = (this.state.prevBlockName && this.state.currentActiveCellMetadata.blockName === '')
            ? "Leave block name empty to merge code to block " + this.state.prevBlockName
            : null;
        return (
            <div>
                {switchHeader}

                <div className='input-container'>

                    <MaterialInput
                        label={"Block Name"}
                        updateValue={this.updateCurrentBlockName}
                        value={this.state.currentActiveCellMetadata.blockName}
                        regex={"^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"}
                        regexErrorMsg={"Block name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character."}
                        helperText={prevBlockNotice}
                    />

                    <MaterialSelectMulti
                        updateSelected={this.updatePrevBlocksNames}
                        options={this.state.allBlocks}
                        selected={this.state.currentActiveCellMetadata.prevBlockNames}/>

                </div>
            </div>
        )
    }
}