declare global {
  interface Window {
    addRecentSearch?: (query: string) => void
  }
}

export {}
