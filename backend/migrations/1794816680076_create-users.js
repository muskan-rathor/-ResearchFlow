
/**
 * Create users table
 */

export const up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "UUID",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    name: {
      type: "VARCHAR(100)",
      notNull: true,
    },

    email: {
      type: "VARCHAR(255)",
      notNull: true,
      unique: true,
    },

    password_hash: {
      type: "TEXT",
      notNull: true,
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
};

export const down = (pgm) => {
  pgm.dropTable("users");
};
