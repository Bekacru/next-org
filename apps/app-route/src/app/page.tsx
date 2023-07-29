"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganization } from "@next-org/react";
import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [orgName, setOrgName] = useState("");
  const {
    organization,
    setActiveOrganization,
    createOrganization,
    isCreating,
    error,
    members,
    isLoading,
  } = useOrganization();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className=" m-auto flex gap-2 items-center flex-col justify-center">
        <div className=" flex items-center gap-2">
        <Card>
          <CardHeader>
            <CardTitle>Get Organization</CardTitle>
          </CardHeader>

          <CardContent>
            <Input
              placeholder="Org Slug"
              onChange={(e) => setOrgName(e.currentTarget.value)}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={() => setActiveOrganization(orgName)}>
              {isLoading ? "getting..." : "get"}
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{organization?.name}/</CardTitle>
            {organization?.slug}
            <CardContent>
              {members.map((member) => (
                <div
                  key={member.member.id}
                  className=" flex items-center gap-2"
                >
                  <p>{member.member.name}</p>
                  <Button onClick={() => member.remove()}>remove member</Button>
                </div>
              ))}
            </CardContent>
          </CardHeader>
        </Card>
        </div>
    
        <Card className=" gap-2">
          <CardHeader>
            <CardTitle>Create Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
            <Label className=" text-red-600">{error}</Label>
            </div>
    
            <Label>Name</Label>
            <Input
              onChange={(e) => setName(e.currentTarget.value)}
              value={name}
            />
            <Label>Slug</Label>
            <Input
              onChange={(e) => setSlug(e.currentTarget.value)}
              value={slug}
            />
          </CardContent>
          <CardFooter>
            <p>{}</p>
            <Button
              onClick={async () =>
                await createOrganization({
                  name,
                  slug,
                })
              }
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
