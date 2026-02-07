import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold ">AI Crypto Advisor</h1>
      <p className="mt-2">
        Personalized crypto insights based on your preferences.
      </p>
    </div>
  );
}
