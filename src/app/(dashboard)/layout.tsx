import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <DashboardWrapper>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </DashboardWrapper>
    </div>
  );
}
