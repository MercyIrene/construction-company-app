import { requireStaff } from "@/lib/auth";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff();
  return <>{children}</>;
}
