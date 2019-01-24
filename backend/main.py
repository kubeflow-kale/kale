from converter.converter import PipelinesNotebookConverter

if __name__ == "__main__":
    notebook_path = "base_notebooks/modello_enophit_new.ipynb"
    pipelines_converter = PipelinesNotebookConverter(notebook_path)
