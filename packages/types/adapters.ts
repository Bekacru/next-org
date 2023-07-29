import {
    FullOrganization,
    Organization,
    OrganizationInvitation,
    OrganizationMember,
    User,
} from "./models";

export type OrgAdapter = {
    //organization
    createOrganization: (data: Omit<Organization, "id">) => Promise<Organization | null>;
    updateOrganization: (data: Partial<Organization>, slug: string) => Promise<Organization>;
    listOrganizations: (userId: string) => Promise<Organization[]>;
    getOrganization: (slug: string) => Promise<Organization | null>;
    getFullOrganization: (slug: string) => Promise<FullOrganization | null>;
    deleteOrganization: (slug: string) => Promise<null | Organization>;
    //invitations
    createInvitation: (data: OrganizationInvitation) => Promise<OrganizationInvitation>;
    getInvitation: (token: string) => Promise<OrganizationInvitation | null>;
    listInvitations: (orgId: string) => Promise<OrganizationInvitation[]>;
    updateInvitation: (
        data: Partial<OrganizationInvitation>,
        token: string,
    ) => Promise<OrganizationInvitation>;
    deleteInvitation: (token: string) => Promise<null | OrganizationInvitation>;
    //members
    createMember: (
        data: Omit<OrganizationMember, "createdAt" | "updatedAt" | "id">,
    ) => Promise<OrganizationMember>;
    listMembers: (orgId: string) => Promise<OrganizationMember[]>;
    /**
     * @description the id is the userId not the id of the member. It just make more sense to me to find member this way:)
     */
    getMember: (userId: string, orgId: string) => Promise<OrganizationMember>;
    getMemberByEmail: (email: string, orgId: string) => Promise<OrganizationMember | null>;
    updateMember: (data: Partial<OrganizationMember>, id: string) => Promise<OrganizationMember>;
    deleteMember: (id: string) => Promise<null | OrganizationMember>;

    //user
    getUserByEmail: (email: string) => Promise<User | null>;
};
