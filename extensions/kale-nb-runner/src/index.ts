import {
    JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';



import '../style/index.css';


/**
 * Initialization data for the kale-nb-runner extension.
 */
const extension: JupyterLabPlugin<void> = {
    id: 'kale-nb-runner',
    autoStart: true,
    activate: (app: JupyterLab) => {
        console.log('JupyterLab extension kale-nb-runner is activated!');
    }
};

export default extension;
