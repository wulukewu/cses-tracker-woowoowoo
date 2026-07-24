export function useProfileModal() {
  const userName = useState<string | null>('profile-modal-user', () => null)

  function openProfile(name: string) {
    userName.value = name
  }
  function closeProfile() {
    userName.value = null
  }
  return { profileUserName: userName, openProfile, closeProfile }
}
