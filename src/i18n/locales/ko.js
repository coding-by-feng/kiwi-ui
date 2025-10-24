export default {
    language: {
        nativeName: '한국어',
        englishName: 'Korean'
    },

    // Navigation
    nav: {
        search: '검색',
        dictionary: '사전',
        starList: '컬렉션',
        youtube: 'YouTube 학습',
        grammarListener: '문법',
        userCenter: '프로필',
        login: '로그인',
        about: '정보',
        bgm: '오디오 설정'
    },

    // Search functionality
    search: {
        placeholder: {
            dictionary: '어휘 입력',
            translation: '무엇이든 입력',
            explanation: '무엇이든 입력',
            grammar: '무엇이든 입력',
            vocabulary: '어휘 입력'
        },
        modes: {
            dictionary: '사전',
            directTranslation: '직접 번역',
            explanation: '설명',
            grammarExplanation: '문법 설명',
            grammarCorrection: '문법 수정',
            vocabularyExplanation: '어휘 설명',
            synonym: '동의어',
            antonym: '반의어',
            vocabularyAssociation: '어휘 연관',
            phrasesAssociation: '구문 연관'
        },
        buttons: {
            search: '검색',
            back: '뒤로',
            explainMore: '더 자세히 설명',
            viewHistory: 'AI 기록 보기'
        }
    },

    auth: {
        welcome: '다시 오신 것을 환영합니다',
        loginWith: '로그인 방법',
        google: 'Google 계정으로 로그인',
        brand: {
            title: 'Kason 영어 학습 도구',
            subtitle: '스마트 영어 학습 플랫폼'
        },
        features: {
            aiAssistantModes: '강력한 모드를 갖춘 AI 비서',
            bilingualEnEn: '중국어 설명이 포함된 영영 해석',
            youtubePlayer: 'YouTube 플레이어 학습',
            todoGamified: '할 일과 게이미피케이션 학습'
        }
    },

    ui: {
        loading: '로딩 중',
        confirm: '확인',
        cancel: '취소',
        close: '닫기',
        save: '저장',
        edit: '편집',
        delete: '삭제'
    },

    // Todo Gamification
    todo: {
        title: '할 일 목록',
        totalPoints: '총 점수',
        todayTasks: "오늘 할 일",
        trash: '휴지통',
        history: '기록',
        analytics: '분석',
        task: '작업',
        description: '설명',
        enterTaskTitle: '작업 제목 입력',
        enterTaskDescription: '작업 설명 입력',
        successPoints: '성공 점수',
        failPoints: '실패 점수',
        frequency: '빈도',
        selectFrequency: '빈도 선택',
        everyNDays: '매 N일',
        addTask: '작업 추가',
        completed: '✅ 완료됨',
        failed: '❌ 실패함',
        success: '성공',
        fail: '실패',
        noTasksToday: '오늘 할 일이 없습니다. 위에서 첫 번째 작업을 추가하세요!',
        selectDate: '날짜 선택',
        noTasksForDate: '선택한 날짜에 작업이 없습니다',
        barChart: '📊 막대 차트',
        lineChart: '📈 선 차트',
        donutChart: '🍩 도넛 차트',
        monthlySummary: '월별 요약',
        tasksCompleted: '완료된 작업',
        successRate: '성공률',
        taskAddedSuccess: '작업이 성공적으로 추가되었습니다!',
        taskStatusUpdate: '작업 {status}! {points} 점수',
        taskUpdatedSuccess: '작업이 성공적으로 업데이트되었습니다!',
        taskDeletedSuccess: '작업이 성공적으로 삭제되었습니다!',
        taskTitleRequired: '작업 제목이 필요합니다',
        confirmDeleteTask: '이 작업을 삭제하시겠습니까?',
        editTask: '작업 편집',
        deleteTask: '작업 삭제',

        // 전체 초기화
        resetAllToPending: '모두 미완료로 초기화',
        resetAllConfirmTitle: '모든 작업 상태 초기화',
        resetAllConfirmMessage: '{count}개의 작업을 미완료로 초기화합니다. 계속하시겠습니까?',
        allAlreadyPending: '모든 작업이 이미 미완료 상태입니다',
        resetAllResult: '{count}개의 작업을 미완료로 초기화했습니다',

        // Tab label
        taskList: '작업 목록',

        // History actions
        confirmDeleteHistoryRecord: '이 기록을 삭제하시겠습니까?',
        deleteHistoryRecord: '기록 삭제',
        historyRecordDeleted: '기록이 삭제되었습니다!',

        // Ranking metadata and points
        points: '포인트',
        rankingSystem: '랭킹 시스템',
        currentRank: '현재 랭크',
        nextRankTarget: '다음 랭크 목표',
        pointsNeeded: '{points} 포인트 필요',
        congratulations: '축하합니다!',
        maxRankAchieved: '최고 랭크에 도달했습니다!',
        allRanks: '전체 랭크',
        viewRankingDetails: '랭킹 상세 보기',
        maxRankReached: '최고 랭크 달성!',

        // 랭크 이름
        ranks: {
            legendary: '전설',
            mythic: '신화',
            immortal: '불멸',
            divine: '신성',
            celestial: '천상',
            grandmaster: '그랜드마스터',
            master: '마스터',
            diamond: '다이아몬드',
            platinum: '플래티넘',
            gold: '골드',
            silver: '실버',
            bronze: '브론즈',
            iron: '아이언',
            steel: '스틸',
            stone: '스톤',
            wood: '우드',
            apprentice: '견습생',
            novice: '초보자',
            trainee: '수습생',
            beginner: '비기너'
        },
        rankLevel: '레벨 {level}',
        nextRank: '다음: {rank}',
    },

    // New: complete login block
    login: {
        welcomeBack: '다시 오신 것을 환영합니다',
        smartEnglishLearning: '스마트 영어 학습 플랫폼',
        features: {
            smartMemory: '스마트 어휘 기억',
            pronunciation: '정통 발음 연습',
            personalizedPlan: '개인화 학습 계획'
        },
        copyright: '©2025 Kason English Learning Platform v2.0',
        useGoogleLogin: 'Google 계정으로 로그인',
        loginProcessing: '처리 중...',
        connectingGoogle: 'Google에 연결 중...',
        loginFailed: '로그인 실패, 다시 시도해 주세요',
        accountNotFound: '계정을 찾을 수 없습니다. 관리자에게 문의하세요',
        clipboardAccess: '클립보드 접근',
        clipboardInstructions: {
            title: '모바일에서 클립보드 내용을 사용하려면:',
            step1: '검색할 텍스트를 복사',
            step2: '이 앱으로 돌아오기',
            step3: '"클립보드에서 붙여넣기" 버튼 탭',
            step4: '또는 검색창에 직접 붙여넣기'
        },
        gotIt: '알겠습니다'
    },

    // New: full AI features
    ai: {
        aiCallHistory: 'AI 호출 기록',
        noHistoryFound: 'AI 호출 기록이 없습니다',
        historyDescription: 'AI 기능을 사용하기 시작하면 대화 기록이 여기에 표시됩니다.',
        mode: '모드',
        languages: '언어',
        timestamp: '타임스탬프',
        prompt: '프롬프트',
        filterByMode: '모드로 필터',
        filterByLanguage: '언어로 필터',
        allModes: '전체 모드',
        allLanguages: '전체 언어',
        clearFilters: '필터 지우기',
        review: '복습',
        copy: '복사',
        details: '세부 정보',
        searchAgain: '다시 검색',
        aiCallDetails: 'AI 호출 세부 정보',
        promptCopied: '프롬프트를 클립보드에 복사했습니다!',
        failedToCopy: '프롬프트 복사 실패',
        today: '오늘',
        yesterday: '어제',
        daysAgo: '{count}일 전',
        invalidDate: '유효하지 않은 날짜',
        unknown: '알 수 없음',
        explainSelectedText: '선택한 텍스트 설명',
        selectedText: '선택한 텍스트',
        explainSelection: '선택 항목 설명',
        searchOnDictionary: '사전에서 검색',
        noTextSelected: '선택된 텍스트가 없습니다',
        originalText: '원문',
        selectTextToExplain: '문맥에 따라 설명할 텍스트를 선택하세요',
        expandExplanation: '설명 펼치기',
        collapseExplanation: '설명 접기',
        closeExplanation: '설명 닫기',
        explanationForSelectedText: '선택 텍스트에 대한 설명',
        generating: '설명을 생성 중...',
        streaming: '응답을 스트리밍 중...',
        copyResponseText: '응답 텍스트 복사',
        textCopiedToClipboard: '텍스트가 클립보드에 복사되었습니다!',
        failedToCopyText: '텍스트 복사 실패'
    },

    // New: audio settings parity
    audio: {
        title: '오디오 설정',
        management: '오디오 관리',
        cleanAudioData: '오디오 데이터 정리, 총 {count}',
        cleanAllCache: '모든 캐시 정리',
        backgroundMusic: '배경 음악',
        audioCleanedSuccess: '오디오 데이터가 성공적으로 정리되었습니다',
        cacheCleanedSuccess: '모든 캐시가 성공적으로 정리되었습니다',
        playing: '재생 중...',
        clickToPlay: '클릭하여 재생',
        nowPlaying: '현재 재생 중'
    },

    searchModes: {
        dictionary: '사전',
        directTranslation: '직접 번역',
        explanation: '설명',
        grammarExplanation: '문법 설명',
        grammarCorrection: '문법 수정',
        vocabularyExplanation: '어휘 설명',
        synonym: '동의어',
        antonym: '반의어',
        vocabularyAssociation: '어휘 연관',
        phrasesAssociation: '구문 연관',
        selectMode: '모드 선택'
    },

    user: {
        searchModeHotkeys: '검색 모드 단축키',
        searchModeHotkeysTip: 'Ctrl(또는 macOS의 Cmd) + Shift + 숫자를 눌러 모드를 전환',
        resetToDefaults: '기본값으로 재설정',
        hotkey: '단축키',
        pressKeys: '키를 누르세요...'
    },

    messages: {
        operationSuccess: '작업이 성공적으로 완료되었습니다',
        duplicateHotkey: '이 단축키는 이미 사용 중입니다',
        invalidHotkey: '단축키에는 적어도 하나의 수정 키(Ctrl/Alt/Shift/Cmd)가 포함되어야 합니다',
        noHotkeysConfigured: '구성된 단축키가 없습니다',
        saveFailed: '저장 실패',
        invalidConfig: '잘못된 구성',
        confirmDelete: '삭제하시겠습니까?',
        confirmClear: '현재 데이터를 정리하고 다시 가져옵니다. 계속하시겠습니까?',
        clearOperation: '정리 작업'
    }
}