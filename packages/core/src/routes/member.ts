import { apiResponse } from "../api-response";
import { checkMembersCount } from "../checks";
import {
  InvalidParameterError,
  MemberNotFound,
  checkRequiredSchema,
} from "../errors";
import { OrganizationMember } from "@next-org/types/models";
import { checkPermission } from "../permissions";
import { Handler } from "@next-org/types";

export const createMember: Handler<
  Partial<OrganizationMember> & { invitationToken: string },
  { orgId: string }
> = async ({ adapter, user, options, body, query }) => {
  if (!user) return apiResponse.notAuthenticated;
  const memberData = checkRequiredSchema(body, []);
  const userId = memberData.userId ?? user.id;
  const email = memberData.email ?? user.email;
  const name = memberData.name ?? user.name;
  const token = memberData.invitationToken;

  const invitation = token ? await adapter.getInvitation(token) : null;
  const isInvited = invitation
    ? invitation.email === email && invitation.status === "pending"
    : false;
  const orgId = invitation?.orgId ?? query.orgId;

  const maxMembers = options.rules?.maxMembers;
  if (maxMembers) {
    await checkMembersCount(maxMembers, orgId, adapter);
  }
  if (!isInvited) {
    //this is to create a member without invitation. By default no role can do this but can be set in options.
    const memberCreatingMember = await adapter.getMember(user.id, orgId);
    const memberWithoutInvitePerm = checkPermission({
      action: "create-member-without-invitation",
      member: memberCreatingMember,
      user: user,
      customRule: options.permissions?.["create-member-without-invitation"],
    });
    if (!memberWithoutInvitePerm) {
      return apiResponse.notAuthenticated;
    }
  }

  //@ts-expect-error: remove invitationToken from memberData
  delete memberData.invitationToken;
  const createdMember = await adapter.createMember({
    ...memberData,
    orgId,
    userId,
    email,
    name,
  });
  if (invitation) {
    if (options.rules?.deleteInvitationAfterAccept) {
      await adapter.deleteInvitation(invitation.token);
    } else {
      await adapter.updateInvitation(
        {
          status: "accepted",
        },
        invitation.token,
      );
    }
  }
  return {
    status: 200,
    data: createdMember,
  };
};

export const deleteMember: Handler<
  null,
  { userId?: string; orgId: string; email?: string }
> = async ({ adapter, query, user, options }) => {
  const { orgId, email, userId } = query;
  if (!orgId || (!userId && !email))
    throw new InvalidParameterError("orgId and either id or email is required");
  if (!user) return apiResponse.notAuthenticated;
  const deletingMember = await adapter.getMember(user?.id, orgId);
  const deleteMemberPerm = checkPermission({
    action: "remove-member",
    member: deletingMember,
    user,
    customRule: options.permissions?.["remove-member"],
  });
  if (!deleteMemberPerm) return apiResponse.notAuthenticated;
  const foundMember = userId
    ? await adapter.getMember(userId, orgId)
    : await adapter.getMemberByEmail(email as string, orgId);
  if (!foundMember) return apiResponse.recordNotFound;
  //owner leave check
  if (foundMember.role === "owner") {
    if (!options.rules?.allowOwnersToLeaveOrg) {
      return apiResponse.ownerLeaveError;
    }
    const minOwners = options.rules.allowOwnersToLeaveOrg.minOwners;
    const members = await adapter.listMembers(orgId);
    const owners = members.filter((m) => m.role === "owner");
    if (minOwners && minOwners <= 0) {
      if (owners.length > minOwners) {
        return apiResponse.ownerLeaveError;
      }
    }
    //TODO:not sure but I think we could mark it as abandoned if there is no owner.
    const isAbandoned = members.length <= 0;
    if (isAbandoned && options.rules.allowOwnersToLeaveOrg.deleteAbandonedOrg) {
      await adapter.deleteOrganization(orgId);
      return {
        status: 200,
        data: null,
      };
    }
  }
  await adapter.deleteMember(foundMember.userId);
  return {
    status: 200,
    data: null,
  };
};

export const getMember: Handler<
  null,
  { email: string; orgId: string }
> = async ({ query, user, adapter }) => {
  const orgId = query.orgId;
  const findBy = query.email ?? user?.email ?? user?.id;
  if (!findBy) throw new InvalidParameterError("user is required");
  if (!user?.id || query.email) {
    if (!orgId) {
      const user = await adapter.getUserByEmail(findBy);
      return {
        status: 200,
        data: user,
      };
    }
    const member = await adapter.getMemberByEmail(findBy, orgId);
    if (!user) throw new MemberNotFound("member is not found");
    return {
      status: 200,
      data: member,
    };
  }
  const member = await adapter.getMember(user?.id, orgId);
  return {
    status: 200,
    data: {
      ...member,
      ...user,
    },
  };
};

export const listMembers: Handler<null, { orgId: string }> = async ({
  query,
  user,
  adapter,
  options,
}) => {
  const orgId = query.orgId;
  if (!query.orgId) throw new InvalidParameterError("orgId is required");
  if (options.checkMembership) {
    if (!user?.id)
      throw new InvalidParameterError(
        "user id is required to check membership",
      );
    const orgs = await adapter.listOrganizations(user.id);
    const userOrgId = orgs.find((o) => o.slug === orgId);
    if (!userOrgId) {
      return apiResponse.notAuthenticated;
    }
  }
  const members = await adapter.listMembers(query.orgId);
  return {
    status: 200,
    data: members,
  };
};

export const updateMember: Handler<
  Partial<OrganizationMember>,
  { orgId: string; id: string; email: string }
> = async ({ query, user, adapter, options, body }) => {
  const memberId = query.id;
  const orgId = query.orgId;
  if ((!query.email || !orgId) && !memberId)
    throw new InvalidParameterError(
      "email and orgId or id is required to delete a member",
    );
  if (!user)
    throw new InvalidParameterError("user is required to delete a member");
  const updatingMember = await adapter.getMember(user?.id, orgId);
  const updateMemberPerm = checkPermission({
    action: "update-member",
    member: updatingMember,
    user,
    customRule: options.permissions?.["update-member"],
  });
  if (!updateMemberPerm) {
    return apiResponse.notAuthenticated;
  }
  const updatedMember = await adapter.updateMember(body, memberId);
  return {
    status: 200,
    data: updatedMember,
  };
};
