<template>
  <div class="white-noise-player">
    <!-- Header -->
    <div class="player-header">
      <h2 class="player-title">
        <i class="el-icon-headset"></i>
        White Noise & Ambient Sounds
      </h2>
      <p class="player-subtitle">Relax, focus, or sleep with ambient sounds. Mix multiple sounds together.</p>
    </div>

    <!-- Master Volume Control -->
    <div class="master-volume">
      <div class="volume-label">
        <i class="el-icon-s-operation"></i>
        <span>Master Volume</span>
      </div>
      <div class="volume-slider-container">
        <i class="el-icon-minus" @click="adjustMasterVolume(-10)"></i>
        <el-slider
          v-model="masterVolume"
          :min="0"
          :max="100"
          :show-tooltip="false"
          @input="onMasterVolumeChange"
        />
        <i class="el-icon-plus" @click="adjustMasterVolume(10)"></i>
        <span class="volume-value">{{ masterVolume }}%</span>
      </div>
    </div>

    <!-- Active Sounds Summary -->
    <div v-if="activeSoundCount > 0" class="active-sounds-bar">
      <div class="active-info">
        <i class="el-icon-video-play"></i>
        <span>{{ activeSoundCount }} sound{{ activeSoundCount > 1 ? 's' : '' }} playing</span>
      </div>
      <KiwiButton size="small" type="danger" @click="stopAllSounds">
        <i class="el-icon-video-pause"></i> Stop All
      </KiwiButton>
    </div>

    <!-- Sound Categories -->
    <div v-for="category in categories" :key="category.id" class="sound-category">
      <h3 class="category-title">
        <i :class="category.icon"></i>
        {{ category.name }}
      </h3>
      <div class="sound-grid">
        <div
          v-for="sound in category.sounds"
          :key="sound.id"
          class="sound-card"
          :class="{ 'is-playing': isPlaying(sound.id) }"
          @click="toggleSound(sound)"
        >
          <div class="sound-icon-wrapper">
            <i :class="sound.icon"></i>
            <div v-if="isPlaying(sound.id)" class="sound-waves">
              <span></span><span></span><span></span>
            </div>
          </div>
          <span class="sound-label">{{ sound.label }}</span>

          <!-- Individual Volume Control (shown when playing) -->
          <div v-if="isPlaying(sound.id)" class="sound-volume" @click.stop>
            <el-slider
              v-model="playingSounds[sound.id].volume"
              :min="0"
              :max="100"
              :show-tooltip="false"
              size="small"
              @input="onSoundVolumeChange(sound.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden audio elements for file-based sounds -->
    <audio
      v-for="sound in fileSounds"
      :key="'audio-' + sound.id"
      :ref="'audio-' + sound.id"
      :src="sound.src"
      loop
      preload="none"
    />
  </div>
</template>

<script>
import { getStore, setStore } from '@/util/store'
import KiwiButton from '@/components/ui/KiwiButton.vue'

const STORAGE_KEY = 'white_noise_settings'

export default {
  name: 'WhiteNoisePlayer',
  components: {
    KiwiButton
  },
  data() {
    return {
      masterVolume: 50,
      audioContext: null,
      categories: [
        {
          id: 'nature',
          name: 'Nature Sounds',
          icon: 'el-icon-sunny',
          sounds: [
            { id: 'rain', label: 'Rain', icon: 'el-icon-heavy-rain', type: 'file', src: '/assets/audio/bgm/rain.mp3' },
            { id: 'forest', label: 'Forest', icon: 'el-icon-sunny', type: 'file', src: '/assets/audio/bgm/forest.mp3' },
            { id: 'ocean', label: 'Ocean Waves', icon: 'el-icon-ship', type: 'file', src: '/assets/audio/bgm/ocean.mp3' },
            { id: 'wind', label: 'Wind', icon: 'el-icon-cloudy', type: 'file', src: '/assets/audio/bgm/wind.mp3' },
            { id: 'fire', label: 'Fireplace', icon: 'el-icon-hot-water', type: 'file', src: '/assets/audio/bgm/fire.mp3' },
            { id: 'cafe', label: 'Cafe', icon: 'el-icon-coffee-cup', type: 'file', src: '/assets/audio/bgm/cafe.mp3' }
          ]
        },
        {
          id: 'noise',
          name: 'Pure Noise',
          icon: 'el-icon-s-operation',
          sounds: [
            { id: 'white', label: 'White Noise', icon: 'el-icon-s-operation', type: 'generated', generator: 'white' },
            { id: 'pink', label: 'Pink Noise', icon: 'el-icon-s-marketing', type: 'generated', generator: 'pink' },
            { id: 'brown', label: 'Brown Noise', icon: 'el-icon-s-data', type: 'generated', generator: 'brown' }
          ]
        },
        {
          id: 'tones',
          name: 'Binaural & Tones',
          icon: 'el-icon-magic-stick',
          sounds: [
            { id: 'sine528', label: '528Hz Healing', icon: 'el-icon-sunrise', type: 'generated', generator: 'sine528' },
            { id: 'deepHum', label: 'Deep Hum', icon: 'el-icon-moon', type: 'generated', generator: 'deepHum' },
            { id: 'binaural', label: 'Alpha Waves', icon: 'el-icon-magic-stick', type: 'generated', generator: 'binaural' }
          ]
        },
        {
          id: 'minecraft',
          name: 'Minecraft Ambience',
          icon: 'el-icon-box',
          sounds: [
            { id: 'minecraft-cave', label: 'Cave Sounds', icon: 'el-icon-moon-night', type: 'file', src: '/assets/audio/bgm/minecraft-cave.mp3' },
            { id: 'minecraft-overworld', label: 'Overworld', icon: 'el-icon-sunny', type: 'file', src: '/assets/audio/bgm/minecraft-overworld.mp3' },
            { id: 'minecraft-nether', label: 'Nether', icon: 'el-icon-hot-water', type: 'file', src: '/assets/audio/bgm/minecraft-nether.mp3' },
            { id: 'minecraft-end', label: 'The End', icon: 'el-icon-moon', type: 'file', src: '/assets/audio/bgm/minecraft-end.mp3' },
            { id: 'minecraft-rain', label: 'Rain', icon: 'el-icon-heavy-rain', type: 'file', src: '/assets/audio/bgm/minecraft-rain.mp3' },
            { id: 'minecraft-creative', label: 'Creative', icon: 'el-icon-picture', type: 'file', src: '/assets/audio/bgm/minecraft-creative.mp3' }
          ]
        }
      ],
      playingSounds: {} // { soundId: { playing: true, volume: 50, node: AudioNode, gainNode: GainNode } }
    }
  },
  computed: {
    fileSounds() {
      return this.categories.flatMap(cat => cat.sounds.filter(s => s.type === 'file'))
    },
    activeSoundCount() {
      return Object.keys(this.playingSounds).length
    }
  },
  mounted() {
    this.loadSettings()
  },
  beforeDestroy() {
    this.stopAllSounds()
    if (this.audioContext) {
      this.audioContext.close()
    }
  },
  methods: {
    // Audio Context initialization
    getAudioContext() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }
      return this.audioContext
    },

    // Check if a sound is playing
    isPlaying(soundId) {
      return !!this.playingSounds[soundId]
    },

    // Toggle sound on/off
    toggleSound(sound) {
      if (this.isPlaying(sound.id)) {
        this.stopSound(sound.id)
      } else {
        this.playSound(sound)
      }
      this.saveSettings()
    },

    // Play a sound
    async playSound(sound) {
      const volume = 50 // Default individual volume

      if (sound.type === 'file') {
        await this.playFileSound(sound, volume)
      } else if (sound.type === 'generated') {
        await this.playGeneratedSound(sound, volume)
      }
    },

    // Play file-based sound
    async playFileSound(sound, volume) {
      const audioRef = this.$refs['audio-' + sound.id]
      if (!audioRef || !audioRef[0]) return

      const audio = audioRef[0]
      audio.volume = this.calculateVolume(volume)

      try {
        await audio.play()
        this.$set(this.playingSounds, sound.id, {
          playing: true,
          volume: volume,
          type: 'file',
          audio: audio
        })
      } catch (e) {
        console.warn('Failed to play sound:', e)
      }
    },

    // Play generated sound (Web Audio API)
    async playGeneratedSound(sound, volume) {
      const ctx = this.getAudioContext()

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      let sourceNode
      const gainNode = ctx.createGain()
      gainNode.gain.value = this.calculateVolume(volume)
      gainNode.connect(ctx.destination)

      switch (sound.generator) {
        case 'white':
          sourceNode = this.createWhiteNoise(ctx)
          break
        case 'pink':
          sourceNode = this.createPinkNoise(ctx)
          break
        case 'brown':
          sourceNode = this.createBrownNoise(ctx)
          break
        case 'sine528':
          sourceNode = this.createSineWave(ctx, 528)
          break
        case 'deepHum':
          sourceNode = this.createSineWave(ctx, 100)
          break
        case 'binaural':
          sourceNode = this.createBinauralBeat(ctx, 200, 210) // 10Hz alpha wave
          break
        default:
          return
      }

      sourceNode.connect(gainNode)
      sourceNode.start()

      this.$set(this.playingSounds, sound.id, {
        playing: true,
        volume: volume,
        type: 'generated',
        node: sourceNode,
        gainNode: gainNode
      })
    },

    // Stop a specific sound
    stopSound(soundId) {
      const soundState = this.playingSounds[soundId]
      if (!soundState) return

      if (soundState.type === 'file' && soundState.audio) {
        soundState.audio.pause()
        soundState.audio.currentTime = 0
      } else if (soundState.type === 'generated') {
        if (soundState.node) {
          try {
            soundState.node.stop()
          } catch (e) {
            // Already stopped
          }
        }
        if (soundState.gainNode) {
          soundState.gainNode.disconnect()
        }
      }

      this.$delete(this.playingSounds, soundId)
    },

    // Stop all sounds
    stopAllSounds() {
      Object.keys(this.playingSounds).forEach(soundId => {
        this.stopSound(soundId)
      })
      this.saveSettings()
    },

    // Calculate actual volume (master * individual)
    calculateVolume(individualVolume) {
      return (this.masterVolume / 100) * (individualVolume / 100)
    },

    // Handle master volume change
    onMasterVolumeChange() {
      Object.keys(this.playingSounds).forEach(soundId => {
        this.onSoundVolumeChange(soundId)
      })
      this.saveSettings()
    },

    // Handle individual sound volume change
    onSoundVolumeChange(soundId) {
      const soundState = this.playingSounds[soundId]
      if (!soundState) return

      const volume = this.calculateVolume(soundState.volume)

      if (soundState.type === 'file' && soundState.audio) {
        soundState.audio.volume = volume
      } else if (soundState.type === 'generated' && soundState.gainNode) {
        soundState.gainNode.gain.value = volume
      }
    },

    // Adjust master volume by delta
    adjustMasterVolume(delta) {
      this.masterVolume = Math.max(0, Math.min(100, this.masterVolume + delta))
      this.onMasterVolumeChange()
    },

    // ===== Web Audio API Generators =====

    // White Noise Generator
    createWhiteNoise(ctx) {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      return source
    },

    // Pink Noise Generator (using Voss-McCartney algorithm approximation)
    createPinkNoise(ctx) {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      return source
    },

    // Brown Noise Generator (Brownian/Red noise)
    createBrownNoise(ctx) {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      let lastOut = 0

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + (0.02 * white)) / 1.02
        lastOut = data[i]
        data[i] *= 3.5 // Normalize
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      return source
    },

    // Sine Wave Generator
    createSineWave(ctx, frequency) {
      const oscillator = ctx.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      return oscillator
    },

    // Binaural Beat Generator (creates two oscillators with slightly different frequencies)
    createBinauralBeat(ctx, baseFreq, targetFreq) {
      const merger = ctx.createChannelMerger(2)

      const leftOsc = ctx.createOscillator()
      leftOsc.type = 'sine'
      leftOsc.frequency.value = baseFreq

      const rightOsc = ctx.createOscillator()
      rightOsc.type = 'sine'
      rightOsc.frequency.value = targetFreq

      const leftGain = ctx.createGain()
      const rightGain = ctx.createGain()
      leftGain.gain.value = 0.5
      rightGain.gain.value = 0.5

      leftOsc.connect(leftGain)
      rightOsc.connect(rightGain)
      leftGain.connect(merger, 0, 0)
      rightGain.connect(merger, 0, 1)

      // Return a wrapper that can start/stop both oscillators
      return {
        connect: (dest) => merger.connect(dest),
        start: () => { leftOsc.start(); rightOsc.start() },
        stop: () => { leftOsc.stop(); rightOsc.stop() }
      }
    },

    // ===== Persistence =====

    saveSettings() {
      const settings = {
        masterVolume: this.masterVolume,
        // Don't persist playing state, only volume preferences
      }
      setStore({ name: STORAGE_KEY, content: settings })
    },

    loadSettings() {
      const settings = getStore({ name: STORAGE_KEY })
      if (settings) {
        this.masterVolume = settings.masterVolume ?? 50
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.white-noise-player {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  background: var(--bg-body);
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-card);
  min-height: 600px;
}

/* Header */
.player-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.player-title {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;

  i {
    margin-right: 8px;
    color: var(--color-primary);
  }
}

.player-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

/* Master Volume */
.master-volume {
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.volume-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;

  i {
    color: var(--color-primary);
  }
}

.volume-slider-container {
  display: flex;
  align-items: center;
  gap: 12px;

  i {
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 16px;

    &:hover {
      color: var(--color-primary);
    }
  }

  .el-slider {
    flex: 1;
  }

  .volume-value {
    min-width: 40px;
    text-align: right;
    font-size: 13px;
    color: var(--text-secondary);
  }
}

/* Active Sounds Bar */
.active-sounds-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-primary-light, rgba(64, 158, 255, 0.1));
  border: 1px solid var(--color-primary);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.active-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
  font-weight: 500;

  i {
    font-size: 18px;
  }
}

/* Sound Category */
.sound-category {
  margin-bottom: 24px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);

  i {
    color: var(--text-secondary);
  }
}

/* Sound Grid */
.sound-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.sound-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  background: var(--bg-card);
  border: 2px solid var(--border-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-card);
  }

  &.is-playing {
    border-color: var(--color-success);
    background: var(--color-success-light, rgba(103, 194, 58, 0.1));

    .sound-icon-wrapper i {
      color: var(--color-success);
    }
  }
}

.sound-icon-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;

  i {
    font-size: 32px;
    color: var(--text-secondary);
    transition: color 0.2s ease;
  }
}

.sound-waves {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 3px;
  align-items: flex-end;
  height: 16px;

  span {
    width: 3px;
    background: var(--color-success);
    border-radius: 2px;
    animation: wave 0.8s ease-in-out infinite;

    &:nth-child(1) {
      height: 8px;
      animation-delay: 0s;
    }
    &:nth-child(2) {
      height: 12px;
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      height: 6px;
      animation-delay: 0.4s;
    }
  }
}

@keyframes wave {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.5);
  }
}

.sound-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
}

.sound-volume {
  width: 100%;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color-light);

  ::v-deep .el-slider {
    .el-slider__runway {
      height: 4px;
    }
    .el-slider__bar {
      height: 4px;
    }
    .el-slider__button {
      width: 12px;
      height: 12px;
    }
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .white-noise-player {
    padding: 16px;
    margin: 0 8px;
    min-height: auto;
  }

  .player-header {
    margin-bottom: 16px;
    padding-bottom: 14px;
  }

  .player-title {
    font-size: 20px;
  }

  .sound-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }

  .sound-card {
    padding: 16px 12px;
  }

  .sound-icon-wrapper i {
    font-size: 28px;
  }

  .sound-label {
    font-size: 12px;
  }

  .active-sounds-bar {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .white-noise-player {
    padding: 12px;
    margin: 0 4px;
  }

  .sound-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .sound-card {
    padding: 14px 8px;
  }

  .sound-icon-wrapper {
    width: 40px;
    height: 40px;
    margin-bottom: 8px;

    i {
      font-size: 24px;
    }
  }

  .sound-label {
    font-size: 11px;
  }
}
</style>
