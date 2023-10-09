import { Handler } from "@next-org/types";
import { apiResponse } from "./api-response";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrgError } from "./errors";
import { logger } from "./logger";
import {
    createInvitation,
    deleteInvitation,
    getInvitation,
    listInvitations,
    updateInvitation,
} from "./routes/invitation";
import { createMember, deleteMember, getMember, listMembers, updateMember } from "./routes/member";
import {
    createOrganization,
    deleteOrganization,
    getFullOrganization,
    getOrganization,
    listOrganizations,
    updateOrganization,
} from "./routes/organization";

export const internalRouter: Handler<any, any> = async (req) => {
    const { action } = req;
    try {
        switch (action) {
            //organizations
            case "org/create":
                return await createOrganization(req);
            case "org/get":
                return await getOrganization(req);
            case "org/get/full":
                return await getFullOrganization(req);
            case "org/list":
                return await listOrganizations(req);
            case "org/delete":
                return await deleteOrganization(req);
            case "org/update":
                return await updateOrganization(req);

            //invitations
            case "org/invitation/create":
                return await createInvitation(req);
            case "org/invitation/get":
                return await getInvitation(req);
            case "org/invitation/list":
                return await listInvitations(req);
            case "org/invitation/update":
                return await updateInvitation(req);
            case "org/invitation/delete":
                return await deleteInvitation(req);

            //members
            case "org/member/create":
                return await createMember(req);
            case "org/member/get":
                return await getMember(req);
            case "org/member/list":
                return await listMembers(req);
            case "org/member/delete":
                return await deleteMember(req);
            case "org/member/update":
                return await updateMember(req);
        }
    } catch (e) {
        if (e instanceof OrgError) {
            logger.error(e);
            return {
                status: 404,
                data: null,
            };
        } else {
            console.error(e);
        }
        return apiResponse.serverError;
    }
    return apiResponse.routeNotFound;
};
