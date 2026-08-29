-- Enable pgvector, used to store career profile embeddings for retrieval.
--
-- Written by hand rather than via Prisma's `postgresqlExtensions` preview
-- feature: the vector columns and their HNSW indexes need hand-written SQL
-- anyway, so the preview flag would not save an edit.
CREATE EXTENSION IF NOT EXISTS vector;
