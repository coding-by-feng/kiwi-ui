<template>
  <div class="header">
    <h2 class="header-title">{{ $t('todo.title') }}</h2>
    <div class="header-controls">
      <div class="import-export-controls">
        <button type="button" class="control-btn btn-primary" @click="$emit('export')">
          <i class="el-icon-download"></i>
          <span class="btn-text">Export</span>
        </button>

        <input ref="importInput" type="file" accept=".json" class="visually-hidden" @change="onImportChange" />
        <button type="button" class="control-btn btn-success" @click="triggerImport">
          <i class="el-icon-upload2"></i>
          <span class="btn-text">Import</span>
        </button>

        <button type="button" class="control-btn btn-info" @click="$emit('demo')">
          <i class="el-icon-magic-stick"></i>
          <span class="btn-text">Demo</span>
        </button>

        <button type="button" class="control-btn btn-danger" @click="$emit('clear')">
          <i class="el-icon-delete"></i>
          <span class="btn-text">Clear All</span>
        </button>
      </div>

      <div class="ranking-display">
        <div class="rank-badge" :class="getRankClass(currentRank.name)">
          <div class="rank-icon" @click="$emit('open-rank-image')" style="cursor: pointer;">
            <img :src="getRankImage(currentRank.name)" :alt="currentRank.name" class="rank-image" @click.stop="$emit('open-rank-image')" />
          </div>
          <div class="rank-info">
            <div class="rank-name">{{ currentRank.name }}</div>
            <div class="rank-level">{{ $t('todo.rankLevel', { level: currentRank.level }) }}</div>
          </div>
          <div class="rank-details-icon">
            <el-popover placement="bottom" width="320" trigger="click" :title="$t('todo.rankingSystem')">
              <div class="ranking-details">
                <div class="current-rank-details">
                  <h4>{{ $t('todo.currentRank') }}</h4>
                  <div class="rank-item">
                    <img :src="getRankImage(currentRank.name)" :alt="currentRank.name" class="rank-preview-image" @error="onRankImageError" />
                    <span class="rank-name">{{ currentRank.name }}</span>
                    <span class="rank-points">{{ currentRank.threshold }}+ {{ $t('todo.points') }}</span>
                  </div>
                </div>
                <div class="next-rank-details" v-if="currentRank.nextRankName">
                  <h4>{{ $t('todo.nextRankTarget') }}</h4>
                  <div class="rank-item">
                    <img :src="getNextRankImage()" :alt="currentRank.nextRankName" class="rank-preview-image" @error="onRankImageError" />
                    <span class="rank-name">{{ currentRank.nextRankName }}</span>
                    <span class="rank-points">{{ currentRank.nextThreshold }}+ {{ $t('todo.points') }}</span>
                  </div>
                  <div class="progress-needed">
                    {{ $t('todo.pointsNeeded', { points: currentRank.nextThreshold - totalPoints }) }}
                  </div>
                </div>
                <div class="max-rank-notice" v-else>
                  <h4>🎉 {{ $t('todo.congratulations') }}</h4>
                  <p>{{ $t('todo.maxRankAchieved') }}</p>
                </div>
                <div class="all-ranks-preview">
                  <h4>{{ $t('todo.allRanks') }}</h4>
                  <div class="ranks-grid">
                    <div
                      v-for="rank in sortedRanksForDisplay"
                      :key="`rank-${rank.key}-${rank.threshold}`"
                      class="rank-preview-item"
                      :class="{ 'current-rank': rank.threshold <= totalPoints }"
                    >
                      <img :src="rank.image" :alt="getRankName(rank.key)" class="rank-grid-image" @error="onRankImageError" />
                      <span class="rank-preview-name">{{ getRankName(rank.key) }}</span>
                      <span class="rank-preview-threshold">{{ rank.threshold }}+</span>
                    </div>
                  </div>
                </div>
              </div>
              <template v-slot:reference>
                <i class="el-icon-info rank-info-icon" :title="$t('todo.viewRankingDetails')"></i>
              </template>
            </el-popover>
          </div>
        </div>
        <div class="rank-progress">
          <div class="progress-info">
            <span class="progress-text">{{ totalPoints }} / {{ currentRank.nextThreshold || '∞' }}</span>
            <span class="progress-percentage" v-if="currentRank.nextThreshold">{{ Math.round(rankProgress) }}%</span>
            <span class="progress-percentage max-rank" v-else>{{ $t('todo.maxRank') }}</span>
          </div>
          <el-progress :percentage="rankProgress" :show-text="false" :stroke-width="6" :color="getRankColor(currentRank.name)" class="rank-progress-bar" />
          <div v-if="currentRank.nextRankName" class="next-rank-info">
            <span class="next-rank-text">{{ $t('todo.nextRank', { rank: currentRank.nextRankName }) }}</span>
          </div>
          <div v-else class="max-rank-info">
            <span class="max-rank-text">{{ $t('todo.maxRankReached') }}</span>
          </div>
        </div>
      </div>

      <div class="total-points">
        <span class="points-label">{{ $t('todo.totalPoints') }}:</span>
        <span class="points-badge">{{ totalPoints }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TodoHeader',
  props: {
    totalPoints: { type: Number, required: true },
    currentRank: { type: Object, required: true },
    sortedRanksForDisplay: { type: Array, required: true },
    rankProgress: { type: Number, required: true },
    getRankName: { type: Function, required: true },
    getRankClass: { type: Function, required: true },
    getRankImage: { type: Function, required: true },
    getRankColor: { type: Function, required: true },
    getNextRankImage: { type: Function, required: true },
    onRankImageError: { type: Function, required: true }
  },
  methods: {
    triggerImport() {
      this.$refs.importInput && this.$refs.importInput.click()
    },
    onImportChange(e) {
      const file = e && e.target && e.target.files && e.target.files[0]
      if (file) {
        this.$emit('import-file-selected', file)
      }
      // reset input so selecting the same file again triggers change
      if (e && e.target) e.target.value = ''
    }
  }
}
</script>
