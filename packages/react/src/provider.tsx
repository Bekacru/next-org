"use client";
import React from "react";
import { ReactNode, useEffect, useState } from "react";
import { Invitation, Membership, OrgContext } from "./context";
import { Organization, OrganizationMember } from "@next-org/types/models";
import {
  createInvitation,
  createOrganization,
  getFullOrganization,
  removeInvitation,
  removeMember,
  updateInvitation,
  updateMember,
} from "./fetch-client";
import {
  SessionProvider,
  SessionProviderProps,
  useSession,
} from "next-auth/react";
import { User } from "next-auth";

/**
 * @description A provider to provide global access to session and organization data. It uses the SessionProvider component from next-auth to provide session data, and the OrgProvider component to provide organization data.
 */
export function NextOrgProvider({
  children,
  oldInvitationOnResend,
  ...rest
}: OrgProviderProps & SessionProviderProps) {
  return (
    <SessionProvider {...rest}>
      <OrgProvider oldInvitationOnResend={oldInvitationOnResend}>
        {children}
      </OrgProvider>
    </SessionProvider>
  );
}
type OrgProviderProps = {
  children: ReactNode;
  /**
   * @description what happens to the old invitation when resending new invitation. By default it's deleted.
   */
  oldInvitationOnResend?: "delete" | "expire" | "keep";
};

export function OrgProvider({
  children,
  oldInvitationOnResend,
}: OrgProviderProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUser, setCurrentUser] = useState<
    OrganizationMember | null | User
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>();
  const { data } = useSession() as {
    data: {
      user?: User & {
        id: string;
      };
    };
  };
  const [activeOrganization, setActiveOrganization] = useState("");
  useEffect(() => {
    async function getData() {
      if (activeOrganization) {
        setIsLoading(true);
        const { data, error } = await getFullOrganization({
          orgId: activeOrganization,
        });
        setIsLoading(false);
        if (error) {
          setError(error.message);
          return;
        }
        setOrganization(data.organization);
        setMembers(
          data.members.map((member) => ({
            member: member,
            remove: async () => {
              const { error } = await removeMember({
                userId: member.userId,
                orgId: member.orgId,
              });
              if (error) setError(error.message);
            },
            async update(data) {
              const { error } = await updateMember({
                data: data,
                orgId: member.orgId,
                userId: member.userId,
              });
              if (error) setError(error.message);
            },
          })),
        );
        setInvitations(
          data.invitations.map((invitation) => ({
            invitation: invitation,
            revoke: async () => {
              await updateInvitation({ status: "expired" }, invitation.token);
            },
            async resend() {
              if (!data.organization) return;
              if (oldInvitationOnResend === "expire") {
                await updateInvitation({ status: "expired" }, invitation.token);
              } else if (oldInvitationOnResend === "keep") {
              } else {
                await removeInvitation(invitation.token);
              }
              await createInvitation({
                email: invitation.email,
                orgId: data.organization.slug,
                role: invitation.role,
              });
            },
          })),
        );
        setCurrentUser(data.currentUser);
      } else {
        setCurrentUser(data?.user ?? null);
      }
    }

    getData();
  }, [activeOrganization]);
  async function createOrg(organization: { name: string; slug: string }) {
    setIsCreating(true);
    const { data, error } = await createOrganization(organization);
    setIsCreating(false);
    if (error) {
      setError(error.message);
      return;
    }
    setActiveOrganization(data?.slug);
  }
  return (
    <OrgContext.Provider
      value={{
        organization,
        members,
        invitations,
        currentUser,
        setActiveOrganization,
        isLoading,
        createOrganization: createOrg,
        isCreating,
        error,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}
