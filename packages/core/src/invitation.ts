import { OrganizationInvitation } from "@next-org/types/models";

export const setInvitationExpiryTime = (
    invitation: OrganizationInvitation,
    expiryTime?: number,
) => {
    if (expiryTime !== 0) {
        if (invitation.status === "pending") {
            const expiry = expiryTime ?? 86400000;
            if (Date.now() - invitation.createdAt.getTime() > expiry) {
                invitation.status = "expired";
            }
        }
    }
    return invitation;
};
