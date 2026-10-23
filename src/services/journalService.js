import { supabase } from '../lib/supabaseClient';

/**
 * Service untuk memposting transaksi jurnal double-entry ke Supabase.
 * Menjamin 1 baris di `journal_entries` dan minimal 2 baris seimbang di `journal_lines`.
 */
export async function postDoubleEntryJournal({
  entryNumber,
  entryDate,
  description,
  sourceType = 'MANUAL',
  sourceRef = '',
  lines = [],
  userId = null
}) {
  // 1. Validasi Matematis Zero-Sum di sisi klien
  if (!lines || lines.length < 2) {
    throw new Error('Jurnal wajib memiliki minimal 2 baris (1 Debit dan 1 Kredit).');
  }

  const totalDebit = lines.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  const selisih = Math.abs(totalDebit - totalCredit);

  if (selisih > 0.001 || totalDebit <= 0) {
    throw new Error(
      `Jurnal TIDAK SEIMBANG! Total Debit (Rp ${totalDebit.toLocaleString('id-ID')}) != Total Kredit (Rp ${totalCredit.toLocaleString('id-ID')}). Selisih: Rp ${selisih.toLocaleString('id-ID')}`
    );
  }

  // 2. Upayakan penyimpanan atomik menggunakan Stored Procedure / RPC PostgreSQL di Supabase
  try {
    const { data: rpcId, error: rpcError } = await supabase.rpc('create_complete_journal_entry', {
      p_entry_number: entryNumber,
      p_entry_date: entryDate,
      p_description: description,
      p_source_type: sourceType,
      p_source_ref: sourceRef || null,
      p_lines: lines.map((l) => ({
        account_id: l.account_id,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        memo: l.memo || description
      }))
    });

    if (!rpcError && rpcId) {
      return { success: true, journalId: rpcId };
    }
    if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('does not exist')) {
      // Jika error validasi dari trigger di DB (misal periode tutup / trigger balance)
      throw new Error(rpcError.message);
    }
  } catch (rpcErr) {
    if (!rpcErr.message.includes('does not exist')) {
      throw rpcErr;
    }
    console.warn('RPC create_complete_journal_entry belum terpasang di Supabase, beralih ke direct transactional insert.');
  }

  // 3. Fallback Direct Transactional Insert (Header -> Lines)
  // Step A: Insert Header ke journal_entries
  const { data: header, error: headerError } = await supabase
    .from('journal_entries')
    .insert({
      entry_number: entryNumber,
      entry_date: entryDate,
      description: description,
      source_type: sourceType,
      source_ref: sourceRef || null,
      status: 'POSTED',
      created_by: userId || null
    })
    .select('id')
    .single();

  if (headerError) {
    throw new Error(`Gagal menyimpan header jurnal: ${headerError.message}`);
  }

  // Step B: Insert Lines ke journal_lines
  const payloadLines = lines.map((line, idx) => ({
    journal_id: header.id,
    account_id: line.account_id,
    debit: Number(line.debit) || 0,
    credit: Number(line.credit) || 0,
    memo: line.memo || description,
    line_order: idx + 1
  }));

  const { error: linesError } = await supabase
    .from('journal_lines')
    .insert(payloadLines);

  if (linesError) {
    // Rollback header jika detail gagal (menghindari orphan journal)
    await supabase.from('journal_entries').delete().eq('id', header.id);
    throw new Error(`Gagal menyimpan baris jurnal detail: ${linesError.message}`);
  }

  return { success: true, journalId: header.id };
}
