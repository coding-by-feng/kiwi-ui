export default {
    language: {
        nativeName: '日本語',
        englishName: 'Japanese'
    },

    // Common terms (complete set matching en.js)
    common: {
        search: '検索',
        loading: '読み込み中',
        submit: '送信',
        cancel: 'キャンセル',
        confirm: '確認',
        delete: '削除',
        edit: '編集',
        save: '保存',
        close: '閉じる',
        back: '戻る',
        next: '次',
        previous: '前',
        add: '追加',
        remove: '削除',
        refresh: '更新',
        copy: 'コピー',
        paste: '貼り付け',
        clear: 'クリア',
        reset: 'リセット',
        settings: '設定',
        help: 'ヘルプ',
        about: 'について',
        success: '成功',
        error: 'エラー',
        warning: '警告',
        info: '情報',
        yes: 'はい',
        no: 'いいえ',
        ok: 'OK',
        name: '名前',
        description: '説明',
        type: 'タイプ',
        status: 'ステータス',
        date: '日付',
        time: '時間',
        language: '言語',
        enable: '有効',
        disable: '無効',
        on: 'オン',
        off: 'オフ',
        play: '再生',
        pause: '一時停止',
        stop: '停止',
        volume: '音量',
        more: 'もっと',
        less: '少なく',
        expand: '展開',
        collapse: '折りたたみ',
        show: '表示',
        hide: '非表示',
        open: '開く',
        download: 'ダウンロード',
        upload: 'アップロード',
        default: 'デフォルト'
    },

    // Navigation
    nav: {
        search: '検索',
        starList: 'コレクション',
        youtube: 'YouTube学習',
        grammarListener: '文法',
        userCenter: 'プロフィール',
        login: 'ログイン',
        about: 'について',
        bgm: 'オーディオ設定'
    },

    // Authentication
    auth: {
        welcome: 'おかえりなさい',
        loginWith: 'ログイン方法',
        google: 'Googleアカウントでログイン',
        connecting: 'Googleに接続中...',
        processing: '処理中...',
        loginFailed: 'Googleログインに失敗しました、再試行してください',
        accountNotFound: 'アカウントが見つかりません、管理者にお問い合わせください',
        loginSuccess: 'ログイン成功',
        logout: 'ログアウト',
        autoLoginSuccess: '自動ログインに成功しました！',
        guestLogin: 'ゲストユーザーはログインしてください！',
        features: {
            intelligentMemory: 'スマート語彙記憶',
            pronunciation: '本格的発音練習',
            personalizedPlan: '個人化学習プラン'
        },
        brand: {
            title: 'Kason英語学習プラットフォーム',
            subtitle: 'スマート英語学習プラットフォーム'
        },
        copyright: '©2025 Kason英語学習プラットフォーム v2.0'
    },

    // Search modes
    searchModes: {
        dictionary: '辞書',
        directTranslation: '直接翻訳',
        explanation: '説明',
        grammarExplanation: '文法説明',
        grammarCorrection: '文法修正',
        vocabularyExplanation: '語彙説明',
        synonym: '同義語',
        antonym: '反義語',
        vocabularyAssociation: '語彙関連',
        phrasesAssociation: 'フレーズ関連'
    },

    // Todo Gamification
    todo: {
        title: 'To-Do',
        totalPoints: '合計ポイント',
        todayTasks: "今日のタスク",
        trash: 'ゴミ箱',
        history: '履歴',
        analytics: '分析',
        task: 'タスク',
        description: '説明',
        enterTaskDescription: 'タスクの説明を入力',
        successPoints: '成功ポイント',
        failPoints: '失敗ポイント',
        addTask: 'タスクを追加',
        completed: '✅ 完了',
        failed: '❌ 失敗',
        success: '成功',
        fail: '失敗',
        noTasksToday: '今日のタスクはありません。上記で最初のタスクを追加してください！',
        selectDate: '日付を選択',
        noTasksForDate: '選択した日付にタスクが見つかりません',
        barChart: '📊 棒グラフ',
        lineChart: '📈 折れ線グラフ',
        donutChart: '🍩 ドーナツグラフ',
        monthlySummary: '月次サマリー',
        tasksCompleted: '完了したタスク',
        successRate: '成功率',
        taskAddedSuccess: 'タスクが正常に追加されました！',
        taskStatusUpdate: 'タスク{status}！{points}ポイント',
        taskUpdatedSuccess: 'タスクが正常に更新されました！',
        taskDeletedSuccess: 'タスクが正常に削除されました！',
        taskTitleRequired: 'タスクのタイトルは必須です',
        confirmDeleteTask: 'このタスクを削除してもよろしいですか？',
        editTask: 'タスクを編集',
        deleteTask: 'タスクを削除',

        // 一括リセット
        resetAllToPending: 'すべてを未処理にリセット',
        resetAllConfirmTitle: 'すべてのタスクステータスをリセット',
        resetAllConfirmMessage: '{count}件のタスクを未処理にリセットします。続行しますか？',
        allAlreadyPending: 'すべてのタスクは既に未処理です',
        resetAllResult: '{count}件のタスクを未処理にリセットしました',

        // Tabs/labels
        taskList: 'タスクリスト',

        // Form placeholders and fields
        enterTaskTitle: 'タスクのタイトルを入力',
        frequency: '頻度',
        selectFrequency: '頻度を選択',
        everyNDays: 'N日ごと',

        // History actions
        confirmDeleteHistoryRecord: 'この履歴を削除してもよろしいですか？',
        deleteHistoryRecord: '履歴を削除',
        historyRecordDeleted: '履歴を削除しました！',

        // Ranking metadata and points
        points: 'ポイント',
        rankingSystem: 'ランキングシステム',
        currentRank: '現在のランク',
        nextRankTarget: '次のランク目標',
        pointsNeeded: '{points} ポイント必要',
        congratulations: 'おめでとうございます！',
        maxRankAchieved: '最高ランクに到達しました！',
        allRanks: '全ランク',
        viewRankingDetails: 'ランキングの詳細を見る',
        maxRankReached: '最高ランクに到達！',

        // ランク名
        ranks: {
            legendary: '伝説',
            mythic: '神話',
            immortal: '不滅',
            divine: '神聖',
            celestial: '天界',
            grandmaster: 'グランドマスター',
            master: 'マスター',
            diamond: 'ダイヤモンド',
            platinum: 'プラチナ',
            gold: 'ゴールド',
            silver: 'シルバー',
            bronze: 'ブロンズ',
            iron: 'アイアン',
            steel: 'スチール',
            stone: 'ストーン',
            wood: 'ウッド',
            apprentice: '見習い',
            novice: '初心者',
            trainee: '研修生',
            beginner: 'ビギナー'
        },
        rankLevel: 'レベル {level}',
        nextRank: '次: {rank}'
    }
}