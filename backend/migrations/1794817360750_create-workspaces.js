
export const up = (pgm) => {
  pgm.createTable("workspaces", {
    id: {
      type: "UUID",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    name: {
      type: "VARCHAR(150)",
      notNull: true,
    },

    description: {
      type: "TEXT",
    },

    created_by: {
      type: "UUID",
      notNull: true,
      references: "users",
      onDelete: "RESTRICT",
    },

    created_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },

    updated_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("workspaces", "created_by");
};

export const down = (pgm) => {
  pgm.dropTable("workspaces");
};
