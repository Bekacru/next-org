import { Permissions } from "@next-org/types";
import { OrganizationMember } from "@next-org/types/models";
import { User } from "next-auth";

const defaultPermission: Permissions = {
    "delete-org": ["owner"],
    "invite-member": ["admin", "owner"],
    "remove-member": ["admin", "owner"],
    "update-org": ["admin", "owner"],
    "update-member": ["admin", "owner"],
    "update-invitation": ["admin", "owner"],
    "delete-invitation": ["admin", "owner"],
};

export function checkPermission<T extends keyof Permissions>({
    action,
    customRule,
    member,
    user,
}: {
    action: T;
    customRule?: Permissions[T];
    member: OrganizationMember;
    user: User;
}) {
    if (!member) {
        return false;
    }
    const permission = customRule || defaultPermission[action];
    if (typeof permission === "function") {
        return permission({ ...user, ...member });
    }
    if (Array.isArray(permission)) {
        return permission.includes(member.role);
    }
    if (typeof permission === "string") {
        return permission === member.role;
    }
    return false;
}
