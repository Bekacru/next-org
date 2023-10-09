import { apiResponse } from "../api-response";
import { DuplicatedSlugError, InvalidParameterError, checkRequiredSchema } from "../errors";
import { checkPermission } from "../permissions";
import { Handler } from "@next-org/types";
import { Organization } from "@next-org/types/models";

export const createOrganization: Handler<Partial<Organization>> = async ({
    body,
    adapter,
    user,
}) => {
    const organization = checkRequiredSchema(body, ["slug", "name"]);
    if (!user) {
        return apiResponse.notAuthenticated;
    }
    const owner = checkRequiredSchema(user, ["id", "email"]);
    try {
        const createdOrg = await adapter.createOrganization(organization as Organization);
        if (!createdOrg) {
            return apiResponse.serverError;
        }
        const createdOwner = await adapter.createMember({
            orgId: createdOrg.slug,
            email: owner.email as string,
            userId: owner.id,
            role: "owner",
            name: owner.name,
        });
        return {
            status: 200,
            data: {
                ...createdOrg,
                ...createdOwner,
            },
        };
    } catch (e) {
        if (e instanceof DuplicatedSlugError) {
            return apiResponse.duplicatedId;
        }
        return apiResponse.serverError;
    }
};

export const getOrganization: Handler<null, { orgId: string }> = async ({
    adapter,
    user,
    query,
    options,
}) => {
    const orgId = query.orgId;
    if (!orgId) throw new InvalidParameterError("orgId is required to get organization details");
    if (options.checkMembership) {
        if (!user?.id) throw new InvalidParameterError("user id is required to check membership");
        const orgs = await adapter.listOrganizations(user.id);
        return {
            status: 200,
            data: orgs.find((o) => o.slug === orgId) as Organization | null,
        };
    }
    const org = await adapter.getOrganization(query.orgId);
    return {
        status: 200,
        data: org,
    };
};

export const getFullOrganization: Handler<null, { orgId: string }> = async ({
    query,
    adapter,
    user,
    options,
}) => {
    const orgId = query.orgId;
    if (!orgId) {
        return {
            status: 400,
            data: {
                error: {
                    message: "orgId is required to get organization details",
                },
            },
        };
    }
    if (options.checkMembership) {
        if (!user?.id) {
            return {
                status: 400,
                data: null,
            };
        }
        const orgs = await adapter.listOrganizations(user.id);
        const userOrgId = orgs.find((o) => o.slug === orgId) as Organization | null;
        if (!userOrgId) {
            return apiResponse.notAuthenticated;
        }
    }
    const fullOrganization = await adapter.getFullOrganization(orgId);
    if (!fullOrganization) {
        return apiResponse.recordNotFound;
    }
    return {
        status: 200,
        data: fullOrganization,
    } as const;
};

export const listOrganizations: Handler = async ({ user, adapter }) => {
    const id = user?.id;
    if (!id) throw new InvalidParameterError("User id is required to get organization list.");
    const orgs = await adapter.listOrganizations(id);
    return {
        status: 200,
        data: orgs,
    };
};

export const deleteOrganization: Handler<null, { orgId: string }> = async ({
    adapter,
    query,
    user,
    options,
}) => {
    const orgId = query.orgId;
    if (!orgId) throw new InvalidParameterError("orgId is required to delete organization");
    if (!user?.id) throw new InvalidParameterError("user is required to delete organization");
    const orgMember = await adapter.getMember(user.id, orgId);
    if (!orgMember) throw new InvalidParameterError("user is not a member of organization");
    const isPermitted = checkPermission({
        customRule: options.permissions?.["delete-org"],
        member: orgMember,
        action: "delete-org",
        user,
    });
    if (!isPermitted) return apiResponse.notAuthenticated;
    await adapter.deleteOrganization(query.orgId);
    return {
        status: 200,
        data: null,
    };
};

export const updateOrganization: Handler<Partial<Organization>, { orgId: string }> = async ({
    user,
    adapter,
    query,
    body,
    options,
}) => {
    const orgId = query.orgId;
    if (!orgId) throw new InvalidParameterError("orgId is required");
    if (!user?.id) throw new InvalidParameterError("user is required");
    const orgMemberToUpdate = await adapter.getMember(user.id, orgId);
    if (!orgMemberToUpdate) {
        return apiResponse.notAuthenticated;
    }
    const isPermittedToUpdate = checkPermission({
        member: orgMemberToUpdate,
        action: "update-org",
        customRule: options.permissions?.["update-org"],
        user,
    });
    if (!isPermittedToUpdate) {
        return apiResponse.notAuthenticated;
    }
    const updatedOrg = await adapter.updateOrganization(body, query.orgId);
    return {
        status: 200,
        data: updatedOrg,
    };
};
