export type Role = "member" | "admin" | "owner";
export type Status = "pending" | "accepted" | "rejected" | "expired";
export type Organization = {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
};

export type OrganizationMember = {
    id: string;
    userId: string;
    orgId: string;
    email: string;
    name?: string | null;
    role: Role; // member, admin, owner
    createdAt: Date;
    updatedAt: Date;
};

export type OrganizationInvitation = {
    email: string;
    orgId: string;
    token: string; //unique
    status: Status;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
};

export type FullOrganization = Organization & {
    invitations: OrganizationInvitation[];
    members: OrganizationMember[];
};

//matches next-auth User type
export type User = {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
};
