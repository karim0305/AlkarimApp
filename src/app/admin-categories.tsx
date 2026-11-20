import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@/hooks/useQuery';
import { useConfirm, useToast } from '@/context/toast';
import { deleteCategory, listCategories, saveCategory } from '@/services/analytics';
import { Button, Card, Empty, ErrorBox, Field, Loading, Row, Screen, Txt } from '@/components/ui';

export default function AdminCategories() {
  const q = useQuery(listCategories); const confirm = useConfirm(); const toast = useToast();
  const [name, setName] = useState(''); const [editing, setEditing] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try { await saveCategory(name.trim(), editing ?? undefined); toast(editing ? 'Category updated.' : 'Category added.'); setName(''); setEditing(null); } catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };
  const del = async (id: string, n: string) => {
    if (!(await confirm({ title: `Delete “${n}”?`, message: 'Only empty categories can be deleted.', confirmLabel: 'Delete', danger: true }))) return;
    try { await deleteCategory(id); toast('Category deleted.', 'info'); } catch (x) { toast((x as Error).message, 'error'); }
  };
  return (
    <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
      <Card>
        <Txt v="h3">{editing ? 'Rename category' : 'Add category'}</Txt>
        <Field value={name} onChangeText={setName} placeholder="e.g. Sherwanis" autoCapitalize="words" />
        <Row style={{ gap: 8 }}><Button title={editing ? 'Save changes' : 'Add category'} loading={busy} onPress={submit} style={{ flex: 1 }} />{editing && <Button title="Cancel" variant="outline" onPress={() => { setEditing(null); setName(''); }} />}</Row>
      </Card>
      {(q.data ?? []).length === 0 ? <Empty title="No categories" /> : (q.data ?? []).map((c) => (
        <Card key={c.id}><Row style={{ justifyContent: 'space-between' }}><View style={{ flex: 1 }}><Txt v="h3">{c.name}</Txt><Txt v="small">{c.product_count} products</Txt></View><Button title="Edit" variant="outline" small onPress={() => { setEditing(c.id); setName(c.name); }} /><Button title="Delete" variant="outline" small onPress={() => del(c.id, c.name)} /></Row></Card>
      ))}
    </Screen>
  );
}
