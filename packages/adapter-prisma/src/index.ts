import { Errors, OrgAdapter } from "@next-org/core";
import {
    FullOrganization,
    OrganizationInvitation,
    OrganizationMember,
} from "@next-org/types/models";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const { DuplicatedSlugError, DuplicatedUserError, MemberNotFound } = Errors;

export const PrismaOrgAdapter = (db: PrismaClient): OrgAdapter => {
    return {
        async createOrganization(data) {
            return await db.organization
                .create({
                    data: data,
                })
                .catch((err) => {
                    if (err instanceof PrismaClientKnownRequestError) {
                        if (err.code === "P2002") {
                            throw new DuplicatedSlugError("Organization Slug is already taken");
                        }
                    }
                    return null;
                });
        },

        async updateOrganization(data, slug) {
            return await db.organization.update({
                where: { slug },
                data,
            });
        },

        async getOrganization(slug) {
            return await db.organization.findUnique({
                where: { slug },
            });
        },

        async listOrganizations(userId) {
            return await db.organizationMember
                .findMany({
                    where: {
                        userId,
                    },
                    include: {
                        organization: true,
                    },
                })
                .then((res) => res.map((r) => r.organization));
        },

        async getFullOrganization(slug) {
            return (await db.organization
                .findFirst({
                    where: {
                        slug,
                    },
                    include: {
                        OrganizationMember: true,
                        OrganizationInvitation: true,
                    },
                })
                .then((res) => {
                    if (res) {
                        const { OrganizationMember, OrganizationInvitation, ...rest } = res;
                        return {
                            ...rest,
                            members: OrganizationMember,
                            invitations: OrganizationInvitation,
                        };
                    }
                    return null;
                })) as FullOrganization | null;
        },

        async deleteOrganization(slug) {
            return await db.organization.delete({
                where: { slug },
            });
        },

        //Invitations

        async createInvitation(data) {
            return await db.organizationInvitation
                .create({
                    data: data,
                })
                .then((res) => res as OrganizationInvitation);
        },

        async getInvitation(token) {
            return await db.organizationInvitation
                .findFirst({
                    where: {
                        token,
                    },
                })
                .then((res) => {
                    if (res) {
                        return res as OrganizationInvitation;
                    }
                    return null;
                });
        },

        async updateInvitation(data, token) {
            return await db.organizationInvitation
                .update({
                    where: { token },
                    data,
                })
                .then((res) => res as OrganizationInvitation);
        },

        async deleteInvitation(token) {
            return (await db.organizationInvitation.delete({
                where: { token },
            })) as OrganizationInvitation;
        },

        async listInvitations(orgId) {
            return await db.organizationInvitation
                .findMany({
                    where: { orgId },
                })
                .then((res) => res as OrganizationInvitation[]);
        },

        //Members
        async createMember(data) {
            return await db.organizationMember
                .create({
                    data: data,
                })
                .then((res) => res as OrganizationMember)
                .catch((e) => {
                    if (e instanceof PrismaClientKnownRequestError) {
                        if (e.code === "P2002") {
                            throw new DuplicatedUserError("user already exist in the organization");
                        }
                    }
                    throw e;
                });
        },

        async getMemberByEmail(email, orgId) {
            return await db.organizationMember
                .findFirst({
                    where: {
                        AND: {
                            email,
                            orgId,
                        },
                    },
                })
                .then((res) => {
                    if (res) {
                        return res as OrganizationMember;
                    }
                    return null;
                });
        },

        async getMember(userId, orgId) {
            return await db.organizationMember
                .findFirst({
                    where: {
                        userId,
                        orgId,
                    },
                })
                .then((res) => res as OrganizationMember);
        },

        async updateMember(data, id) {
            return await db.organizationMember
                .update({
                    where: { id },
                    data,
                })
                .then((res) => res as OrganizationMember)
                .catch((e) => {
                    if (e instanceof PrismaClientKnownRequestError) {
                        if (e.code === "P2025") {
                            throw new MemberNotFound("member to update is not found!");
                        }
                    }
                    throw e;
                });
        },

        async listMembers(orgId) {
            return await db.organizationMember
                .findMany({
                    where: { orgId },
                })
                .then((res) => res as OrganizationMember[]);
        },

        async deleteMember(id) {
            return (await db.organizationMember
                .delete({
                    where: { id },
                })
                .catch((e) => {
                    if (e instanceof PrismaClientKnownRequestError) {
                        if (e.code === "P2025") {
                            throw new MemberNotFound("member is not found!");
                        }
                    }
                    throw e;
                })) as OrganizationMember;
        },
        async getUserByEmail(email) {
            return await db.user.findFirst({
                where: {
                    email,
                },
            });
        },
    };
};
