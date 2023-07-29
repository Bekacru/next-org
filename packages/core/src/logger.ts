import { OrgError } from "./errors";

export type WarningCode =
    | "sendInvitation is not provided! Invitation email/sms will not be sent"
    | "Can't find user id falling back to email";

// eslint-disable-next-line @typescript-eslint/ban-types
export interface LoggerInstance extends Record<string, Function> {
    warn: (code: WarningCode) => void;
    error: (error: OrgError) => void;
    debug: (message: string, metadata?: unknown) => void;
}

const red = "\x1b[31m";
const yellow = "\x1b[33m";
const grey = "\x1b[90m";
const reset = "\x1b[0m";

export const logger: LoggerInstance = {
    error(error: OrgError) {
        console.error(
            `${red}[auth][error][${error.name}]${reset}:${
                error.message ? ` ${error.message}.` : ""
            }`,
        );
        if (error.cause) {
            const { err, ...data } = error.cause as { err: unknown };
            console.error(`${red}[auth][cause]${reset}:`, (err as Error).stack);
            console.error(`${red}[auth][details]${reset}:`, JSON.stringify(data, null, 2));
        } else if (error.stack) {
            console.error(error.stack.replace(/.*/, "").substring(1));
        }
    },
    warn(code) {
        console.warn(`${yellow}[auth][warn][${code}]${reset}`);
    },
    debug(message, metadata) {
        console.log(`${grey}[auth][debug]:${reset} ${message}`, JSON.stringify(metadata, null, 2));
    },
};
