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
    Simplified converter using shared imports and variables for ML pipeline components
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the converter"""
        self.config = config or {}
        self.base_image = self.config.get('base_image', 'python:3.9')
        
        # Base packages that are always included
        self.base_packages = self.config.get('base_packages', [
            'dill', 'pandas', 'numpy', 'scikit-learn', 'joblib'
        ])
        
        # Package mapping for common imports
        self.import_to_package = {
            'matplotlib': 'matplotlib',
            'seaborn': 'seaborn', 
            'plotly': 'plotly',
            'sklearn': 'scikit-learn',  # already in base
            'cv2': 'opencv-python',
            'PIL': 'Pillow',
            'torch': 'torch',
            'tensorflow': 'tensorflow',
            'keras': 'keras',
            'xgboost': 'xgboost',
            'lightgbm': 'lightgbm',
            'catboost': 'catboost',
            'scipy': 'scipy',
            'statsmodels': 'statsmodels',
            'requests': 'requests',
            'beautifulsoup4': 'beautifulsoup4',
            'bs4': 'beautifulsoup4',
        }
        
        # This will be populated after analyzing imports
        self.packages = self.base_packages.copy()
        
        # Track components and pipeline structure
        self.components = []
        self.pipeline_name = "ml_pipeline"
        self.pipeline_description = "ML pipeline from annotated notebook"
        self.shared_variables = {}  # Track variables shared between cells
        self.cell_variables = {}    # Track variables per cell
        self.shared_imports = set() # Track imports shared between cells

        # ML workflow tags
        self.supported_tags = {
            'step:data-loading': 'Data Loading',
            'step:preprocessing': 'Data Preprocessing', 
            'step:training': 'Model Training',
            'step:evaluation': 'Model Evaluation',
            'pipeline-parameters': 'Parameters'
        }

    def convert_notebook(self, notebook_path: str, output_path: Optional[str] = None) -> str:
        """Convert annotated notebook to KFP v2 DSL using shared imports and variables"""
        if not os.path.exists(notebook_path):
            raise FileNotFoundError(f"Notebook not found: {notebook_path}")
        
        # Load notebook
        notebook = self._load_notebook(notebook_path)
        self.pipeline_name = self._extract_pipeline_name(notebook_path)
        
        # Extract annotated cells and collect imports
        annotated_cells = self._extract_annotated_cells(notebook)
        if not annotated_cells:
            raise ValueError("No annotated cells found! Add tags like 'step:data-loading'")
        
        # Analyze variable sharing
        self._analyze_variable_sharing(annotated_cells)
        
        # Generate KFP components
        self.components = []
        for cell_info in annotated_cells:
            component = self._generate_kfp_component(cell_info)
            if component:
                self.components.append(component)
        
        # Generate complete KFP DSL
        kfp_code = self._generate_complete_kfp_dsl()
        
        # Save to file
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(kfp_code)
            print(f"KFP DSL generated: {output_path}")
        
        return kfp_code
    
    def _load_notebook(self, notebook_path: str) -> nbformat.NotebookNode:
        """Load notebook from file"""
        with open(notebook_path, 'r', encoding='utf-8') as f:
            return nbformat.read(f, as_version=4)
    
    def _extract_pipeline_name(self, notebook_path: str) -> str:
        """Extract pipeline name from notebook path"""
        base_name = os.path.splitext(os.path.basename(notebook_path))[0]
        clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', base_name)
        return clean_name or "ml_pipeline"
    
    def _extract_annotated_cells(self, notebook: nbformat.NotebookNode) -> List[Dict[str, Any]]:
        """Extract cells with ML pipeline annotations and collect all imports"""
        annotated_cells = []
        all_imports = set()  # Collect all imports from notebook
        
        for i, cell in enumerate(notebook.cells):
            if cell.cell_type != 'code':
                continue
            
            # Get cell tags
            cell_metadata = cell.get('metadata', {})
            tags = cell_metadata.get('tags', [])
            
            # Get cell source code
            source_code = cell.get('source', '')
            if isinstance(source_code, list):
                source_code = ''.join(source_code)
            
            # Extract imports from this cell
            cell_imports = self._extract_imports_from_code(source_code)
            all_imports.update(cell_imports)
            
            # Filter for supported tags
            ml_tags = [tag for tag in tags if tag in self.supported_tags]
            if not ml_tags:
                continue
            
            if not source_code.strip():
                continue
            
            # Analyze variables in this cell
            variables = self._analyze_cell_variables(source_code)
            
            cell_info = {
                'index': i,
                'tags': ml_tags,
                'primary_tag': ml_tags[0],
                'source_code': source_code.strip(),
                'variables': variables,
                'tag_description': self.supported_tags[ml_tags[0]],
                'imports': cell_imports  # Store imports for this cell
            }
            
            annotated_cells.append(cell_info)
        
        # Store all imports for sharing between components
        self.shared_imports = all_imports
        
        # Auto-detect and add required packages
        self._update_packages_from_imports(all_imports)
        
        return annotated_cells

    def _update_packages_from_imports(self, imports: Set[str]) -> None:
        """Update packages_to_install based on detected imports"""
        detected_packages = set()
        
        for import_stmt in imports:
            # Extract the main module name from import
            if import_stmt.startswith('import '):
                # Handle "import matplotlib.pyplot as plt" -> "matplotlib"
                module = import_stmt.split()[1].split('.')[0]
            elif import_stmt.startswith('from '):
                # Handle "from matplotlib import pyplot" -> "matplotlib"
                module = import_stmt.split()[1].split('.')[0]
            else:
                continue
            
            # Check if we have a package mapping for this module
            if module in self.import_to_package:
                package_name = self.import_to_package[module]
                detected_packages.add(package_name)
                print(f"📦 Detected import '{module}' -> adding package '{package_name}'")
        
        # Add detected packages to the base packages
        self.packages = list(set(self.base_packages + list(detected_packages)))
        
        if detected_packages:
            print(f"✅ Final packages: {self.packages}")

    def _extract_imports_from_code(self, source_code: str) -> Set[str]:
        """Extract import statements from source code"""
        imports = set()
        
        try:
            tree = ast.parse(source_code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.asname:
                            # Handle "import sklearn.metrics as skm"
                            imports.add(f"import {alias.name} as {alias.asname}")
                        else:    
                            imports.add(f"import {alias.name}")

                elif isinstance(node, ast.ImportFrom):
                    module = node.module or ''
                    for alias in node.names:
                        if alias.name == '*':
                            imports.add(f"from {module} import *")
                        elif alias.asname:
                            # Handle "from sklearn.metrics import accuracy_score as acc"
                            imports.add(f"from {module} import {alias.name} as {alias.asname}")
                        else:
                            # Handle "from sklearn.metrics import accuracy_score"
                            imports.add(f"from {module} import {alias.name}")
        except:
            # Fallback: simple regex parsing if AST fails
            lines = source_code.split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('import ') or line.startswith('from '):
                    # Clean up the import line
                    import_line = line.split('#')[0].strip()  # Remove comments
                    if import_line:
                        imports.add(import_line)
        
        return imports
    
    def _analyze_cell_variables(self, source_code: str) -> Dict[str, Set[str]]:
        """Analyze variables defined and used in cell code"""
        try:
            tree = ast.parse(source_code)
            defined = set()
            used = set()
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Name):
                    if self._is_ml_variable(node.id):
                        if isinstance(node.ctx, ast.Store):
                            defined.add(node.id)
                        elif isinstance(node.ctx, ast.Load):
                            used.add(node.id)
                elif isinstance(node, ast.arg):
                    if self._is_ml_variable(node.arg):
                        defined.add(node.arg)
            
            # Only track variables used from other cells
            external_used = used - defined
            
            return {'defined': defined, 'used': external_used}
        except:
            return {'defined': set(), 'used': set()}
    
    def _is_ml_variable(self, var_name: str) -> bool:
        """Check if variable is relevant for ML workflows"""
        if not var_name or len(var_name) <= 1:
            return False
        
        # Exclude Python builtins and common library names
        excluded = {
            'pd', 'np', 'plt', 'sklearn', 'joblib', 'pickle', 'os', 'sys',
            'i', 'j', 'k', 'idx', 'n', 'temp', 'tmp', 'len', 'range', 'print',
            'int', 'float', 'str', 'list', 'dict', 'tuple', 'set', 'bool'
        }
        
        if var_name in excluded or var_name.startswith('_') or '.' in var_name:
            return False
        
        return True
    
    def _analyze_variable_sharing(self, annotated_cells: List[Dict[str, Any]]) -> None:
        """Analyze which variables are shared between cells"""
        # Track variables across cells
        all_defined = {}  # var_name -> cell_index
        all_used = {}     # var_name -> [cell_indices]
        
        # First pass: collect all variables
        for cell_info in annotated_cells:
            cell_idx = cell_info['index']
            variables = cell_info['variables']
            
            # Track defined variables
            for var in variables['defined']:
                all_defined[var] = cell_idx
            
            # Track used variables
            for var in variables['used']:
                if var not in all_used:
                    all_used[var] = []
                all_used[var].append(cell_idx)
        
        # Second pass: identify shared variables
        self.shared_variables = {}
        for var_name, used_in_cells in all_used.items():
            if var_name in all_defined:
                defined_cell = all_defined[var_name]
                # Variable is shared if used in cells after where it's defined
                later_cells = [c for c in used_in_cells if c > defined_cell]
                if later_cells:
                    self.shared_variables[var_name] = {
                        'defined_in': defined_cell,
                        'used_in': later_cells,
                        'type': self._infer_variable_type(var_name)
                    }
        print(f"📊 Found {len(self.shared_variables)} shared variables across cells")
        # Store cell variable info for component generation
        for cell_info in annotated_cells:
            self.cell_variables[cell_info['index']] = cell_info['variables']
        print(f"📊 Cell variables analyzed: {self.cell_variables}")
    
    def _infer_variable_type(self, var_name: str) -> str:
        """Infer KFP artifact type for variable"""
        var_lower = var_name.lower()
        
        # Model variables
        if any(term in var_lower for term in ['model', 'classifier', 'regressor', 'estimator']):
            return 'Model'
        
        # Dataset variables
        if any(term in var_lower for term in ['data', 'df', 'dataset', 'x_train', 'x_test', 'y_train', 'y_test']):
            return 'Dataset'
        
        # Metrics variables
        if any(term in var_lower for term in ['accuracy', 'score', 'metric', 'result']):
            return 'Metrics'
        
        # Default to Artifact
        return 'Artifact'
    
    def _generate_shared_imports_block(self) -> str:
        """Generate imports block from all shared imports"""
        # Always include essential imports
        essential_imports = [
            'import os',
            'import pickle',
        ]
        
        if not self.shared_imports:
            # Default imports if none found
            default_imports = essential_imports + [
                'import pandas as pd',
                'import numpy as np',
                'from sklearn.metrics import accuracy_score, classification_report, confusion_matrix'
            ]
            return '\n    '.join([''] + default_imports) + '\n'
        
        # Combine essential + shared imports
        all_imports = essential_imports + sorted(list(self.shared_imports))
        # Remove duplicates while preserving order
        seen = set()
        unique_imports = []
        for imp in all_imports:
            if imp not in seen:
                unique_imports.append(imp)
                seen.add(imp)
        
        return '\n    '.join([''] + unique_imports) + '\n'
    
    def _generate_kfp_component(self, cell_info: Dict[str, Any]) -> str:
        """Generate KFP component using shared imports and variables"""
        cell_idx = cell_info['index']
        tag = cell_info['primary_tag']
        source_code = cell_info['source_code']
        
        # Generate component name
        component_name = self._generate_component_name(tag, cell_idx)
        
        # Determine inputs and outputs
        inputs = self._get_component_inputs(cell_idx)
        outputs = self._get_component_outputs(cell_idx)
        
        # Generate component code
        return self._generate_component_code(
            component_name, source_code, cell_info, inputs, outputs
        )
    
    def _get_component_inputs(self, cell_idx: int) -> List[str]:
        """Get input variables for this component"""
        inputs = []
        if cell_idx in self.cell_variables:
            used_vars = self.cell_variables[cell_idx]['used']
            for var in used_vars:
                if var in self.shared_variables:
                    defined_cell = self.shared_variables[var]['defined_in']
                    if defined_cell < cell_idx:
                        inputs.append(var)
        return inputs
    
    def _get_component_outputs(self, cell_idx: int) -> List[str]:
        """Get output variables for this component"""
        outputs = []
        if cell_idx in self.cell_variables:
            defined_vars = self.cell_variables[cell_idx]['defined']
            for var in defined_vars:
                if var in self.shared_variables:
                    used_cells = self.shared_variables[var]['used_in']
                    if any(used_cell > cell_idx for used_cell in used_cells):
                        outputs.append(var)
        return outputs
    
    def _generate_component_name(self, tag: str, cell_idx: int) -> str:
        """Generate clean component name"""
        if tag.startswith('step:'):
            name = tag[5:].replace('-', '_')
        else:
            name = f"component_{cell_idx}"
        
        return re.sub(r'[^a-zA-Z0-9_]', '_', name)
    
    def _generate_component_code(self, name: str, source_code: str, 
                                cell_info: Dict[str, Any], inputs: List[str], 
                                outputs: List[str]) -> str:
        """Generate KFP component code with Kale marshalling and robust loading"""
        
        # Component parameters
        input_params = []
        output_params = []
        
        # Add input parameters
        for var_name in inputs:
            var_type = self.shared_variables[var_name]['type']
            input_params.append(f"{var_name}_input: Input[{var_type}]")
        
        # Add output parameters  
        for var_name in outputs:
            var_type = self.shared_variables[var_name]['type']
            output_params.append(f"{var_name}_output: Output[{var_type}]")
        
        all_params = input_params + output_params
        param_string = ", ".join(all_params) if all_params else ""
        
        # Generate the code blocks
        shared_imports_block = self._generate_shared_imports_block()
        input_loading_block = self._generate_input_loading(inputs)
        output_saving_block = self._generate_output_saving(outputs)
        indented_source = indent(source_code, '    ')
        
        # Generate component with Kale marshal system
        component_code = f'''@dsl.component(
    base_image='{self.base_image}',
    packages_to_install={self.packages}
)
def {name}({param_string}):
    """
    {cell_info['tag_description']} component
    Generated from notebook cell {cell_info['index']}
    
    Inputs: {inputs}
    Outputs: {outputs}
    """
    # === SHARED IMPORTS FROM NOTEBOOK ==={shared_imports_block}
    
    print(f"Executing {name} component...")
    
    # Set up Kale marshal system
    class SimpleMarshal:
        def __init__(self):
            self._data_dir = '/tmp'
        
        def set_data_dir(self, path):
            self._data_dir = path
            os.makedirs(path, exist_ok=True)
            print(f"Marshal data dir: {{path}}")
        
        def save(self, obj, name):
            import joblib
            
            # Choose appropriate serialization
            obj_type = str(type(obj))
            
            if 'pandas' in obj_type:
                path = os.path.join(self._data_dir, f"{{name}}.pdpkl")
                if hasattr(obj, 'to_pickle'):
                    obj.to_pickle(path)
                else:
                    with open(path, 'wb') as f:
                        pickle.dump(obj, f)
            elif 'sklearn' in obj_type:
                path = os.path.join(self._data_dir, f"{{name}}.joblib")
                joblib.dump(obj, path)
            else:
                path = os.path.join(self._data_dir, f"{{name}}.pkl")
                with open(path, 'wb') as f:
                    pickle.dump(obj, f)
            
            print(f"Saved {{name}} to {{path}}")
            return path
        
        def load(self, name):
            # Use robust loading technique - check for files with and without extensions
            possible_files = [
                # First try files with extensions (from marshal.save)
                os.path.join(self._data_dir, f"{{name}}.pdpkl"),
                os.path.join(self._data_dir, f"{{name}}.joblib"), 
                os.path.join(self._data_dir, f"{{name}}.pkl"),
                # Then try the base name (from KFP artifact copy)
                os.path.join(self._data_dir, name)
            ]
            
            for file_path in possible_files:
                if os.path.exists(file_path):
                    print(f"Loading {{name}} from {{file_path}}")
                    return self.robust_load(file_path, name)
            
            available = os.listdir(self._data_dir) if os.path.exists(self._data_dir) else []
            raise FileNotFoundError(f"Cannot find {{name}} in {{self._data_dir}}. Available: {{available}}")
        
        def robust_load(self, file_path, var_name):
            """Robust loading with multiple fallback methods"""
            try:
                # Try joblib first (best for sklearn)
                import joblib
                result = joblib.load(file_path)
                print(f"Loaded {{var_name}} using joblib")
                return result
            except:
                pass
            
            try:
                # Try pickle with latin1 encoding (fixes most issues)
                with open(file_path, 'rb') as f:
                    result = pickle.load(f, encoding='latin1')
                print(f"Loaded {{var_name}} using pickle with latin1")
                return result
            except:
                pass
            
            try:
                # Try pandas for dataframes/series
                import pandas as pd
                result = pd.read_pickle(file_path)
                print(f"Loaded {{var_name}} using pandas")
                return result
            except:
                pass
            
            # Fallback to regular pickle
            with open(file_path, 'rb') as f:
                result = pickle.load(f)
            print(f"Loaded {{var_name}} using regular pickle")
            return result
    
    # Create marshal instance
    kale_marshal = SimpleMarshal()
    
    # Set up marshal directory
    import tempfile
    marshal_dir = tempfile.mkdtemp(prefix='kale_marshal_')
    kale_marshal.set_data_dir(marshal_dir)
    
{input_loading_block}
    
    # Execute original cell code
    print("Executing original notebook code...")
{indented_source}
    print("Code execution completed successfully")
    
{output_saving_block}
    
    print(f"{name} component completed successfully")'''
        
        return component_code
    
        
    def _generate_input_loading(self, inputs: List[str]) -> str:
        """Generate code to load input variables using Kale marshal with robust loading"""
        if not inputs:
            return "    # No input variables to load"
        
        loading_code = []
        loading_code.append("    # Load input variables using Kale marshal system")
        
        for var_name in inputs:
            loading_code.append(f"    # Load {var_name}")
            loading_code.append(f"    try:")
            loading_code.append(f"        print(f'Loading {var_name} from {var_name}_input.path')")
            loading_code.append(f"        print(f'Input artifact path: {{{var_name}_input.path}}')")
            loading_code.append(f"        ")
            loading_code.append(f"        # Copy from KFP artifact to marshal dir")
            loading_code.append(f"        import shutil")
            loading_code.append(f"        marshal_file = os.path.join(marshal_dir, '{var_name}')")
            loading_code.append(f"        shutil.copy2({var_name}_input.path, marshal_file)")
            loading_code.append(f"        # Load using Kale marshal with robust loading")
            loading_code.append(f"        {var_name} = kale_marshal.load('{var_name}')")
            loading_code.append(f"        print(f'Successfully loaded {var_name}')")
            loading_code.append(f"    except Exception as e:")
            loading_code.append(f"        print(f'Error loading {var_name}: {{e}}')")
            loading_code.append(f"        raise e")
            loading_code.append("")
        
        return '\n'.join(loading_code)

    def _generate_output_saving(self, outputs: List[str]) -> str:
        """Generate code to save output variables using Kale marshal system"""
        if not outputs:
            return "    # No output variables to save"
        
        saving_code = []
        saving_code.append("    # Save output variables using Kale marshal system")
        
        for var_name in outputs:
            saving_code.append(f"    # Save {var_name}")
            saving_code.append(f"    try:")
            saving_code.append(f"        if '{var_name}' in locals() and {var_name} is not None:")
            saving_code.append(f"            print(f'Saving {var_name} to {var_name}_output.path')")
            saving_code.append(f"            print(f'Output artifact path: {{{var_name}_output.path}}')")
            saving_code.append(f"            # Save using Kale marshal")
            saving_code.append(f"            marshal_file = kale_marshal.save({var_name}, '{var_name}')")
            saving_code.append(f"            # Copy to KFP artifact location")
            saving_code.append(f"            import shutil")
            saving_code.append(f"            os.makedirs(os.path.dirname({var_name}_output.path), exist_ok=True)")
            saving_code.append(f"            shutil.copy2(marshal_file, {var_name}_output.path)")
            saving_code.append(f"            print(f'Successfully saved {var_name}')")
            saving_code.append(f"        else:")
            saving_code.append(f"            print(f'Warning: {var_name} not found in locals')")
            saving_code.append(f"    except Exception as e:")
            saving_code.append(f"        print(f'Error saving {var_name}: {{e}}')")
            saving_code.append(f"        raise e")
            saving_code.append("")
        
        return '\n'.join(saving_code)
    
    def _generate_complete_kfp_dsl(self) -> str:
        """Generate complete KFP v2 DSL file"""
        imports = self._generate_imports()
        components_code = '\n\n'.join(self.components)
        pipeline_code = self._generate_pipeline_function()
        main_code = self._generate_main_section()
        
        return f'''{imports}

# =============================================================================
# GENERATED COMPONENTS WITH SHARED IMPORTS
# =============================================================================

{components_code}

# =============================================================================
# PIPELINE DEFINITION
# =============================================================================

{pipeline_code}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

{main_code}'''
    
    def _generate_imports(self) -> str:
        """Generate import statements"""
        return '''"""
ML Pipeline Generated from Annotated Notebook
Uses shared imports and variables between components
"""

from kfp import dsl, compiler
from kfp.dsl import Input, Output, Model, Dataset, Metrics, Artifact, component, pipeline
from typing import NamedTuple, Dict, List, Any
import os'''
    
    def _generate_pipeline_function(self) -> str:
        """Generate KFP pipeline function"""
        if not self.components:
            return self._generate_empty_pipeline()
        
        # Extract component info
        component_info = []
        for component in self.components:
            match = re.search(r'def (\w+)\(', component)
            if match:
                component_name = match.group(1)
                cell_match = re.search(r'notebook cell (\d+)', component)
                cell_idx = int(cell_match.group(1)) if cell_match else 0
                component_info.append((component_name, cell_idx))
        
        component_info.sort(key=lambda x: x[1])  # Sort by cell order
        
        # Generate pipeline tasks with dependencies
        tasks = []
        task_outputs = {}  # Track outputs from each task
        
        for component_name, cell_idx in component_info:
            task_name = f"{component_name}_task"
            
            # Get inputs for this component
            inputs = self._get_component_inputs(cell_idx)
            input_args = []
            
            for var_name in inputs:
                # Find which earlier task provides this variable
                defined_cell = self.shared_variables[var_name]['defined_in']
                for prev_task, prev_cell in task_outputs.items():
                    if prev_cell == defined_cell:
                        input_args.append(f"{var_name}_input={prev_task}.outputs['{var_name}_output']")
                        break
            
            # Generate task
            if input_args:
                tasks.append(f"    {task_name} = {component_name}({', '.join(input_args)})")
            else:
                tasks.append(f"    {task_name} = {component_name}()")
            
            # Track this task's outputs
            task_outputs[task_name] = cell_idx
        
        tasks_code = '\n'.join(tasks) if tasks else "    pass"
        
        return f'''@dsl.pipeline(
    name='{self.pipeline_name}',
    description='{self.pipeline_description}'
)
def {self.pipeline_name}_pipeline():
    """
    ML pipeline with shared imports and variables
    
    Components: {len(component_info)}
    Shared Variables: {len(self.shared_variables)}
    Shared Imports: {len(self.shared_imports)}
    """
{tasks_code}'''
    
    def _generate_empty_pipeline(self) -> str:
        """Generate empty pipeline when no components found"""
        return f'''@dsl.pipeline(
    name='{self.pipeline_name}',
    description='Empty pipeline - no annotated cells found'
)
def {self.pipeline_name}_pipeline():
    """
    Empty pipeline - please add tags to notebook cells:
    - step:data-loading
    - step:preprocessing  
    - step:training
    - step:evaluation
    - pipeline-parameters
    """
    pass'''
    
    def _generate_main_section(self) -> str:
        """Generate main execution section with simple KFP deployment"""
        return f'''def compile_pipeline(output_path: str = '{self.pipeline_name}.yaml') -> str:
    """Compile the pipeline to YAML"""
    compiler.Compiler().compile(
        pipeline_func={self.pipeline_name}_pipeline,
        package_path=output_path
    )
    print(f"Pipeline compiled: {{output_path}}")
    return output_path

def submit_to_kfp(host: str, experiment_name: str = 'ML_Pipeline_Experiment', 
                  run_name: str = None) -> str:
    """Submit pipeline to KFP cluster"""
    try:
        import kfp
        
        # Format host URL
        if not host.startswith('http'):
            host = f'http://{{host}}'
        
        print(f"🚀 Connecting to KFP at {{host}}")
        client = kfp.Client(host=host)
        
        # Test connection
        try:
            client.list_experiments(page_size=1)
            print("✅ Connected to KFP cluster")
        except Exception as e:
            print(f"❌ Failed to connect: {{e}}")
            raise
        
        # Create or get experiment
        try:
            experiment = client.get_experiment(experiment_name=experiment_name)
            print(f"📋 Using experiment: {{experiment_name}}")
        except:
            try:
                experiment = client.create_experiment(name=experiment_name)
                print(f"📋 Created experiment: {{experiment_name}}")
            except:
                experiment_name = "Default"
                print(f"📋 Using default experiment")
        
        # Generate run name if not provided
        if not run_name:
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            run_name = f'{self.pipeline_name}_{{timestamp}}'
        
        print(f"🔄 Submitting run: {{run_name}}")
        
        # Submit the pipeline
        run_result = client.create_run_from_pipeline_func(
            pipeline_func={self.pipeline_name}_pipeline,
            arguments={{}},
            run_name=run_name,
            experiment_name=experiment_name
        )
        
        print(f"✅ Pipeline submitted!")
        print(f"🆔 Run ID: {{run_result.run_id}}")
        print(f"🌐 View: {{host}}/#/runs/details/{{run_result.run_id}}")
        
        return run_result.run_id
        
    except ImportError:
        print("❌ KFP not installed. Run: pip install kfp")
        raise
    except Exception as e:
        print(f"❌ Submission failed: {{e}}")
        raise

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="ML Pipeline")
    parser.add_argument("--compile", action="store_true", help="Compile to YAML")
    parser.add_argument("--kfp-host", help="KFP host (e.g., http://127.0.0.1:8080)")
    parser.add_argument("--experiment", default="ML_Pipeline", help="Experiment name")
    parser.add_argument("--run-name", help="Custom run name")
    parser.add_argument("--output", "-o", default="{self.pipeline_name}.yaml", help="Output file")
    
    args = parser.parse_args()
    
    # Default action if no args
    if not any([args.compile, args.kfp_host]):
        args.compile = True
    
    try:
        # Compile pipeline
        if args.compile or args.kfp_host:
            print("📦 Compiling pipeline...")
            compile_pipeline(args.output)
            print(f"✅ Compiled: {{args.output}}")
        
        # Submit to KFP
        if args.kfp_host:
            print("\\n🚀 Submitting to KFP...")
            run_id = submit_to_kfp(
                host=args.kfp_host,
                experiment_name=args.experiment,
                run_name=args.run_name
            )
            print(f"\\n🎉 Success! Run ID: {{run_id}}")
            
    except Exception as e:
        print(f"❌ Error: {{e}}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    main()'''


# =============================================================================
# PUBLIC API FUNCTIONS
# =============================================================================

def convert_notebook_to_kfp(notebook_path: str, output_path: Optional[str] = None, 
                           config: Optional[Dict[str, Any]] = None) -> str:
    """
    Convert annotated notebook to KFP v2 DSL with shared imports and variables
    
    Args:
        notebook_path: Path to input notebook
        output_path: Optional output path for generated Python file
        config: Optional configuration
        
    Returns:
        Generated KFP v2 DSL code
    """
    converter = NotebookToKFPConverter(config)
    return converter.convert_notebook(notebook_path, output_path)


def analyze_notebook_annotations(notebook_path: str) -> Dict[str, Any]:
    """
    Analyze notebook for ML pipeline annotations
    
    Args:
        notebook_path: Path to notebook file
        
    Returns:
        Analysis results
    """
    if not os.path.exists(notebook_path):
        return {'error': f'Notebook not found: {notebook_path}'}
    
    try:
        converter = NotebookToKFPConverter()
        
        with open(notebook_path, 'r', encoding='utf-8') as f:
            notebook = nbformat.read(f, as_version=4)
        
        annotated_cells = converter._extract_annotated_cells(notebook)
        print(f"📊 Found {len(annotated_cells)} annotated cells")
        print(f"annotated_cells: {annotated_cells}")
        if annotated_cells:
            converter._analyze_variable_sharing(annotated_cells)
        
        return {
            'total_cells': len(notebook.cells),
            'code_cells': sum(1 for cell in notebook.cells if cell.cell_type == 'code'),
            'annotated_cells': len(annotated_cells),
            'shared_variables': converter.shared_variables,
            'shared_imports': list(converter.shared_imports),
            'supported_tags': converter.supported_tags,
            'ready_for_conversion': len(annotated_cells) > 0
        }
        
    except Exception as e:
        return {'error': f'Analysis failed: {str(e)}'}


# =============================================================================
# COMMAND LINE INTERFACE
# =============================================================================

def main():
    """Command line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description="ML Notebook to KFP Converter with Shared Imports")
    parser.add_argument("--nb", help="Input notebook file (.ipynb)")
    parser.add_argument("-o", "--output", help="Output Python file (.py)")
    parser.add_argument("-a", "--analyze", action="store_true", help="Analyze notebook only")
    
    args = parser.parse_args()
    
    try:
        if args.analyze:
            print("Analyzing notebook...")
            analysis = analyze_notebook_annotations(args.nb)
            
            if 'error' in analysis:
                print(f"❌ {analysis['error']}")
                sys.exit(1)
            
            print(f"📊 Analysis Results:")
            print(f"   Total cells: {analysis['total_cells']}")
            print(f"   Code cells: {analysis['code_cells']}")
            print(f"   Annotated cells: {analysis['annotated_cells']}")
            print(f"   Shared variables: {len(analysis['shared_variables'])}")
            print(f"   Shared imports: {len(analysis['shared_imports'])}")
            print(f"   Ready for conversion: {analysis['ready_for_conversion']}")
            
            if analysis['shared_imports']:
                print(f"\\n📦 Found imports:")
                for imp in sorted(analysis['shared_imports']):
                    print(f"   {imp}")
            
        else:
            print("Converting notebook to KFP DSL...")
            kfp_code = convert_notebook_to_kfp(args.nb, args.output)
            print(f"✅ Conversion completed!")
            print(f"📄 Generated: {args.output or 'output displayed'}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()