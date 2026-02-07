import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();
  return <div>{userId ? "AUTH OK" : "NO AUTH"}</div>;
}
