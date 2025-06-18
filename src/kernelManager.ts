import { ServiceManager } from '@jupyterlab/services';
import { Kernel, KernelMessage } from '@jupyterlab/services';

/**
 * Enhanced manager class for handling kernel communication and direct notebook to KFP conversion
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
      // Shutdown existing kernel if any
      if (this._kernel) {
        await this.shutdown();
      }

      // Start a new kernel
      this._kernel = await this._serviceManager.kernels.startNew({
        name: 'python3'
      });

      console.log('Kernel started:', this._kernel.id);
      console.log('Kernel is ready');

      // Set up status change handler
      this._kernel.statusChanged.connect((sender, status) => {
        console.log('Kernel status changed:', status);
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
            errorOutput += errorMsg.content.traceback.join('\n');
            break;
        }
      };

      future.onReply = (msg: KernelMessage.IExecuteReplyMsg) => {
        if (msg.content.status === 'ok') {
          resolve(output || 'Code executed successfully (no output)');
        } else {
          reject(new Error(errorOutput || 'Unknown execution error'));
        }
      };

      future.onStdin = (msg: KernelMessage.IStdinMessage) => {
        console.log('Stdin message received:', msg);
      };

      setTimeout(() => {
        reject(new Error('Execution timeout after 30 seconds'));
      }, 30000);
    });
  }

  /**
   * Get kernel information
   */
  async getKernelInfo(): Promise<any> {
    if (!this._kernel) {
      throw new Error('Kernel not started');
    }

    const future = this._kernel.requestKernelInfo();
    const reply = await future;
    
    if (!reply) {
      throw new Error('Failed to get kernel info - no reply received');
    }
    
    return reply.content;
  }

  /**
   * Check if kernel is alive
   */
  isAlive(): boolean {
    return this._kernel !== null && !this._kernel.isDisposed;
  }

  /**
   * Get kernel ID
   */
  getKernelId(): string | null {
    return this._kernel ? this._kernel.id : null;
  }

  /**
   * Interrupt the kernel
   */
  async interrupt(): Promise<void> {
    if (this._kernel) {
      await this._kernel.interrupt();
    }
  }

  /**
   * Restart the kernel
   */
  async restart(): Promise<void> {
    if (this._kernel) {
      await this._kernel.restart();
    }
  }

  /**
   * Shutdown the kernel
   */
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

  /**
   * Enhanced initialization of the direct notebook to KFP converter
   */
  async initializeNotebookToKFPConverter(): Promise<string> {
    const code = `
import sys
import os
import subprocess

print("=== Enhanced Notebook to KFP Converter Initialization ===")

# Install required packages
required_packages = ['nbformat', 'kfp']
for package in required_packages:
    try:
        if package == 'kfp':
            import kfp
            print(f"✓ {package} already available (version: {kfp.__version__})")
        else:
            __import__(package)
            print(f"✓ {package} already available")
    except ImportError:
        print(f"📦 Installing {package}...")
        try:
            result = subprocess.run([sys.executable, '-m', 'pip', 'install', package], 
                                  capture_output=True, text=True, check=True)
            print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e.stderr}")
            raise Exception(f"Package installation failed: {package}")

# Define converter paths to check
converter_paths = [
    os.path.join(os.getcwd(), 'src', 'processors', 'notebook_to_kfp_converter.py'),
    os.path.join(os.getcwd(), 'lib', 'processors', 'notebook_to_kfp_converter.py'),
    'notebook_to_kfp_converter.py'  # Current directory fallback
]

converter_loaded = False
loaded_from = None

print("\\n🔍 Searching for converter file...")
for path in converter_paths:
    print(f"  📁 Checking: {path}")
    if os.path.exists(path):
        print(f"  ✅ Found converter at: {path}")
        try:
            # Check file size
            file_size = os.path.getsize(path)
            print(f"  📊 File size: {file_size} bytes")
            
            if file_size == 0:
                print(f"  ⚠️ File is empty: {path}")
                continue
            
            # Read the converter file content
            with open(path, 'r', encoding='utf-8') as f:
                converter_code = f.read()
            
            print(f"  📄 Read {len(converter_code)} characters")
            print(f"  🔄 Loading converter module...")
            
            # Create a safe execution environment
            converter_globals = {}
            
            # Execute the converter code in isolated environment
            exec(converter_code, converter_globals)
            
            # Import the functions we need into the main namespace
            globals()['convert_notebook_to_kfp'] = converter_globals['convert_notebook_to_kfp']
            globals()['analyze_notebook_annotations'] = converter_globals['analyze_notebook_annotations']
            globals()['NotebookToKFPConverter'] = converter_globals['NotebookToKFPConverter']
            
            print(f"  ✅ Successfully loaded converter from: {path}")
            converter_loaded = True
            loaded_from = path
            break
            
        except Exception as e:
            print(f"  ❌ Error loading {path}: {e}")
            import traceback
            print(f"  📋 Traceback:")
            traceback.print_exc()
            continue
    else:
        print(f"  ❌ Not found: {path}")

if not converter_loaded:
    print("\\n❌ CONVERTER LOADING FAILED")
    print("\\n📋 Troubleshooting steps:")
    print("1. Ensure the converter file exists in one of these locations:")
    for path in converter_paths:
        print(f"   📁 {path}")
    print("2. Run the build process:")
    print("   📦 jlpm copy-python && jlpm build")
    print("3. Check file permissions and content")
    print("\\n📁 Current directory structure:")
    try:
        current_dir = os.getcwd()
        print(f"   📍 Working directory: {current_dir}")
        
        for item in os.listdir('.'):
            if os.path.isdir(item) and item in ['src', 'lib']:
                print(f"   📂 {item}/")
                processors_dir = os.path.join(item, 'processors')
                if os.path.exists(processors_dir):
                    print(f"     📂 processors/")
                    for file in os.listdir(processors_dir):
                        if file.endswith('.py'):
                            size = os.path.getsize(os.path.join(processors_dir, file))
                            print(f"       📄 {file} ({size} bytes)")
                else:
                    print(f"     ❌ processors/ directory not found")
            elif item.endswith('.py') and 'converter' in item:
                size = os.path.getsize(item)
                print(f"   📄 {item} ({size} bytes)")
    except Exception as e:
        print(f"   ❌ Error listing directory: {e}")
    
    raise FileNotFoundError("Converter file not found in expected locations")

# Test the loaded converter functions
print("\\n=== Testing Converter Functions ===")
required_functions = ['convert_notebook_to_kfp', 'analyze_notebook_annotations', 'NotebookToKFPConverter']
missing_functions = []

for func_name in required_functions:
    if func_name in globals():
        print(f"✅ {func_name}: Available")
        # Test if it's callable
        if callable(globals()[func_name]):
            print(f"   🔧 Function is callable")
        else:
            print(f"   ⚠️ Object is not callable")
    else:
        print(f"❌ {func_name}: Missing")
        missing_functions.append(func_name)

if missing_functions:
    print(f"\\n⚠️ Missing functions: {', '.join(missing_functions)}")
    print("🔧 The converter file may be incomplete or have syntax errors.")
else:
    print("\\n✅ All required functions are available and ready!")

# Final status
print("\\n=== Initialization Status ===")
if converter_loaded and not missing_functions:
    print(f"🎉 Enhanced notebook to KFP converter ready!")
    print(f"📁 Loaded from: {loaded_from}")
    print(f"🔧 Functions available: {len(required_functions)}")
    result_message = "✅ Enhanced converter initialized successfully - ready for notebook conversion!"
else:
    print("⚠️ Converter initialization completed with issues")
    result_message = "⚠️ Converter initialization completed with warnings - check logs above"

print("\\n💡 Usage:")
print("   📖 analyze_notebook_annotations('notebook.ipynb')")
print("   🔄 convert_notebook_to_kfp('notebook.ipynb', 'output.py')")

result_message
    `;

    return this.executeCode(code);
  }

  /**
   * Enhanced notebook analysis with better error handling
   */
  async analyzeNotebookAnnotations(notebookPath: string): Promise<string> {
    const code = `
import os
import sys

print("=== Enhanced Notebook Annotation Analysis ===")

try:
    notebook_path = r"""${notebookPath}"""
    print(f"🔍 Analyzing: {notebook_path}")
    
    # Verify file exists
    if not os.path.exists(notebook_path):
        raise FileNotFoundError(f"❌ Notebook not found: {notebook_path}")
    
    # Check file size
    file_size = os.path.getsize(notebook_path)
    print(f"📊 File size: {file_size} bytes")
    
    if file_size == 0:
        raise ValueError("❌ Notebook file is empty")
    
    # Check if converter functions are available
    if 'analyze_notebook_annotations' not in globals():
        raise NameError("❌ analyze_notebook_annotations function not available. Please initialize the converter first.")
    
    print("🔄 Running analysis...")
    
    # Perform analysis with error handling
    try:
        analysis = analyze_notebook_annotations(notebook_path)
    except Exception as analysis_error:
        print(f"❌ Analysis function failed: {analysis_error}")
        raise analysis_error
    
    if 'error' in analysis:
        print(f"❌ Analysis failed: {analysis['error']}")
        raise Exception(analysis['error'])
    
    print("✅ Analysis completed successfully!")
    print("\\n📊 Analysis Results:")
    print("=" * 50)
    print(f"📖 Total cells: {analysis['total_cells']}")
    print(f"🐍 Code cells: {analysis['code_cells']}")
    print(f"🏷️ Annotated cells: {analysis['annotated_cells']}")
    print(f"✅ Ready for conversion: {analysis['ready_for_conversion']}")
    
    if analysis['annotated_cells'] > 0:
        print(f"\\n📝 Annotated Cell Details:")
        print("-" * 30)
        for i, cell_detail in enumerate(analysis['annotated_cell_details'], 1):
            cell_idx = cell_detail['cell_index']
            tags = cell_detail['tags']
            source_len = cell_detail.get('source_length', 0)
            print(f"  {i}. Cell {cell_idx + 1}:")
            print(f"     🏷️ Tags: {', '.join(tags)}")
            print(f"     📏 Code length: {source_len} characters")
        
        print(f"\\n🎯 Pipeline Readiness:")
        if analysis['ready_for_conversion']:
            print("  ✅ Ready to convert to KFP pipeline!")
            print("  💡 Next step: Click 'Convert to KFP v2 DSL'")
        else:
            print("  ⚠️ Not ready for conversion")
    else:
        print(f"\\n⚠️ No annotated cells found!")
        print("💡 To create a pipeline, add tags to your cells:")
        print("   🏷️ step:data-loading - for data ingestion")
        print("   🏷️ step:preprocessing - for data cleaning") 
        print("   🏷️ step:training - for model training")
        print("   🏷️ step:evaluation - for model evaluation")
        print("   🏷️ pipeline-parameters - for configuration")
        print("\\n📝 How to add tags:")
        print("   1. Select a code cell")
        print("   2. Click a tag button in the Pipeline Builder panel")
        print("   3. Repeat for all relevant cells")
        print("   4. Run analysis again")
    
    print("=" * 50)
    
    f"📊 Analysis complete: {analysis['annotated_cells']} annotated cells found ({'ready' if analysis['ready_for_conversion'] else 'not ready'} for conversion)"
    
except FileNotFoundError as e:
    error_msg = f"❌ File error: {str(e)}"
    print(error_msg)
    raise e
except NameError as e:
    error_msg = f"❌ Converter not initialized: {str(e)}"
    print(error_msg)
    print("💡 Please run 'Initialize Converter' first")
    raise e
except Exception as e:
    error_msg = f"❌ Analysis failed: {str(e)}"
    print(error_msg)
    print("\\n🔧 Troubleshooting:")
    print("  1. Ensure the notebook file is valid JSON")
    print("  2. Check that cells have proper metadata")
    print("  3. Verify file permissions")
    import traceback
    print("\\n📋 Full traceback:")
    traceback.print_exc()
    raise e
    `;

    return this.executeCode(code);
  }

  /**
   * Enhanced notebook to KFP conversion with comprehensive error handling
   */
  async convertNotebookToKFP(notebookPath: string, outputPath?: string): Promise<string> {
    const code = `
import os
import sys
from datetime import datetime

print("=== Enhanced Notebook to KFP v2 DSL Conversion ===")

try:
    notebook_path = r"""${notebookPath}"""
    output_path = r"""${outputPath || notebookPath.replace('.ipynb', '_enhanced_kfp_pipeline.py')}"""
    
    print(f"📖 Input notebook: {notebook_path}")
    print(f"📄 Output KFP DSL: {output_path}")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verify input file
    if not os.path.exists(notebook_path):
        raise FileNotFoundError(f"❌ Notebook not found: {notebook_path}")
    
    file_size = os.path.getsize(notebook_path)
    print(f"📊 Input file size: {file_size} bytes")
    
    # Check converter availability
    if 'convert_notebook_to_kfp' not in globals():
        raise NameError("❌ convert_notebook_to_kfp function not available. Please initialize the converter first.")
    
    if 'analyze_notebook_annotations' not in globals():
        raise NameError("❌ analyze_notebook_annotations function not available. Please initialize the converter first.")
    
    # Pre-conversion analysis
    print("\\n🔍 Step 1: Pre-conversion Analysis")
    print("-" * 40)
    
    try:
        analysis = analyze_notebook_annotations(notebook_path)
    except Exception as analysis_error:
        print(f"❌ Pre-analysis failed: {analysis_error}")
        raise analysis_error
    
    if 'error' in analysis:
        raise Exception(f"Pre-analysis failed: {analysis['error']}")
    
    print(f"📊 Found {analysis['annotated_cells']} annotated cells")
    print(f"📖 Total cells: {analysis['total_cells']}")
    print(f"🐍 Code cells: {analysis['code_cells']}")
    
    if not analysis['ready_for_conversion']:
        raise ValueError(f"❌ No annotated cells found! Found {analysis['annotated_cells']} annotated cells. Please add tags like 'step:data-loading' to cells.")
    
    print(f"✅ Pre-analysis passed - ready for conversion")
    
    # Conversion process
    print("\\n🔄 Step 2: KFP v2 DSL Conversion")
    print("-" * 40)
    
    try:
        print("🔧 Converting notebook to KFP components...")
        kfp_code = convert_notebook_to_kfp(notebook_path, output_path)
        print(f"✅ Conversion completed successfully!")
    except Exception as conversion_error:
        print(f"❌ Conversion failed: {conversion_error}")
        import traceback
        print("📋 Conversion traceback:")
        traceback.print_exc()
        raise conversion_error
    
    # Verify output
    print("\\n🔍 Step 3: Output Verification")
    print("-" * 40)
    
    if os.path.exists(output_path):
        output_size = os.path.getsize(output_path)
        print(f"✅ Output file created: {output_size} bytes")
        
        # Quick validation of generated code
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                generated_code = f.read()
            
            # Basic checks
            if 'from kfp import dsl' in generated_code:
                print("✅ KFP imports found")
            else:
                print("⚠️ KFP imports not found")
                
            if '@dsl.component' in generated_code:
                component_count = generated_code.count('@dsl.component')
                print(f"✅ Found {component_count} KFP components")
            else:
                print("⚠️ No KFP components found")
                
            if '@dsl.pipeline' in generated_code:
                print("✅ Pipeline function found")
            else:
                print("⚠️ Pipeline function not found")
                
        except Exception as validation_error:
            print(f"⚠️ Output validation failed: {validation_error}")
    else:
        print(f"❌ Output file not created: {output_path}")
    
    # Success summary
    print("\\n" + "=" * 60)
    print("🎉 ENHANCED CONVERSION COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"📖 Source: {os.path.basename(notebook_path)}")
    print(f"📄 Generated: {os.path.basename(output_path)}")
    print(f"📊 Code size: {len(kfp_code):,} characters")
    print(f"🔧 Components: {analysis['annotated_cells']}")
    print(f"⏰ Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("\\n💡 Next Steps:")
    print(f"   1. 📄 Review generated file: {output_path}")
    print(f"   2. 🔨 Compile pipeline: python {os.path.basename(output_path)}")
    print(f"   3. 🧪 Test locally: python {os.path.basename(output_path)} --run-local")
    print(f"   4. 🚀 Deploy to KFP: python {os.path.basename(output_path)} --kfp-host <URL>")
    
    print("=" * 60)
    
    f"🎉 Enhanced conversion successful! Generated: {output_path}"
    
except FileNotFoundError as e:
    error_msg = f"❌ File not found: {str(e)}"
    print(error_msg)
    print("🔧 Please ensure the notebook file exists and is accessible")
    raise e
except NameError as e:
    error_msg = f"❌ Converter not ready: {str(e)}"
    print(error_msg)
    print("💡 Please initialize the converter first using 'Initialize Converter'")
    raise e
except ValueError as e:
    error_msg = f"❌ Validation error: {str(e)}"
    print(error_msg)
    print("💡 Please add tags to your notebook cells:")
    print("   🏷️ Select cells and use the tagging buttons in the panel")
    raise e
except Exception as e:
    error_msg = f"❌ Conversion failed: {str(e)}"
    print(error_msg)
    print("\\n🔧 Troubleshooting steps:")
    print("  1. Check notebook format and structure")
    print("  2. Verify cell tags are properly formatted") 
    print("  3. Ensure cells contain valid Python code")
    print("  4. Try re-initializing the converter")
    import traceback
    print("\\n📋 Full error traceback:")
    traceback.print_exc()
    raise e
    `;

    return this.executeCode(code);
  }

  /**
   * Install Python packages in the kernel
   */
  async installPackage(packageName: string): Promise<string> {
    const code = `
import subprocess
import sys

print(f"📦 Installing {packageName}...")

try:
    result = subprocess.run([sys.executable, '-m', 'pip', 'install', '${packageName}'], 
                          capture_output=True, text=True, check=True)
    print(f"✅ Successfully installed ${packageName}")
    if result.stdout:
        print("📋 Installation output:")
        print(result.stdout)
    "✅ Installation completed successfully"
except subprocess.CalledProcessError as e:
    error_msg = f"❌ Failed to install ${packageName}"
    print(error_msg)
    if e.stderr:
        print(f"📋 Error details: {e.stderr}")
    raise e
    `;

    return this.executeCode(code);
  }

  /**
   * Get comprehensive kernel status and diagnostic information
   */
  async getKernelStatus(): Promise<string> {
    const code = `
import sys
import os
from datetime import datetime

print("=== Enhanced Kernel Status Report ===")
print(f"⏰ Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# Python environment
print("\\n🐍 Python Environment:")
print(f"   Version: {sys.version}")
print(f"   Executable: {sys.executable}")
print(f"   Platform: {sys.platform}")
print(f"   Working directory: {os.getcwd()}")

# Memory usage
try:
    import psutil
    process = psutil.Process()
    memory_info = process.memory_info()
    print(f"   Memory usage: {memory_info.rss / 1024 / 1024:.1f} MB")
except ImportError:
    print("   Memory info: psutil not available")

# Check key packages
print("\\n📦 Key Packages:")
key_packages = ['nbformat', 'kfp', 'pandas', 'numpy', 'sklearn', 'matplotlib']
for pkg in key_packages:
    try:
        module = __import__(pkg)
        if hasattr(module, '__version__'):
            print(f"   ✅ {pkg} v{module.__version__}")
        else:
            print(f"   ✅ {pkg} (version unknown)")
    except ImportError:
        print(f"   ❌ {pkg} not installed")

# Available converter functions
print("\\n🔧 Converter Functions:")
converter_functions = ['convert_notebook_to_kfp', 'analyze_notebook_annotations', 'NotebookToKFPConverter']
available_count = 0
for func in converter_functions:
    if func in globals():
        print(f"   ✅ {func}")
        available_count += 1
    else:
        print(f"   ❌ {func}")

print(f"\\n📊 Converter status: {available_count}/{len(converter_functions)} functions available")

# Check for converter files
print("\\n📁 Converter Files:")
converter_paths = [
    'src/processors/notebook_to_kfp_converter.py',
    'lib/processors/notebook_to_kfp_converter.py',
    'notebook_to_kfp_converter.py'
]

files_found = 0
for path in converter_paths:
    if os.path.exists(path):
        size = os.path.getsize(path)
        print(f"   ✅ {path} ({size:,} bytes)")
        files_found += 1
    else:
        print(f"   ❌ {path}")

# System capabilities
print("\\n🔧 System Capabilities:")
print(f"   📁 File system access: {'✅' if os.access('.', os.R_OK | os.W_OK) else '❌'}")
print(f"   🌐 Network access: {'✅' if 'requests' in [pkg for pkg in key_packages if pkg in globals()] else '❓'}")
print(f"   💾 Can write files: {'✅' if os.access('.', os.W_OK) else '❌'}")

# Overall status
print(f"\\n=== Overall Status ===")
if available_count == len(converter_functions) and files_found > 0:
    status = "🟢 READY"
    print(f"{status} - All systems operational!")
    print("💡 Ready to analyze notebooks and generate KFP pipelines")
elif available_count > 0:
    status = "🟡 PARTIAL"
    print(f"{status} - Some functions available")
    print("💡 May need to re-initialize converter")
else:
    status = "🔴 NOT READY" 
    print(f"{status} - Converter not initialized")
    print("💡 Please run 'Initialize Converter' first")

f"📊 Status: {status} | Functions: {available_count}/{len(converter_functions)} | Files: {files_found}/{len(converter_paths)}"
    `;

    return this.executeCode(code);
  }

  /**
   * Clean up kernel resources
   */
  async cleanup(): Promise<string> {
    const code = `
import gc
import sys

print("🧹 Enhanced Kernel Cleanup...")

# Clear large variables
cleared_count = 0
memory_freed = 0

for name in list(globals().keys()):
    if not name.startswith('_') and name not in ['cleanup', 'gc', 'sys']:
        try:
            obj = globals()[name]
            if hasattr(obj, '__sizeof__'):
                obj_size = obj.__sizeof__()
                if obj_size > 1024*1024:  # > 1MB
                    memory_freed += obj_size
                    del globals()[name]
                    cleared_count += 1
        except:
            pass

# Force garbage collection
collected = gc.collect()

print(f"✅ Cleanup completed:")
print(f"   🗑️ Cleared {cleared_count} large variables")
print(f"   💾 Freed ~{memory_freed // (1024*1024)} MB memory")
print(f"   🔄 Garbage collected: {collected} objects")

"🧹 Enhanced cleanup completed successfully"
    `;

    return this.executeCode(code);
  }

  /**
   * Test converter functionality
   */
  async testConverter(): Promise<string> {
    const code = `
print("🧪 Testing Converter Functionality...")

try:
    # Test if functions are available
    functions_to_test = ['analyze_notebook_annotations', 'convert_notebook_to_kfp', 'NotebookToKFPConverter']
    
    print("\\n🔍 Function Availability Test:")
    for func_name in functions_to_test:
        if func_name in globals():
            func = globals()[func_name]
            if callable(func):
                print(f"   ✅ {func_name}: Available and callable")
            else:
                print(f"   ⚠️ {func_name}: Available but not callable")
        else:
            print(f"   ❌ {func_name}: Not available")
    
    # Test class instantiation
    print("\\n🏗️ Class Instantiation Test:")
    if 'NotebookToKFPConverter' in globals():
        try:
            converter = NotebookToKFPConverter()
            print("   ✅ NotebookToKFPConverter: Can instantiate")
            
            # Test basic methods
            if hasattr(converter, 'convert_notebook'):
                print("   ✅ convert_notebook method: Available")
            else:
                print("   ❌ convert_notebook method: Missing")
                
            if hasattr(converter, '_is_pipeline_tag'):
                # Test tag recognition
                test_tags = ['step:data-loading', 'step:training', 'pipeline-parameters', 'invalid-tag']
                print("   🏷️ Tag Recognition Test:")
                for tag in test_tags:
                    is_valid = converter._is_pipeline_tag(tag)
                    status = "✅" if is_valid else "❌"
                    print(f"     {status} '{tag}': {is_valid}")
            
        except Exception as e:
            print(f"   ❌ NotebookToKFPConverter: Instantiation failed - {e}")
    else:
        print("   ❌ NotebookToKFPConverter: Class not available")
    
    # Test imports within converter
    print("\\n📦 Import Dependencies Test:")
    required_imports = ['nbformat', 'os', 're', 'ast', 'json']
    for module_name in required_imports:
        try:
            __import__(module_name)
            print(f"   ✅ {module_name}: Available")
        except ImportError:
            print(f"   ❌ {module_name}: Missing")
    
    print("\\n🎉 Converter testing completed!")
    
    "✅ Converter functionality test completed - check results above"
    
except Exception as e:
    error_msg = f"❌ Converter test failed: {e}"
    print(error_msg)
    import traceback
    traceback.print_exc()
    raise e
    `;

    return this.executeCode(code);
  }

  /**
   * Create a simple test notebook for demonstration
   */
  async createTestNotebook(filename: string = 'test_pipeline.ipynb'): Promise<string> {
    const code = `
import nbformat as nbf
import json

print(f"📝 Creating test notebook: {filename}")

# Create a new notebook
nb = nbf.v4.new_notebook()

# Add cells with pipeline annotations
cells = [
    # Markdown introduction
    nbf.v4.new_markdown_cell("# Test ML Pipeline\\n\\nThis is a test notebook for the Pipeline Builder extension."),
    
    # Data loading cell
    nbf.v4.new_code_cell(
        "# Data Loading\\nimport pandas as pd\\nimport numpy as np\\nfrom sklearn.datasets import load_iris\\n\\n# Load sample data\\niris = load_iris()\\ndf = pd.DataFrame(iris.data, columns=iris.feature_names)\\ndf['target'] = iris.target\\n\\nprint(f'Dataset shape: {df.shape}')\\nprint(df.head())",
        metadata={"tags": ["step:data-loading"]}
    ),
    
    # Preprocessing cell  
    nbf.v4.new_code_cell(
        "# Data Preprocessing\\nfrom sklearn.model_selection import train_test_split\\nfrom sklearn.preprocessing import StandardScaler\\n\\n# Split data\\nX = df.drop('target', axis=1)\\ny = df['target']\\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\\n\\n# Scale features\\nscaler = StandardScaler()\\nX_train_scaled = scaler.fit_transform(X_train)\\nX_test_scaled = scaler.transform(X_test)\\n\\nprint(f'Training set shape: {X_train_scaled.shape}')\\nprint(f'Test set shape: {X_test_scaled.shape}')",
        metadata={"tags": ["step:preprocessing"]}
    ),
    
    # Training cell
    nbf.v4.new_code_cell(
        "# Model Training\\nfrom sklearn.ensemble import RandomForestClassifier\\nfrom sklearn.metrics import accuracy_score, classification_report\\n\\n# Train model\\nmodel = RandomForestClassifier(n_estimators=100, random_state=42)\\nmodel.fit(X_train_scaled, y_train)\\n\\n# Make predictions\\ny_pred = model.predict(X_test_scaled)\\n\\nprint('Model training completed!')\\nprint(f'Model type: {type(model).__name__}')",
        metadata={"tags": ["step:training"]}
    ),
    
    # Evaluation cell
    nbf.v4.new_code_cell(
        "# Model Evaluation\\nfrom sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score\\n\\n# Calculate metrics\\naccuracy = accuracy_score(y_test, y_pred)\\nprecision = precision_score(y_test, y_pred, average='weighted')\\nrecall = recall_score(y_test, y_pred, average='weighted')\\nf1 = f1_score(y_test, y_pred, average='weighted')\\n\\nprint(f'Accuracy: {accuracy:.4f}')\\nprint(f'Precision: {precision:.4f}')\\nprint(f'Recall: {recall:.4f}')\\nprint(f'F1-score: {f1:.4f}')\\n\\nmetrics = {\\n    'accuracy': accuracy,\\n    'precision': precision,\\n    'recall': recall,\\n    'f1_score': f1\\n}",
        metadata={"tags": ["step:evaluation"]}
    ),
    
    # Parameters cell
    nbf.v4.new_code_cell(
        "# Pipeline Parameters\\n\\n# Model parameters\\nn_estimators = 100\\nrandom_state = 42\\ntest_size = 0.2\\n\\n# Data parameters\\ntarget_column = 'target'\\nfeature_columns = ['sepal length (cm)', 'sepal width (cm)', 'petal length (cm)', 'petal width (cm)']\\n\\nprint('Pipeline parameters defined')\\nprint(f'n_estimators: {n_estimators}')\\nprint(f'test_size: {test_size}')",
        metadata={"tags": ["pipeline-parameters"]}
    )
]

# Add cells to notebook
nb.cells = cells

# Add notebook metadata
nb.metadata = {
    "kernelspec": {
        "display_name": "Python 3",
        "language": "python", 
        "name": "python3"
    },
    "language_info": {
        "name": "python",
        "version": "3.8.0"
    },
    "pipeline": {
        "name": "iris_classification",
        "description": "Simple iris classification pipeline for testing"
    }
}

# Write notebook file
try:
    with open('${filename}', 'w', encoding='utf-8') as f:
        nbf.write(nb, f)
    
    print(f"✅ Test notebook created successfully!")
    print(f"📄 File: ${filename}")
    print(f"📊 Cells: {len(nb.cells)} total")
    print(f"🏷️ Tagged cells: {len([cell for cell in nb.cells if cell.get('metadata', {}).get('tags')])}")
    
    # Verify file was created
    import os
    if os.path.exists('${filename}'):
        file_size = os.path.getsize('${filename}')
        print(f"📁 File size: {file_size:,} bytes")
    
    print("\\n💡 Usage:")
    print(f"   1. Open {filename} in JupyterLab")
    print(f"   2. Use Pipeline Builder to analyze and convert")
    print(f"   3. All cells are already tagged for you!")
    
    f"✅ Test notebook '{filename}' created with {len([cell for cell in nb.cells if cell.get('metadata', {}).get('tags')])} tagged cells"
    
except Exception as e:
    error_msg = f"❌ Failed to create test notebook: {e}"
    print(error_msg)
    raise e
    `;

    return this.executeCode(code);
  }
}