import random
import string


def random_string(size=5, chars=string.ascii_lowercase + string.digits):
    """Generate random string."""
    return "".join(random.choice(chars) for _ in range(size))