"use client";
import { useState } from "react";
import { Icons } from "./icons";
import { AlertDialog } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { signIn, signOut, useSession } from "next-auth/react";
import { Icon } from "@radix-ui/react-select";

export const SignIn = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      onClick={async () => {
        setIsLoading(true);
        await signIn("github", {
          redirect: false,
          callbackUrl: "/",
        });
        setIsLoading(false);
      }}
    >
      {isLoading ? (
        <Icons.spinner className=" animate-spin" />
      ) : (
        <div className=" gap-2 flex">
          <Icons.gitHub className=" w-5 h-5" />
          <p>Login with github</p>
        </div>
      )}
    </Button>
  );
};

export const SignOut = () => {
  return <Button onClick={() => signOut()}>Logout</Button>;
};

export const Auth = () => {
  const session = useSession();
  return session.data ? <SignOut /> : <SignIn />;
};
