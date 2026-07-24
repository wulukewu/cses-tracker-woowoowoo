import type { Ref } from 'vue'

const userName: Ref<string | null> = ref(null)

export function useProfileModal() {
  function openProfile(name: string) {
    userName.value = name
  }
  function closeProfile() {
    userName.value = null
  }
  return { profileUserName: userName, openProfile, closeProfile }
}
