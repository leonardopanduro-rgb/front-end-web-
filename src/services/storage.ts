const getStore = () => window.sessionStorage;

export const storage = {
  async getItem(key: string): Promise<string | null> {
    return getStore().getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    getStore().setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    getStore().removeItem(key);
  },
};
