"""
Clean Notebook to KFP v2 DSL Converter - Fixed All Syntax Issues
Converts annotated Jupyter notebooks directly to Kubeflow Pipelines v2 DSL
"""

import nbformat
import os
import re
import ast
import json
import sys
from typing import Dict, List, Any, Set, Optional, Tuple
from textwrap import dedent, indent


class NotebookToKFPConverter:
    """
    Converts annotated Jupyter notebooks directly to KFP v2 DSL Python code
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the converter"""
        self.config = config or {}
        self.base_image = self.config.get('base_image', 'python:3.9')  # Updated to 3.9
        self.default_packages = self.config.get('default_packages', [
            'pandas', 'numpy', 'scikit-learn'
        ])
        
        # Track components and pipeline structure
        self.components = []
        self.pipeline_name = "notebook_pipeline"
        self.pipeline_description = "Generated from annotated notebook"
        
    def convert_notebook(self, notebook_path: str, output_path: Optional[str] = None) -> str:
        """Convert annotated notebook to KFP v2 DSL"""
        if not os.path.exists(notebook_path):
            raise FileNotFoundError(f"Notebook file not found: {notebook_path}")
        
        # Load and validate notebook
        notebook = self._load_notebook(notebook_path)
        self._validate_notebook(notebook)
        
        # Extract pipeline metadata
        self.pipeline_name = self._extract_pipeline_name(notebook_path)
        
        # Analyze annotated cells
        annotated_cells = self._extract_annotated_cells(notebook)
        
        if not annotated_cells:
            raise ValueError("No annotated cells found! Please add tags like 'step:data-loading' to cells.")
        
        # Generate components
        self.components = []
        for cell_info in annotated_cells:
            component = self._generate_component_from_cell(cell_info)
            if component:
                self.components.append(component)
        
        # Generate complete KFP DSL
        kfp_code = self._generate_complete_kfp_dsl()
        
        # Save to file if specified
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(kfp_code)
            print(f" KFP DSL generated: {output_path}")
        
        return kfp_code
    
    def _load_notebook(self, notebook_path: str) -> nbformat.NotebookNode:
        """Load notebook from file"""
        with open(notebook_path, 'r', encoding='utf-8') as f:
            return nbformat.read(f, as_version=4)
    
    def _validate_notebook(self, notebook: nbformat.NotebookNode) -> None:
        """Validate notebook structure"""
        if not notebook.cells:
            raise ValueError("Notebook has no cells")
        
        code_cells = [cell for cell in notebook.cells if cell.cell_type == 'code']
        if not code_cells:
            raise ValueError("Notebook has no code cells")
    
    def _extract_pipeline_name(self, notebook_path: str) -> str:
        """Extract clean pipeline name from notebook path"""
        base_name = os.path.splitext(os.path.basename(notebook_path))[0]
        # Clean name for Python function
        clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', base_name)
        if clean_name and clean_name[0].isdigit():
            clean_name = f"pipeline_{clean_name}"
        return clean_name or "notebook_pipeline"
    
    def _extract_annotated_cells(self, notebook: nbformat.NotebookNode) -> List[Dict[str, Any]]:
        """Extract cells with pipeline annotations (tags)"""
        annotated_cells = []
        
        for i, cell in enumerate(notebook.cells):
            if cell.cell_type != 'code':
                continue
            
            # Get cell tags safely
            cell_metadata = cell.get('metadata', {})
            if not isinstance(cell_metadata, dict):
                cell_metadata = {}
            
            tags = cell_metadata.get('tags', [])
            if not isinstance(tags, list):
                tags = []
            
            if not tags:
                continue
            
            # Filter for pipeline-relevant tags
            pipeline_tags = [tag for tag in tags if self._is_pipeline_tag(tag)]
            if not pipeline_tags:
                continue
            
            # Extract cell source code
            source_code = cell.get('source', '')
            if isinstance(source_code, list):
                source_code = ''.join(source_code)
            
            if not source_code.strip():
                continue
            
            # Analyze cell dependencies
            dependencies = self._analyze_cell_dependencies(source_code)
            packages = self._analyze_required_packages(source_code)
            
            cell_info = {
                'index': i,
                'tags': pipeline_tags,
                'primary_tag': pipeline_tags[0],  # Use first tag as primary
                'source_code': source_code.strip(),
                'dependencies': dependencies,
                'packages': packages,
                'execution_count': cell.get('execution_count', 0)
            }
            
            annotated_cells.append(cell_info)
        
        return annotated_cells
    
    def _is_pipeline_tag(self, tag: str) -> bool:
        """Check if tag is relevant for pipeline generation"""
        if not isinstance(tag, str):
            return False
            
        pipeline_prefixes = ['step:', 'component:', 'task:', 'stage:']
        pipeline_tags = ['pipeline-parameters', 'pipeline-metrics', 'pipeline-config']
        
        return (any(tag.startswith(prefix) for prefix in pipeline_prefixes) or 
                tag in pipeline_tags)
    
    def _analyze_cell_dependencies(self, source_code: str) -> Dict[str, Set[str]]:
        """Analyze variable dependencies in cell code"""
        try:
            tree = ast.parse(source_code)
            defined = set()
            used = set()
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Name):
                    if isinstance(node.ctx, ast.Store):
                        defined.add(node.id)
                    elif isinstance(node.ctx, ast.Load):
                        used.add(node.id)
                elif isinstance(node, ast.arg):
                    defined.add(node.arg)
            
            return {'defined': defined, 'used': used}
        except:
            return {'defined': set(), 'used': set()}
    
    def _analyze_required_packages(self, source_code: str) -> List[str]:
        """Analyze Python code to determine required packages"""
        packages = set(self.default_packages)
        
        # Common import patterns
        import_patterns = {
            r'import pandas|from pandas': 'pandas',
            r'import numpy|from numpy': 'numpy',
            r'import sklearn|from sklearn': 'scikit-learn',
            r'import matplotlib|from matplotlib': 'matplotlib',
            r'import seaborn|from seaborn': 'seaborn',
            r'import plotly|from plotly': 'plotly',
            r'import tensorflow|import tf': 'tensorflow',
            r'import torch|from torch': 'torch',
            r'import joblib|from joblib': 'joblib',
            r'import xgboost|import xgb': 'xgboost',
            r'import lightgbm|import lgb': 'lightgbm',
            r'import requests': 'requests',
            r'import boto3': 'boto3',
            r'import google|from google': 'google-cloud-storage',
        }
        
        for pattern, package in import_patterns.items():
            if re.search(pattern, source_code, re.IGNORECASE):
                packages.add(package)
        
        return sorted(list(packages))
    
    def _generate_component_from_cell(self, cell_info: Dict[str, Any]) -> str:
        """Generate KFP component from annotated cell"""
        tag = cell_info['primary_tag']
        source_code = cell_info['source_code']
        packages = cell_info['packages']
        
        # Generate clean component name
        component_name = self._generate_component_name(tag, cell_info['index'])
        
        # Handle different types of pipeline steps
        if tag.startswith('step:'):
            return self._generate_step_component(component_name, source_code, packages, cell_info)
        elif tag == 'pipeline-parameters':
            return self._generate_parameter_component(component_name, source_code, packages, cell_info)
        elif tag == 'pipeline-metrics':
            return self._generate_metrics_component(component_name, source_code, packages, cell_info)
        else:
            return self._generate_generic_component(component_name, source_code, packages, cell_info)
    
    def _generate_component_name(self, tag: str, cell_index: int) -> str:
        """Generate clean component name from tag"""
        if tag.startswith('step:'):
            name = tag[5:]  # Remove 'step:' prefix
        elif tag.startswith('component:'):
            name = tag[10:]  # Remove 'component:' prefix
        else:
            name = f"{tag}_{cell_index}"
        
        # Clean name for Python function
        clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
        if clean_name and clean_name[0].isdigit():
            clean_name = f"step_{clean_name}"
        
        return clean_name or f"component_{cell_index}"
    
    def _generate_step_component(self, name: str, source_code: str, packages: List[str], cell_info: Dict[str, Any]) -> str:
        """Generate a standard pipeline step component"""
        # Determine output type based on code analysis
        outputs = self._analyze_outputs(source_code)
        
        # Clean and prepare code
        cleaned_code = self._clean_python_code(source_code)
        
        # Generate output signature
        output_sig = self._generate_output_signature(outputs)
        
        # Generate return statement
        return_stmt = self._generate_return_statement(outputs)
        
        component_code = f'''@dsl.component(
    base_image='{self.base_image}',
    packages_to_install={packages}
)
def {name}(){output_sig}:
    """
    Pipeline step: {cell_info['primary_tag']}
    Generated from notebook cell {cell_info['index']}
    Original tags: {', '.join(cell_info['tags'])}
    """
    # Imports
    import os
    import sys
    import json
    import pickle
    from pathlib import Path
    
    print(f"Executing {name} component...")
    print(f"Original cell content from notebook cell {cell_info['index']}")
    
    # Original cell code
{indent(cleaned_code, '    ')}
    
    print(f"{name} component execution completed")
    
    # Return results
{return_stmt}'''
        
        return component_code
    
    def _generate_parameter_component(self, name: str, source_code: str, packages: List[str], cell_info: Dict[str, Any]) -> str:
        """Generate component for pipeline parameters"""
        cleaned_code = self._clean_python_code(source_code)
        
        component_code = f'''@dsl.component(
    base_image='{self.base_image}',
    packages_to_install={packages}
)
def {name}() -> dict:
    """
    Pipeline parameters configuration
    Generated from notebook cell {cell_info['index']}
    """
    import json
    
    print(f"Loading pipeline parameters from cell {cell_info['index']}...")
    
{indent(cleaned_code, '    ')}
    
    # Extract parameters from local variables
    params = {{k: v for k, v in locals().items() 
             if not k.startswith('_') and not callable(v) and k not in ['json', 'print']}}
    
    print(f"Loaded parameters: {{list(params.keys())}}")
    print("Parameters loaded successfully")
    
    return params'''
        
        return component_code
    
    def _generate_metrics_component(self, name: str, source_code: str, packages: List[str], cell_info: Dict[str, Any]) -> str:
        """Generate component for pipeline metrics"""
        cleaned_code = self._clean_python_code(source_code)
        
        component_code = f'''@dsl.component(
    base_image='{self.base_image}',
    packages_to_install={packages}
)
def {name}() -> NamedTuple('Metrics', [('metrics', dict)]):
    """
    Pipeline metrics calculation
    Generated from notebook cell {cell_info['index']}
    """
    import json
    from typing import NamedTuple
    
    print(f"Computing metrics from cell {cell_info['index']}...")
    
{indent(cleaned_code, '    ')}
    
    # Extract metrics from local variables
    metrics = {{k: v for k, v in locals().items() 
              if not k.startswith('_') and not callable(v) and 
              isinstance(v, (int, float, str, bool)) and 
              k not in ['json', 'NamedTuple', 'print']}}
    
    print(f"Computed metrics: {{list(metrics.keys())}}")
    print("Metrics computation completed")
    
    from collections import namedtuple
    Metrics = namedtuple('Metrics', ['metrics'])
    return Metrics(metrics)'''
        
        return component_code
    
    def _generate_generic_component(self, name: str, source_code: str, packages: List[str], cell_info: Dict[str, Any]) -> str:
        """Generate generic component"""
        cleaned_code = self._clean_python_code(source_code)
        
        component_code = f'''@dsl.component(
    base_image='{self.base_image}',
    packages_to_install={packages}
)
def {name}() -> str:
    """
    Generic pipeline component: {cell_info['primary_tag']}
    Generated from notebook cell {cell_info['index']}
    """
    import os
    import sys
    
    print(f"Executing {name} component (generic)...")
    print(f"Original cell content from notebook cell {cell_info['index']}")
    
{indent(cleaned_code, '    ')}
    
    # Try to provide meaningful output
    result_vars = [k for k in locals().keys() if not k.startswith('_') and not callable(locals()[k]) and k not in ['os', 'sys', 'print']]
    
    if result_vars:
        output = f"{name} completed. Created: {{', '.join(result_vars[:3])}}"
        if len(result_vars) > 3:
            output += f" (and {{len(result_vars) - 3}} more variables)"
    else:
        output = f"{name} component executed successfully"
    
    print(output)
    return output'''
        
        return component_code
    
    def _analyze_outputs(self, source_code: str) -> Dict[str, str]:
        """Analyze code to determine output types"""
        outputs = {}
        
        # Simple pattern matching for common outputs
        if re.search(r'\.fit\(|\.train\(|model\s*=', source_code, re.IGNORECASE):
            outputs['model'] = 'Model'
        
        if re.search(r'\.csv|\.to_csv|dataframe|df\s*=', source_code, re.IGNORECASE):
            outputs['dataset'] = 'Dataset'
        
        if re.search(r'accuracy|precision|recall|f1|score|metric', source_code, re.IGNORECASE):
            outputs['metrics'] = 'Metrics'
        
        if re.search(r'\.png|\.jpg|\.pdf|plot|figure', source_code, re.IGNORECASE):
            outputs['artifacts'] = 'Artifact'
        
        return outputs
    
    def _generate_output_signature(self, outputs: Dict[str, str]) -> str:
        """Generate function signature with outputs"""
        if not outputs:
            return " -> str"
        
        if len(outputs) == 1:
            output_type = list(outputs.values())[0]
            return f" -> {output_type}"
        
        # Multiple outputs - use NamedTuple
        output_items = [f"('{name}', {type_})" for name, type_ in outputs.items()]
        return f" -> NamedTuple('Outputs', [{', '.join(output_items)}])"
    
    def _generate_return_statement(self, outputs: Dict[str, str]) -> str:
        """Generate appropriate return statement with meaningful outputs"""
        if not outputs:
            # Instead of generic message, try to return something from the actual execution
            return '''    # Try to return meaningful output from the executed code
    result_vars = [k for k in locals().keys() if not k.startswith('_') and not callable(locals()[k])]
    if result_vars:
        # Return a summary of what was created/computed
        summary = f"Executed successfully. Created variables: {', '.join(result_vars[:5])}"
        if len(result_vars) > 5:
            summary += f" and {len(result_vars) - 5} more"
        return summary
    else:
        return "Step completed successfully"'''
        
        if len(outputs) == 1:
            output_name = list(outputs.keys())[0]
            return f'''    # Return the specific output if available
    if "{output_name}" in locals():
        return str({output_name}) if hasattr({output_name}, '__str__') else f"Created {output_name}"
    else:
        return "Expected output '{output_name}' not found, but step completed"'''
        
        # Multiple outputs
        return_items = [f'locals().get("{name}", f"Missing: {name}")' for name in outputs.keys()]
        outputs_list = list(outputs.keys())
        
        return_code = f'''    from collections import namedtuple
    Outputs = namedtuple('Outputs', {outputs_list})
    return Outputs({', '.join(return_items)})'''
        
        return return_code
    
    def _clean_python_code(self, code: str) -> str:
        """Clean and format Python code"""
        if not code:
            return "pass"
        
        # Remove excessive whitespace and normalize
        lines = code.strip().split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Remove trailing whitespace but preserve indentation
            cleaned_line = line.rstrip()
            if cleaned_line or (not cleaned_lines or cleaned_lines[-1]):
                cleaned_lines.append(cleaned_line)
        
        return '\n'.join(cleaned_lines)
    
    def _generate_complete_kfp_dsl(self) -> str:
        """Generate complete KFP v2 DSL file"""
        imports = self._generate_imports()
        components_code = self._generate_components_section()
        pipeline_code = self._generate_pipeline_function()
        compilation_code = self._generate_compilation_section()
        
        complete_code = f'''{imports}

# =============================================================================
# GENERATED COMPONENTS FROM NOTEBOOK CELLS
# =============================================================================

{components_code}

# =============================================================================
# PIPELINE DEFINITION
# =============================================================================

{pipeline_code}

# =============================================================================
# COMPILATION AND EXECUTION
# =============================================================================

{compilation_code}'''
        
        return complete_code
    
    def _generate_imports(self) -> str:
        """Generate import statements"""
        return '''"""
Generated Kubeflow Pipelines v2 DSL from Annotated Jupyter Notebook
Auto-generated code - modify as needed for your specific requirements

Generated by: Pipeline Builder Extension
Source: Annotated Jupyter Notebook
Target: KFP v2 DSL Python
"""

from kfp import dsl, compiler
from kfp.dsl import Input, Output, Model, Dataset, Metrics, Artifact, component, pipeline
from typing import NamedTuple, Dict, List, Any
import os'''
    
    def _generate_components_section(self) -> str:
        """Generate the components section"""
        if not self.components:
            return "# No annotated cells found in notebook"
        
        return '\n\n'.join(self.components)
    
    def _generate_pipeline_function(self) -> str:
        """Generate the main pipeline function"""
        if not self.components:
            return self._generate_empty_pipeline()
        
        # Extract component names
        component_names = []
        for component in self.components:
            match = re.search(r'def (\w+)\(', component)
            if match:
                component_names.append(match.group(1))
        
        # Generate pipeline tasks
        tasks = []
        for i, component_name in enumerate(component_names):
            if i == 0:
                tasks.append(f"    {component_name}_task = {component_name}()")
            else:
                # Simple sequential dependency
                prev_task = f"{component_names[i-1]}_task"
                tasks.append(f"    {component_name}_task = {component_name}().after({prev_task})")
        
        tasks_code = '\n'.join(tasks) if tasks else "    pass"
        
        pipeline_func = f'''@dsl.pipeline(
    name='{self.pipeline_name}',
    description='{self.pipeline_description}'
)
def {self.pipeline_name}_pipeline():
    """
    Generated pipeline from annotated notebook cells
    
    Pipeline steps:
{self._generate_pipeline_summary()}
    """
{tasks_code}'''
        
        return pipeline_func
    
    def _generate_empty_pipeline(self) -> str:
        """Generate empty pipeline template"""
        pipeline_func = f'''@dsl.pipeline(
    name='{self.pipeline_name}',
    description='Empty pipeline - no annotated cells found'
)
def {self.pipeline_name}_pipeline():
    """
    Empty pipeline - please annotate notebook cells with tags like:
    - step:data-loading
    - step:preprocessing
    - step:training
    - step:evaluation
    """
    pass'''
        
        return pipeline_func
    
    def _generate_pipeline_summary(self) -> str:
        """Generate pipeline summary for documentation"""
        if not self.components:
            return "    - No components found"
        
        summary_lines = []
        for i, component in enumerate(self.components, 1):
            match = re.search(r'def (\w+)\(', component)
            component_name = match.group(1) if match else f"component_{i}"
            summary_lines.append(f"    - Step {i}: {component_name}")
        
        return '\n'.join(summary_lines)
    
    def _generate_compilation_section(self) -> str:
        """Generate compilation and execution code"""
        compilation_code = f'''def compile_pipeline(output_path: str = None) -> str:
    """
    Compile the pipeline to a YAML file
    
    Args:
        output_path: Path where to save the compiled pipeline
        
    Returns:
        Path to the compiled pipeline file
    """
    if output_path is None:
        output_path = '{self.pipeline_name}_kfp_pipeline.yaml'
    
    compiler.Compiler().compile(
        pipeline_func={self.pipeline_name}_pipeline,
        package_path=output_path
    )
    
    print(f" Pipeline compiled successfully!")
    print(f" Generated file: " + output_path)
    return output_path


def run_pipeline_local():
    """
    Run the pipeline locally for testing
    """
    print(" Running pipeline locally...")
    try:
        {self.pipeline_name}_pipeline()
        print(" Local pipeline execution completed!")
    except Exception as e:
        print(f" Local pipeline execution failed: " + str(e))
        
    except ImportError:
        print("  KFP local execution not available, running components individually...")
        try:
            # Fallback: run components individually without KFP
            print(" Running components individually...")
            
            # Get all component functions
            import inspect
            current_module = inspect.currentframe().f_globals
            
            # Find component functions (those decorated with @dsl.component)
            component_functions = []
            for name, obj in current_module.items():
                if (callable(obj) and 
                    hasattr(obj, '__name__') and 
                    not name.startswith('_') and
                    name not in ['main', 'compile_pipeline', 'run_pipeline_local', 'submit_pipeline']):
                    component_functions.append((name, obj))
            
            # Sort components to run in order
            component_functions.sort(key=lambda x: x[0])
            
            print(f" Found {{len(component_functions)}} components to execute")
            
            # Execute each component
            results = {{}}
            for comp_name, comp_func in component_functions:
                print(f"\\n Executing {{comp_name}}...")
                try:
                    # Get the actual function (unwrap from KFP decorator if needed)
                    if hasattr(comp_func, 'python_func'):
                        actual_func = comp_func.python_func
                    else:
                        actual_func = comp_func
                    
                    # Execute the component
                    result = actual_func()
                    results[comp_name] = result
                    print(f" {{comp_name}} completed: {{result}}")
                    
                except Exception as e:
                    print(f" {{comp_name}} failed: {{e}}")
                    raise e
            
            print("\\n All components executed successfully!")
            print(" Results summary:")
            for comp_name, result in results.items():
                result_str = str(result)[:100] + "..." if len(str(result)) > 100 else str(result)
                print(f"   {{comp_name}}: {{result_str}}")
                
        except Exception as e:
            print(f" Component execution failed: {{e}}")
            raise e
            
    except Exception as e:
        print(f" Local pipeline execution failed: {{e}}")
        raise e


def submit_pipeline(host: str = None, **pipeline_args) -> str:
    """
    Submit the pipeline to a KFP cluster
    
    Args:
        host: KFP cluster host URL
        **pipeline_args: Arguments to pass to the pipeline
        
    Returns:
        Run ID of the submitted pipeline
    """
    if host is None:
        raise ValueError("KFP host URL is required to submit the pipeline")
    
    import kfp
    
    try:
        # Connect to KFP cluster
        client = kfp.Client(host=host)
        
        # Filter out KFP-specific arguments that aren't pipeline parameters
        kfp_args = {{'experiment_name', 'run_name', 'namespace'}}
        actual_pipeline_args = {{}}
        for key, value in pipeline_args.items():
            if key not in kfp_args:
                actual_pipeline_args[key] = value
        
        # Extract KFP-specific arguments
        experiment_name = pipeline_args.get('experiment_name', 'default')
        run_name = pipeline_args.get('run_name', '{self.pipeline_name}-run')
        
        # Create or get experiment
        try:
            experiment = client.get_experiment(experiment_name=experiment_name)
            print(" Using existing experiment: " + experiment_name)
        except:
            try:
                experiment = client.create_experiment(name=experiment_name)
                print(" Created new experiment: " + experiment_name)
            except:
                print(" Using default experiment")
                experiment_name = None
        
        # Submit pipeline run with only actual pipeline parameters
        if experiment_name:
            run_result = client.create_run_from_pipeline_func(
                pipeline_func={self.pipeline_name}_pipeline,
                arguments=actual_pipeline_args,
                run_name=run_name,
                experiment_name=experiment_name
            )
        else:
            run_result = client.create_run_from_pipeline_func(
                pipeline_func={self.pipeline_name}_pipeline,
                arguments=actual_pipeline_args,
                run_name=run_name
            )
        
        print("Pipeline submitted successfully!")
        print("Run ID: " + run_result.run_id)
        print("View run: " + host + "/#/runs/details/" + run_result.run_id)
        
        return run_result.run_id
        
    except Exception as e:
        print("Pipeline submission failed: " + str(e))
        raise


def main():
    """Main execution function"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description="Generated KFP Pipeline")
    parser.add_argument("--compile", action="store_true", default=True, 
                       help="Compile pipeline to YAML (default)")
    parser.add_argument("--run-local", action="store_true", 
                       help="Run pipeline locally for testing")
    parser.add_argument("--kfp-host", type=str, 
                       help="KFP cluster host URL for submission")
    parser.add_argument("--experiment", type=str, default="default",
                       help="KFP experiment name")
    parser.add_argument("--run-name", type=str,
                       help="KFP run name")
    parser.add_argument("--output", "-o", type=str,
                       help="Output path for compiled YAML")
    
    # If no arguments provided, just compile by default
    if len(sys.argv) == 1:
        print(" Compiling pipeline (default action)...")
        compile_pipeline()
        return
    
    args = parser.parse_args()
    
    try:
        if args.compile and not args.run_local and not args.kfp_host:
            # Default: compile to YAML
            print(" Compiling pipeline to YAML...")
            output_file = compile_pipeline(args.output)
            print(" Pipeline compiled to: " + output_file)
            print(" Next steps:")
            print("   - Test locally: python " + sys.argv[0] + " --run-local")
            print("   - Submit to KFP: python " + sys.argv[0] + " --kfp-host <URL>")
        
        if args.run_local:
            print(" Running pipeline locally...")
            run_pipeline_local()
        
        if args.kfp_host:
            print(" Submitting pipeline to KFP cluster: " + args.kfp_host)
            
            # Prepare submission arguments
            submission_args = {{}}
            if args.experiment:
                submission_args['experiment_name'] = args.experiment
            if args.run_name:
                submission_args['run_name'] = args.run_name
            
            run_id = submit_pipeline(
                host=args.kfp_host,
                **submission_args
            )
            print(" Pipeline submitted with run ID: " + run_id)
    
    except Exception as e:
        print(" Error: " + str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()'''
        
        return compilation_code


# =============================================================================
# MAIN CONVERSION FUNCTIONS - SAFE FOR EXEC
# =============================================================================

def convert_notebook_to_kfp(notebook_path: str, output_path: Optional[str] = None, 
                           config: Optional[Dict[str, Any]] = None) -> str:
    """
    Convert annotated notebook directly to KFP v2 DSL
    
    Args:
        notebook_path: Path to input notebook file
        output_path: Optional output path for generated Python file
        config: Optional configuration dictionary
        
    Returns:
        Generated KFP v2 DSL code as string
    """
    converter = NotebookToKFPConverter(config)
    return converter.convert_notebook(notebook_path, output_path)


def analyze_notebook_annotations(notebook_path: str) -> Dict[str, Any]:
    """
    Analyze notebook for pipeline annotations
    
    Args:
        notebook_path: Path to notebook file
        
    Returns:
        Analysis results dictionary
    """
    if not os.path.exists(notebook_path):
        return {'error': f'Notebook not found: {notebook_path}'}
    
    try:
        with open(notebook_path, 'r', encoding='utf-8') as f:
            notebook = nbformat.read(f, as_version=4)
        
        total_cells = len(notebook.cells)
        code_cells = sum(1 for cell in notebook.cells if cell.cell_type == 'code')
        
        annotated_cells = []
        for i, cell in enumerate(notebook.cells):
            if cell.cell_type == 'code':
                # Get tags safely
                cell_metadata = cell.get('metadata', {})
                if not isinstance(cell_metadata, dict):
                    cell_metadata = {}
                
                tags = cell_metadata.get('tags', [])
                if not isinstance(tags, list):
                    tags = []
                
                pipeline_tags = []
                for tag in tags:
                    if isinstance(tag, str):
                        if (any(tag.startswith(prefix) for prefix in ['step:', 'component:', 'task:']) or
                            tag in ['pipeline-parameters', 'pipeline-metrics']):
                            pipeline_tags.append(tag)
                
                if pipeline_tags:
                    source = cell.get('source', '')
                    if isinstance(source, list):
                        source = ''.join(source)
                    
                    annotated_cells.append({
                        'cell_index': i,
                        'tags': pipeline_tags,
                        'source_length': len(source)
                    })
        
        return {
            'total_cells': total_cells,
            'code_cells': code_cells,
            'annotated_cells': len(annotated_cells),
            'annotated_cell_details': annotated_cells,
            'ready_for_conversion': len(annotated_cells) > 0
        }
        
    except Exception as e:
        return {'error': f'Analysis failed: {str(e)}'}


# =============================================================================
# COMMAND LINE INTERFACE - ONLY RUNS WHEN CALLED AS SCRIPT
# =============================================================================

def main():
    """Main function for command line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Notebook to KFP Pipeline Converter")
    parser.add_argument("notebook", help="Input notebook file (.ipynb)")
    parser.add_argument("-o", "--output", help="Output Python file (.py)")
    parser.add_argument("-c", "--compile", action="store_true", help="Compile to YAML after generation")
    parser.add_argument("-v", "--validate", action="store_true", help="Validate pipeline after generation")
    parser.add_argument("--run-local", action="store_true", help="Run pipeline locally for testing")
    parser.add_argument("--kfp-host", help="KFP cluster host for submission")
    parser.add_argument("--experiment", default="default", help="KFP experiment name")
    
    args = parser.parse_args()
    
    try:
        print(f" Converting {args.notebook} to KFP v2 DSL...")
        
        # Analyze first
        analysis = analyze_notebook_annotations(args.notebook)
        if 'error' in analysis:
            print(f" Analysis failed: {analysis['error']}")
            sys.exit(1)
        
        print(f" Analysis results:")
        print(f"   - Total cells: {analysis['total_cells']}")
        print(f"   - Code cells: {analysis['code_cells']}")
        print(f"   - Annotated cells: {analysis['annotated_cells']}")
        
        if not analysis['ready_for_conversion']:
            print(" No annotated cells found! Please add tags like 'step:data-loading' to cells.")
            sys.exit(1)
        
        # Convert
        kfp_code = convert_notebook_to_kfp(args.notebook, args.output)
        
        print("="*60)
        print(" CONVERSION COMPLETED SUCCESSFULLY")
        print("="*60)
        if args.output:
            print(f" Output file: {args.output}")
        print(f" Generated code length: {len(kfp_code)} characters")
        print(f" Components generated: {analysis['annotated_cells']}")
        print("="*60)
        
    except Exception as e:
        print(f" Conversion failed: {e}")
        sys.exit(1)


# Safe loading check
if __name__ == "__main__":
    # Check if we're being run as a script with actual arguments
    if len(sys.argv) > 1 and not any(arg.startswith('-f') for arg in sys.argv):
        main()
    else:
        # This means we're probably in a Jupyter environment or being exec'd
        print(" Notebook to KFP converter module loaded successfully!")
        print(" Available functions:")
        print("   - convert_notebook_to_kfp(notebook_path, output_path)")
        print("   - analyze_notebook_annotations(notebook_path)")
        print("   - NotebookToKFPConverter class")
        print(" Ready for use in notebook cells or extension!")