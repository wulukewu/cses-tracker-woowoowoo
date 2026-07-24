import { ref } from 'vue'

const userName = ref<string | null>(null)

export function useProfileModal() {
  function openProfile(name: string) {
    userName.value = name
  }
  function closeProfile() {
    userName.value = null
  }
  return { profileUserName: userName, openProfile, closeProfile }
}
