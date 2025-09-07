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
        google: 'Google 계정으로 로그인'
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
    }
}