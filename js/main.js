"use strict";
(() => {
  const boton = document.querySelector("#boton-tema");
  if (!boton) return;

  const raiz = document.documentElement;
  const icono = boton.querySelector("span");
  const clave = "interviewup-tema";

  function aplicarTema(tema) {
    const esOscuro = tema === "oscuro";

    raiz.dataset.tema = tema;
    boton.setAttribute("aria-pressed", String(esOscuro));
    icono.textContent = esOscuro ? "☀" : "☾";
    boton.title = esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  }

  let temaGuardado;
  try {
    temaGuardado = localStorage.getItem(clave);
  } catch {
    temaGuardado = null;
  }

  aplicarTema(temaGuardado === "oscuro" ? "oscuro" : "claro");

  boton.addEventListener("click", () => {
    const nuevoTema = raiz.dataset.tema === "oscuro" ? "claro" : "oscuro";
    aplicarTema(nuevoTema);

    try {
      localStorage.setItem(clave, nuevoTema);
    } catch {
      // El tema sigue activo durante esta visita.
    }
  });
})();
(() => {
  const dialogo = document.querySelector("#acceso");
  const formulario = document.querySelector("#acceso-formulario");
  const nombre = document.querySelector("#acceso-nombre");
  const correo = document.querySelector("#acceso-correo");
  const clave = document.querySelector("#acceso-clave");
  const importar = document.querySelector("#acceso-importar");
  const mensaje = document.querySelector("#acceso-mensaje");
  const alternar = document.querySelector("#acceso-alternar");
  const enviar = formulario.querySelector('[type="submit"]');
  const claveSesion = "interviewup.sesion.v1";
  const prefijoCuenta = "interviewup.cuenta.v1.";
  const datosAnteriores = "interviewup.datos.v1";
  let registro = false;

  try {
    const sesion = sessionStorage.getItem(claveSesion);
    if (sesion && localStorage.getItem(prefijoCuenta + sesion)) {
      window.interviewUPCuenta = sesion;
      window.addEventListener("pageshow", (evento) => {
        if (evento.persisted && sessionStorage.getItem(claveSesion) !== sesion) {
          location.reload();
        }
      });
      document.querySelector("#cerrar-sesion").addEventListener("click", () => {
        sessionStorage.removeItem(claveSesion);
        history.replaceState(null, "", "#inicio");
        location.reload();
      });
      return;
    }
  } catch {
    mensaje.textContent = "Habilita el almacenamiento del navegador para continuar.";
  }

  dialogo.showModal();
  dialogo.addEventListener("cancel", (evento) => evento.preventDefault());

  alternar.addEventListener("click", () => {
    registro = !registro;
    document.querySelector("#acceso-titulo").textContent = registro ? "Crear cuenta" : "Iniciar sesión";
    nombre.closest("label").hidden = !registro;
    nombre.disabled = !registro;
    nombre.required = registro;
    clave.autocomplete = registro ? "new-password" : "current-password";
    clave.minLength = registro ? 8 : 0;
    clave.value = "";
    enviar.textContent = registro ? "Crear cuenta" : "Iniciar sesión";
    alternar.textContent = registro ? "Volver a iniciar sesión" : "Crear una cuenta";
    mensaje.textContent = "";
    try {
      importar.disabled = !registro || !localStorage.getItem(datosAnteriores)
        || Boolean(localStorage.getItem("interviewup.importacion.v1"));
    } catch {
      importar.disabled = true;
    }
    importar.checked = false;
    importar.closest("label").hidden = importar.disabled;
    (registro ? nombre : correo).focus();
  });

  async function derivarClave(contrasena, sal) {
    const material = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(contrasena), "PBKDF2", false, ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: new Uint8Array(sal), iterations: 600000, hash: "SHA-256" },
      material, 256,
    );
    return Array.from(new Uint8Array(bits)).join(",");
  }

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (enviar.disabled) return;
    if (!globalThis.crypto?.subtle) {
      mensaje.textContent = "Abre InterviewUP desde HTTPS o localhost para usar el acceso.";
      return;
    }
    enviar.disabled = alternar.disabled = true;
    mensaje.textContent = "Verificando…";
    const id = encodeURIComponent(correo.value.trim().toLowerCase());
    const contrasena = clave.value;
    const nombreCuenta = nombre.value.trim();
    const deseaImportar = !importar.disabled && importar.checked;
    const claveCuenta = prefijoCuenta + id;

    try {
      const cuenta = JSON.parse(localStorage.getItem(claveCuenta));
      if (registro) {
        if (cuenta || !nombreCuenta) {
          mensaje.textContent = cuenta ? "Ya existe una cuenta con ese correo." : "Escribe tu nombre.";
          return;
        }
        const sal = Array.from(crypto.getRandomValues(new Uint8Array(16)));
        const verificador = await derivarClave(contrasena, sal);
        if (localStorage.getItem(claveCuenta)) {
          mensaje.textContent = "Ya existe una cuenta con ese correo.";
          return;
        }
        const importarDatos = deseaImportar && !localStorage.getItem("interviewup.importacion.v1");
        const datos = importarDatos ? JSON.parse(localStorage.getItem(datosAnteriores)) : null;
        const perfil = { nombre: nombreCuenta, estudios: "", proyectos: "", experiencias: "", ...datos?.perfil };
        perfil.nombre ||= nombreCuenta;
        localStorage.setItem(`${datosAnteriores}.${id}`, JSON.stringify({
          version: 1, sesiones: [], ...datos, perfil,
        }));
        localStorage.setItem(claveCuenta, JSON.stringify({ sal, verificador }));
        if (importarDatos) localStorage.setItem("interviewup.importacion.v1", id);
      } else if (!cuenta || await derivarClave(contrasena, cuenta.sal) !== cuenta.verificador) {
        mensaje.textContent = "Correo o contraseña incorrectos.";
        return;
      }

      sessionStorage.setItem(claveSesion, id);
      history.replaceState(null, "", "#inicio");
      location.reload();
    } catch {
      mensaje.textContent = "No pudimos completar el acceso. Revisa el almacenamiento del navegador e inténtalo de nuevo.";
    } finally {
      enviar.disabled = alternar.disabled = false;
    }
  });
})();

// js/main.js
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const todos = (selector, raiz = document) => Array.from(raiz.querySelectorAll(selector));
  const ahora = () => new Date().toISOString();
  const copiar = (valor) => JSON.parse(JSON.stringify(valor));
  const promedio = (valores) => valores.length
    ? Math.round(valores.reduce((total, valor) => total + valor, 0) / valores.length)
    : 0;

  const cuenta = window.interviewUPCuenta;
  if (!cuenta) return;

  const CLAVE_DATOS = `interviewup.datos.v1.${cuenta}`;
  const CLAVE_TEXTO = `interviewup.texto.v1.${cuenta}`;
  const SEGUNDOS_PENSAR = 30;
  const SEGUNDOS_RESPONDER = 120;
  const POR_PAGINA = 12;

  const PUESTOS = {
    "desarrollador-junior": "Desarrollador Junior",
    "practicante-sistemas": "Practicante de Sistemas",
    "analista-datos-junior": "Analista de Datos Junior",
    "soporte-ti": "Soporte TI",
    "asistente-administrativo": "Asistente Administrativo"
  };

  const CONTEXTOS = {
    practicas: "Prácticas preprofesionales",
    "primer-empleo": "Primer empleo",
    "con-experiencia": "Ya tengo experiencia laboral"
  };

  const TEMAS = {
    personales: "Personal y experiencias",
    situacionales: "Situacional",
    conocimientos: "Conocimientos profesionales",
    mixta: "Mixta"
  };

  const TIPOS = {
    personal: "Personal y experiencias",
    situacional: "Situacional",
    conocimiento: "Conocimiento profesional",
    "caso-tecnico": "Caso técnico"
  };

  const TIPOS_POR_TEMA = {
    personales: ["personal"],
    situacionales: ["situacional"],
    conocimientos: ["conocimiento", "caso-tecnico"],
    mixta: Object.keys(TIPOS)
  };

  const NIVELES = {
    1: "Necesito bastante preparación",
    2: "Necesito algo de preparación",
    3: "Me siento preparado",
    4: "Me siento muy preparado"
  };

  const STAR = {
    situacion: "Situación",
    tarea: "Tarea",
    accion: "Acción",
    resultado: "Resultado"
  };

  const CRITERIOS = {
    organizacion: "Organización explícita",
    star: "Apartados STAR completados",
    desarrollo: "Desarrollo del texto"
  };

  const GUIAS = {
    practicas: "Prepara un ejemplo de un curso o proyecto y explica qué parte desarrollaste tú.",
    "primer-empleo": "Elige una experiencia que demuestre una habilidad del puesto.",
    "con-experiencia": "Prepara un logro laboral y explica cómo comprobaste el resultado."
  };

  // Cada sesión guarda una copia de sus preguntas para poder reabrirla o repetirla.
  const PERSONALES = [
    "Cuéntame sobre ti y explica por qué te interesa este puesto.",
    "Describe un proyecto académico o personal y explica tu aporte individual.",
    "Cuéntame sobre una dificultad que superaste mientras aprendías algo nuevo.",
    "Describe una ocasión en la que trabajaste en equipo para alcanzar un objetivo.",
    "Explica un error que cometiste y qué aprendiste de esa experiencia.",
    "Cuéntame cómo organizaste tus responsabilidades en una semana exigente.",
    "Describe una ocasión en la que recibiste comentarios sobre tu trabajo.",
    "¿Qué conocimientos de tus estudios podrías aplicar en este puesto?",
    "Cuéntame sobre una iniciativa que tomaste sin que te la pidieran.",
    "Describe un logro de un curso, proyecto o práctica y cómo lo conseguiste."
  ];

  const SITUACIONALES = [
    "Tienes dos tareas urgentes y no puedes terminarlas al mismo tiempo. ¿Cuál atenderías primero y por qué?",
    "Un compañero propone una solución con la que no estás de acuerdo. ¿Cómo manejarías la situación?",
    "Te asignan una tarea con instrucciones poco claras. ¿Qué harías antes de comenzar?",
    "Descubres un error poco antes de entregar un trabajo. ¿Cómo actuarías?",
    "Te solicitan un cambio que afecta el plazo acordado. ¿Cómo responderías?",
    "Necesitas ayuda para completar una tarea y el equipo está ocupado. ¿Qué harías?",
    "Un usuario está frustrado porque su problema continúa. ¿Cómo lo atenderías?",
    "Dos documentos contienen información contradictoria. ¿Cómo procederías?",
    "Debes explicar un problema técnico a una persona que desconoce el tema. ¿Cómo lo harías?",
    "Una solución que propusiste no funciona como esperabas. ¿Cómo continuarías?"
  ];

  const TECNICAS = {
    "desarrollador-junior": [
      "¿Qué diferencia existe entre una variable local y una global?",
      "Explica qué es una API y da un ejemplo de uso.",
      "¿Qué función cumplen HTML, CSS y JavaScript en una página web?",
      "¿Para qué sirve Git cuando varias personas desarrollan el mismo proyecto?",
      "¿Cómo comprobarías que una función produce el resultado esperado?",
      "¿Qué diferencia existe entre una lista y un conjunto?",
      "¿Cómo investigarías un error que aparece solo con determinadas entradas?",
      "Explica qué es una consulta SQL y para qué se utiliza.",
      "¿Por qué conviene validar los datos de un formulario?",
      "¿Qué significa separar responsabilidades dentro de un programa?"
    ],
    "practicante-sistemas": [
      "Explica la diferencia entre un sistema operativo y una aplicación.",
      "¿Qué es una dirección IP y para qué se utiliza?",
      "¿Qué diferencia existe entre memoria RAM y almacenamiento?",
      "¿Qué es una base de datos relacional?",
      "Explica qué función cumple un servidor.",
      "¿Qué pasos seguirías para documentar una incidencia?",
      "¿Para qué sirve realizar una copia de seguridad?",
      "¿Qué diferencia existe entre autenticación y autorización?",
      "¿Qué información recogerías antes de instalar un programa?",
      "¿Cómo comprobarías que un cambio en un sistema funciona?"
    ],
    "analista-datos-junior": [
      "¿Qué diferencia existe entre media y mediana?",
      "¿Cómo identificarías valores faltantes en un conjunto de datos?",
      "¿Qué es un registro duplicado y cómo lo investigarías?",
      "Explica para qué se utiliza GROUP BY en SQL.",
      "¿Qué considerarías antes de elegir un gráfico?",
      "¿Qué diferencia existe entre correlación y causalidad?",
      "¿Cómo comprobarías la calidad de una fuente de datos?",
      "¿Para qué sirve filtrar datos antes de analizarlos?",
      "¿Cómo comunicarías un hallazgo a una persona no técnica?",
      "¿Por qué es importante documentar las transformaciones de datos?"
    ],
    "soporte-ti": [
      "¿Qué comprobarías si un equipo no tiene acceso a internet?",
      "¿Qué información debe contener un ticket de soporte?",
      "¿Qué diferencia existe entre reiniciar y restablecer un equipo?",
      "¿Cómo verificarías si un problema afecta a una persona o a varias?",
      "¿Qué es un controlador de dispositivo?",
      "¿Qué precauciones tomarías antes de modificar una configuración?",
      "¿Cómo comprobarías el espacio disponible en un equipo?",
      "¿Cuándo corresponde escalar una incidencia?",
      "¿Cómo verificarías que una incidencia quedó resuelta?",
      "¿Por qué se debe confirmar la identidad antes de restablecer un acceso?"
    ],
    "asistente-administrativo": [
      "¿Cómo organizarías documentos para facilitar su búsqueda?",
      "¿Qué comprobarías antes de enviar un reporte?",
      "¿Cómo utilizarías una hoja de cálculo para controlar gastos?",
      "¿Qué diferencia existe entre una fecha de emisión y una de vencimiento?",
      "¿Cómo registrarías los acuerdos de una reunión?",
      "¿Qué considerarías para programar una reunión con varias personas?",
      "¿Cómo tratarías información administrativa confidencial?",
      "¿Qué datos incluirías en un registro de seguimiento?",
      "¿Cómo detectarías un posible error en una suma de importes?",
      "¿Por qué conviene utilizar versiones y nombres consistentes en los archivos?"
    ]
  };

  const CASOS = {
    "desarrollador-junior": [
      ["Una función debe sumar los importes de una lista. Explica tu solución y cómo la comprobarías.",
        "Entrada: [12, 8, 5]\nSalida esperada: 25"],
      ["Un formulario permite registrar un correo vacío. ¿Cómo corregirías y probarías ese comportamiento?",
        "Campo: correo electrónico.\nPruebas: vacío, formato inválido y formato válido."]
    ],
    "practicante-sistemas": [
      ["Un usuario no puede abrir una aplicación. Propón una secuencia de diagnóstico.",
        "El equipo inicia correctamente. Otras aplicaciones funcionan. Todavía se desconoce el mensaje de error."],
      ["Debes preparar una copia de seguridad antes de una actualización. ¿Cómo comprobarías que puedes recuperar los datos?",
        "Aplicación de trabajo con documentos y archivos de configuración."]
    ],
    "analista-datos-junior": [
      ["Revisa estos importes. ¿Qué comprobarías antes de calcular el promedio?",
        "Importes: 100, 120, vacío, 110, 10000."],
      ["Un reporte muestra clientes repetidos. ¿Cómo investigarías los posibles duplicados?",
        "Columnas: ID, nombre, correo.\nDos filas comparten correo, pero tienen distinto ID."]
    ],
    "soporte-ti": [
      ["Una persona no puede ingresar al sistema. Describe tus comprobaciones y cuándo escalarías el caso.",
        "Mensaje: acceso rechazado. Otros usuarios sí pueden ingresar. No solicites la contraseña."],
      ["Una impresora no responde. Explica cómo aislarías el problema.",
        "La impresora está encendida y dos usuarios reportan el mismo problema."]
    ],
    "asistente-administrativo": [
      ["Revisa la relación de gastos. Calcula el total y explica qué comprobarías.",
        "Transporte: 25\nMateriales: 40\nEnvíos: 15\nTotal registrado: 90"],
      ["Dos reuniones se superponen. Propón una reorganización y explica cómo la comunicarías.",
        "Reunión A: 10:00–11:00.\nReunión B: 10:30–11:30.\nUna persona debe asistir a ambas."]
    ]
  };

  const banco = [];
  for (const puesto of Object.keys(PUESTOS)) {
    const grupos = [
      ["personal", PERSONALES],
      ["situacional", SITUACIONALES],
      ["conocimiento", TECNICAS[puesto]],
      ["caso-tecnico", CASOS[puesto]]
    ];
    for (const [tipo, entradas] of grupos) {
      entradas.forEach((entrada, indice) => {
        const [texto, datos] = Array.isArray(entrada) ? entrada : [entrada, ""];
        const prefijo = tipo === "caso-tecnico" ? "caso" : tipo;
        banco.push({ id: `${puesto}-${prefijo}-${indice + 1}`, puesto, tipo, texto, datos });
      });
    }
  }

  function normalizar(valor) {
    return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function palabras(valor) {
    return String(valor ?? "").trim().match(/\S+/g)?.length || 0;
  }

  function fecha(valor) {
    return new Date(valor).toLocaleString("es-PE", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }

  function duracion(valor) {
    const segundos = Math.max(0, Math.floor(Number(valor) || 0));
    if (segundos < 60) return `${segundos} s`;
    const resto = segundos % 60;
    return `${Math.floor(segundos / 60)} min${resto ? ` ${resto} s` : ""}`;
  }

  function texto(id, valor) {
    $(id).textContent = valor ?? "";
  }

  function mensaje(id, contenido = "") {
    texto(id, contenido);
    $(id).hidden = !contenido;
  }

  function elemento(etiqueta, contenido = "", clase = "") {
    const nodo = document.createElement(etiqueta);
    nodo.textContent = contenido;
    if (clase) nodo.className = clase;
    return nodo;
  }

  function boton(etiqueta, accion, clase = "boton boton--secundario") {
    const nodo = elemento("button", etiqueta, clase);
    nodo.type = "button";
    nodo.addEventListener("click", accion);
    return nodo;
  }

  function listar(id, valores, alternativa) {
    const entradas = valores.length ? [...new Set(valores)] : [alternativa];
    $(id).replaceChildren(...entradas.map((valor) => elemento("li", valor)));
  }

  let avisoId;
  function notificar(contenido) {
    clearTimeout(avisoId);
    texto("anuncio", contenido);
    texto("notificacion", contenido);
    avisoId = setTimeout(() => {
      texto("anuncio", "");
      texto("notificacion", "");
    }, 6000);
  }

  // Almacenamiento y recuperación del historial
  const camposPerfil = ["nombre", "estudios", "proyectos", "experiencias"];
  const perfilVacio = Object.fromEntries(camposPerfil.map((c) => [c, ""]));
  let datos = { version: 1, perfil: { ...perfilVacio }, sesiones: [] };
  let ultimaLectura = null;
  let bloqueado = false;

  function sesionValida(s) {
    return Boolean(
      s && typeof s.id === "string" &&
      ["pendiente", "finalizada"].includes(s.estado) &&
      typeof s.actualizada === "string" && Number.isFinite(Date.parse(s.creada)) &&
      (s.estado !== "finalizada" || Number.isFinite(Date.parse(s.finalizada))) &&
      PUESTOS[s.configuracion?.puesto] && TEMAS[s.configuracion?.tema] &&
      Array.isArray(s.preguntas) && s.preguntas.length &&
      s.preguntas.every((p) => p?.id && typeof p.texto === "string" && p.texto.trim()) &&
      Number.isInteger(s.indice) && s.preguntas[s.indice] &&
      s.reloj && Number.isFinite(s.reloj.restante) &&
      ["pensar", "responder", "agotado", "revision"].includes(s.reloj.fase) &&
      Number.isFinite(s.segundosActivos) && s.borradores &&
      Array.isArray(s.respuestas) && s.respuestas.every((r) =>
        typeof r?.texto === "string" && r.star && r.analisis &&
        Array.isArray(r.analisis.indicadores) && Array.isArray(r.analisis.fortalezas) &&
        Array.isArray(r.analisis.mejoras) && Array.isArray(r.analisis.recomendaciones))
    );
  }

  function leerDatos() {
    try {
      ultimaLectura = localStorage.getItem(CLAVE_DATOS);
      if (ultimaLectura === null) return;
      const guardado = JSON.parse(ultimaLectura);
      if (guardado?.version !== 1 || !guardado.perfil ||
          !Array.isArray(guardado.sesiones) || !guardado.sesiones.every(sesionValida) ||
          new Set(guardado.sesiones.map((s) => s.id)).size !== guardado.sesiones.length) {
        throw new Error("Historial incompatible.");
      }
      datos = guardado;
    } catch {
      bloqueado = true;
      mensaje("estado-almacenamiento",
        "No se pudo leer el historial. Se conservaron los datos existentes. Revisa el almacenamiento del navegador y recarga.");
    }
  }

  function conflicto() {
    bloqueado = true;
    mensaje("estado-almacenamiento",
      "Otra pestaña modificó tus prácticas. Copia tu borrador y recarga para ver la versión más reciente.");
  }

  function guardar(candidato) {
    if (bloqueado) {
      notificar("El guardado está bloqueado. Copia tu respuesta antes de recargar.");
      return false;
    }
    try {
      if (localStorage.getItem(CLAVE_DATOS) !== ultimaLectura) {
        conflicto();
        return false;
      }
      const contenido = JSON.stringify(candidato);
      if (contenido !== ultimaLectura) localStorage.setItem(CLAVE_DATOS, contenido);
      ultimaLectura = contenido;
      datos = candidato;
      mensaje("estado-almacenamiento");
      return true;
    } catch {
      mensaje("estado-almacenamiento",
        "Cambios sin guardar. El almacenamiento está lleno o bloqueado. Copia tu respuesta antes de cerrar.");
      return false;
    }
  }

  function persistir(sesion) {
    const sesiones = datos.sesiones.slice();
    const indice = sesiones.findIndex((s) => s.id === sesion.id);
    if (indice < 0) sesiones.push(copiar(sesion));
    else sesiones[indice] = copiar(sesion);
    return guardar({ ...datos, sesiones });
  }

  function sesionesOrdenadas(estado) {
    return datos.sesiones.filter((s) => !estado || s.estado === estado)
      .sort((a, b) => b.actualizada.localeCompare(a.actualizada));
  }

  window.addEventListener("storage", (evento) => {
    if (evento.key !== CLAVE_DATOS && evento.key !== null) return;
    if (evento.key === CLAVE_DATOS && evento.newValue === ultimaLectura) return;
    conflicto();
  });

  let vista = "";
  let activa = null;
  let preparada = null;
  let resultadoId = null;
  let preguntaElegida = null;
  let compararCon = null;
  let recienteComparada = null;
  let paginaBanco = 0;
  let relojId = null;
  let ultimoPulso = null;
  let guardadoId = null;

  const progreso = {
    resultados: "Mis resultados",
    historial: "Mis prácticas",
    comparacion: "Comparar intentos",
    banco: "Banco de preguntas"
  };

  function crearPestanas() {
    for (const destino of Object.keys(progreso)) {
      const nav = elemento("nav", "", "pestanas-progreso");
      nav.setAttribute("aria-label", "Secciones de mis prácticas");
      for (const [clave, nombre] of Object.entries(progreso)) {
        const enlace = elemento("a", nombre);
        enlace.href = `#${clave}`;
        enlace.dataset.navegar = clave;
        if (clave === destino) enlace.setAttribute("aria-current", "page");
        nav.append(enlace);
      }
      $(destino).prepend(nav);
    }
  }

  function cerrarMenu() {
    $("boton-menu").setAttribute("aria-expanded", "false");
    $("navegacion-principal").classList.remove("navegacion--abierta");
  }

  function navegar(destino, registrar = true) {
    if (!$(destino)?.matches("[data-vista]")) destino = "inicio";
    if (destino === "simulacion" && activa?.estado !== "pendiente") destino = "configuracion";
    if (destino === "preparacion" && !preparada) destino = "configuracion";

    if (vista === "simulacion" && activa && destino !== vista && !pausarYGuardar()) {
      iniciarReloj();
      history.replaceState(null, "", "#simulacion");
      return false;
    }

    vista = destino;
    for (const seccion of todos("[data-vista]")) {
      seccion.hidden = seccion.id !== destino;
      seccion.classList.toggle("vista--activa", !seccion.hidden);
    }

    const grupo = Object.hasOwn(progreso, destino) ? "progreso" :
      ["preparacion", "simulacion"].includes(destino) ? "configuracion" : destino;

    for (const enlace of todos(".navegacion__enlace, .barra-inferior [data-movil]")) {
      const movil = enlace.hasAttribute("data-movil");
      const actual = movil ? enlace.dataset.movil === grupo : enlace.dataset.navegar === destino;
      enlace.classList.toggle("activo", actual);
      if (actual) enlace.setAttribute("aria-current", movil ? "true" : "page");
      else enlace.removeAttribute("aria-current");
    }

    cerrarMenu();
    if (destino === "inicio") renderInicio();
    if (destino === "perfil") camposPerfil.forEach((c) => { $(c).value = datos.perfil[c] || ""; });
    if (destino === "configuracion") resumenConfiguracion();
    if (destino === "preparacion") texto("guia-contexto", GUIAS[preparada.configuracion.contexto]);
    if (destino === "simulacion") {
      renderSimulacion();
      iniciarReloj();
    }
    if (destino === "historial") renderHistorial();
    if (destino === "resultados") renderResultados();
    if (destino === "banco") renderBanco();
    if (destino === "comparacion") renderSelectoresComparacion();

    if (location.hash !== `#${destino}`) {
      history[registrar ? "pushState" : "replaceState"](null, "", `#${destino}`);
    }
    $(destino).querySelector("h1")?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    return true;
  }

  document.addEventListener("click", (evento) => {
    if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    const enlace = evento.target.closest("a");
    if (enlace?.dataset.navegar) {
      evento.preventDefault();
      navegar(enlace.dataset.navegar);
      return;
    }
    if (enlace?.hash === "#contenido-principal" || enlace?.hash.startsWith("#campo-")) {
      const objetivo = $(enlace.hash.slice(1));
      if (!objetivo) return;
      evento.preventDefault();
      const control = objetivo.matches("main") ? objetivo : objetivo.querySelector("input, textarea");
      control?.focus({ preventScroll: true });
      objetivo.scrollIntoView({ block: "start" });
    }
  });

  window.addEventListener("hashchange", () => navegar(location.hash.slice(1), false));

  $("boton-menu").addEventListener("click", () => {
    const abrir = $("boton-menu").getAttribute("aria-expanded") !== "true";
    $("boton-menu").setAttribute("aria-expanded", String(abrir));
    $("navegacion-principal").classList.toggle("navegacion--abierta", abrir);
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && $("boton-menu").getAttribute("aria-expanded") === "true") {
      cerrarMenu();
      $("boton-menu").focus();
    }
  });

  todos("[data-abrir-guia]").forEach((control) => {
    control.addEventListener("click", () => $("dialogo-guia").showModal());
  });

  // Perfil y configuración
  function mostrarPerfil() {
    const nombre = String(datos.perfil.nombre || "").trim();
    const iniciales = nombre.split(/\s+/).slice(0, 2).map((parte) => parte.charAt(0)).join("");
    texto("avatar-iniciales", iniciales.toUpperCase() || "UP");
    texto("titulo-inicio", nombre ? `¡Bienvenido de nuevo, ${nombre}!` : "¡Bienvenido a InterviewUP!");
    texto("estado-informacion-personal", camposPerfil.slice(1).some((c) => datos.perfil[c])
      ? "Tu información está disponible durante la simulación."
      : "Aún no has registrado estudios, proyectos o experiencias.");
  }
  const dialogoGuardado = $("dialogo-guardado-perfil");
const tituloGuardado = $("titulo-guardado-perfil");
const detalleGuardado = $("detalle-guardado-perfil");
const iconoGuardado = $("icono-guardado-perfil");
const cerrarGuardado = $("cerrar-guardado-perfil");

let temporizadorGuardado;

function mostrarEstadoGuardado(estado, titulo, detalle, icono = "") {
  dialogoGuardado.dataset.estado = estado;
  tituloGuardado.textContent = titulo;
  detalleGuardado.textContent = detalle;
  iconoGuardado.textContent = icono;
  cerrarGuardado.hidden = estado !== "error";
}

cerrarGuardado.addEventListener("click", () => {
  dialogoGuardado.close();
});

dialogoGuardado.addEventListener("close", () => {
  clearTimeout(temporizadorGuardado);
});

$("formulario-perfil").addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (dialogoGuardado.open) return;

  const perfil = Object.fromEntries(
    camposPerfil.map((campo) => [campo, $(campo).value.trim()])
  );

  // Limpia el aviso anterior que aparecía debajo del formulario.
  $("mensaje-perfil").textContent = "";

  mostrarEstadoGuardado(
    "guardando",
    "Guardando tu información…",
    "Un momento, por favor."
  );

  dialogoGuardado.showModal();

  // Guarda de inmediato. La pausa de abajo es solo visual.
  const guardado = guardar({ ...datos, perfil });

  if (!guardado) {
    mostrarEstadoGuardado(
      "error",
      "No se pudo guardar",
      "Tus cambios siguen en el formulario. Cierra este aviso y vuelve a intentarlo.",
      "!"
    );
    cerrarGuardado.focus();
    return;
  }

  mostrarPerfil();

  temporizadorGuardado = setTimeout(() => {
    mostrarEstadoGuardado(
      "exito",
      "Información guardada",
      "Tu perfil se actualizó en este navegador.",
      "✓"
    );

    temporizadorGuardado = setTimeout(() => {
      dialogoGuardado.close();
    }, 1800);
  }, 500);
});

  const formularioConfig = $("formulario-configuracion");

  function configuracionActual() {
    const valores = new FormData(formularioConfig);
    return {
      puesto: valores.get("puesto") || "",
      contexto: valores.get("contexto") || "",
      tema: valores.get("tema") || "",
      cantidad: Number(valores.get("cantidad") === "personalizada"
        ? $("cantidad-personalizada").value : valores.get("cantidad"))
    };
  }

  function disponibles(config) {
    return banco.filter((p) =>
      p.puesto === config.puesto && TIPOS_POR_TEMA[config.tema]?.includes(p.tipo));
  }

  function resumenConfiguracion() {
    const personalizada = formularioConfig.elements.cantidad.value === "personalizada";
    const cantidad = $("cantidad-personalizada");
    $("campo-cantidad-personalizada").hidden = !personalizada;
    cantidad.disabled = !personalizada;
    cantidad.required = personalizada;
    const config = configuracionActual();
    const max = disponibles(config).length;
    if (max) cantidad.max = String(max);
    else cantidad.removeAttribute("max");
    texto("ayuda-cantidad", max ? `Puedes elegir entre 1 y ${max} preguntas.` : "Selecciona primero el puesto y el tema.");
    texto("resumen-puesto", PUESTOS[config.puesto] || "Sin seleccionar");
    texto("resumen-contexto", CONTEXTOS[config.contexto] || "Sin seleccionar");
    texto("resumen-tema", TEMAS[config.tema] || "Sin seleccionar");
    texto("resumen-cantidad", config.cantidad || "Por elegir");
    texto("resumen-duracion", config.cantidad > 0
      ? `${duracion(config.cantidad * (SEGUNDOS_PENSAR + SEGUNDOS_RESPONDER))} de tiempo guiado`
      : "Por calcular");
    mensaje("error-configuracion");
  }

  function mezclar(lista) {
    const salida = lista.slice();
    for (let i = salida.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [salida[i], salida[j]] = [salida[j], salida[i]];
    }
    return salida;
  }

  function seleccionarPreguntas(config) {
    const vistas = new Set(datos.sesiones.flatMap((s) => s.respuestas.map((r) => r.preguntaId)));
    const candidatas = mezclar(disponibles(config))
      .sort((a, b) => Number(vistas.has(a.id)) - Number(vistas.has(b.id)));
    const elegidas = [];
    function incluir(p) {
      if (p && elegidas.length < config.cantidad && !elegidas.includes(p)) elegidas.push(p);
    }
    incluir(candidatas.find((p) => p.id === preguntaElegida));
    if (config.tema === "mixta") {
      Object.keys(TIPOS).forEach((tipo) => incluir(candidatas.find((p) => p.tipo === tipo)));
    } else if (config.tema === "conocimientos") {
      incluir(candidatas.find((p) => p.tipo === "caso-tecnico"));
    }
    candidatas.forEach(incluir);
    return elegidas;
  }

  formularioConfig.addEventListener("input", resumenConfiguracion);
  formularioConfig.addEventListener("change", resumenConfiguracion);

  todos("[data-practicar-tema]").forEach((control) => {
    control.addEventListener("click", () => {
      preguntaElegida = null;
      formularioConfig.elements.tema.value = control.dataset.practicarTema;
      navegar("configuracion");
    });
  });

  function actualizarChecklist() {
    const campos = todos("input[type=checkbox]", $("formulario-preparacion"));
    texto("avance-checklist", `${campos.filter((c) => c.checked).length} de ${campos.length} elementos marcados.`);
  }

  function preparar(configuracion, preguntas) {
    preparada = { configuracion: copiar(configuracion), preguntas: copiar(preguntas) };
    $("formulario-preparacion").reset();
    actualizarChecklist();
    navegar("preparacion");
  }

  formularioConfig.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (!formularioConfig.reportValidity()) return;
    const config = configuracionActual();
    const max = disponibles(config).length;
    if (!max || !Number.isInteger(config.cantidad) || config.cantidad < 1 || config.cantidad > max) {
      mensaje("error-configuracion", max
        ? `Elige entre 1 y ${max} preguntas para esta configuración.`
        : "Selecciona un puesto y un tema con preguntas disponibles.");
      return;
    }
    preparar(config, seleccionarPreguntas(config));
    preguntaElegida = null;
  });

  $("formulario-preparacion").addEventListener("change", actualizarChecklist);

  function relojNuevo(indice) {
    return { indice, fase: "pensar", restante: SEGUNDOS_PENSAR, limite: null };
  }

  $("formulario-preparacion").addEventListener("submit", (evento) => {
    evento.preventDefault();
    const form = evento.currentTarget;
    if (!preparada || !form.reportValidity()) return;
    const { configuracion, preguntas } = preparada;
    if (!preguntas.length || preguntas.some((p) => !p.texto?.trim())) {
      notificar("Vuelve a seleccionar el puesto y el tema para generar las preguntas.");
      return;
    }

    const instante = ahora();
    const sesion = {
      id: globalThis.crypto?.randomUUID?.() || `practica-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      estado: "pendiente", creada: instante, actualizada: instante, finalizada: null,
      configuracion, preguntas, indice: 0, respuestas: [], borradores: {},
      checklist: Object.fromEntries(todos("input[type=checkbox]", form).map((c) => [c.name, c.checked])),
      autoevaluacionInicial: Number(form.elements.autoevaluacionInicial.value),
      autoevaluacionFinal: null, segundosActivos: 0, reloj: relojNuevo(0)
    };

    // La práctica ya figura en el historial antes de mostrar la primera pregunta.
    if (!persistir(sesion)) return;
    activa = sesion;
    preparada = null;
    navegar("simulacion");
  });

  // Simulación, temporizador y borradores
  function preguntaActual() {
    return activa.preguntas[activa.indice];
  }

  function respuestaDe(sesion, pregunta) {
    return sesion.respuestas.find((r) => r.preguntaId === pregunta.id);
  }

  function leerEditor() {
    const star = Object.fromEntries(Object.keys(STAR).map((c) => [c, $(`star-${c}`).value]));
    return { texto: $("respuesta-actual").value, star };
  }

  function respuestasIguales(borrador, respuesta) {
    return Boolean(borrador && respuesta && borrador.texto.trim() === respuesta.texto.trim() &&
      Object.keys(STAR).every((c) => (borrador.star?.[c] || "").trim() === (respuesta.star?.[c] || "").trim()));
  }

  function capturar() {
    if (!activa || vista !== "simulacion") return;
    activa.borradores[preguntaActual().id] = leerEditor();
    activa.actualizada = ahora();
  }

  function guardarBorrador() {
    clearTimeout(guardadoId);
    if (!activa || vista !== "simulacion") return false;
    capturar();
    return persistir(activa);
  }

  function botonesSesion() {
    const respuesta = respuestaDe(activa, preguntaActual());
    const editable = activa.reloj.fase !== "pensar";
    $("comenzar-respuesta").hidden = editable;
    $("respuesta-actual").disabled = !editable;
    Object.keys(STAR).forEach((c) => { $(`star-${c}`).disabled = !editable; });
    $("usar-estructura-star").disabled = !editable;
    $("guardar-respuesta").disabled = !editable;
    $("siguiente-pregunta").disabled = !respuestasIguales(leerEditor(), respuesta);
    texto("siguiente-pregunta", activa.indice === activa.preguntas.length - 1
      ? "Revisar finalización" : "Siguiente pregunta →");
    $("finalizar-practica").disabled = activa.respuestas.length !== activa.preguntas.length;
  }

  const TITULOS_RELOJ = {
    pensar: "Tiempo para pensar", responder: "Tiempo para responder",
    agotado: "Tiempo de respuesta cumplido", revision: "Revisión de la respuesta"
  };
  const GUIAS_RELOJ = {
    pensar: "Organiza tus ideas o comienza a responder cuando estés listo.",
    responder: "Escribe tu respuesta y guárdala para consultar los comentarios.",
    agotado: "Puedes terminar de escribir y guardar tu respuesta.",
    revision: "Puedes mejorar tu respuesta o continuar."
  };

  function pintarReloj() {
    const { fase, restante } = activa.reloj;
    const s = Math.max(0, Math.ceil(restante));
    texto("temporizador", `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
    texto("titulo-tiempo", TITULOS_RELOJ[fase]);
    texto("instruccion-tiempo", GUIAS_RELOJ[fase]);
    const aviso = fase === "agotado" ? "Se cumplió el tiempo previsto." :
      fase === "responder" && s <= 15 ? "Quedan 15 segundos o menos." : "";
    if ($("aviso-tiempo").textContent !== aviso) texto("aviso-tiempo", aviso);
  }

  function pulso() {
    if (!activa || ultimoPulso === null) return;
    const instante = performance.now();
    const transcurrido = Math.max(0, (instante - ultimoPulso) / 1000);
    ultimoPulso = instante;
    activa.segundosActivos += transcurrido;
    const r = activa.reloj;
    if (r.fase === "pensar" || r.fase === "responder") {
      r.restante -= transcurrido;
      if (r.fase === "pensar" && r.restante <= 0) {
        r.fase = "responder";
        r.restante += SEGUNDOS_RESPONDER;
        botonesSesion();
        notificar("Ya puedes escribir tu respuesta.");
      }
      if (r.fase === "responder" && r.restante <= 0) {
        r.fase = "agotado";
        r.restante = 0;
      }
    }
    pintarReloj();
  }

  function iniciarReloj() {
    if (relojId !== null || document.hidden || !activa || vista !== "simulacion") return;
    ultimoPulso = performance.now();
    relojId = setInterval(pulso, 500);
  }

  function detenerReloj() {
    if (relojId !== null) pulso();
    clearInterval(relojId);
    relojId = null;
    ultimoPulso = null;
  }

  function pausarYGuardar() {
    detenerReloj();
    return guardarBorrador();
  }

  function editarBorrador() {
    if (!activa) return;
    capturar();
    texto("contador-palabras", `${palabras($("respuesta-actual").value)} palabras`);
    mensaje("error-respuesta");
    $("respuesta-actual").removeAttribute("aria-invalid");
    botonesSesion();
    clearTimeout(guardadoId);
    guardadoId = setTimeout(guardarBorrador, 350);
  }

  $("formulario-respuesta").addEventListener("input", editarBorrador);

  $("comenzar-respuesta").addEventListener("click", () => {
    if (!activa || activa.reloj.fase !== "pensar") return;
    pulso();
    if (activa.reloj.fase === "pensar") {
      activa.reloj.fase = "responder";
      activa.reloj.restante = SEGUNDOS_RESPONDER;
    }
    pintarReloj();
    botonesSesion();
    guardarBorrador();
    $("respuesta-actual").focus();
  });

  $("usar-estructura-star").addEventListener("click", () => {
    const apartados = Object.entries(STAR)
      .filter(([c]) => $(`star-${c}`).value.trim())
      .map(([c, nombre]) => `${nombre}: ${$(`star-${c}`).value.trim()}`);
    if (!apartados.length) return notificar("Completa al menos un apartado STAR.");
    const propuesta = apartados.join("\n\n");
    if (propuesta.length > $("respuesta-actual").maxLength) {
      return notificar("Reduce los apartados para que la respuesta completa tenga como máximo 4000 caracteres.");
    }
    $("respuesta-actual").value = propuesta;
    editarBorrador();
    $("respuesta-actual").focus();
  });

  function pintarIndicadores(panel, entradas) {
    panel.replaceChildren();
    for (const { clave, valor } of entradas) {
      const fila = elemento("div", "", "indicador");
      fila.append(elemento("p", `${CRITERIOS[clave] || clave}: ${valor}/100`, "indicador__nombre"));
      const barra = elemento("div", "", "indicador__barra");
      barra.setAttribute("aria-hidden", "true");
      const relleno = elemento("div", "", "indicador__relleno");
      relleno.style.width = `${Math.min(100, Math.max(0, Number(valor) || 0))}%`;
      barra.append(relleno);
      fila.append(barra);
      panel.append(fila);
    }
  }

  function mostrarAnalisis(analisis) {
    const panel = $("analisis-respuesta");
    panel.replaceChildren();
    texto("estado-analisis", analisis ? "Revisada" : "Sin revisar");
    if (!analisis) {
      panel.append(elemento("p", "Guarda una respuesta para consultar los comentarios.", "estado-vacio"));
      return;
    }
    pintarIndicadores(panel, analisis.indicadores);
    for (const linea of [...analisis.fortalezas, ...analisis.mejoras, ...analisis.recomendaciones]) {
      panel.append(elemento("p", linea));
    }
  }

  function renderAvance() {
    const total = activa.preguntas.length;
    const hechas = activa.respuestas.length;
    texto("contador-preguntas", `Pregunta ${activa.indice + 1} de ${total}`);
    $("progreso-sesion").max = total;
    $("progreso-sesion").value = hechas;
    texto("estado-avance", `${hechas} respondidas · ${total - hechas} pendientes`);
    const lista = $("lista-respuestas-sesion");
    lista.replaceChildren();
    activa.preguntas.forEach((p, indice) => {
      const respondida = Boolean(respuestaDe(activa, p));
      const fila = elemento("li", `Pregunta ${indice + 1} · ${respondida ? "Respondida" : "Pendiente"} `);
      if (respondida) fila.append(boton("Volver a intentar", () => cambiarPregunta(indice, true), "boton boton--texto"));
      lista.append(fila);
    });
  }

  function renderSimulacion() {
    const p = preguntaActual();
    const c = activa.configuracion;
    const respuesta = respuestaDe(activa, p);
    const borrador = activa.borradores[p.id] || respuesta;
    texto("sesion-puesto", PUESTOS[c.puesto]);
    texto("sesion-contexto", CONTEXTOS[c.contexto]);
    texto("sesion-tema", TEMAS[c.tema]);
    texto("sesion-autoevaluacion", NIVELES[activa.autoevaluacionInicial] || "Sin registrar");
    texto("sesion-cantidad", activa.preguntas.length);
    texto("simulacion-descripcion", `${PUESTOS[c.puesto]} · ${TEMAS[c.tema]}`);

    // Se usa el texto de la pregunta guardada en esta sesión, incluida la primera.
    texto("pregunta-actual", p.texto);
    texto("pregunta-categoria", TIPOS[p.tipo]);
    texto("pregunta-numero", `Pregunta ${activa.indice + 1}`);
    texto("pregunta-instruccion", p.tipo === "caso-tecnico"
      ? "Utiliza los datos del ejercicio y explica cómo comprobarías tu solución."
      : p.tipo === "conocimiento" ? "Explica el concepto y da un ejemplo." : "Apoya tu respuesta con un ejemplo concreto.");
    $("caso-tecnico").hidden = !p.datos;
    texto("contenido-caso-tecnico", p.datos || "");
    $("respuesta-actual").value = borrador?.texto || "";
    Object.keys(STAR).forEach((c) => { $(`star-${c}`).value = borrador?.star?.[c] || ""; });
    texto("contador-palabras", `${palabras($("respuesta-actual").value)} palabras`);
    mensaje("error-respuesta");
    $("respuesta-actual").removeAttribute("aria-invalid");

    const experiencias = $("experiencias-sesion");
    experiencias.replaceChildren();
    for (const campo of ["estudios", "proyectos", "experiencias"]) {
      if (datos.perfil[campo]) {
        experiencias.append(elemento("h3", campo[0].toUpperCase() + campo.slice(1)), elemento("p", datos.perfil[campo]));
      }
    }
    if (!experiencias.childElementCount) experiencias.append(elemento("p", "Todavía no has registrado experiencias."));
    renderAvance();
    mostrarAnalisis(respuesta?.analisis);
    pintarReloj();
    botonesSesion();
  }

  function cambiarPregunta(indice, repetir = false) {
    if (!activa?.preguntas[indice]) return;
    detenerReloj();
    if (!guardarBorrador()) { iniciarReloj(); return; }
    const siguiente = copiar(activa);
    siguiente.indice = indice;
    siguiente.reloj = relojNuevo(indice);
    if (repetir) {
      siguiente.reloj.fase = "responder";
      siguiente.reloj.restante = SEGUNDOS_RESPONDER;
    } else if (respuestaDe(siguiente, siguiente.preguntas[indice])) {
      siguiente.reloj.fase = "revision";
    }
    if (!persistir(siguiente)) { iniciarReloj(); return; }
    activa = siguiente;
    renderSimulacion();
    iniciarReloj();
    $("pregunta-actual").focus();
  }

  // Retroalimentación local: los indicadores miden señales de estructura.
  function analizar(pregunta, borrador) {
    const contenido = normalizar(borrador.texto);
    const senales = [
      ["contexto", /\b(situacion|contexto|proyecto|curso|equipo|problema|caso)\b/],
      ["objetivo", /\b(tarea|objetivo|responsabilidad|debia|necesitaba|requisito|buscaba)\b/],
      ["acción", /\b(accion|hice|realice|implemente|analice|revise|verifique|probaria|revisaria|primero|paso)\b/],
      ["resultado", /\b(resultado|logre|logramos|consegui|aprendi|conclusion|comprobar|validar|prueba|verificar)\b/]
    ];
    const presentes = senales.filter(([, patron]) => patron.test(contenido)).map(([nombre]) => nombre);
    const faltantes = senales.map(([nombre]) => nombre).filter((nombre) => !presentes.includes(nombre));
    const indicadores = [{ clave: "organizacion", valor: presentes.length * 25 }];
    const fortalezas = [];
    const mejoras = [];
    const recomendaciones = [];
    const apartados = [];

    if (presentes.length) fortalezas.push(`Se detectaron señales de ${presentes.join(", ")}.`);
    if (faltantes.length) mejoras.push(`Revisa si explicaste con claridad estos elementos: ${faltantes.join(", ")}.`);

    if (["personal", "situacional"].includes(pregunta.tipo)) {
      const limpiar = (v) => normalizar(v.trim()).replace(/\s+/g, " ");
      const valores = Object.values(borrador.star).map(limpiar);
      for (const [clave, valor] of Object.entries(borrador.star)) {
        const contenidoCampo = limpiar(valor);
        const distinto = valores.filter((v) => v === contenidoCampo).length === 1;
        apartados.push({ clave, completo: palabras(valor) >= 3 && distinto });
      }
      indicadores.push({ clave: "star", valor: apartados.filter((a) => a.completo).length * 25 });
      const pendientes = apartados.filter((a) => !a.completo).map((a) => STAR[a.clave]);
      if (pendientes.length) recomendaciones.push(`Puedes desarrollar estos campos STAR: ${pendientes.join(", ")}.`);
      else fortalezas.push("Completaste los cuatro campos STAR con textos diferentes.");
      recomendaciones.push("Comprueba que se entienda qué hiciste tú y qué cambió después.");
    } else {
      recomendaciones.push("Describe los pasos de tu propuesta y cómo comprobarías el resultado.");
      recomendaciones.push("Contrasta la exactitud técnica con tus materiales de estudio.");
    }
    return {
      versionReglas: 2, puntuacion: promedio(indicadores.map((i) => i.valor)),
      indicadores, fortalezas, mejoras, recomendaciones, apartados
    };
  }

  $("formulario-respuesta").addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (!activa || activa.reloj.fase === "pensar") return;
    clearTimeout(guardadoId);
    pulso();
    const borrador = leerEditor();
    borrador.texto = borrador.texto.trim();
    for (const c of Object.keys(STAR)) borrador.star[c] = borrador.star[c].trim();

    if (!borrador.texto) {
      mensaje("error-respuesta", "Escribe una respuesta antes de guardarla.");
      $("respuesta-actual").setAttribute("aria-invalid", "true");
      $("respuesta-actual").focus();
      return;
    }

    const s = copiar(activa);
    const p = s.preguntas[s.indice];
    const previa = respuestaDe(s, p);
    if (!respuestasIguales(borrador, previa)) {
      const intentos = [...(previa?.intentos || [])];
      if (previa) {
        const { texto, star, fecha, analisis } = previa;
        intentos.push({ texto, star, fecha, analisis });
      }
      const nueva = { preguntaId: p.id, ...borrador, fecha: ahora(), analisis: analizar(p, borrador), intentos };
      s.respuestas = s.respuestas.filter((r) => r.preguntaId !== p.id);
      s.respuestas.push(nueva);
    }
    s.borradores[p.id] = borrador;
    s.actualizada = ahora();
    s.reloj.fase = "revision";
    if (!persistir(s)) return;
    activa = s;
    renderSimulacion();
    notificar("Respuesta guardada. Ya puedes revisar los comentarios.");
  });

  function pedirFinalizacion() {
    if (!activa) return;
    capturar();
    const pendiente = activa.preguntas.findIndex((p) => {
      const r = respuestaDe(activa, p);
      return !r || !respuestasIguales(activa.borradores[p.id] || r, r);
    });
    if (pendiente >= 0) {
      cambiarPregunta(pendiente, Boolean(respuestaDe(activa, activa.preguntas[pendiente])));
      notificar(`Guarda la respuesta de la pregunta ${pendiente + 1} antes de finalizar.`);
      return;
    }
    texto("resumen-finalizacion", `${activa.respuestas.length} respuestas guardadas.`);
    $("dialogo-finalizar").returnValue = "";
    $("dialogo-finalizar").showModal();
  }

  $("siguiente-pregunta").addEventListener("click", () => {
    if (!activa || !respuestasIguales(leerEditor(), respuestaDe(activa, preguntaActual()))) return;
    if (activa.indice + 1 < activa.preguntas.length) cambiarPregunta(activa.indice + 1);
    else pedirFinalizacion();
  });

  $("finalizar-practica").addEventListener("click", pedirFinalizacion);

  $("dialogo-finalizar").addEventListener("close", () => {
    if ($("dialogo-finalizar").returnValue !== "confirmar" || !activa || vista !== "simulacion") return;
    detenerReloj();
    clearTimeout(guardadoId);
    const instante = ahora();
    const finalizada = { ...activa, estado: "finalizada", actualizada: instante, finalizada: instante };
    if (!persistir(finalizada)) { iniciarReloj(); return; }
    resultadoId = activa.id;
    activa = null;
    navegar("resultados");
    notificar("Práctica finalizada y guardada en Mis prácticas.");
  });

  for (const id of ["guardar-pendiente", "guardar-salir"]) {
    $(id).addEventListener("click", () => {
      if (navegar("historial")) notificar("Práctica pendiente guardada.");
    });
  }

  function continuar(s) {
    if (!s || s.estado !== "pendiente") return;
    activa = copiar(s);
    navegar("simulacion");
  }

  function repetir(s) {
    if (s) preparar(s.configuracion, s.preguntas);
  }

  function verResultado(s) {
    resultadoId = s.id;
    navegar("resultados");
  }

  function indiceSesion(s) {
    return promedio(s.respuestas.map((r) => r.analisis.puntuacion));
  }

  function indicadoresSesion(s) {
    const grupos = new Map();
    for (const r of s.respuestas) {
      for (const indicador of r.analisis.indicadores) {
        if (!grupos.has(indicador.clave)) grupos.set(indicador.clave, []);
        grupos.get(indicador.clave).push(indicador.valor);
      }
    }
    return [...grupos].map(([clave, valores]) => ({ clave, valor: promedio(valores) }));
  }

  function firmaCriterios(s) {
    const firmas = s.respuestas.map(({ analisis }) => {
      const claves = analisis.indicadores.map((i) => i.clave).sort().join(",");
      return `${analisis.versionReglas || 1}:${claves}`;
    });
    return [...new Set(firmas)].sort().join("|");
  }

  function comparables(a, b) {
    return a.configuracion.puesto === b.configuracion.puesto &&
      a.configuracion.tema === b.configuracion.tema && firmaCriterios(a) === firmaCriterios(b);
  }

  function etiquetaSesion(s) {
    return `${PUESTOS[s.configuracion.puesto]} · ${TEMAS[s.configuracion.tema]} · ${fecha(s.creada)}`;
  }

  // Dashboard e historial
  function renderInicio() {
    mostrarPerfil();
    const sesiones = sesionesOrdenadas();
    const finalizadas = sesionesOrdenadas("finalizada").sort((a, b) => b.finalizada.localeCompare(a.finalizada));
    texto("total-practicas", finalizadas.length);
    texto("tiempo-total", duracion(sesiones.reduce((n, s) => n + s.segundosActivos, 0)));
    texto("ultima-practica", finalizadas[0] ? fecha(finalizadas[0].finalizada) : "Sin prácticas");

    let mayor = null;
    let reciente = null;
    for (let i = 0; i < finalizadas.length; i++) {
      const ultima = finalizadas[i];
      const anterior = finalizadas.slice(i + 1).find((s) => comparables(ultima, s));
      if (!anterior) continue;
      const diferencia = indiceSesion(ultima) - indiceSesion(anterior);
      mayor = mayor === null ? diferencia : Math.max(mayor, diferencia);
      if (reciente === null) reciente = diferencia;
    }
    texto("mayor-mejora", mayor === null ? "Sin datos" : `+${Math.max(0, mayor)} puntos`);
    texto("progreso-reciente", reciente === null
      ? "Completa dos prácticas del mismo puesto y tema para comparar sus índices."
      : `Tu cambio más reciente fue de ${reciente > 0 ? "+" : ""}${reciente} puntos de estructura.`);

    const pendiente = sesiones.find((s) => s.estado === "pendiente");
    $("practica-pendiente-inicio").hidden = !pendiente;
    if (pendiente) texto("descripcion-pendiente", etiquetaSesion(pendiente));

    const recientes = $("practicas-recientes");
    recientes.replaceChildren();
    if (!sesiones.length) recientes.append(elemento("p", "Todavía no tienes prácticas registradas.", "estado-vacio"));
    for (const s of sesiones.slice(0, 3)) {
      const fila = elemento("div", "", "practica-reciente");
      const info = elemento("div");
      info.append(elemento("strong", PUESTOS[s.configuracion.puesto]), elemento("p", fecha(s.creada)));
      const pendiente = s.estado === "pendiente";
      fila.append(info, boton(pendiente ? "Continuar" : `${indiceSesion(s)}/100`,
        () => pendiente ? continuar(s) : verResultado(s), "boton boton--texto"));
      recientes.append(fila);
    }
  }

  $("continuar-pendiente-inicio").addEventListener("click", () => continuar(sesionesOrdenadas("pendiente")[0]));

  function renderHistorial() {
    const sesiones = sesionesOrdenadas();
    const estado = $("historial-estado").value;
    const dias = { semana: 7, mes: 30 }[$("historial-periodo").value];
    const limite = dias ? Date.now() - dias * 86400000 : -Infinity;
    const visibles = sesiones.filter((s) =>
      (estado === "todas" || s.estado === estado) && Date.parse(s.actualizada) >= limite);

    texto("cantidad-practicas-guardadas", `${sesiones.length} prácticas guardadas`);
    const panel = $("lista-historial");
    panel.replaceChildren();
    if (!visibles.length) {
      panel.append(elemento("p", sesiones.length ? "Ninguna práctica coincide con estos filtros." :
        "Tus prácticas guardadas aparecerán aquí.", "tarjeta estado-vacio"));
    }
    for (const s of visibles) {
      const fila = elemento("article", "", "tarjeta practica-historial");
      const info = elemento("div", "", "practica-historial__datos");
      info.append(
        elemento("h2", PUESTOS[s.configuracion.puesto]),
        elemento("p", `${TEMAS[s.configuracion.tema]} · ${fecha(s.creada)}`),
        elemento("p", `${s.respuestas.length} de ${s.preguntas.length} respondidas · ${duracion(s.segundosActivos)}`),
        elemento("span", s.estado === "pendiente" ? "Pendiente" : "Finalizada", "etiqueta")
      );
      const acciones = elemento("div", "", "practica-historial__acciones");
      if (s.estado === "pendiente") acciones.append(boton("Continuar práctica", () => continuar(s)));
      else acciones.append(boton("Ver resultados", () => verResultado(s)), boton("Repetir práctica", () => repetir(s)));
      fila.append(info, acciones);
      panel.append(fila);
    }
  }

  $("formulario-filtros-historial").addEventListener("submit", (evento) => {
    evento.preventDefault();
    renderHistorial();
  });

  // Resultados y autoevaluación
  function resultadoActual() {
    const finalizadas = sesionesOrdenadas("finalizada");
    return finalizadas.find((s) => s.id === resultadoId) ||
      finalizadas.sort((a, b) => b.finalizada.localeCompare(a.finalizada))[0];
  }

  function detalleRespuesta(s, p, indice) {
    const r = respuestaDe(s, p);
    const panel = elemento("details", "", "acordeon respuesta-detalle");
    panel.append(elemento("summary", `${indice + 1}. ${p.texto}`));
    if (!r) {
      panel.append(elemento("p", "Sin respuesta guardada."));
      return panel;
    }
    panel.append(elemento("p", r.texto, "respuesta-detalle__texto"),
      elemento("p", `Índice de estructura: ${r.analisis.puntuacion}/100`));
    for (const [c, nombre] of Object.entries(STAR)) {
      if (r.star?.[c]) panel.append(elemento("p", `${nombre}: ${r.star[c]}`));
    }
    for (const comentario of [...r.analisis.fortalezas, ...r.analisis.mejoras, ...r.analisis.recomendaciones]) {
      panel.append(elemento("p", comentario));
    }
    (r.intentos || []).forEach((intento, i) => {
      const previo = elemento("details", "", "acordeon");
      previo.append(elemento("summary", `Respuesta anterior ${i + 1}`),
        elemento("p", intento.texto, "respuesta-detalle__texto"));
      panel.append(previo);
    });
    return panel;
  }

  function renderResultados() {
    const s = resultadoActual();
    $("resultados-vacios").hidden = Boolean(s);
    $("contenido-resultados").hidden = !s;
    if (!s) return;
    resultadoId = s.id;

    texto("resultado-puesto", PUESTOS[s.configuracion.puesto]);
    texto("resultado-tema", TEMAS[s.configuracion.tema]);
    texto("resultado-duracion", duracion(s.segundosActivos));
    texto("resultado-preguntas", `${s.respuestas.length} de ${s.preguntas.length}`);
    texto("resultado-puntuacion", indiceSesion(s));
    texto("resultado-descripcion", `Práctica finalizada el ${fecha(s.finalizada)}.`);
    pintarIndicadores($("resultado-indicadores"), indicadoresSesion(s));
    for (const clave of ["fortalezas", "mejoras", "recomendaciones"]) {
      listar(`resultado-${clave}`, s.respuestas.flatMap((r) => r.analisis[clave]), "Sin observaciones adicionales.");
    }
    $("resultado-respuestas").replaceChildren(...s.preguntas.map((p, i) => detalleRespuesta(s, p, i)));
    texto("resultado-criterios",
      "La organización identifica señales escritas de contexto, objetivo, acción y resultado. " +
      "En preguntas personales y situacionales, STAR cuenta los apartados distintos con al menos tres palabras. " +
      "Cada respuesta obtiene el promedio de sus indicadores.");

    const form = $("formulario-autoevaluacion-final");
    form.reset();
    if (s.autoevaluacionFinal) form.elements.autoevaluacionFinal.value = String(s.autoevaluacionFinal);
    texto("resultado-autoevaluacion",
      `Antes: ${NIVELES[s.autoevaluacionInicial] || "Sin registrar"}. Después: ${NIVELES[s.autoevaluacionFinal] || "Pendiente"}.`);
  }

  $("formulario-autoevaluacion-final").addEventListener("submit", (evento) => {
    evento.preventDefault();
    const s = resultadoActual();
    const valor = Number(evento.currentTarget.elements.autoevaluacionFinal.value);
    if (!s || !NIVELES[valor]) return;
    if (persistir({ ...s, autoevaluacionFinal: valor, actualizada: ahora() })) {
      renderResultados();
      notificar("Autoevaluación guardada.");
    }
  });

  $("repetir-practica-resultados").addEventListener("click", () => repetir(resultadoActual()));
  $("comparar-desde-resultados").addEventListener("click", () => {
    compararCon = resultadoActual()?.id || null;
    navegar("comparacion");
  });

  // Comparación de intentos
  function opcionesSesiones(select, sesiones, titulo) {
    select.replaceChildren(new Option(titulo, ""));
    sesiones.forEach((s, i) => select.add(new Option(`${i + 1}. ${etiquetaSesion(s)}`, s.id)));
  }

  function actualizarSegundoIntento() {
    const sesiones = sesionesOrdenadas("finalizada");
    const a = sesiones.find((s) => s.id === $("intento-a").value);
    const candidatas = a ? sesiones.filter((s) => s.id !== a.id && s.configuracion.puesto === a.configuracion.puesto) : [];
    opcionesSesiones($("intento-b"), candidatas, "Selecciona otra práctica");
    $("intento-b").disabled = !candidatas.length;
    $("contenido-comparacion").hidden = true;
    mensaje("error-comparacion");
  }

  function renderSelectoresComparacion() {
    const sesiones = sesionesOrdenadas("finalizada");
    opcionesSesiones($("intento-a"), sesiones, "Selecciona una práctica");
    if (compararCon) $("intento-a").value = compararCon;
    compararCon = null;
    actualizarSegundoIntento();
    const hayPar = sesiones.some((a, i) =>
      sesiones.slice(i + 1).some((b) => a.configuracion.puesto === b.configuracion.puesto));
    $("comparacion-vacia").hidden = hayPar;
  }

  $("intento-a").addEventListener("change", actualizarSegundoIntento);
  $("intento-b").addEventListener("change", () => { $("contenido-comparacion").hidden = true; });

  $("formulario-comparacion").addEventListener("submit", (evento) => {
    evento.preventDefault();
    const sesiones = sesionesOrdenadas("finalizada");
    const a = sesiones.find((s) => s.id === $("intento-a").value);
    const b = sesiones.find((s) => s.id === $("intento-b").value);
    if (!a || !b || a.id === b.id || a.configuracion.puesto !== b.configuracion.puesto) {
      mensaje("error-comparacion", "Selecciona dos prácticas diferentes y finalizadas del mismo puesto.");
      return;
    }

    mensaje("error-comparacion");
    const [antes, despues] = [a, b].sort((x, y) => x.creada.localeCompare(y.creada));
    recienteComparada = despues;
    const compatibles = comparables(antes, despues);
    const diferencia = indiceSesion(despues) - indiceSesion(antes);
    texto("comparacion-fecha-anterior", fecha(antes.creada));
    texto("comparacion-fecha-reciente", fecha(despues.creada));
    texto("comparacion-puntuacion-anterior", `${indiceSesion(antes)}/100`);
    texto("comparacion-puntuacion-reciente", `${indiceSesion(despues)}/100`);
    texto("comparacion-diferencia", compatibles ? `${diferencia > 0 ? "+" : ""}${diferencia} puntos` : "Criterios diferentes");
    texto("comparacion-interpretacion", compatibles ? "Cambio en el índice de estructura." :
      "Los temas o criterios difieren. Revisa las respuestas de cada práctica.");

    const anteriores = indicadoresSesion(antes);
    const panel = $("comparacion-indicadores");
    panel.replaceChildren();
    const cambios = [];
    const pendientes = [];
    for (const i of indicadoresSesion(despues)) {
      const previo = anteriores.find((p) => p.clave === i.clave);
      panel.append(elemento("p", `${CRITERIOS[i.clave] || i.clave}: ${previo?.valor ?? "—"} → ${i.valor}`));
      if (compatibles && previo && i.valor > previo.valor) cambios.push(`Aumentó el indicador «${CRITERIOS[i.clave]}».`);
      if (i.valor < 100) pendientes.push(`Revisar el indicador «${CRITERIOS[i.clave]}».`);
    }
    panel.append(elemento("p", `Autoevaluación final: ${NIVELES[antes.autoevaluacionFinal] || "Sin registrar"} → ` +
      `${NIVELES[despues.autoevaluacionFinal] || "Sin registrar"}.`));
    listar("comparacion-cambios", cambios, compatibles ? "Sin aumentos en los indicadores comunes." : "Revisa las diferencias pregunta por pregunta.");
    listar("comparacion-pendientes", pendientes, "Practica con preguntas diferentes.");

    const respuestas = $("comparacion-respuestas");
    respuestas.replaceChildren();
    for (const [s, titulo] of [[antes, "Intento anterior"], [despues, "Intento reciente"]]) {
      respuestas.append(elemento("h3", titulo), ...s.preguntas.map((p, i) => detalleRespuesta(s, p, i)));
    }
    $("contenido-comparacion").hidden = false;
    $("comparacion-vacia").hidden = true;
  });

  $("repetir-practica-comparacion").addEventListener("click", () => repetir(recienteComparada));

  // Banco de preguntas
  function practicarPregunta(p) {
    formularioConfig.elements.puesto.value = p.puesto;
    formularioConfig.elements.tema.value = {
      personal: "personales", situacional: "situacionales",
      conocimiento: "conocimientos", "caso-tecnico": "conocimientos"
    }[p.tipo];
    formularioConfig.elements.cantidad.value = "personalizada";
    $("cantidad-personalizada").value = "1";
    preguntaElegida = p.id;
    navegar("configuracion");
    notificar("Pregunta seleccionada. Revisa el contexto para comenzar.");
  }

  function renderBanco() {
    const busqueda = normalizar($("buscar-pregunta").value.trim());
    const puesto = $("banco-puesto").value;
    const tipo = $("banco-tipo").value;
    const filtradas = banco.filter((p) =>
      (!puesto || p.puesto === puesto) && (!tipo || p.tipo === tipo) &&
      normalizar(`${p.texto} ${p.datos} ${PUESTOS[p.puesto]} ${TIPOS[p.tipo]}`).includes(busqueda));
    const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    paginaBanco = Math.min(Math.max(0, paginaBanco), paginas - 1);
    const inicio = paginaBanco * POR_PAGINA;

    texto("cantidad-preguntas-banco", `${banco.length} entradas distribuidas entre ${Object.keys(PUESTOS).length} puestos.`);
    texto("estado-busqueda-banco", filtradas.length
      ? `${filtradas.length} coincidencias. Página ${paginaBanco + 1} de ${paginas}.`
      : "Ninguna pregunta coincide con los filtros.");

    const panel = $("lista-banco");
    panel.replaceChildren();
    for (const p of filtradas.slice(inicio, inicio + POR_PAGINA)) {
      const tarjeta = elemento("article", "", "tarjeta pregunta-banco");
      const etiquetas = elemento("div", "", "pregunta-banco__etiquetas");
      etiquetas.append(elemento("span", PUESTOS[p.puesto], "etiqueta"), elemento("span", TIPOS[p.tipo], "etiqueta"));
      tarjeta.append(etiquetas, elemento("h2", p.texto));
      if (p.datos) tarjeta.append(elemento("p", p.datos));
      tarjeta.append(boton("Practicar esta pregunta", () => practicarPregunta(p), "boton boton--texto"));
      panel.append(tarjeta);
    }
    $("paginacion-banco").hidden = paginas <= 1;
    $("banco-anterior").disabled = paginaBanco === 0;
    $("banco-siguiente").disabled = paginaBanco + 1 >= paginas;
  }

  $("formulario-filtros-banco").addEventListener("submit", (evento) => {
    evento.preventDefault();
    paginaBanco = 0;
    renderBanco();
  });

  $("formulario-filtros-banco").addEventListener("reset", () => {
    setTimeout(() => { paginaBanco = 0; renderBanco(); }, 0);
  });

  for (const [id, cambio] of [["banco-anterior", -1], ["banco-siguiente", 1]]) {
    $(id).addEventListener("click", () => {
      paginaBanco += cambio;
      renderBanco();
      $("estado-busqueda-banco").focus();
    });
  }

  // Preferencias de lectura y recuperación al recargar
  let escala = 100;

  function aplicarEscala(valor, recordar = true) {
    escala = Math.min(150, Math.max(90, valor));
    document.documentElement.style.setProperty("--tamano-base", `${escala}%`);
    texto("estado-tamano-texto", `Tamaño del texto: ${escala} %`);
    $("reducir-texto").disabled = escala <= 90;
    $("aumentar-texto").disabled = escala >= 150;
    if (recordar) {
      try {
        localStorage.setItem(CLAVE_TEXTO, String(escala));
      } catch {
        notificar("El tamaño cambió para esta visita. No se pudo guardar la preferencia.");
      }
    }
  }

  $("reducir-texto").addEventListener("click", () => aplicarEscala(escala - 10));
  $("aumentar-texto").addEventListener("click", () => aplicarEscala(escala + 10));
  $("restablecer-texto").addEventListener("click", () => aplicarEscala(100));

  document.addEventListener("visibilitychange", () => {
    if (vista !== "simulacion" || !activa) return;
    if (document.hidden) pausarYGuardar();
    else iniciarReloj();
  });

  window.addEventListener("pagehide", () => {
    if (vista === "simulacion" && activa) pausarYGuardar();
  });

  window.addEventListener("pageshow", iniciarReloj);

  leerDatos();
  try {
    const guardada = Number(localStorage.getItem(CLAVE_TEXTO));
    if (guardada >= 90 && guardada <= 150) escala = guardada;
  } catch {
    escala = 100;
  }

  aplicarEscala(escala, false);
  crearPestanas();
  mostrarPerfil();
  resumenConfiguracion();
  actualizarChecklist();

  const destinoInicial = location.hash.slice(1) || "inicio";
  if (destinoInicial === "simulacion") {
    const pendiente = sesionesOrdenadas("pendiente")[0];
    if (pendiente) activa = copiar(pendiente);
  }
  navegar(destinoInicial, false);
})();
