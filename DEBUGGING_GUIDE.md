# 🛠️ Guía de Debugging - Detección de Menciones

## 📋 Resumen de Problemas

### Problema 1: "Start Mention Detection" se queda pensando
**Status**: ✅ SOLUCIONADO - Mejorado el polling de status

### Problema 2: No se ven llamadas a OpenAI API  
**Status**: 🔍 EN INVESTIGACIÓN

## 🚀 Pasos de Debugging

### 1. Verificar que el servidor esté funcionando
```bash
cd /Users/joe/Warp/mh-scanner
npm run dev
```

### 2. Verificar conexión con OpenAI (FUNCIONA ✅)
```bash
node test-openai-simple.js
```
**Resultado esperado**: "🎉 OpenAI connection successful!"

### 3. Verificar inicialización de keywords
1. Abrir navegador en `http://localhost:3000`
2. Hacer login con el passcode
3. Ir a `http://localhost:3000/dashboard/config`
4. Si no hay keywords, hacer clic en "Initialize Default Keywords"

### 4. Verificar que un episodio tenga transcripción
1. Ir a `/dashboard/episodes/[episodeId]`
2. Verificar que aparezca el transcript completo
3. El transcript debe tener contenido relevante sobre terapia

### 5. Monitorear logs durante el proceso
Abrir las herramientas de desarrollo del navegador (F12) y ir a la pestaña Console.

**Logs esperados durante el proceso**:
```
🔍 Fetching active keywords from database...
📝 Found 67 active keywords: ['terapia', 'psicologo', ...]
🎯 Detecting keyword matches in 245 segments...
First few segments preview: ["Hola, bienvenidos...", "El día de hoy...", ...]
✅ Found 3 keyword matches
First match example: { text: "Mi psicólogo me ayudó...", keywords: ["psicologo"], startTime: 120 }
🤖 Starting LLM classification phase...
🤖 Classifying fragment 1/3:
   Text: Mi psicólogo me ayudó a entender que la ansiedad es algo que se puede tratar...
   Keywords: psicologo, ansiedad
   Language: es
🤖 OpenAI Request: { endpoint: '...', model: 'gpt-4o-mini', ... }
✅ OpenAI Response: { hasChoices: true, contentLength: 156 }
   ✅ Classified: testimonio (85% confidence)
```

## 🔍 Posibles Causas si NO se ven llamadas a OpenAI

### Causa 1: Keywords no inicializadas
- **Síntoma**: "❌ No active keywords configured for detection"
- **Solución**: Ir a `/dashboard/config` e inicializar keywords

### Causa 2: Transcripción sin contenido relevante
- **Síntoma**: "🔍 No keyword matches found - completing job without LLM analysis"
- **Solución**: Verificar que el transcript tenga menciones de terapia/salud mental

### Causa 3: Error en la API de OpenAI
- **Síntoma**: "❌ Classification failed for fragment X"
- **Solución**: Verificar logs detallados del error

### Causa 4: Episodio sin transcripción
- **Síntoma**: Proceso no inicia o falla inmediatamente
- **Solución**: Asegurar que el episodio tenga transcripción completa

## 🧪 Test Directo de Flujo Completo

### Comando de prueba manual:
```javascript
// En la consola del navegador (cuando estés logueado)
fetch('/api/process/detect-mentions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ episodeId: 'TU_EPISODE_ID_AQUI', force: true })
}).then(r => r.json()).then(console.log)
```

## 📊 Verificar en Dashboard de OpenAI

Si los logs muestran llamadas exitosas pero no aparecen en tu dashboard de OpenAI:

1. Ir a https://platform.openai.com/usage
2. Verificar el proyecto correcto
3. Verificar el rango de fechas
4. Verificar la API key que estás usando

## 🔧 Logs Adicionales Agregados

Agregué más logging detallado al proceso:
- Muestra primeros 10 keywords activos (antes: 5)
- Muestra preview de los primeros 3 segments
- Muestra ejemplo del primer match encontrado
- Logs detallados por cada fragmento clasificado
- Error handling mejorado con contexto

## 📝 Próximos Pasos

1. **Verificar keywords**: Ve a `/dashboard/config` y asegúrate de que haya 60+ keywords activos
2. **Probar con episodio conocido**: Usa un episodio que sepas que tiene menciones de terapia
3. **Monitorear logs**: Sigue los logs paso a paso para identificar dónde se detiene
4. **Reportar hallazgos**: Comparte los logs específicos que veas para debugging adicional

---

**Última actualización**: Mejoras de logging agregadas para mejor debugging en tiempo real.
