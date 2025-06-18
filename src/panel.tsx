import { ReactWidget } from '@jupyterlab/apputils';
import { ServiceManager } from '@jupyterlab/services';
import { NotebookPanel } from '@jupyterlab/notebook';
import React, { useState, useCallback, useEffect } from 'react';
import { KernelManager } from './kernelManager';

interface IPanelProps {
  serviceManager: ServiceManager.IManager;
  getCurrentNotebook?: () => NotebookPanel | null;
}

/**
 * React component for the custom panel
 */
const PanelComponent: React.FC<IPanelProps> = ({ serviceManager, getCurrentNotebook }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [kernelManager] = useState(() => new KernelManager(serviceManager));
  const [currentNotebook, setCurrentNotebook] = useState<NotebookPanel | null>(null);
  const [converterInitialized, setConverterInitialized] = useState(false);
  const [lastGeneratedKFPFile, setLastGeneratedKFPFile] = useState<string>('');
  const [availableTags] = useState([
    'step:data-loading',
    'step:preprocessing', 
    'step:training',
    'step:evaluation',
    'step:deployment',
    'pipeline-parameters',
    'pipeline-metrics'
  ]);

  // Update current notebook when it changes
  useEffect(() => {
    if (getCurrentNotebook) {
      const updateNotebook = () => {
        const notebook = getCurrentNotebook();
        setCurrentNotebook(notebook);
      };

      // Initial update
      updateNotebook();

      // Set up interval to check for notebook changes
      const interval = setInterval(updateNotebook, 1000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [getCurrentNotebook]);

  const handleConnect = useCallback(async () => {
    try {
      setIsLoading(true);
      await kernelManager.startKernel();
      setIsConnected(true);
      setResponse('Connected to Python kernel successfully!');
    } catch (error) {
      console.error('Failed to connect to kernel:', error);
      setResponse(`Error connecting to kernel: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [kernelManager]);

  const handleInitializeConverter = useCallback(async () => {
    if (!isConnected) {
      setResponse('Please connect to kernel first');
      return;
    }

    try {
      setIsLoading(true);
      setResponse('Initializing direct notebook to KFP converter...');
      
      const result = await kernelManager.initializeConverter();
      setResponse(result);
      setConverterInitialized(true);
    } catch (error) {
      console.error('Failed to initialize converter:', error);
      setResponse(`Error initializing converter: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, kernelManager]);

  const handleAnnotateCell = useCallback(async (tag: string) => {
    if (!currentNotebook) {
      setResponse('No notebook is currently open');
      return;
    }

    try {
      setIsLoading(true);
      setResponse(`Adding tag "${tag}" to cell...`);

      const notebook = currentNotebook;
      const activeCell = notebook.content.activeCell;
      
      if (!activeCell || !activeCell.model) {
        setResponse('No cell is selected or cell model is unavailable');
        return;
      }

      // Get cell index
      const cellIndex = notebook.content.widgets.indexOf(activeCell);
      
      // Add tag to cell metadata
      const model = activeCell.model;
      
      // Get current tags safely
      let tags: string[] = [];
      try {
        const existingTags = model.getMetadata('tags');
        if (Array.isArray(existingTags)) {
          tags = [...existingTags];
        }
      } catch (e) {
        tags = [];
      }
      
      if (!tags.includes(tag)) {
        tags.push(tag);
        try {
          model.setMetadata('tags', tags);
          setResponse(`Successfully added tag "${tag}" to cell ${cellIndex + 1}`);
        } catch (e) {
          setResponse(`Failed to save tag to cell metadata: ${e}`);
        }
      } else {
        setResponse(`Tag "${tag}" already exists on cell ${cellIndex + 1}`);
      }

    } catch (error) {
      console.error('Failed to annotate cell:', error);
      setResponse(`Error annotating cell: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentNotebook]);

  const handleAnalyzeNotebook = useCallback(async () => {
    if (!currentNotebook) {
      setResponse('No notebook is currently open');
      return;
    }

    if (!isConnected) {
      setResponse('Please connect to kernel first');
      return;
    }

    if (!converterInitialized) {
      setResponse('Please initialize the converter first');
      return;
    }

    try {
      setIsLoading(true);
      setResponse('Analyzing notebook annotations...');

      const notebookPath = currentNotebook.context.path;
      const result = await kernelManager.analyzeNotebook(notebookPath);
      setResponse(result);

    } catch (error) {
      console.error('Failed to analyze notebook:', error);
      setResponse(`Error analyzing notebook: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentNotebook, isConnected, converterInitialized, kernelManager]);

  const handleConvertToKFP = useCallback(async () => {
    if (!currentNotebook) {
      setResponse('No notebook is currently open');
      return;
    }

    if (!isConnected) {
      setResponse('Please connect to kernel first');
      return;
    }

    if (!converterInitialized) {
      setResponse('Please initialize the converter first');
      return;
    }

    try {
      setIsLoading(true);
      setResponse('Converting annotated notebook to KFP v2 DSL...');

      const notebookPath = currentNotebook.context.path;
      const outputPath = notebookPath.replace('.ipynb', '_kfp_pipeline.py');
      
      const result = await kernelManager.convertNotebook(notebookPath, outputPath);
      setResponse(result);
      setLastGeneratedKFPFile(outputPath);

    } catch (error) {
      console.error('Failed to convert to KFP:', error);
      setResponse(`Error converting to KFP: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentNotebook, isConnected, converterInitialized, kernelManager]);

  const handleDisconnect = useCallback(async () => {
    try {
      await kernelManager.shutdown();
      setIsConnected(false);
      setConverterInitialized(false);
      setLastGeneratedKFPFile('');
      setResponse('Disconnected from kernel');
    } catch (error) {
      console.error('Failed to disconnect from kernel:', error);
      setResponse(`Error disconnecting: ${error}`);
    }
  }, [kernelManager]);

  return (
    <div style={{ 
      padding: '16px', 
      fontFamily: 'var(--jp-ui-font-family)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--jp-ui-font-color1)', flexShrink: 0 }}>
        Pipeline Builder
      </h3>
      
      <div style={{ 
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        minHeight: 0
      }}>
        {/* Status Section */}
        <div style={{ marginBottom: '16px', flexShrink: 0 }}>
          <div style={{ 
            padding: '8px', 
            backgroundColor: isConnected ? 'var(--jp-success-color3)' : 'var(--jp-warn-color3)',
            borderRadius: '4px',
            marginBottom: '8px',
            fontSize: '12px'
          }}>
            Kernel: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          
          <div style={{ 
            padding: '8px', 
            backgroundColor: converterInitialized ? 'var(--jp-success-color3)' : 'var(--jp-info-color3)',
            borderRadius: '4px',
            marginBottom: '8px',
            fontSize: '12px'
          }}>
            KFP Converter: {converterInitialized ? 'Ready' : 'Not Initialized'}
          </div>
          
          <div style={{ 
            padding: '8px', 
            backgroundColor: currentNotebook ? 'var(--jp-success-color3)' : 'var(--jp-info-color3)',
            borderRadius: '4px',
            marginBottom: '8px',
            fontSize: '12px'
          }}>
            Notebook: {currentNotebook ? currentNotebook.context.path : 'No notebook open'}
          </div>

          {lastGeneratedKFPFile && (
            <div style={{ 
              padding: '8px', 
              backgroundColor: 'var(--jp-success-color3)',
              borderRadius: '4px',
              marginBottom: '8px',
              fontSize: '12px'
            }}>
              Last KFP File: {lastGeneratedKFPFile.split('/').pop()}
            </div>
          )}
          
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--jp-brand-color1)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                width: '100%',
                marginBottom: '8px'
              }}
            >
              {isLoading ? 'Connecting...' : 'Connect to Kernel'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--jp-error-color1)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                marginBottom: '8px'
              }}
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Converter Initialization */}
        {isConnected && !converterInitialized && (
          <div style={{ marginBottom: '16px', flexShrink: 0 }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--jp-ui-font-color1)' }}>
              Initialize Converter:
            </h4>
            
            <button
              onClick={handleInitializeConverter}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--jp-brand-color1)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                width: '100%',
                marginBottom: '8px'
              }}
            >
              {isLoading ? 'Initializing...' : 'Initialize Notebook → KFP Converter'}
            </button>
          </div>
        )}

        {/* Cell Annotation */}
        {currentNotebook && converterInitialized && (
          <div style={{ marginBottom: '16px', flexShrink: 0 }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--jp-ui-font-color1)' }}>
              Annotate Selected Cell:
            </h4>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '4px',
              marginBottom: '8px'
            }}>
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleAnnotateCell(tag)}
                  disabled={isLoading}
                  style={{
                    padding: '6px 8px',
                    backgroundColor: 'var(--jp-brand-color2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={tag}
                >
                  {tag.replace('step:', '').substring(0, 12)}
                </button>
              ))}
            </div>
            
            <div style={{ fontSize: '11px', color: 'var(--jp-ui-font-color2)' }}>
              Select a cell and click a tag to annotate it for pipeline generation
            </div>
          </div>
        )}

        {/* Pipeline Actions */}
        {currentNotebook && converterInitialized && (
          <div style={{ marginBottom: '16px', flexShrink: 0 }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--jp-ui-font-color1)' }}>
              Pipeline Actions:
            </h4>
            
            <button
              onClick={handleAnalyzeNotebook}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--jp-info-color1)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                width: '100%',
                marginBottom: '8px'
              }}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Notebook Annotations'}
            </button>

            <button
              onClick={handleConvertToKFP}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--jp-success-color1)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              {isLoading ? 'Converting...' : 'Convert to KFP v2 DSL'}
            </button>
          </div>
        )}

        {/* Workflow Guide */}
        {isConnected && (
          <div style={{ marginBottom: '16px', flexShrink: 0 }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--jp-ui-font-color1)' }}>
              Quick Guide:
            </h4>
            <div style={{ 
              padding: '8px',
              backgroundColor: 'var(--jp-layout-color2)',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--jp-ui-font-color2)'
            }}>
              <ol style={{ margin: 0, paddingLeft: '16px' }}>
                <li>Initialize the converter</li>
                <li>Tag your notebook cells with pipeline steps</li>
                <li>Analyze annotations to verify setup</li>
                <li>Convert directly to KFP v2 DSL</li>
              </ol>
              <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
                Tags: step:data-loading, step:training, etc.
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '16px', flex: '1', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--jp-ui-font-color1)', flexShrink: 0 }}>
            Output:
          </h4>
          <div style={{
            padding: '8px',
            backgroundColor: 'var(--jp-layout-color2)',
            borderRadius: '4px',
            fontFamily: 'var(--jp-code-font-family)',
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            border: '1px solid var(--jp-border-color1)',
            flex: '1',
            overflow: 'auto',
            minHeight: '150px'
          }}>
            {response || 'No output yet...'}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * A Custom Panel widget that hosts a React component.
 */
export class CustomSidePanel extends ReactWidget {
  private _serviceManager: ServiceManager.IManager;
  private _getCurrentNotebook: () => NotebookPanel | null;

  constructor(serviceManager: ServiceManager.IManager, getCurrentNotebook: () => NotebookPanel | null) {
    super();
    this._serviceManager = serviceManager;
    this._getCurrentNotebook = getCurrentNotebook;
    this.addClass('jp-ReactWidget');
  }

  render(): JSX.Element {
    return <PanelComponent 
      serviceManager={this._serviceManager} 
      getCurrentNotebook={this._getCurrentNotebook}
    />;
  }
}