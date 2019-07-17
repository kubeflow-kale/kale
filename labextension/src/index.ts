import { JupyterFrontEndPlugin } from "@jupyterlab/application";
import kubeflowKalePlugin from "./explorer";
export default [
  kubeflowKalePlugin ,
] as JupyterFrontEndPlugin<any>[];
