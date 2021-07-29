class BaseError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
    }
}

class FabricError extends BaseError {
    constructor(message, cause) {
        super(message, cause);
        this.name = "Fabric Error";
    }
}

class DockerError extends BaseError {
    constructor(message, cause) {
        super(message, cause);
        this.name = "Docker Error";
    }
}

class NodeTypeError extends BaseError{
    constructor(message, cause) {
        super(message, cause);
        this.name = `Node Type Error`;
    }
}

module.exports = {
    BaseError: BaseError,
    FabricError: FabricError,
    DockerError: DockerError,
    NodeTypeError: NodeTypeError
}
