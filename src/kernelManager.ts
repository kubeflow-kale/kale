import { ServiceManager } from '@jupyterlab/services';
import { Kernel, KernelMessage } from '@jupyterlab/services';

/**
 * Clean kernel manager that loads existing Python files from the project
 */
export class KernelManager {
  private _serviceManager: ServiceManager.IManager;
  private _kernel: Kernel.IKernelConnection | null = null;

  constructor(serviceManager: ServiceManager.IManager) {
    this._serviceManager = serviceManager;
  }

  /**
   * Start a new Python kernel
   */
  async startKernel(): Promise<void> {
    try {
      if (this._kernel) {
        await this.shutdown();
      }

      this._kernel = await this._serviceManager.kernels.startNew({
        name: 'python3'
      });

      console.log('Kernel started:', this._kernel.id);

      this._kernel.statusChanged.connect((sender, status) => {
        console.log('Kernel status:', status);
      });

    } catch (error) {
      console.error('Failed to start kernel:', error);
      throw error;
    }
  }

  /**
   * Execute Python code in the kernel
   */
  async executeCode(code: string): Promise<string> {
    if (!this._kernel) {
      throw new Error('Kernel not started. Call startKernel() first.');
    }

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      const future = this._kernel!.requestExecute({
        code: code,
        store_history: false,
        allow_stdin: false
      });

      future.onIOPub = (msg: KernelMessage.IIOPubMessage) => {
        const msgType = msg.header.msg_type;
        
        switch (msgType) {
          case 'stream':
            const streamMsg = msg as KernelMessage.IStreamMsg;
            if (streamMsg.content.name === 'stdout') {
              output += streamMsg.content.text;
            } else if (streamMsg.content.name === 'stderr') {
              errorOutput += streamMsg.content.text;
            }
            break;
            
          case 'execute_result':
            const executeMsg = msg as KernelMessage.IExecuteResultMsg;
            if (executeMsg.content.data['text/plain']) {
              output += executeMsg.content.data['text/plain'] + '\n';
            }
            break;
            
          case 'display_data':
            const displayMsg = msg as KernelMessage.IDisplayDataMsg;
            if (displayMsg.content.data['text/plain']) {
              output += displayMsg.content.data['text/plain'] + '\n';
            }
            break;
            
          case 'error':
            const errorMsg = msg as KernelMessage.IErrorMsg;
            errorOutput += `${errorMsg.content.ename}: ${errorMsg.content.evalue}\n`;
            break;
        }
      };

      future.onReply = (msg: KernelMessage.IExecuteReplyMsg) => {
        if (msg.content.status === 'ok') {
          resolve(output || 'Code executed successfully');
        } else {
          reject(new Error(errorOutput || 'Unknown execution error'));
        }
      };

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, 30000);
    });
  }

  /**
   * Initialize converter by loading existing Python files
   */
  async initializeConverter(): Promise<string> {
    const code = `
import sys
import os

print("=== Initializing Converter from Project Files ===")

# Install required packages if needed
required_packages = ['nbformat', 'kfp', 'dill', 'pandas', 'numpy', 'scikit-learn']
missing_packages = []

for package in required_packages:
    try:
        __import__(package)
        print(f"✅ {package} available")
    except ImportError:
        missing_packages.append(package)
        print(f"❌ {package} missing")

if missing_packages:
    print(f"📦 Installing missing packages: {missing_packages}")
    import subprocess
    for package in missing_packages:
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', package], 
                          capture_output=True, text=True, check=True)
            print(f"✅ Installed {package}")
        except Exception as e:
            print(f"❌ Failed to install {package}: {e}")

# Try to load the converter from project files
converter_paths = [
    'lib/notebook_to_kfp_converter.py',
    'src/notebook_to_kfp_converter.py',
    'notebook_to_kfp_converter.py'
]

converter_loaded = False
loaded_from = None

print("\\n🔍 Looking for converter files...")
for path in converter_paths:
    print(f"  📁 Checking: {path}")
    if os.path.exists(path):
        print(f"  ✅ Found: {path}")
        try:
            # Add the directory to Python path
            converter_dir = os.path.dirname(os.path.abspath(path))
            if converter_dir not in sys.path:
                sys.path.insert(0, converter_dir)
            
            # Import the converter module
            import importlib.util
            spec = importlib.util.spec_from_file_location("notebook_to_kfp_converter", path)
            converter_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(converter_module)
            
            # Make functions available globally
            globals()['convert_notebook_to_kfp'] = converter_module.convert_notebook_to_kfp
            globals()['analyze_notebook_annotations'] = converter_module.analyze_notebook_annotations
            globals()['NotebookToKFPConverter'] = converter_module.NotebookToKFPConverter
            
            print(f"  ✅ Successfully loaded from: {path}")
            converter_loaded = True
            loaded_from = path
            break
            
        except Exception as e:
            print(f"  ❌ Failed to load {path}: {e}")
            continue
    else:
        print(f"  ❌ Not found: {path}")

# Status report
print("\\n" + "="*50)
print("📊 INITIALIZATION STATUS")
print("="*50)

if converter_loaded:
    print(f"✅ Converter: Loaded from {loaded_from}")
    print("   📋 Available functions:")
    print("      - convert_notebook_to_kfp()")
    print("      - analyze_notebook_annotations()")
    print("      - NotebookToKFPConverter()")
else:
    print("❌ Converter: Failed to load")
    print("💡 Please ensure notebook_to_kfp_converter.py exists in:")
    for path in converter_paths:
        print(f"   - {path}")


overall_success = converter_loaded

if overall_success:
    print("\\n🎉 INITIALIZATION COMPLETED SUCCESSFULLY!")
    print("🔧 Ready to analyze notebooks and generate KFP pipelines")
    result_message = "✅ Converter initialized successfully - ready for use!"
else:
    print("\\n⚠️ INITIALIZATION COMPLETED WITH ISSUES")
    print("🔧 Some components may not work properly")
    if converter_loaded:
        result_message = "⚠️ Converter loaded"
    else:
        result_message = "❌ converter failed to load - please check file paths"

print("="*50)

result_message
    `;

    return this.executeCode(code);
  }

  /**
   * Analyze notebook using loaded converter
   */
  async analyzeNotebook(notebookPath: string): Promise<string> {
    const code = `
print("=== Analyzing Notebook ===")

try:
    notebook_path = r"${notebookPath}"
    print(f"📖 Analyzing: {notebook_path}")
    
    # Check if analyzer function is available
    if 'analyze_notebook_annotations' not in globals():
        raise NameError("analyze_notebook_annotations function not available. Please initialize converter first.")
    
    # Run analysis
    print("🔍 Running analysis...")
    
    analysis = analyze_notebook_annotations(notebook_path)
    
    if analysis.get('kale_processor_success'):
        print(f"✅ Kale processor succeeded")
        print(f"📊 Pipeline steps: {analysis['pipeline_steps']}")
        print(f"📝 Step names: {analysis['step_names']}")
        print(f"🔗 Has dependencies: {analysis['has_dependencies']}")
        if 'has_pipeline_parameters' in analysis:
            print(f"📋 Has pipeline parameters: {analysis['has_pipeline_parameters']}")
        if 'has_pipeline_metrics' in analysis:
            print(f"📊 Has pipeline metrics: {analysis['has_pipeline_metrics']}")
        if 'note' in analysis:
            print(f"📝 Note: {analysis['note']}")
    
    print("=" * 40)
    
    print("🎉 ANALYSIS COMPLETED!")
    
except Exception as e:
    error_msg = f"❌ Analysis failed: {str(e)}"
    print(error_msg)
    raise e
    `;

    return this.executeCode(code);
  }

  /**
   * Convert notebook using loaded converter with robust encoding
   */
  async convertNotebook(notebookPath: string, outputPath?: string): Promise<string> {
    const code = `
import os
import sys
from datetime import datetime

print("=== Converting Notebook to KFP DSL ===")

try:
    # Set UTF-8 encoding for Python
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
    
    notebook_path = r"${notebookPath.replace(/\\/g, '\\\\')}"
    output_path = r"${(outputPath || notebookPath.replace('.ipynb', '_kfp_pipeline.py')).replace(/\\/g, '\\\\')}"
    
    print(f"📖 Input: {notebook_path}")
    print(f"📄 Output: {output_path}")
    print(f"⏰ Started: {datetime.now().strftime('%H:%M:%S')}")
    
    # Check if converter function is available
    if 'convert_notebook_to_kfp' not in globals():
        raise NameError("convert_notebook_to_kfp function not available. Please initialize converter first.")
    
    # Verify input file exists and is readable
    if not os.path.exists(notebook_path):
        raise FileNotFoundError(f"Notebook file not found: {notebook_path}")
    
    # Check file encoding and size
    try:
        with open(notebook_path, 'r', encoding='utf-8') as f:
            test_read = f.read(100)  # Test read first 100 chars
        print("✅ File encoding verification passed")
    except UnicodeDecodeError as e:
        print(f"❌ File encoding issue: {e}")
        print("💡 Trying to detect and fix encoding...")
        
        # Try different encodings
        encodings_to_try = ['utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1']
        file_content = None
        used_encoding = None
        
        for enc in encodings_to_try:
            try:
                with open(notebook_path, 'r', encoding=enc) as f:
                    file_content = f.read()
                used_encoding = enc
                print(f"✅ Successfully read with {enc} encoding")
                break
            except:
                continue
        
        if file_content is None:
            raise Exception("Could not read file with any encoding")
        
        # Write back as UTF-8
        temp_path = notebook_path + '.utf8.tmp'
        with open(temp_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
        
        # Use the temp file
        notebook_path = temp_path
        print(f"✅ Created UTF-8 version: {temp_path}")
    
    # Pre-analysis
    print("\\n🔍 Pre-conversion analysis...")
    try:
        analysis = analyze_notebook_annotations(notebook_path)
    except Exception as analysis_error:
        print(f"❌ Pre-analysis failed: {analysis_error}")
        raise analysis_error
    
    if 'error' in analysis:
        raise Exception(f"Pre-analysis failed: {analysis['error']}")
    
    if not analysis['ready_for_conversion']:
        raise ValueError(f"No annotated cells found! Please add tags to notebook cells.")
    
    print(f"✅ Found {analysis['annotated_cells']} annotated cells")
    print(f"🔗 Detected {len(analysis['shared_variables'])} shared variables")
    
    # Conversion with encoding safety
    print("\\n🔄 Converting to KFP DSL...")
    try:
        # Create config with explicit encoding settings
        config = {
            'base_image': 'python:3.9',
            'packages': ['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
        }
        
        kfp_code = convert_notebook_to_kfp(notebook_path, output_path, config)
        
        # Verify output file was created and is readable
        if os.path.exists(output_path):
            try:
                with open(output_path, 'r', encoding='utf-8') as f:
                    test_content = f.read(100)
                file_size = os.path.getsize(output_path)
                print(f"✅ Generated file: {file_size:,} bytes")
            except Exception as e:
                print(f"⚠️ Output file created but may have encoding issues: {e}")
        
        # Quick validation
        if '@dsl.component' in kfp_code and '@dsl.pipeline' in kfp_code:
            components = kfp_code.count('@dsl.component')
            print(f"🔧 Components: {components}")
            print(f"📊 Pipeline: ✅")
        else:
            print("⚠️ Generated code may be incomplete")
            
    except Exception as conversion_error:
        print(f"❌ Conversion failed: {conversion_error}")
        import traceback
        traceback.print_exc()
        raise conversion_error
    
    # Clean up temp file if created
    temp_file = notebook_path + '.utf8.tmp'
    if os.path.exists(temp_file):
        try:
            os.remove(temp_file)
            print("🧹 Cleaned up temporary file")
        except:
            pass
    
    print("\\n" + "=" * 50)
    print("🎉 CONVERSION COMPLETED!")
    print("=" * 50)
    print(f"📄 Generated: {os.path.basename(output_path)}")
    print(f"🔧 Components: {analysis['annotated_cells']}")
    print(f"🔗 Shared variables: {len(analysis['shared_variables'])}")
    print(f"⏰ Completed: {datetime.now().strftime('%H:%M:%S')}")
    
    print("\\n💡 Next steps:")
    print(f"   1. Review: {output_path}")
    print(f"   2. Compile: python {os.path.basename(output_path)} --compile")
    print(f"   3. Deploy: python {os.path.basename(output_path)} --kfp-host http://127.0.0.1:8080")
    
    print("=" * 50)
    
    f"🎉 Conversion successful! Generated: {output_path}"
    
except Exception as e:
    error_msg = f"❌ Conversion failed: {str(e)}"
    print(error_msg)
    
    # Additional debugging info
    print("\\n🔧 Debug Information:")
    print(f"   Python version: {sys.version}")
    print(f"   Default encoding: {sys.getdefaultencoding()}")
    print(f"   File system encoding: {sys.getfilesystemencoding()}")
    
    import traceback
    traceback.print_exc()
    raise e
    `;

    return this.executeCode(code);
  }

  /**
   * Get kernel status
   */
  async getStatus(): Promise<string> {
    const code = `
import sys
import os

print("=== Kernel Status ===")

# Python info
print(f"🐍 Python: {sys.version.split()[0]}")
print(f"📁 Working dir: {os.getcwd()}")

# Check packages
packages = ['nbformat', 'kfp', 'dill', 'pandas', 'numpy', 'sklearn']
available = []
for pkg in packages:
    try:
        __import__(pkg)
        available.append(pkg)
        print(f"✅ {pkg}")
    except ImportError:
        print(f"❌ {pkg}")

# Check converter functions
functions = ['convert_notebook_to_kfp', 'analyze_notebook_annotations']
converter_ready = True
for func in functions:
    if func in globals():
        print(f"✅ {func}")
    else:
        print(f"❌ {func}")
        converter_ready = False

print(f"\\n📊 Status: {'🟢 READY' if converter_ready else '🔴 NOT READY'}")

f"Status: {'Ready' if converter_ready else 'Not Ready'} | Packages: {len(available)}/{len(packages)}"
    `;

    return this.executeCode(code);
  }

  /**
   * Deploy pipeline to KFP cluster
   */
  async deployToKFP(pipelineFile: string, host: string = 'localhost:8080', experimentName: string = 'ML_Pipeline_Experiment'): Promise<string> {
    const code = `
import os
from datetime import datetime

print("=== Deploying Pipeline to KFP ===")

try:
    pipeline_file = r"${pipelineFile}"
    host = "${host}"
    experiment_name = "${experimentName}"
    
    print(f"📄 Pipeline file: {pipeline_file}")
    print(f"🌐 KFP host: {host}")
    print(f"📋 Experiment: {experiment_name}")
    
    # Check if pipeline file exists
    if not os.path.exists(pipeline_file):
        raise FileNotFoundError(f"Pipeline file not found: {pipeline_file}")
    
    # Install KFP if needed
    try:
        import kfp
        print(f"✅ KFP client available (version: {kfp.__version__})")
    except ImportError:
        print("📦 Installing KFP client...")
        import subprocess
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'kfp'], check=True)
        import kfp
        print(f"✅ KFP client installed (version: {kfp.__version__})")
    
    # Format host URL
    if not host.startswith('http'):
        host = f'http://{host}'
    
    print(f"🚀 Connecting to KFP at {host}")
    
    # Connect to KFP
    try:
        client = kfp.Client(host=host)
        print("✅ Connected to KFP cluster")
    except Exception as e:
        print(f"❌ Failed to connect to KFP: {e}")
        print("💡 Make sure KFP is running at {host}")
        raise e
    
    # Create or get experiment
    try:
        experiment = client.get_experiment(experiment_name=experiment_name)
        print(f"📋 Using existing experiment: {experiment_name}")
    except:
        try:
            experiment = client.create_experiment(name=experiment_name)
            print(f"📋 Created new experiment: {experiment_name}")
        except Exception as e:
            print(f"⚠️ Could not create experiment, using default: {e}")
            experiment_name = "Default"
    
    # Generate unique run name
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    run_name = f'ml_pipeline_run_{timestamp}'
    
    print(f"🔄 Submitting pipeline run: {run_name}")
    
    # Load and execute the pipeline Python file
    print("📦 Loading pipeline from file...")
    
    # Read the pipeline file and execute it
    with open(pipeline_file, 'r') as f:
        pipeline_code = f.read()
    
    # Execute the pipeline code to get the pipeline function
    exec_globals = {}
    exec(pipeline_code, exec_globals)
    
    # Find the pipeline function
    pipeline_func = None
    for name, obj in exec_globals.items():
        if callable(obj) and hasattr(obj, '__annotations__') and name.endswith('_pipeline'):
            pipeline_func = obj
            print(f"✅ Found pipeline function: {name}")
            break
    
    if not pipeline_func:
        # Try to find any function with @dsl.pipeline decorator
        for name, obj in exec_globals.items():
            if hasattr(obj, '_component_spec') or (hasattr(obj, '__name__') and 'pipeline' in obj.__name__):
                pipeline_func = obj
                print(f"✅ Found pipeline function: {name}")
                break
    
    if not pipeline_func:
        raise ValueError("No pipeline function found in the file")
    
    # Submit the pipeline run
    run_result = client.create_run_from_pipeline_func(
        pipeline_func=pipeline_func,
        arguments={},  # Add arguments if needed
        run_name=run_name,
        experiment_name=experiment_name,
        enable_caching=True
    )
    
    print(f"✅ Pipeline submitted successfully!")
    print(f"📊 Run ID: {run_result.run_id}")
    print(f"🌐 View run: {host}/#/runs/details/{run_result.run_id}")
    
    f"🚀 Deployed! Run ID: {run_result.run_id} | View at: {host}/#/runs/details/{run_result.run_id}"
    
except Exception as e:
    error_msg = f"❌ Deployment failed: {str(e)}"
    print(error_msg)
    raise e
    `;

    return this.executeCode(code);
  }

  /**
   * Check KFP cluster status
   */
  async checkKFPStatus(host: string = 'localhost:8080'): Promise<string> {
    const code = `
print("=== Checking KFP Cluster Status ===")

try:
    host = "${host}"
    
    # Format host URL
    if not host.startswith('http'):
        host = f'http://{host}'
    
    print(f"🌐 Checking KFP at: {host}")
    
    # Try to import KFP
    try:
        import kfp
        print(f"✅ KFP client available (version: {kfp.__version__})")
    except ImportError:
        print("❌ KFP client not installed")
        print("💡 Install with: pip install kfp")
        raise ImportError("KFP client not available")
    
    # Test connection
    try:
        client = kfp.Client(host=host)
        print("✅ Successfully connected to KFP cluster")
        
        # Get cluster info
        try:
            experiments = client.list_experiments()
            print(f"📋 Available experiments: {experiments.total_size}")
            
            # List some experiments
            if experiments.experiments:
                print("📋 Recent experiments:")
                for exp in experiments.experiments[:5]:
                    print(f"   - {exp.display_name} (ID: {exp.experiment_id})")
            
            # Get recent runs
            runs = client.list_runs(page_size=5)
            print(f"🔄 Recent runs: {runs.total_size}")
            
            if runs.runs:
                print("🔄 Latest runs:")
                for run in runs.runs[:3]:
                    status = run.status if hasattr(run, 'status') else 'Unknown'
                    print(f"   - {run.display_name}: {status}")
            
        except Exception as e:
            print(f"⚠️ Connected but could not fetch details: {e}")
        
        status_message = f"✅ KFP cluster is healthy at {host}"
        
    except Exception as e:
        print(f"❌ Failed to connect to KFP cluster: {e}")
        print("💡 Troubleshooting:")
        print(f"   1. Check if KFP is running: curl {host}/apis/v1beta1/healthz")
        print(f"   2. Verify the host address: {host}")
        print(f"   3. Check firewall/network settings")
        status_message = f"❌ KFP cluster not accessible at {host}"
        raise e
    
    status_message
    
except Exception as e:
    error_msg = f"❌ Status check failed: {str(e)}"
    print(error_msg)
    raise e
    `;

    return this.executeCode(code);
  }

  /**
   * Get pipeline run status
   */
  async getRunStatus(runId: string, host: string = 'localhost:8080'): Promise<string> {
    const code = `
print("=== Getting Pipeline Run Status ===")

try:
    run_id = "${runId}"
    host = "${host}"
    
    # Format host URL
    if not host.startswith('http'):
        host = f'http://{host}'
    
    print(f"🔍 Checking run: {run_id}")
    print(f"🌐 KFP host: {host}")
    
    import kfp
    client = kfp.Client(host=host)
    
    # Get run details
    run_details = client.get_run(run_id)
    
    print(f"📊 Run Details:")
    print(f"   Name: {run_details.run.display_name}")
    print(f"   Status: {run_details.run.status}")
    print(f"   Created: {run_details.run.created_at}")
    
    if run_details.run.finished_at:
        print(f"   Finished: {run_details.run.finished_at}")
    
    if run_details.run.error:
        print(f"   Error: {run_details.run.error}")
    
    # Get experiment info
    if run_details.run.experiment_id:
        try:
            experiment = client.get_experiment(run_details.run.experiment_id)
            print(f"   Experiment: {experiment.display_name}")
        except:
            print(f"   Experiment ID: {run_details.run.experiment_id}")
    
    print(f"\\n🌐 View run: {host}/#/runs/details/{run_id}")
    
    f"📊 Run {run_id}: {run_details.run.status}"
    
except Exception as e:
    error_msg = f"❌ Failed to get run status: {str(e)}"
    print(error_msg)
    raise e
    `;

    return this.executeCode(code);
  }

  /**
   * List recent pipeline runs
   */
  async listRuns(host: string = 'localhost:8080', limit: number = 10): Promise<string> {
    const code = `
print("=== Listing Recent Pipeline Runs ===")

try:
    host = "${host}"
    limit = ${limit}
    
    # Format host URL
    if not host.startswith('http'):
        host = f'http://{host}'
    
    print(f"🌐 KFP host: {host}")
    print(f"📊 Showing {limit} recent runs")
    
    import kfp
    client = kfp.Client(host=host)
    
    # Get recent runs
    runs = client.list_runs(page_size=limit)
    
    if not runs.runs:
        print("📋 No runs found")
        return "No runs found"
    
    print(f"\\n📋 Found {runs.total_size} total runs:")
    print("=" * 80)
    
    for i, run in enumerate(runs.runs, 1):
        status = run.status if hasattr(run, 'status') else 'Unknown'
        created = run.created_at.strftime('%Y-%m-%d %H:%M:%S') if run.created_at else 'Unknown'
        
        print(f"{i:2d}. {run.display_name}")
        print(f"    Status: {status}")
        print(f"    Created: {created}")
        print(f"    Run ID: {run.run_id}")
        print(f"    URL: {host}/#/runs/details/{run.run_id}")
        print("-" * 40)
    
    f"📋 Listed {len(runs.runs)} recent runs"
    
except Exception as e:
    error_msg = f"❌ Failed to list runs: {str(e)}"
    print(error_msg)
    raise e
    `;

    return this.executeCode(code);
  }
  async createTestNotebook(filename: string = 'test_ml_pipeline.ipynb'): Promise<string> {
    const code = `
import nbformat as nbf

print(f"📝 Creating test notebook: ${filename}")

# Create notebook
nb = nbf.v4.new_notebook()

# Add cells with ML pipeline tags
cells = [
    nbf.v4.new_markdown_cell("# Test ML Pipeline"),
    
    # Data loading
    nbf.v4.new_code_cell(
        "# Data Loading\\nimport pandas as pd\\nimport numpy as np\\nfrom sklearn.datasets import load_iris\\n\\niris = load_iris()\\ndata = pd.DataFrame(iris.data, columns=iris.feature_names)\\ndata['target'] = iris.target\\n\\nprint(f'Dataset: {data.shape}')",
        metadata={"tags": ["step:data-loading"]}
    ),
    
    # Preprocessing
    nbf.v4.new_code_cell(
        "# Preprocessing\\nfrom sklearn.model_selection import train_test_split\\nfrom sklearn.preprocessing import StandardScaler\\n\\nX = data.drop('target', axis=1)\\ny = data['target']\\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\\n\\nscaler = StandardScaler()\\nX_train_scaled = scaler.fit_transform(X_train)\\nX_test_scaled = scaler.transform(X_test)",
        metadata={"tags": ["step:preprocessing"]}
    ),
    
    # Training
    nbf.v4.new_code_cell(
        "# Training\\nfrom sklearn.ensemble import RandomForestClassifier\\n\\nmodel = RandomForestClassifier(n_estimators=100, random_state=42)\\nmodel.fit(X_train_scaled, y_train)\\ny_pred = model.predict(X_test_scaled)",
        metadata={"tags": ["step:training"]}
    ),
    
    # Evaluation
    nbf.v4.new_code_cell(
        "# Evaluation\\nfrom sklearn.metrics import accuracy_score\\n\\naccuracy = accuracy_score(y_test, y_pred)\\nprint(f'Accuracy: {accuracy:.4f}')\\nmetrics = {'accuracy': accuracy}",
        metadata={"tags": ["step:evaluation"]}
    )
]

nb.cells = cells

# Write notebook
try:
    with open('${filename}', 'w', encoding='utf-8') as f:
        nbf.write(nb, f)
    
    print(f"✅ Test notebook created: ${filename}")
    print(f"📊 Cells: {len(nb.cells)} ({len([c for c in nb.cells if c.get('metadata', {}).get('tags')])} tagged)")
    
    f"✅ Created {filename} with tagged cells"
    
except Exception as e:
    print(f"❌ Failed: {e}")
    raise e
    `;

    return this.executeCode(code);
  }

  /**
   * Utility methods
   */
  async isAlive(): Promise<boolean> {
    return this._kernel !== null && !this._kernel.isDisposed;
  }

  async interrupt(): Promise<void> {
    if (this._kernel) {
      await this._kernel.interrupt();
    }
  }

  async restart(): Promise<void> {
    if (this._kernel) {
      await this._kernel.restart();
    }
  }

  async shutdown(): Promise<void> {
    if (this._kernel) {
      try {
        await this._kernel.shutdown();
        this._kernel.dispose();
      } catch (error) {
        console.warn('Error shutting down kernel:', error);
      } finally {
        this._kernel = null;
      }
    }
  }

  async cleanup(): Promise<string> {
    const code = `
import gc

print("🧹 Cleaning up...")

# Clear variables
cleared = 0
for name in list(globals().keys()):
    if not name.startswith('_') and name not in ['gc', 'cleanup']:
        try:
            del globals()[name]
            cleared += 1
        except:
            pass

# Garbage collection
collected = gc.collect()

print(f"✅ Cleanup: {cleared} vars, {collected} objects")

f"🧹 Cleanup: {cleared} variables, {collected} objects"
    `;

    return this.executeCode(code);
  }
}