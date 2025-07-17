import { Cell, ICellModel } from '@jupyterlab/cells';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
/** Contains some utility functions for handling notebook cells */
export default class CellUtilities {
    /**
     * @description Reads the output at a cell within the specified notebook and returns it as a string
     * @param notebook The notebook to get the cell from
     * @param index The index of the cell to read
     * @returns any - A string value of the cell output from the specified
     * notebook and cell index, or null if there is no output.
     * @throws An error message if there are issues in getting the output
     */
    static readOutput(notebook: Notebook, index: number): any;
    /**
     * @description Gets the value of a key from the specified cell's metadata.
     * @param notebook The notebook that contains the cell.
     * @param index The index of the cell.
     * @param key The key of the value.
     * @returns any - The value of the metadata. Returns null if the key doesn't exist.
     */
    static getCellMetaData(notebook: Notebook, index: number, key: string): any;
    /**
     * @description Sets the key value pair in the notebook's metadata.
     * If the key doesn't exists it will add one.
     * @param notebookPanel The notebook to set meta data in.
     * @param index: The cell index to read metadata from
     * @param key The key of the value to create.
     * @param value The value to set.
     * @param save Default is false. Whether the notebook should be saved after the meta data is set.
     * Note: This function will not wait for the save to complete, it only sends a save request.
     * @returns any - The old value for the key, or undefined if it did not exist.
     */
    static setCellMetaData(notebookPanel: NotebookPanel, index: number, key: string, value: any, save?: boolean): Promise<any>;
    /**
     * @description Looks within the notebook for a cell containing the specified meta key
     * @param notebook The notebook to search in
     * @param key The metakey to search for
     * @returns [number, ICellModel] - A pair of values, the first is the index of where the cell was found
     * and the second is a reference to the cell itself. Returns [-1, null] if cell not found.
     */
    static findCellWithMetaKey(notebookPanel: NotebookPanel, key: string): [number, ICellModel];
    /**
     * @description Gets the cell object at specified index in the notebook.
     * @param notebook The notebook to get the cell from
     * @param index The index for the cell
     * @returns Cell - The cell at specified index, or null if not found
     */
    static getCell(notebook: Notebook, index: number): ICellModel;
    /**
     * @description Runs code in the notebook cell found at the given index.
     * @param command The command registry which can execute the run command.
     * @param notebook The notebook panel to run the cell in
     * @returns Promise<string> - A promise containing the output after the code has executed.
     */
    static runCellAtIndex(notebookPanel: NotebookPanel, index: number): Promise<string>;
    /**
     * @description Deletes the cell at specified index in the open notebook
     * @param notebookPanel The notebook panel to delete the cell from
     * @param index The index that the cell will be deleted at
     * @returns void
     */
    static deleteCellAtIndex(notebook: Notebook, index: number): void;
    /**
     * @description Inserts a cell into the notebook, the new cell will be at the specified index.
     * @param notebook The notebook panel to insert the cell in
     * @param index The index of where the new cell will be inserted.
     * If the cell index is less than or equal to 0, it will be added at the top.
     * If the cell index is greater than the last index, it will be added at the bottom.
     * @returns number - The index it where the cell was inserted
     */
    static insertCellAtIndex(notebook: Notebook, index: number): number;
    /**
     * @description Injects code into the specified cell of a notebook, does not run the code.
     * Warning: the existing cell's code/text will be overwritten.
     * @param notebook The notebook to select the cell from
     * @param index The index of the cell to inject the code into
     * @param code A string containing the code to inject into the CodeCell.
     * @throws An error message if there are issues with injecting code at a particular cell
     * @returns void
     */
    static injectCodeAtIndex(notebook: Notebook, index: number, code: string): void;
    /**
     * @description This will insert a new cell at the specified index and the inject the specified code into it.
     * @param notebook The notebook to insert the cell into
     * @param index The index of where the new cell will be inserted.
     * If the cell index is less than or equal to 0, it will be added at the top.
     * If the cell index is greater than the last index, it will be added at the bottom.
     * @param code The code to inject into the cell after it has been inserted
     * @returns number - index of where the cell was inserted
     */
    static insertInjectCode(notebook: Notebook, index: number, code: string): number;
    /**
     * @description This will insert a new cell at the specified index, inject the specified code into it and the run the code.
     * Note: The code will be run but the results (output or errors) will not be displayed in the cell. Best for void functions.
     * @param notebookPanel The notebook to insert the cell into
     * @param index The index of where the new cell will be inserted and run.
     * If the cell index is less than or equal to 0, it will be added at the top.
     * If the cell index is greater than the last index, it will be added at the bottom.
     * @param code The code to inject into the cell after it has been inserted
     * @param deleteOnError If set to true, the cell will be deleted if the code results in an error
     * @returns Promise<[number, string]> - A promise for when the cell code has executed
     * containing the cell's index and output result
     */
    static insertAndRun(notebookPanel: NotebookPanel, index: number, code: string, deleteOnError: boolean): Promise<[number, string]>;
    /**
     * @description This will insert a new cell at the specified index, inject the specified code into it and the run the code.
     * Note: The code will be run and the result (output or errors) WILL BE DISPLAYED in the cell.
     * @param notebookPanel The notebook to insert the cell into
     * @param command The command registry which can execute the run command.
     * @param index The index of where the new cell will be inserted and run.
     * If the cell index is less than or equal to 0, it will be added at the top.
     * If the cell index is greater than the last index, it will be added at the bottom.
     * @param code The code to inject into the cell after it has been inserted
     * @param deleteOnError If set to true, the cell will be deleted if the code results in an error
     * @returns Promise<[number, string]> - A promise for when the cell code has executed
     * containing the cell's index and output result
     */
    static insertRunShow(notebookPanel: NotebookPanel, index: number, code: string, deleteOnError: boolean): Promise<[number, string]>;
    /**
     * @deprecated Using NotebookUtilities.sendSimpleKernelRequest or NotebookUtilities.sendKernelRequest
     * will execute code directly in the kernel without the need to create a cell and delete it.
     * @description This will insert a cell with specified code at the top and run the code.
     * Once the code is run and output received, the cell is deleted, giving back cell's output.
     * If the code results in an error, the injected cell is still deleted but the promise will be rejected.
     * @param notebookPanel The notebook to run the code in
     * @param code The code to run in the cell
     * @param insertAtEnd True means the cell will be inserted at the bottom
     * @returns Promise<string> - A promise when the cell has been deleted, containing the execution result as a string
     */
    static runAndDelete(notebookPanel: NotebookPanel, code: string, insertAtEnd?: boolean): Promise<string>;
    static getStepName(notebook: NotebookPanel, index: number): string;
    static getCellByStepName(notebook: NotebookPanel, stepName: string): {
        cell: Cell;
        index: number;
    };
}
