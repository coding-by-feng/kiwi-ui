import review from '@/api/review'
import paraphraseStarList from '@/api/paraphraseStarList'
import kiwiConst from '@/const/kiwiConsts'

const playCountOnce = 20 // Words per page in review mode
const readCountOnce = 20 // Words per page in read mode

export default {
    data() {
        return {
            reviewConstants: {
                playCountOnce,
                readCountOnce
            }
        }
    },

    methods: {
        // Review State Management
        isNeedStopReview() {
            console.log('this.isReviewStop = ' + this.isReviewStop)
            return this.isReviewStop || !this.isReview || this.playWordIndex < 0
        },

        prepareReview() {
            this.isReviewStop = false
        },

        async stopPlaying() {
            if (!this.isFirstIncome) {
                this.$message.success('停止播放当前复习的单词')
            }
            this.isReviewStop = true
            this.isReviewPlaying = false
            this.pauseAllPlayingAudio()
        },

        // Review Flow Control
        stockReviewStart() {
            try {
                this.playWordIndex = 0
                this.autoPlayDialogVisible++
                this.isFirstIncome = false

                if (this.isChToEn) {
                    this.detail.showTranslation = true
                }

                this.showDetail(this.listItems[0].paraphraseId, 0)
                    .then(() => {
                        this.detail.audioPlayer.play()
                    })
            } catch (e) {
                console.error(e)
            }
        },

        async recursiveReview() {
            await this.showDetail(this.listItems[this.playWordIndex].paraphraseId, this.playWordIndex)
            await this.initNextReviseDetail(false)
                .then(() => {
                    if (this.isDownloadReviewAudio) {
                        ++this.playWordIndex
                    } else {
                        this.detail.audioPlayer.play()
                    }
                })
        },

        async refreshReviseDetail() {
            this.$message.success('正在刷新当前复习资源')
            await this.cleanDetailRevising()
            this.prepareReview()
            await this.recursiveReview()
        },

        async ignoreCurrentReview() {
            console.log('ignoreCurrentReview')
            this.$message.success(`${this.isDownloadReviewAudio ? '下载' : '复习'}下一个单词`)
            await this.cleanDetailRevising()
            this.isReviewStop = false
        },

        // Review Detail Management
        async initNextReviseDetail(isGetDetail) {
            console.log('initNextReviewDetail this.playWordIndex = ' + this.playWordIndex)

            let loading = this.$loading({
                lock: true,
                text: '正在加载',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.7)'
            })

            this.prepareReview()

            if (isGetDetail) {
                this.handoffReviewWordSame()
                try {
                    const response = await this.getItemDetail(this.listItems[this.playWordIndex].paraphraseId)
                    this.detail.paraphraseVO = response.data.data
                    if (this.detail.paraphraseVO.wordName.indexOf(' ') > 0) {
                        this.detail.paraphraseVO.wordCharacter = kiwiConst.WORD_CHARACTER.PHRASE
                    }
                } catch (e) {
                    console.error(e)
                    throw e
                }
            }

            try {
                await this.createReviseQueue(this.detail.audioPlayerToken)
                this.detail.audioPlayer = this.getCurrentAudioPlayer(0)
            } catch (e) {
                throw e
            } finally {
                loading.close()
            }
        },

        // Learning Actions
        async rememberOneFun() {
            this.$message.success('正在标记单词已经记住')
            try {
                await this.rememberOne(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
                this.$message.success('操作成功')
                this.showNext()
            } catch (e) {
                console.error(e)
                this.$message.error('记住单词操作异常')
            }
        },

        async keepInMindFun() {
            this.$message.success('正在标记单词已经牢记')
            try {
                await this.keepInMind(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
                this.$message.success('操作成功')
                this.showNext()
            } catch (e) {
                console.error(e)
                this.$message.error('牢记单词操作异常')
            }
        },

        async forgetOneFun() {
            this.$message.success('正在标记单词已经忘记')
            try {
                await this.forgetOne(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
                this.$message.success('操作成功')
                this.showNext(false)
            } catch (e) {
                console.error(e)
                this.$message.error('忘记单词操作异常')
            }
        },

        async rememberInSleepMode(ignoreDoubleClick) {
            if (ignoreDoubleClick) {
                return
            }
            if (this.reviewMode === 'stockReview' || this.reviewMode === 'stockRead') {
                await this.rememberOneFun()
            } else {
                await this.keepInMindFun()
            }
        },

        // Review Progress Management
        async getReviewBreakpointPageNumber() {
            if (this.isFirstIncome && this.isReview) {
                try {
                    const response = await review.getReviewBreakpointPageNumber(this.listId)
                    this.page.current = response.data.data
                    this.isShowPagination = false
                    setTimeout(() => {
                        this.isShowPagination = true
                    }, 1)
                } catch (e) {
                    console.error(e)
                }
            }
        },

        // List Initialization Methods
        async initStockListFun() {
            await this.getReviewBreakpointPageNumber()
            try {
                const response = await this.getReviewListItems(this.page, this.listId)
                this.listItems = response.data.data.records
                this.page.pages = response.data.data.pages
                this.page.total = response.data.data.total
                this.page.current = response.data.data.current
            } catch (e) {
                console.error(e)
            }
        },

        async initEnhanceListFun() {
            await this.getReviewBreakpointPageNumber()
            try {
                const response = await this.getEnhanceListItems(this.page, this.listId)
                this.listItems = response.data.data.records
                this.page.pages = response.data.data.pages
                this.page.total = response.data.data.total
                this.page.current = response.data.data.current
            } catch (e) {
                console.error(e)
            }
        },

        async initDefaultListFun() {
            try {
                const response = await this.getListItems(this.page, this.listId)
                this.listItems = response.data.data.records
                this.page.pages = response.data.data.pages
                this.page.total = response.data.data.total
                this.page.current = response.data.data.current
            } catch (e) {
                console.error(e)
            }
        },

        async initList() {
            console.log('initList')

            if (this.reviewMode === 'stockReview' || this.reviewMode === 'stockRead') {
                this.page.size = playCountOnce
                await this.initStockListFun()
                return
            } else if (this.reviewMode === 'totalReview' || this.reviewMode === 'totalRead') {
                await this.getReviewBreakpointPageNumber()
                this.page.size = playCountOnce
            } else if (this.reviewMode === 'enhanceReview' || this.reviewMode === 'enhanceRead') {
                this.page.size = playCountOnce
                await this.initEnhanceListFun()
                return
            }

            await this.initDefaultListFun()
        },

        // API Methods (these should be imported from your API modules)
        async getItemDetail(paraphraseId) {
            // Implement API call to get item details
            return paraphraseStarList.getItemDetail(paraphraseId)
        },

        async getReviewListItems(page, listId) {
            // Implement API call to get review list items
            return paraphraseStarList.getReviewListItems(page, listId)
        },

        async getEnhanceListItems(page, listId) {
            // Implement API call to get enhance list items
            return paraphraseStarList.getEnhanceListItems(page, listId)
        },

        async getListItems(page, listId) {
            // Implement API call to get list items
            return paraphraseStarList.getListItems(page, listId)
        },

        async rememberOne(paraphraseId, listId) {
            // Implement API call to mark word as remembered
            return review.rememberOne(paraphraseId, listId)
        },

        async keepInMind(paraphraseId, listId) {
            // Implement API call to mark word as well-known
            return review.keepInMind(paraphraseId, listId)
        },

        async forgetOne(paraphraseId, listId) {
            // Implement API call to mark word as forgotten
            return review.forgetOne(paraphraseId, listId)
        },

        // Review Counter Management
        async increaseReviewCounter() {
            try {
                await review.increaseCounter(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REVIEW)
            } catch (e) {
                console.error('Failed to increase review counter:', e)
            }
        },

        // Review Validation
        isLastIndexPerPage() {
            return this.playWordIndex >= playCountOnce
        },

        isLastPage() {
            return this.page.current >= this.page.pages
        },

        // Review Flow Helpers
        async reviewNextWord() {
            if (this.isReview) {
                if (this.detail.showIndex !== this.playWordIndex) {
                    this.detail.showIndex = this.playWordIndex
                }
                this.detail.showIndex++
                this.playWordIndex++
            } else {
                this.detail.showIndex++
            }
            await this.skipCurrent()
        },

        async showNext(isSkipSomeAudio) {
            console.log('isSkipSomeAudio', isSkipSomeAudio)
            console.log('this.detail.isSleepMode', this.detail.isSleepMode)

            if (isSkipSomeAudio === false || isSkipSomeAudio === undefined) {
                await this.reviewNextWord()
            } else {
                this.skipSomeAudio()
            }
        },

        // Word Detail Management
        async showDetail(paraphraseId, index) {
            let loading = this.$loading({
                lock: true,
                text: '正在加载',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.7)'
            })

            if (null !== index && undefined !== index) {
                this.detail.showIndex = index
            }

            this.handoffReviewWordSame()

            try {
                const response = await this.getItemDetail(paraphraseId)
                this.detail.paraphraseVO = response.data.data

                if (this.detail.paraphraseVO.wordName.indexOf(' ') > 0) {
                    this.detail.paraphraseVO.wordCharacter = kiwiConst.WORD_CHARACTER.PHRASE
                }

                this.detail.listId = this.listItems[this.detail.showIndex].listId
                loading.close()
            } catch (e) {
                console.error(e)
                this.$message.error('加载释义详情异常')
                loading.close()
            }

            this.detail.dialogVisible = true

            if (this.isReview && !this.isReviewStop && !this.isReviewPlaying) {
                this.detail.reviewLoading = true
            }

            await this.increaseReviewCounter()
        },

        async showDetailNotLoadData() {
            console.log('showDetailNotLoadData')
            this.detail.dialogVisible = true

            if (this.isReview && !this.isReviewStop && !this.isReviewPlaying) {
                this.detail.reviewLoading = true
            }

            await this.increaseReviewCounter()
        },

        // Settings Management
        loadSettings() {
            // Load settings from store
            this.source = this.getStore({name: 'pronunciation_source'})
            this.reviewType = this.getStore({name: 'review_type'})
            this.spellType = this.getStore({name: 'spell_type'})
            this.enParaType = this.getStore({name: 'enPara_type'})
            this.isPlayExample = this.getStore({name: 'is_play_example'})
        },

        // Utility method for getting store values
        getStore(config) {
            // Implement based on your store structure
            // This is a placeholder - replace with actual store access
            return localStorage.getItem(config.name)
        }
    }
}