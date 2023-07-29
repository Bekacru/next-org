"use client";

import { createContext } from "react";
import {
  Organization,
  OrganizationInvitation,
  OrganizationMember,
} from "@next-org/types/models";
import { User } from "next-auth";

export type Membership = {
  member: OrganizationMember;
  remove: () => Promise<void>;
  update: (data: Partial<OrganizationMember>) => Promise<void>;
};

export type Invitation = {
  invitation: OrganizationInvitation;
  revoke: () => Promise<void>;
  resend: () => Promise<void>;
};

type FullOrg = {
  organization: Organization | null;
  members: Membership[];
  invitations: Invitation[];
  currentUser: OrganizationMember | null | User;
  isLoading: boolean;
  /**
   * @param slug - the slug of the organization to set as active. Don't pass the organization id.
   */
  setActiveOrganization: (slug: string) => void;
  createOrganization: (data: { name: string; slug: string }) => Promise<void>;
  isCreating: boolean;
  error?: string;
};
export const OrgContext = createContext<FullOrg>({
  organization: null,
  members: [],
  invitations: [],
  currentUser: null,
  setActiveOrganization: () => { },
  isLoading: false,
  createOrganization: async () => {
    throw new Error("React Context is unavailable in Server Components");
  },
  isCreating: false,
});
