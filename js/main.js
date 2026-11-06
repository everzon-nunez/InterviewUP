"use strict";

/* ==========================================================
   INTERVIEWUP
   JavaScript compatible con el HTML y CSS proporcionados.
   ========================================================== */

(() => {
  /* --------------------------------------------------------
     1. UTILIDADES Y CONFIGURACIÓN
     -------------------------------------------------------- */

  const $ = (selector, contexto = document) =>
    contexto.querySelector(selector);

  const $$ = (selector, contexto = document) =>
    [...contexto.querySelectorAll(selector)];

  const CLAVE_DATOS = "interviewup.datos.v1";
  const CLAVE_TEXTO = "interviewup.texto.v1";

  const TIEMPO_PENSAR = 30;
  const TIEMPO_RESPONDER = 120;

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
    situacional: "Caso situacional",
    conocimiento: "Conocimiento profesional",
    "caso-tecnico": "Caso técnico"
  };

  const NIVELES = {
    1: "Necesito bastante preparación",
    2: "Necesito algo de preparación",
    3: "Me siento preparado",
    4: "Me siento muy preparado"
  };

  const CRITERIOS = {
    desarrollo: {
      nombre: "Desarrollo del texto",
      descripcion:
        "Cuenta las palabras de la respuesta: " +
        "menos de 15 = 25 puntos; de 15 a 39 = 50; " +
        "de 40 a 79 = 75; desde 80 = 100. " +
        "La longitud no demuestra calidad."
    },

    organizacion: {
      nombre: "Organización explícita",
      descripcion:
        "Comprueba cuatro señales escritas: contexto, " +
        "objetivo, acción y cierre. Cada señal suma 25 puntos. " +
        "Detectar palabras no garantiza una estructura correcta."
    },

    star: {
      nombre: "Apartados STAR completados",
      descripcion:
        "Cuenta los campos STAR con textos distintos de al menos tres palabras. " +
        "Cada apartado suma 25 puntos. " +
        "No verifica la veracidad ni la calidad del ejemplo."
    }
  };

  function crearId() {
    if (globalThis.crypto?.randomUUID) {
      return crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2)
    );
  }

  function escapar(valor = "") {
    return String(valor).replace(/[&<>"']/g, caracter => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caracter]);
  }

  function normalizar(texto = "") {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function contarPalabras(texto = "") {
    return texto.trim().split(/\s+/).filter(Boolean).length;
  }

  function formatoReloj(segundos) {
    const total = Math.max(0, Math.ceil(segundos));
    const minutos = Math.floor(total / 60);
    const resto = total % 60;

    return (
      String(minutos).padStart(2, "0") +
      ":" +
      String(resto).padStart(2, "0")
    );
  }

  function formatoDuracion(segundos = 0) {
    const minutos = Math.floor(segundos / 60);

    if (minutos < 60) {
      return `${minutos} min`;
    }

    return `${Math.floor(minutos / 60)} h ${minutos % 60} min`;
  }

  function formatoFecha(fecha) {
    return new Intl.DateTimeFormat("es-PE", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date(fecha));
  }

  function mezclar(lista) {
    const copia = [...lista];

    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
  }

  function listaHTML(elementos) {
    return elementos.map(texto => `<li>${escapar(texto)}</li>`).join("");
  }

  function unicos(elementos) {
    return [...new Set(elementos)];
  }

  /* --------------------------------------------------------
     2. BANCO DE PREGUNTAS PREPARADAS
     -------------------------------------------------------- */

  const PERSONALES = [
    "Cuéntame sobre ti y explica por qué te interesa este puesto.",
    "Describe un proyecto académico o personal y explica tu aporte individual.",
    "Cuéntame sobre una dificultad que superaste mientras aprendías algo nuevo.",
    "Describe una ocasión en la que trabajaste en equipo para alcanzar un objetivo.",
    "Explica un error que cometiste y qué aprendiste de esa experiencia.",
    "Cuéntame cómo organizaste tus responsabilidades en una semana exigente.",
    "Describe una ocasión en la que recibiste comentarios sobre tu trabajo.",
    "Explica qué conocimientos de tus estudios podrías aplicar en este puesto.",
    "Cuéntame sobre una iniciativa que tomaste sin que te la pidieran.",
    "Describe un logro de un curso, proyecto o práctica y cómo lo conseguiste."
  ];

  const SITUACIONALES = [
    "Tienes dos tareas urgentes y no puedes terminarlas al mismo tiempo. ¿Cómo decides cuál atender primero?",
    "Un compañero propone una solución con la que no estás de acuerdo. ¿Cómo manejarías la situación?",
    "Te asignan una tarea con instrucciones poco claras. ¿Qué harías antes de comenzar?",
    "Descubres un error poco antes de entregar un trabajo. ¿Cómo actuarías?",
    "Una persona solicita un cambio que afecta el plazo acordado. ¿Cómo responderías?",
    "Necesitas ayuda para completar una tarea y el equipo está ocupado. ¿Qué harías?",
    "Un usuario se muestra frustrado porque un problema continúa. ¿Cómo lo atenderías?",
    "Detectas información contradictoria entre dos documentos. ¿Cómo procederías?",
    "Debes explicar un problema técnico a alguien sin conocimientos del tema. ¿Cómo lo harías?",
    "Una solución que propusiste no funciona como esperabas. ¿Cómo continuarías?"
  ];

  const TECNICAS = {
    "desarrollador-junior": [
      "¿Qué diferencia existe entre una variable local y una global?",
      "Explica qué es una API y da un ejemplo de uso.",
      "¿Qué diferencia existe entre HTML, CSS y JavaScript?",
      "¿Para qué sirve Git en un proyecto desarrollado en equipo?",
      "Explica cómo comprobarías que una función produce el resultado esperado.",
      "¿Qué diferencia existe entre una lista y un conjunto?",
      "¿Cómo investigarías un error que solo aparece en determinadas entradas?",
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
      "¿Cómo verificarías si un problema afecta a un usuario o a varios?",
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
      "Explica cómo utilizarías una hoja de cálculo para controlar gastos.",
      "¿Qué diferencia existe entre una fecha de emisión y una de vencimiento?",
      "¿Cómo registrarías acuerdos de una reunión?",
      "¿Qué considerarías para programar una reunión con varias personas?",
      "¿Cómo tratarías información administrativa confidencial?",
      "¿Qué datos incluirías en un registro de seguimiento?",
      "¿Cómo detectarías un posible error en una suma de importes?",
      "¿Por qué conviene utilizar versiones y nombres consistentes en los archivos?"
    ]
  };

  const CASOS = {
    "desarrollador-junior": [
      {
        texto:
          "Una función debe sumar los importes de una lista. " +
          "Explica tu solución y cómo la comprobarías.",
        datos: "Entrada: [12, 8, 5]\nSalida esperada: 25"
      },
      {
        texto:
          "Un formulario permite registrar un correo vacío. " +
          "Describe cómo corregirías y probarías el comportamiento.",
        datos:
          "Campo: correo electrónico\n" +
          "Casos: vacío, formato inválido, formato válido"
      }
    ],

    "practicante-sistemas": [
      {
        texto:
          "Un usuario no puede abrir una aplicación. " +
          "Propón una secuencia de diagnóstico.",
        datos:
          "El equipo inicia correctamente.\n" +
          "Otras aplicaciones funcionan.\n" +
          "No se conoce aún el mensaje de error."
      },
      {
        texto:
          "Debes preparar una copia de seguridad antes de un cambio. " +
          "Explica qué guardarías y cómo verificarías la recuperación.",
        datos:
          "Cambio previsto: actualización de una aplicación.\n" +
          "Datos relevantes: configuración y documentos de trabajo."
      }
    ],

    "analista-datos-junior": [
      {
        texto:
          "Revisa estos datos y describe qué comprobarías " +
          "antes de calcular el promedio.",
        datos: "Importes: 100, 120, vacío, 110, 10000"
      },
      {
        texto:
          "Un reporte muestra clientes repetidos. " +
          "Explica cómo investigarías el origen y tratarías los duplicados.",
        datos:
          "Columnas: ID, nombre, correo.\n" +
          "Dos filas comparten correo, pero tienen distinto ID."
      }
    ],

    "soporte-ti": [
      {
        texto:
          "Una persona no puede ingresar al sistema. " +
          "Describe tus comprobaciones y cuándo escalarías el caso.",
        datos:
          "Mensaje: acceso rechazado.\n" +
          "Otros usuarios sí pueden ingresar.\n" +
          "No debes solicitar la contraseña."
      },
      {
        texto:
          "Una impresora no responde. " +
          "Explica cómo aislarías el problema.",
        datos:
          "La impresora está encendida.\n" +
          "Dos usuarios reportan el mismo problema."
      }
    ],

    "asistente-administrativo": [
      {
        texto:
          "Debes revisar una relación de gastos. " +
          "Calcula el total y describe las comprobaciones necesarias.",
        datos:
          "Transporte: 25\nMateriales: 40\nEnvíos: 15\n" +
          "Total registrado: 90"
      },
      {
        texto:
          "Dos reuniones están programadas a la misma hora. " +
          "Propón una reorganización y explica cómo la comunicarías.",
        datos:
          "Reunión A: 10:00–11:00.\n" +
          "Reunión B: 10:30–11:30.\n" +
          "Una persona debe asistir a ambas."
      }
    ]
  };

  const BANCO = [];

  Object.keys(PUESTOS).forEach(puesto => {
    PERSONALES.forEach((texto, indice) => {
      BANCO.push({
        id: `${puesto}-personal-${indice + 1}`,
        puesto,
        tipo: "personal",
        texto,
        datos: ""
      });
    });

    SITUACIONALES.forEach((texto, indice) => {
      BANCO.push({
        id: `${puesto}-situacional-${indice + 1}`,
        puesto,
        tipo: "situacional",
        texto,
        datos: ""
      });
    });

    TECNICAS[puesto].forEach((texto, indice) => {
      BANCO.push({
        id: `${puesto}-conocimiento-${indice + 1}`,
        puesto,
        tipo: "conocimiento",
        texto,
        datos: ""
      });
    });

    CASOS[puesto].forEach((caso, indice) => {
      BANCO.push({
        id: `${puesto}-caso-${indice + 1}`,
        puesto,
        tipo: "caso-tecnico",
        texto: caso.texto,
        datos: caso.datos
      });
    });
  });

  function preguntasDisponibles(puesto, tema) {
    return BANCO.filter(pregunta => {
      if (pregunta.puesto !== puesto) return false;

      if (tema === "personales") {
        return pregunta.tipo === "personal";
      }

      if (tema === "situacionales") {
        return pregunta.tipo === "situacional";
      }

      if (tema === "conocimientos") {
        return ["conocimiento", "caso-tecnico"].includes(pregunta.tipo);
      }

      return true;
    });
  }

  function seleccionarPreguntas(configuracion) {
    const disponibles = preguntasDisponibles(
      configuracion.puesto,
      configuracion.tema
    );

    /*
      En una práctica de conocimientos se incorpora un caso técnico.
      En una práctica mixta se procura incluir varios tipos.
    */
    let seleccion = [];

    const tiposPrioritarios =
      configuracion.tema === "mixta"
        ? ["personal", "situacional", "conocimiento", "caso-tecnico"]
        : configuracion.tema === "conocimientos"
          ? ["caso-tecnico"]
          : [];

    for (const tipo of tiposPrioritarios) {
      if (seleccion.length >= configuracion.cantidad) break;

      const pregunta = mezclar(
        disponibles.filter(item => item.tipo === tipo)
      )[0];

      if (pregunta) seleccion.push(pregunta);
    }

    const ids = new Set(seleccion.map(item => item.id));

    seleccion.push(
      ...mezclar(disponibles.filter(item => !ids.has(item.id)))
        .slice(0, configuracion.cantidad - seleccion.length)
    );

    /*
      Las preguntas se eligen aleatoriamente del banco preparado
      y después se ordenan por etapas de entrevista.
    */
    const vistas = new Set(datos.sesiones.flatMap(sesion =>
      sesion.respuestas.map(respuesta => respuesta.preguntaId)
    ));
    if (seleccion.length && seleccion.every(pregunta => vistas.has(pregunta.id))) {
      const tiposSeleccionados = new Set(seleccion.map(p => p.tipo));
      const candidatas = disponibles.filter(pregunta => !vistas.has(pregunta.id));
      const nueva = mezclar(candidatas.filter(p => tiposSeleccionados.has(p.tipo)))[0] ||
        mezclar(candidatas)[0];
      if (nueva) {
        const mismoTipo = seleccion.findIndex(p => p.tipo === nueva.tipo);
        const reemplazable = seleccion.findIndex(p =>
          seleccion.filter(item => item.tipo === p.tipo).length > 1
        );
        if (mismoTipo >= 0) seleccion[mismoTipo] = nueva;
        else if (reemplazable >= 0) seleccion[reemplazable] = nueva;
      }
    }

    const orden = {
      personal: 0,
      situacional: 1,
      conocimiento: 2,
      "caso-tecnico": 3
    };

    return seleccion.sort((a, b) => orden[a.tipo] - orden[b.tipo]);
  }

  /* --------------------------------------------------------
     3. ALMACENAMIENTO Y ESTADO
     -------------------------------------------------------- */

  function datosIniciales() {
    return {
      version: 1,
      perfil: {
        nombre: "",
        estudios: "",
        proyectos: "",
        experiencias: ""
      },
      sesiones: []
    };
  }

  let contenidoLeido = null;
  let almacenamientoBloqueado = false;

  function validarSesion(sesion) {
    const fechaValida = valor =>
      typeof valor === "string" && Number.isFinite(Date.parse(valor));
    return sesion &&
      ["pendiente", "finalizada"].includes(sesion.estado) &&
      typeof sesion.id === "string" &&
      fechaValida(sesion.creada) && fechaValida(sesion.actualizada) &&
      (sesion.estado !== "finalizada" || fechaValida(sesion.finalizada)) &&
      Object.hasOwn(PUESTOS, sesion.configuracion?.puesto) &&
      Object.hasOwn(TEMAS, sesion.configuracion?.tema) &&
      Object.hasOwn(CONTEXTOS, sesion.configuracion?.contexto) &&
      Array.isArray(sesion.preguntas) && sesion.preguntas.length > 0 &&
      sesion.preguntas.every(p => p && typeof p.id === "string" &&
        typeof p.texto === "string" && Object.hasOwn(TIPOS, p.tipo)) &&
      new Set(sesion.preguntas.map(p => p.id)).size === sesion.preguntas.length &&
      Number.isInteger(sesion.indice) && sesion.indice >= 0 &&
      sesion.indice < sesion.preguntas.length &&
      Number.isFinite(sesion.segundosActivos) &&
      sesion.reloj && Number.isFinite(sesion.reloj.restante) &&
      ["pensar", "responder", "agotado", "revision"].includes(sesion.reloj.fase) &&
      sesion.borradores && Object.values(sesion.borradores).every(validarTexto) &&
      Array.isArray(sesion.respuestas) && sesion.respuestas.every(r =>
        validarTexto(r) && sesion.preguntas.some(p => p.id === r.preguntaId) &&
        validarAnalisis(r.analisis) && Array.isArray(r.intentos) &&
        r.intentos.every(i => validarTexto(i) && validarAnalisis(i.analisis)));
  }

  function validarTexto(item) {
    return item && typeof item.texto === "string" && item.star &&
      ["situacion", "tarea", "accion", "resultado"].every(
        clave => typeof item.star[clave] === "string"
      );
  }

  function validarAnalisis(item) {
    return item && Number.isFinite(item.puntuacion) &&
      Array.isArray(item.indicadores) && item.indicadores.every(i =>
        i && Object.hasOwn(CRITERIOS, i.clave) && Number.isFinite(i.valor)) &&
      ["fortalezas", "mejoras", "recomendaciones", "apartados"].every(
        clave => Array.isArray(item[clave])
      ) && item.apartados.every(a => a && typeof a.clave === "string");
  }

  function cargarDatos() {
    try {
      const contenido = localStorage.getItem(CLAVE_DATOS);

      contenidoLeido = contenido;

      if (contenido === null) return datosIniciales();

      const datos = JSON.parse(contenido);

      if (
        datos.version !== 1 ||
        !Array.isArray(datos.sesiones) ||
        !datos.perfil || !datos.sesiones.every(validarSesion)
      ) {
        throw new Error("Formato de datos incompatible.");
      }

      for (const campo of Object.keys(datosIniciales().perfil)) {
        if (typeof datos.perfil[campo] !== "string") datos.perfil[campo] = "";
      }

      return datos;
    } catch (error) {
      almacenamientoBloqueado = true;
      console.error("No se pudieron cargar los datos:", error);

      setTimeout(() => {
        notificar(
          "No se pudieron recuperar los datos guardados. " +
          "Se conservarán los datos originales. Recarga para volver a intentar."
        );
      }, 0);

      return datosIniciales();
    }
  }

  let datos = cargarDatos();

  let vistaActual = "inicio";
  let sesionActiva = null;
  let resultadoActivo = null;
  let comparacionActiva = null;

  let configuracionPendiente = null;
  let preguntasPendientes = null;
  let preguntaElegida = null;

  let intervalo = null;
  let inicioActividad = null;
  let avisoMostrado = false;
  let temporizadorNotificacion = null;

  let escalaTexto = 100;

  function guardarDatos(candidato = datos) {
    if (almacenamientoBloqueado) {
      notificar("El guardado está bloqueado para conservar los datos originales.");
      return false;
    }

    try {
      if (localStorage.getItem(CLAVE_DATOS) !== contenidoLeido) {
        almacenamientoBloqueado = true;
        notificar("Otra pestaña cambió tus datos. Copia tu borrador y recarga.");
        return false;
      }

      const contenido = JSON.stringify(candidato);
      if (contenido !== contenidoLeido) {
        localStorage.setItem(CLAVE_DATOS, contenido);
        contenidoLeido = contenido;
      }
      return true;
    } catch (error) {
      console.error("No se pudieron guardar los datos:", error);

      notificar(
        "No se pudo guardar en este navegador. " +
        "El almacenamiento puede estar bloqueado o lleno."
      );

      return false;
    }
  }

  function persistirSesion(nueva) {
    const existe = datos.sesiones.some(sesion => sesion.id === nueva.id);
    const sesiones = existe
      ? datos.sesiones.map(sesion => sesion.id === nueva.id ? nueva : sesion)
      : [...datos.sesiones, nueva];
    const candidato = { ...datos, sesiones };

    if (!guardarDatos(candidato)) return false;

    datos = candidato;
    if (sesionActiva?.id === nueva.id) sesionActiva = nueva;
    return true;
  }

  function buscarSesion(id) {
    return datos.sesiones.find(sesion => sesion.id === id);
  }

  function respuestaGuardada(sesion, indice) {
    return sesion.respuestas.find(
      respuesta => respuesta.preguntaId === sesion.preguntas[indice].id
    );
  }

  function borradorVacio() {
    return {
      texto: "",
      star: {
        situacion: "",
        tarea: "",
        accion: "",
        resultado: ""
      }
    };
  }

  function borradorActual() {
    if (!sesionActiva) return borradorVacio();

    const pregunta = sesionActiva.preguntas[sesionActiva.indice];

    return (
      sesionActiva.borradores[pregunta.id] ||
      borradorVacio()
    );
  }

  function notificar(mensaje) {
    clearTimeout(temporizadorNotificacion);

    $("#notificacion").textContent = mensaje;
    $("#anuncio").textContent = mensaje;

    temporizadorNotificacion = setTimeout(() => {
      $("#notificacion").textContent = "";
      $("#anuncio").textContent = "";
    }, 6500);
  }

  /* --------------------------------------------------------
     4. NAVEGACIÓN
     -------------------------------------------------------- */

  function cerrarMenu() {
    $("#boton-menu").setAttribute("aria-expanded", "false");
    $("#navegacion-principal").classList.remove("navegacion--abierta");
  }

  function navegar(destino, actualizarURL = true) {
    const permitidas = $$("[data-vista]").map(vista => vista.id);

    if (!permitidas.includes(destino)) destino = "inicio";

    /*
      Si se abandona una práctica, se conserva el borrador
      y se detienen sus temporizadores.
    */
    if (
      vistaActual === "simulacion" &&
      destino !== "simulacion" &&
      sesionActiva?.estado === "pendiente"
    ) {
      capturarBorrador();
      detenerReloj();
      pausarActividad();

      if (!guardarDatos()) {
        iniciarActividad();
        iniciarReloj();
        if (!actualizarURL) {
          history.replaceState({ vista: vistaActual }, "", "#simulacion");
        }
        return false;
      }
    }

    if (destino === "simulacion" && sesionActiva?.estado !== "pendiente") {
      destino = "configuracion";
    }

    if (destino === "preparacion" && !configuracionPendiente) {
      destino = "configuracion";
    }

    $$("[data-vista]").forEach(vista => {
      const activa = vista.id === destino;

      vista.hidden = !activa;
      vista.classList.toggle("vista--activa", activa);
    });

    vistaActual = destino;

    $$(".navegacion__enlace").forEach(enlace => {
      if (enlace.dataset.navegar === destino) {
        enlace.setAttribute("aria-current", "page");
      } else {
        enlace.removeAttribute("aria-current");
      }
    });

    cerrarMenu();

    if (destino === "inicio") renderInicio();
    if (destino === "historial") renderHistorial();
    if (destino === "banco") renderBanco();
    if (destino === "perfil") rellenarPerfil();
    if (destino === "preparacion") {
      const guias = {
        practicas: "Prepara un ejemplo de un curso o proyecto y explica tu aporte.",
        "primer-empleo": "Elige una experiencia que demuestre una habilidad del puesto.",
        "con-experiencia": "Prepara un logro laboral y explica cómo mediste el resultado."
      };
      $("#guia-contexto").textContent = guias[configuracionPendiente.contexto];
    }
    if (destino === "comparacion") rellenarComparadores();
    if (destino === "resultados") renderResultados();

    if (destino === "simulacion") {
      renderSimulacion();
      iniciarActividad();
      iniciarReloj();
    }

    const fragmento = `#${destino}`;
    if (actualizarURL && location.hash !== fragmento) {
      history.pushState({ vista: destino }, "", fragmento);
    } else if (location.hash !== fragmento || history.state?.vista !== destino) {
      history.replaceState({ vista: destino }, "", fragmento);
    }

    const titulo = $(`#${destino} h1`);

    titulo?.focus();
    window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  }

  document.addEventListener("click", evento => {
    const ancla = evento.target.closest(
      'a[href="#contenido-principal"], a[href^="#campo-"]'
    );
    if (ancla && !evento.ctrlKey && !evento.metaKey && !evento.shiftKey &&
        !evento.altKey && evento.button === 0) {
      const destino = document.getElementById(ancla.hash.slice(1));
      if (destino) {
        evento.preventDefault();
        const control = destino.querySelector("input, textarea") || destino;
        control.focus({ preventScroll: true });
        control.scrollIntoView({ block: "start" });
      }
      return;
    }
    const enlace = evento.target.closest("[data-navegar]");

    if (
      !enlace ||
      evento.ctrlKey ||
      evento.metaKey ||
      evento.shiftKey ||
      evento.altKey ||
      evento.button !== 0
    ) {
      return;
    }

    evento.preventDefault();
    navegar(enlace.dataset.navegar);
  });

  $("#boton-menu").addEventListener("click", () => {
    const boton = $("#boton-menu");
    const abierto = boton.getAttribute("aria-expanded") === "true";

    boton.setAttribute("aria-expanded", String(!abierto));
    $("#navegacion-principal").classList.toggle("navegacion--abierta", !abierto);
  });

  document.addEventListener("keydown", evento => {
    if (
      evento.key === "Escape" &&
      $("#boton-menu").getAttribute("aria-expanded") === "true"
    ) {
      cerrarMenu();
      $("#boton-menu").focus();
    }
  });

  function destinoActual() {
    const fragmento = location.hash.slice(1);
    if (fragmento.startsWith("campo-")) return "perfil";
    if (fragmento === "contenido-principal") {
      return history.state?.vista || vistaActual;
    }
    return fragmento || "inicio";
  }

  window.addEventListener("popstate", () => {
    const destino = destinoActual();
    if (destino !== vistaActual) navegar(destino, false);
  });

  /* --------------------------------------------------------
     5. PERFIL
     -------------------------------------------------------- */

  function rellenarPerfil() {
    for (const campo of [
      "nombre",
      "estudios",
      "proyectos",
      "experiencias"
    ]) {
      $(`#${campo}`).value = datos.perfil[campo] || "";
    }
  }

  function actualizarPerfilInterfaz() {
    const perfil = datos.perfil;

    const iniciales = perfil.nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(parte => parte[0])
      .join("")
      .toUpperCase();

    $("#avatar-iniciales").textContent = iniciales || "UP";

    $("#titulo-inicio").textContent = perfil.nombre
      ? `¡Bienvenido de vuelta, ${perfil.nombre}!`
      : "¡Bienvenido a InterviewUP!";

    const tieneInformacion = [
      perfil.estudios,
      perfil.proyectos,
      perfil.experiencias
    ].some(texto => texto.trim());

    $("#estado-informacion-personal").textContent =
      tieneInformacion
        ? "Tu información está disponible para preparar respuestas."
        : "Aún no has registrado información personal.";
  }

  $("#formulario-perfil").addEventListener("submit", evento => {
    evento.preventDefault();

    const perfil = {};
    for (const campo of Object.keys(datosIniciales().perfil)) {
      perfil[campo] = $(`#${campo}`).value.trim();
    }

    const candidato = { ...datos, perfil };
    if (!guardarDatos(candidato)) {
      $("#mensaje-perfil").textContent = "Cambios sin guardar. Puedes reintentar.";
      return;
    }

    datos = candidato;
    actualizarPerfilInterfaz();
    $("#mensaje-perfil").textContent = "Información guardada en este navegador.";
    notificar("Tu información personal se guardó.");
  });

  /* --------------------------------------------------------
     6. CONFIGURACIÓN
     -------------------------------------------------------- */

  function leerConfiguracion() {
    const formulario = $("#formulario-configuracion");
    const valores = new FormData(formulario);

    const cantidad = valores.get("cantidad") === "personalizada"
      ? Number(valores.get("cantidadPersonalizada"))
      : Number(valores.get("cantidad"));

    return {
      puesto: valores.get("puesto") || "",
      contexto: valores.get("contexto") || "",
      tema: valores.get("tema") || "",
      cantidad
    };
  }

  function actualizarResumen() {
    const configuracion = leerConfiguracion();

    const personalizada =
      $("#formulario-configuracion input[name='cantidad']:checked")
        ?.value === "personalizada";

    $("#campo-cantidad-personalizada").hidden = !personalizada;
    $("#cantidad-personalizada").required = personalizada;
    $("#cantidad-personalizada").disabled = !personalizada;

    $("#resumen-puesto").textContent =
      PUESTOS[configuracion.puesto] || "Sin seleccionar";

    $("#resumen-contexto").textContent =
      CONTEXTOS[configuracion.contexto] || "Sin seleccionar";

    $("#resumen-tema").textContent =
      TEMAS[configuracion.tema] || "Sin seleccionar";

    $("#resumen-cantidad").textContent =
      Number.isInteger(configuracion.cantidad) &&
      configuracion.cantidad > 0
        ? configuracion.cantidad
        : "Sin definir";

    $("#resumen-duracion").textContent =
      configuracion.cantidad > 0
        ? `Aprox. ${Math.ceil(
            configuracion.cantidad *
            (TIEMPO_PENSAR + TIEMPO_RESPONDER) / 60
          )} min`
        : "Por calcular";

    if (configuracion.puesto && configuracion.tema) {
      const disponibles = preguntasDisponibles(
        configuracion.puesto,
        configuracion.tema
      ).length;

      $("#cantidad-personalizada").max = disponibles;

      $("#ayuda-cantidad").textContent =
        `Puedes seleccionar entre 1 y ${disponibles} preguntas.`;
    } else {
      $("#cantidad-personalizada").removeAttribute("max");
      $("#ayuda-cantidad").textContent = "Selecciona primero un puesto y un tema.";
    }

    $("#error-configuracion").hidden = true;
  }

  $("#formulario-configuracion").addEventListener(
    "input",
    actualizarResumen
  );

  $("#formulario-configuracion").addEventListener("submit", evento => {
    evento.preventDefault();

    const formulario = evento.currentTarget;

    if (!formulario.reportValidity()) return;

    const configuracion = leerConfiguracion();

    const disponibles = preguntasDisponibles(
      configuracion.puesto,
      configuracion.tema
    );

    if (
      !PUESTOS[configuracion.puesto] ||
      !CONTEXTOS[configuracion.contexto] ||
      !TEMAS[configuracion.tema] ||
      !Number.isInteger(configuracion.cantidad) ||
      configuracion.cantidad < 1 ||
      configuracion.cantidad > disponibles.length
    ) {
      $("#error-configuracion").textContent =
        "Revisa la configuración y selecciona una cantidad " +
        "de preguntas disponible.";

      $("#error-configuracion").hidden = false;
      return;
    }

    configuracionPendiente = configuracion;
    preguntasPendientes = preguntaElegida &&
      configuracion.cantidad === 1 &&
      disponibles.some(item => item.id === preguntaElegida.id)
      ? [{ ...preguntaElegida }]
      : null;
    preguntaElegida = null;

    $("#formulario-preparacion").reset();
    actualizarChecklist();

    navegar("preparacion");
  });

  $$("[data-practicar-tema]").forEach(boton => {
    boton.addEventListener("click", () => {
      preguntaElegida = null;
      const tema = boton.dataset.practicarTema;

      $(
        `#formulario-configuracion input[name="tema"][value="${tema}"]`
      ).checked = true;

      actualizarResumen();
      navegar("configuracion");
    });
  });

  /* --------------------------------------------------------
     7. CHECKLIST Y CREACIÓN DE SESIÓN
     -------------------------------------------------------- */

  function actualizarChecklist() {
    const marcados = $$(
      "#formulario-preparacion input[type='checkbox']:checked"
    ).length;

    $("#avance-checklist").textContent =
      `${marcados} de 5 elementos marcados.`;
  }

  $("#formulario-preparacion").addEventListener(
    "change",
    actualizarChecklist
  );

  function crearSesion(configuracion, preguntas, autoevaluacion) {
    return {
      id: crearId(),
      estado: "pendiente",
      creada: new Date().toISOString(),
      actualizada: new Date().toISOString(),
      finalizada: null,

      configuracion: { ...configuracion },
      preguntas: preguntas.map(pregunta => ({ ...pregunta })),

      indice: 0,
      respuestas: [],
      borradores: {},
      checklist: {},
      autoevaluacionInicial: Number(autoevaluacion),
      autoevaluacionFinal: null,

      segundosActivos: 0,

      reloj: {
        indice: 0,
        fase: "pensar",
        restante: TIEMPO_PENSAR,
        limite: null
      }
    };
  }

  $("#formulario-preparacion").addEventListener("submit", evento => {
    evento.preventDefault();

    if (!evento.currentTarget.reportValidity()) return;
    if (!configuracionPendiente) return;

    const valores = new FormData(evento.currentTarget);

    const preguntas = preguntasPendientes ||
      seleccionarPreguntas(configuracionPendiente);

    if (!preguntas.length) {
      notificar("No hay preguntas para esa configuración.");
      return;
    }

    const nueva = crearSesion(
      configuracionPendiente,
      preguntas,
      valores.get("autoevaluacionInicial")
    );

    $$("#formulario-preparacion input[type='checkbox']")
      .forEach(campo => {
        nueva.checklist[campo.name] = campo.checked;
      });

    if (!persistirSesion(nueva)) return;

    sesionActiva = nueva;
    configuracionPendiente = null;
    preguntasPendientes = null;
    navegar("simulacion");
  });

  /* --------------------------------------------------------
     8. TIEMPO ACTIVO Y TEMPORIZADORES
     -------------------------------------------------------- */

  function iniciarActividad() {
    if (!inicioActividad && !document.hidden) {
      inicioActividad = Date.now();
    }
  }

  function pausarActividad() {
    if (!sesionActiva || !inicioActividad) return;

    sesionActiva.segundosActivos +=
      (Date.now() - inicioActividad) / 1000;

    inicioActividad = null;
  }

  function detenerReloj() {
    clearInterval(intervalo);
    intervalo = null;

    const reloj = sesionActiva?.reloj;

    if (reloj?.limite) {
      reloj.restante = Math.max(
        0,
        (reloj.limite - Date.now()) / 1000
      );

      reloj.limite = null;
    }
  }

  function habilitarRespuesta(habilitada) {
    [
      "#respuesta-actual",
      "#star-situacion",
      "#star-tarea",
      "#star-accion",
      "#star-resultado",
      "#usar-estructura-star",
      "#guardar-respuesta"
    ].forEach(selector => {
      $(selector).disabled = !habilitada;
    });
  }

  function actualizarRelojInterfaz() {
    const reloj = sesionActiva.reloj;
    const pensando = reloj.fase === "pensar";

    $("#titulo-tiempo").textContent = pensando
      ? "Tiempo para pensar"
      : "Tiempo de respuesta";

    $("#instruccion-tiempo").textContent = pensando
      ? "Organiza tus ideas antes de comenzar."
      : "Desarrolla tu respuesta con ejemplos concretos.";

    $("#temporizador").textContent =
      formatoReloj(reloj.restante);

    $("#comenzar-respuesta").hidden = !pensando;

    habilitarRespuesta(!pensando);

    if (reloj.fase === "revision") {
      $("#titulo-tiempo").textContent = "Respuesta guardada";
      $("#instruccion-tiempo").textContent =
        "Puedes editarla y volver a guardarla antes de continuar.";

      $("#temporizador").textContent = "Revisión";
    }

    if (reloj.fase === "agotado") {
      $("#aviso-tiempo").textContent =
        "El tiempo recomendado terminó. " +
        "Puedes completar y guardar tu respuesta.";
    }
  }

  function comenzarRespuesta(enfocar = false) {
    if (sesionActiva?.estado !== "pendiente" ||
        sesionActiva.reloj.fase !== "pensar") return;
    detenerReloj();

    sesionActiva.reloj.fase = "responder";
    sesionActiva.reloj.restante = TIEMPO_RESPONDER;

    $("#aviso-tiempo").textContent = "";
    avisoMostrado = false;

    actualizarRelojInterfaz();
    iniciarReloj();

    guardarDatos();

    if (enfocar) $("#respuesta-actual").focus();
  }

  function iniciarReloj() {
    if (sesionActiva?.estado !== "pendiente" || document.hidden) return;

    const reloj = sesionActiva.reloj;

    if (!["pensar", "responder"].includes(reloj.fase)) {
      actualizarRelojInterfaz();
      return;
    }

    if (intervalo) return;

    reloj.limite = Date.now() + reloj.restante * 1000;

    intervalo = setInterval(() => {
      reloj.restante = Math.max(
        0,
        (reloj.limite - Date.now()) / 1000
      );

      const lectura = formatoReloj(reloj.restante);
      if ($("#temporizador").textContent !== lectura) {
        $("#temporizador").textContent = lectura;
      }

      if (
        reloj.fase === "responder" &&
        reloj.restante <= 30 &&
        reloj.restante > 0 &&
        !avisoMostrado
      ) {
        avisoMostrado = true;

        $("#aviso-tiempo").textContent =
          "Quedan 30 segundos o menos del tiempo recomendado.";
      }

      if (reloj.restante > 0) return;

      if (reloj.fase === "pensar") {
        comenzarRespuesta(false);

        $("#aviso-tiempo").textContent =
          "Terminó la preparación. Ya puedes escribir tu respuesta.";
      } else {
        detenerReloj();

        reloj.fase = "agotado";
        reloj.restante = 0;

        actualizarRelojInterfaz();
        capturarBorrador();
        guardarDatos();
      }
    }, 250);

    actualizarRelojInterfaz();
  }

  $("#comenzar-respuesta").addEventListener("click", () => {
    comenzarRespuesta(true);
  });

  /* --------------------------------------------------------
     9. SIMULACIÓN Y BORRADORES
     -------------------------------------------------------- */

  function renderExperiencias() {
    const campos = [
      ["Estudios", datos.perfil.estudios],
      ["Proyectos", datos.perfil.proyectos],
      ["Experiencias", datos.perfil.experiencias]
    ].filter(([, texto]) => texto.trim());

    $("#experiencias-sesion").innerHTML = campos.length
      ? campos.map(([titulo, texto]) => `
          <h3>${escapar(titulo)}</h3>
          <p style="white-space: pre-wrap">${escapar(texto)}</p>
        `).join("")
      : "<p>Todavía no has registrado experiencias.</p>";
  }

  function capturarBorrador() {
    if (
      !sesionActiva ||
      vistaActual !== "simulacion" ||
      sesionActiva.estado !== "pendiente"
    ) {
      return;
    }

    const pregunta = sesionActiva.preguntas[sesionActiva.indice];

    sesionActiva.borradores[pregunta.id] = {
      texto: $("#respuesta-actual").value,
      star: {
        situacion: $("#star-situacion").value,
        tarea: $("#star-tarea").value,
        accion: $("#star-accion").value,
        resultado: $("#star-resultado").value
      }
    };

    sesionActiva.actualizada = new Date().toISOString();
  }

  function respuestaModificada() {
    if (!sesionActiva) return false;

    const guardada = respuestaGuardada(
      sesionActiva,
      sesionActiva.indice
    );

    const borrador = borradorActual();

    if (!guardada) {
      return Boolean(
        borrador.texto.trim() ||
        Object.values(borrador.star).some(texto => texto.trim())
      );
    }

    return (
      borrador.texto.trim() !== guardada.texto ||
      Object.keys(borrador.star).some(
        clave => borrador.star[clave].trim() !== guardada.star[clave]
      )
    );
  }

  function actualizarBotonesSesion() {
    if (!sesionActiva) return;

    const guardada = respuestaGuardada(
      sesionActiva,
      sesionActiva.indice
    );

    const ultima =
      sesionActiva.indice === sesionActiva.preguntas.length - 1;

    $("#siguiente-pregunta").disabled =
      !guardada || respuestaModificada();

    $("#siguiente-pregunta").textContent = ultima
      ? "Revisar finalización"
      : "Siguiente pregunta →";

    $("#finalizar-practica").disabled =
      sesionActiva.respuestas.length !==
        sesionActiva.preguntas.length ||
      respuestaModificada();
  }

  function renderSimulacion() {
    if (!sesionActiva) return;

    const sesion = sesionActiva;
    const configuracion = sesion.configuracion;
    const pregunta = sesion.preguntas[sesion.indice];

    $("#sesion-puesto").textContent = PUESTOS[configuracion.puesto];
    $("#sesion-contexto").textContent = CONTEXTOS[configuracion.contexto];
    $("#sesion-tema").textContent = TEMAS[configuracion.tema];
    $("#sesion-cantidad").textContent = sesion.preguntas.length;
    $("#sesion-autoevaluacion").textContent =
      NIVELES[sesion.autoevaluacionInicial] || "Sin registrar";

    $("#simulacion-descripcion").textContent =
      `${PUESTOS[configuracion.puesto]} · ` +
      `${CONTEXTOS[configuracion.contexto]}`;

    $("#contador-preguntas").textContent =
      `Pregunta ${sesion.indice + 1} de ${sesion.preguntas.length}`;

    $("#pregunta-numero").textContent =
      `Pregunta ${sesion.indice + 1}`;

    $("#pregunta-categoria").textContent = TIPOS[pregunta.tipo];
    $("#pregunta-actual").textContent = pregunta.texto;

    $("#pregunta-instruccion").textContent =
      ["personal", "situacional"].includes(pregunta.tipo)
        ? "Explica el contexto, tu responsabilidad, tus acciones y el resultado."
        : "Explica tu razonamiento, los pasos y cómo comprobarías tu propuesta.";

    $("#caso-tecnico").hidden = !pregunta.datos;
    $("#contenido-caso-tecnico").textContent = pregunta.datos || "";

    const borrador = borradorActual();

    $("#respuesta-actual").value = borrador.texto;

    for (const clave of ["situacion", "tarea", "accion", "resultado"]) {
      $(`#star-${clave}`).value = borrador.star[clave];
    }

    $("#contador-palabras").textContent =
      `${contarPalabras(borrador.texto)} palabras`;

    $("#error-respuesta").hidden = true;
    $("#respuesta-actual").removeAttribute("aria-invalid");

    $("#aviso-tiempo").textContent = "";

    actualizarRelojInterfaz();
    renderExperiencias();
    renderAvance();

    const respuesta = respuestaGuardada(sesion, sesion.indice);

    renderAnalisis(respuesta?.analisis || null);
    actualizarBotonesSesion();
  }

  function renderAvance() {
    const sesion = sesionActiva;
    const respondidas = sesion.respuestas.length;
    const total = sesion.preguntas.length;

    $("#progreso-sesion").max = total;
    $("#progreso-sesion").value = respondidas;

    $("#progreso-sesion").textContent =
      `${respondidas} de ${total}`;

    $("#estado-avance").textContent =
      `${respondidas} respondidas · ${total - respondidas} pendientes`;

    $("#lista-respuestas-sesion").innerHTML =
      sesion.preguntas.map((pregunta, indice) => {
        const respondida = respuestaGuardada(sesion, indice);

        return `
          <li>
            ${
              respondida
                ? `
                  <button
                    class="boton boton--texto"
                    type="button"
                    data-repetir-pregunta="${indice}"
                  >
                    Pregunta ${indice + 1}: repetir
                  </button>
                  <span class="etiqueta etiqueta--positiva">
                    Respondida
                  </span>
                `
                : `
                  <span>Pregunta ${indice + 1}</span>
                  <span class="etiqueta">Pendiente</span>
                `
            }
          </li>
        `;
      }).join("");
  }

  function actualizarBorrador() {
    capturarBorrador();

    $("#contador-palabras").textContent =
      `${contarPalabras($("#respuesta-actual").value)} palabras`;

    actualizarBotonesSesion();


  }

  [
    "#respuesta-actual",
    "#star-situacion",
    "#star-tarea",
    "#star-accion",
    "#star-resultado"
  ].forEach(selector => {
    $(selector).addEventListener("input", actualizarBorrador);
  });

  $("#usar-estructura-star").addEventListener("click", () => {
    const apartados = [
      ["Situación", $("#star-situacion").value.trim()],
      ["Tarea", $("#star-tarea").value.trim()],
      ["Acción", $("#star-accion").value.trim()],
      ["Resultado", $("#star-resultado").value.trim()]
    ];

    const texto = apartados
      .filter(([, contenido]) => contenido)
      .map(([titulo, contenido]) => `${titulo}: ${contenido}`)
      .join("\n\n");

    if (!texto) {
      notificar("Completa al menos un apartado STAR.");
      return;
    }

    if (
      $("#respuesta-actual").value.trim() &&
      !window.confirm(
        "Esta acción reemplazará el texto actual por los apartados STAR. " +
        "¿Deseas continuar?"
      )
    ) {
      return;
    }

    if (texto.length > $("#respuesta-actual").maxLength) {
      notificar("Los apartados superan el límite de la respuesta. Reduce el texto antes de copiarlos.");
      return;
    }
    $("#respuesta-actual").value = texto;
    actualizarBorrador();
    $("#respuesta-actual").focus();
  });

  /* --------------------------------------------------------
     10. REVISIÓN ORIENTATIVA
     -------------------------------------------------------- */

  function analizarRespuesta(pregunta, borrador) {
    const texto = borrador.texto.trim();
    const normalizado = normalizar(texto);
    const palabras = contarPalabras(texto);

    const senales = [
      {
        nombre: "contexto",
        encontrado:
          /\b(situacion|contexto|proyecto|curso|equipo|problema|caso)\b/
            .test(normalizado)
      },
      {
        nombre: "objetivo o responsabilidad",
        encontrado:
          /\b(tarea|objetivo|responsabilidad|debia|necesitaba|requisito|buscaba)\b/
            .test(normalizado)
      },
      {
        nombre: "acción o procedimiento",
        encontrado:
          /\b(accion|hice|realice|implemente|analice|revise|verifique|probaria|revisaria|primero|paso)\b/
            .test(normalizado)
      },
      {
        nombre: "resultado o comprobación",
        encontrado:
          /\b(resultado|logre|logramos|consegui|aprendi|conclusion|comprobar|validar|prueba|verificar)\b/
            .test(normalizado)
      }
    ];

    const organizacion =
      senales.filter(senal => senal.encontrado).length * 25;

    const esSTAR = ["personal", "situacional"].includes(pregunta.tipo);

    const contenidosSTAR = Object.values(borrador.star).map(
      valor => normalizar(valor.trim()).replace(/\s+/g, " ")
    );
    const apartados = Object.entries(borrador.star).map(
      ([clave, contenido]) => ({
        clave,
        completo: contarPalabras(contenido) >= 3 &&
          contenidosSTAR.filter(valor =>
            valor === normalizar(contenido.trim()).replace(/\s+/g, " ")
          ).length === 1
      })
    );

    const indicadores = [
      { clave: "organizacion", valor: organizacion }
    ];

    if (esSTAR) {
      indicadores.push({
        clave: "star",
        valor: apartados.filter(item => item.completo).length * 25
      });
    }

    const fortalezas = [];
    const mejoras = [];
    const recomendaciones = [];

    const detectadas = senales
      .filter(senal => senal.encontrado)
      .map(senal => senal.nombre);

    const faltantes = senales
      .filter(senal => !senal.encontrado)
      .map(senal => senal.nombre);

    if (detectadas.length) {
      fortalezas.push(
        `Se encontraron señales escritas de: ${detectadas.join(", ")}.`
      );
    }

    if (faltantes.length) {
      mejoras.push(
        `No se detectaron señales explícitas de: ${faltantes.join(", ")}. ` +
        "Revisa si esos elementos están suficientemente explicados."
      );
    }

    if (esSTAR) {
      const incompletos = apartados
        .filter(item => !item.completo)
        .map(item => item.clave);

      if (incompletos.length) {
        recomendaciones.push(
          `Completa o amplía los campos STAR: ${incompletos.join(", ")}.`
        );
      } else {
        fortalezas.push(
          "Los cuatro campos STAR tienen textos distintos de al menos tres palabras."
        );
      }

      recomendaciones.push(
        "Revisa que se entienda tu aporte individual y el resultado del ejemplo."
      );
    } else {
      recomendaciones.push(
        "Contrasta la exactitud técnica con materiales del curso o una referencia especializada."
      );

      recomendaciones.push(
        "Explica los pasos de tu propuesta y cómo comprobarías que funciona."
      );
    }

    if (palabras >= 80) {
      recomendaciones.push(
        "Comprueba que cada frase aporte información: una respuesta más larga no es necesariamente mejor."
      );
    }

    const puntuacion = Math.round(
      indicadores.reduce((suma, indicador) => suma + indicador.valor, 0) /
      indicadores.length
    );

    return {
      versionReglas: 2,
      puntuacion,
      indicadores,
      fortalezas,
      mejoras,
      recomendaciones,
      apartados: esSTAR ? apartados : []
    };
  }

  function indicadorHTML(clave, valor, detalle = "") {
    return `
      <div class="indicador">
        <div class="indicador__cabecera">
          <span class="indicador__nombre">
            ${escapar(CRITERIOS[clave].nombre)}
          </span>
          <span class="indicador__valor">${valor}/100</span>
        </div>

        <div class="indicador__barra" aria-hidden="true">
          <span
            class="indicador__relleno"
            style="--porcentaje: ${valor}%"
          ></span>
        </div>

        ${
          detalle
            ? `<p class="indicador__detalle">${escapar(detalle)}</p>`
            : ""
        }
      </div>
    `;
  }

  function criteriosHTML(claves) {
    return unicos(claves).map(clave => `
      <p>
        <strong>${escapar(CRITERIOS[clave].nombre)}:</strong>
        ${escapar(CRITERIOS[clave].descripcion)}
      </p>
    `).join("");
  }

  function renderAnalisis(analisis) {
    $("#estado-analisis").textContent =
      analisis ? "Revisada" : "Sin revisar";

    if (!analisis) {
      $("#analisis-respuesta").innerHTML = `
        <p class="estado-vacio">
          Guarda una respuesta para consultar los comentarios
          y criterios de revisión.
        </p>
      `;

      $("#criterios-analisis").innerHTML =
        "<p>La revisión utiliza reglas explícitas sobre el texto " +
        "y los campos STAR. No verifica la exactitud técnica.</p>";

      return;
    }

    $("#analisis-respuesta").innerHTML = `
      <p>
        <strong>${analisis.puntuacion}/100</strong>
        · Índice orientativo de las reglas aplicadas
      </p>

      ${analisis.indicadores.map(
        indicador => indicadorHTML(indicador.clave, indicador.valor)
      ).join("")}

      <section class="tarjeta tarjeta--positiva">
        <h3>Aspectos identificados</h3>
        <ul>${listaHTML(analisis.fortalezas)}</ul>
      </section>

      <section class="tarjeta tarjeta--advertencia">
        <h3>Aspectos para revisar</h3>
        <ul>${
          listaHTML(analisis.mejoras.length
            ? analisis.mejoras
            : ["Revisa manualmente la claridad y pertinencia del contenido."])
        }</ul>
      </section>

      <section>
        <h3>Recomendaciones</h3>
        <ul>${listaHTML(analisis.recomendaciones)}</ul>
      </section>
    `;

    $("#criterios-analisis").innerHTML = criteriosHTML(
      analisis.indicadores.map(item => item.clave)
    );
  }

  /* --------------------------------------------------------
     11. GUARDAR, REPETIR Y AVANZAR RESPUESTAS
     -------------------------------------------------------- */

  function guardarRespuesta() {
    if (sesionActiva?.estado !== "pendiente" ||
        sesionActiva.reloj.fase === "pensar") return false;

    capturarBorrador();

    const borrador = borradorActual();
    const texto = borrador.texto.trim();

    if (!texto) {
      $("#error-respuesta").textContent =
        "Escribe una respuesta antes de guardarla.";

      $("#error-respuesta").hidden = false;
      $("#respuesta-actual").setAttribute("aria-invalid", "true");
      $("#respuesta-actual").focus();

      return false;
    }

    $("#error-respuesta").hidden = true;
    $("#respuesta-actual").removeAttribute("aria-invalid");

    const pregunta = sesionActiva.preguntas[sesionActiva.indice];
    const anterior = respuestaGuardada(
      sesionActiva,
      sesionActiva.indice
    );

    const star = Object.fromEntries(
      Object.entries(borrador.star).map(
        ([clave, valor]) => [clave, valor.trim()]
      )
    );

    const respuesta = {
      preguntaId: pregunta.id,
      texto,
      star,
      fecha: new Date().toISOString(),
      analisis: analizarRespuesta(pregunta, { texto, star }),
      intentos: anterior ? [...anterior.intentos] : []
    };

    const cambioReal = !anterior || anterior.texto !== texto ||
      Object.keys(star).some(clave => anterior.star[clave] !== star[clave]);

    if (anterior && cambioReal) {
      respuesta.intentos.push({
        texto: anterior.texto,
        star: { ...anterior.star },
        fecha: anterior.fecha,
        analisis: anterior.analisis
      });
    }

    const indice = sesionActiva.respuestas.findIndex(
      item => item.preguntaId === pregunta.id
    );

    const respuestas = [...sesionActiva.respuestas];
    if (indice === -1) respuestas.push(respuesta);
    else if (cambioReal) respuestas[indice] = respuesta;

    const nueva = {
      ...sesionActiva,
      respuestas,
      borradores: { ...sesionActiva.borradores, [pregunta.id]: { texto, star } },
      reloj: { ...sesionActiva.reloj, fase: "revision", limite: null },
      actualizada: new Date().toISOString()
    };

    if (!persistirSesion(nueva)) return false;

    clearInterval(intervalo);
    intervalo = null;
    actualizarRelojInterfaz();
    renderAnalisis(respuestas[indice === -1 ? respuestas.length - 1 : indice].analisis);
    renderAvance();
    actualizarBotonesSesion();
    notificar("Respuesta guardada. Puedes revisar los comentarios.");

    return true;
  }

  $("#formulario-respuesta").addEventListener("submit", evento => {
    evento.preventDefault();
    guardarRespuesta();
  });

  function cambiarPregunta(indice, repetir = false) {
    if (sesionActiva?.estado !== "pendiente" ||
        !Number.isInteger(indice) || !sesionActiva.preguntas[indice]) return;
    capturarBorrador();

    if (
      respuestaModificada() &&
      !window.confirm(
        "Tu texto se conservará como borrador, pero aún no está " +
        "registrado como respuesta. ¿Deseas cambiar de pregunta?"
      )
    ) {
      return;
    }

    detenerReloj();

    sesionActiva.indice = indice;

    const guardada = respuestaGuardada(sesionActiva, indice);

    sesionActiva.reloj = {
      indice,
      fase: repetir || !guardada ? "pensar" : "revision",
      restante: TIEMPO_PENSAR,
      limite: null
    };

    avisoMostrado = false;

    renderSimulacion();
    iniciarReloj();
    guardarDatos();

    $("#pregunta-actual").focus();

    if (repetir) {
      notificar(
        "Puedes mejorar la respuesta anterior. " +
        "El intento previo se conservará cuando guardes el nuevo."
      );
    }
  }

  $("#lista-respuestas-sesion").addEventListener("click", evento => {
    const boton = evento.target.closest("[data-repetir-pregunta]");

    if (!boton) return;

    cambiarPregunta(Number(boton.dataset.repetirPregunta), true);
  });

  $("#siguiente-pregunta").addEventListener("click", () => {
    if (sesionActiva?.estado !== "pendiente") return;

    capturarBorrador();

    if (
      !respuestaGuardada(sesionActiva, sesionActiva.indice) ||
      respuestaModificada()
    ) {
      notificar("Guarda tu respuesta actual antes de continuar.");
      return;
    }

    if (sesionActiva.indice < sesionActiva.preguntas.length - 1) {
      cambiarPregunta(sesionActiva.indice + 1);
    } else {
      solicitarFinalizacion();
    }
  });

  /* --------------------------------------------------------
     12. GUARDAR Y CONTINUAR PRÁCTICAS
     -------------------------------------------------------- */

  function guardarPendiente() {
    if (sesionActiva?.estado !== "pendiente") return;

    if (navegar("historial")) {
      notificar("Práctica pendiente guardada. Puedes continuarla después.");
    }
  }

  $("#guardar-pendiente").addEventListener("click", guardarPendiente);
  $("#guardar-salir").addEventListener("click", guardarPendiente);

  function continuarSesion(id) {
    const sesion = buscarSesion(id);

    if (!sesion || sesion.estado !== "pendiente") return;

    if (
      vistaActual === "simulacion" &&
      sesionActiva &&
      sesionActiva.id !== id
    ) {
      capturarBorrador();
      detenerReloj();
      pausarActividad();
      guardarDatos();
    }

    const pendiente = sesion.preguntas.findIndex(
      (_, indice) => !respuestaGuardada(sesion, indice)
    );

    if (pendiente !== -1 && respuestaGuardada(sesion, sesion.indice)) {
      sesion.indice = pendiente;
      sesion.reloj = {
        indice: pendiente, fase: "pensar", restante: TIEMPO_PENSAR, limite: null
      };
    }

    sesionActiva = sesion;
    avisoMostrado = false;

    navegar("simulacion");
  }

  $("#continuar-pendiente-inicio").addEventListener("click", () => {
    const pendiente = [...datos.sesiones]
      .filter(sesion => sesion.estado === "pendiente")
      .sort((a, b) => b.actualizada.localeCompare(a.actualizada))[0];

    if (pendiente) continuarSesion(pendiente.id);
  });

  /* --------------------------------------------------------
     13. FINALIZACIÓN
     -------------------------------------------------------- */

  function solicitarFinalizacion() {
    if (sesionActiva?.estado !== "pendiente") return;

    capturarBorrador();

    if (
      sesionActiva.respuestas.length !==
      sesionActiva.preguntas.length
    ) {
      notificar("Responde y guarda todas las preguntas antes de finalizar.");
      return;
    }

    const cambiosPendientes = sesionActiva.preguntas.some((pregunta, indice) => {
      const borrador = sesionActiva.borradores[pregunta.id];
      const guardada = respuestaGuardada(sesionActiva, indice);
      return borrador && guardada && (borrador.texto.trim() !== guardada.texto ||
        Object.keys(guardada.star).some(clave =>
          borrador.star[clave].trim() !== guardada.star[clave]));
    });
    if (cambiosPendientes) {
      notificar("Revisa y guarda los borradores pendientes antes de finalizar.");
      return;
    }

    $("#resumen-finalizacion").textContent =
      `${sesionActiva.respuestas.length} respuestas guardadas.`;

    $("#dialogo-finalizar").returnValue = "";
    $("#dialogo-finalizar").showModal();
  }

  $("#finalizar-practica").addEventListener(
    "click",
    solicitarFinalizacion
  );

  $("#dialogo-finalizar").addEventListener("close", () => {
    if ($("#dialogo-finalizar").returnValue !== "confirmar") return;
    if (sesionActiva?.estado !== "pendiente" ||
        vistaActual !== "simulacion") return;

    detenerReloj();
    pausarActividad();
    const fecha = new Date().toISOString();
    const finalizada = {
      ...sesionActiva, estado: "finalizada", finalizada: fecha, actualizada: fecha
    };

    if (!persistirSesion(finalizada)) {
      iniciarActividad();
      iniciarReloj();
      return;
    }

    resultadoActivo = finalizada.id;
    sesionActiva = null;
    navegar("resultados");
    notificar("Práctica finalizada y guardada.");
  });

  /* --------------------------------------------------------
     14. RESULTADOS
     -------------------------------------------------------- */

  function firmaIndicadores(sesion) {
    return JSON.stringify(unicos(sesion.respuestas.map(respuesta => {
      const analisis = respuesta.analisis;
      return [analisis.versionReglas, ...analisis.indicadores.map(i => i.clave).sort()].join(":");
    })).sort());
  }

  function sonComparables(a, b) {
    return a.configuracion.tema === b.configuracion.tema &&
      firmaIndicadores(a) === firmaIndicadores(b);
  }

  function resumenSesion(sesion) {
    const revisiones = sesion.respuestas
      .map(respuesta => respuesta.analisis);

    const grupos = {};

    revisiones.forEach(analisis => {
      analisis.indicadores.forEach(indicador => {
        grupos[indicador.clave] ||= [];
        grupos[indicador.clave].push(indicador.valor);
      });
    });

    const indicadores = Object.entries(grupos).map(
      ([clave, valores]) => ({
        clave,
        valor: Math.round(
          valores.reduce((suma, valor) => suma + valor, 0) /
          valores.length
        )
      })
    );

    return {
      puntuacion: revisiones.length
        ? Math.round(
            revisiones.reduce(
              (suma, analisis) => suma + analisis.puntuacion,
              0
            ) / revisiones.length
          )
        : 0,

      indicadores,

      fortalezas: unicos(
        revisiones.flatMap(analisis => analisis.fortalezas)
      ),

      mejoras: unicos(
        revisiones.flatMap(analisis => analisis.mejoras)
      ),

      recomendaciones: unicos(
        revisiones.flatMap(analisis => analisis.recomendaciones)
      )
    };
  }

  function detalleRespuestaHTML(sesion, pregunta, indice) {
    const respuesta = sesion.respuestas.find(
      item => item.preguntaId === pregunta.id
    );

    if (!respuesta) return "";

    const analisis = respuesta.analisis;

    const camposSTAR = analisis.apartados.length
      ? `
        <h4>Apartados STAR registrados</h4>

        <div class="star-resumen">
          ${analisis.apartados.map(apartado => `
            <div class="star-resumen__elemento">
              <strong>${escapar(apartado.clave)}</strong>
              <span>
                ${apartado.completo ? "Completado" : "Por desarrollar"}
              </span>
            </div>
          `).join("")}
        </div>

        ${Object.entries(respuesta.star)
          .filter(([, contenido]) => contenido)
          .map(([clave, contenido]) => `
            <p>
              <strong>${escapar(clave)}:</strong>
              ${escapar(contenido)}
            </p>
          `).join("")}
      `
      : "";

    const intentos = respuesta.intentos.length
      ? `
        <details class="acordeon">
          <summary>
            Ver ${respuesta.intentos.length} intento(s) anterior(es)
          </summary>

          ${respuesta.intentos.map((intento, numero) => `
            <article>
              <h4>Intento ${numero + 1}</h4>
              <p class="respuesta-detalle__texto">
                ${escapar(intento.texto)}
              </p>
            </article>
          `).join("")}
        </details>
      `
      : "";

    return `
      <article class="respuesta-detalle">
        <h3>Pregunta ${indice + 1}: ${escapar(pregunta.texto)}</h3>

        <p class="respuesta-detalle__texto">${escapar(respuesta.texto)}</p>

        ${camposSTAR}

        <h4>Aspectos para revisar</h4>

        <ul>${
          listaHTML(
            analisis.mejoras.length
              ? analisis.mejoras
              : ["Revisa manualmente que el contenido responda a la pregunta."]
          )
        }</ul>

        <h4>Recomendaciones</h4>
        <ul>${listaHTML(analisis.recomendaciones)}</ul>

        <details class="acordeon">
          <summary>Consultar criterios y motivo de la revisión</summary>
          ${criteriosHTML(
            analisis.indicadores.map(item => item.clave)
          )}
        </details>

        ${intentos}
      </article>
    `;
  }

  function obtenerResultadoActivo() {
    let sesion = buscarSesion(resultadoActivo);

    if (!sesion || sesion.estado !== "finalizada") {
      sesion = [...datos.sesiones]
        .filter(item => item.estado === "finalizada")
        .sort((a, b) => b.finalizada.localeCompare(a.finalizada))[0];
    }

    resultadoActivo = sesion?.id || null;
    return sesion;
  }

  function renderResultados() {
    const sesion = obtenerResultadoActivo();

    $("#resultados-vacios").hidden = Boolean(sesion);
    $("#contenido-resultados").hidden = !sesion;

    if (!sesion) return;

    const resumen = resumenSesion(sesion);

    $("#resultado-puesto").textContent =
      PUESTOS[sesion.configuracion.puesto];

    $("#resultado-tema").textContent =
      TEMAS[sesion.configuracion.tema];

    $("#resultado-duracion").textContent =
      formatoDuracion(sesion.segundosActivos);

    $("#resultado-preguntas").textContent =
      sesion.respuestas.length;

    $("#resultado-puntuacion").textContent = resumen.puntuacion;

    $("#resultado-descripcion").textContent =
      "Índice orientativo de desarrollo y organización explícita. " +
      "No mide la corrección técnica.";

    $("#resultado-indicadores").innerHTML =
      resumen.indicadores.map(indicador =>
        indicadorHTML(indicador.clave, indicador.valor)
      ).join("");

    $("#resultado-fortalezas").innerHTML =
      listaHTML(resumen.fortalezas);

    $("#resultado-mejoras").innerHTML =
      listaHTML(
        resumen.mejoras.length
          ? resumen.mejoras
          : ["Revisa la pertinencia, claridad y precisión de tus ejemplos."]
      );

    $("#resultado-recomendaciones").innerHTML =
      listaHTML(resumen.recomendaciones);

    $("#resultado-respuestas").innerHTML =
      sesion.preguntas.map((pregunta, indice) =>
        detalleRespuestaHTML(sesion, pregunta, indice)
      ).join("");

    $("#resultado-criterios").innerHTML =
      criteriosHTML(resumen.indicadores.map(item => item.clave)) +
      "<p>El índice general promedia las puntuaciones de las respuestas. " +
      "Cada respuesta promedia sus indicadores aplicables. " +
      "No se analizan voz, pausas, lenguaje corporal ni veracidad.</p>";

    $("#formulario-autoevaluacion-final").reset();

    if (sesion.autoevaluacionFinal) {
      $(
        `input[name="autoevaluacionFinal"]` +
        `[value="${sesion.autoevaluacionFinal}"]`
      ).checked = true;
    }

    $("#resultado-autoevaluacion").textContent =
      sesion.autoevaluacionFinal
        ? `Tu valoración: ${NIVELES[sesion.autoevaluacionFinal]}.`
        : "Todavía no has registrado tu valoración final.";
  }

  $("#formulario-autoevaluacion-final").addEventListener(
    "submit",
    evento => {
      evento.preventDefault();

      if (!evento.currentTarget.reportValidity()) return;

      const sesion = obtenerResultadoActivo();
      if (!sesion) return;

      const nivel = Number(
        new FormData(evento.currentTarget).get("autoevaluacionFinal")
      );
      if (!Object.hasOwn(NIVELES, nivel) ||
          !persistirSesion({ ...sesion, autoevaluacionFinal: nivel })) return;

      $("#resultado-autoevaluacion").textContent =
        `Tu valoración: ${NIVELES[nivel]}.`;

      notificar("Autoevaluación guardada.");
    }
  );

  function prepararRepeticion(id) {
    const original = buscarSesion(id);

    if (!original || original.estado !== "finalizada") return;

    configuracionPendiente = { ...original.configuracion };
    preguntasPendientes = original.preguntas.map(
      pregunta => ({ ...pregunta })
    );

    $("#formulario-preparacion").reset();
    actualizarChecklist();

    navegar("preparacion");

    notificar(
      "Se iniciará una práctica nueva con las mismas preguntas. " +
      "La práctica anterior se conservará."
    );
  }

  $("#repetir-practica-resultados").addEventListener("click", () => {
    prepararRepeticion(resultadoActivo);
  });

  $("#comparar-desde-resultados").addEventListener("click", () => {
    navegar("comparacion");

    if (resultadoActivo) {
      $("#intento-b").value = resultadoActivo;
    }
  });

  /* --------------------------------------------------------
     15. INICIO E HISTORIAL
     -------------------------------------------------------- */

  function renderInicio() {
    actualizarPerfilInterfaz();

    const finalizadas = datos.sesiones
      .filter(sesion => sesion.estado === "finalizada")
      .sort((a, b) => b.finalizada.localeCompare(a.finalizada));

    const pendientes = datos.sesiones
      .filter(sesion => sesion.estado === "pendiente")
      .sort((a, b) => b.actualizada.localeCompare(a.actualizada));

    $("#total-practicas").textContent = finalizadas.length;

    $("#tiempo-total").textContent = formatoDuracion(
      finalizadas.reduce(
        (total, sesion) => total + sesion.segundosActivos,
        0
      )
    );

    $("#ultima-practica").textContent = finalizadas[0]
      ? formatoFecha(finalizadas[0].finalizada)
      : "Sin prácticas";

    $("#practica-pendiente-inicio").hidden = !pendientes.length;

    if (pendientes[0]) {
      $("#descripcion-pendiente").textContent =
        `${PUESTOS[pendientes[0].configuracion.puesto]} · ` +
        `${pendientes[0].respuestas.length} de ` +
        `${pendientes[0].preguntas.length} respuestas guardadas`;
    }

    $("#practicas-recientes").innerHTML = finalizadas.length
      ? finalizadas.slice(0, 3).map(sesion => `
          <article class="practica-reciente">
            <div>
              <h3>${escapar(PUESTOS[sesion.configuracion.puesto])}</h3>
              <p>
                ${escapar(formatoFecha(sesion.finalizada))}
                · ${escapar(TEMAS[sesion.configuracion.tema])}
              </p>
            </div>

            <button
              class="boton boton--texto"
              type="button"
              data-ver-resultado="${escapar(sesion.id)}"
            >
              ${resumenSesion(sesion).puntuacion}/100
              <span class="solo-lectores">Ver resultados</span>
            </button>
          </article>
        `).join("")
      : `
        <p class="estado-vacio">
          Todavía no tienes prácticas registradas.
          Comienza tu primera simulación.
        </p>
      `;

    const reciente = finalizadas[0];

    const anterior = reciente
      ? finalizadas.find(sesion =>
          sesion.id !== reciente.id &&
          sesion.configuracion.puesto === reciente.configuracion.puesto &&
          sonComparables(sesion, reciente)
        )
      : null;

    if (!reciente || !anterior) {
      $("#mayor-mejora").textContent = "Sin datos";

      $("#progreso-reciente").innerHTML = `
        <p class="estado-vacio">
          Completa dos prácticas del mismo puesto para revisar cambios.
        </p>
      `;

      return;
    }

    const actual = resumenSesion(reciente);
    const previo = resumenSesion(anterior);

    const cambios = actual.indicadores
      .map(indicador => {
        const comparable = previo.indicadores.find(
          item => item.clave === indicador.clave
        );

        return comparable
          ? {
              ...indicador,
              diferencia: indicador.valor - comparable.valor
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.diferencia - a.diferencia);

    $("#mayor-mejora").textContent =
      cambios[0]?.diferencia > 0
        ? CRITERIOS[cambios[0].clave].nombre
        : "Sin aumento";

    $("#progreso-reciente").innerHTML =
      cambios.map(indicador =>
        indicadorHTML(
          indicador.clave,
          indicador.valor,
          `Cambio: ${indicador.diferencia > 0 ? "+" : ""}` +
          `${indicador.diferencia} puntos`
        )
      ).join("");
  }

  function renderHistorial() {
    const estado = $("#historial-estado").value;
    const periodo = $("#historial-periodo").value;

    const dias =
      periodo === "semana" ? 7 :
      periodo === "mes" ? 30 : null;

    const limite = dias
      ? Date.now() - dias * 24 * 60 * 60 * 1000
      : null;

    const sesiones = datos.sesiones
      .filter(sesion =>
        (estado === "todas" || sesion.estado === estado) &&
        (!limite || new Date(sesion.creada).getTime() >= limite)
      )
      .sort((a, b) => b.actualizada.localeCompare(a.actualizada));

    $("#cantidad-practicas-guardadas").textContent =
      `${datos.sesiones.length} prácticas guardadas · ` +
      `${sesiones.length} visibles`;

    $("#lista-historial").innerHTML = sesiones.length
      ? sesiones.map(sesion => {
          const finalizada = sesion.estado === "finalizada";

          return `
            <article class="tarjeta practica-historial">
              <div>
                <h2>
                  ${escapar(PUESTOS[sesion.configuracion.puesto])}
                </h2>

                <p class="practica-historial__datos">
                  ${escapar(formatoFecha(sesion.creada))}
                  · ${sesion.preguntas.length} preguntas
                </p>
              </div>

              <div class="practica-historial__datos">
                <p>${escapar(TEMAS[sesion.configuracion.tema])}</p>
                <span class="etiqueta ${
                  finalizada
                    ? "etiqueta--positiva"
                    : "etiqueta--pendiente"
                }">
                  ${finalizada ? "Finalizada" : "Pendiente"}
                </span>
              </div>

              <p class="practica-historial__resultado">
                ${
                  finalizada
                    ? `${resumenSesion(sesion).puntuacion}/100`
                    : `${sesion.respuestas.length}/${sesion.preguntas.length}`
                }
              </p>

              <div class="practica-historial__acciones">
                ${
                  finalizada
                    ? `
                      <button
                        class="boton boton--texto"
                        type="button"
                        data-ver-resultado="${escapar(sesion.id)}"
                      >
                        Ver informe
                      </button>

                      <button
                        class="boton boton--secundario"
                        type="button"
                        data-repetir-practica="${escapar(sesion.id)}"
                      >
                        Repetir
                      </button>
                    `
                    : `
                      <button
                        class="boton boton--primario"
                        type="button"
                        data-continuar="${escapar(sesion.id)}"
                      >
                        Continuar
                      </button>
                    `
                }
              </div>
            </article>
          `;
        }).join("")
      : `
        <div class="tarjeta estado-vacio">
          <h2>No hay prácticas para mostrar</h2>
          <p>Cambia los filtros o comienza una nueva simulación.</p>
        </div>
      `;
  }

  $("#formulario-filtros-historial").addEventListener(
    "submit",
    evento => {
      evento.preventDefault();
      renderHistorial();
    }
  );

  document.addEventListener("click", evento => {
    const resultado = evento.target.closest("[data-ver-resultado]");
    const continuar = evento.target.closest("[data-continuar]");
    const repetir = evento.target.closest("[data-repetir-practica]");

    if (resultado) {
      resultadoActivo = resultado.dataset.verResultado;
      navegar("resultados");
    }

    if (continuar) {
      continuarSesion(continuar.dataset.continuar);
    }

    if (repetir) {
      prepararRepeticion(repetir.dataset.repetirPractica);
    }
  });

  /* --------------------------------------------------------
     16. COMPARACIÓN
     -------------------------------------------------------- */

  function rellenarComparadores() {
    const valorA = $("#intento-a").value;
    const valorB = $("#intento-b").value;

    const sesiones = datos.sesiones
      .filter(sesion => sesion.estado === "finalizada")
      .sort((a, b) => b.finalizada.localeCompare(a.finalizada));

    const opciones = sesiones.map(sesion => `
      <option value="${escapar(sesion.id)}">
        ${escapar(PUESTOS[sesion.configuracion.puesto])}
        · ${escapar(formatoFecha(sesion.finalizada))}
        · ${escapar(TEMAS[sesion.configuracion.tema])}
        · ${escapar(sesion.id.slice(-6))}
      </option>
    `).join("");

    $("#intento-a").innerHTML =
      '<option value="">Selecciona una práctica</option>' + opciones;

    $("#intento-b").innerHTML =
      '<option value="">Selecciona otra práctica</option>' + opciones;

    if (sesiones.some(sesion => sesion.id === valorA)) {
      $("#intento-a").value = valorA;
    }

    if (sesiones.some(sesion => sesion.id === valorB)) {
      $("#intento-b").value = valorB;
    }
  }

  for (const selector of ["#intento-a", "#intento-b"]) {
    $(selector).addEventListener("change", () => {
      comparacionActiva = null;
      $("#contenido-comparacion").hidden = true;
      $("#error-comparacion").hidden = true;
    });
  }

  $("#formulario-comparacion").addEventListener("submit", evento => {
    evento.preventDefault();

    if (!evento.currentTarget.reportValidity()) return;

    let anterior = buscarSesion($("#intento-a").value);
    let reciente = buscarSesion($("#intento-b").value);

    const error = $("#error-comparacion");

    if (
      !anterior ||
      !reciente ||
      anterior.id === reciente.id ||
      anterior.estado !== "finalizada" ||
      reciente.estado !== "finalizada" ||
      anterior.configuracion.puesto !== reciente.configuracion.puesto
    ) {
      error.textContent =
        "Selecciona dos prácticas finalizadas, diferentes y del mismo puesto.";

      error.hidden = false;
      $("#contenido-comparacion").hidden = true;
      $("#comparacion-vacia").hidden = false;

      return;
    }

    error.hidden = true;

    if (anterior.finalizada > reciente.finalizada) {
      [anterior, reciente] = [reciente, anterior];
    }

    comparacionActiva = {
      anterior: anterior.id,
      reciente: reciente.id
    };

    const previo = resumenSesion(anterior);
    const actual = resumenSesion(reciente);
    const comparableGlobal = sonComparables(anterior, reciente);
    const diferencia = actual.puntuacion - previo.puntuacion;

    $("#comparacion-fecha-anterior").textContent =
      formatoFecha(anterior.finalizada);

    $("#comparacion-fecha-reciente").textContent =
      formatoFecha(reciente.finalizada);

    $("#comparacion-puntuacion-anterior").textContent =
      `${previo.puntuacion}/100`;

    $("#comparacion-puntuacion-reciente").textContent =
      `${actual.puntuacion}/100`;

    $("#comparacion-diferencia").textContent =
      comparableGlobal ? `${diferencia > 0 ? "+" : ""}${diferencia} puntos` : "Sin delta";

    $("#comparacion-interpretacion").textContent =
      !comparableGlobal ? "Los temas o criterios son distintos." : diferencia > 0
        ? "Aumentó el índice orientativo."
        : diferencia < 0
          ? "Disminuyó el índice orientativo."
          : "El índice orientativo se mantuvo.";

    const cambios = [];

    $("#comparacion-indicadores").innerHTML =
      actual.indicadores.map(indicador => {
        const comparable = previo.indicadores.find(
          item => item.clave === indicador.clave
        );

        if (!comparable || !comparableGlobal) {
          return indicadorHTML(
            indicador.clave,
            indicador.valor,
            "Sin indicador equivalente en el intento anterior."
          );
        }

        const cambio = indicador.valor - comparable.valor;

        cambios.push(
          `${CRITERIOS[indicador.clave].nombre}: ` +
          `${comparable.valor} → ${indicador.valor} ` +
          `(${cambio > 0 ? "+" : ""}${cambio} puntos).`
        );

        return indicadorHTML(
          indicador.clave,
          indicador.valor,
          `Anterior: ${comparable.valor}/100 · ` +
          `Cambio: ${cambio > 0 ? "+" : ""}${cambio} puntos`
        );
      }).join("");

    $("#comparacion-cambios").innerHTML = listaHTML(cambios.length
      ? cambios
      : ["Las respuestas se pueden consultar sin comparar los índices."]);

    $("#comparacion-pendientes").innerHTML =
      listaHTML(actual.recomendaciones);

    /*
      Se identifican preguntas compartidas por su ID.
      Las preguntas distintas se muestran con su propio texto,
      sin tratarlas como si fueran equivalentes.
    */
    const preguntas = unicos([
      ...anterior.preguntas.map(pregunta => pregunta.id),
      ...reciente.preguntas.map(pregunta => pregunta.id)
    ]);

    $("#comparacion-respuestas").innerHTML =
      preguntas.map(id => {
        const pregunta =
          reciente.preguntas.find(item => item.id === id) ||
          anterior.preguntas.find(item => item.id === id);

        const respuestaA = anterior.respuestas.find(
          item => item.preguntaId === id
        );

        const respuestaB = reciente.respuestas.find(
          item => item.preguntaId === id
        );

        return `
          <section class="respuesta-detalle">
            <h3>${escapar(pregunta.texto)}</h3>

            <div class="comparacion-respuestas__fila">
              <article>
                <h4>Intento anterior</h4>
                <p>${escapar(
                  respuestaA?.texto ||
                  "Esta pregunta no se respondió en esa práctica."
                )}</p>
              </article>

              <article>
                <h4>Intento reciente</h4>
                <p>${escapar(
                  respuestaB?.texto ||
                  "Esta pregunta no se respondió en esa práctica."
                )}</p>
              </article>
            </div>
          </section>
        `;
      }).join("");

    $("#comparacion-vacia").hidden = true;
    $("#contenido-comparacion").hidden = false;

    notificar(
      "Comparación disponible. Considera las diferencias de preguntas y temas."
    );
  });

  $("#repetir-practica-comparacion").addEventListener("click", () => {
    if (comparacionActiva) {
      prepararRepeticion(comparacionActiva.reciente);
    }
  });

  /* --------------------------------------------------------
     17. BANCO Y FILTROS
     -------------------------------------------------------- */

  const PREGUNTAS_POR_PAGINA = 12;
  let paginaBanco = 0;

  function renderBanco() {
    const busqueda = normalizar($("#buscar-pregunta").value.trim());
    const puesto = $("#banco-puesto").value;
    const tipo = $("#banco-tipo").value;

    const preguntas = BANCO.filter(pregunta =>
      (!puesto || pregunta.puesto === puesto) &&
      (!tipo || pregunta.tipo === tipo) &&
      (
        !busqueda ||
        normalizar(
          pregunta.texto + " " + PUESTOS[pregunta.puesto]
        ).includes(busqueda)
      )
    );

    $("#cantidad-preguntas-banco").textContent =
      `${BANCO.length} preguntas asociadas a los puestos disponibles.`;

    const paginas = Math.max(1, Math.ceil(preguntas.length / PREGUNTAS_POR_PAGINA));
    paginaBanco = Math.min(paginaBanco, paginas - 1);
    const desde = paginaBanco * PREGUNTAS_POR_PAGINA;
    const visibles = preguntas.slice(desde, desde + PREGUNTAS_POR_PAGINA);

    $("#estado-busqueda-banco").textContent = preguntas.length
      ? `${preguntas.length} preguntas · Página ${paginaBanco + 1} de ${paginas}`
      : "No se encontraron preguntas.";

    $("#paginacion-banco").hidden = paginas === 1;
    $("#banco-anterior").disabled = paginaBanco === 0;
    $("#banco-siguiente").disabled = paginaBanco >= paginas - 1;
    $("#lista-banco").innerHTML = visibles.length
      ? visibles.map(pregunta => `
          <article class="tarjeta pregunta-banco">
            <div class="pregunta-banco__etiquetas">
              <span class="etiqueta">
                ${escapar(TIPOS[pregunta.tipo])}
              </span>

              <span class="etiqueta etiqueta--celeste">
                ${escapar(PUESTOS[pregunta.puesto])}
              </span>
            </div>

            <h2>${escapar(pregunta.texto)}</h2>

            ${
              pregunta.datos
                ? `<pre><code>${escapar(pregunta.datos)}</code></pre>`
                : ""
            }

            <p>
              ${
                ["personal", "situacional"].includes(pregunta.tipo)
                  ? "Utiliza un ejemplo real o explica cómo actuarías."
                  : "Explica tu razonamiento y cómo comprobarías tu propuesta."
              }
            </p>

            <button
              class="boton boton--primario"
              type="button"
              data-practicar-pregunta="${escapar(pregunta.id)}"
            >
              Practicar
            </button>
          </article>
        `).join("")
      : `
        <div class="tarjeta estado-vacio">
          <h2>No se encontraron preguntas</h2>
          <p>Prueba otros términos o modifica los filtros.</p>
        </div>
      `;
  }

  $("#formulario-filtros-banco").addEventListener("submit", evento => {
    evento.preventDefault();
    paginaBanco = 0;
    renderBanco();
  });

  $("#formulario-filtros-banco").addEventListener("reset", () => {
    paginaBanco = 0;
    setTimeout(renderBanco, 0);
  });

  for (const [selector, paso] of [["#banco-anterior", -1], ["#banco-siguiente", 1]]) {
    $(selector).addEventListener("click", () => {
      paginaBanco = Math.max(0, paginaBanco + paso);
      renderBanco();
      $("#estado-busqueda-banco").focus();
    });
  }

  $("#lista-banco").addEventListener("click", evento => {
    const boton = evento.target.closest("[data-practicar-pregunta]");
    if (!boton) return;

    const pregunta = BANCO.find(
      item => item.id === boton.dataset.practicarPregunta
    );

    if (!pregunta) return;

    $("#puesto").value = pregunta.puesto;

    const tema =
      pregunta.tipo === "personal" ? "personales" :
      pregunta.tipo === "situacional" ? "situacionales" :
      "conocimientos";

    $(
      `#formulario-configuracion input[name="tema"][value="${tema}"]`
    ).checked = true;

    $(
      '#formulario-configuracion input[name="cantidad"]' +
      '[value="personalizada"]'
    ).checked = true;

    $("#cantidad-personalizada").value = 1;

    actualizarResumen();

    preguntaElegida = pregunta;
    navegar("configuracion");

    notificar(
      "Completa el contexto de postulación. " +
      "Si mantienes un único ejercicio y este tema, practicarás la pregunta elegida."
    );
  });

  /* --------------------------------------------------------
     18. GUÍA, PREGUNTAS FRECUENTES Y TEXTO
     -------------------------------------------------------- */

  $$("[data-abrir-guia]").forEach(boton => {
    boton.addEventListener("click", () => {
      if (!$("#dialogo-guia").open) {
        $("#dialogo-guia").showModal();
      }
    });
  });

  /*
    Los elementos <details> del HTML ya permiten abrir y cerrar
    preguntas frecuentes con ratón o teclado.
  */

  function aplicarEscalaTexto() {
    document.documentElement.style.setProperty(
      "--tamano-base",
      `${escalaTexto}%`
    );

    $("#estado-tamano-texto").textContent =
      `Tamaño del texto: ${escalaTexto} %`;

    $("#reducir-texto").disabled = escalaTexto <= 90;
    $("#aumentar-texto").disabled = escalaTexto >= 150;
  }

  function cambiarEscala(cambio) {
    escalaTexto = Math.min(150, Math.max(90, escalaTexto + cambio));

    aplicarEscalaTexto();

    try {
      localStorage.setItem(CLAVE_TEXTO, String(escalaTexto));
    } catch {
      notificar(
        "El tamaño cambió, pero la preferencia no pudo guardarse."
      );
    }
  }

  $("#reducir-texto").addEventListener("click", () => {
    cambiarEscala(-10);
  });

  $("#aumentar-texto").addEventListener("click", () => {
    cambiarEscala(10);
  });

  $("#restablecer-texto").addEventListener("click", () => {
    escalaTexto = 100;
    cambiarEscala(0);
  });

  /* --------------------------------------------------------
     19. PERSISTENCIA AL SALIR Y PAUSAS
     -------------------------------------------------------- */

  function guardarAntesDeSalir() {
    if (
      vistaActual !== "simulacion" ||
      !sesionActiva ||
      sesionActiva.estado !== "pendiente"
    ) {
      return;
    }

    capturarBorrador();
    detenerReloj();
    pausarActividad();

    guardarDatos();
  }

  document.addEventListener("visibilitychange", () => {
    if (
      vistaActual !== "simulacion" ||
      sesionActiva?.estado !== "pendiente"
    ) {
      return;
    }

    if (document.hidden) {
      guardarAntesDeSalir();
    } else {
      iniciarActividad();
      iniciarReloj();
    }
  });

  window.addEventListener("pagehide", guardarAntesDeSalir);

  /* Evita escribir desde una pestaña con datos desactualizados. */
  window.addEventListener("pageshow", evento => {
    if (evento.persisted && vistaActual === "simulacion" &&
        sesionActiva?.estado === "pendiente") {
      iniciarActividad();
      iniciarReloj();
    }
  });

  window.addEventListener("storage", evento => {
    if (evento.key !== CLAVE_DATOS && evento.key !== null) return;
    if (evento.newValue === contenidoLeido && evento.key !== null) return;
    almacenamientoBloqueado = true;
    notificar("Otra pestaña cambió tus datos. Copia tu borrador y recarga.");
  });

  /* --------------------------------------------------------
     20. INICIALIZACIÓN
     -------------------------------------------------------- */

  try {
    const guardada = Number(localStorage.getItem(CLAVE_TEXTO));

    if (
      Number.isFinite(guardada) &&
      guardada >= 90 &&
      guardada <= 150
    ) {
      escalaTexto = guardada;
    }
  } catch {
    escalaTexto = 100;
  }

  /*
    Un cierre inesperado puede dejar una fecha de fin de reloj.
    Al recuperar la aplicación, se conserva el tiempo restante
    guardado y se espera a que la práctica se reanude.
  */
  datos.sesiones.forEach(sesion => {
    if (sesion.estado === "pendiente" && sesion.reloj) {
      sesion.reloj.limite = null;
    }
  });

  aplicarEscalaTexto();
  actualizarPerfilInterfaz();
  actualizarResumen();
  actualizarChecklist();

  navegar(destinoActual(), false);
})();