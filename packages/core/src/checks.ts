import { OrgAdapter } from "@next-org/types/adapters";
export const checkMembersCount = async (
    limit: number | ((orgId: string) => number) | ((prgId: string) => Promise<number>),
    orgId: string,
    adapter: OrgAdapter,
) => {
    const members = await adapter.listMembers(orgId);
    let max: number;
    if (typeof limit === "function") {
        max = await Promise.resolve(limit(orgId));
    } else {
        max = limit;
    }
    if (members.length >= max) {
        return {
            status: 400,
            data: {
                message: "max allowed invitations reached!",
            },
        };
    }
};
export const checkInvitationsCount = async (
    limit: number | ((orgId: string) => number) | ((prgId: string) => Promise<number>),
    orgId: string,
    adapter: OrgAdapter,
) => {
    let max: number;
    const invitations = await adapter.listInvitations(orgId);
    if (typeof limit === "function") {
        max = await Promise.resolve(limit(orgId));
    } else {
        max = limit;
    }
    if (invitations.length >= max) {
        return {
            status: 400,
            data: {
                message: "max allowed invitations reached!",
            },
        };
    }
};
