
CREATE POLICY "Users delete own sent messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Users delete received messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = recipient_id);
