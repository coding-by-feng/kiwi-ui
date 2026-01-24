export default {
    language: {
        nativeName: 'Español',
        englishName: 'Spanish'
    },
    // Navigation
    nav: {
        search: 'Buscar',
        dictionary: 'Diccionario',
        starList: 'Colecciones',
        youtube: 'Aprendizaje YouTube',
        grammarListener: 'Gramática',
        userCenter: 'Perfil',
        login: 'Iniciar sesión',
        about: 'Acerca de',
        bgm: 'Configuración de audio'
    },

    // Search functionality
    search: {
        placeholder: {
            dictionary: 'Ingrese vocabulario',
            translation: 'Ingrese cualquier cosa',
            explanation: 'Ingrese cualquier cosa',
            grammar: 'Ingrese cualquier cosa',
            vocabulary: 'Ingrese vocabulario'
        },
        modes: {
            dictionary: 'Diccionario',
            directTranslation: 'Traducción directa',
            explanation: 'Explicación',
            grammarExplanation: 'Explicación gramatical',
            grammarCorrection: 'Corrección gramatical',
            vocabularyExplanation: 'Explicación de vocabulario',
            synonym: 'Sinónimo',
            antonym: 'Antónimo',
            vocabularyAssociation: 'Asociación de vocabulario',
            phrasesAssociation: 'Asociación de frases'
        },
        buttons: {
            search: 'Buscar',
            back: 'Volver',
            explainMore: 'Explicar más',
            viewHistory: 'Ver historial IA'
        }
    },

    auth: {
        welcome: 'Bienvenido de vuelta',
        loginWith: 'Iniciar sesión con',
        google: 'Iniciar sesión con cuenta de Google',
        connecting: 'Conectando con Google...',
        processing: 'Procesando...',
        loginFailed: 'Error de inicio de sesión con Google, inténtelo de nuevo',
        accountNotFound: 'Cuenta no encontrada, contacte al administrador',
        loginSuccess: 'Inicio de sesión exitoso',
        logout: 'Cerrar sesión',
        autoLoginSuccess: 'Inicio de sesión automático exitoso',
        guestLogin: '¡Usuario invitado por favor inicie sesión!',
        brand: {
            title: 'Kason Tools',
            subtitle: 'Tu espacio de trabajo todo-en-uno para aprender inglés'
        },
        features: {
            intelligentMemory: 'Repetición espaciada para memoria duradera',
            pronunciation: 'Práctica de pronunciación nativa',
            personalizedPlan: 'Rutas de aprendizaje impulsadas por IA',
            aiAssistantModes: 'Tutor IA multi-modo (gramática, traducción y más)',
            bilingualEnEn: 'Inglés-a-inglés con soporte de lengua materna',
            youtubePlayer: 'Aprende en YouTube con subtítulos interactivos',
            todoGamified: 'Tareas gamificadas con sistema de clasificación'
        },
        username: 'Usuario',
        password: 'Contraseña',
        signIn: 'Iniciar sesión',
        or: 'O'
    },

    ui: {
        loading: 'Cargando',
        confirm: 'Confirmar',
        cancel: 'Cancelar',
        close: 'Cerrar',
        save: 'Guardar',
        edit: 'Editar',
        delete: 'Eliminar'
    },

    // Todo Gamification
    todo: {
        title: 'Por hacer',
        totalPoints: 'Puntos totales',
        todayTasks: "Tareas de hoy",
        trash: 'Papelera',
        history: 'Historial',
        analytics: 'Análisis',
        task: 'Tarea',
        description: 'Descripción',
        enterTaskTitle: 'Ingrese el título de la tarea',
        enterTaskDescription: 'Ingrese la descripción de la tarea',
        successPoints: 'Puntos de éxito',
        failPoints: 'Puntos de falla',
        frequency: 'Frecuencia',
        selectFrequency: 'Seleccionar frecuencia',
        everyNDays: 'Cada N días',
        addTask: 'Agregar tarea',
        completed: '✅ Completado',
        failed: '❌ Fallido',
        success: 'éxito',
        fail: 'falla',
        noTasksToday: '¡No hay tareas para hoy. Agregue su primera tarea arriba!',
        selectDate: 'Seleccionar fecha',
        noTasksForDate: 'No se encontraron tareas para la fecha seleccionada',
        barChart: '📊 Gráfico de barras',
        lineChart: '📈 Gráfico de líneas',
        donutChart: '🍩 Gráfico de rosquilla',
        monthlySummary: 'Resumen mensual',
        tasksCompleted: 'Tareas completadas',
        successRate: 'Tasa de éxito',
        taskAddedSuccess: '¡Tarea agregada exitosamente!',
        taskStatusUpdate: '¡Tarea {status}! {points} puntos',
        taskUpdatedSuccess: '¡Tarea actualizada exitosamente!',
        taskDeletedSuccess: '¡Tarea eliminada exitosamente!',
        taskTitleRequired: 'El título de la tarea es requerido',
        confirmDeleteTask: '¿Está seguro de que desea eliminar esta tarea?',
        editTask: 'Editar tarea',
        deleteTask: 'Eliminar tarea',

        // Restablecer todo
        resetAllToPending: 'Restablecer todo a Pendiente',
        resetAllConfirmTitle: 'Restablecer el estado de todas las tareas',
        resetAllConfirmMessage: 'Esto restablecerá {count} tarea(s) a Pendiente. ¿Continuar?',
        allAlreadyPending: 'Todas las tareas ya están en pendiente',
        resetAllResult: 'Se restablecieron {count} tarea(s) a pendiente',

        // Tab label
        taskList: 'Lista de tareas',

        // History actions
        confirmDeleteHistoryRecord: '¿Está seguro de que desea eliminar este registro histórico?',
        deleteHistoryRecord: 'Eliminar registro histórico',
        historyRecordDeleted: '¡Registro histórico eliminado con éxito!',

        // Ranking metadata and points
        points: 'Puntos',
        rankingSystem: 'Sistema de clasificación',
        currentRank: 'Rango actual',
        nextRankTarget: 'Objetivo del siguiente rango',
        pointsNeeded: 'Se necesitan {points} puntos',
        congratulations: '¡Felicidades!',
        maxRankAchieved: '¡Has alcanzado el rango máximo!',
        allRanks: 'Todos los rangos',
        viewRankingDetails: 'Ver detalles del ranking',
        maxRankReached: '¡Rango máximo alcanzado!',

        // Nombres de rangos
        ranks: {
            legendary: 'Legendario',
            mythic: 'Mítico',
            immortal: 'Inmortal',
            divine: 'Divino',
            celestial: 'Celestial',
            grandmaster: 'Gran Maestro',
            master: 'Maestro',
            diamond: 'Diamante',
            platinum: 'Platino',
            gold: 'Oro',
            silver: 'Plata',
            bronze: 'Bronce',
            iron: 'Hierro',
            steel: 'Acero',
            stone: 'Piedra',
            wood: 'Madera',
            apprentice: 'Aprendiz',
            novice: 'Novato',
            trainee: 'Practicante',
            beginner: 'Principiante'
        },
        rankLevel: 'Nivel {level}',
        nextRank: 'Siguiente: {rank}',
    },

    // New: complete login block
    login: {
        welcomeBack: 'Bienvenido de vuelta',
        smartEnglishLearning: 'Tu espacio de trabajo todo-en-uno para aprender inglés',
        features: {
            smartMemory: 'Repetición espaciada para memoria duradera',
            pronunciation: 'Práctica de pronunciación nativa',
            personalizedPlan: 'Rutas de aprendizaje impulsadas por IA',
            aiAssistantModes: 'Tutor IA multi-modo (gramática, traducción y más)',
            bilingualEnEn: 'Inglés-a-inglés con soporte de lengua materna',
            youtubePlayer: 'Aprende en YouTube con subtítulos interactivos',
            todoGamified: 'Tareas gamificadas con sistema de clasificación'
        },
        copyright: '©2025 Kason Tools v2.0',
        useGoogleLogin: 'Usar cuenta de Google para iniciar sesión',
        loginProcessing: 'Procesando...',
        connectingGoogle: 'Conectando con Google...',
        loginFailed: 'Error de inicio de sesión, inténtelo de nuevo',
        accountNotFound: 'Cuenta no encontrada, contacte al administrador',
        clipboardAccess: 'Acceso al portapapeles',
        clipboardInstructions: {
            title: 'Para usar el contenido del portapapeles en móviles:',
            step1: 'Copia el texto que quieres buscar',
            step2: 'Regresa a esta app',
            step3: 'Toca el botón "Pegar desde portapapeles"',
            step4: 'O pega manualmente en la caja de búsqueda'
        },
        gotIt: 'Entendido'
    },

    // New: full AI features
    ai: {
        aiCallHistory: 'Historial de llamadas IA',
        noHistoryFound: 'No se encontró historial de IA',
        historyDescription: 'Tu historial de conversación con IA aparecerá aquí cuando empieces a usar las funciones de IA.',
        mode: 'Modo',
        languages: 'Idiomas',
        timestamp: 'Marca de tiempo',
        prompt: 'Indicador',
        filterByMode: 'Filtrar por modo',
        filterByLanguage: 'Filtrar por idioma',
        allModes: 'Todos los modos',
        allLanguages: 'Todos los idiomas',
        clearFilters: 'Limpiar filtros',
        review: 'Revisión',
        copy: 'Copiar',
        copyPrompt: 'Copiar indicador',
        details: 'Detalles',
        searchAgain: 'Buscar de nuevo',
        aiCallDetails: 'Detalles de llamada IA',
        promptCopied: '¡Indicador copiado al portapapeles!',
        failedToCopy: 'Error al copiar el indicador',
        today: 'Hoy',
        yesterday: 'Ayer',
        daysAgo: 'Hace {count} días',
        invalidDate: 'Fecha inválida',
        unknown: 'Desconocido',
        explainSelectedText: 'Explicar texto seleccionado',
        selectedText: 'Texto seleccionado',
        explainSelection: 'Explicar selección',
        searchOnDictionary: 'Buscar en diccionario',
        noTextSelected: 'No hay texto seleccionado',
        originalText: 'Texto original',
        selectTextToExplain: 'Selecciona texto a explicar según el contexto',
        expandExplanation: 'Expandir explicación',
        collapseExplanation: 'Contraer explicación',
        closeExplanation: 'Cerrar explicación',
        explanationForSelectedText: 'Explicación del texto seleccionado',
        generating: 'Generando explicación...',
        streaming: 'Transmitiendo respuesta...',
        copyResponseText: 'Copiar texto de respuesta',
        textCopiedToClipboard: '¡Texto copiado al portapapeles!',
        failedToCopyText: 'Error al copiar el texto',
        // Diálogo del portapapeles
        useClipboardContent: '¿Usar contenido del portapapeles: "{text}"?',
        // Filtros de clasificación
        normalItems: 'Elementos normales',
        archivedItems: 'Elementos archivados',
        allItems: 'Todos los elementos',
        // Estado de carga
        loadingHistory: 'Cargando historial...',
        // Acciones
        archive: 'Archivar',
        // Mensajes de archivado/eliminación
        itemArchived: 'Elemento archivado correctamente',
        archiveFailed: 'Error al archivar',
        itemDeleted: 'Elemento eliminado correctamente',
        deleteFailed: 'Error al eliminar',
        loadHistoryFailed: 'Error al cargar el historial de llamadas IA',
        // Diálogo de confirmación de eliminación
        deleteItemTitle: 'Eliminar elemento',
        deleteItemConfirm: '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.',
        // Minimizar/Restaurar
        minimize: 'Minimizar',
        restore: 'Restaurar',
        close: 'Cerrar',
        aiSearch: 'Búsqueda IA',
        // Diálogo de detalles
        loadingDetail: 'Cargando detalles...',
        aiResponse: 'Respuesta IA',
        noResponseAvailable: 'Respuesta no disponible - haga clic en Buscar de nuevo para generar',
        copyResponse: 'Copiar respuesta',
        responseCopied: '¡Respuesta copiada!',
        loadDetailFailed: 'Error al cargar los detalles'
    },

    // New: audio settings parity
    audio: {
        title: 'Configuración de audio',
        management: 'Gestión de audio',
        cleanAudioData: 'Limpiar datos de audio, total {count}',
        cleanAllCache: 'Limpiar toda la caché',
        backgroundMusic: 'Música de fondo',
        audioCleanedSuccess: 'Datos de audio limpiados correctamente',
        cacheCleanedSuccess: 'Toda la caché limpiada correctamente',
        playing: 'Reproduciendo...',
        clickToPlay: 'Clic para reproducir',
        nowPlaying: 'Reproduciendo ahora'
    },

    searchModes: {
        dictionary: 'Diccionario',
        directTranslation: 'Traducción directa',
        explanation: 'Explicación',
        grammarExplanation: 'Explicación gramatical',
        grammarCorrection: 'Corrección gramatical',
        vocabularyExplanation: 'Explicación de vocabulario',
        synonym: 'Sinónimo',
        antonym: 'Antónimo',
        vocabularyAssociation: 'Asociación de vocabulario',
        phrasesAssociation: 'Asociación de frases',
        vocabularyCharacterExpansion: 'Expansión de caracteres de vocabulario',
        ambiguousAssociationCorrection: 'Corrección de asociación ambigua',
        naturalIdiomaticRetouch: 'Retoque idiomático natural',
        selectMode: 'Seleccionar modo'
    },

    // Search placeholders
    searchPlaceholders: {
        dictionary: 'Introducir vocabulario',
        directTranslation: 'Introducir cualquier cosa',
        explanation: 'Introducir cualquier cosa',
        grammarExplanation: 'Introducir cualquier cosa',
        grammarCorrection: 'Introducir cualquier cosa',
        synonym: 'Introducir vocabulario',
        antonym: 'Introducir vocabulario',
        vocabularyAssociation: 'Introducir cualquier cosa',
        phrasesAssociation: 'Introducir cualquier cosa',
        // New modes
        vocabularyCharacterExpansion: 'Introducir cualquier cosa',
        ambiguousAssociationCorrection: 'Introducir cualquier cosa',
        naturalIdiomaticRetouch: 'Introducir texto para retocar'
    },

    user: {
        searchModeHotkeys: 'Atajos de Modo de Búsqueda',
        searchModeHotkeysTip: 'Presiona Ctrl (o Cmd en macOS) + Shift + Número para cambiar de modo',
        resetToDefaults: 'Restablecer a valores predeterminados',
        hotkey: 'Atajo',
        // Añadido: configuración de pestañas de funciones
        featureTabs: 'Pestañas de funciones',
        featureTabsTip: 'Mostrar u ocultar pestañas en la barra de herramientas',
        uiLanguage: 'Idioma de la interfaz',
        uiLanguageTooltip: 'Idioma utilizado para la interfaz (independiente del idioma de traducción)'
    },

    messages: {
        operationSuccess: 'Operación exitosa',
        duplicateHotkey: 'Este atajo ya está en uso',
        invalidHotkey: 'El atajo debe incluir al menos un modificador (Ctrl/Alt/Shift/Cmd)',
        noHotkeysConfigured: 'No hay atajos configurados',
        saveFailed: 'Guardado fallido',
        invalidConfig: 'Configuración inválida',
        confirmDelete: '¿Está seguro de que desea eliminar?',
        confirmClear: 'Está a punto de limpiar y volver a cargar, ¿continuar?',
        clearOperation: 'Operación de limpieza'
    },

    // Añadido: etiquetas de pestañas para los conmutadores de funciones
    tabs: {
        todo: 'Por hacer',
        youtube: 'YouTube',
        pdfReader: 'Visor PDF',
        about: 'Acerca de',
        bgm: 'Pestaña BGM',
        vocabularyReview: 'Revisión de vocabulario',
        aiHistory: 'Historial de IA'
    },

    pdf: {
        selectButton: 'Seleccionar PDF',
        changeButton: 'Cambiar PDF',
        selectPrompt: 'Select a PDF to begin',
        invalidType: 'Please choose a valid PDF file.',
        loadFailed: 'Failed to load the PDF file.',
        showTextPanel: 'Mostrar panel de texto',
        hideTextPanel: 'Ocultar panel de texto',
        fullscreenLeft: 'Vista completa a la izquierda',
        exitFullscreen: 'Salir de vista completa',
        pageLabel: 'Página {page}',
        noTextForPage: 'No se detectó texto seleccionable en esta página.',
        noExtractedText: 'No hay texto extraído disponible para este documento.',
        markdownFailed: 'No se pudo convertir el PDF a Markdown.',
        explainSelection: 'Explicar selección'
    },

    about: {
        title: 'Acerca de Kason Tools',
        kasonTools: 'Kason Tools',
        description: 'Kason Tools es tu espacio de trabajo todo-en-uno para aprender inglés. Impulsado por IA, combina búsqueda de diccionario multi-modo con explicaciones, repaso de vocabulario con repetición espaciada, aprendizaje en YouTube con subtítulos interactivos, lectura de PDF con explicaciones instantáneas, un sistema de tareas gamificadas con clasificación y temporizadores de concentración—todo en una interfaz fluida diseñada para acelerar tu dominio del inglés.',
        version: 'Versión 2.0',
        copyright: '©2025 Kason Tools. Todos los derechos reservados.',
        downloads: 'Descargar clientes',
        mac: 'macOS',
        windows: 'Windows',
        linux: 'Linux',
        downloadForMac: 'Descargar para macOS',
        downloadForWindows: 'Descargar para Windows',
        downloadForLinux: 'Descargar para Linux',
        gdriveNote: 'Las descargas están alojadas en Google Drive. Si el enlace no se abre, cópielo y ábralo en una nueva pestaña.'
    },

    // Review modes
    review: {
        // Generación de audio TTS
        generatingAudio: 'Generando audio...',
        audioReady: 'Audio listo',
        audioFilesReady: 'archivos de audio listos',
        audioFilesFailed: 'archivos de audio fallidos',
        audioGenerationFailed: 'Generación de audio fallida, usando respaldo',
        audioGenerationInProgress: 'La generación de audio ya está en progreso',
        ttsAudioNotEnabled: 'El audio TTS no está habilitado en el servidor',
        startingAudioGeneration: 'Iniciando generación de audio...',
        audioPreparationFailed: 'Preparación de audio fallida',
        prepareAudio: 'Preparar audio',
        audioGenerationComplete: 'Generación de audio completa',
        preparingAudioForReview: 'Preparando audio para revisión...'
    }
}
