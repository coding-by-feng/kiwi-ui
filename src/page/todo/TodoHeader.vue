<template>
  <div class="header">
    <h2 class="header-title">{{ $t('todo.title') }}</h2>
    <div class="header-controls">
      <div class="import-export-controls">
        <KiwiButton type="info" icon="el-icon-magic-stick" @click="$emit('demo')">
          {{ $t('todo.demo') }}
        </KiwiButton>

        <KiwiButton type="danger" icon="el-icon-delete" @click="$emit('clear')">
          {{ $t('todo.clearAll') }}
        </KiwiButton>
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
            <KiwiPopover placement="bottom" width="320" trigger="click" :title="$t('todo.rankingSystem')">
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
            </KiwiPopover>
          </div>
        </div>
        <div class="rank-progress">
          <div class="progress-info">
            <span class="progress-text">{{ totalPoints }} / {{ currentRank.nextThreshold || '∞' }}</span>
            <span class="progress-percentage" v-if="currentRank.nextThreshold">{{ Number(rankProgress).toFixed(1) }}%</span>
            <span class="progress-percentage max-rank" v-else>{{ $t('todo.maxRank') }}</span>
          </div>
          <KiwiProgress :percentage="rankProgress" :show-text="false" :stroke-width="6" :color="getRankColor(currentRank.name)" class="rank-progress-bar" />
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
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiPopover from '@/components/ui/KiwiPopover.vue'
import KiwiProgress from '@/components/ui/KiwiProgress.vue'

export default {
  name: 'TodoHeader',
  components: { KiwiButton, KiwiPopover, KiwiProgress },
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
  }
}
</script>
<style scoped>
.header {
  /* Transparent to allow parent glass effect */
  background: transparent;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 12px;
  /* Inner glass effect for the badge */
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
  transition: transform 0.2s, box-shadow 0.2s;
}

.rank-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.rank-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  padding: 4px;
}

.rank-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.rank-info {
  display: flex;
  flex-direction: column;
}

.rank-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.rank-level {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .rank-badge {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .rank-icon {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
