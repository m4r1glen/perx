
CREATE POLICY "provider_logos_read_authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'provider-logos');

CREATE POLICY "provider_logos_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'provider-logos' AND owner = auth.uid());

CREATE POLICY "provider_logos_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'provider-logos' AND owner = auth.uid());

CREATE POLICY "provider_logos_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'provider-logos' AND owner = auth.uid());
