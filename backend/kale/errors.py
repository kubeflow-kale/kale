"""Core domain exceptions for Kale (non-RPC).
Keep domain-specific exceptions here so core modules (compiler, processor)
can raise them without depending on RPC layer.
"""


class TaskMissingError(Exception):
    """Raised when a Pipeline has no steps/tasks.

    This is a domain-level exception and will be mapped to an RPC error
    (RPCTaskIsMissing) by the RPC handler.
    """
    pass
