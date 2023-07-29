import { OrgAdapter } from "@next-org/types/adapters";
import { afterAll, afterEach, beforeAll, beforeEach, test } from "vitest";

export interface TestOptions {
    adapter: OrgAdapter;
    skipTests?: string[];
    beforeAll?: () => Promise<any>;
    afterAll?: () => Promise<any>;
    beforeEach?: () => Promise<any>;
    afterEach?: () => Promise<any>;
}

const testIf = (condition: boolean) => (condition ? test : test.skip);

export async function runAdapterTest(options: TestOptions) {
    const { skipTests } = options;
    beforeAll(async () => {
        await options.beforeAll?.();
    });

    afterAll(async () => {
        await options.afterAll?.();
    });

    beforeEach(async () => {
        await options.beforeEach?.();
    });

    afterEach(async () => {
        await options.afterEach?.();
    });

    //TODO:add adapter tests
}
