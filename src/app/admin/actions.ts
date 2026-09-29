function getTableLabel(formData: FormData) {
  return String(formData.get("table") ?? "registro");
}

function notifyPendingBackend(action: string, table: string) {
  window.alert(`${action} de ${table}: pendiente de conectar al backend PHP.`);
}

export async function saveAdminRecord(formData: FormData) {
  notifyPendingBackend("Guardado", getTableLabel(formData));
}

export async function deleteAdminRecord(formData: FormData) {
  notifyPendingBackend("Borrado", getTableLabel(formData));
}

export async function deleteAdminRecords(formData: FormData) {
  notifyPendingBackend("Borrado masivo", getTableLabel(formData));
}

export async function reorderAdminProducts(_formData: FormData) {
  // La versión estática conserva el orden en pantalla; la versión Next lo persiste en PostgreSQL.
}
