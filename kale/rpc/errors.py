import enum

from kale.rpc.utils import serialize
from kale.rpc.log import KALE_LOG_FILE


class Code(enum.Enum):
    OK = 0
    IMPORT_ERROR = 1
    ENCODING_ERROR = 2
    NOT_FOUND = 3
    INTERNAL_ERROR = 4
    SERVICE_UNAVAILABLE = 5
    UNHANDLED_ERROR = 6


class _RPCError(Exception):
    """Generic RPC Error."""

    name = "rpcError"
    message = "RPC error"
    details = "You can find more information under %s" % KALE_LOG_FILE
    trans_id = -1

    def __init__(self, message=None, details=None, trans_id=None):
        if message:
            self.message = message
        if details:
            self.details = details
        if trans_id:
            self.trans_id = trans_id

    def to_dict(self):
        return {"code": self.code.value, "err_message": self.message,
                "err_details": self.details, "err_cls": self.name,
                "trans_id": self.trans_id}

    def serialize(self):
        return serialize(self.to_dict())


class RPCImportError(_RPCError):

    name = "importError"
    code = Code.IMPORT_ERROR


class RPCEncodingError(_RPCError):

    name = "encodingError"
    code = Code.ENCODING_ERROR


class RPCNotFoundError(_RPCError):

    name = "notFoundError"
    code = Code.NOT_FOUND
    message = "Not Found"


class RPCInternalError(_RPCError):

    name = "internalError"
    code = Code.INTERNAL_ERROR
    message = "Internal Error"


class RPCServiceUnavailableError(_RPCError):

    name = "serviceUnavailableError"
    code = Code.SERVICE_UNAVAILABLE
    message = "Service is Unavailable"


class RPCUnhandledError(_RPCError):
    """Unhandled RPC Error."""

    name = "unhandledException"
    code = Code.UNHANDLED_ERROR
    message = "Unhandled exception during RPC execution"
