export function getCurrentUserId(): string | null {
  return localStorage.getItem("auth_user");
}

export function requireAuth(): boolean {
  return !!getCurrentUserId();
}

export function signOut() {
  localStorage.removeItem("auth_user");
}
