
export const up = (pgm) => {
  pgm.createTable("paper_chunks", {
    id: {
      type: "UUID",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    paper_id: {
      type: "UUID",
      notNull: true,
      references: '"papers"',
      onDelete: "CASCADE",
    },
    chunk_index: {
      type: "INTEGER",
      notNull: true,
    },
    content: {
      type: "TEXT",
      notNull: true,
    },
    created_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addConstraint("paper_chunks", "unique_paper_chunk", {
    unique: ["paper_id", "chunk_index"],
  });

  pgm.createIndex("paper_chunks", "paper_id");
};

export const down = (pgm) => {
  pgm.dropTable("paper_chunks");
};
