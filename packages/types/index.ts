import { OrgAdapter } from "./adapters";
import { Organization, OrganizationInvitation, OrganizationMember, Role } from "./models";
import { AuthOptions, User } from "next-auth";

export type OrgOptions = {
    /**
     * a function to send invitation link to user. It'll be called when you call createInvitation with token argument.
     * * **Required**: *No*
     */
    sendInvitation?: (token: string) => Promise<void>;
    /**
     * Organization adapter for your database.
     *
     * * **Required**: *No*
     *
     */
    adapter: OrgAdapter;
    /**
     * @default it uses getServerSession from next-auth
     * @description provide different function to get current user
     * * **Required**: *No*
     */
    getCurrentUser?: () => Promise<User | undefined>;
    /**
     * callback functions for different actions
     */
    callbacks?: {
        /**
         * @description - a callback function to be called when invitation is accepted
         * @param invitation - invitation object
         * @param member - member object
         * @param organization - organization object
         * * **Required**: *No*
         * @default - no callback
         * @example
         * ```ts
         * onInvitationAccepted: ({ invitation, member, organization }) => {
         * console.log("invitation accepted", invitation, member, organization);
         * }
         * ```
         */
        onInvitationAccepted?: ({
            invitation,
            member,
            organization,
        }: {
            invitation: OrganizationInvitation;
            member: OrganizationMember;
            organization: Organization;
        }) => void;
        onInvitationRejected?: () => void;
        onInvitationRevoked?: () => void;
    };
    /**
     * @description - a custom function to generate token for invitation
     * @returns - token for invitation
     */
    inviteTokenGenerator?: () => string;
    /**
     * @description default 1 day pass 0 for no expiry
     */
    inviteTokenExpiry?: number;
    /**
     * @description if you want to check if user is member of organization before performing any action on organization.
     */
    checkMembership?: boolean;
    /**
     * @description - rules for actions on organization
     * @default
     * "delete-org": ["owner"]
     * "update-org": ["owner"]
     * "invite-member": ["owner", "admin"]
     * "remove-member": ["owner", "admin"]
     * "update-member": ["owner", "admin"]
     * "create-member-without-invitation": []
     * "revoke-invitation": ["owner", "admin"]
     * @example
     * ```ts
     * {
     * "delete-org": ["owner", "admin"],
     * "update-org": ["owner", "admin"],
     * "invite-member": ["owner", "admin", "member"],
     * }
     * ```
     */
    permissions?: Permissions;
    /**
     * various rules for organizations.
     */
    rules?: Rules;
    /**
     * @description if you want to create a personal organization for each user. It'll be created when user sign up.
     */
    personalOrganization?: {
        enable: boolean;
        /**
         * @description allow multiple members in personal organization
         */
        allowMultipleMembers: boolean;
    };
};

export type OrgUser = OrganizationMember & User;

type checkPermissionFn = (member: OrgUser) => boolean;

export type Rules = {
    /**
     * @description you can allow owner to leave organizations just needs to defined some extra rules if you do so
     */
    allowOwnersToLeaveOrg?:
    | {
        enable: boolean;
        /**
           * @description add minimum owners count to allow this
           */
        minOwners?: number;
        /**
           * @default false
           */
        deleteAbandonedOrg?: boolean;
    }
    | false;
    /**
     * @description allow multiple owners in organization. By default, it's true.
     */
    allowMultipleOwners?: boolean;
    /**
     * @default unlimited
     * @description limit the number of members
     */
    maxMembers?: number | ((orgId: string) => number) | ((orgId: string) => Promise<number>);
    /**
     * @default unlimited
     * @description limit the number of active invitations
     */
    maxActiveInvitations?:
    | number
    | ((orgId: string) => number)
    | ((orgId: string) => Promise<number>);
    /**
     * @description if you want to delete invitation after it's accepted from the database.
     * @default false
     */
    deleteInvitationAfterAccept?: boolean;
};

export type Permissions = {
    "delete-org"?: Role | Role[] | checkPermissionFn;
    "update-org"?: Role | Role[] | checkPermissionFn;
    "invite-member"?: Role | Role[] | checkPermissionFn;
    "remove-member"?: Role | Role[] | checkPermissionFn;
    "update-member"?: Role | Role[] | checkPermissionFn;
    "update-invitation"?: Role | Role[] | checkPermissionFn;
    "delete-invitation"?: Role | Role[] | checkPermissionFn;
    /**
     * @default empty
     * @description this is for creating a member without a need for invitation token
     */
    "create-member-without-invitation"?: Role | Role[] | checkPermissionFn;
};

export type HandlerRequest<
    T extends object | null = Record<string, unknown>,
    Q extends Record<string, string> = Record<string, string>,
> = {
    body: T;
    query: Q;
    method: string;
    adapter: OrgAdapter;
    headers: Record<string, string>;
    options: OrgOptions;
    action: OrgActions;
    user?: User;
};

export type HandlerResponse = {
    status: number;
    data: object | unknown[] | null;
};
export type Handler<
    T extends object | null = Record<string, unknown>,
    Q extends Record<string, string> = Record<string, string>,
> = (req: HandlerRequest<T, Q>) => Promise<HandlerResponse>;

export type Options = AuthOptions & {
    /**
     * @description options for organization
     */
    orgOptions: OrgOptions;
};

export type BaseOrgActions = "list" | "create" | "update" | "delete" | "get";
export type OrgActions =
    | "org/list"
    | "org/create"
    | "org/update"
    | "org/delete"
    | "org/get"
    | "org/get/full"
    | "org/invitation/create"
    | "org/invitation/get"
    | "org/invitation/list"
    | "org/invitation/update"
    | "org/invitation/delete"
    | "org/member/create"
    | "org/member/get"
    | "org/member/getByEmail"
    | "org/member/list"
    | "org/member/update"
    | "org/member/delete";

type UserId = string;

declare module "next-auth/jwt" {
    interface JWT {
        id: UserId;
    }
}

declare module "next-auth" {
    interface Session {
        user: User & {
            id: UserId;
        };
    }
}