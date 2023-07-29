type ErrorCause = Record<string, unknown>;

export class OrgError extends Error {
    cause?: ErrorCause;
    // rome-ignore lint/correctness/noUnreachableSuper: <explanation>
    constructor(message: string | Error | ErrorCause, cause?: ErrorCause) {
        if (message instanceof Error) {
            super(undefined);
            this.message;
        } else if (typeof message === "string") {
            super(message);
            if (cause instanceof Error) {
                this.cause = { err: cause, ...(cause.cause as object) };
            }
        } else {
            super(undefined);
            this.cause = message;
        }
        Error.captureStackTrace?.(this, this.constructor);
        this.name = message instanceof OrgError ? message.name : this.constructor.name;
    }
}

export class ConfigurationError extends OrgError {
    constructor(message: string | Error | ErrorCause) {
        super(message, {
            message: message instanceof Error ? message.message : "Configuration error",
        });
    }
}

export class InvalidParameterError extends OrgError {}

export class UserNotFoundError extends OrgError {
    constructor() {
        super("user not found!");
    }
}
export class UserEmailAndIdNotFoundError extends OrgError {}
export class MissingAdapter extends OrgError {}
export class MissingAdapterMethods extends OrgError {}
export class DuplicatedSlugError extends OrgError {}
export class DuplicatedUserError extends OrgError {}
export class MemberNotFound extends OrgError {}
export class DataValidationError extends OrgError {}

export const checkRequiredSchema = <T, K extends (keyof T)[]>(data: T, required: K) => {
    if (!data) {
        throw new Error("data isn't defined in required schema");
    }
    const missing = required.filter((key) => !data[key]);
    if (missing.length) {
        throw new InvalidParameterError(`Missing required parameters: ${missing.join(", ")}`);
    }
    return data as {
        [S in keyof T]-?: T[S];
    };
};
