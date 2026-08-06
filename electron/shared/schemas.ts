import * as v from 'valibot';

export const messageBoxOptionsSchema = v.object({
  type: v.picklist(['info', 'warning', 'error', 'question']),
  title: v.string(),
  message: v.string(),
});

export type MessageBoxOptions = v.InferOutput<typeof messageBoxOptionsSchema>;

export const updaterStatusSchema = v.variant('state', [
  v.object({ state: v.literal('checking-for-update') }),
  v.object({ state: v.literal('update-available'), version: v.string() }),
  v.object({ state: v.literal('update-not-available') }),
  v.object({ state: v.literal('downloading'), percent: v.number() }),
  v.object({ state: v.literal('update-downloaded'), version: v.string() }),
  v.object({ state: v.literal('error'), message: v.string() }),
]);

export type UpdaterStatus = v.InferOutput<typeof updaterStatusSchema>;
