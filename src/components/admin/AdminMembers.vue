<template>
  <div class="admin-members">
    <div class="section-header">
      <h2 class="section-heading">Member Profiles</h2>
    </div>

    <p class="section-note">
      Map each family member's display name to their Discord handle.
      Used to show recognizable names on "already read" badges throughout the app.
    </p>

    <div v-if="loading" class="loading-state">Loading…</div>

    <div v-else class="profiles-list">
      <div
        v-for="(profile, i) in profiles"
        :key="i"
        class="profile-row"
      >
        <input
          v-model="profile.name"
          class="form-input"
          placeholder="Display name (e.g. Melissa)"
          @blur="save"
        />
        <span class="separator">→</span>
        <div class="handle-wrap">
          <span class="at">@</span>
          <input
            v-model="profile.handle"
            class="form-input"
            placeholder="Discord handle"
            @blur="save"
          />
        </div>
        <button class="btn-icon btn-delete" title="Remove" @click="remove(i)">✕</button>
      </div>

      <button class="btn btn-add" @click="addRow">+ Add member</button>
    </div>

    <p v-if="saveMessage" class="save-message" :class="saveMessageType">{{ saveMessage }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { useConfig } from '../../composables/useConfig.js'

const { memberProfiles, loading } = useConfig()

const profiles = ref([])
const saveMessage = ref('')
const saveMessageType = ref('success')

watch(memberProfiles, (val) => {
  profiles.value = val.map(p => ({ ...p }))
}, { immediate: true })

function addRow() {
  profiles.value.push({ name: '', handle: '' })
}

function remove(i) {
  profiles.value.splice(i, 1)
  save()
}

async function save() {
  try {
    const clean = profiles.value
      .filter(p => p.name.trim() || p.handle.trim())
      .map(p => ({ name: p.name.trim(), handle: p.handle.trim().replace(/^@/, '') }))
    await updateDoc(doc(db, 'config', 'main'), { memberProfiles: clean })
    showMessage('Saved!')
  } catch (err) {
    showMessage('Save failed: ' + (err.message || 'Unknown error'), 'error')
  }
}

function showMessage(msg, type = 'success') {
  saveMessage.value = msg
  saveMessageType.value = type
  setTimeout(() => { saveMessage.value = '' }, 3000)
}
</script>

<style scoped>
.admin-members { display: flex; flex-direction: column; gap: 1rem; }

.section-header { display: flex; align-items: center; justify-content: space-between; }

.section-heading {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  color: var(--text-primary);
  margin: 0;
}

.section-note {
  font-family: var(--font-sans);
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0;
}

.loading-state { color: var(--text-muted); font-style: italic; }

.profiles-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-input {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  padding: 0.4rem 0.6rem;
  flex: 1;
  min-width: 0;
  transition: border-color 0.15s;
}

.form-input:focus { outline: none; border-color: var(--border-hover); }

.separator {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--text-dim);
  flex-shrink: 0;
}

.handle-wrap {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding-left: 0.5rem;
  transition: border-color 0.15s;
}

.handle-wrap:focus-within { border-color: var(--border-hover); }

.at {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.handle-wrap .form-input {
  border: none;
  background: transparent;
  padding-left: 0.2rem;
}

.handle-wrap .form-input:focus { outline: none; }

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.25rem;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.btn-delete:hover { color: #f28b82; }

.btn-add {
  background: transparent;
  border: 1px dashed var(--border-hover);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.82rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  text-align: left;
  margin-top: 0.25rem;
  transition: border-color 0.15s, color 0.15s;
}

.btn-add:hover { border-color: var(--gold); color: var(--gold); }

.save-message {
  font-size: 0.82rem;
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-sm);
}

.save-message.success {
  color: #6fcf97;
  background: rgba(111, 207, 151, 0.1);
  border: 1px solid rgba(111, 207, 151, 0.3);
}

.save-message.error {
  color: #f28b82;
  background: rgba(242, 139, 130, 0.1);
  border: 1px solid rgba(242, 139, 130, 0.3);
}
</style>
