import { JupyterFrontEndPlugin } from "@jupyterlab/application";
import kubeflowKalePlugin from "./panel";
export default [
  kubeflowKalePlugin ,
] as JupyterFrontEndPlugin<any>[];
