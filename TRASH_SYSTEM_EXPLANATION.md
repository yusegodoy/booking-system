# Sistema de Papelera (Trash System) - Explicación

## ¿Cómo funciona la "papelera" en la base de datos?

### Concepto de Soft Delete (Eliminación Suave)

En este sistema, la "papelera" **NO es una carpeta física** en la base de datos. En su lugar, se implementa usando un concepto llamado **"Soft Delete"** (eliminación suave).

### ¿Qué significa esto?

1. **No se eliminan los datos físicamente**: Cuando "eliminas" una reserva, en realidad no se borra de la base de datos.

2. **Se marca como eliminada**: El sistema simplemente cambia un campo llamado `isDeleted` de `false` a `true` en el documento de la reserva.

3. **Los datos siguen ahí**: Toda la información de la reserva permanece intacta en la base de datos, solo que está "marcada" como eliminada.

### Estructura en MongoDB

```javascript
// Antes de "eliminar"
{
  _id: "reservation123",
  pickup: "Airport",
  dropoff: "Hotel",
  isDeleted: false,  // ← Visible en el calendario
  // ... otros campos
}

// Después de "eliminar"
{
  _id: "reservation123", 
  pickup: "Airport",
  dropoff: "Hotel", 
  isDeleted: true,   // ← Marcada como eliminada
  deletedAt: "2024-01-15T10:30:00Z",
  deletedBy: "admin@booking.com",
  // ... otros campos (todos intactos)
}
```

### Ventajas del Soft Delete

1. **Recuperación**: Puedes restaurar reservas eliminadas fácilmente
2. **Auditoría**: Mantienes un historial completo de todas las reservas
3. **Seguridad**: No hay pérdida accidental de datos
4. **Análisis**: Puedes analizar reservas "eliminadas" si es necesario

### Cómo funciona en la interfaz

1. **Calendario principal**: Solo muestra reservas con `isDeleted: false`
2. **Pestaña "Trash"**: Muestra reservas con `isDeleted: true`
3. **Restaurar**: Cambia `isDeleted` de `true` a `false`
4. **Eliminación permanente**: Solo entonces se borra físicamente de la base de datos

### Ubicación en la base de datos

- **Colección**: `bookings` (la misma colección que las reservas activas)
- **Filtro**: `{ isDeleted: true }` para ver la papelera
- **Filtro**: `{ isDeleted: { $ne: true } }` para ver reservas activas

### Comandos de ejemplo

```javascript
// Ver todas las reservas activas
db.bookings.find({ isDeleted: { $ne: true } })

// Ver todas las reservas en la papelera  
db.bookings.find({ isDeleted: true })

// Restaurar una reserva
db.bookings.updateOne(
  { _id: "reservation123" },
  { $set: { isDeleted: false, deletedAt: null, deletedBy: null } }
)
```

## Resumen

La "papelera" es una **funcionalidad lógica**, no física. Los datos permanecen en la misma tabla/colección, pero se filtran según el valor del campo `isDeleted`. Esto proporciona mayor seguridad y flexibilidad que la eliminación física tradicional.
