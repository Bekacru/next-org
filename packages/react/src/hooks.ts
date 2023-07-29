"use client";
import { useContext, useEffect, useState } from "react";
import {
  createMember,
  createOrganization,
  getInvitation,
  listOrganizations,
  updateInvitation,
} from "./fetch-client";
import { Organization, OrganizationInvitation } from "@next-org/types/models";
import { SessionContext, useSession } from "next-auth/react";
import { OrgContext } from "./context";

/**
 * @description A React Context Hook that provides the full active organization data for the current user. And a function to set the active organization.
 */
export const useOrganization = () => {
  if (!OrgContext) {
    throw new Error("React Context is unavailable in Server Components");
  }
  return useContext(OrgContext);
};

type InvitationReturnType = {
  isLoaded: boolean;
  /**
   * @description Accept the invitation and join the organization. If the user is not logged in, they will be redirected to the login page.
   */
  accept: () => Promise<void>;
  reject: () => Promise<void>;
  revoke: () => Promise<void>;
  invitation: OrganizationInvitation | null;
  isRegistered: boolean;
  isLoggedIn: boolean;
};

export const useInvitation = (token: string): InvitationReturnType => {
  if (!SessionContext || !OrgContext) {
    throw new Error("React Context is unavailable in Server Components");
  }
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState<{
    invitation: OrganizationInvitation | null;
    isRegistered: boolean;
    isLoggedIn: boolean;
  }>({
    invitation: null,
    isRegistered: false,
    isLoggedIn: false,
  });
  const { data: session } = useSession();
  useEffect(() => {
    async function getData() {
      const invitation = await getInvitation(token);
      setData({
        invitation,
        isRegistered: invitation.isRegistered,
        isLoggedIn: session ? session?.user?.email === invitation.email : false,
      });
      setIsLoaded(true);
    }
    getData();
  }, [token]);

  return {
    ...data,
    isLoaded,
    accept: async () => {
      await createMember(undefined, token);
    },
    reject: async () => {
      await updateInvitation({ status: "rejected" }, token);
    },
    revoke: async () => {
      await updateInvitation({ status: "expired" }, token);
    },
  };
};

export const useOrganizationList = () => {
  if (!OrgContext) {
    throw new Error("React Context is unavailable in Server Components");
  }
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState<Organization[]>();
  useEffect(() => {
    async function getData() {
      const { data, error } = await listOrganizations();
      if (error) return;
      setData(data);
      setIsLoaded(true);
    }
    getData();
  }, []);
  return {
    isLoaded,
    organizations: data,
    createOrganization,
  };
};
