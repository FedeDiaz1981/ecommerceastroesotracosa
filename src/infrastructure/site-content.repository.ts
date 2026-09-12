import { getSiteContentSnapshot } from "@/application/catalog";

export function getSiteContent() {
  return getSiteContentSnapshot();
}
