from papermill.execute import parameterize_notebook
from papermill.iorw import load_notebook_node, write_ipynb, read_yaml_file
from itertools import product


def print_dict_parametes(d):
    """
    Pretty print a dictionary to be used as suffix of a notebook file name

    Args:
        d: dictionary
            Dictionary of parameters used by Papermill to generate a notebook

    Returns: string
                Key-value string, '_' separated

    """
    # TODO: Manage whitespaces and special characters
    s = ""
    for k, v in d.items():
        s += f"_{k}_{v}"
    return s


def generate_notebooks_from_yml(input_nb_path: str, yml_parameters_path: str):
    """
    Generate a set of notebooks using the Papermill APIs. The input notebook
    must contain a cell with a `parameters` tag. Papermill will generate a set of
    notebooks based on the parameters defined in the input yaml
    Args:
        input_nb_path: string
                        Path to the source template notebook
        yml_parameters_path: string
                                Path to the yaml spec with parameters

    Returns: list
                A list of paths to the generated notebooks

    """
    y = read_yaml_file(yml_parameters_path)
    input_nb = load_notebook_node(input_nb_path)

    # Create the cartesian product of the parameters
    hp_values = list(product(*y.values()))

    # Now recreate a dictionary with the correct keys
    hp_dicts = [dict(zip(y.keys(), x)) for x in hp_values]

    # For each combination of parameters generate a notebook from the template
    output_paths = list()
    for params in hp_dicts:
        params_str = print_dict_parametes(params)
        output_path = input_nb_path.replace(".ipynb", "") + params_str + ".ipynb"
        output_nb = parameterize_notebook(
            input_nb,
            parameters=params
        )
        # write the nb to file
        write_ipynb(output_nb, path=output_path)
        output_paths.append((output_path, params_str))

    # Return list of generated notebook paths
    return output_paths
