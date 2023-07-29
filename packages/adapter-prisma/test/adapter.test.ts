import { PrismaOrgAdapter } from "../src";
import { runAdapterTest } from "@next-org/adapter-test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
runAdapterTest({
    adapter: PrismaOrgAdapter(prisma),
});
