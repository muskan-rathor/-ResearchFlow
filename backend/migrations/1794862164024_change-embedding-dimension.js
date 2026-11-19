
export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE paper_chunks
    ALTER COLUMN embedding TYPE vector(384)
    USING NULL::vector(384);
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE paper_chunks
    ALTER COLUMN embedding TYPE vector(1536)
    USING NULL::vector(1536);
  `);
};
