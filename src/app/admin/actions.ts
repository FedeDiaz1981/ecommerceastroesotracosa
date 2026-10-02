import { getStaticAccessToken } from "@/lib/static-auth";

async function request(action: string, body: Record<string, unknown>) {
  const accessToken = await getStaticAccessToken();
  if (!accessToken) throw new Error("Inicia sesion como administrador para guardar cambios.");

  const response = await fetch("/api/admin/records.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action, ...body }),
  });
  const result = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(result.error || "No se pudo guardar el cambio.");
}

function payload(formData: FormData) {
  try {
    return JSON.parse(String(formData.get("payload_json") ?? "{}")) as Record<string, unknown>;
  } catch {
    throw new Error("Los datos del formulario no son validos.");
  }
}

export async function saveAdminRecord(formData: FormData) {
  await request("save", { table: String(formData.get("table") ?? ""), payload: payload(formData) });
}

export async function deleteAdminRecord(formData: FormData) {
  await request("delete", { table: String(formData.get("table") ?? ""), id: String(formData.get("id") ?? "") });
}

export async function deleteAdminRecords(formData: FormData) {
  await request("delete_many", {
    table: String(formData.get("table") ?? ""),
    ids: JSON.parse(String(formData.get("ids_json") ?? "[]")),
  });
}

export async function reorderAdminProducts(formData: FormData) {
  await reorderAdminTable("products", JSON.parse(String(formData.get("ids_json") ?? "[]")));
}

export async function reorderAdminTable(table: string, ids: unknown) {
  await request("reorder", {
    table,
    ids,
  });
}
