export default {
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
        google: 'Iniciar sesión con cuenta de Google'
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
    }
}