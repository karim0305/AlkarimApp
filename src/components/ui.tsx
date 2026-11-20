import React, { useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, View, type KeyboardTypeOptions, type StyleProp, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '@/lib/theme';
import { COLOR_HEX } from '@/lib/colors';

type Icon = keyof typeof Ionicons.glyphMap;

/* ---------------- text ---------------- */
type V = 'title' | 'h2' | 'h3' | 'body' | 'small' | 'tiny' | 'label';
const VS: Record<V, TextStyle> = {
  title: { fontSize: 26, fontWeight: '800', color: C.indigoDark },
  h2: { fontSize: 20, fontWeight: '700', color: C.indigoDark },
  h3: { fontSize: 16, fontWeight: '700', color: C.indigoDark },
  body: { fontSize: 15, color: C.text, lineHeight: 21 },
  small: { fontSize: 13, color: C.muted, lineHeight: 18 },
  tiny: { fontSize: 11, color: C.muted },
  label: { fontSize: 13, fontWeight: '600', color: '#334155' },
};
export function Txt({ v = 'body', color, bold, center, style, ...rest }: TextProps & { v?: V; color?: string; bold?: boolean; center?: boolean }) {
  return <Text {...rest} style={[VS[v], color ? { color } : null, bold ? { fontWeight: '700' } : null, center ? { textAlign: 'center' } : null, style]} />;
}

/* ---------------- buttons ---------------- */
type BV = 'primary' | 'gold' | 'outline' | 'danger' | 'ghost';
const BG: Record<BV, { bg: string; fg: string; border?: string }> = {
  primary: { bg: C.indigo, fg: C.white }, gold: { bg: C.gold, fg: C.indigoDark }, danger: { bg: C.crimson, fg: C.white },
  outline: { bg: C.white, fg: C.indigo, border: C.line }, ghost: { bg: 'transparent', fg: C.indigo },
};
export function Button({ title, onPress, variant = 'primary', small, disabled, loading, icon, style }: {
  title: string; onPress?: () => void; variant?: BV; small?: boolean; disabled?: boolean; loading?: boolean; icon?: Icon; style?: StyleProp<ViewStyle>;
}) {
  const g = BG[variant]; const off = disabled || loading;
  return (
    <Pressable onPress={off ? undefined : onPress} accessibilityRole="button" accessibilityState={{ disabled: !!off }}
      style={({ pressed }) => [s.btn, small && s.btnSm, { backgroundColor: g.bg, borderColor: g.border ?? g.bg, opacity: off ? 0.5 : pressed ? 0.85 : 1 }, style]}>
      {loading ? <ActivityIndicator size="small" color={g.fg} /> : icon ? <Ionicons name={icon} size={small ? 14 : 17} color={g.fg} /> : null}
      <Text style={{ color: g.fg, fontWeight: '700', fontSize: small ? 12.5 : 15 }}>{title}</Text>
    </Pressable>
  );
}

/* ---------------- layout ---------------- */
export const Card = ({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) =>
  onPress
    ? <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.card, style, pressed && { opacity: 0.85 }]}>{children}</Pressable>
    : <View style={[s.card, style]}>{children}</View>;
export const Row = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>{children}</View>;
export const Divider = () => <View style={{ height: 1, backgroundColor: C.line }} />;
export function KV({ k, v, bold, color }: { k: string; v: string; bold?: boolean; color?: string }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Txt v="small" style={{ flexShrink: 1 }}>{k}</Txt><Txt v="body" bold={bold} color={color} style={{ flexShrink: 1, textAlign: 'right' }}>{v}</Txt></View>;
}
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}><Txt v="h2">{title}</Txt>{action ? <Pressable onPress={onAction} hitSlop={8}><Txt v="small" color={C.crimson} bold>{action}</Txt></Pressable> : null}</View>;
}

/** Scrolling page with pull-to-refresh and keyboard-friendly taps. */
export function Screen({ children, onRefresh, refreshing, style, padded = true }: { children: ReactNode; onRefresh?: () => void; refreshing?: boolean; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[padded && { padding: 16, gap: 14 }, style]} style={{ flex: 1, backgroundColor: C.surface }}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.indigo} /> : undefined}>
      {children}
    </ScrollView>
  );
}

/* ---------------- form ---------------- */
export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, secure, error, hint, maxLength, autoCapitalize, editable = true, prefix, autoFocus }: {
  label?: string; value: string; onChangeText?: (t: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: KeyboardTypeOptions; secure?: boolean;
  error?: string; hint?: string; maxLength?: number; autoCapitalize?: 'none' | 'sentences' | 'words'; editable?: boolean; prefix?: string; autoFocus?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Txt v="label">{label}</Txt> : null}
      <View style={[s.inputWrap, error ? { borderColor: C.crimson } : null, !editable && { backgroundColor: '#F1F5F9' }]}>
        {prefix ? <Text style={s.prefix}>{prefix}</Text> : null}
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.faint} multiline={multiline} secureTextEntry={secure}
          keyboardType={keyboardType} maxLength={maxLength} autoCapitalize={autoCapitalize ?? (secure || keyboardType === 'email-address' ? 'none' : 'sentences')} editable={editable} autoFocus={autoFocus}
          autoCorrect={false} style={[s.input, multiline && { minHeight: 76, textAlignVertical: 'top' }]} />
      </View>
      {error ? <Txt v="tiny" color={C.crimson}>{error}</Txt> : hint ? <Txt v="tiny">{hint}</Txt> : null}
    </View>
  );
}

export function Select<T extends string>({ label, value, onChange, options, placeholder = 'Select…' }: { label?: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Txt v="label">{label}</Txt> : null}
      <Pressable onPress={() => setOpen(true)} style={[s.inputWrap, { justifyContent: 'space-between', paddingVertical: 13 }]} accessibilityRole="button">
        <Text style={{ color: cur ? C.text : C.faint, fontSize: 15, flex: 1 }} numberOfLines={1}>{cur ? cur.label : placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={C.muted} />
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label ?? 'Choose'}>
        {options.map((o) => (
          <Pressable key={o.value} onPress={() => { onChange(o.value); setOpen(false); }} style={s.optRow}>
            <Text style={{ fontSize: 15, color: C.text, flex: 1 }}>{o.label}</Text>
            {o.value === value ? <Ionicons name="checkmark" size={20} color={C.indigo} /> : null}
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}

export function Chip({ label, selected, onPress, dot }: { label: string; selected?: boolean; onPress?: () => void; dot?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityState={{ selected: !!selected }} style={[s.chip, selected && { backgroundColor: C.indigo, borderColor: C.indigo }]}>
      {dot ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: dot, borderWidth: 1, borderColor: '#CBD5E1' }} /> : null}
      <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? C.white : '#334155' }}>{label}</Text>
    </Pressable>
  );
}
export const ChipRow = ({ children }: { children: ReactNode }) => <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>{children}</ScrollView>;
export const ChipWrap = ({ children }: { children: ReactNode }) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={[s.box, checked && { backgroundColor: C.indigo, borderColor: C.indigo }]}>{checked ? <Ionicons name="checkmark" size={16} color={C.white} /> : null}</View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

/* ---------------- sheet (bottom modal) ---------------- */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={s.sheet}>
          <View style={s.sheetHead}><Txt v="h3" style={{ flex: 1 }}>{title}</Txt><Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close"><Ionicons name="close" size={24} color={C.muted} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ---------------- status badges ---------------- */
const BADGES: Record<string, [string, string, string]> = {
  pending: ['#FFFBEB', '#B45309', 'Pending'], referred: ['#FFF7ED', '#C2410C', 'Referred'], confirmed: ['#F0F9FF', '#0369A1', 'Confirmed'],
  processing: [C.indigo50, C.indigo, 'Processing'], shipped: ['#F5F3FF', '#6D28D9', 'Shipped'], delivered: [C.green50, C.green, 'Delivered'],
  cancelled: [C.crimson50, C.crimson, 'Cancelled'], active: [C.green50, C.green, 'Active'], inactive: ['#F1F5F9', '#475569', 'Inactive'],
  rejected: [C.crimson50, C.crimson, 'Rejected'], received: [C.green50, C.green, 'Received'], not_received: ['#FFFBEB', '#B45309', 'Not received'],
};
export function Badge({ status }: { status: string }) {
  const [bg, fg, label] = BADGES[status] ?? ['#F1F5F9', '#475569', status];
  return <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' }}><Text style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{label}</Text></View>;
}

/* ---------------- stars ---------------- */
export function Stars({ value, size = 15 }: { value: number; size?: number }) {
  const r = Math.round(value);
  return <View style={{ flexDirection: 'row', gap: 1 }} accessibilityLabel={`${value.toFixed(1)} out of 5 stars`}>{[1, 2, 3, 4, 5].map((i) => <Ionicons key={i} name={i <= r ? 'star' : 'star-outline'} size={size} color={i <= r ? C.gold : '#CBD5E1'} />)}</View>;
}
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <View style={{ flexDirection: 'row', gap: 6 }}>{[1, 2, 3, 4, 5].map((i) => <Pressable key={i} onPress={() => onChange(i)} hitSlop={4} accessibilityLabel={`${i} stars`}><Ionicons name={i <= value ? 'star' : 'star-outline'} size={32} color={i <= value ? C.gold : '#CBD5E1'} /></Pressable>)}</View>;
}

/* ---------------- states ---------------- */
export function Loading({ full }: { full?: boolean }) { return <View style={[{ padding: 32, alignItems: 'center' }, full && { flex: 1, justifyContent: 'center', backgroundColor: C.surface }]}><ActivityIndicator color={C.indigo} size="large" /></View>; }
export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return <View style={{ alignItems: 'center', padding: 28, gap: 8 }}><View style={s.emptyIcon}><Ionicons name="shirt-outline" size={26} color={C.indigo} /></View><Txt v="h3" center>{title}</Txt>{text ? <Txt v="small" center>{text}</Txt> : null}{action}</View>;
}
export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return <View style={{ alignItems: 'center', padding: 28, gap: 8 }}><Ionicons name="alert-circle" size={34} color={C.crimson} /><Txt v="h3" center>We couldn’t load this</Txt><Txt v="small" center>{message}</Txt>{retry ? <Button title="Try again" variant="outline" small onPress={retry} /> : null}</View>;
}
export function StatCard({ label, value, hint, tone = C.indigo }: { label: string; value: string | number; hint?: string; tone?: string }) {
  return <View style={[s.card, { flex: 1, minWidth: '46%', padding: 14, gap: 2 }]}><Txt v="small">{label}</Txt><Text style={{ fontSize: 21, fontWeight: '800', color: tone }}>{value}</Text>{hint ? <Txt v="tiny">{hint}</Txt> : null}</View>;
}
export const Grid = ({ children }: { children: ReactNode }) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{children}</View>;

/* ---------------- product picture ---------------- */
export function ProductImage({ uri, colors, ratio = 0.8, style }: { uri?: string; colors: string[]; ratio?: number; style?: StyleProp<ViewStyle> }) {
  if (uri) return <Image source={{ uri }} style={[{ width: '100%', aspectRatio: ratio, backgroundColor: C.surface }, style as object]} resizeMode="cover" />;
  const base = COLOR_HEX[colors[0]] ?? C.indigo;
  return <View style={[{ width: '100%', aspectRatio: ratio, backgroundColor: base + '33', alignItems: 'center', justifyContent: 'center' }, style]}><Ionicons name="shirt" size={44} color={base} /></View>;
}

const s = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 18, borderRadius: R.md, borderWidth: 1 },
  btnSm: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: R.sm },
  card: { backgroundColor: C.white, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 14, gap: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 11 },
  prefix: { fontSize: 15, fontWeight: '700', color: '#475569', marginRight: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.white },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.line },
  optRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.indigo50, alignItems: 'center', justifyContent: 'center' },
});
