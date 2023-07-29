import { ModeToggle } from "@/components/dark-mode-toogle";
import { EmptyPlaceholder } from "@/components/empty-placeholder";
import { Auth } from "@/components/sign-in";

/**
 * on the making reference the root page dir for now
 */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col mx-40 gap-2">
      <div className="flex justify-between mt-10 items-center">
        <div className="grid gap-1">
          <h1 className="font-heading text-3xl md:text-4xl">Welcome</h1>
          <p className="text-muted-foreground text-lg">
            This is a demo app for next-org. Organization/team support for
            next-auth. Start by sign-in.
          </p>
        </div>
        <div className=" flex gap-2 items-center">
          <ModeToggle />
          <Auth />
        </div>
      </div>
      <EmptyPlaceholder className="">
        <EmptyPlaceholder.Icon name="users" />
        <EmptyPlaceholder.Title>No Team Added</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          You haven&apos;t created any team yet. Start creating team
        </EmptyPlaceholder.Description>
       </EmptyPlaceholder>
    </main>
  );
}
