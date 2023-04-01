declare const VM: { 
    shortcut: {
        register: (key: string, callback: () => void, options?: Partial<IShortcutOptions>) => () => void;
    }
};