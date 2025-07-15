"""
ML Pipeline Generated from Annotated Notebook
Uses shared imports and variables between components
"""

from kfp import dsl, compiler
from kfp.dsl import Input, Output, Model, Dataset, Metrics, Artifact, component, pipeline
from typing import NamedTuple, Dict, List, Any
import os

# =============================================================================
# GENERATED COMPONENTS WITH SHARED IMPORTS
# =============================================================================

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def data_loading(data_output: Output[Dataset]):
    """
    Data Loading component
    Generated from notebook cell 0
    
    Inputs: []
    Outputs: ['data']
    """
    # === SHARED IMPORTS FROM NOTEBOOK ===
    import os
    import pickle
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.metrics import classification_report
    from sklearn.model_selection import train_test_split
    import numpy
    import pandas

    
    print(f"Executing data_loading component...")
    
    # Simple marshal implementation (embedded directly)
    class SimpleMarshal:
        def __init__(self):
            self._data_dir = '/tmp'
        
        def set_data_dir(self, path):
            self._data_dir = path
            os.makedirs(path, exist_ok=True)
            print(f"Marshal data dir: {path}")
        
        def save(self, obj, name):
            import joblib
            
            # Choose appropriate serialization
            obj_type = str(type(obj))
            
            if 'pandas' in obj_type:
                path = os.path.join(self._data_dir, f"{name}.pdpkl")
                if hasattr(obj, 'to_pickle'):
                    obj.to_pickle(path)
                else:
                    with open(path, 'wb') as f:
                        pickle.dump(obj, f)
            elif 'sklearn' in obj_type:
                path = os.path.join(self._data_dir, f"{name}.joblib")
                joblib.dump(obj, path)
            else:
                path = os.path.join(self._data_dir, f"{name}.pkl")
                with open(path, 'wb') as f:
                    pickle.dump(obj, f)
            
            print(f"Saved {name} to {path}")
            return path
        
        def load(self, name):
            # Use robust loading technique - check for files with and without extensions
            possible_files = [
                # First try files with extensions (from marshal.save)
                os.path.join(self._data_dir, f"{name}.pdpkl"),
                os.path.join(self._data_dir, f"{name}.joblib"), 
                os.path.join(self._data_dir, f"{name}.pkl"),
                # Then try the base name (from KFP artifact copy)
                os.path.join(self._data_dir, name)
            ]
            
            for file_path in possible_files:
                if os.path.exists(file_path):
                    print(f"Loading {name} from {file_path}")
                    return self.robust_load(file_path, name)
            
            available = os.listdir(self._data_dir) if os.path.exists(self._data_dir) else []
            raise FileNotFoundError(f"Cannot find {name} in {self._data_dir}. Available: {available}")
        
        def robust_load(self, file_path, var_name):
            """Robust loading with multiple fallback methods"""
            try:
                # Try joblib first (best for sklearn)
                import joblib
                result = joblib.load(file_path)
                print(f"Loaded {var_name} using joblib")
                return result
            except:
                pass
            
            try:
                # Try pickle with latin1 encoding (fixes most issues)
                with open(file_path, 'rb') as f:
                    result = pickle.load(f, encoding='latin1')
                print(f"Loaded {var_name} using pickle with latin1")
                return result
            except:
                pass
            
            try:
                # Try pandas for dataframes/series
                import pandas as pd
                result = pd.read_pickle(file_path)
                print(f"Loaded {var_name} using pandas")
                return result
            except:
                pass
            
            # Fallback to regular pickle
            with open(file_path, 'rb') as f:
                result = pickle.load(f)
            print(f"Loaded {var_name} using regular pickle")
            return result
    
    # Create marshal instance
    kale_marshal = SimpleMarshal()
    
    # Set up marshal directory
    import tempfile
    marshal_dir = tempfile.mkdtemp(prefix='kale_marshal_')
    kale_marshal.set_data_dir(marshal_dir)
    
    # No input variables to load
    
    # Execute original cell code
    print("Executing original notebook code...")
    import pandas as pd
    import numpy as np

    print(" Creating simple dataset...")

    # Create a simple synthetic dataset
    np.random.seed(42)
    n_samples = 100

    # Features: age, income
    age = np.random.randint(18, 65, n_samples)
    income = age * 1000 + np.random.normal(0, 5000, n_samples)

    # Target: can_buy_house (1 if income > 50000, 0 otherwise)
    target = (income > 50000).astype(int)

    # Create DataFrame
    data = pd.DataFrame({
        'age': age,
        'income': income,
        'can_buy_house': target
    })

    print(f" Dataset created with {len(data)} samples")
    print(f" Features: age, income")
    print(f" Target: can_buy_house")
    print("\nFirst 5 rows:")
    print(data.head())

    dataset_size = len(data)
    feature_count = 2
    print("Code execution completed successfully")
    
    # Save output variables using Kale marshal system
    # Save data
    try:
        if 'data' in locals() and data is not None:
            print(f'Saving data to data_output.path')
            print(f'Output artifact path: {data_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(data, 'data')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(data_output.path), exist_ok=True)
            shutil.copy2(marshal_file, data_output.path)
            print(f'Successfully saved data')
        else:
            print(f'Warning: data not found in locals')
    except Exception as e:
        print(f'Error saving data: {e}')
        raise e

    
    print(f"data_loading component completed successfully")

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def preprocessing(data_input: Input[Dataset], X_train_output: Output[Dataset], y_train_output: Output[Dataset], y_test_output: Output[Dataset], X_test_output: Output[Dataset]):
    """
    Data Preprocessing component
    Generated from notebook cell 1
    
    Inputs: ['data']
    Outputs: ['X_train', 'y_train', 'y_test', 'X_test']
    """
    # === SHARED IMPORTS FROM NOTEBOOK ===
    import os
    import pickle
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.metrics import classification_report
    from sklearn.model_selection import train_test_split
    import numpy
    import pandas

    
    print(f"Executing preprocessing component...")
    
    # Simple marshal implementation (embedded directly)
    class SimpleMarshal:
        def __init__(self):
            self._data_dir = '/tmp'
        
        def set_data_dir(self, path):
            self._data_dir = path
            os.makedirs(path, exist_ok=True)
            print(f"Marshal data dir: {path}")
        
        def save(self, obj, name):
            import joblib
            
            # Choose appropriate serialization
            obj_type = str(type(obj))
            
            if 'pandas' in obj_type:
                path = os.path.join(self._data_dir, f"{name}.pdpkl")
                if hasattr(obj, 'to_pickle'):
                    obj.to_pickle(path)
                else:
                    with open(path, 'wb') as f:
                        pickle.dump(obj, f)
            elif 'sklearn' in obj_type:
                path = os.path.join(self._data_dir, f"{name}.joblib")
                joblib.dump(obj, path)
            else:
                path = os.path.join(self._data_dir, f"{name}.pkl")
                with open(path, 'wb') as f:
                    pickle.dump(obj, f)
            
            print(f"Saved {name} to {path}")
            return path
        
        def load(self, name):
            # Use robust loading technique - check for files with and without extensions
            possible_files = [
                # First try files with extensions (from marshal.save)
                os.path.join(self._data_dir, f"{name}.pdpkl"),
                os.path.join(self._data_dir, f"{name}.joblib"), 
                os.path.join(self._data_dir, f"{name}.pkl"),
                # Then try the base name (from KFP artifact copy)
                os.path.join(self._data_dir, name)
            ]
            
            for file_path in possible_files:
                if os.path.exists(file_path):
                    print(f"Loading {name} from {file_path}")
                    return self.robust_load(file_path, name)
            
            available = os.listdir(self._data_dir) if os.path.exists(self._data_dir) else []
            raise FileNotFoundError(f"Cannot find {name} in {self._data_dir}. Available: {available}")
        
        def robust_load(self, file_path, var_name):
            """Robust loading with multiple fallback methods"""
            try:
                # Try joblib first (best for sklearn)
                import joblib
                result = joblib.load(file_path)
                print(f"Loaded {var_name} using joblib")
                return result
            except:
                pass
            
            try:
                # Try pickle with latin1 encoding (fixes most issues)
                with open(file_path, 'rb') as f:
                    result = pickle.load(f, encoding='latin1')
                print(f"Loaded {var_name} using pickle with latin1")
                return result
            except:
                pass
            
            try:
                # Try pandas for dataframes/series
                import pandas as pd
                result = pd.read_pickle(file_path)
                print(f"Loaded {var_name} using pandas")
                return result
            except:
                pass
            
            # Fallback to regular pickle
            with open(file_path, 'rb') as f:
                result = pickle.load(f)
            print(f"Loaded {var_name} using regular pickle")
            return result
    
    # Create marshal instance
    kale_marshal = SimpleMarshal()
    
    # Set up marshal directory
    import tempfile
    marshal_dir = tempfile.mkdtemp(prefix='kale_marshal_')
    kale_marshal.set_data_dir(marshal_dir)
    
    # Load input variables using Kale marshal system
    # Load data
    try:
        print(f'Loading data from data_input.path')
        print(f'Input artifact path: {data_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'data')
        shutil.copy2(data_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        data = kale_marshal.load('data')
        print(f'Successfully loaded data')
    except Exception as e:
        print(f'Error loading data: {e}')
        raise e

    
    # Execute original cell code
    print("Executing original notebook code...")
    # Data preparation
    from sklearn.model_selection import train_test_split

    print(" Preparing data for training...")

    # Separate features and target
    X = data[['age', 'income']]
    y = data['can_buy_house']

    print(f" Features shape: {X.shape}")
    print(f" Target shape: {y.shape}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )

    print(f" Training samples: {len(X_train)}")
    print(f" Test samples: {len(X_test)}")

    # Basic statistics
    print(f"\n Training data stats:")
    print(f"   Average age: {X_train['age'].mean():.1f}")
    print(f"   Average income: ${X_train['income'].mean():.0f}")
    print(f"   Positive cases: {y_train.sum()}/{len(y_train)}")

    train_samples = len(X_train)
    test_samples = len(X_test)

    print(" Data preparation completed!")
    print("Code execution completed successfully")
    
    # Save output variables using Kale marshal system
    # Save X_train
    try:
        if 'X_train' in locals() and X_train is not None:
            print(f'Saving X_train to X_train_output.path')
            print(f'Output artifact path: {X_train_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(X_train, 'X_train')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(X_train_output.path), exist_ok=True)
            shutil.copy2(marshal_file, X_train_output.path)
            print(f'Successfully saved X_train')
        else:
            print(f'Warning: X_train not found in locals')
    except Exception as e:
        print(f'Error saving X_train: {e}')
        raise e

    # Save y_train
    try:
        if 'y_train' in locals() and y_train is not None:
            print(f'Saving y_train to y_train_output.path')
            print(f'Output artifact path: {y_train_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(y_train, 'y_train')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(y_train_output.path), exist_ok=True)
            shutil.copy2(marshal_file, y_train_output.path)
            print(f'Successfully saved y_train')
        else:
            print(f'Warning: y_train not found in locals')
    except Exception as e:
        print(f'Error saving y_train: {e}')
        raise e

    # Save y_test
    try:
        if 'y_test' in locals() and y_test is not None:
            print(f'Saving y_test to y_test_output.path')
            print(f'Output artifact path: {y_test_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(y_test, 'y_test')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(y_test_output.path), exist_ok=True)
            shutil.copy2(marshal_file, y_test_output.path)
            print(f'Successfully saved y_test')
        else:
            print(f'Warning: y_test not found in locals')
    except Exception as e:
        print(f'Error saving y_test: {e}')
        raise e

    # Save X_test
    try:
        if 'X_test' in locals() and X_test is not None:
            print(f'Saving X_test to X_test_output.path')
            print(f'Output artifact path: {X_test_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(X_test, 'X_test')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(X_test_output.path), exist_ok=True)
            shutil.copy2(marshal_file, X_test_output.path)
            print(f'Successfully saved X_test')
        else:
            print(f'Warning: X_test not found in locals')
    except Exception as e:
        print(f'Error saving X_test: {e}')
        raise e

    
    print(f"preprocessing component completed successfully")

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def training(X_train_input: Input[Dataset], y_train_input: Input[Dataset], model_output: Output[Model]):
    """
    Model Training component
    Generated from notebook cell 2
    
    Inputs: ['X_train', 'y_train']
    Outputs: ['model']
    """
    # === SHARED IMPORTS FROM NOTEBOOK ===
    import os
    import pickle
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.metrics import classification_report
    from sklearn.model_selection import train_test_split
    import numpy
    import pandas

    
    print(f"Executing training component...")
    
    # Simple marshal implementation (embedded directly)
    class SimpleMarshal:
        def __init__(self):
            self._data_dir = '/tmp'
        
        def set_data_dir(self, path):
            self._data_dir = path
            os.makedirs(path, exist_ok=True)
            print(f"Marshal data dir: {path}")
        
        def save(self, obj, name):
            import joblib
            
            # Choose appropriate serialization
            obj_type = str(type(obj))
            
            if 'pandas' in obj_type:
                path = os.path.join(self._data_dir, f"{name}.pdpkl")
                if hasattr(obj, 'to_pickle'):
                    obj.to_pickle(path)
                else:
                    with open(path, 'wb') as f:
                        pickle.dump(obj, f)
            elif 'sklearn' in obj_type:
                path = os.path.join(self._data_dir, f"{name}.joblib")
                joblib.dump(obj, path)
            else:
                path = os.path.join(self._data_dir, f"{name}.pkl")
                with open(path, 'wb') as f:
                    pickle.dump(obj, f)
            
            print(f"Saved {name} to {path}")
            return path
        
        def load(self, name):
            # Use robust loading technique - check for files with and without extensions
            possible_files = [
                # First try files with extensions (from marshal.save)
                os.path.join(self._data_dir, f"{name}.pdpkl"),
                os.path.join(self._data_dir, f"{name}.joblib"), 
                os.path.join(self._data_dir, f"{name}.pkl"),
                # Then try the base name (from KFP artifact copy)
                os.path.join(self._data_dir, name)
            ]
            
            for file_path in possible_files:
                if os.path.exists(file_path):
                    print(f"Loading {name} from {file_path}")
                    return self.robust_load(file_path, name)
            
            available = os.listdir(self._data_dir) if os.path.exists(self._data_dir) else []
            raise FileNotFoundError(f"Cannot find {name} in {self._data_dir}. Available: {available}")
        
        def robust_load(self, file_path, var_name):
            """Robust loading with multiple fallback methods"""
            try:
                # Try joblib first (best for sklearn)
                import joblib
                result = joblib.load(file_path)
                print(f"Loaded {var_name} using joblib")
                return result
            except:
                pass
            
            try:
                # Try pickle with latin1 encoding (fixes most issues)
                with open(file_path, 'rb') as f:
                    result = pickle.load(f, encoding='latin1')
                print(f"Loaded {var_name} using pickle with latin1")
                return result
            except:
                pass
            
            try:
                # Try pandas for dataframes/series
                import pandas as pd
                result = pd.read_pickle(file_path)
                print(f"Loaded {var_name} using pandas")
                return result
            except:
                pass
            
            # Fallback to regular pickle
            with open(file_path, 'rb') as f:
                result = pickle.load(f)
            print(f"Loaded {var_name} using regular pickle")
            return result
    
    # Create marshal instance
    kale_marshal = SimpleMarshal()
    
    # Set up marshal directory
    import tempfile
    marshal_dir = tempfile.mkdtemp(prefix='kale_marshal_')
    kale_marshal.set_data_dir(marshal_dir)
    
    # Load input variables using Kale marshal system
    # Load X_train
    try:
        print(f'Loading X_train from X_train_input.path')
        print(f'Input artifact path: {X_train_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'X_train')
        shutil.copy2(X_train_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        X_train = kale_marshal.load('X_train')
        print(f'Successfully loaded X_train')
    except Exception as e:
        print(f'Error loading X_train: {e}')
        raise e

    # Load y_train
    try:
        print(f'Loading y_train from y_train_input.path')
        print(f'Input artifact path: {y_train_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'y_train')
        shutil.copy2(y_train_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        y_train = kale_marshal.load('y_train')
        print(f'Successfully loaded y_train')
    except Exception as e:
        print(f'Error loading y_train: {e}')
        raise e

    
    # Execute original cell code
    print("Executing original notebook code...")
    # Model training
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score

    print(" Training model...")

    # Create and train model
    model = LogisticRegression(random_state=42)
    model.fit(X_train, y_train)

    print(" Model training completed!")

    # Check training accuracy
    train_predictions = model.predict(X_train)
    train_accuracy = accuracy_score(y_train, train_predictions)

    print(f" Training accuracy: {train_accuracy:.3f}")

    # Model info
    model_type = "LogisticRegression"
    coefficients = model.coef_[0]

    print(f" Model coefficients:")
    print(f"   Age coefficient: {coefficients[0]:.4f}")
    print(f"   Income coefficient: {coefficients[1]:.6f}")

    training_accuracy = train_accuracy
    print("Code execution completed successfully")
    
    # Save output variables using Kale marshal system
    # Save model
    try:
        if 'model' in locals() and model is not None:
            print(f'Saving model to model_output.path')
            print(f'Output artifact path: {model_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(model, 'model')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(model_output.path), exist_ok=True)
            shutil.copy2(marshal_file, model_output.path)
            print(f'Successfully saved model')
        else:
            print(f'Warning: model not found in locals')
    except Exception as e:
        print(f'Error saving model: {e}')
        raise e

    
    print(f"training component completed successfully")

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def evaluation(model_input: Input[Model], y_test_input: Input[Dataset], X_test_input: Input[Dataset]):
    """
    Model Evaluation component
    Generated from notebook cell 3
    
    Inputs: ['model', 'y_test', 'X_test']
    Outputs: []
    """
    # === SHARED IMPORTS FROM NOTEBOOK ===
    import os
    import pickle
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.metrics import classification_report
    from sklearn.model_selection import train_test_split
    import numpy
    import pandas

    
    print(f"Executing evaluation component...")
    
    # Simple marshal implementation (embedded directly)
    class SimpleMarshal:
        def __init__(self):
            self._data_dir = '/tmp'
        
        def set_data_dir(self, path):
            self._data_dir = path
            os.makedirs(path, exist_ok=True)
            print(f"Marshal data dir: {path}")
        
        def save(self, obj, name):
            import joblib
            
            # Choose appropriate serialization
            obj_type = str(type(obj))
            
            if 'pandas' in obj_type:
                path = os.path.join(self._data_dir, f"{name}.pdpkl")
                if hasattr(obj, 'to_pickle'):
                    obj.to_pickle(path)
                else:
                    with open(path, 'wb') as f:
                        pickle.dump(obj, f)
            elif 'sklearn' in obj_type:
                path = os.path.join(self._data_dir, f"{name}.joblib")
                joblib.dump(obj, path)
            else:
                path = os.path.join(self._data_dir, f"{name}.pkl")
                with open(path, 'wb') as f:
                    pickle.dump(obj, f)
            
            print(f"Saved {name} to {path}")
            return path
        
        def load(self, name):
            # Use robust loading technique - check for files with and without extensions
            possible_files = [
                # First try files with extensions (from marshal.save)
                os.path.join(self._data_dir, f"{name}.pdpkl"),
                os.path.join(self._data_dir, f"{name}.joblib"), 
                os.path.join(self._data_dir, f"{name}.pkl"),
                # Then try the base name (from KFP artifact copy)
                os.path.join(self._data_dir, name)
            ]
            
            for file_path in possible_files:
                if os.path.exists(file_path):
                    print(f"Loading {name} from {file_path}")
                    return self.robust_load(file_path, name)
            
            available = os.listdir(self._data_dir) if os.path.exists(self._data_dir) else []
            raise FileNotFoundError(f"Cannot find {name} in {self._data_dir}. Available: {available}")
        
        def robust_load(self, file_path, var_name):
            """Robust loading with multiple fallback methods"""
            try:
                # Try joblib first (best for sklearn)
                import joblib
                result = joblib.load(file_path)
                print(f"Loaded {var_name} using joblib")
                return result
            except:
                pass
            
            try:
                # Try pickle with latin1 encoding (fixes most issues)
                with open(file_path, 'rb') as f:
                    result = pickle.load(f, encoding='latin1')
                print(f"Loaded {var_name} using pickle with latin1")
                return result
            except:
                pass
            
            try:
                # Try pandas for dataframes/series
                import pandas as pd
                result = pd.read_pickle(file_path)
                print(f"Loaded {var_name} using pandas")
                return result
            except:
                pass
            
            # Fallback to regular pickle
            with open(file_path, 'rb') as f:
                result = pickle.load(f)
            print(f"Loaded {var_name} using regular pickle")
            return result
    
    # Create marshal instance
    kale_marshal = SimpleMarshal()
    
    # Set up marshal directory
    import tempfile
    marshal_dir = tempfile.mkdtemp(prefix='kale_marshal_')
    kale_marshal.set_data_dir(marshal_dir)
    
    # Load input variables using Kale marshal system
    # Load model
    try:
        print(f'Loading model from model_input.path')
        print(f'Input artifact path: {model_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'model')
        shutil.copy2(model_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        model = kale_marshal.load('model')
        print(f'Successfully loaded model')
    except Exception as e:
        print(f'Error loading model: {e}')
        raise e

    # Load y_test
    try:
        print(f'Loading y_test from y_test_input.path')
        print(f'Input artifact path: {y_test_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'y_test')
        shutil.copy2(y_test_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        y_test = kale_marshal.load('y_test')
        print(f'Successfully loaded y_test')
    except Exception as e:
        print(f'Error loading y_test: {e}')
        raise e

    # Load X_test
    try:
        print(f'Loading X_test from X_test_input.path')
        print(f'Input artifact path: {X_test_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'X_test')
        shutil.copy2(X_test_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        X_test = kale_marshal.load('X_test')
        print(f'Successfully loaded X_test')
    except Exception as e:
        print(f'Error loading X_test: {e}')
        raise e

    
    # Execute original cell code
    print("Executing original notebook code...")
    # Model evaluation
    from sklearn.metrics import classification_report

    print(" Evaluating model...")

    # Make predictions
    test_predictions = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, test_predictions)

    print(f" Test accuracy: {test_accuracy:.3f}")

    # Detailed evaluation
    print("\n Classification Report:")
    print(classification_report(y_test, test_predictions))

    # Simple predictions on new data
    print("\n Sample predictions:")
    sample_data = [[25, 30000], [45, 80000], [35, 60000]]
    sample_predictions = model.predict(sample_data)

    for i, (age, income) in enumerate(sample_data):
        prediction = "Yes" if sample_predictions[i] == 1 else "No"
        print(f"   Age {age}, Income ${income:,} → Can buy house: {prediction}")

    # Final metrics
    final_accuracy = test_accuracy
    total_correct = int(test_accuracy * len(y_test))
    model_performance = "Good" if test_accuracy > 0.8 else "Fair" if test_accuracy > 0.6 else "Poor"

    print(f"\n Evaluation completed!")
    print(f" Final accuracy: {final_accuracy:.3f}")
    print(f" Correct predictions: {total_correct}/{len(y_test)}")
    print(f" Model performance: {model_performance}")
    print("Code execution completed successfully")
    
    # No output variables to save
    
    print(f"evaluation component completed successfully")

# =============================================================================
# PIPELINE DEFINITION
# =============================================================================

@dsl.pipeline(
    name='Example',
    description='ML pipeline from annotated notebook'
)
def Example_pipeline():
    """
    ML pipeline with shared imports and variables
    
    Components: 4
    Shared Variables: 6
    Shared Imports: 6
    """
    data_loading_task = data_loading()
    preprocessing_task = preprocessing(data_input=data_loading_task.outputs['data_output'])
    training_task = training(X_train_input=preprocessing_task.outputs['X_train_output'], y_train_input=preprocessing_task.outputs['y_train_output'])
    evaluation_task = evaluation(model_input=training_task.outputs['model_output'], y_test_input=preprocessing_task.outputs['y_test_output'], X_test_input=preprocessing_task.outputs['X_test_output'])

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def compile_pipeline(output_path: str = 'Example.yaml') -> str:
    """Compile the pipeline to YAML"""
    compiler.Compiler().compile(
        pipeline_func=Example_pipeline,
        package_path=output_path
    )
    print(f"Pipeline compiled: {output_path}")
    return output_path

def submit_to_kfp(host: str, experiment_name: str = 'ML_Pipeline_Experiment', 
                  run_name: str = None) -> str:
    """Submit pipeline to KFP cluster"""
    try:
        import kfp
        
        # Format host URL
        if not host.startswith('http'):
            host = f'http://{host}'
        
        print(f"🚀 Connecting to KFP at {host}")
        client = kfp.Client(host=host)
        
        # Test connection
        try:
            client.list_experiments(page_size=1)
            print("✅ Connected to KFP cluster")
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            raise
        
        # Create or get experiment
        try:
            experiment = client.get_experiment(experiment_name=experiment_name)
            print(f"📋 Using experiment: {experiment_name}")
        except:
            try:
                experiment = client.create_experiment(name=experiment_name)
                print(f"📋 Created experiment: {experiment_name}")
            except:
                experiment_name = "Default"
                print(f"📋 Using default experiment")
        
        # Generate run name if not provided
        if not run_name:
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            run_name = f'Example_{timestamp}'
        
        print(f"🔄 Submitting run: {run_name}")
        
        # Submit the pipeline
        run_result = client.create_run_from_pipeline_func(
            pipeline_func=Example_pipeline,
            arguments={},
            run_name=run_name,
            experiment_name=experiment_name
        )
        
        print(f"✅ Pipeline submitted!")
        print(f"🆔 Run ID: {run_result.run_id}")
        print(f"🌐 View: {host}/#/runs/details/{run_result.run_id}")
        
        return run_result.run_id
        
    except ImportError:
        print("❌ KFP not installed. Run: pip install kfp")
        raise
    except Exception as e:
        print(f"❌ Submission failed: {e}")
        raise

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="ML Pipeline")
    parser.add_argument("--compile", action="store_true", help="Compile to YAML")
    parser.add_argument("--kfp-host", help="KFP host (e.g., http://127.0.0.1:8080)")
    parser.add_argument("--experiment", default="ML_Pipeline", help="Experiment name")
    parser.add_argument("--run-name", help="Custom run name")
    parser.add_argument("--output", "-o", default="Example.yaml", help="Output file")
    
    args = parser.parse_args()
    
    # Default action if no args
    if not any([args.compile, args.kfp_host]):
        args.compile = True
    
    try:
        # Compile pipeline
        if args.compile or args.kfp_host:
            print("📦 Compiling pipeline...")
            compile_pipeline(args.output)
            print(f"✅ Compiled: {args.output}")
        
        # Submit to KFP
        if args.kfp_host:
            print("\n🚀 Submitting to KFP...")
            run_id = submit_to_kfp(
                host=args.kfp_host,
                experiment_name=args.experiment,
                run_name=args.run_name
            )
            print(f"\n🎉 Success! Run ID: {run_id}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    main()