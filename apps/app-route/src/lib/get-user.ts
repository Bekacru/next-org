import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export const getCurrentUser = async () => {
  return await getServerSession(authOptions);
};
