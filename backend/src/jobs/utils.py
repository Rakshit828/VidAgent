SPLITTER = "--"


def construct_error_msg(step: str, message: str, error: str):
    return f"error=={error}{SPLITTER}step={step}{SPLITTER}message={message}"
