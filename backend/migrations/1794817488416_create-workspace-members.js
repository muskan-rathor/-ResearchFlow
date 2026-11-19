
export const up = (pgm) => {
  pgm.createTable("workspace_members", {
    workspace_id: {
      type: "UUID",
      notNull: true,
      references: "workspaces",
      onDelete: "CASCADE",
    },

    user_id: {
      type: "UUID",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },

    role: {
      type: "VARCHAR(20)",
      notNull: true,
      default: "editor",
    },

    joined_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.addConstraint("workspace_members", "workspace_members_pkey", {
    primaryKey: ["workspace_id", "user_id"],
  });
};

export const down = (pgm) => {
  pgm.dropTable("workspace_members");
};
