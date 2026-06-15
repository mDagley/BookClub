import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import SuggestModal from '../../components/suggestions/SuggestModal.vue'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../firebase.js', () => ({ db: {}, auth: {} }))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  updateDoc: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../utils/googleBooks.js', () => ({
  fetchBookMetadata: vi.fn(() => Promise.resolve(null)),
  fetchCoverUrl: vi.fn(() => Promise.resolve(null)),
}))

vi.mock('../../composables/useBookSearch.js', () => ({
  useBookSearch: () => ({
    searchResults: [],
    showDropdown: false,
    searching: false,
    highlightedIndex: -1,
    onTitleInput: vi.fn(),
    closeDropdown: vi.fn(),
    onSearchKeydown: vi.fn(() => false),
  }),
}))

vi.mock('../../composables/useMemberProfiles.js', () => ({
  useMemberProfiles: () => ({ resolveName: (n) => n }),
}))

vi.mock('../../stores/auth.js', () => ({
  useAuthStore: () => ({ user: null }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function mountModal(propOverrides = {}) {
  return mount(SuggestModal, {
    global: {
      plugins: [createPinia()],
      stubs: { CoverUpload: { template: '<div class="cover-upload-stub" />' } },
    },
    props: {
      addSuggestion: vi.fn(() => Promise.resolve({ id: 'doc-123' })),
      ...propOverrides,
    },
    attachTo: document.body,
  })
}

async function fillForm(wrapper, overrides = {}) {
  const fields = {
    title: 'Dune',
    author: 'Frank Herbert',
    description: 'A science fiction epic set on the desert planet Arrakis.',
    name: 'Reader',
    ...overrides,
  }
  if (fields.title !== undefined)  await wrapper.find('#s-title').setValue(fields.title)
  if (fields.author !== undefined) await wrapper.find('#s-author').setValue(fields.author)
  if (fields.description !== undefined) await wrapper.find('#s-desc').setValue(fields.description)
  if (fields.name !== undefined)   await wrapper.find('#s-name').setValue(fields.name)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SuggestModal', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('rendering', () => {
    it('shows all required form fields', () => {
      wrapper = mountModal()
      expect(wrapper.find('#s-title').exists()).toBe(true)
      expect(wrapper.find('#s-author').exists()).toBe(true)
      expect(wrapper.find('#s-desc').exists()).toBe(true)
      expect(wrapper.find('#s-name').exists()).toBe(true)
    })

    it('shows the Submit Suggestion button', () => {
      wrapper = mountModal()
      expect(wrapper.find('button[type="submit"]').text()).toContain('Submit Suggestion')
    })
  })

  describe('close behavior', () => {
    it('emits close when the ✕ button is clicked', async () => {
      wrapper = mountModal()
      await wrapper.find('.close-btn').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits close when the Cancel button is clicked', async () => {
      wrapper = mountModal()
      const cancel = wrapper.findAll('button[type="button"]').find(b => b.text() === 'Cancel')
      await cancel.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('form validation', () => {
    it('shows an error and does not call addSuggestion when title is missing', async () => {
      const addSuggestion = vi.fn()
      wrapper = mountModal({ addSuggestion })
      await fillForm(wrapper, { title: '' })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('.form-error').exists()).toBe(true)
      expect(addSuggestion).not.toHaveBeenCalled()
    })

    it('shows an error when description is missing', async () => {
      wrapper = mountModal()
      await fillForm(wrapper, { description: '' })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('.form-error').exists()).toBe(true)
    })

    it('shows an error when suggestedBy name is missing', async () => {
      wrapper = mountModal()
      await fillForm(wrapper, { name: '' })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('.form-error').exists()).toBe(true)
    })
  })

  describe('successful submission', () => {
    it('emits submitted after a successful submit', async () => {
      wrapper = mountModal()
      await fillForm(wrapper)
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(wrapper.emitted('submitted')).toBeTruthy()
    })

    it('calls addSuggestion with trimmed form values', async () => {
      const addSuggestion = vi.fn(() => Promise.resolve({ id: 'doc-456' }))
      wrapper = mountModal({ addSuggestion })
      await fillForm(wrapper, { title: '  Dune  ', author: '  Frank Herbert  ' })
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(addSuggestion).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Dune', author: 'Frank Herbert' })
      )
    })

    it('does not emit submitted and shows an error when addSuggestion throws', async () => {
      const addSuggestion = vi.fn(() => Promise.reject(new Error('Firestore error')))
      wrapper = mountModal({ addSuggestion })
      await fillForm(wrapper)
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(wrapper.emitted('submitted')).toBeFalsy()
      expect(wrapper.find('.form-error').exists()).toBe(true)
    })
  })
})
