# Troubleshooting

Most Kale problems fall into one of a few categories. This page covers the
common ones. For anything not listed here, open an issue on
[GitHub](https://github.com/kubeflow/kale/issues) with the notebook and the
generated `.kale/<name>.kale.py`.

## `ModuleNotFoundError` in a pipeline step

You'll see this most often on your first pipeline. A step fails with:

```
ModuleNotFoundError: No module named 'seaborn'
```

even though you can clearly `import seaborn` in your notebook.

**Cause.** Kale **does not rebuild a Docker image** for your pipeline. It
uses the base image configured in pipeline metadata (or overridden with
`--docker_image`), and it installs extra Python packages at step startup
via `packages_to_install`. That list is built from the `imports` cell only
— if you import a package in a `step` or `functions` cell, Kale won't add
it to the install list and the step will fail.

**Fix.**

- Move every `import` statement into an `imports` cell.
- For packages the AST can't resolve to a pip name, add them to the
  pipeline's base docker image (or build a custom one).

See [Cell Types & Annotations](../concepts/cell-types.md) for details on the imports rule.

## Pickle / marshal errors

```
TypeError: cannot pickle '_thread.RLock' object
```

or

```
AttributeError: Can't pickle local object 'train.<locals>.inner'
```

**Cause.** A variable flowing between steps can't be serialized. Kale's
marshalling system handles many ML-framework types natively (numpy, pandas,
sklearn, PyTorch, Keras, TF, XGBoost), but falls back to `dill` for
anything unknown. `dill` can serialize a lot, but not:

- Open file handles, sockets, database connections.
- Objects holding native thread locks or OS resources.
- Closures that capture local variables.

**Fix.**

- Don't pass the offending object between steps. Recreate it from scratch
  at the start of each step that needs it, using a helper in a `functions`
  cell — see [Data Passing: Non-serializable objects](../concepts/data-passing.md#non-serializable-objects).
- If the object is a model from an ML library Kale doesn't yet support,
  consider contributing a new `MarshalBackend` — see
  [Extending the dispatcher](../concepts/data-passing.md#extending-the-dispatcher).

## Compiler errors from KFP

```
Internal compiler error: Compiler has produced Argo-incompatible workflow.
```

Kale's compile step hands the generated DSL to the KFP SDK's compiler,
which runs `argo lint` if `argo` is on your `PATH`. An outdated `argo`
binary can produce false positives here.

**Fix.** Remove `argo` from your `PATH` or upgrade it to the version
recommended by your KFP installation. Kale itself does not require `argo`.

## Aliasing: a variable's value doesn't seem to propagate

```python
# step:A
model1 = model2 = SomeModel()

# step:B (prev: A)
model2.add_layer(SomeLayer())

# step:C (prev: B)
print(model1)   # still the old model
```

**Cause.** Kale saves `model1` and `model2` separately in step A, so
mutations to `model2` in step B don't affect what C loads as `model1`.

**Fix.** Avoid aliasing across steps. Use one name for each object. See
[Data Passing: Aliasing](../concepts/data-passing.md#aliasing).

## Global state mutated inside a step is not visible to other steps

Each step runs in its own container, so library configuration like
`warnings.simplefilter`, `logging.basicConfig`, or
`plt.rcParams[...]` does not persist across steps.

**Fix.** Put all global configuration in the `imports` or `functions`
cell, so every step applies it at startup.

## `kale` command not found after installing

If you installed Kale inside a `uv` or virtualenv, make sure you're running
`kale` from an activated environment, or use `uv run kale --nb ...`. The
`kale` script is registered as a `[project.scripts]` entry in
`pyproject.toml`, so it only shows up inside the environment where the
package was installed.

## Still stuck?

- Check the generated `.kale/<name>.kale.py` — it often reveals what Kale
  thinks the pipeline looks like.
- Run with `--debug` for verbose output.
- File an issue on [GitHub](https://github.com/kubeflow/kale/issues) with
  a minimal reproduction notebook.
