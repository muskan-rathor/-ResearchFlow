
export const up = (pgm) => {
  pgm.createTable("papers", {
    id: {
      type: "UUID",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    workspace_id: {
      type: "UUID",
      notNull: true,
      references: "workspaces",
      onDelete: "CASCADE",
    },

    title: {
      type: "TEXT",
      notNull: true,
    },

    authors: {
      type: "TEXT",
    },

    abstract: {
      type: "TEXT",
    },

    original_filename: {
      type: "TEXT",
      notNull: true,
    },

    file_path: {
      type: "TEXT",
      notNull: true,
    },

    created_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("papers", "workspace_id");
};

export const down = (pgm) => {
  pgm.dropTable("papers");
};
