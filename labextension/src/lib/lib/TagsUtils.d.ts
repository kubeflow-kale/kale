import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { ICellModel } from '@jupyterlab/cells';
interface IKaleCellTags {
    blockName: string;
    prevBlockNames: string[];
    limits?: {
        [id: string]: string;
    };
}
/** Contains utility functions for manipulating/handling Kale cell tags. */
export default class TagsUtils {
    /**
     * Get all the `block:<name>` tags in the notebook.
     * @param notebook Notebook object
     * @returns Array<str> - a list of the block names (i.e. the pipeline steps'
     *  names)
     */
    static getAllBlocks(notebook: Notebook): string[];
    /**
     * Given a notebook cell index, get the closest previous cell that has a Kale
     * tag
     * @param notebook The notebook object
     * @param current The index of the cell to start the search from
     * @returns string - Name of the `block` tag of the closest previous cell
     */
    static getPreviousBlock(notebook: Notebook, current: number): string;
    /**
     * Parse a notebook cell's metadata and return all the Kale tags
     * @param notebook Notebook object
     * @param index The index of the notebook cell
     * @returns IKaleCellTags: an object containing all the cell's Kale tags
     */
    static getKaleCellTags(notebook: Notebook, index: number): IKaleCellTags;
    /**
     * Set the provided Kale metadata into the specified notebook cell
     * @param notebookPanel NotebookPanel object
     * @param index index of the target cell
     * @param metadata Kale metadata
     * @param save True to save the notebook after the operation
     */
    static setKaleCellTags(notebookPanel: NotebookPanel, index: number, metadata: IKaleCellTags, save: boolean): Promise<any>;
    /**
     * Parse the entire notebook cells to change a block name. This happens when
     * the block name of a cell is changed by the user, using Kale's inline tag
     * editor. We need to parse the entire notebook because all the `prev` dependencies
     * specified in the cells must be bound to the new name.
     * @param notebookPanel NotebookPanel object
     * @param oldBlockName previous block name
     * @param newBlockName new block name
     */
    static updateKaleCellsTags(notebookPanel: NotebookPanel, oldBlockName: string, newBlockName: string): void;
    /**
     * Clean up the Kale tags from a cell. After cleaning the cell, loop though
     * the notebook to remove all occurrences of the deleted block name.
     * @param notebook NotebookPanel object
     * @param activeCellIndex The active cell index
     * @param stepName The old name of the active cell to be cleaned.
     */
    static resetCell(notebook: NotebookPanel, activeCellIndex: number, stepName: string): void;
    static cellsToArray(notebook: NotebookPanel): ICellModel[];
    static removeOldDependencies(notebook: NotebookPanel, removedCell: ICellModel): void;
}
export {};
