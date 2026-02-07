"use client";

export default function OnboardingPage() {
  async function submit() {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assets: ["BTC, ETH"],
        investorType: "holder",
        contentTypes: ["news", "prices"],
      }),
    });

    window.location.href = "/dashboard";
  }
  return (
    <div>
      <h1>Onboarding</h1>
      <p>Preferences form goes here</p>
      <button onClick={submit}>Finish onboarding</button>
    </div>
  );
}
