import { hqAppPath } from "@/lib/hq/auth-server";
import AutoRxNavigation from "./AutoRxNavigation";

export default async function AutoRxHqLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const paths = {
    executive: await hqAppPath(),
    transition: await hqAppPath("companies/autorx/transition"),
    plan: await hqAppPath("companies/autorx/transition/plan-90"),
    absence: await hqAppPath("companies/autorx/transition/absence-tests"),
    review: await hqAppPath("companies/autorx/review"),
  };

  return (
    <div className="pb-24">
      {children}
      <AutoRxNavigation paths={paths} />
    </div>
  );
}
