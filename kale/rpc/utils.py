import json
import base64


def serialize(value):
    return base64.b64encode(json.dumps(value).encode("utf-8")).decode("utf-8")


def deserialize(value):
    return json.loads(base64.b64decode(value).decode("utf-8"))
