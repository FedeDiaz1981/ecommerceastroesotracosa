import { getAdminPanelViewModel } from "@/application/admin";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { useViewer } from "@/components/auth/viewer-provider";

export default function AdminPageApp() {
  const viewer = useViewer();
  const model = getAdminPanelViewModel();

  return <AdminWorkspace model={model} viewerName={viewer?.name ?? "Administrador"} />;
}
