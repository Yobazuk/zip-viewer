declare global {
  interface Window {
    bizAPI: {
      copyText: (text: string) => void;
    };
  }
}

export {};

