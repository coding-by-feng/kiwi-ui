<template>
  <div class="private-notes">
    <!-- Header -->
    <div class="notes-header">
      <div v-if="!selectedCategory" class="header-with-lock">
        <h2>{{ $t('privateNotes.title') || 'Private Notes' }}</h2>
        <!-- Lock Controls -->
        <div v-if="isLogin && !checkingLockStatus && !showLockedOverlay" class="lock-controls">
          <el-tooltip :content="$t('privateNotes.listenAll') || 'Listen All Notes in Loop'" placement="bottom">
            <el-button
              size="mini"
              :icon="globalListenLoading ? '' : (globalListenMode ? 'el-icon-video-pause' : 'el-icon-headset')"
              circle
              :loading="globalListenLoading"
              :type="globalListenMode ? 'primary' : ''"
              @click="globalListenMode ? stopListenAll() : startListenAll()"
            ></el-button>
          </el-tooltip>
          <el-tooltip v-if="hasPasscode" :content="$t('privateNotes.lockNotes') || 'Lock Notes'" placement="bottom">
            <el-button
              size="mini"
              icon="el-icon-lock"
              circle
              @click="lockNotes"
            ></el-button>
          </el-tooltip>
          <el-tooltip :content="hasPasscode ? ($t('privateNotes.changePasscode') || 'Change Passcode') : ($t('privateNotes.setPasscode') || 'Set Passcode')" placement="bottom">
            <el-button
              size="mini"
              :icon="hasPasscode ? 'el-icon-key' : 'el-icon-plus'"
              circle
              @click="openSetPasscodeDialog"
            ></el-button>
          </el-tooltip>
        </div>
      </div>
      <div v-else class="category-header">
        <el-button icon="el-icon-arrow-left" size="small" @click="backToCategories">
          {{ $t('privateNotes.back') || 'Back' }}
        </el-button>
        <h2>{{ selectedCategory.name }}</h2>
        <div class="category-actions">
          <el-button
            size="mini"
            icon="el-icon-edit"
            circle
            @click="editCategory(selectedCategory)"
          ></el-button>
          <el-button
            size="mini"
            icon="el-icon-delete"
            circle
            type="danger"
            @click="confirmDeleteCategory(selectedCategory)"
          ></el-button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <i class="el-icon-loading"></i>
    </div>

    <!-- Login Required -->
    <div v-else-if="!isLogin" class="login-hint">
      <el-alert
        type="info"
        show-icon
        :title="$t('privateNotes.loginRequired') || 'Please log in to use Private Notes.'"
        :description="$t('privateNotes.loginDescription') || 'Login to create and manage your personal notes.'"
      />
    </div>

    <!-- Locked Overlay -->
    <div v-else-if="showLockedOverlay" class="locked-overlay">
      <div class="locked-content">
        <div class="locked-icon">
          <i class="el-icon-lock"></i>
        </div>
        <h3>{{ $t('privateNotes.notesLockedTitle') || 'Notes are Locked' }}</h3>
        <p>{{ $t('privateNotes.notesLockedDescription') || 'Enter your passcode to access your private notes.' }}</p>
        <el-button type="primary" @click="openUnlockDialog">
          <i class="el-icon-unlock"></i>
          {{ $t('privateNotes.unlock') || 'Unlock' }}
        </el-button>
      </div>
    </div>

    <!-- Categories List -->
    <div v-else-if="!selectedCategory" class="categories-container">
      <div class="categories-grid">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card"
          :style="{ '--accent-color': category.color || '#409EFF' }"
          @click="selectCategory(category)"
        >
          <div class="category-info">
            <h3>{{ category.name }}</h3>
            <p v-if="category.description">{{ category.description }}</p>
            <span class="item-count">{{ category.itemCount || 0 }} {{ $t('privateNotes.items') || 'items' }}</span>
          </div>
          <div class="category-card-actions" @click.stop>
            <el-button
              size="mini"
              icon="el-icon-edit"
              circle
              @click="editCategory(category)"
            ></el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              circle
              type="danger"
              @click="confirmDeleteCategory(category)"
            ></el-button>
          </div>
        </div>
      </div>

      <!-- Add Category Button -->
      <el-button
        type="primary"
        icon="el-icon-plus"
        class="add-category-btn"
        @click="openAddCategoryDialog"
      >
        {{ $t('privateNotes.addCategory') || 'Add Category' }}
      </el-button>
    </div>

    <!-- Notes List / Card View -->
    <div v-else class="notes-container">
      <!-- View Mode Toggle -->
      <div class="view-controls">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="list">
            <i class="el-icon-s-operation"></i>
          </el-radio-button>
          <el-radio-button label="card">
            <i class="el-icon-document"></i>
          </el-radio-button>
        </el-radio-group>

        <el-button
          type="primary"
          icon="el-icon-plus"
          size="small"
          @click="openAddItemDialog"
        >
          {{ $t('privateNotes.addNote') || 'Add Note' }}
        </el-button>
      </div>

      <!-- List View -->
      <div v-if="viewMode === 'list'" class="notes-list">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          class="note-item"
          @click="openCardView(item)"
        >
          <div class="note-content">
            <p>{{ truncateContent(item.content) }}</p>
          </div>
          <div class="note-item-actions" @click.stop>
            <span v-if="item.audioStatus === 'READY'" class="icon-btn status-icon">
              <i class="el-icon-headset"></i>
            </span>
            <span v-if="item.imageStatus === 'READY'" class="icon-btn status-icon">
              <i class="el-icon-picture"></i>
            </span>
            <span
              class="icon-btn reorder-icon"
              :class="{ 'is-disabled': index === 0 || reorderingItemId === item.id }"
              @click="moveItemUp(item, index)"
            >
              <i :class="reorderingItemId === item.id ? 'el-icon-loading' : 'el-icon-top'"></i>
            </span>
            <span
              class="icon-btn reorder-icon"
              :class="{ 'is-disabled': index === items.length - 1 || reorderingItemId === item.id }"
              @click="moveItemDown(item, index)"
            >
              <i :class="reorderingItemId === item.id ? 'el-icon-loading' : 'el-icon-bottom'"></i>
            </span>
            <span class="icon-btn edit-icon" @click="editItem(item)">
              <i class="el-icon-edit"></i>
            </span>
            <span class="icon-btn delete-icon" @click="confirmDeleteItem(item)">
              <i class="el-icon-delete"></i>
            </span>
          </div>
        </div>

        <div v-if="items.length === 0" class="empty-state">
          <div class="empty-state-icon">
            <i class="el-icon-document"></i>
          </div>
          <p>{{ $t('privateNotes.noNotes') || 'No notes yet. Add your first note!' }}</p>
          <el-button type="primary" size="small" icon="el-icon-plus" @click="openAddItemDialog">
            {{ $t('privateNotes.addNote') || 'Add Note' }}
          </el-button>
        </div>
      </div>

      <!-- Card View (Flashcard Mode) -->
      <div v-else class="card-view">
        <div v-if="currentItem" class="note-card">
          <!-- Card Actions -->
          <div class="card-actions-top">
            <el-button
              size="mini"
              icon="el-icon-edit"
              circle
              @click="editItem(currentItem)"
            ></el-button>
            <el-button
              size="mini"
              icon="el-icon-delete"
              circle
              type="danger"
              @click="confirmDeleteItem(currentItem)"
            ></el-button>
          </div>

          <!-- Image -->
          <div v-if="currentItem.imageStatus === 'READY'" class="card-image">
            <img :src="getImageUrl(currentItem.id, currentItem.updateTime)" alt="Note image" />
          </div>

          <!-- Content -->
          <div class="card-content">
            <p>{{ currentItem.content }}</p>
          </div>

          <!-- Audio Player -->
          <div v-if="currentItem.audioStatus === 'READY'" class="audio-player">
            <audio
              ref="audioPlayer"
              :src="getAudioUrl(currentItem.id)"
              @ended="onAudioEnded"
              controls
            ></audio>
          </div>

          <!-- Navigation -->
          <div class="card-navigation">
            <el-button
              icon="el-icon-arrow-left"
              circle
              @click="navigatePrevious"
              :disabled="items.length <= 1"
            ></el-button>
            <span class="card-index">{{ currentIndex + 1 }} / {{ items.length }}</span>
            <el-button
              icon="el-icon-arrow-right"
              circle
              @click="navigateNext"
              :disabled="items.length <= 1"
            ></el-button>
          </div>

          <!-- Loop Controls -->
          <div class="loop-controls">
            <!-- Play/Stop Button -->
            <el-button
              :type="isPlaying ? 'danger' : 'primary'"
              size="small"
              @click="togglePlayback"
              :disabled="!currentItem || currentItem.audioStatus !== 'READY'"
            >
              <i :class="isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'"></i>
              {{ isPlaying ? ($t('privateNotes.stop') || 'Stop') : ($t('privateNotes.play') || 'Play') }}
            </el-button>

            <!-- Loop Mode Selector -->
            <el-dropdown @command="setLoopMode" trigger="click">
              <el-button size="small" :class="{ 'loop-active': loopMode !== 'none' }">
                <i :class="getLoopModeIcon()"></i>
                {{ getLoopModeLabel() }}
                <i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="none" :class="{ 'is-active': loopMode === 'none' }">
                  <i class="el-icon-video-play"></i>
                  {{ $t('privateNotes.loopNone') || 'No Loop' }}
                </el-dropdown-item>
                <el-dropdown-item command="single" :class="{ 'is-active': loopMode === 'single' }">
                  <i class="el-icon-refresh"></i>
                  {{ $t('privateNotes.loopSingle') || 'Loop One' }}
                </el-dropdown-item>
                <el-dropdown-item command="all" :class="{ 'is-active': loopMode === 'all' }">
                  <i class="el-icon-refresh-right"></i>
                  {{ $t('privateNotes.loopAll') || 'Loop All' }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>

          <!-- Generate Actions -->
          <div class="generate-actions">
            <el-dropdown @command="handleGenerateAudio" trigger="click">
              <el-button size="small" :loading="generatingAudio">
                <i class="el-icon-headset"></i>
                {{ $t('privateNotes.generateAudio') || 'Audio' }}
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="US">US English</el-dropdown-item>
                <el-dropdown-item command="UK">UK English</el-dropdown-item>
                <el-dropdown-item command="AU">Australian</el-dropdown-item>
                <el-dropdown-item command="IN">Indian</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>

            <el-dropdown @command="handleGenerateImage" trigger="click">
              <el-button size="small" :loading="generatingImage">
                <i class="el-icon-picture"></i>
                {{ $t('privateNotes.generateImage') || 'Image' }}
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                  v-for="style in imageStyles"
                  :key="style.id"
                  :command="style.id"
                >
                  <div class="style-option">
                    <span class="style-name">{{ style.name }}</span>
                    <span class="style-desc">{{ style.description }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item v-if="imageStyles.length === 0" disabled>
                  {{ loadingImageStyles ? 'Loading styles...' : 'No styles available' }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state-icon">
            <i class="el-icon-document"></i>
          </div>
          <p>{{ $t('privateNotes.noNotes') || 'No notes yet. Add your first note!' }}</p>
          <el-button type="primary" size="small" icon="el-icon-plus" @click="openAddItemDialog">
            {{ $t('privateNotes.addNote') || 'Add Note' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Category Dialog (Add/Edit) -->
    <el-dialog
      :title="editingCategoryId ? ($t('privateNotes.editCategory') || 'Edit Category') : ($t('privateNotes.addCategory') || 'Add Category')"
      :visible.sync="showCategoryDialog"
      :width="dialogWidth"
      :close-on-click-modal="false"
      :fullscreen="isMobileDevice"
      class="notes-dialog"
      @closed="resetCategoryForm"
    >
      <el-form :model="categoryForm" label-position="top">
        <el-form-item :label="$t('privateNotes.categoryName') || 'Name'" required>
          <el-input v-model="categoryForm.name" maxlength="100" :placeholder="$t('privateNotes.categoryNamePlaceholder') || 'Enter category name'"></el-input>
        </el-form-item>
        <el-form-item :label="$t('privateNotes.description') || 'Description'">
          <el-input v-model="categoryForm.description" type="textarea" maxlength="500" :placeholder="$t('privateNotes.descriptionPlaceholder') || 'Optional description'"></el-input>
        </el-form-item>
        <el-form-item :label="$t('privateNotes.color') || 'Color'">
          <el-color-picker v-model="categoryForm.color" show-alpha></el-color-picker>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showCategoryDialog = false">{{ $t('common.cancel') || 'Cancel' }}</el-button>
        <el-button type="primary" @click="saveCategory" :loading="savingCategory">
          {{ $t('common.save') || 'Save' }}
        </el-button>
      </span>
    </el-dialog>

    <!-- Note Dialog (Add/Edit) -->
    <el-dialog
      :title="editingItemId ? ($t('privateNotes.editNote') || 'Edit Note') : ($t('privateNotes.addNote') || 'Add Note')"
      :visible.sync="showItemDialog"
      :width="dialogWidth"
      :close-on-click-modal="false"
      :fullscreen="isMobileDevice"
      class="notes-dialog"
      @closed="resetItemForm"
    >
      <el-form :model="itemForm" label-position="top">
        <el-form-item :label="$t('privateNotes.content') || 'Content'" required>
          <el-input v-model="itemForm.content" type="textarea" rows="8" :placeholder="$t('privateNotes.contentPlaceholder') || 'Write your note here...'"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showItemDialog = false">{{ $t('common.cancel') || 'Cancel' }}</el-button>
        <el-button type="primary" @click="saveItem" :loading="savingItem">
          {{ $t('common.save') || 'Save' }}
        </el-button>
      </span>
    </el-dialog>

    <!-- Delete Confirmation Dialog -->
    <el-dialog
      :title="$t('privateNotes.confirmDelete') || 'Confirm Delete'"
      :visible.sync="showDeleteDialog"
      width="400px"
      :close-on-click-modal="false"
      class="notes-dialog delete-dialog"
    >
      <div class="delete-confirm-content">
        <i class="el-icon-warning-outline"></i>
        <p>{{ deleteConfirmMessage }}</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showDeleteDialog = false">{{ $t('common.cancel') || 'Cancel' }}</el-button>
        <el-button type="danger" @click="executeDelete" :loading="deleting">
          {{ $t('common.delete') || 'Delete' }}
        </el-button>
      </span>
    </el-dialog>

    <!-- Set/Change Passcode Dialog -->
    <el-dialog
      :title="hasPasscode ? ($t('privateNotes.changePasscode') || 'Change Passcode') : ($t('privateNotes.setPasscode') || 'Set Passcode')"
      :visible.sync="showSetPasscodeDialog"
      :width="dialogWidth"
      :close-on-click-modal="false"
      :fullscreen="isMobileDevice"
      class="notes-dialog passcode-dialog"
      @closed="resetPasscodeForm"
    >
      <el-form :model="passcodeForm" label-position="top">
        <el-form-item v-if="hasPasscode" :label="$t('privateNotes.currentPasscode') || 'Current Passcode'" required>
          <el-input
            v-model="passcodeForm.currentPasscode"
            type="password"
            show-password
            :placeholder="$t('privateNotes.enterCurrentPasscode') || 'Enter current passcode'"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('privateNotes.newPasscode') || 'New Passcode'" required>
          <el-input
            v-model="passcodeForm.newPasscode"
            type="password"
            show-password
            :placeholder="$t('privateNotes.enterNewPasscode') || 'Enter new passcode (min 4 characters)'"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('privateNotes.confirmPasscode') || 'Confirm Passcode'" required>
          <el-input
            v-model="passcodeForm.confirmPasscode"
            type="password"
            show-password
            :placeholder="$t('privateNotes.confirmNewPasscode') || 'Confirm new passcode'"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer passcode-footer">
        <el-button v-if="hasPasscode" type="danger" plain @click="removePasscode" :loading="savingPasscode">
          {{ $t('privateNotes.removePasscode') || 'Remove Passcode' }}
        </el-button>
        <div class="footer-right">
          <el-button @click="showSetPasscodeDialog = false">{{ $t('common.cancel') || 'Cancel' }}</el-button>
          <el-button type="primary" @click="savePasscode" :loading="savingPasscode">
            {{ $t('common.save') || 'Save' }}
          </el-button>
        </div>
      </span>
    </el-dialog>

    <!-- Global Listen All Mini Player -->
    <div v-if="globalListenMode" class="global-listen-player">
      <audio
        ref="globalAudioPlayer"
        :src="globalAudioSrc"
        @ended="onGlobalAudioEnded"
        style="display:none"
      ></audio>
      <div class="glp-info">
        <i class="el-icon-headset glp-icon"></i>
        <p class="glp-content">{{ globalCurrentItem && truncateContent(globalCurrentItem.content, 70) }}</p>
        <span class="glp-count">{{ globalListenIndex + 1 }} / {{ globalListenItems.length }}</span>
      </div>
      <div class="glp-controls">
        <el-button icon="el-icon-arrow-left" size="mini" circle @click="globalPrevious"></el-button>
        <el-button
          :icon="isGlobalPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'"
          size="mini"
          circle
          :type="isGlobalPlaying ? 'danger' : 'primary'"
          @click="toggleGlobalPlayback"
        ></el-button>
        <el-button icon="el-icon-arrow-right" size="mini" circle @click="globalNext"></el-button>
        <el-button icon="el-icon-close" size="mini" circle @click="stopListenAll"></el-button>
      </div>
    </div>

    <!-- Unlock Dialog -->
    <el-dialog
      :title="$t('privateNotes.unlockNotes') || 'Unlock Notes'"
      :visible.sync="showUnlockDialog"
      width="400px"
      :close-on-click-modal="false"
      class="notes-dialog unlock-dialog"
      @closed="resetUnlockForm"
    >
      <div class="unlock-content">
        <div class="unlock-icon">
          <i class="el-icon-unlock"></i>
        </div>
        <el-form :model="unlockForm" @submit.native.prevent="unlockNotes">
          <el-form-item>
            <el-input
              v-model="unlockForm.passcode"
              type="password"
              show-password
              :placeholder="$t('privateNotes.enterPasscode') || 'Enter your passcode'"
              @keyup.enter.native="unlockNotes"
            ></el-input>
          </el-form-item>
          <div v-if="unlockError" class="unlock-error">
            <i class="el-icon-warning"></i>
            {{ unlockError }}
          </div>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showUnlockDialog = false">{{ $t('common.cancel') || 'Cancel' }}</el-button>
        <el-button type="primary" @click="unlockNotes" :loading="unlocking">
          {{ $t('privateNotes.unlock') || 'Unlock' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getStore } from '@/util/store'
import notesApi from '@/api/notes'

export default {
  name: 'PrivateNotes',
  data() {
    return {
      loading: false,
      categories: [],
      selectedCategory: null,
      items: [],
      viewMode: 'list',
      currentIndex: 0,
      // Loop modes: 'none' | 'single' | 'all'
      loopMode: 'none',
      isPlaying: false,

      // Lock status
      lockStatus: {
        hasPasscode: false,
        isLocked: false
      },
      checkingLockStatus: true,

      // Dialogs
      showCategoryDialog: false,
      showItemDialog: false,
      showDeleteDialog: false,
      showSetPasscodeDialog: false,
      showUnlockDialog: false,

      // Passcode forms
      passcodeForm: {
        currentPasscode: '',
        newPasscode: '',
        confirmPasscode: ''
      },
      unlockForm: {
        passcode: ''
      },
      savingPasscode: false,
      unlocking: false,
      unlockError: '',

      // Edit mode tracking
      editingCategoryId: null,
      editingItemId: null,

      // Delete confirmation
      deleteType: null, // 'category' or 'item'
      deleteTarget: null,
      deleteConfirmMessage: '',
      deleting: false,

      // Forms
      categoryForm: {
        name: '',
        description: '',
        color: '#409EFF',
        icon: 'star'
      },
      itemForm: {
        content: ''
      },

      // Loading states
      savingCategory: false,
      savingItem: false,
      generatingAudio: false,
      generatingImage: false,
      reorderingItemId: null,

      // Image styles
      imageStyles: [],
      loadingImageStyles: false,

      // Global Listen All mode
      globalListenMode: false,
      globalListenItems: [],
      globalListenIndex: 0,
      globalListenLoading: false,
      isGlobalPlaying: false,

      // Responsive
      innerWidth: window.innerWidth
    }
  },
  computed: {
    isLogin() {
      return !!getStore({ name: 'access_token' })
    },
    currentItem() {
      return this.items[this.currentIndex] || null
    },
    isLocked() {
      return this.lockStatus.isLocked
    },
    hasPasscode() {
      return this.lockStatus.hasPasscode
    },
    showLockedOverlay() {
      return this.isLogin && this.hasPasscode && this.isLocked
    },
    // Responsive helpers
    isMobileDevice() {
      return this.innerWidth <= 480
    },
    isTablet() {
      return this.innerWidth > 480 && this.innerWidth <= 1024
    },
    isDesktop() {
      return this.innerWidth > 1024
    },
    dialogWidth() {
      if (this.isMobileDevice) return '100%'
      if (this.isTablet) return '80%'
      return '500px'
    },
    globalCurrentItem() {
      return this.globalListenItems[this.globalListenIndex] || null
    },
    globalAudioSrc() {
      if (!this.globalCurrentItem) return ''
      return this.getAudioUrl(this.globalCurrentItem.id)
    }
  },
  watch: {
    globalListenIndex() {
      if (this.globalListenMode && this.isGlobalPlaying) {
        this.$nextTick(() => {
          if (this.$refs.globalAudioPlayer) {
            this.$refs.globalAudioPlayer.load()
            this.$refs.globalAudioPlayer.play()
          }
        })
      }
    }
  },
  mounted() {
    if (this.isLogin) {
      this.checkLockStatus()
      this.loadImageStyles()
    }
    // Add resize listener for responsive behavior
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.stopListenAll()
  },
  methods: {
    handleResize() {
      this.innerWidth = window.innerWidth
    },

    // ============ Lock Methods ============
    async checkLockStatus() {
      this.checkingLockStatus = true
      try {
        const res = await notesApi.getLockStatus()
        if (res.data && res.data.code === 0) {
          const data = res.data.data || {}
          // Map API response: 'locked' -> 'isLocked'
          this.lockStatus = {
            hasPasscode: data.hasPasscode || false,
            isLocked: data.locked || false
          }
          // If not locked, load categories
          if (!this.lockStatus.isLocked) {
            this.loadCategories()
          }
        }
      } catch (e) {
        console.error('Failed to check lock status:', e)
        // On error, assume not locked and try loading
        this.loadCategories()
      } finally {
        this.checkingLockStatus = false
      }
    },

    openSetPasscodeDialog() {
      this.passcodeForm = { currentPasscode: '', newPasscode: '', confirmPasscode: '' }
      this.showSetPasscodeDialog = true
    },

    resetPasscodeForm() {
      this.passcodeForm = { currentPasscode: '', newPasscode: '', confirmPasscode: '' }
    },

    resetUnlockForm() {
      this.unlockForm = { passcode: '' }
      this.unlockError = ''
    },

    async savePasscode() {
      // Validate
      if (!this.passcodeForm.newPasscode) {
        this.$message.warning(this.$t('privateNotes.passcodeRequired') || 'Passcode is required')
        return
      }
      if (this.passcodeForm.newPasscode.length < 4) {
        this.$message.warning(this.$t('privateNotes.passcodeTooShort') || 'Passcode must be at least 4 characters')
        return
      }
      if (this.passcodeForm.newPasscode !== this.passcodeForm.confirmPasscode) {
        this.$message.warning(this.$t('privateNotes.passcodeNoMatch') || 'Passcodes do not match')
        return
      }
      // If changing passcode, require current passcode
      if (this.hasPasscode && !this.passcodeForm.currentPasscode) {
        this.$message.warning(this.$t('privateNotes.currentPasscodeRequired') || 'Current passcode is required')
        return
      }

      this.savingPasscode = true
      try {
        const body = { newPasscode: this.passcodeForm.newPasscode }
        if (this.hasPasscode) {
          body.currentPasscode = this.passcodeForm.currentPasscode
        }
        const res = await notesApi.setPasscode(body)
        if (res.data && res.data.code === 0) {
          const msg = this.hasPasscode
            ? (this.$t('privateNotes.passcodeChanged') || 'Passcode changed successfully')
            : (this.$t('privateNotes.passcodeSet') || 'Passcode set successfully')
          this.$message.success(msg)
          this.showSetPasscodeDialog = false
          this.lockStatus.hasPasscode = true
        } else {
          this.$message.error(res.data?.msg || 'Failed to set passcode')
        }
      } catch (e) {
        console.error('Failed to set passcode:', e)
        this.$message.error('Failed to set passcode')
      } finally {
        this.savingPasscode = false
      }
    },

    async removePasscode() {
      if (!this.passcodeForm.currentPasscode) {
        this.$message.warning(this.$t('privateNotes.currentPasscodeRequired') || 'Current passcode is required')
        return
      }

      this.savingPasscode = true
      try {
        const res = await notesApi.removePasscode(this.passcodeForm.currentPasscode)
        if (res.data && res.data.code === 0) {
          this.$message.success(this.$t('privateNotes.passcodeRemoved') || 'Passcode removed successfully')
          this.showSetPasscodeDialog = false
          this.lockStatus.hasPasscode = false
          this.lockStatus.isLocked = false
        } else {
          this.$message.error(res.data?.msg || 'Failed to remove passcode')
        }
      } catch (e) {
        console.error('Failed to remove passcode:', e)
        this.$message.error('Failed to remove passcode')
      } finally {
        this.savingPasscode = false
      }
    },

    async lockNotes() {
      try {
        const res = await notesApi.lockNotes()
        if (res.data && res.data.code === 0) {
          this.lockStatus.isLocked = true
          this.$message.success(this.$t('privateNotes.notesLocked') || 'Notes locked')
        } else {
          this.$message.error(res.data?.msg || 'Failed to lock notes')
        }
      } catch (e) {
        console.error('Failed to lock notes:', e)
        this.$message.error('Failed to lock notes')
      }
    },

    openUnlockDialog() {
      this.unlockForm = { passcode: '' }
      this.unlockError = ''
      this.showUnlockDialog = true
    },

    async unlockNotes() {
      if (!this.unlockForm.passcode) {
        this.unlockError = this.$t('privateNotes.enterPasscode') || 'Please enter your passcode'
        return
      }

      this.unlocking = true
      this.unlockError = ''
      try {
        const res = await notesApi.unlockNotes(this.unlockForm.passcode)
        if (res.data && res.data.code === 0) {
          this.lockStatus.isLocked = false
          this.showUnlockDialog = false
          this.$message.success(this.$t('privateNotes.notesUnlocked') || 'Notes unlocked')
          // Load categories after unlocking
          this.loadCategories()
        } else {
          this.unlockError = res.data?.msg || (this.$t('privateNotes.incorrectPasscode') || 'Incorrect passcode')
        }
      } catch (e) {
        console.error('Failed to unlock notes:', e)
        this.unlockError = this.$t('privateNotes.incorrectPasscode') || 'Incorrect passcode'
      } finally {
        this.unlocking = false
      }
    },

    async loadCategories() {
      this.loading = true
      try {
        const res = await notesApi.listCategories()
        if (res.data && res.data.code === 0) {
          this.categories = res.data.data || []
        }
      } catch (e) {
        console.error('Failed to load categories:', e)
      } finally {
        this.loading = false
      }
    },

    async selectCategory(category) {
      this.selectedCategory = category
      this.loading = true
      try {
        const res = await notesApi.listItems(category.id)
        if (res.data && res.data.code === 0) {
          this.items = res.data.data || []
          this.currentIndex = 0
        }
      } catch (e) {
        console.error('Failed to load items:', e)
      } finally {
        this.loading = false
      }
    },

    backToCategories() {
      this.selectedCategory = null
      this.items = []
      this.currentIndex = 0
      this.loopMode = 'none'
      this.isPlaying = false
      this.loadCategories()
    },

    openCardView(item) {
      this.currentIndex = this.items.findIndex(i => i.id === item.id)
      this.viewMode = 'card'
    },

    truncateContent(content, maxLength = 100) {
      if (!content) return ''
      return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
    },

    getAudioUrl(itemId) {
      const token = getStore({ name: 'access_token' })
      const baseUrl = notesApi.getAudioStreamUrl(itemId)
      return token ? `${baseUrl}?access_token=${token}` : baseUrl
    },

    getImageUrl(itemId, updateTime) {
      const token = getStore({ name: 'access_token' })
      const baseUrl = notesApi.getImageStreamUrl(itemId)
      const cacheBuster = updateTime ? `&_t=${new Date(updateTime).getTime()}` : ''
      return token ? `${baseUrl}?access_token=${token}${cacheBuster}` : baseUrl
    },

    navigateNext() {
      if (this.items.length === 0) return
      this.currentIndex = (this.currentIndex + 1) % this.items.length
    },

    navigatePrevious() {
      if (this.items.length === 0) return
      this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length
    },

    // Loop mode methods
    setLoopMode(mode) {
      this.loopMode = mode
    },

    cycleLoopMode() {
      const modes = ['none', 'single', 'all']
      const currentIdx = modes.indexOf(this.loopMode)
      this.loopMode = modes[(currentIdx + 1) % modes.length]
    },

    getLoopModeIcon() {
      switch (this.loopMode) {
        case 'single': return 'el-icon-refresh'
        case 'all': return 'el-icon-refresh-right'
        default: return 'el-icon-video-play'
      }
    },

    getLoopModeLabel() {
      switch (this.loopMode) {
        case 'single': return this.$t('privateNotes.loopSingle') || 'Loop One'
        case 'all': return this.$t('privateNotes.loopAll') || 'Loop All'
        default: return this.$t('privateNotes.loopNone') || 'No Loop'
      }
    },

    startPlayback() {
      this.isPlaying = true
      if (this.$refs.audioPlayer) {
        this.$refs.audioPlayer.play()
      }
    },

    stopPlayback() {
      this.isPlaying = false
      if (this.$refs.audioPlayer) {
        this.$refs.audioPlayer.pause()
        this.$refs.audioPlayer.currentTime = 0
      }
    },

    togglePlayback() {
      if (this.isPlaying) {
        this.stopPlayback()
      } else {
        this.startPlayback()
      }
    },

    onAudioEnded() {
      switch (this.loopMode) {
        case 'single':
          // Replay the same item
          this.$nextTick(() => {
            if (this.$refs.audioPlayer) {
              this.$refs.audioPlayer.currentTime = 0
              this.$refs.audioPlayer.play()
            }
          })
          break
        case 'all':
          // Move to next item and continue playing
          const isLastItem = this.currentIndex === this.items.length - 1
          this.navigateNext()
          this.$nextTick(() => {
            if (this.$refs.audioPlayer) {
              // Continue playing (loop back to first if at end)
              this.$refs.audioPlayer.play()
            }
          })
          break
        default:
          // No loop - stop playing
          this.isPlaying = false
          break
      }
    },

    async handleGenerateAudio(accent) {
      if (!this.currentItem) return
      this.generatingAudio = true
      try {
        const res = await notesApi.generateAudio({
          noteItemId: this.currentItem.id,
          accent: accent,
          voice: 'alloy'
        })
        if (res.data && res.data.code === 0) {
          const updated = res.data.data
          this.$set(this.items, this.currentIndex, { ...this.currentItem, ...updated })
          this.$message.success(this.$t('privateNotes.audioGenerated') || 'Audio generated successfully')
        } else {
          this.$message.error(res.data?.msg || 'Failed to generate audio')
        }
      } catch (e) {
        console.error('Failed to generate audio:', e)
        this.$message.error('Failed to generate audio')
      } finally {
        this.generatingAudio = false
      }
    },

    async loadImageStyles() {
      if (this.imageStyles.length > 0) return // Already loaded
      this.loadingImageStyles = true
      try {
        const res = await notesApi.getImageStyles()
        if (res.data && res.data.code === 0) {
          this.imageStyles = res.data.data || []
        }
      } catch (e) {
        console.error('Failed to load image styles:', e)
      } finally {
        this.loadingImageStyles = false
      }
    },

    async handleGenerateImage(styleId) {
      if (!this.currentItem || !styleId) return
      this.generatingImage = true
      try {
        const res = await notesApi.generateImage({
          noteItemId: this.currentItem.id,
          style: styleId
        })
        if (res.data && res.data.code === 0) {
          const updated = res.data.data
          this.$set(this.items, this.currentIndex, { ...this.currentItem, ...updated })
          this.$message.success(this.$t('privateNotes.imageGenerated') || 'Image generated successfully')
        } else {
          this.$message.error(res.data?.msg || 'Failed to generate image')
        }
      } catch (e) {
        console.error('Failed to generate image:', e)
        this.$message.error('Failed to generate image')
      } finally {
        this.generatingImage = false
      }
    },

    // ============ Category CRUD ============
    openAddCategoryDialog() {
      this.editingCategoryId = null
      this.categoryForm = { name: '', description: '', color: '#409EFF', icon: 'star' }
      this.showCategoryDialog = true
    },

    editCategory(category) {
      this.editingCategoryId = category.id
      this.categoryForm = {
        name: category.name || '',
        description: category.description || '',
        color: category.color || '#409EFF',
        icon: category.icon || 'star'
      }
      this.showCategoryDialog = true
    },

    resetCategoryForm() {
      this.editingCategoryId = null
      this.categoryForm = { name: '', description: '', color: '#409EFF', icon: 'star' }
    },

    async saveCategory() {
      if (!this.categoryForm.name.trim()) {
        this.$message.warning(this.$t('privateNotes.categoryNameRequired') || 'Category name is required')
        return
      }
      this.savingCategory = true
      try {
        let res
        if (this.editingCategoryId) {
          res = await notesApi.updateCategory(this.editingCategoryId, this.categoryForm)
        } else {
          res = await notesApi.createCategory(this.categoryForm)
        }
        if (res.data && res.data.code === 0) {
          const msg = this.editingCategoryId
            ? (this.$t('privateNotes.categoryUpdated') || 'Category updated')
            : (this.$t('privateNotes.categorySaved') || 'Category created')
          this.$message.success(msg)
          this.showCategoryDialog = false
          // If editing the selected category, update it
          if (this.editingCategoryId && this.selectedCategory && this.selectedCategory.id === this.editingCategoryId) {
            this.selectedCategory = { ...this.selectedCategory, ...this.categoryForm }
          }
          this.loadCategories()
        } else {
          this.$message.error(res.data?.msg || 'Failed to save category')
        }
      } catch (e) {
        console.error('Failed to save category:', e)
        this.$message.error('Failed to save category')
      } finally {
        this.savingCategory = false
      }
    },

    confirmDeleteCategory(category) {
      this.deleteType = 'category'
      this.deleteTarget = category
      this.deleteConfirmMessage = this.$t('privateNotes.deleteCategoryConfirm', { name: category.name }) ||
        `Are you sure you want to delete "${category.name}"? All notes in this category will be permanently deleted.`
      this.showDeleteDialog = true
    },

    async deleteCategory() {
      try {
        const res = await notesApi.deleteCategory(this.deleteTarget.id)
        if (res.data && res.data.code === 0) {
          this.$message.success(this.$t('privateNotes.categoryDeleted') || 'Category deleted')
          // If we deleted the selected category, go back
          if (this.selectedCategory && this.selectedCategory.id === this.deleteTarget.id) {
            this.backToCategories()
          } else {
            this.loadCategories()
          }
        } else {
          this.$message.error(res.data?.msg || 'Failed to delete category')
        }
      } catch (e) {
        console.error('Failed to delete category:', e)
        this.$message.error('Failed to delete category')
      }
    },

    // ============ Item CRUD ============
    openAddItemDialog() {
      this.editingItemId = null
      this.itemForm = { content: '' }
      this.showItemDialog = true
    },

    editItem(item) {
      this.editingItemId = item.id
      this.itemForm = {
        content: item.content || ''
      }
      this.showItemDialog = true
    },

    resetItemForm() {
      this.editingItemId = null
      this.itemForm = { content: '' }
    },

    async saveItem() {
      if (!this.itemForm.content.trim()) {
        this.$message.warning(this.$t('privateNotes.contentRequired') || 'Content is required')
        return
      }
      this.savingItem = true
      try {
        let res
        if (this.editingItemId) {
          res = await notesApi.updateItem(this.editingItemId, {
            categoryId: this.selectedCategory.id,
            content: this.itemForm.content
          })
        } else {
          res = await notesApi.createItem({
            categoryId: this.selectedCategory.id,
            content: this.itemForm.content
          })
        }
        if (res.data && res.data.code === 0) {
          const msg = this.editingItemId
            ? (this.$t('privateNotes.noteUpdated') || 'Note updated')
            : (this.$t('privateNotes.noteSaved') || 'Note created')
          this.$message.success(msg)
          this.showItemDialog = false
          // Refresh items
          this.selectCategory(this.selectedCategory)
        } else {
          this.$message.error(res.data?.msg || 'Failed to save note')
        }
      } catch (e) {
        console.error('Failed to save note:', e)
        this.$message.error('Failed to save note')
      } finally {
        this.savingItem = false
      }
    },

    confirmDeleteItem(item) {
      this.deleteType = 'item'
      this.deleteTarget = item
      const preview = this.truncateContent(item.content, 30) || 'this note'
      this.deleteConfirmMessage = this.$t('privateNotes.deleteNoteConfirm', { content: preview }) ||
        `Are you sure you want to delete "${preview}"?`
      this.showDeleteDialog = true
    },

    async deleteItem() {
      try {
        const res = await notesApi.deleteItem(this.deleteTarget.id)
        if (res.data && res.data.code === 0) {
          this.$message.success(this.$t('privateNotes.noteDeleted') || 'Note deleted')
          // Refresh items
          await this.selectCategory(this.selectedCategory)
          // Adjust current index if needed
          if (this.currentIndex >= this.items.length) {
            this.currentIndex = Math.max(0, this.items.length - 1)
          }
        } else {
          this.$message.error(res.data?.msg || 'Failed to delete note')
        }
      } catch (e) {
        console.error('Failed to delete note:', e)
        this.$message.error('Failed to delete note')
      }
    },

    // ============ Item Reordering ============
    async moveItemUp(item, index) {
      if (index === 0 || this.reorderingItemId) return
      this.reorderingItemId = item.id
      try {
        const res = await notesApi.moveItemUp(item.id)
        if (res.data && res.data.code === 0) {
          // Swap items in local array for immediate UI feedback
          const temp = this.items[index]
          this.$set(this.items, index, this.items[index - 1])
          this.$set(this.items, index - 1, temp)
        } else {
          this.$message.error(res.data?.msg || 'Failed to move item')
        }
      } catch (e) {
        console.error('Failed to move item up:', e)
        this.$message.error('Failed to move item')
      } finally {
        this.reorderingItemId = null
      }
    },

    async moveItemDown(item, index) {
      if (index === this.items.length - 1 || this.reorderingItemId) return
      this.reorderingItemId = item.id
      try {
        const res = await notesApi.moveItemDown(item.id)
        if (res.data && res.data.code === 0) {
          // Swap items in local array for immediate UI feedback
          const temp = this.items[index]
          this.$set(this.items, index, this.items[index + 1])
          this.$set(this.items, index + 1, temp)
        } else {
          this.$message.error(res.data?.msg || 'Failed to move item')
        }
      } catch (e) {
        console.error('Failed to move item down:', e)
        this.$message.error('Failed to move item')
      } finally {
        this.reorderingItemId = null
      }
    },

    // ============ Delete Execution ============
    async executeDelete() {
      this.deleting = true
      try {
        if (this.deleteType === 'category') {
          await this.deleteCategory()
        } else if (this.deleteType === 'item') {
          await this.deleteItem()
        }
        this.showDeleteDialog = false
      } finally {
        this.deleting = false
        this.deleteType = null
        this.deleteTarget = null
      }
    },

    // ============ Global Listen All Methods ============
    async startListenAll() {
      if (this.globalListenLoading || this.categories.length === 0) return
      this.globalListenLoading = true
      try {
        const results = await Promise.all(this.categories.map(cat => notesApi.listItems(cat.id)))
        const allItems = results.flatMap(res =>
          res.data && res.data.code === 0 ? res.data.data || [] : []
        )
        const audioItems = allItems.filter(item => item.audioStatus === 'READY')
        if (audioItems.length === 0) {
          this.$message.warning(this.$t('privateNotes.noAudioNotes') || 'No notes with audio found')
          return
        }
        this.globalListenItems = audioItems
        this.globalListenIndex = 0
        this.globalListenMode = true
        this.isGlobalPlaying = true
        this.$nextTick(() => {
          if (this.$refs.globalAudioPlayer) {
            this.$refs.globalAudioPlayer.load()
            this.$refs.globalAudioPlayer.play()
          }
        })
      } catch (e) {
        this.$message.error(this.$t('privateNotes.loadFailed') || 'Failed to load notes')
      } finally {
        this.globalListenLoading = false
      }
    },

    stopListenAll() {
      this.isGlobalPlaying = false
      this.globalListenMode = false
      this.globalListenItems = []
      this.globalListenIndex = 0
      if (this.$refs.globalAudioPlayer) {
        this.$refs.globalAudioPlayer.pause()
        this.$refs.globalAudioPlayer.currentTime = 0
      }
    },

    toggleGlobalPlayback() {
      if (this.isGlobalPlaying) {
        this.isGlobalPlaying = false
        this.$refs.globalAudioPlayer && this.$refs.globalAudioPlayer.pause()
      } else {
        this.isGlobalPlaying = true
        this.$refs.globalAudioPlayer && this.$refs.globalAudioPlayer.play()
      }
    },

    onGlobalAudioEnded() {
      this.globalListenIndex = (this.globalListenIndex + 1) % this.globalListenItems.length
    },

    globalNext() {
      this.globalListenIndex = (this.globalListenIndex + 1) % this.globalListenItems.length
    },

    globalPrevious() {
      this.globalListenIndex = (this.globalListenIndex - 1 + this.globalListenItems.length) % this.globalListenItems.length
    }
  }
}
</script>

<style scoped lang="scss">
// Base styles
.private-notes {
  padding: 20px;
  min-height: 100%;
  max-height: 100vh;
  overflow-y: auto;
  background: var(--bg-body);
  box-sizing: border-box;
}

// Header
.notes-header {
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  background: var(--bg-body);
  padding-bottom: 8px;
  z-index: 10;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    h2 {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .category-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;

      .el-button {
        transition: all 0.2s ease;

        &:hover {
          transform: scale(1.1);
        }
      }
    }
  }
}

// Loading
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40vh;
  min-height: 200px;

  i {
    font-size: 40px;
    color: var(--color-primary);
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

// Login hint
.login-hint {
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease;
}

// Categories Grid
.categories-container {
  animation: fadeIn 0.3s ease;

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .category-card {
    --accent-color: #409EFF;
    background: var(--bg-container);
    border-radius: 12px;
    padding: 20px;
    border-left: 5px solid var(--accent-color);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    gap: 16px;
    align-items: flex-start;
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.04));
    position: relative;
    animation: fadeIn 0.3s ease backwards;

    @for $i from 1 through 10 {
      &:nth-child(#{$i}) {
        animation-delay: #{$i * 0.05}s;
      }
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12));

      .category-card-actions {
        opacity: 1;
        transform: translateX(0);
      }
    }

    &:active {
      transform: translateY(-2px);
    }

    .category-info {
      flex: 1;
      min-width: 0;

      h3 {
        margin: 0 0 6px 0;
        color: var(--text-primary);
        font-size: 1.1rem;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      p {
        margin: 0 0 10px 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .item-count {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 4px;

        &::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-color);
        }
      }
    }

    .category-card-actions {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 6px;
      opacity: 0;
      transform: translateX(8px);
      transition: all 0.25s ease;

      .el-button {
        padding: 6px;
        font-size: 14px;
        transition: all 0.2s ease;

        &:hover {
          transform: scale(1.15);
        }
      }
    }
  }

  .add-category-btn {
    margin-top: 12px;
    width: 100%;
    max-width: 300px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
    }
  }
}

// Notes Container
.notes-container {
  animation: fadeIn 0.3s ease;

  .view-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 12px;
    flex-wrap: wrap;

    .el-radio-group {
      flex-shrink: 0;

      // Theme-aligned radio button styling
      ::v-deep {
        .el-radio-button__inner {
          background: var(--bg-container);
          border-color: var(--border-color, #dcdfe6);
          color: var(--text-secondary);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 9px 16px;
          font-weight: 500;

          &:hover {
            color: var(--color-primary);
            background: var(--bg-highlight);
          }
        }

        // First button border radius
        .el-radio-button:first-child .el-radio-button__inner {
          border-left-color: var(--border-color, #dcdfe6);
          border-radius: 8px 0 0 8px;
        }

        // Last button border radius
        .el-radio-button:last-child .el-radio-button__inner {
          border-radius: 0 8px 8px 0;
        }

        // Active/Checked state
        .el-radio-button__orig-radio:checked + .el-radio-button__inner {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #fff;
          box-shadow: -1px 0 0 0 var(--color-primary);

          &:hover {
            background: var(--color-primary-hover, var(--color-primary));
            color: #fff;
          }
        }

        // Focus state
        .el-radio-button__orig-radio:focus + .el-radio-button__inner {
          outline: none;
          box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 64, 158, 255), 0.15);
        }

        // Disabled state
        .el-radio-button__orig-radio:disabled + .el-radio-button__inner {
          background: var(--bg-disabled, #f5f7fa);
          border-color: var(--border-color, #e4e7ed);
          color: var(--text-muted);
          cursor: not-allowed;
        }
      }
    }

    .el-button {
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

// Notes List
.notes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .note-item {
    background: var(--bg-container);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm, 0 1px 4px rgba(0, 0, 0, 0.04));
    gap: 12px;
    position: relative;
    animation: fadeIn 0.3s ease backwards;

    @for $i from 1 through 20 {
      &:nth-child(#{$i}) {
        animation-delay: #{$i * 0.03}s;
      }
    }

    &:hover {
      background: var(--bg-highlight);
      box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
      transform: translateX(4px);

      .note-item-actions .edit-icon,
      .note-item-actions .delete-icon,
      .note-item-actions .reorder-icon {
        opacity: 1;
        transform: scale(1);
      }
    }

    &:active {
      transform: translateX(2px) scale(0.995);
    }

    .note-content {
      flex: 1;
      min-width: 0;

      h4 {
        margin: 0 0 6px 0;
        color: var(--text-primary);
        font-size: 1rem;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: color 0.2s ease;
      }

      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .note-item-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-shrink: 0;

      .icon-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.25s ease;
        background: var(--bg-highlight);
        border: 1px solid var(--border-color, #e4e7ed);

        i {
          font-size: 14px;
          transition: all 0.2s ease;
        }

        &:hover {
          transform: scale(1.1);
          box-shadow: var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.08));
        }

        &:active {
          transform: scale(0.95);
        }
      }

      // Status icons (audio/image ready)
      .status-icon {
        background: var(--color-success-light, rgba(103, 194, 58, 0.1));
        border-color: var(--color-success, #67C23A);

        i {
          color: var(--color-success, #67C23A);
        }

        &:hover {
          background: var(--color-success-light, rgba(103, 194, 58, 0.15));
        }
      }

      // Edit icon
      .edit-icon {
        opacity: 0;
        transform: scale(0.8);
        background: var(--bg-container);

        i {
          color: var(--color-primary);
        }

        &:hover {
          background: var(--color-primary-light, rgba(64, 158, 255, 0.1));
          border-color: var(--color-primary);
        }
      }

      // Delete icon
      .delete-icon {
        opacity: 0;
        transform: scale(0.8);
        background: var(--bg-container);

        i {
          color: var(--color-danger, #F56C6C);
        }

        &:hover {
          background: var(--color-danger-light, rgba(245, 108, 108, 0.1));
          border-color: var(--color-danger, #F56C6C);
        }
      }

      // Reorder icons (up/down)
      .reorder-icon {
        opacity: 0;
        transform: scale(0.8);
        background: var(--bg-container);

        i {
          color: var(--color-info, #909399);
        }

        &:hover:not(.is-disabled) {
          background: var(--color-info-light, rgba(144, 147, 153, 0.1));
          border-color: var(--color-info, #909399);

          i {
            color: var(--color-primary);
          }
        }

        &.is-disabled {
          cursor: not-allowed;
          opacity: 0.4 !important;

          &:hover {
            transform: scale(1);
            box-shadow: none;
          }
        }
      }
    }
  }
}

// Card View (Flashcard Mode)
.card-view {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  animation: fadeIn 0.4s ease;

  .note-card {
    background: var(--bg-container);
    border-radius: 20px;
    padding: 28px;
    width: 100%;
    max-width: 600px;
    box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.1));
    position: relative;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: var(--shadow-xl, 0 12px 40px rgba(0, 0, 0, 0.14));
    }

    .card-actions-top {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 8px;
      z-index: 5;

      .el-button {
        transition: all 0.25s ease;
        opacity: 0.7;

        &:hover {
          opacity: 1;
          transform: scale(1.15);
        }
      }
    }

    .card-image {
      margin-bottom: 20px;
      border-radius: 14px;
      overflow: hidden;
      background: var(--bg-highlight);
      box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.06));
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.02);
      }

      img {
        width: 100%;
        height: auto;
        display: block;
        object-fit: contain;
        transition: all 0.4s ease;
      }
    }

    .card-content {
      margin-bottom: 24px;
      padding: 48px 8px 0 8px; // Top padding to avoid overlap with action buttons

      p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.8;
        white-space: pre-wrap;
        font-size: 1.05rem;
        text-align: center;
      }
    }

    // When image exists before content, no extra top padding needed
    .card-image + .card-content {
      padding-top: 0;
    }

    .audio-player {
      margin-bottom: 20px;
      background: var(--bg-highlight);
      border-radius: 12px;
      padding: 14px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--bg-highlight-hover, var(--bg-highlight));
      }

      audio {
        width: 100%;
        height: 40px;
        border-radius: 8px;
      }
    }

    .card-navigation {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 32px;
      margin-bottom: 20px;

      .el-button {
        width: 52px;
        height: 52px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:not(:disabled):hover {
          transform: scale(1.1);
          box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
        }

        &:not(:disabled):active {
          transform: scale(0.95);
        }

        i {
          font-size: 22px;
        }
      }

      .card-index {
        color: var(--text-secondary);
        font-size: 1rem;
        font-weight: 600;
        min-width: 70px;
        text-align: center;
        padding: 6px 12px;
        background: var(--bg-highlight);
        border-radius: 20px;
      }
    }

    .loop-controls {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;

      .el-button {
        min-width: 100px;
        padding: 10px 20px;
        border-radius: 25px;
        transition: all 0.3s ease;
        background: var(--bg-container);
        border-color: var(--border-color, #dcdfe6);
        color: var(--text-primary);

        &:hover {
          transform: scale(1.05);
          background: var(--bg-highlight);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        i {
          margin-right: 6px;
        }

        // Active loop mode indicator
        &.loop-active {
          background: var(--color-primary-light, rgba(64, 158, 255, 0.1));
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
      }

      // Primary button (Play/Stop)
      .el-button--primary {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #fff;

        &:hover {
          background: var(--color-primary-hover, var(--color-primary));
          color: #fff;
        }
      }

      .el-button--danger {
        background: var(--color-danger, #F56C6C);
        border-color: var(--color-danger, #F56C6C);
        color: #fff;

        &:hover {
          background: var(--color-danger-hover, #f78989);
          color: #fff;
        }
      }

      // Dropdown menu styling
      ::v-deep .el-dropdown-menu {
        background: var(--bg-container);
        border-color: var(--border-color, #e4e7ed);

        .el-dropdown-menu__item {
          color: var(--text-primary);
          padding: 10px 20px;
          transition: all 0.2s ease;

          i {
            margin-right: 8px;
            font-size: 14px;
          }

          &:hover {
            background: var(--bg-highlight);
            color: var(--color-primary);
          }

          &.is-active {
            background: var(--color-primary-light, rgba(64, 158, 255, 0.1));
            color: var(--color-primary);
            font-weight: 500;
          }
        }
      }
    }

    .generate-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;

      .el-button {
        min-width: 110px;
        border-radius: 20px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08));
        }
      }

      // Image style dropdown styling
      ::v-deep .el-dropdown-menu {
        max-height: 300px;
        overflow-y: auto;

        .el-dropdown-menu__item {
          padding: 10px 16px;
          line-height: 1.4;

          .style-option {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .style-name {
              font-weight: 500;
              color: var(--text-primary);
            }

            .style-desc {
              font-size: 0.75rem;
              color: var(--text-muted);
              white-space: normal;
              max-width: 250px;
            }
          }
        }
      }
    }
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
  animation: fadeIn 0.4s ease;

  .empty-state-icon {
    width: 100px;
    height: 100px;
    margin: 0 auto 24px;
    background: var(--bg-highlight);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s ease-in-out infinite;

    i {
      font-size: 48px;
      opacity: 0.6;
      color: var(--color-primary);
    }
  }

  p {
    margin: 0 0 20px 0;
    font-size: 1rem;
    color: var(--text-secondary);
  }

  .el-button {
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

// Dialog styles
.notes-dialog {
  ::v-deep .el-dialog {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.15));

    .el-dialog__header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--border-color, #eee);
      background: var(--bg-container);
    }

    .el-dialog__title {
      font-weight: 600;
      color: var(--text-primary);
    }

    .el-dialog__body {
      padding: 24px;
      background: var(--bg-body);
    }

    .el-dialog__footer {
      padding: 16px 24px 20px;
      border-top: 1px solid var(--border-color, #eee);
      background: var(--bg-container);
    }

    .el-form-item__label {
      color: var(--text-primary);
      font-weight: 500;
    }

    .el-input__inner,
    .el-textarea__inner {
      background: var(--bg-container);
      border-color: var(--border-color, #ddd);
      color: var(--text-primary);
      transition: all 0.3s ease;

      &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 64, 158, 255), 0.1);
      }
    }
  }
}

.delete-dialog {
  .delete-confirm-content {
    text-align: center;
    padding: 20px 0;

    i {
      font-size: 56px;
      color: var(--color-danger, #F56C6C);
      margin-bottom: 16px;
      display: block;
    }

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.6;
    }
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;

  .el-button {
    min-width: 90px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }
}

// ============================================
// LOCK FEATURE STYLES
// ============================================

// Header with lock controls
.header-with-lock {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  .lock-controls {
    display: flex;
    gap: 8px;
    flex-shrink: 0;

    .el-button {
      transition: all 0.25s ease;

      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

// Locked Overlay
.locked-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  padding: 40px 20px;
  animation: fadeIn 0.4s ease;

  .locked-content {
    text-align: center;
    max-width: 400px;
    padding: 40px;
    background: var(--bg-container);
    border-radius: 20px;
    box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.1));

    .locked-icon {
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
      background: var(--color-warning-light, rgba(230, 162, 60, 0.1));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s ease-in-out infinite;

      i {
        font-size: 48px;
        color: var(--color-warning, #E6A23C);
      }
    }

    h3 {
      margin: 0 0 12px 0;
      color: var(--text-primary);
      font-size: 1.4rem;
      font-weight: 600;
    }

    p {
      margin: 0 0 24px 0;
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.5;
    }

    .el-button {
      min-width: 140px;
      padding: 12px 24px;
      font-size: 1rem;
      border-radius: 25px;
      transition: all 0.3s ease;

      i {
        margin-right: 8px;
      }

      &:hover {
        transform: scale(1.05);
        box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
      }
    }
  }
}

// Passcode Dialog
.passcode-dialog {
  .passcode-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    .footer-right {
      display: flex;
      gap: 12px;
      margin-left: auto;
    }
  }
}

// Unlock Dialog
.unlock-dialog {
  .unlock-content {
    text-align: center;
    padding: 10px 0;

    .unlock-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: var(--color-primary-light, rgba(64, 158, 255, 0.1));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 40px;
        color: var(--color-primary);
      }
    }

    .el-form-item {
      margin-bottom: 16px;
    }

    .unlock-error {
      color: var(--color-danger, #F56C6C);
      font-size: 0.9rem;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      animation: shake 0.4s ease;

      i {
        font-size: 14px;
      }
    }
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

// ============================================
// RESPONSIVE BREAKPOINTS
// ============================================

// Large Desktop (> 1400px)
@media (min-width: 1400px) {
  .private-notes {
    padding: 32px 40px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .categories-container .categories-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .card-view .note-card {
    padding: 36px;
    max-width: 700px;
  }
}

// Desktop (1024px - 1400px)
@media (min-width: 1024px) and (max-width: 1399px) {
  .private-notes {
    padding: 24px 32px;
  }

  .categories-container .categories-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

// Tablet Landscape (768px - 1024px)
@media (min-width: 768px) and (max-width: 1023px) {
  .private-notes {
    padding: 20px 24px;
  }

  .notes-header h2 {
    font-size: 1.35rem;
  }

  .categories-container .categories-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .category-card {
    padding: 16px !important;
  }

  .card-view .note-card {
    padding: 24px;
    max-width: 90%;
  }
}

// Tablet Portrait / Large Phone (480px - 768px)
@media (min-width: 480px) and (max-width: 767px) {
  .private-notes {
    padding: 16px;
  }

  .notes-header {
    margin-bottom: 16px;

    h2 {
      font-size: 1.25rem;
    }

    .category-header {
      gap: 10px;
    }
  }

  .categories-container {
    .categories-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .category-card {
      padding: 14px !important;

      .category-info h3 {
        font-size: 1rem;
      }
    }

    .add-category-btn {
      width: 100%;
      max-width: none;
    }
  }

  .notes-container .view-controls {
    flex-direction: row;
    gap: 10px;
  }

  .notes-list .note-item {
    padding: 14px 16px;
  }

  .card-view .note-card {
    padding: 20px;
    border-radius: 12px;

    .card-content {
      padding-top: 44px;
    }

    .card-image + .card-content {
      padding-top: 0;
    }

    .card-navigation {
      gap: 24px;

      .el-button {
        width: 44px;
        height: 44px;
      }
    }

    .generate-actions {
      gap: 12px;

      .el-button {
        min-width: 90px;
        font-size: 0.9rem;
      }
    }
  }

  .empty-state {
    padding: 40px 16px;

    i {
      font-size: 48px;
    }
  }
}

// Mobile Phone (< 480px)
@media (max-width: 479px) {
  .private-notes {
    padding: 12px;
    padding-bottom: 80px; // Extra space for mobile navigation
  }

  .notes-header {
    margin-bottom: 14px;
    padding-bottom: 6px;

    h2 {
      font-size: 1.15rem;
    }

    .header-with-lock {
      h2 {
        font-size: 1.15rem;
      }

      .lock-controls {
        gap: 6px;

        .el-button {
          padding: 6px;
        }
      }
    }

    .category-header {
      gap: 8px;

      .el-button {
        padding: 8px 12px;
        font-size: 0.85rem;
      }
    }
  }

  .locked-overlay {
    min-height: 40vh;
    padding: 20px 12px;

    .locked-content {
      padding: 28px 20px;
      border-radius: 16px;

      .locked-icon {
        width: 80px;
        height: 80px;
        margin-bottom: 20px;

        i {
          font-size: 36px;
        }
      }

      h3 {
        font-size: 1.2rem;
      }

      p {
        font-size: 0.9rem;
        margin-bottom: 20px;
      }

      .el-button {
        min-width: 120px;
        padding: 10px 20px;
        font-size: 0.95rem;
      }
    }
  }

  .passcode-dialog .passcode-footer {
    flex-direction: column;
    gap: 10px;

    .footer-right {
      width: 100%;
      justify-content: flex-end;
    }

    > .el-button {
      width: 100%;
    }
  }

  .unlock-dialog .unlock-content {
    .unlock-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;

      i {
        font-size: 32px;
      }
    }
  }

  .loading-container {
    height: 30vh;

    i {
      font-size: 32px;
    }
  }

  .login-hint {
    padding: 12px;
  }

  .categories-container {
    .categories-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .category-card {
      padding: 12px !important;
      gap: 12px;
      border-radius: 10px;

      .category-info {
        h3 {
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        p {
          font-size: 0.85rem;
          margin-bottom: 6px;
          -webkit-line-clamp: 1;
        }

        .item-count {
          font-size: 0.8rem;
        }
      }
    }

    .add-category-btn {
      width: 100%;
      max-width: none;
      margin-top: 10px;
    }
  }

  .notes-container .view-controls {
    margin-bottom: 14px;
    gap: 8px;

    .el-button {
      padding: 8px 14px;
      font-size: 0.85rem;
    }

    // Mobile radio button adjustments
    .el-radio-group ::v-deep {
      .el-radio-button__inner {
        padding: 7px 12px;
        font-size: 0.85rem;
      }

      .el-radio-button:first-child .el-radio-button__inner {
        border-radius: 6px 0 0 6px;
      }

      .el-radio-button:last-child .el-radio-button__inner {
        border-radius: 0 6px 6px 0;
      }
    }
  }

  .notes-list {
    gap: 8px;

    .note-item {
      padding: 12px 14px;
      border-radius: 8px;

      .note-content {
        h4 {
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        p {
          font-size: 0.85rem;
          -webkit-line-clamp: 1;
        }
      }

      .note-status i {
        font-size: 16px;
      }
    }
  }

  .card-view {
    padding: 5px 0;

    .note-card {
      padding: 16px;
      border-radius: 10px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      .card-image {
        margin-bottom: 16px;
        border-radius: 8px;
      }

      .card-content {
        margin-bottom: 18px;
        padding-top: 44px;

        p {
          font-size: 0.95rem;
          line-height: 1.6;
        }
      }

      .card-image + .card-content {
        padding-top: 0;
      }

      .audio-player {
        margin-bottom: 16px;
        padding: 10px;
        border-radius: 8px;

        audio {
          height: 36px;
        }
      }

      .card-navigation {
        gap: 20px;
        margin-bottom: 16px;

        .el-button {
          width: 40px;
          height: 40px;

          i {
            font-size: 18px;
          }
        }

        .card-index {
          font-size: 0.9rem;
        }
      }

      .loop-controls {
        margin-bottom: 16px;

        .el-button {
          min-width: 120px;
          font-size: 0.9rem;
        }
      }

      .generate-actions {
        gap: 10px;

        .el-button {
          min-width: 80px;
          padding: 8px 14px;
          font-size: 0.85rem;
        }
      }
    }
  }

  .empty-state {
    padding: 32px 12px;

    i {
      font-size: 40px;
      margin-bottom: 14px;
    }

    p {
      font-size: 0.9rem;
    }
  }

  // Dialog adjustments for mobile
  ::v-deep .el-dialog {
    margin: 0 !important;
    border-radius: 0;

    .el-dialog__header {
      padding: 16px;
    }

    .el-dialog__body {
      padding: 16px;
      max-height: calc(100vh - 140px);
      overflow-y: auto;
    }

    .el-dialog__footer {
      padding: 12px 16px;
      display: flex;
      gap: 10px;

      .el-button {
        flex: 1;
      }
    }
  }
}

// Extra small devices (< 360px)
@media (max-width: 359px) {
  .private-notes {
    padding: 10px;
  }

  .notes-header h2 {
    font-size: 1.05rem;
  }

  .categories-container .category-card {
    padding: 10px !important;
  }

  .card-view .note-card {
    padding: 14px;

    .card-navigation {
      gap: 16px;

      .el-button {
        width: 36px;
        height: 36px;
      }
    }
  }
}

// Landscape orientation on mobile
@media (max-height: 500px) and (orientation: landscape) {
  .private-notes {
    padding: 10px 16px;
  }

  .notes-header {
    margin-bottom: 10px;
  }

  .card-view .note-card {
    padding: 12px 20px;

    .card-image img {
      max-height: 120px;
    }

    .card-content {
      margin-bottom: 12px;
      padding-top: 40px;

      p {
        font-size: 0.9rem;
      }
    }

    .card-image + .card-content {
      padding-top: 0;
    }

    .audio-player {
      margin-bottom: 10px;
      padding: 8px;
    }

    .card-navigation,
    .loop-controls {
      margin-bottom: 10px;
    }
  }

  .empty-state {
    padding: 20px;

    i {
      font-size: 36px;
      margin-bottom: 10px;
    }
  }
}

// Touch device optimizations
@media (hover: none) and (pointer: coarse) {
  .category-card:hover,
  .note-item:hover {
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .category-card:active,
  .note-item:active {
    background: var(--bg-highlight);
    transform: scale(0.98);
  }

  // Always show edit/delete/reorder icons on touch devices
  .note-item-actions .edit-icon,
  .note-item-actions .delete-icon,
  .note-item-actions .reorder-icon {
    opacity: 1;
    transform: scale(1);
  }
}

// Global Listen All Mini Player
.global-listen-player {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-light, rgba(0,0,0,0.08));
  border-radius: 40px;
  padding: 10px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  max-width: calc(100vw - 48px);
  animation: fadeIn 0.3s ease;

  .glp-icon {
    font-size: 18px;
    color: var(--color-primary, #409EFF);
    flex-shrink: 0;
    animation: pulse 2s ease-in-out infinite;
  }

  .glp-info {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;

    .glp-content {
      margin: 0;
      font-size: 13px;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 280px;
    }

    .glp-count {
      font-size: 12px;
      color: var(--text-secondary, #909399);
      white-space: nowrap;
      flex-shrink: 0;
    }
  }

  .glp-controls {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    bottom: 16px;
    padding: 8px 14px;
    gap: 10px;

    .glp-info .glp-content {
      max-width: 130px;
    }
  }
}
</style>
