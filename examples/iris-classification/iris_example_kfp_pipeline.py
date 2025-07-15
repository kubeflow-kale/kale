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
    packages_to_install=[ 'pandas', 'joblib', 'numpy', 'scikit-learn', 'dill']
)
def data_loading(df_output: Output[Dataset], iris_output: Output[Artifact]):
    """
    Data Loading component
    Generated from notebook cell 4
    
    Inputs: []
    Outputs: ['df', 'iris']
    """
    # === SHARED IMPORTS FROM NOTEBOOK ===
    import os
    import pickle
    from sklearn.datasets import load_iris
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.metrics import classification_report
    from sklearn.metrics import confusion_matrix
    from sklearn.metrics import f1_score
    from sklearn.metrics import precision_score
    from sklearn.metrics import recall_score
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.preprocessing import StandardScaler
    from sklearn.svm import SVC
    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd
    import time

    
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
    # Data Loading and Initial Exploration
    import pandas as pd
    import numpy as np
    from sklearn.datasets import load_iris
    import matplotlib.pyplot as plt

    # Load the iris dataset
    print(" Loading iris dataset...")
    iris = load_iris()

    # Create DataFrame
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    df['target'] = iris.target
    df['target_name'] = df['target'].map({0: 'setosa', 1: 'versicolor', 2: 'virginica'})

    print(f" Dataset loaded successfully!")
    print(f" Dataset shape: {df.shape}")
    print(f" Features: {list(df.columns[:-2])}")
    print(f" Target classes: {df['target_name'].unique()}")

    # Basic statistics
    print("\n Dataset Overview:")
    print(df.describe())

    # Save some key metrics
    total_samples = len(df)
    num_features = len(iris.feature_names)
    num_classes = len(iris.target_names)

    print(f"\n Summary: {total_samples} samples, {num_features} features, {num_classes} classes")
    print("Code execution completed successfully")
    
    # Save output variables using Kale marshal system
    # Save df
    try:
        if 'df' in locals() and df is not None:
            print(f'Saving df to df_output.path')
            print(f'Output artifact path: {df_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(df, 'df')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(df_output.path), exist_ok=True)
            shutil.copy2(marshal_file, df_output.path)
            print(f'Successfully saved df')
        else:
            print(f'Warning: df not found in locals')
    except Exception as e:
        print(f'Error saving df: {e}')
        raise e

    # Save iris
    try:
        if 'iris' in locals() and iris is not None:
            print(f'Saving iris to iris_output.path')
            print(f'Output artifact path: {iris_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(iris, 'iris')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(iris_output.path), exist_ok=True)
            shutil.copy2(marshal_file, iris_output.path)
            print(f'Successfully saved iris')
        else:
            print(f'Warning: iris not found in locals')
    except Exception as e:
        print(f'Error saving iris: {e}')
        raise e

    
    print(f"data_loading component completed successfully")

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['matplotlib', 'pandas', 'joblib', 'numpy', 'scikit-learn', 'dill']
)
def preprocessing(df_input: Input[Dataset], y_test_output: Output[Dataset], X_test_scaled_output: Output[Dataset], X_train_scaled_output: Output[Dataset], y_train_output: Output[Dataset]):
    """
    Data Preprocessing component
    Generated from notebook cell 5
    
    Inputs: ['df']
    Outputs: ['y_test', 'X_test_scaled', 'X_train_scaled', 'y_train']
    """
    # === SHARED IMPORTS FROM NOTEBOOK ===
    import os
    import pickle
    from sklearn.datasets import load_iris
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.metrics import classification_report
    from sklearn.metrics import confusion_matrix
    from sklearn.metrics import f1_score
    from sklearn.metrics import precision_score
    from sklearn.metrics import recall_score
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.preprocessing import StandardScaler
    from sklearn.svm import SVC
    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd
    import time

    
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
    # Load df
    try:
        print(f'Loading df from df_input.path')
        print(f'Input artifact path: {df_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'df')
        shutil.copy2(df_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        df = kale_marshal.load('df')
        print(f'Successfully loaded df')
    except Exception as e:
        print(f'Error loading df: {e}')
        raise e

    
    # Execute original cell code
    print("Executing original notebook code...")
    # Data Preprocessing and Feature Engineering
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.preprocessing import LabelEncoder

    print(" Starting data preprocessing...")

    # Prepare features and target
    X = df.drop(['target', 'target_name'], axis=1)
    y = df['target']

    print(f" Features shape: {X.shape}")
    print(f" Target shape: {y.shape}")

    # Split the data
    test_size = 0.2
    random_state = 42

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    print(f" Training set: {X_train.shape[0]} samples")
    print(f" Test set: {X_test.shape[0]} samples")

    # Feature scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print(" Feature scaling completed")

    # Check for missing values
    missing_values = df.isnull().sum().sum()
    print(f" Missing values: {missing_values}")

    # Feature statistics after scaling
    train_mean = np.mean(X_train_scaled, axis=0)
    train_std = np.std(X_train_scaled, axis=0)

    print(" Preprocessing completed successfully!")
    print(f" Scaled features - Mean: {train_mean.round(3)}")
    print(f" Scaled features - Std: {train_std.round(3)}")

    preprocessing_summary = {
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'features': X_train.shape[1],
        'test_size_ratio': test_size
    }
    print("Code execution completed successfully")
    
    # Save output variables using Kale marshal system
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

    # Save X_test_scaled
    try:
        if 'X_test_scaled' in locals() and X_test_scaled is not None:
            print(f'Saving X_test_scaled to X_test_scaled_output.path')
            print(f'Output artifact path: {X_test_scaled_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(X_test_scaled, 'X_test_scaled')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(X_test_scaled_output.path), exist_ok=True)
            shutil.copy2(marshal_file, X_test_scaled_output.path)
            print(f'Successfully saved X_test_scaled')
        else:
            print(f'Warning: X_test_scaled not found in locals')
    except Exception as e:
        print(f'Error saving X_test_scaled: {e}')
        raise e

    # Save X_train_scaled
    try:
        if 'X_train_scaled' in locals() and X_train_scaled is not None:
            print(f'Saving X_train_scaled to X_train_scaled_output.path')
            print(f'Output artifact path: {X_train_scaled_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(X_train_scaled, 'X_train_scaled')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(X_train_scaled_output.path), exist_ok=True)
            shutil.copy2(marshal_file, X_train_scaled_output.path)
            print(f'Successfully saved X_train_scaled')
        else:
            print(f'Warning: X_train_scaled not found in locals')
    except Exception as e:
        print(f'Error saving X_train_scaled: {e}')
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

    
    print(f"preprocessing component completed successfully")

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['matplotlib', 'pandas', 'joblib', 'numpy', 'scikit-learn', 'dill']
)
def training(X_train_scaled_input: Input[Dataset], y_train_input: Input[Dataset], training_times_output: Output[Artifact], models_output: Output[Model]):
    """
    Model Training component
    Generated from notebook cell 6
    
    Inputs: ['X_train_scaled', 'y_train']
    Outputs: ['training_times', 'models']
    """
    # === SHARED IMPORTS FROM NOTEBOOK ===
    import os
    import pickle
    from sklearn.datasets import load_iris
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.metrics import classification_report
    from sklearn.metrics import confusion_matrix
    from sklearn.metrics import f1_score
    from sklearn.metrics import precision_score
    from sklearn.metrics import recall_score
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.preprocessing import StandardScaler
    from sklearn.svm import SVC
    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd
    import time

    
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
    # Load X_train_scaled
    try:
        print(f'Loading X_train_scaled from X_train_scaled_input.path')
        print(f'Input artifact path: {X_train_scaled_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'X_train_scaled')
        shutil.copy2(X_train_scaled_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        X_train_scaled = kale_marshal.load('X_train_scaled')
        print(f'Successfully loaded X_train_scaled')
    except Exception as e:
        print(f'Error loading X_train_scaled: {e}')
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
    # Model Training
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.svm import SVC
    from sklearn.metrics import accuracy_score
    import time

    print(" Starting model training...")

    # Define model parameters
    rf_params = {
        'n_estimators': 100,
        'random_state': 42,
        'max_depth': 5
    }

    lr_params = {
        'random_state': 42,
        'max_iter': 1000
    }

    svm_params = {
        'random_state': 42,
        'kernel': 'rbf'
    }

    # Train multiple models
    models = {}
    training_times = {}

    print(" Training Random Forest...")
    start_time = time.time()
    rf_model = RandomForestClassifier(**rf_params)
    rf_model.fit(X_train_scaled, y_train)
    training_times['RandomForest'] = time.time() - start_time
    models['RandomForest'] = rf_model
    print(f"    Training time: {training_times['RandomForest']:.3f}s")

    print(" Training Logistic Regression...")
    start_time = time.time()
    lr_model = LogisticRegression(**lr_params)
    lr_model.fit(X_train_scaled, y_train)
    training_times['LogisticRegression'] = time.time() - start_time
    models['LogisticRegression'] = lr_model
    print(f"    Training time: {training_times['LogisticRegression']:.3f}s")

    print(" Training SVM...")
    start_time = time.time()
    svm_model = SVC(**svm_params)
    svm_model.fit(X_train_scaled, y_train)
    training_times['SVM'] = time.time() - start_time
    models['SVM'] = svm_model
    print(f"    Training time: {training_times['SVM']:.3f}s")

    print(" All models trained successfully!")
    print(f" Trained {len(models)} models: {list(models.keys())}")

    # Quick training accuracy check
    train_accuracies = {}
    for name, model in models.items():
        train_pred = model.predict(X_train_scaled)
        train_acc = accuracy_score(y_train, train_pred)
        train_accuracies[name] = train_acc
        print(f" {name} training accuracy: {train_acc:.4f}")

    best_train_model = max(train_accuracies, key=train_accuracies.get)
    print(f" Best training accuracy: {best_train_model} ({train_accuracies[best_train_model]:.4f})")
    print("Code execution completed successfully")
    
    # Save output variables using Kale marshal system
    # Save training_times
    try:
        if 'training_times' in locals() and training_times is not None:
            print(f'Saving training_times to training_times_output.path')
            print(f'Output artifact path: {training_times_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(training_times, 'training_times')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(training_times_output.path), exist_ok=True)
            shutil.copy2(marshal_file, training_times_output.path)
            print(f'Successfully saved training_times')
        else:
            print(f'Warning: training_times not found in locals')
    except Exception as e:
        print(f'Error saving training_times: {e}')
        raise e

    # Save models
    try:
        if 'models' in locals() and models is not None:
            print(f'Saving models to models_output.path')
            print(f'Output artifact path: {models_output.path}')
            # Save using Kale marshal
            marshal_file = kale_marshal.save(models, 'models')
            # Copy to KFP artifact location
            import shutil
            os.makedirs(os.path.dirname(models_output.path), exist_ok=True)
            shutil.copy2(marshal_file, models_output.path)
            print(f'Successfully saved models')
        else:
            print(f'Warning: models not found in locals')
    except Exception as e:
        print(f'Error saving models: {e}')
        raise e

    
    print(f"training component completed successfully")

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['matplotlib', 'pandas', 'joblib', 'numpy', 'scikit-learn', 'dill']
)
def evaluation(iris_input: Input[Artifact], y_test_input: Input[Dataset], training_times_input: Input[Artifact], X_test_scaled_input: Input[Dataset], models_input: Input[Model]):
    """
    Model Evaluation component
    Generated from notebook cell 7
    
    Inputs: ['iris', 'y_test', 'training_times', 'X_test_scaled', 'models']
    Outputs: []
    """
    # === SHARED IMPORTS FROM NOTEBOOK ===
    import os
    import pickle
    from sklearn.datasets import load_iris
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.metrics import classification_report
    from sklearn.metrics import confusion_matrix
    from sklearn.metrics import f1_score
    from sklearn.metrics import precision_score
    from sklearn.metrics import recall_score
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.preprocessing import StandardScaler
    from sklearn.svm import SVC
    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd
    import time

    
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
    # Load iris
    try:
        print(f'Loading iris from iris_input.path')
        print(f'Input artifact path: {iris_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'iris')
        shutil.copy2(iris_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        iris = kale_marshal.load('iris')
        print(f'Successfully loaded iris')
    except Exception as e:
        print(f'Error loading iris: {e}')
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

    # Load training_times
    try:
        print(f'Loading training_times from training_times_input.path')
        print(f'Input artifact path: {training_times_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'training_times')
        shutil.copy2(training_times_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        training_times = kale_marshal.load('training_times')
        print(f'Successfully loaded training_times')
    except Exception as e:
        print(f'Error loading training_times: {e}')
        raise e

    # Load X_test_scaled
    try:
        print(f'Loading X_test_scaled from X_test_scaled_input.path')
        print(f'Input artifact path: {X_test_scaled_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'X_test_scaled')
        shutil.copy2(X_test_scaled_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        X_test_scaled = kale_marshal.load('X_test_scaled')
        print(f'Successfully loaded X_test_scaled')
    except Exception as e:
        print(f'Error loading X_test_scaled: {e}')
        raise e

    # Load models
    try:
        print(f'Loading models from models_input.path')
        print(f'Input artifact path: {models_input.path}')
        
        # Copy from KFP artifact to marshal dir
        import shutil
        marshal_file = os.path.join(marshal_dir, 'models')
        shutil.copy2(models_input.path, marshal_file)
        # Load using Kale marshal with robust loading
        models = kale_marshal.load('models')
        print(f'Successfully loaded models')
    except Exception as e:
        print(f'Error loading models: {e}')
        raise e

    
    # Execute original cell code
    print("Executing original notebook code...")
    # Model Evaluation and Performance Analysis
    from sklearn.metrics import classification_report, confusion_matrix
    from sklearn.metrics import precision_score, recall_score, f1_score
    import numpy as np

    print(" Starting model evaluation...")

    # Evaluate all models
    evaluation_results = {}

    for name, model in models.items():
        print(f"\n Evaluating {name}...")
    
        # Make predictions
        y_pred = model.predict(X_test_scaled)
    
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted')
        recall = recall_score(y_test, y_pred, average='weighted')
        f1 = f1_score(y_test, y_pred, average='weighted')
    
        # Store results
        evaluation_results[name] = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'training_time': training_times[name]
        }
    
        print(f"    Accuracy: {accuracy:.4f}")
        print(f"    Precision: {precision:.4f}")
        print(f"    Recall: {recall:.4f}")
        print(f"    F1-Score: {f1:.4f}")

    # Find best model
    best_model_name = max(evaluation_results, key=lambda x: evaluation_results[x]['accuracy'])
    best_model = models[best_model_name]
    best_accuracy = evaluation_results[best_model_name]['accuracy']

    print(f"\n Best Model: {best_model_name}")
    print(f" Best Accuracy: {best_accuracy:.4f}")

    # Detailed evaluation of best model
    print(f"\n Detailed Classification Report for {best_model_name}:")
    y_pred_best = best_model.predict(X_test_scaled)
    print(classification_report(y_test, y_pred_best, target_names=iris.target_names))

    # Confusion matrix
    conf_matrix = confusion_matrix(y_test, y_pred_best)
    print(f"\n Confusion Matrix for {best_model_name}:")
    print(conf_matrix)

    # Model comparison summary
    print(f"\n Model Comparison Summary:")
    for name, results in evaluation_results.items():
        print(f"{name:15} | Acc: {results['accuracy']:.4f} | Time: {results['training_time']:.3f}s")

    # Final metrics for pipeline output
    final_accuracy = best_accuracy
    final_model_name = best_model_name
    total_models_trained = len(models)
    print("Code execution completed successfully")
    
    # No output variables to save
    
    print(f"evaluation component completed successfully")

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['matplotlib', 'pandas', 'joblib', 'numpy', 'scikit-learn', 'dill']
)
def component_8():
    """
    Parameters component
    Generated from notebook cell 8
    
    Inputs: []
    Outputs: []
    """
    # === SHARED IMPORTS FROM NOTEBOOK ===
    import os
    import pickle
    from sklearn.datasets import load_iris
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.metrics import classification_report
    from sklearn.metrics import confusion_matrix
    from sklearn.metrics import f1_score
    from sklearn.metrics import precision_score
    from sklearn.metrics import recall_score
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.preprocessing import StandardScaler
    from sklearn.svm import SVC
    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd
    import time

    
    print(f"Executing component_8 component...")
    
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
    # Pipeline Configuration Parameters
    print(" Setting up pipeline parameters...")

    # Data parameters
    dataset_name = "iris"
    target_column = "target"
    test_size_param = 0.2
    random_state_param = 42

    # Model parameters
    rf_n_estimators = 100
    rf_max_depth = 5
    lr_max_iter = 1000
    svm_kernel = "rbf"

    # Evaluation parameters
    scoring_metric = "accuracy"
    cv_folds = 5

    # Pipeline metadata
    pipeline_version = "1.0.0"
    pipeline_description = "Iris classification pipeline with multiple models"
    author = "Pipeline Builder Extension"

    print(" Pipeline parameters configured:")
    print(f"    Dataset: {dataset_name}")
    print(f"    Target: {target_column}")
    print(f"    Test size: {test_size_param}")
    print(f"    Random state: {random_state_param}")
    print(f"    Version: {pipeline_version}")
    print("Code execution completed successfully")
    
    # No output variables to save
    
    print(f"component_8 component completed successfully")

# =============================================================================
# PIPELINE DEFINITION
# =============================================================================

@dsl.pipeline(
    name='iris_example',
    description='ML pipeline from annotated notebook'
)
def iris_example_pipeline():
    """
    ML pipeline with shared imports and variables
    
    Components: 5
    Shared Variables: 8
    Shared Imports: 17
    """
    data_loading_task = data_loading()
    preprocessing_task = preprocessing(df_input=data_loading_task.outputs['df_output'])
    training_task = training(X_train_scaled_input=preprocessing_task.outputs['X_train_scaled_output'], y_train_input=preprocessing_task.outputs['y_train_output'])
    evaluation_task = evaluation(iris_input=data_loading_task.outputs['iris_output'], y_test_input=preprocessing_task.outputs['y_test_output'], training_times_input=training_task.outputs['training_times_output'], X_test_scaled_input=preprocessing_task.outputs['X_test_scaled_output'], models_input=training_task.outputs['models_output'])
    component_8_task = component_8()

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def compile_pipeline(output_path: str = 'iris_example.yaml') -> str:
    """Compile the pipeline to YAML"""
    compiler.Compiler().compile(
        pipeline_func=iris_example_pipeline,
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
            run_name = f'iris_example_{timestamp}'
        
        print(f"🔄 Submitting run: {run_name}")
        
        # Submit the pipeline
        run_result = client.create_run_from_pipeline_func(
            pipeline_func=iris_example_pipeline,
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
    parser.add_argument("--output", "-o", default="iris_example.yaml", help="Output file")
    
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