
export function setSessionCookie(user, days = 3) {
  const { password, message, ...userData } = user; // 🛡️ eliminăm parola
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; path=/; expires=${expires}; SameSite=Lax`;
}


export function getCookie(name) {
    const value = document.cookie.split("; ").find(row => row.startsWith(name + "="));
    return value ? value.split("=")[1] : null;
}

export function getUserFromCookie() {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find(row => row.startsWith("user="));
    
  if (!match) return null;

  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1]));
  } catch {
    return null;
  }
}


export function removeCookie(name) {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
}
