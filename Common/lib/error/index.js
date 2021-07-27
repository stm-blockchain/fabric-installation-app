class BaseError extends Error {
    constructor(message, stack) {
        super(message);
        this.stack = stack;
    }
}

class FabricError extends BaseError {
    constructor(message, stack) {
        super(message, stack);
        this.name = "Fabric Error";
    }

}

class DockerError extends BaseError {
    constructor(message) {
        super(message);
        this.name = "Docker Error";
    }
}

module.exports = {
    BaseError: BaseError,
    FabricError: FabricError,
    DockerError: DockerError,
}
