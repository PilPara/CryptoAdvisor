import { currentUser } from "@clerk/nextjs/server";

export default async function TestAuth() {
  const user = await currentUser();

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Auth test</h1>
      <pre className="mt-4">{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
