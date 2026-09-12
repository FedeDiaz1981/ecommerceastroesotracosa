# Es otra cosa - Astro

Migracion visual estatica desde el proyecto Next aprobado en `../storev2`.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Alcance actual

- Rutas publicas migradas: `/`, `/galeria`, `/busqueda`, `/carrito`, `/mis-reservas`, `/producto/[sku]`, `/compra-colectiva/[id]`, `/admin`.
- El build genera HTML estatico usando `src/data/site-content.json` como snapshot del contenido aprobado.
- Los componentes React originales se mantienen como islands para conservar carruseles, modales, carrito, transiciones e interacciones visuales.
- El login intenta primero usar `/api/auth/login.php`. Si ese endpoint no existe, en local/estatico usa Supabase con la anon key publica y valida el perfil contra el snapshot.
- El backend dinamico queda pendiente para PHP: admin, uploads, importacion Excel, PDF/Excel de pedido y reservas.

## Actualizar contenido aprobado

El snapshot actual fue exportado desde la DB local del proyecto Next. Si el cliente cambia contenido en el admin original, hay que volver a exportar `site-content.json` antes de hacer deploy estatico.
