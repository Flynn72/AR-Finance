import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import RecordPaymentModal from "../invoices/RecordPaymentModal";
import SendReminderModal from "../invoices/SendReminderModal";
import LogActivityModal from "../collection/LogActivityModal";
import ImportWizardModal from "../importer/ImportWizardModal";

interface AppLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AppLayout({ title, description, actions, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={title} description={description} actions={actions} />
        <main className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">{children}</main>
      </div>
      <RecordPaymentModal />
      <SendReminderModal />
      <LogActivityModal />
      <ImportWizardModal />
    </div>
  );
}
