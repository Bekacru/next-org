import { User } from "next-auth";
import {
    Organization,
    OrganizationInvitation,
    OrganizationMember,
} from "@next-org/types/models";
import Cookies from "js-cookie";
const url = process.env.NEXTAUTH_URL ?? "";

type ClientError = {
    message: string;
    status: number;
};

type FetchClientHandler<T, R> = (
    ...args: T[]
) => Promise<{ data: null; error: ClientError } | { data: R; error: null }>;

export const isClientSide = (): boolean => typeof window !== "undefined";

const fetchWithCookie = async (url: string, options?: RequestInit) => {
    const getCookies = () => {
        const { cookies } = {
            cookies: [
                {
                    name: "next-auth.session-token",
                    value: Cookies.get("next-auth.session-token"),
                },
                {
                    name: "next-auth.csrf-token",
                    value: Cookies.get("next-auth.csrf-token"),
                },
            ],
        };
        return cookies.join(";");
    };
    const req = await fetch(url, {
        ...options,
        credentials: "same-origin",
        headers: !isClientSide()
            ? {
                cookie: getCookies(),
                ...options?.headers,
            }
            : {
                ...options?.headers,
            },
    });
    return req;
};
export const getFullOrganization: FetchClientHandler<
    { orgId: string },
    {
        organization: Organization | null;
        members: OrganizationMember[];
        invitations: OrganizationInvitation[];
        currentUser: (OrganizationMember & User) | null;
    }
> = async ({ orgId }) => {
    const req = await fetchWithCookie(
        `${url}/api/auth/org/get/full?orgId=${orgId}`,
    );
    if (!req.ok) {
        return {
            error: {
                status: 500,
                message: "Error getting organization",
            },
            data: null,
        };
    }
    const data = await req.json();
    if (!data)
        return {
            data: {
                organization: null,
                members: [],
                invitations: [],
                currentUser: null,
            },
            error: null,
        };
    const { members, invitations, ...rest } = data as Organization & {
        members: OrganizationMember[];
        invitations: OrganizationInvitation[];
    };
    const currentUser = await getMember();
    return {
        data: {
            organization: rest,
            members,
            invitations,
            currentUser,
        },
        error: null,
    };
};

export const getOrganization: FetchClientHandler<
    { orgId: string },
    Organization
> = async ({ orgId }) => {
    const res = await fetch(`/api/auth/org/get?orgId=${orgId}`);
    if (!res.ok)
        return {
            data: null,
            error: { message: "Error getting organization", status: 500 },
        };
    const data = (await res.json()) as Organization;
    return {
        data,
        error: null,
    };
};

export const listOrganizations: FetchClientHandler<
    void,
    Organization[]
> = async () => {
    const res = await fetch(`/api/auth/org/list`);
    if (!res.ok)
        return {
            data: null,
            error: { message: "Error getting organization", status: 500 },
        };
    const data = (await res.json()) as Organization[];
    return {
        data,
        error: null,
    };
};

export const createOrganization: FetchClientHandler<
    { name: string; slug: string },
    Organization
> = async (data) => {
    const res = await fetch(`/api/auth/org/create`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
            credentials: "same-origin",
        },
    });
    if (!res.ok) {
        return {
            data: null,
            error: {
                message: res.status === 409 ? "duplicated slug" : "unknown error",
                status: res.status,
            },
        };
    }
    const result = (await res.json()) as Organization;
    return {
        data: result,
        error: null,
    };
};

export const updateOrganization = async (
    data: Partial<Organization>,
    id: string,
) => {
    const res = await fetch(`/api/auth/org/update?orgId=${id}`, {
        method: "POST",
        body: JSON.stringify(data),
    });
    const result = await res.json();
    return result as Organization;
};

export const removeOrganization = async (id: string) => {
    const res = await fetch(`/api/auth/org/delete?orgId=${id}`, {
        method: "POST",
    });
    const result = await res.json();
    return result;
};

export const orgApi = {
    getOrganization,
    listOrganizations,
    createOrganization,
    updateOrganization,
    removeOrganization,
};

export const getInvitation = async (token: string) => {
    const res = await fetchWithCookie(
        `/api/auth/org/invitation/get?token=${token}`,
    );
    const data = await res.json();
    return data as OrganizationInvitation & { isRegistered: boolean };
};

export const listInvitations = async (orgId: string) => {
    const res = await fetch(`/api/auth/org/invitation/list?orgId=${orgId}`);
    const data = await res.json();
    return data as OrganizationInvitation[];
};

export const createInvitation = async (
    data: Omit<
        OrganizationInvitation,
        "token" | "status" | "createdAt" | "updatedAt"
    >,
) => {
    const res = await fetch(
        `/api/auth/org/invitation/create?orgId=${data.orgId}`,
        {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        },
    );
    const result = await res.json();
    return result as OrganizationInvitation;
};

export const updateInvitation = async (
    data: Partial<OrganizationInvitation>,
    token: string,
) => {
    const res = await fetchWithCookie(
        `/api/auth/org/invitation/update?token=${token}`,
        {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        },
    );
    const result = await res.json();
    return result as OrganizationInvitation;
};

export const removeInvitation = async (token: string) => {
    const res = await fetch(`/api/auth/org/invitation/delete?token=${token}`, {
        method: "POST",
    });
    const result = await res.json();
    return result;
};

export const invitationApi = {
    getInvitation,
    listInvitations,
    createInvitation,
    updateInvitation,
    removeInvitation,
};

export const getMember = async () => {
    const res = await fetchWithCookie(`${url}/api/auth/org/member/get`);
    const data = await res.json();
    return data as (User & OrganizationMember) | OrganizationMember;
};

export const getUserByEmail = async (email: string) => {
    const res = await fetchWithCookie(`/api/auth/org/member/get?email=${email}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data as User;
};

export const listMembers = async (orgId: string) => {
    const res = await fetch(`/api/auth/org/member/list?orgId=${orgId}`);
    const data = await res.json();
    return data as OrganizationMember[];
};

export const createMember = async (
    data?: Omit<OrganizationMember, "createdAt" | "updatedAt" | "id">,
    invitationToken?: string,
) => {
    const res = await fetch(`/api/auth/org/member/create?orgId=${data?.orgId}`, {
        method: "POST",
        body: JSON.stringify({ ...data, invitationToken }),
        headers: {
            "Content-Type": "application/json",
        },
    });
    const result = await res.json();
    return result as OrganizationMember;
};

export const updateMember: FetchClientHandler<
    {
        data: Partial<OrganizationMember>;
        userId: string;
        orgId: string;
    },
    OrganizationMember
> = async ({ data, userId, orgId }) => {
    const res = await fetch(
        `/api/auth/org/member/update?userId=${userId}&orgId=${orgId}`,
        {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        },
    );
    if (!res.ok)
        return {
            error: { message: "Error Updating Member", status: res.status },
            data: null,
        };
    const result = (await res.json()) as OrganizationMember;
    return {
        data: result,
        error: null,
    };
};

export const removeMember: FetchClientHandler<
    { userId: string; orgId: string },
    null
> = async ({ userId, orgId }) => {
    const res = await fetch(
        `/api/auth/org/member/delete?userId=${userId}&orgId=${orgId}`,
        {
            method: "POST",
        },
    );
    const possibleErrors = {
        403: "Unauthorized Request",
    };
    let error: ClientError | null = null;
    if (!res.ok) {
        if (res.status === 403) {
            error = {
                message: "Unauthorized Action",
                status: 403,
            };
        }
        if (res.status === 400) {
            error = {
                message: "owner can't leave organization",
                status: 400,
            };
        }
        return {
            data: null,
            error: error ?? {
                message: "Error happened while removing user",
                status: res.status,
            },
        };
    }
    return {
        data: null,
        error: null,
    };
};

export const memberApi = {
    getMember,
    listMembers,
    createMember,
    updateMember,
    removeMember,
};
