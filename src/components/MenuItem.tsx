import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Row, Txt } from './ui';
import { C } from '@/lib/theme';

export function MenuItem({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={{ paddingVertical: 12 }}><Row><Ionicons name={icon} size={22} color={C.indigo} /><Txt style={{ flex: 1 }}>{label}</Txt><Ionicons name="chevron-forward" size={18} color={C.faint} /></Row></Pressable>;
}
