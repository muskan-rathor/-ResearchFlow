
export const up = (pgm) => {
  pgm.addColumn("paper_chunks", {
    embedding: {
      type: "vector(1536)",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("paper_chunks", "embedding");
};
