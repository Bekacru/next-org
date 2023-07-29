import { Errors, internalRouter, logger } from "@next-org/core";
import { HandlerRequest, Options, OrgActions } from "@next-org/types";
import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { getServerSession } from "next-auth";
const { UserEmailAndIdNotFoundError } = Errors;
type ctx = { params: { nextauth: string[] } };

type Auth = typeof NextAuth;
async function NextOrgRouteHandler(req: Request, ctx: ctx, options: Options, nextAuth: Auth) {
    async function fn(req: Request, ctx: ctx) {
        if (!ctx.params.nextauth.includes("org")) {
            return await nextAuth(req as any, ctx as any, options);
        }
        const url = new URL(req.url);
        const query = Object.fromEntries(url.searchParams.entries());
        let user = await getServerSession(options).then((res) => res?.user);
        if (user && !user.id) {
            if (!user.email) {
                logger.error(
                    new UserEmailAndIdNotFoundError(
                        "the server responded with a user without id and email",
                    ),
                );
            } else {
                user = (await options.orgOptions.adapter.getUserByEmail(user.email)) ?? undefined;
            }
        }
        const request: HandlerRequest = {
            query,
            method: req.method,
            headers: Object.fromEntries(req.headers),
            adapter: options.orgOptions.adapter,
            body:
                req.headers.get("Content-Type") === "application/json" && req.method === "POST"
                    ? await req.json()
                    : {},
            options: options.orgOptions,
            user: user,
            action: ctx.params.nextauth.join("/") as OrgActions,
        };
        const response = await internalRouter(request);
        return new Response(JSON.stringify(response.data), {
            status: response.status,
        });
    }
    return fn(req, ctx);
}

//TODO:to be done
async function NextOrgApiHandler(req: NextApiRequest, res: NextApiResponse, options: Options) {
    const query = req.query;
}

const NextOrg = (nextAuth: Auth, options: Options) => {
    async function fn(req: Request | NextApiRequest, arg: ctx | NextApiResponse) {
        if (arg.hasOwnProperty("params")) {
            return await NextOrgRouteHandler(req as Request, arg as ctx, options, nextAuth);
        }
        return await NextOrgApiHandler(req as NextApiRequest, arg as NextApiResponse, options);
    }
    return fn;
};

export { NextOrg };
