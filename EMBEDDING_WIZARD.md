# Cómo Incrustar el Wizard en tu Sitio Web

## Instrucciones para mostrar el wizard en el contenedor "Quote and book now"

### ✅ Cambios Realizados

He modificado el código para que el wizard pueda incrustarse en un contenedor específico. El código ahora busca automáticamente contenedores con estos IDs en este orden:
1. `#quote-and-book-now`
2. `#wizard-container`
3. `#booking-wizard`
4. `#root` (fallback para la app standalone)

### Opción 1: Usar un contenedor con ID específico (Recomendado)

En tu sitio web `https://airportshuttletpa.com`, agrega un contenedor con uno de estos IDs:

```html
<!-- Opción 1: Usar el ID "quote-and-book-now" (RECOMENDADO) -->
<section class="quote-section">
  <div class="container">
    <h2>Quote and book now</h2>
    <div id="quote-and-book-now" style="width: 100%; min-height: 600px; position: relative;"></div>
  </div>
</section>

<!-- Opción 2: Usar el ID "wizard-container" -->
<div id="wizard-container" style="width: 100%; min-height: 600px; position: relative;"></div>

<!-- Opción 3: Usar el ID "booking-wizard" -->
<div id="booking-wizard" style="width: 100%; min-height: 600px; position: relative;"></div>
```

### Opción 2: Integración con iframe (Más fácil, recomendado para evitar conflictos)

Si prefieres evitar posibles conflictos de CSS/JS, usa un iframe:

```html
<section class="quote-section">
  <div class="container">
    <h2>Quote and book now</h2>
    <div style="width: 100%; min-height: 800px; position: relative;">
      <iframe 
        src="https://booking.airportshuttletpa.com" 
        style="width: 100%; height: 100%; border: none; min-height: 800px;"
        title="Booking Wizard"
        allow="geolocation"
      ></iframe>
    </div>
  </div>
</section>
```

### Opción 3: Integración completa (Requiere build y deploy)

1. **Compila el proyecto React:**
```bash
npm run build
```

2. **Copia los archivos de `build/static` a tu servidor web**

3. **Agrega el contenedor y carga los scripts en tu HTML:**
```html
<!DOCTYPE html>
<html>
<head>
  <!-- ... otros head tags ... -->
  <!-- Cargar CSS de React (reemplaza [hash] con el hash real del archivo) -->
  <link rel="stylesheet" href="/static/css/main.[hash].css">
</head>
<body>
  <!-- Tu contenido del sitio web -->
  
  <section class="quote-section">
    <div class="container">
      <h2>Quote and book now</h2>
      <!-- El contenedor donde se montará el wizard -->
      <div id="quote-and-book-now" style="width: 100%; min-height: 800px; position: relative;"></div>
    </div>
  </section>
  
  <!-- Scripts de React al final del body (IMPORTANTE: después del contenedor) -->
  <!-- Reemplaza [hash] con el hash real de los archivos compilados -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="/static/js/main.[hash].js"></script>
  <!-- Puede haber archivos chunk adicionales, agrégalos también -->
</body>
</html>
```

### Estilos CSS adicionales (opcional)

Si quieres que el wizard se adapte mejor a tu diseño, agrega estos estilos:

```css
#quote-and-book-now,
#wizard-container,
#booking-wizard {
  width: 100%;
  min-height: 600px;
  position: relative;
  overflow: hidden;
}

/* Asegurar que el wizard no se salga del contenedor */
#quote-and-book-now .wizard-container,
#wizard-container .wizard-container,
#booking-wizard .wizard-container {
  width: 100%;
  height: 100%;
  position: relative;
}
```

### Notas importantes:

1. **El contenedor debe existir antes de que se cargue el script de React**
2. **El contenedor debe tener un ancho y alto definidos** (mínimo 600px de altura recomendado)
3. **Si usas iframe**, asegúrate de que el sitio del wizard permita ser embebido (configurar headers CORS si es necesario)
4. **Los modales (login, dashboard) seguirán siendo fullscreen** incluso cuando el wizard esté embebido

### Verificación:

1. Abre las herramientas de desarrollador (F12)
2. Busca el contenedor con el ID que elegiste
3. Verifica que el wizard se renderice dentro del contenedor
4. Prueba que el formulario funcione correctamente

