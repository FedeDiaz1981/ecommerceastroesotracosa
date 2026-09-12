import type { AdminOverview } from "@/application/admin";
import type { ProductItem, SiteContentDocument } from "@/domain/site-content";

export type AdminTableKey =
  | "site_content_meta"
  | "header_search_scopes"
  | "header_sections"
  | "header_groups"
  | "header_group_items"
  | "hero_slides"
  | "banners"
  | "packs"
  | "product_lots"
  | "product_lot_reservations"
  | "categories"
  | "brands"
  | "payment_methods"
  | "fabrics"
  | "users"
  | "products"
  | "product_related_products";

export type AdminFieldKind =
  | "text"
  | "number"
  | "boolean"
  | "textarea"
  | "pack_products"
  | "multiselect"
  | "file"
  | "image_gallery"
  | "select"
  | "password"
  | "template_rows"
  | "fabric_variants"
  | "product_measures"
  | "product_installments"
  | "product_related_products";

export interface AdminFieldOption {
  value: string;
  label: string;
}

export interface AdminFieldDefinition {
  key: string;
  label: string;
  kind: AdminFieldKind;
  required?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  helper?: string;
  options?: AdminFieldOption[];
}

export interface AdminTableDefinition {
  key: AdminTableKey;
  label: string;
  description: string;
  idField: string;
  rowLabelField: string;
  rows: unknown[];
  columns: {
    key: string;
    label: string;
  }[];
  fields: AdminFieldDefinition[];
}

export interface AdminCrudViewModel {
  overview: AdminOverview;
  tables: AdminTableDefinition[];
  productSelectionRows: ProductItem[];
  orderExcelTemplates: {
    id: number;
    template_key: string;
    audience: "guest" | "member";
    version: number;
    file_name: string;
    active: boolean;
    updated_at: string;
  }[];
}

const tableOrder: AdminTableKey[] = [
  "products",
  "product_related_products",
  "product_lots",
  "product_lot_reservations",
  "packs",
  "brands",
  "payment_methods",
  "fabrics",
  "categories",
  "users",
  "hero_slides",
  "banners",
];

function booleanField(key: string, label: string, helper?: string, hidden = false): AdminFieldDefinition {
  return { key, label, kind: "boolean", helper, hidden };
}

function textField(
  key: string,
  label: string,
  required = false,
  helper?: string,
  readonly = false,
  hidden = false,
): AdminFieldDefinition {
  return { key, label, kind: "text", required, helper, readonly, hidden };
}

function passwordField(
  key: string,
  label: string,
  required = false,
  helper?: string,
  readonly = false,
  hidden = false,
): AdminFieldDefinition {
  return { key, label, kind: "password", required, helper, readonly, hidden };
}

function numberField(
  key: string,
  label: string,
  required = false,
  helper?: string,
  readonly = false,
  hidden = false,
): AdminFieldDefinition {
  return { key, label, kind: "number", required, helper, readonly, hidden };
}

function textareaField(key: string, label: string, required = false, helper?: string, hidden = false): AdminFieldDefinition {
  return { key, label, kind: "textarea", required, helper, hidden };
}

function fileField(key: string, label: string, required = false, helper?: string, hidden = false): AdminFieldDefinition {
  return { key, label, kind: "file", required, helper, hidden };
}

function imageGalleryField(
  key: string,
  label: string,
  helper?: string,
  hidden = false,
): AdminFieldDefinition {
  return { key, label, kind: "image_gallery", helper, hidden };
}

function selectField(
  key: string,
  label: string,
  options: AdminFieldOption[],
  required = false,
  helper?: string,
  readonly = false,
  hidden = false,
): AdminFieldDefinition {
  return { key, label, kind: "select", required, helper, readonly, hidden, options };
}

function packProductsField(key: string, label: string, helper?: string): AdminFieldDefinition {
  return { key, label, kind: "pack_products", helper };
}

function templateRowsField(key: string, label: string, helper?: string): AdminFieldDefinition {
  return { key, label, kind: "template_rows", helper };
}

function fabricVariantsField(
  key: string,
  label: string,
  options: AdminFieldOption[],
  helper?: string,
): AdminFieldDefinition {
  return { key, label, kind: "fabric_variants", helper, options };
}

function productMeasuresField(key: string, label: string, helper?: string): AdminFieldDefinition {
  return { key, label, kind: "product_measures", helper };
}

function productInstallmentsField(key: string, label: string, helper?: string): AdminFieldDefinition {
  return { key, label, kind: "product_installments", helper };
}

function multiselectField(
  key: string,
  label: string,
  options: AdminFieldOption[],
  helper?: string,
  hidden = false,
): AdminFieldDefinition {
  return { key, label, kind: "multiselect", helper, hidden, options };
}

export function getAdminTableDefinitions(content: SiteContentDocument): AdminTableDefinition[] {
  const packRows = (content.packs ?? []).map((pack) => ({
    ...pack,
    items_count: pack.items.length,
    items_json: JSON.stringify(
      pack.items.map((item, index) => ({
        productId: item.productId,
        quantity: item.quantity,
        order: index + 1,
      })),
    ),
  }));
  const visibleCategoryOptions = (content.categories ?? [])
    .filter((category) => category.visible)
    .sort((left, right) => left.name.localeCompare(right.name, "es", { sensitivity: "base" }))
    .map((category) => ({
      value: String(category.id),
      label: category.name,
    }));
  const fabricOptions = (content.fabrics ?? [])
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, "es", { sensitivity: "base" }))
    .map((fabric) => ({
      value: String(fabric.id),
      label: fabric.name,
    }));
  const productOptions = (content.products ?? [])
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, "es", { sensitivity: "base" }))
    .map((product) => ({
      value: String(product.id),
      label: `${product.sku} · ${product.name}`,
    }));

  return [
    {
      key: "products",
      label: "Productos",
      description: "Catalogo principal de productos y precios.",
      idField: "id",
      rowLabelField: "name",
      rows: (content.products ?? []).map((product) => ({
        ...product,
        active: String(product.status ?? "").toLowerCase() !== "inactive",
      })),
      columns: [
        { key: "id", label: "ID" },
        { key: "sku", label: "SKU" },
        { key: "name", label: "Nombre" },
        { key: "brand", label: "Marca" },
        { key: "publicPrice", label: "Precio" },
        { key: "featuredPriority", label: "Prioridad" },
        { key: "featured", label: "Destacado" },
        { key: "active", label: "Activo" },
        { key: "viewsCount", label: "Vistas" },
        { key: "salesCount", label: "Ventas" },
      ],
      fields: [
        numberField("id", "ID", true, "Uso interno", true, true),
        textField("sku", "SKU", true, "Uso interno", true, true),
        textField("name", "Nombre", true),
        textareaField("detail", "Detalle", true),
        multiselectField("categoryIds", "Categorias", visibleCategoryOptions, "Elegi una o mas categorias visibles."),
        numberField("price", "Precio", true),
        productMeasuresField(
          "measures",
          "Medidas y precios",
          "Cargá una o más medidas. Cada medida puede tener su propio precio.",
        ),
        productInstallmentsField(
          "installments",
          "Cuotas disponibles",
          "Agregá cada opción e indicá cuáles son sin interés.",
        ),
        fabricVariantsField(
          "fabricVariants",
          "Telas",
          fabricOptions,
          "Marcá en qué telas está disponible este producto y cargá una foto para cada una.",
        ),
        booleanField("onlyMembers", "Sólo miembros", "Si está activo, sólo lo verán usuarios logueados."),
        imageGalleryField("images", "Imagenes", "Subí hasta 5 fotos del producto."),
        textField("brand", "Marca", false, "Uso interno", true, true),
        textField("presentation", "Presentacion", true, "Uso interno", true, true),
        textField("status", "Estado", true, "Uso interno", true, true),
        booleanField("featured", "Destacado"),
        numberField("featuredPriority", "Prioridad destacada", false, "Más bajo = antes en el carrusel."),
        booleanField("active", "Activo"),
        numberField("categoryId", "ID de categoría", true, "Uso interno", true, true),
        textField("categoryName", "Nombre de categoría", true, "Uso interno", true, true),
        numberField("stock", "Stock", false, "Uso interno", true, true),
        numberField("viewsCount", "Vistas", false, "Uso interno", true, true),
        numberField("salesCount", "Ventas", false, "Uso interno", true, true),
        textareaField("description", "Descripcion", false, "Uso interno", true),
        textField("sourceSection", "Seccion origen", false, "Uso interno", true, true),
        templateRowsField(
          "templateRowMap",
          "Fila por template",
          "Uso interno. Completa la fila exacta a marcar por cada plantilla guardada.",
        ),
      ],
    },
    {
      key: "product_related_products",
      label: "Productos relacionados",
      description: "Configurá qué productos sugerir como complementos en la tienda.",
      idField: "productId",
      rowLabelField: "productLabel",
      rows: (content.productRelations ?? []).map((relation) => ({
        productId: relation.productId,
        productLabel: productOptions.find((option) => Number(option.value) === relation.productId)?.label ?? `Producto ${relation.productId}`,
        relatedProductIds: JSON.stringify(relation.relatedProductIds),
        relatedProductLabels: relation.relatedProductIds
          .map((id) => productOptions.find((option) => Number(option.value) === id)?.label ?? `Producto ${id}`)
          .join(", "),
      })),
      columns: [
        { key: "productLabel", label: "Producto" },
        { key: "relatedProductLabels", label: "Productos sugeridos" },
      ],
      fields: [
        selectField("productId", "Producto principal", productOptions, true),
        multiselectField("relatedProductIds", "Productos relacionados", productOptions, "Elegí uno o más productos complementarios."),
      ],
    },
    {
      key: "product_lots",
      label: "Lotes",
      description: "Ofertas por lote con cupos limitados y precio especial.",
      idField: "id",
      rowLabelField: "title",
      rows: (content.productLots ?? []).map((lot) => ({
        ...lot,
        productLabel: `${lot.productSku ?? lot.productId} · ${lot.productName ?? "Sin producto"}`,
        fabricLabel: lot.fixedFabricName || (lot.fixedFabricId ? `Tela ${lot.fixedFabricId}` : "Sin tela fija"),
        measureLabel: lot.fixedMeasureLabel || (lot.fixedMeasureId ? `Medida ${lot.fixedMeasureId}` : "Sin medida fija"),
        imageModeLabel: lot.useFabricImage ? "Desde tela" : "Imagen propia",
        availableUnits: Math.max(0, lot.availableUnits),
      })),
      columns: [
        { key: "id", label: "ID" },
        { key: "productLabel", label: "Producto" },
        { key: "fabricLabel", label: "Tela fija" },
        { key: "measureLabel", label: "Medida fija" },
        { key: "title", label: "Titulo" },
        { key: "lotUnitPrice", label: "Precio lote" },
        { key: "regularUnitPrice", label: "Precio normal" },
        { key: "totalUnits", label: "Unidades" },
        { key: "reservedUnits", label: "Reservadas" },
        { key: "availableUnits", label: "Disponibles" },
        { key: "imageModeLabel", label: "Imagen" },
        { key: "status", label: "Estado" },
      ],
      fields: [
        numberField("id", "ID", true, "Se genera automaticamente.", true, true),
        selectField(
          "productId",
          "Producto",
          productOptions,
          true,
          "Elegí el producto al que pertenece este lote.",
        ),
        selectField("fixedFabricId", "Tela fija", [], true, "Elegí la tela específica de ese producto."),
        selectField("fixedMeasureId", "Medida fija", [], true, "Elegí la medida específica de ese producto."),
        booleanField(
          "useFabricImage",
          "Usar imagen de la tela",
          "Si está activo, se reutiliza la imagen ya cargada en la tela seleccionada.",
        ),
        textField("title", "Titulo", true),
        textareaField("description", "Descripcion", true),
        numberField("regularUnitPrice", "Precio normal", true),
        numberField("lotUnitPrice", "Precio lote", true, "Precio especial por unidad."),
        numberField("totalUnits", "Unidades totales", true),
        numberField("reservedUnits", "Unidades reservadas", false, "Se actualiza con las reservas.", true, true),
        selectField(
          "status",
          "Estado",
          [
            { value: "draft", label: "Borrador" },
            { value: "open", label: "Abierto" },
            { value: "sold_out", label: "Completo" },
            { value: "in_production", label: "En producción" },
            { value: "closed", label: "Cerrado" },
          ],
          true,
        ),
        booleanField("onlyMembers", "Sólo miembros", "Si está activo, sólo lo verán usuarios logueados."),
        fileField("image", "Imagen", false, "Se usa sólo cuando no reutilizas la imagen de la tela."),
      ],
    },
    {
      key: "product_lot_reservations",
      label: "Reservas de lote",
      description: "Reservas realizadas por usuarios sobre lotes disponibles.",
      idField: "id",
      rowLabelField: "lotTitle",
      rows: (content.productLotReservations ?? []).map((reservation) => ({
        ...reservation,
        lotTitle: reservation.lotTitle ?? `Lote ${reservation.lotId}`,
        userLabel: reservation.userName || reservation.userEmail || `Usuario ${reservation.userId}`,
        productLabel: `${reservation.productSku ?? reservation.productId ?? "SKU"} · ${reservation.productName ?? "Producto"}`,
        statusLabel: reservation.status,
        updatedLabel: reservation.updatedAt ?? reservation.createdAt ?? "",
      })),
      columns: [
        { key: "id", label: "ID" },
        { key: "lotTitle", label: "Lote" },
        { key: "userLabel", label: "Usuario" },
        { key: "quantity", label: "Cant." },
        { key: "unitPrice", label: "Precio unit." },
        { key: "totalPrice", label: "Total" },
        { key: "statusLabel", label: "Estado" },
        { key: "updatedLabel", label: "Actualizado" },
      ],
      fields: [
        numberField("id", "ID", true, "Uso interno", true, true),
        textField("lotTitle", "Lote", true, "Solo lectura", true),
        textField("productLabel", "Producto", true, "Solo lectura", true),
        textField("userLabel", "Usuario", true, "Solo lectura", true),
        numberField("quantity", "Cantidad", true, "Solo lectura", true),
        numberField("unitPrice", "Precio unitario", true, "Solo lectura", true),
        numberField("totalPrice", "Total", true, "Solo lectura", true),
        selectField(
          "status",
          "Estado",
          [
            { value: "reserved", label: "Reservada" },
            { value: "confirmed", label: "Confirmada" },
            { value: "cancelled", label: "Anulada" },
          ],
          true,
        ),
        textareaField("notes", "Notas", false),
        textareaField("adminNote", "Nota admin", false),
        textareaField("cancelReason", "Motivo de anulación", false),
        textField("confirmedAt", "Confirmada el", false, "Solo lectura", true),
        textField("cancelledAt", "Anulada el", false, "Solo lectura", true),
        textField("createdAt", "Creada el", false, "Solo lectura", true),
        textField("updatedAt", "Actualizada el", false, "Solo lectura", true),
      ],
    },
    {
      key: "brands",
      label: "Marcas",
      description: "Identidad comercial y miniaturas.",
      idField: "id",
      rowLabelField: "name",
      rows: content.brands,
      columns: [
        { key: "id", label: "ID" },
        { key: "code", label: "Codigo" },
        { key: "name", label: "Nombre" },
        { key: "active", label: "Activa" },
      ],
      fields: [
        textField("id", "ID", true, "Se genera automaticamente.", true),
        textField("code", "Codigo", true, "Se genera automaticamente.", true, true),
        textField("name", "Nombre", true),
        fileField("image", "Imagen", false, "Subí el logo o imagen de la marca."),
        booleanField("active", "Activa"),
      ],
    },
    {
      key: "payment_methods",
      label: "Medios de pago",
      description: "Tarjetas, transferencias y métodos visibles para el cliente.",
      idField: "id",
      rowLabelField: "name",
      rows: (content.paymentMethods ?? []).map((method) => ({
        ...method,
        logoLabel: method.logo ? "Logo cargado" : "Sin logo",
      })),
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Nombre" },
        { key: "logoLabel", label: "Logo" },
        { key: "order", label: "Orden" },
        { key: "active", label: "Activo" },
      ],
      fields: [
        numberField("id", "ID", true, "Se genera automaticamente.", true, true),
        textField("name", "Nombre", true),
        fileField("logo", "Logo", false, "Subí el logo del medio de pago."),
        numberField("order", "Orden", false, "Más bajo = antes en la lista."),
        booleanField("active", "Activo"),
      ],
    },
    {
      key: "fabrics",
      label: "Telas",
      description: "Catálogo de telas con imagen de referencia.",
      idField: "id",
      rowLabelField: "name",
      rows: content.fabrics ?? [],
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Nombre" },
      ],
      fields: [
        numberField("id", "ID", true, "Se genera automaticamente.", true, true),
        textField("name", "Nombre", true),
        fileField("image", "Imagen", false, "Subí la imagen de referencia de la tela."),
      ],
    },
    {
      key: "categories",
      label: "Categorías",
      description: "Categorías visibles del catálogo.",
      idField: "id",
      rowLabelField: "name",
      rows: content.categories ?? [],
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Nombre" },
        { key: "slug", label: "Apodo" },
        { key: "visible", label: "Visible" },
        { key: "homeMenu", label: "Menú" },
      ],
      fields: [
        numberField("id", "ID", true, "Se genera automaticamente.", true),
        textField("name", "Nombre", true),
        textField("slug", "Apodo", true, "Se genera automaticamente.", true),
        booleanField("visible", "Visible"),
        booleanField("homeMenu", "Mostrar en menú"),
        textField("icon", "Icono", false, "Se genera automaticamente.", true, true),
      ],
    },
    {
      key: "users",
      label: "Usuarios",
      description: "Acceso, roles y permisos de precios.",
      idField: "id",
      rowLabelField: "name",
      rows: content.users ?? [],
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Nombre" },
        { key: "email", label: "Correo" },
        { key: "role", label: "Rol" },
        { key: "active", label: "Activo" },
      ],
      fields: [
        numberField("id", "ID", true, "Se genera automaticamente.", true, true),
        textField("name", "Nombre", true),
        textField("email", "Correo", true),
        passwordField("password", "Contraseña", false, "Definila al crear la cuenta. En edición es opcional."),
        selectField(
          "role",
          "Rol",
          [
            { value: "Administrador", label: "Administrador" },
            { value: "Cliente", label: "Cliente" },
          ],
          true,
        ),
        booleanField("canSeePrices", "Ve precios"),
        booleanField("active", "Activo"),
      ],
    },
    {
      key: "hero_slides",
      label: "Carrusel principal",
      description: "Elementos del carrusel principal.",
      idField: "id",
      rowLabelField: "title",
      rows: content.heroSlides,
      columns: [
        { key: "id", label: "ID" },
        { key: "title", label: "Titulo" },
        { key: "badge", label: "Etiqueta" },
        { key: "active", label: "Activo" },
      ],
      fields: [
        numberField("id", "ID", true),
        numberField("order", "Orden", true),
        textField("title", "Titulo", true),
        textareaField("subtitle", "Subtitulo", true),
        textField("badge", "Etiqueta", true),
        fileField("image", "Imagen", true, "Subí la imagen principal del carrusel."),
        fileField("imageMobile", "Imagen movil", false, "Subí la versión para mobile."),
        textField("link", "Enlace", true),
        booleanField("active", "Activo"),
        booleanField("homeSpotlight", "Destacado en inicio"),
      ],
    },
    {
      key: "banners",
      label: "Banners",
      description: "Mensajes destacados del inicio.",
      idField: "id",
      rowLabelField: "text",
      rows: content.banners,
      columns: [
        { key: "id", label: "ID" },
        { key: "text", label: "Texto" },
        { key: "order", label: "Orden" },
        { key: "active", label: "Activo" },
      ],
      fields: [
        numberField("id", "ID", true),
        textareaField("text", "Texto", true),
        numberField("order", "Orden", true),
        booleanField("active", "Activo"),
      ],
    },
    {
      key: "packs",
      label: "Promociones",
      description: "Paquetes de productos con precio propio.",
      idField: "id",
      rowLabelField: "title",
      rows: packRows,
      columns: [
        { key: "id", label: "ID" },
        { key: "apodo", label: "Apodo" },
        { key: "title", label: "Título" },
        { key: "category", label: "Categoría" },
        { key: "publicPrice", label: "Precio" },
        { key: "items_count", label: "Productos" },
        { key: "active", label: "Activo" },
      ],
      fields: [
        numberField("id", "ID", true, "Se usa al editar. En alta se calcula solo.", true, true),
        textField("apodo", "Apodo", true, "Identificador amigable para el equipo.", true, true),
        textField("title", "Título", true),
        textareaField("description", "Descripción", true),
        textField("category", "Categoría", true),
        numberField("publicPrice", "Precio final", true),
        fileField("image", "Imagen", false, "Subí una imagen de portada para la promoción."),
        booleanField("active", "Activo"),
        booleanField("featured", "Destacado"),
        numberField("order", "Orden"),
        packProductsField("items_json", "Productos del pack", "Buscá y seleccioná los productos que integran la promoción."),
      ],
    },
    {
      key: "header_search_scopes",
      label: "Busquedas del encabezado",
      description: "Busquedas del encabezado.",
      idField: "id",
      rowLabelField: "label",
      rows: content.headerNavigation?.searchScopes ?? [],
      columns: [
        { key: "id", label: "ID" },
        { key: "label", label: "Etiqueta" },
        { key: "href", label: "Enlace" },
      ],
      fields: [
        textField("id", "ID", true),
        textField("label", "Etiqueta", true),
        textField("href", "Enlace", true),
      ],
    },
    {
      key: "header_sections",
      label: "Secciones del encabezado",
      description: "Secciones principales de navegacion.",
      idField: "id",
      rowLabelField: "label",
      rows: content.headerNavigation?.sections ?? [],
      columns: [
        { key: "id", label: "ID" },
        { key: "label", label: "Etiqueta" },
        { key: "href", label: "Enlace" },
      ],
      fields: [
        textField("id", "ID", true),
        textField("label", "Etiqueta", true),
        textField("icon", "Icono", true),
        textField("href", "Enlace", true),
      ],
    },
    {
      key: "header_groups",
      label: "Grupos del encabezado",
      description: "Grupos por seccion del menu.",
      idField: "id",
      rowLabelField: "label",
      rows:
        content.headerNavigation?.sections.flatMap((section) =>
          section.groups.map((group) => ({
            id: `${section.id}:${group.id}`,
            section_id: section.id,
            label: group.label,
            href: group.href,
          })),
        ) ?? [],
      columns: [
        { key: "id", label: "ID" },
        { key: "section_id", label: "Seccion" },
        { key: "label", label: "Etiqueta" },
        { key: "href", label: "Enlace" },
      ],
      fields: [
        textField("id", "ID", true),
        textField("section_id", "Seccion", true),
        textField("label", "Etiqueta", true),
        textField("href", "Enlace", true),
      ],
    },
    {
      key: "header_group_items",
      label: "Items del encabezado",
      description: "Items dentro de cada grupo.",
      idField: "id",
      rowLabelField: "label",
      rows:
        content.headerNavigation?.sections.flatMap((section) =>
          section.groups.flatMap((group) =>
            group.items.map((item) => ({
              id: `${section.id}:${group.id}:${item.id}`,
              group_id: `${section.id}:${group.id}`,
              label: item.label,
              href: item.href,
            })),
          ),
        ) ?? [],
      columns: [
        { key: "id", label: "ID" },
        { key: "group_id", label: "Grupo" },
        { key: "label", label: "Etiqueta" },
        { key: "href", label: "Enlace" },
      ],
      fields: [
        textField("id", "ID", true),
        textField("group_id", "Grupo", true),
        textField("label", "Etiqueta", true),
        textField("href", "Enlace", true),
      ],
    },
  ];
}

export function getAdminTableDefinition(content: SiteContentDocument, key: AdminTableKey): AdminTableDefinition | null {
  return getAdminTableDefinitions(content).find((table) => table.key === key) ?? null;
}

export function buildAdminCrudViewModel(
  content: SiteContentDocument,
  overview: AdminOverview,
  orderExcelTemplates: AdminCrudViewModel["orderExcelTemplates"] = [],
): AdminCrudViewModel {
  const tables = getAdminTableDefinitions(content);
  const orderedTables = tableOrder
    .map((key) => tables.find((table) => table.key === key))
    .filter((table): table is AdminTableDefinition => Boolean(table));
  const productSelectionRows = [...(content.products ?? [])]
    .filter((product) => String(product.status ?? "").toLowerCase() !== "inactive")
    .sort((left, right) => left.name.localeCompare(right.name, "es", { sensitivity: "base" }));

  return {
    overview,
    tables: orderedTables,
    productSelectionRows,
    orderExcelTemplates,
  };
}

