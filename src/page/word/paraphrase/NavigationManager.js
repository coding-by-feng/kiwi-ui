export default {
    methods: {
        // Page Navigation
        async skipCurrent() {
            console.log('skipCurrent')

            try {
                if (this.isChToEn) {
                    this.detail.showWord = false
                }

                let lastIndexPerPage = this.isLastIndexPerPage()
                let lastPage = this.isLastPage()

                console.log('skipCurrent wordName = ', this.detail.paraphraseVO.wordName)
                console.log('skipCurrent lastPage = ' + lastPage)
                console.log('skipCurrent this.playWordIndex = ' + this.playWordIndex)
                console.log('skipCurrent lastIndexPerPage = ' + lastIndexPerPage)
                console.log('skipCurrent this.detail.showIndex = ' + this.detail.showIndex)
                console.log('skipCurrent this.page.current = ' + this.page.current)
                console.log('skipCurrent this.page.size = ' + this.page.size)

                if (lastPage) {
                    let lastPageRemainder = this.page.total % this.page.size
                    if (lastIndexPerPage || (lastPageRemainder !== 0 && this.detail.showIndex === lastPageRemainder)) {
                        this.$message.warning('当前已经是最后一页最后一个')
                        return
                    }
                }

                console.log('Skipping... lastIndexPerPage', lastIndexPerPage)

                if (lastIndexPerPage) {
                    this.page.current++
                    await this.init()
                } else {
                    if (this.isReview) {
                        await this.ignoreCurrentReview(true)

                        try {
                            await this.initNextReviseDetail(true)
                            if (this.isDownloadReviewAudio) {
                                ++this.playWordIndex
                            } else {
                                this.detail.audioPlayer.play()
                            }
                        } catch (e) {
                            this.$message.error('初始化下一个释义详情异常!')
                            console.error('initNextReviseDetail error', e)
                        }

                        await this.showDetailNotLoadData()
                    } else {
                        await this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex)
                    }
                }
            } catch (e) {
                console.error('skipCurrent error:', e)
                this.$message.error('跳转异常')
            }
        },

        async showPrevious() {
            if (this.detail.showIndex === 0) {
                if (this.page.current === 1) {
                    this.$message.warning('当前已经是第一页第一个')
                    return
                }
                this.page.current--
                await this.init()
                this.detail.showIndex = this.page.size - 1
            } else {
                this.detail.showIndex--
            }

            await this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex)
        },

        // Router Navigation
        goBack() {
            this.$emit('tableVisibleToggle')
        },

        handleShowDetail() {
            this.detail.dialogVisible = false
            this.$router.push({
                path: '/index/vocabulary/detail',
                query: {
                    active: 'search',
                    originalText: this.detail.paraphraseVO.wordName
                }
            })
        },

        // Dialog Management
        handleDetailClose() {
            this.detail.dialogVisible = false
        },

        // Page Change Handling
        async pageChange() {
            this.isFirstIncome = false
            await this.init()
        },

        // Translation Toggle
        toggleTranslation() {
            this.detail.showTranslation = !this.detail.showTranslation
        },

        // Word Display Toggle
        toggleWordDisplay() {
            this.detail.showWord = !this.detail.showWord
        },

        // State Validation Helpers
        canNavigateNext() {
            if (this.isLastPage()) {
                let lastPageRemainder = this.page.total % this.page.size
                if (this.isLastIndexPerPage() ||
                    (lastPageRemainder !== 0 && this.detail.showIndex >= lastPageRemainder - 1)) {
                    return false
                }
            }
            return true
        },

        canNavigatePrevious() {
            return !(this.detail.showIndex === 0 && this.page.current === 1)
        },

        // Batch Navigation Operations
        async navigateToFirstWord() {
            this.page.current = 1
            this.detail.showIndex = 0
            this.playWordIndex = 0
            await this.init()

            if (this.listItems.length > 0) {
                await this.showDetail(this.listItems[0].paraphraseId, 0)
            }
        },

        async navigateToLastWord() {
            this.page.current = this.page.pages
            await this.init()

            const lastIndex = this.listItems.length - 1
            this.detail.showIndex = lastIndex
            this.playWordIndex = lastIndex

            if (this.listItems.length > 0) {
                await this.showDetail(this.listItems[lastIndex].paraphraseId, lastIndex)
            }
        },

        // Quick Navigation
        async navigateToWord(index) {
            if (index < 0 || index >= this.listItems.length) {
                this.$message.warning('索引超出范围')
                return
            }

            this.detail.showIndex = index
            if (this.isReview) {
                this.playWordIndex = index
            }

            await this.showDetail(this.listItems[index].paraphraseId, index)
        },

        // Navigation State Helpers
        getCurrentPosition() {
            return {
                page: this.page.current,
                index: this.detail.showIndex,
                total: this.page.total,
                pageSize: this.page.size
            }
        },

        getNavigationProgress() {
            const totalItems = this.page.total
            const currentItem = (this.page.current - 1) * this.page.size + this.detail.showIndex + 1
            return {
                current: currentItem,
                total: totalItems,
                percentage: Math.round((currentItem / totalItems) * 100)
            }
        },

        // Keyboard Navigation Support
        handleKeyboardNavigation(event) {
            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault()
                    this.showPrevious()
                    break
                case 'ArrowRight':
                    event.preventDefault()
                    this.showNext(false)
                    break
                case 'Space':
                    event.preventDefault()
                    if (this.isReview) {
                        this.skipSomeAudio()
                    }
                    break
                case 'Escape':
                    event.preventDefault()
                    this.handleDetailClose()
                    break
                default:
                    break
            }
        },

        // Touch/Swipe Navigation Support
        handleSwipeNavigation(direction) {
            switch (direction) {
                case 'left':
                    this.showNext(false)
                    break
                case 'right':
                    this.showPrevious()
                    break
                case 'up':
                    if (this.isReview) {
                        this.stopPlaying()
                    }
                    break
                case 'down':
                    if (this.isReview) {
                        this.showNext(true)
                    }
                    break
                default:
                    break
            }
        },

        // URL State Management
        updateUrlState() {
            const query = {
                ...this.$route.query,
                page: this.page.current,
                index: this.detail.showIndex
            }

            this.$router.replace({ query }).catch(() => {
                // Handle navigation errors silently
            })
        },

        // Restore Navigation State
        restoreNavigationState() {
            const query = this.$route.query

            if (query.page) {
                this.page.current = parseInt(query.page) || 1
            }

            if (query.index) {
                this.detail.showIndex = parseInt(query.index) || 0
                if (this.isReview) {
                    this.playWordIndex = this.detail.showIndex
                }
            }
        },

        // Navigation Event Listeners
        setupNavigationListeners() {
            // Keyboard navigation
            document.addEventListener('keydown', this.handleKeyboardNavigation)

            // Browser back/forward buttons
            window.addEventListener('popstate', this.restoreNavigationState)
        },

        cleanupNavigationListeners() {
            document.removeEventListener('keydown', this.handleKeyboardNavigation)
            window.removeEventListener('popstate', this.restoreNavigationState)
        }
    },

    mounted() {
        this.setupNavigationListeners()
        this.restoreNavigationState()
    },

    beforeDestroy() {
        this.cleanupNavigationListeners()
    }
}