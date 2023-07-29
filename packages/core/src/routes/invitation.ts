import { randomBytes, randomUUID } from "crypto";
import { apiResponse } from "../api-response";
import { InvalidParameterError, checkRequiredSchema } from "../errors";
import { OrganizationInvitation } from "@next-org/types/models";
import { checkPermission } from "../permissions";
import { Handler } from "@next-org/types";
import { logger } from "../logger";
import { setInvitationExpiryTime } from "../invitation";
import { checkInvitationsCount, checkMembersCount } from "../checks";

export const createInvitation: Handler<OrganizationInvitation> = async ({
  body,
  user,
  options,
  adapter,
}) => {
  const data = checkRequiredSchema(body, ["email", "orgId", "role"]);
  const orgId = data.orgId;
  if (!user?.id)
    throw new InvalidParameterError("user is require to create invitation");
  if (!options.sendInvitation)
    logger.warn(
      "sendInvitation is not provided! Invitation email/sms will not be sent",
    );
  const invitingMember = await adapter.getMember(user.id, orgId);
  const createInvitePermission = checkPermission({
    action: "invite-member",
    customRule: options.permissions?.["invite-member"],
    member: invitingMember,
    user,
  });
  if (!createInvitePermission) {
    return apiResponse.notAuthenticated;
  }
  const isAlreadyMember = await adapter.getMemberByEmail(data.email, orgId);
  if (isAlreadyMember) {
    return {
      data: {
        message: "the user is already a member in this organization!",
      },
      status: 400,
    };
  }
  const invitationData = body;
  const token =
    options.inviteTokenGenerator?.() ?? randomUUID() ?? randomBytes(32);
  invitationData.token = token;
  if (!invitationData.email)
    throw new InvalidParameterError("email is required");

  const maxInvites = options.rules?.maxActiveInvitations;
  const maxMembers = options.rules?.maxMembers;
  if (maxInvites) {
    await checkInvitationsCount(maxInvites, orgId, adapter);
  }
  if (maxMembers) {
    await checkMembersCount(maxMembers, orgId, adapter);
  }

  const invitation = await adapter.createInvitation(invitationData);
  if (options.sendInvitation) {
    await options.sendInvitation(token);
  }
  return {
    status: 200,
    data: invitation,
  };
};

export const getInvitation: Handler<null, { token?: string }> = async ({
  query,
  adapter,
  options,
}) => {
  if (!query.token) throw new InvalidParameterError("token is required");
  const invitationByToken = await adapter.getInvitation(query.token);
  if (!invitationByToken) {
    return {
      status: 400,
      data: {
        message: "invitation couldn't be found!",
      },
    };
  }
  const isRegistered = await adapter.getUserByEmail(invitationByToken?.email);
  const invitationWithExpiryTime = setInvitationExpiryTime(
    invitationByToken,
    options.inviteTokenExpiry,
  );
  return {
    status: 200,
    data: {
      ...invitationWithExpiryTime,
      isRegistered: !!isRegistered,
    },
  };
};

export const updateInvitation: Handler<
  OrganizationInvitation,
  { token: string }
> = async (req) => {
  const { user, query, adapter, options, body } = req;
  if (!user) return apiResponse.notAuthenticated;
  const data = checkRequiredSchema(body, ["status"]);
  const orgId = data.orgId;
  const invitation = await adapter.getInvitation(query.token);
  if (!invitation) {
    return {
      status: 400,
      data: {
        message: "invitation couldn't be found!",
      },
    };
  }
  //TODO:reconsider this if there is a use case to update accepted invitation
  if (invitation.status === "accepted")
    return {
      status: 400,
      data: {
        message: "invitation is already accepted!",
      },
    };
  //rejection should only be done by signed in user
  if (data.status === "rejected") {
    if (invitation.status !== "pending")
      return {
        status: 400,
        data: {
          message: "invitation is not pending!",
        },
      };
    const isCurrentUserInvited = user
      ? user?.email === invitation.email
      : false;
    if (!isCurrentUserInvited) {
      return apiResponse.notAuthenticated;
    }
    const updatedInvitation = await adapter.updateInvitation(body, query.token);
    return {
      data: updatedInvitation,
      status: 200,
    };
  }
  const invitationUpdaterMember = await adapter.getMember(user.id, orgId);
  const updateInvitePermission = checkPermission({
    action: "update-invitation",
    user,
    member: invitationUpdaterMember,
    customRule: options.permissions?.["update-invitation"],
  });
  if (!updateInvitePermission) {
    return apiResponse.notAuthenticated;
  }
  const updatedInvitation = await adapter.updateInvitation(body, query.token);
  return {
    status: 200,
    data: updatedInvitation,
  };
};

export const listInvitations: Handler<null, { orgId: string }> = async ({
  query,
  adapter,
  options,
}) => {
  if (!query.orgId) throw new InvalidParameterError("orgId is required");
  const invitations = await adapter.listInvitations(query.orgId);
  const invitationsWithExpiryTime = invitations.map((i) =>
    setInvitationExpiryTime(i, options.inviteTokenExpiry),
  );
  return {
    status: 200,
    data: invitationsWithExpiryTime,
  };
};

export const deleteInvitation: Handler<
  null,
  { token: string; orgId: string }
> = async ({ query, user, adapter, options }) => {
  const orgId = query.orgId;
  if (!query.token) throw new InvalidParameterError("token is required");
  if (!user?.id)
    throw new InvalidParameterError("user id is required to delete invitation");
  const deleteInvitationMember = await adapter.getMember(user?.id, orgId);
  const deleteInvitationPerm = checkPermission({
    user,
    member: deleteInvitationMember,
    customRule: options.permissions?.["delete-invitation"],
    action: "delete-invitation",
  });
  if (!deleteInvitationPerm) {
    return apiResponse.notAuthenticated;
  }
  await adapter.deleteInvitation(query.token);
  return {
    status: 200,
    data: null,
  };
};
