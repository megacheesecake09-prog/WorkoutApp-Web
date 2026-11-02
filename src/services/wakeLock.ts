// Screen Wake Lock API to prevent mobile browsers from sleeping during workouts

class WakeLockService {
  private sentinel: any = null;

  async requestLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      this.sentinel = await (navigator as any).wakeLock.request('screen');
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }

  releaseLock() {
    if (this.sentinel) {
      try {
        this.sentinel.release();
      } catch {}
      this.sentinel = null;
    }
  }
}

export const wakeLock = new WakeLockService();
