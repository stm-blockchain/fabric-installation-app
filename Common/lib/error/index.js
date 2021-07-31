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

class NodeTypeError extends BaseError {
    constructor(message, cause) {
        super(message, cause);
        this.name = `Node Type Error`;
    }
}

class ContextObjError extends BaseError {
    constructor(message, cause) {
        super(message, cause);
        this.name = `Context Object Error`;
    }
}

class FolderStructureError extends BaseError {
    constructor(message, cause) {
        super(message, cause);
        this.name = `Folder Structure Error`;
    }
}

class CommandGenerationError extends BaseError {
    constructor(message, cause) {
        super(message, cause);
        this.name = `Command Generation Error`;
    }
}

class GenericError extends BaseError {
    constructor(message, cause) {
        super(message, cause);
        this.name = `Generic Error`;
    }
}

module.exports = {
    BaseError: BaseError,
    FabricError: FabricError,
    DockerError: DockerError,
    NodeTypeError: NodeTypeError,
    ContextObjError: ContextObjError,
    FolderStructureError: FolderStructureError,
    CommandGenerationError: CommandGenerationError,
    GenericError: GenericError
}
