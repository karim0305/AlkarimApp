import React, { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/lib/theme';

type Kind = 'success' | 'error' | 'info';
interface ConfirmOpts { title: string; message: string; confirmLabel?: string; danger?: boolean }
interface Ctx { toast: (text: string, kind?: Kind) => void; confirm: (o: ConfirmOpts) => Promise<boolean> }
const NoopCtx: Ctx = { toast: () => {}, confirm: async () => false };
const ToastCtx = createContext<Ctx>(NoopCtx);
export const useToast = () => useContext(ToastCtx).toast;
export const useConfirm = () => useContext(ToastCtx).confirm;

/** Messages appear at the top centre, like on the website. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<{ id: number; text: string; kind: Kind }[]>([]);
  const seq = useRef(0);
  const toast = useCallback((text: string, kind: Kind = 'success') => {
    const id = ++seq.current;
    setItems((t) => [...t, { id, text, kind }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => {
    Alert.alert(o.title, o.message, [
      { text: 'Keep it', style: 'cancel', onPress: () => resolve(false) },
      { text: o.confirmLabel ?? 'Confirm', style: o.danger ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  }), []);
  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);
  const icon = { success: ['checkmark-circle', '#16A34A'], error: ['alert-circle', C.crimson], info: ['information-circle', C.indigo] } as const;
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }]}>
        {items.map((t) => (
          <Pressable key={t.id} onPress={() => setItems((x) => x.filter((y) => y.id !== t.id))} style={styles.toast} accessibilityRole="alert">
            <Ionicons name={icon[t.kind][0]} size={20} color={icon[t.kind][1]} />
            <Text style={styles.text}>{t.text}</Text>
          </Pressable>
        ))}
      </View>
    </ToastCtx.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center', gap: 8, zIndex: 100 },
  toast: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 14, maxWidth: 520, width: '100%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  text: { flex: 1, color: C.text, fontSize: 14, lineHeight: 20 },
});
